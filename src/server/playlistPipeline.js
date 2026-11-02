// src/server/playlistPipeline.js
// Pipeline complet de génération MoodWave, utilisé par le serveur Express ET par le script d'évaluation.
//
//   profil + humeur + activité + météo
//        │
//        ▼  (1) computeAudioTargets          -> vecteur audio cible
//        ▼  (2) buildCandidatePool           -> ~150 candidats pertinents (artiste, genre, genres voisins, ambiance)
//        ▼  (3) Gemini (sortie JSON contrainte) -> 25 identifiants choisis + justification par titre
//        ▼  (4) rankTracksFromDataset        -> classement final sur tout le catalogue (bonus pour les choix de l'IA)

import { Type } from "@google/genai";
import {
  normalizeText,
  splitArtists,
  resolveGenreFamily,
  isFavoriteGenreTrack,
  isRelatedGenreTrack,
  displayGenre,
  computeAudioTargets,
  rankingDistance,
} from "../data/moodwaveRules.js";
import { rankTracksFromDataset } from "../data/recommender.js";

const fmt = (v) => Number(v).toFixed(2);

/** Pré-sélection des candidats envoyés à l'IA (le LLM ne voit jamais les 80 000 titres). */
export function buildCandidatePool({ catalog, family, favoriteArtist, targets, contextGenres }) {
  const artistKey = normalizeText(favoriteArtist);
  const hasArtist = artistKey.length > 1 && !artistKey.includes("pas de pref") && !artistKey.includes("aucun");
  const isArtistTrack = (t) => hasArtist && splitArtists(t.artists).includes(artistKey);
  const withDistance = (tracks) =>
    tracks.map((t) => ({ t, d: rankingDistance(t, targets) })).sort((a, b) => a.d - b.d).map((x) => x.t);

  const artistTracks = withDistance(catalog.filter(isArtistTrack));
  const genreTracks = family
    ? withDistance(catalog.filter((t) => !isArtistTrack(t) && isFavoriteGenreTrack(t, family)))
    : [];
  const relatedTracks = withDistance(
    catalog.filter((t) => !isArtistTrack(t) && isRelatedGenreTrack(t, family, contextGenres))
  );

  const pool = [];
  const seen = new Set();
  const push = (tracks, limit, tag) => {
    let added = 0;
    for (const t of tracks) {
      if (added >= limit) break;
      if (seen.has(t.track_id)) continue;
      seen.add(t.track_id);
      pool.push({ ...t, tag });
      added += 1;
    }
  };

  push(artistTracks, 20, "ARTISTE");
  push(genreTracks, family ? 120 : 0, "GENRE");
  push(relatedTracks, 20, "PROCHE");
  if (!family || pool.length < 60) {
    push(withDistance(catalog), 150 - pool.length, "AMBIANCE");
  }

  return {
    pool,
    requiredArtistTracks: Math.min(5, artistTracks.length),
    genreAvailable: genreTracks.length,
  };
}

export const GEMINI_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    playlist_title: { type: Type.STRING, description: "Titre créatif, moderne et adapté" },
    playlist_description: { type: Type.STRING, description: "Description courte en français" },
    ai_reasoning: { type: Type.STRING, description: "Comment le genre/artiste favori a été adapté à l'humeur et à l'activité" },
    vibe_keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 à 5 mots-clés d'ambiance" },
    selection: {
      type: Type.ARRAY,
      description: "Exactement 25 titres choisis dans la liste, dans l'ordre d'écoute",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Identifiant du candidat, ex : T12" },
          reason: { type: Type.STRING },
        },
        required: ["id", "reason"],
      },
    },
  },
  required: ["playlist_title", "playlist_description", "ai_reasoning", "vibe_keywords", "selection"],
};

