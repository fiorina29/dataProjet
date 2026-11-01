import express from "express";
import net from "node:net";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import { KAGGLE_SPOTIFY_TRACKS } from "./src/data/kaggleSampleDataset";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT) || 3e3;

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
    primaryModel: "gemini-3.8-flash",
    fallbackModel: "none (strict gemini mode)",
    sdk: "@google/genai",
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
      model: "gemini-3.1-flash-lite",
      contents: prompt
    });
    const durationMs = Date.now() - startTime;
    return res.json({
      success: true,
      model: "gemini-3.1-flash-lite",
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
app.post("/api/ai/predict-playlist", async (req, res) => {
  const startTime = Date.now();
  const { utilisateur, contexte } = req.body || {};
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "GEMINI_API_KEY absente"
    });
  }
  const userArtist = utilisateur?.artiste_prefere || "Daft Punk";
  const userGenre = utilisateur?.genre_musical_prefere || "Pop";
  const userMood = contexte?.humeur || "Joyeux";
  const userContext = contexte?.contexte_activite || "Voiture";
  const userCity = utilisateur?.ville || "Paris";
  const userWeather = contexte?.meteo || "Ensoleill\xE9";
  const userTemp = contexte?.temperature ?? 20;
  const catalogue = KAGGLE_SPOTIFY_TRACKS.slice(0, 45).map(
    (t) => `- ${t.track_name} par ${t.artists} (Genre: ${t.track_genre})`
  ).join("\n");
  const prompt = `Tu es un système de recommandation musicale d'élite pour Spotify. Ton rôle est de convertir le profil d'un utilisateur, son humeur, son contexte et la météo en une playlist de caractéristiques audio (Audio Features).

DONNÉES DU PROFIL ET D'ÉCOUTE :
- Utilisateur : ${utilisateur?.prenom || "Alexandre"} (${utilisateur?.age || 22} ans), Ville : ${userCity}
- Genre musical favori : ${userGenre}
- Artiste favori : ${userArtist}
- Humeur actuelle : ${userMood}
- Contexte d'activité : ${userContext}
- Météo locale : ${userWeather} (${userTemp}°C, ${contexte?.weatherDescription || "Ciel dégagé"})

DIRECTIVES OBLIGATOIRES EN MAJUSCULES :
- FUSION DU GENRE OBLIGATOIRE : Tu NE DOIS PAS ignorer le genre et l'artiste favoris de l'utilisateur sous prétexte que le contexte est opposé. Si le genre est Pop, propose des balades Pop pour dormir, n'impose pas de Jazz. Adapte l'énergie, mais conserve le style.
- RÈGLE DES 20 TITRES : Tu dois générer au MINIMUM 20 morceaux pertinents dans la liste 'curated_tracks'.
- FORMAT STRICT ANTI-CRASH : Ta réponse doit être UNIQUEMENT un objet JSON brut et valide. N'utilise AUCUNE balise Markdown (ne commence jamais par \`\`\`json). Ne génère aucun texte avant ou après les accolades du JSON.
- CATALOGUE STRICT : Tu DOIS sélectionner tes 20 morceaux (curated_tracks) EXCLUSIVEMENT parmi la liste fournie ci-dessous. Adapte le choix des chansons de cette liste au contexte (triste, sport, etc.) et aux goûts de l'utilisateur. IL EST STRICTEMENT INTERDIT D'INVENTER UNE CHANSON, UN ARTISTE OU DE CHOISIR UN MORCEAU HORS DE CETTE LISTE.

Voici les seules chansons autorisées :
${catalogue}

Logique de conversion (Audio Features Spotify) :
- target_valence : de 0.0 (triste/mélancolique) à 1.0 (joyeux/euphorique).
- target_energy : de 0.0 (calme/doux/sommeil) à 1.0 (intense/rapide/sport).
- target_danceability : de 0.0 (statique) à 1.0 (très dansant/fête).
- target_acousticness : de 0.0 (électronique/synthétique) à 1.0 (très acoustique/organique).

RÈGLE POUR GENRES RECOMMANDÉS :
Le premier élément de 'genres_recommandes' DOIT OBLIGATOIREMENT ÊTRE LE GENRE FAVORI DE L'UTILISATEUR ('${userGenre}'), suivi de 2 à 3 sous-genres contextuels.

RÈGLE DE TITRE :
N'utilise jamais de cliché météorologique comme "Mistral". Propose un titre moderne, stylé et dynamique.`;
  const schema = {
    type: Type.OBJECT,
    properties: {
      playlist_title: {
        type: Type.STRING,
        description: "Titre créatif, moderne et adapté"
      },
      playlist_description: {
        type: Type.STRING,
        description: "Description courte en français"
      },
      ai_reasoning: {
        type: Type.STRING,
        description: "Explication expliquant comment tu as réussi à adapter l'artiste/genre favori au contexte actuel à partir du catalogue"
      },
      vibe_keywords: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3 à 5 mots-clés d'ambiance"
      },
      spotify_audio_features_targets: {
        type: Type.OBJECT,
        properties: {
          target_valence: { type: Type.NUMBER, description: "Float de 0.0 (triste/mélancolique) à 1.0 (joyeux/euphorique)" },
          target_energy: { type: Type.NUMBER, description: "Float de 0.0 (calme/doux/sommeil) à 1.0 (intense/rapide/sport)" },
          target_danceability: { type: Type.NUMBER, description: "Float de 0.0 (statique) à 1.0 (très dansant/fête)" },
          target_acousticness: { type: Type.NUMBER, description: "Float de 0.0 (électronique) à 1.0 (très acoustique)" }
        },
        required: ["target_valence", "target_energy", "target_danceability", "target_acousticness"]
      },
      genres_recommandes: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Genre favori de l'utilisateur OBLIGATOIREMENT en premier, puis genres contextuels"
      },
      curated_tracks: {
        type: Type.ARRAY,
        description: "Au MINIMUM 20 morceaux issus STRICTEMENT du catalogue fourni",
        items: {
          type: Type.OBJECT,
          properties: {
            track_name: { type: Type.STRING },
            artists: { type: Type.STRING },
            genre: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["track_name", "artists", "genre", "reason"]
        }
      }
    },
    required: [
      "playlist_title",
      "playlist_description",
      "ai_reasoning",
      "spotify_audio_features_targets",
      "genres_recommandes",
      "curated_tracks"
    ]
  };
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    const responseText = result.text || "";
    let parsed;
    try {
      let cleaned = responseText.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      }
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn("Direct JSON parse failed, trying relaxed JSON parse:", parseErr);
      parsed = JSON.parse(responseText);
    }
    const durationMs = Date.now() - startTime;
    if (parsed.playlist_title && /mistral/i.test(parsed.playlist_title)) {
      parsed.playlist_title = `Session Sur-Mesure \u2022 ${utilisateur?.genre_musical_prefere || "Pop"}`;
    }
    if (parsed.playlist_description && /mistral/i.test(parsed.playlist_description)) {
      parsed.playlist_description = parsed.playlist_description.replace(/mistral/gi, "rythme");
    }
    if (parsed.ai_reasoning && /mistral/i.test(parsed.ai_reasoning)) {
      parsed.ai_reasoning = parsed.ai_reasoning.replace(/mistral/gi, "rythme");
    }
    return res.json({
      success: true,
      model: "gemini-3.1-flash-lite",
      durationMs,
      ...parsed
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
    console.log(`MoodWave Server running at http://0.0.0.0:${port} (Gemini AI active - Strict Mode)`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
