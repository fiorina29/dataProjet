import express from "express";
import net from "node:net";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import { loadDataset } from "./src/data/datasetLoader.js";
import { generatePlaylist, preparePlaylistRequest, finalRanking } from "./src/server/playlistPipeline.js";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT) || 3001;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

// Dataset Kaggle "Spotify Tracks Dataset" (data/dataset.csv) chargé une seule fois au démarrage.
// Catalogue sans doublons : un titre présent dans plusieurs genres = une seule entrée avec tous ses genres.
const DATASET = loadDataset();
const CATALOG = DATASET.catalog;
console.log("[MoodWave] Dataset chargé :", DATASET.stats);

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
    dataset: DATASET.stats,
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

app.get("/api/catalog/meta", (_req, res) => {
  res.json({
    source: "Kaggle — Spotify Tracks Dataset (maharshipandya)",
    url: "https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset",
    stats: DATASET.stats,
    genres: DATASET.genres,
    artists: DATASET.artists,
  });
});

app.post("/api/ai/predict-playlist", async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ success: false, error: "GEMINI_API_KEY absente" });
  }
  try {
    const { prepared, response } = await generatePlaylist(ai, MODEL, req.body || {}, CATALOG);
    console.log("[MoodWave] Demande :", {
      genre: prepared.userGenre || "(vide)",
      familleDataset: prepared.family ? [...prepared.family.genres].join(", ") : "aucune préférence",
      artiste: prepared.userArtist || "(vide)",
      humeur: prepared.userMood,
      activite: prepared.userContext,
      meteo: prepared.userWeather,
      cibles: prepared.targets,
      candidats: prepared.pool.length,
      selectionIA: response.curated_tracks.length,
      dureeMs: response.durationMs,
    });
    return res.json(response);
  } catch (err) {
    console.error("Gemini API Error in /api/ai/predict-playlist:", err);
    return res.status(500).json({ success: false, error: err.message || "Erreur de génération par l'IA Gemini" });
  }
});

// Moteur local (sans IA) : utilisé en secours si Gemini est indisponible, et comme référence dans l'évaluation.
app.post("/api/local/predict-playlist", (req, res) => {
  const startTime = Date.now();
  try {
    const prepared = preparePlaylistRequest(req.body || {}, CATALOG);
    const { tracks, genres_recommandes } = finalRanking(prepared, CATALOG, []);
    return res.json({
      success: true,
      model: "moteur-local",
      isAiGenerated: false,
      durationMs: Date.now() - startTime,
      playlist_title: "Playlist MoodWave (moteur local)",
      playlist_description: "Générée sans IA, par similarité audio avec l'ambiance visée.",
      spotify_audio_features_targets: prepared.targets,
      genres_recommandes,
      curated_tracks: [],
      tracks,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
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
