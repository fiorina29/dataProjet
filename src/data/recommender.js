// src/data/recommender.js
// Moteur de classement MoodWave (exécuté côté serveur, réutilisé par le script d'évaluation).
//
// Entrées : vecteur audio cible (valence, énergie, dansabilité, acoustique), profil (genre, artiste favoris),
// activité, et éventuellement la sélection de Gemini.
// Sortie  : catalogue trié par score de correspondance (0-99).

import {
  normalizeText,
  splitArtists,
  trackKey,
  resolveGenreFamily,
  isFavoriteGenreTrack,
  isRelatedGenreTrack,
  displayGenre,
  computeAudioTargets,
  violatesActivity,
  POPULARITY_WEIGHT,
} from "./moodwaveRules.js";

// Poids du classement (en unités de distance audio ; la distance max entre deux titres vaut 2).
export const GENRE_PENALTY = 0.3;          // titre hors du genre favori
export const GENRE_PENALTY_RELATED = 0.15; // titre d'un genre voisin
export const ARTIST_BONUS = 0.35;          // titre de l'artiste favori
export const CONTEXT_GENRE_BONUS = 0.05;   // genre d'ambiance du dataset (party, sleep, chill, sad...)
export const MAX_ARTIST_TRACKS = 8;        // plafond de titres de l'artiste favori en tête de playlist

/** Titre sans mention de version : "Get Lucky (feat. X) - Radio Edit" -> "get lucky". */
export function baseTitle(name) {
  return normalizeText(name)
    .replace(/\s+-\s+.*$/, "")
    .replace(/\s*[([].*?[)\]]/g, "")
    .trim();
}

/** Vrai si un morceau appartient à la même famille de genre qu'un libellé (ex. "Rap" ~ "hip-hop"). */
export function matchesGenre(track, testGenre) {
  if (!track || !testGenre) return false;
  const family = resolveGenreFamily(testGenre);
  return Boolean(family) && isFavoriteGenreTrack(track, family);
}

/** Cibles audio calculées localement (sans IA) à partir de l'humeur, de l'activité et de la météo. */
export function predictAudioTargetsLocally(payload) {
  const { utilisateur = {}, contexte = {} } = payload || {};
  const { targets, contextGenres } = computeAudioTargets(contexte);
  const family = resolveGenreFamily(utilisateur.genre_musical_prefere);
  const genres = family ? [utilisateur.genre_musical_prefere, ...contextGenres] : contextGenres;
  return {
    spotify_audio_features_targets: targets,
    genres_recommandes: Array.from(new Set(genres)).slice(0, 5),
  };
}

export function isFavoriteArtistTrack(track, favoriteArtist) {
  const artist = normalizeText(favoriteArtist);
  if (artist.length < 2 || artist.includes("pas de pref") || artist.includes("aucun")) return false;
  return splitArtists(track.artists).includes(artist);
}

/**
 * Classement final.
 *  - Filtre strict selon l'activité (fête, sport, sommeil, enfants) sauf pour les titres choisis par l'IA.
 *  - Distance euclidienne aux 4 cibles audio + a priori de popularité.
 *  - Pénalités additives : hors genre favori (+0,3, ou +0,15 si genre voisin), bonus artiste favori (-0,35),
 *    genre d'ambiance (-0,05) ; titres très festifs / très sportifs (×0,85) ; choisis par l'IA (×0,2).
 *  - Score = 1 - distance / 1,7, borné à [10, 99].
 */