/** Prépare tout ce qui précède l'appel à Gemini (cibles, candidats, prompt). Aucune requête réseau. */
export function preparePlaylistRequest({ utilisateur = {}, contexte = {}, temperature, weatherDescription }, catalog) {
  const userGenre = utilisateur?.genre_musical_prefere ?? utilisateur?.genre_prefere ?? utilisateur?.genre ?? "";
  const userArtist = utilisateur?.artiste_prefere ?? utilisateur?.artiste ?? "";
  const userMood = contexte?.humeur || "Non précisée";
  const userContext = contexte?.contexte_activite || "Non précisé";
  const userCity = utilisateur?.ville || "Inconnue";
  const userWeather = contexte?.meteo || "Inconnue";
  const userTemp = contexte?.temperature ?? temperature ?? "?";
  const weatherDesc = contexte?.weatherDescription ?? weatherDescription ?? "-";

  const family = resolveGenreFamily(userGenre);
  const { targets, contextGenres } = computeAudioTargets({ ...contexte, weatherDescription: weatherDesc });
  const { pool, requiredArtistTracks, genreAvailable } = buildCandidatePool({
    catalog,
    family,
    favoriteArtist: userArtist,
    targets,
    contextGenres,
  });
  const minGenreTracks = family ? Math.min(15, genreAvailable) : 0;

  const ids = new Map(pool.map((t, i) => [`T${i + 1}`, t]));
  const catalogueLines = pool
    .map((t, i) =>
      `T${i + 1} [${t.tag}] ${t.track_name} — ${t.artists.replace(/;/g, ", ")} | genre: ${displayGenre(t, family)} | énergie ${fmt(t.energy)} | positivité ${fmt(t.valence)} | dansant ${fmt(t.danceability)} | acoustique ${fmt(t.acousticness)} | popularité ${t.popularity}`
    )
    .join("\n");

  const prompt = `Tu es le moteur de recommandation musicale de MoodWave. Tu composes une playlist cohérente à partir d'une liste de candidats.

PROFIL ET SITUATION :
- Utilisateur : ${utilisateur?.prenom || "Utilisateur"} (${utilisateur?.age || "?"} ans), ville : ${userCity}
- Genre favori : ${family ? userGenre : "aucune préférence"}
- Artiste favori : ${userArtist || "aucun"}
- Humeur actuelle : ${userMood}
- Activité : ${userContext}
- Météo : ${userWeather} (${userTemp}°C, ${weatherDesc})

AMBIANCE SONORE VISÉE (de 0 à 1) :
- énergie ≈ ${targets.target_energy}, positivité ≈ ${targets.target_valence}, dansant ≈ ${targets.target_danceability}, acoustique ≈ ${targets.target_acousticness}

RÈGLES :
1. Choisis EXACTEMENT 25 identifiants différents (T1, T2...) UNIQUEMENT dans la liste ci-dessous. N'invente rien.
2. PRIORITÉ 1 — Artiste favori : inclus TOUS les titres marqués [ARTISTE] (jusqu'à 8)${requiredArtistTracks === 0 ? " (aucun dans le catalogue, ignore cette règle)" : ""}.
3. PRIORITÉ 2 — Genre favori : ${family ? `inclus le plus possible de titres marqués [GENRE] (au moins ${minGenreTracks}, et TOUS s'il y en a moins de 25). Ne retire JAMAIS un titre du genre favori parce que son énergie ne colle pas parfaitement au contexte : le style de l'utilisateur passe avant l'ambiance. Parmi les titres du genre, préfère ceux qui collent le mieux à l'humeur.` : "pas de préférence, privilégie la variété."}
4. PRIORITÉ 3 — ${family ? "Seulement pour compléter jusqu'à 25 : titres [PROCHE] puis [AMBIANCE], en choisissant ceux qui collent le mieux à l'humeur et à l'activité." : "Mélange des titres [AMBIANCE] de genres variés et au maximum 6 titres [PROCHE]."}
5. Humeur et activité : elles servent à choisir ENTRE les titres de même priorité (valeurs d'énergie, positivité, dansant, acoustique les plus proches de l'ambiance visée).
6. Varie les artistes hors artiste favori quand c'est possible.
7. Ordonne les titres comme une vraie playlist (progression naturelle de l'ambiance).
8. Pour chaque titre, donne une raison courte en français qui cite l'humeur ou l'activité.
9. Titre de playlist moderne et stylé, sans cliché météo.

CANDIDATS AUTORISÉS :
${catalogueLines}`;

  return {
    userGenre, userArtist, userMood, userContext, userWeather,
    family, targets, contextGenres, pool, ids, prompt, genreAvailable,
  };
}

/** Appelle Gemini, valide les identifiants renvoyés (pas d'hallucination possible) et relance une fois si besoin. */
export async function selectWithGemini(ai, model, prepared, { temperature = 0.7 } = {}) {
  const { prompt, ids } = prepared;
  let parsed = null;
  let picks = [];
  let attempts = 0;
  let invalidIds = 0;
  for (let attempt = 1; attempt <= 2 && picks.length < 20; attempt += 1) {
    attempts = attempt;
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: GEMINI_SCHEMA, temperature },
    });
    parsed = JSON.parse((result.text || "{}").trim());
    const used = new Set();
    picks = [];
    invalidIds = 0;
    for (const item of parsed.selection || []) {
      const id = String(item.id || "").trim().toUpperCase();
      const track = ids.get(id);
      if (!track || used.has(id)) { invalidIds += 1; continue; }
      used.add(id);
      picks.push({ track, reason: item.reason || "" });
    }
    if (picks.length < 20) console.warn(`[MoodWave] Essai ${attempt} : seulement ${picks.length} titres valides.`);
  }
  if (picks.length < 20) throw new Error(`L'IA n'a proposé que ${picks.length} titres valides ; 20 sont nécessaires.`);
  return { parsed, picks, attempts, invalidIds };
}

