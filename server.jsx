import express from "express";
import net from "node:net";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import { KAGGLE_SPOTIFY_TRACKS } from "./src/data/kaggleSampleDataset";
import {
  normalizeText,
  splitArtists,
  resolveGenreFamily,
  isFavoriteGenreTrack,
  isRelatedGenreTrack,
  displayGenre,
  buildCatalog,
  computeAudioTargets,
  audioDistance,
} from "./src/data/moodwaveRules";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT) || 3001;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

// Catalogue sans doublons (un titre présent dans plusieurs genres = une seule entrée avec tous ses genres)
const CATALOG = buildCatalog(KAGGLE_SPOTIFY_TRACKS);

async function findAvailablePort(startPort, host = "0.0.0.0") {
  for (let port = startPort; port <= 65535; port += 1) {
    try {
      await new Promise((resolve, reject) => {
        const probe = net.createServer();
        probe.once("error", reject);
        probe.listen(port, host, () => probe.close(resolve));
      });
      return port;
    } catch (err) {
      if (err.code !== "EADDRINUSE") throw err;
    }
  }
  throw new Error(`No available port found starting from ${startPort}.`);
}

app.use(express.json());
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
app.get("/api/ai/status", async (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  res.json({
    status: hasKey ? "online" : "unconfigured",
    hasKey,
    primaryModel: MODEL,
    fallbackModel: "none (strict gemini mode)",
    sdk: "@google/genai",
    catalogSize: CATALOG.length,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/ai/test", async (req, res) => {
  const startTime = Date.now();
  const prompt = req.body?.prompt || "Donne une phrase concise et inspirante reliant l'humeur humaine, la m\xE9t\xE9o et la musique.";
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "Cl\xE9 GEMINI_API_KEY absente dans l'environnement serveur."
    });
  }
  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt
    });
    const durationMs = Date.now() - startTime;
    return res.json({
      success: true,
      model: MODEL,
      prompt,
      response: (result.text || "").trim(),
      durationMs,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    console.error("Gemini Test Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Erreur lors de l'appel Gemini"
    });
  }
});

/* ------------------------------------------------------------------ */
/* Pré-sélection des candidats envoyés à l'IA                          */
/* ------------------------------------------------------------------ */
// Avant : les 15 000 titres étaient envoyés à Gemini, sans aucune donnée d'ambiance.
// L'IA ne pouvait pas savoir si un titre était calme ou énergique et retombait sur les tubes pop.
// Maintenant : on envoie ~150 candidats pertinents (artiste favori, genre favori, genres voisins),
// avec leurs caractéristiques audio, et l'IA choisit parmi eux.

const fmt = (v) => Number(v).toFixed(2);

function buildCandidatePool({ family, favoriteArtist, targets, contextGenres }) {
  const artistKey = normalizeText(favoriteArtist);
  const hasArtist = artistKey.length > 1 && !artistKey.includes("pas de pref") && !artistKey.includes("aucun");
  const isArtistTrack = (t) => hasArtist && splitArtists(t.artists).includes(artistKey);
  const byDistance = (a, b) => audioDistance(a, targets) - audioDistance(b, targets);

  const artistTracks = CATALOG.filter(isArtistTrack).sort(byDistance);
  const genreTracks = family
    ? CATALOG.filter((t) => !isArtistTrack(t) && isFavoriteGenreTrack(t, family)).sort(byDistance)
    : [];
  const relatedTracks = CATALOG.filter(
    (t) => !isArtistTrack(t) && isRelatedGenreTrack(t, family, contextGenres)
  ).sort(byDistance);

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
  // Pas de préférence de genre, ou genre trop rare dans le catalogue : on complète avec les titres les plus proches de l'ambiance
  if (!family || pool.length < 60) {
    push([...CATALOG].sort(byDistance), 110 - pool.length, "AMBIANCE");
  }

  return {
    pool,
    requiredArtistTracks: Math.min(5, artistTracks.length),
    genreAvailable: genreTracks.length,
  };
}