export function rankTracksFromDataset(
  targets,
  recommendedGenres = [],
  favoriteArtist,
  favoriteGenre,
  activityContext,
  _mood,
  catalog,
  aiCuratedTracks = [],
  { limit = Infinity } = {}
) {
  const { target_valence, target_energy, target_danceability, target_acousticness } = targets;
  const act = normalizeText(activityContext);
  const family = resolveGenreFamily(favoriteGenre);
  const otherGenres = (recommendedGenres || []).filter((g) => normalizeText(g) !== normalizeText(favoriteGenre));

  const curatedById = new Map();
  const curatedByKey = new Map();
  (aiCuratedTracks || []).forEach((item, index) => {
    const entry = { ...item, aiRank: index };
    if (item.track_id) curatedById.set(item.track_id, entry);
    curatedByKey.set(trackKey(item.track_name, item.artists), entry);
  });

  const otherFamilies = otherGenres.map(resolveGenreFamily).filter(Boolean);
  const artistKey = normalizeText(favoriteArtist);
  const hasArtist = artistKey.length > 1 && !artistKey.includes("pas de pref") && !artistKey.includes("aucun");
  const isParty = act.includes("fete") || act.includes("soiree");
  const isSport = act.includes("sport") || act.includes("workout");

  const scored = [];
  for (const t of catalog) {
    const isArtistMatch = hasArtist && splitArtists(t.artists).includes(artistKey);
    let curated =
      [...(t.alt_ids || [t.track_id])].map((id) => curatedById.get(id)).find(Boolean) ||
      curatedByKey.get(trackKey(t.track_name, t.artists));
    if (!curated && isArtistMatch) {
      curated = { reason: `Sélectionné pour correspondre à votre artiste favori ${favoriteArtist} et au contexte ${activityContext || "actuel"}`, aiRank: 999, implicit: true };
    }
    if (!curated && violatesActivity(t, activityContext)) continue;

    let distance = Math.sqrt(
      (t.valence - target_valence) ** 2 +
      (t.energy - target_energy) ** 2 +
      (t.danceability - target_danceability) ** 2 +
      (t.acousticness - target_acousticness) ** 2
    ) + POPULARITY_WEIGHT * (1 - (t.popularity || 0) / 100);

    // Préférences : pénalités ADDITIVES. Avec 80 000 titres, beaucoup de morceaux sont très proches de la cible ;
    // un simple multiplicateur sur de petites distances ne suffit pas à faire passer le genre favori devant.
    const isAiPick = Boolean(curated && !curated.implicit);
    const isUserGenreMatch = Boolean(family) && isFavoriteGenreTrack(t, family);
    if (family && !isUserGenreMatch) {
      distance += isRelatedGenreTrack(t, family) ? GENRE_PENALTY_RELATED : GENRE_PENALTY;
    }
    if (isArtistMatch) distance = Math.max(0, distance - ARTIST_BONUS);
    if (otherFamilies.some((f) => isFavoriteGenreTrack(t, f))) distance = Math.max(0, distance - CONTEXT_GENRE_BONUS);
    if (isParty && t.danceability >= 0.75 && t.valence >= 0.75) distance *= 0.85;
    if (isSport && t.energy >= 0.85 && t.tempo >= 120) distance *= 0.85;
    if (isAiPick) distance *= 0.2; // les choix de Gemini passent devant, dans l'ordre proposé par l'IA

    const rawScore = Math.max(0.1, 1 - distance / 1.7);
    scored.push({
      track: t,
      curated,
      isAiPick,
      score: Math.min(99, Math.round(rawScore * 100)),
      distance,
      aiRank: curated ? curated.aiRank : 1000,
    });
  }

  // Tri sur la distance (avant arrondi) : le score affiché sature vers 96-99 et masquerait les bonus de genre.
  scored.sort((a, b) => a.distance - b.distance || a.aiRank - b.aiRank);

  // Au plus MAX_ARTIST_TRACKS titres de l'artiste favori en tête de playlist (même règle que dans le prompt Gemini) :
  // les suivants sont repoussés après les autres titres pour garder de la diversité.
  // On ignore aussi les versions d'un même titre (radio edit, remaster, live...) déjà présentes.
  const head = [];
  const overflow = [];
  const seenVersions = new Set();
  let artistCount = 0;
  for (const item of scored) {
    const versionKey = `${baseTitle(item.track.track_name)}|${splitArtists(item.track.artists)[0] || ""}`;
    if (seenVersions.has(versionKey)) continue;
    seenVersions.add(versionKey);
    const isArtist = hasArtist && splitArtists(item.track.artists).includes(artistKey);
    if (isArtist && !item.isAiPick && artistCount >= MAX_ARTIST_TRACKS) overflow.push(item);
    else { head.push(item); if (isArtist) artistCount += 1; }
  }
  const ordered = head.concat(overflow);

  return ordered.slice(0, limit).map(({ track, curated, isAiPick, score }) => {
    const { alt_ids, all_genres, ...rest } = track;
    return {
      ...rest,
      all_genres,
      track_genre: displayGenre(track, family),
      similarity_score: score,
      ...(curated ? { is_curated: isAiPick, curation_reason: curated.reason } : {}),
    };
  });
}