/** Classement final (étape 4) à partir de la sélection de l'IA (ou d'aucune sélection pour le moteur local). */
export function finalRanking(prepared, catalog, curatedTracks = [], { limit = 100 } = {}) {
  const { family, userGenre, userArtist, userContext, userMood, targets, contextGenres } = prepared;
  const genres_recommandes = family
    ? [userGenre, ...[...family.genres].filter((g) => normalizeText(g) !== normalizeText(userGenre)).slice(0, 2), ...contextGenres].slice(0, 4)
    : contextGenres.length ? contextGenres : ["variété"];
  const tracks = rankTracksFromDataset(
    targets, genres_recommandes, userArtist, userGenre, userContext, userMood, catalog, curatedTracks, { limit }
  );
  return { tracks, genres_recommandes };
}

/** Pipeline complet (étapes 1 à 4). */
export async function generatePlaylist(ai, model, payload, catalog) {
  const startTime = Date.now();
  const prepared = preparePlaylistRequest(payload, catalog);
  if (prepared.pool.length < 20) {
    throw new Error(`Le catalogue ne contient que ${prepared.pool.length} titres compatibles avec ce profil.`);
  }
  const { parsed, picks } = await selectWithGemini(ai, model, prepared);
  const curated_tracks = picks.map(({ track, reason }) => ({
    track_id: track.track_id,
    track_name: track.track_name,
    artists: track.artists,
    genre: displayGenre(track, prepared.family),
    reason,
  }));
  const { tracks, genres_recommandes } = finalRanking(prepared, catalog, curated_tracks);
  const clean = (s) => (typeof s === "string" ? s.replace(/mistral/gi, "rythme") : s);
  return {
    prepared,
    response: {
      success: true,
      model,
      durationMs: Date.now() - startTime,
      playlist_title: clean(parsed.playlist_title),
      playlist_description: clean(parsed.playlist_description),
      ai_reasoning: clean(parsed.ai_reasoning),
      vibe_keywords: parsed.vibe_keywords || [],
      spotify_audio_features_targets: prepared.targets,
      genres_recommandes,
      curated_tracks,
      tracks,
    },
  };
}