app.post("/api/ai/predict-playlist", async (req, res) => {
  const startTime = Date.now();
  const { utilisateur, contexte } = req.body || {};
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "GEMINI_API_KEY absente"
    });
  }

  // Plus de valeur par défaut "Pop" : si le genre n'arrive pas, on le voit dans les logs au lieu de tout transformer en pop.
  const userGenre = utilisateur?.genre_musical_prefere ?? utilisateur?.genre_prefere ?? utilisateur?.genre ?? "";
  const userArtist = utilisateur?.artiste_prefere ?? utilisateur?.artiste ?? "";
  const userMood = contexte?.humeur || "Non précisée";
  const userContext = contexte?.contexte_activite || "Non précisé";
  const userCity = utilisateur?.ville || "Inconnue";
  const userWeather = contexte?.meteo || "Inconnue";
  const userTemp = contexte?.temperature ?? "?";

  const family = resolveGenreFamily(userGenre);
  const { targets, contextGenres } = computeAudioTargets(contexte || {});
  const { pool, requiredArtistTracks, genreAvailable } = buildCandidatePool({
    family,
    favoriteArtist: userArtist,
    targets,
    contextGenres,
  });
  const minGenreTracks = family ? Math.min(15, genreAvailable) : 0;

  console.log("[MoodWave] Demande reçue :", {
    genre: userGenre || "(vide)",
    familleDataset: family ? [...family.genres].join(", ") : "aucune préférence",
    artiste: userArtist || "(vide)",
    humeur: userMood,
    activite: userContext,
    meteo: userWeather,
    cibles: targets,
    candidats: pool.length,
    titresGenreDisponibles: genreAvailable,
  });

  if (pool.length < 20) {
    return res.status(500).json({
      success: false,
      error: `Le catalogue ne contient que ${pool.length} titres compatibles avec ce profil.`
    });
  }

  const ids = new Map(pool.map((t, i) => [`T${i + 1}`, t]));
  const catalogueLines = pool
    .map((t, i) =>
      `T${i + 1} [${t.tag}] ${t.track_name} — ${t.artists.replace(/;/g, ", ")} | genre: ${displayGenre(t, family)} | énergie ${fmt(t.energy)} | positivité ${fmt(t.valence)} | dansant ${fmt(t.danceability)} | acoustique ${fmt(t.acousticness)}`
    )
    .join("\n");

  const prompt = `Tu es le moteur de recommandation musicale de MoodWave. Tu composes une playlist cohérente à partir d'une liste de candidats.

PROFIL ET SITUATION :
- Utilisateur : ${utilisateur?.prenom || "Utilisateur"} (${utilisateur?.age || "?"} ans), ville : ${userCity}
- Genre favori : ${family ? userGenre : "aucune préférence"}
- Artiste favori : ${userArtist || "aucun"}
- Humeur actuelle : ${userMood}
- Activité : ${userContext}
- Météo : ${userWeather} (${userTemp}°C, ${contexte?.weatherDescription || "-"})

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

  const schema = {
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
            reason: { type: Type.STRING }
          },
          required: ["id", "reason"]
        }
      }
    },
    required: ["playlist_title", "playlist_description", "ai_reasoning", "vibe_keywords", "selection"]
  };

  try {
    let parsed = null;
    let picks = [];
    // Deux essais maximum si l'IA renvoie trop peu d'identifiants valides
    for (let attempt = 1; attempt <= 2 && picks.length < 20; attempt += 1) {
      const result = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.7
        }
      });
      parsed = JSON.parse((result.text || "{}").trim());
      const used = new Set();
      picks = [];
      for (const item of parsed.selection || []) {
        const id = String(item.id || "").trim().toUpperCase();
        const track = ids.get(id);
        if (!track || used.has(id)) continue;
        used.add(id);
        picks.push({ track, reason: item.reason || "" });
      }
      if (picks.length < 20) {
        console.warn(`[MoodWave] Essai ${attempt} : seulement ${picks.length} titres valides.`);
      }
    }

    if (picks.length < 20) {
      throw new Error(`L'IA n'a proposé que ${picks.length} titres valides ; 20 sont nécessaires.`);
    }

    const genreCount = picks.filter((p) => family && isFavoriteGenreTrack(p.track, family)).length;
    console.log(`[MoodWave] Sélection IA : ${picks.length} titres, dont ${genreCount} du genre favori.`);

    const curated_tracks = picks.map(({ track, reason }) => ({
      track_id: track.track_id,
      track_name: track.track_name,
      artists: track.artists,
      genre: displayGenre(track, family),
      reason
    }));

    const genres_recommandes = family
      ? [userGenre, ...[...family.genres].filter((g) => normalizeText(g) !== normalizeText(userGenre)).slice(0, 2), ...contextGenres].slice(0, 4)
      : contextGenres.length ? contextGenres : ["variété"];

    const clean = (s) => (typeof s === "string" ? s.replace(/mistral/gi, "rythme") : s);
    return res.json({
      success: true,
      model: MODEL,
      durationMs: Date.now() - startTime,
      playlist_title: clean(parsed.playlist_title),
      playlist_description: clean(parsed.playlist_description),
      ai_reasoning: clean(parsed.ai_reasoning),
      vibe_keywords: parsed.vibe_keywords || [],
      spotify_audio_features_targets: targets,
      genres_recommandes,
      curated_tracks
    });
  } catch (err) {
    console.error("Gemini API Error in /api/ai/predict-playlist:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Erreur de g\xE9n\xE9ration par l'IA Gemini"
    });
  }
});
async function startServer() {
  const isDev = process.env.NODE_ENV !== "production";
  const port = await findAvailablePort(PORT);
  if (isDev) {
    const hmrPort = process.env.DISABLE_HMR === "true"
      ? undefined
      : await findAvailablePort(24678, "::");
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, "vite.config.jsx"),
      server: {
        middlewareMode: true,
        ...(hmrPort ? { ws: { port: hmrPort } } : {})
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(port, "0.0.0.0", () => {
    if (port !== PORT) {
      console.warn(`Port ${PORT} is already in use; using ${port} instead.`);
    }
    console.log(`MoodWave Server running at http://localhost:${port} (Gemini AI active - Strict Mode)`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
