import express from "express";
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
      model: "gemini-3.8-flash",
      contents: prompt
    });
    const durationMs = Date.now() - startTime;
    return res.json({
      success: true,
      model: "gemini-3.8-flash",
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
  const catalogue = KAGGLE_SPOTIFY_TRACKS.map(
    (t) => `- ${t.track_name} par ${t.artists} (Genre: ${t.track_genre})`
  ).join("\n");
  const prompt = `Tu es un syst\xE8me de recommandation musicale d'\xE9lite pour Spotify. Ton r\xF4le est de convertir le profil d'un utilisateur, son humeur, son contexte et la m\xE9t\xE9o en une playlist de caract\xE9ristiques audio (Audio Features).

DONN\xC9ES DU PROFIL ET D'\xC9COUTE :
- Utilisateur : ${utilisateur?.prenom || "Alexandre"} (${utilisateur?.age || 22} ans), Ville : ${userCity}
- Genre musical favori : ${userGenre}
- Artiste favori : ${userArtist}
- Humeur actuelle : ${userMood}
- Contexte d'activit\xE9 : ${userContext}
- M\xE9t\xE9o locale : ${userWeather} (${userTemp}\xB0C, ${contexte?.weatherDescription || "Ciel d\xE9gag\xE9"})

DIRECTIVES OBLIGATOIRES EN MAJUSCULES :
- FUSION DU GENRE OBLIGATOIRE : Tu NE DOIS PAS ignorer le genre et l'artiste favoris de l'utilisateur sous pr\xE9texte que le contexte est oppos\xE9. Si le genre est Pop, propose des balades Pop pour dormir, n'impose pas de Jazz. Adapte l'\xE9nergie, mais conserve le style.
- R\xC8GLE DES 20 TITRES : Tu dois g\xE9n\xE9rer au MINIMUM 20 morceaux pertinents dans la liste 'curated_tracks'.
- FORMAT STRICT ANTI-CRASH : Ta r\xE9ponse doit \xEAtre UNIQUEMENT un objet JSON brut et valide. N'utilise AUCUNE balise Markdown (ne commence jamais par \`\`\`json). Ne g\xE9n\xE8re aucun texte avant ou apr\xE8s les accolades du JSON.
- CATALOGUE STRICT : Tu DOIS s\xE9lectionner tes 20 morceaux (curated_tracks) EXCLUSIVEMENT parmi la liste fournie ci-dessous. Adapte le choix des chansons de cette liste au contexte (triste, sport, etc.) et aux go\xFBts de l'utilisateur. IL EST STRICTEMENT INTERDIT D'INVENTER UNE CHANSON, UN ARTISTE OU DE CHOISIR UN MORCEAU HORS DE CETTE LISTE.

Voici les seules chansons autoris\xE9es :
${catalogue}

Logique de conversion (Audio Features Spotify) :
- target_valence : de 0.0 (triste/m\xE9lancolique) \xE0 1.0 (joyeux/euphorique).
- target_energy : de 0.0 (calme/doux/sommeil) \xE0 1.0 (intense/rapide/sport).
- target_danceability : de 0.0 (statique) \xE0 1.0 (tr\xE8s dansant/f\xEAte).
- target_acousticness : de 0.0 (\xE9lectronique/synth\xE9tique) \xE0 1.0 (tr\xE8s acoustique/organique).

R\xC8GLE POUR GENRES RECOMMAND\xC9S :
Le premier \xE9l\xE9ment de 'genres_recommandes' DOIT OBLIGATOIREMENT \xCATRE LE GENRE FAVORI DE L'UTILISATEUR ('${userGenre}'), suivi de 2 \xE0 3 sous-genres contextuels.

R\xC8GLE DE TITRE :
N'utilise jamais de clich\xE9 m\xE9t\xE9orologique comme "Mistral". Propose un titre moderne, styl\xE9 et dynamique.`;
  const schema = {
    type: Type.OBJECT,
    properties: {
      playlist_title: {
        type: Type.STRING,
        description: "Titre cr\xE9atif, moderne et adapt\xE9"
      },
      playlist_description: {
        type: Type.STRING,
        description: "Description courte en fran\xE7ais"
      },
      ai_reasoning: {
        type: Type.STRING,
        description: "Explication expliquant comment tu as r\xE9ussi \xE0 adapter l'artiste/genre favori au contexte actuel \xE0 partir du catalogue"
      },
      vibe_keywords: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3 \xE0 5 mots-cl\xE9s d'ambiance"
      },
      spotify_audio_features_targets: {
        type: Type.OBJECT,
        properties: {
          target_valence: { type: Type.NUMBER, description: "Float de 0.0 (triste/m\xE9lancolique) \xE0 1.0 (joyeux/euphorique)" },
          target_energy: { type: Type.NUMBER, description: "Float de 0.0 (calme/doux/sommeil) \xE0 1.0 (intense/rapide/sport)" },
          target_danceability: { type: Type.NUMBER, description: "Float de 0.0 (statique) \xE0 1.0 (tr\xE8s dansant/f\xEAte)" },
          target_acousticness: { type: Type.NUMBER, description: "Float de 0.0 (\xE9lectronique) \xE0 1.0 (tr\xE8s acoustique)" }
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
      model: "gemini-3.8-flash",
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
      model: "gemini-3.8-flash",
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
  if (isDev) {
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, "vite.config.jsx"),
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MoodWave Server running at http://0.0.0.0:${PORT} (Gemini AI active - Strict Mode)`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
