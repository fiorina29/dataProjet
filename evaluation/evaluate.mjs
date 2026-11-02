// evaluation/evaluate.mjs
// Évaluation hors ligne de MoodWave sur 24 profils de test.
//
// Systèmes comparés (playlists de K = 20 titres) :
//   1. aleatoire        : 20 titres tirés au hasard dans le catalogue (référence basse)
//   2. popularite       : les 20 titres les plus populaires du genre favori (ou du catalogue), sans contexte
//                         = recommandation "classique" qui ignore humeur / activité / météo
//   3. moteur_local     : MoodWave sans IA (cibles audio + classement par similarité)
//   4. gemini_brut      : les 20 premiers titres choisis par Gemini, dans son ordre
//   5. gemini_pipeline  : MoodWave complet (choix Gemini + classement final) = ce que voit l'utilisateur
//
// Métriques :
//   - distance_audio       : distance moyenne entre chaque titre et le vecteur cible (plus bas = mieux)
//   - mae_<feature>        : écart absolu moyen par caractéristique (valence, énergie, dansabilité, acoustique)
//   - precision_genre      : % de titres du genre favori (profils avec genre favori)
//   - titres_artiste       : nombre de titres de l'artiste favori (profils avec artiste favori)
//   - diversite_artistes   : artistes distincts / 20
//   - taux_violation       : % de titres qui violent les règles de l'activité (fête, sport, sommeil, enfants)
//   - popularite_moyenne   : popularité Spotify moyenne (0-100)
//   - titres_invalides     : identifiants inventés ou en double renvoyés par Gemini (hallucinations)
//   - latence_ms           : temps de génération
//
// Usage :
//   npm run evaluate                       (avec GEMINI_API_KEY dans .env : les 5 systèmes)
//   npm run evaluate -- --no-gemini        (sans IA : systèmes 1 à 3)
//   npm run evaluate -- --refresh          (ignore le cache Gemini et rappelle l'API)
//   npm run evaluate -- --delay=6000       (pause entre deux appels Gemini, quota gratuit)
// Puis : python evaluation/analyze.py      (tableaux + figures)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { loadDataset } from "../src/data/datasetLoader.js";
import {
  audioDistance,
  resolveGenreFamily,
  isFavoriteGenreTrack,
  splitArtists,
  normalizeText,
  violatesActivity,
  activityHasConstraints,
  computeAudioTargets,
} from "../src/data/moodwaveRules.js";
import { MOOD_OPTIONS, CONTEXT_OPTIONS } from "../src/data/uiOptions.js";
import { preparePlaylistRequest, selectWithGemini, finalRanking } from "../src/server/playlistPipeline.js";
import { PROFILES, profileToPayload } from "./profiles.js";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, "results");
const CACHE_PATH = path.join(RESULTS_DIR, "gemini_cache.json");
const K = 20;

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split("=")[1] : fallback;
};
const MODEL = option("model", process.env.GEMINI_MODEL || "gemini-3.1-flash-lite");
const DELAY = Number(option("delay", 4000));
const useGemini = !flag("no-gemini") && Boolean(process.env.GEMINI_API_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(RESULTS_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Données
// ---------------------------------------------------------------------------
const { catalog, stats } = loadDataset();
const byId = new Map();
for (const t of catalog) for (const id of t.alt_ids || [t.track_id]) byId.set(id, t);
console.log(`Catalogue : ${catalog.length} titres uniques (${stats.keptRows} lignes après nettoyage).`);

// Générateur pseudo-aléatoire reproductible
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Systèmes
// ---------------------------------------------------------------------------
function randomPlaylist(profileIndex) {
  const rand = mulberry32(1000 + profileIndex);
  const picked = new Set();
  while (picked.size < K) picked.add(catalog[Math.floor(rand() * catalog.length)]);
  return [...picked];
}

function popularityPlaylist(profile) {
  const family = resolveGenreFamily(profile.genre);
  const pool = family ? catalog.filter((t) => isFavoriteGenreTrack(t, family)) : catalog;
  return [...pool].sort((a, b) => b.popularity - a.popularity).slice(0, K);
}

function localPlaylist(prepared) {
  return finalRanking(prepared, catalog, [], { limit: K }).tracks;
}

async function geminiSelection(ai, profile, prepared, cache) {
  if (!flag("refresh") && cache[profile.id]?.model === MODEL) return cache[profile.id];
  const t0 = Date.now();
  const { parsed, picks, attempts, invalidIds } = await selectWithGemini(ai, MODEL, prepared);
  const entry = {
    model: MODEL,
    latencyMs: Date.now() - t0,
    attempts,
    invalidIds,
    returned: (parsed.selection || []).length,
    playlist_title: parsed.playlist_title,
    ai_reasoning: parsed.ai_reasoning,
    picks: picks.map(({ track, reason }) => ({ track_id: track.track_id, track_name: track.track_name, artists: track.artists, reason })),
  };
  cache[profile.id] = entry;
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  await sleep(DELAY);
  return entry;
}

// ---------------------------------------------------------------------------
// Métriques
// ---------------------------------------------------------------------------
const FEATURES = [
  ["valence", "target_valence"],
  ["energy", "target_energy"],
  ["danceability", "target_danceability"],
  ["acousticness", "target_acousticness"],
];

function metrics(playlist, profile, targets) {
  const n = playlist.length;
  const mean = (f) => playlist.reduce((s, t) => s + f(t), 0) / n;
  const family = resolveGenreFamily(profile.genre);
  const artistKey = normalizeText(profile.artiste);
  const row = {
    n_titres: n,
    distance_audio: mean((t) => audioDistance(t, targets)),
    diversite_artistes: new Set(playlist.map((t) => splitArtists(t.artists)[0])).size / n,
    popularite_moyenne: mean((t) => t.popularity),
    precision_genre: family ? mean((t) => (isFavoriteGenreTrack(t, family) ? 1 : 0)) : null,
    titres_artiste: profile.artiste ? playlist.filter((t) => splitArtists(t.artists).includes(artistKey)).length : null,
    taux_violation: activityHasConstraints(profile.activite) ? mean((t) => (violatesActivity(t, profile.activite) ? 1 : 0)) : null,
  };
  for (const [feat, target] of FEATURES) {
    row[`mae_${feat}`] = mean((t) => Math.abs(t[feat] - targets[target]));
    row[`moy_${feat}`] = mean((t) => t[feat]);
    row[`cible_${feat}`] = targets[target];
  }
  return row;
}

// ---------------------------------------------------------------------------
// Boucle principale
// ---------------------------------------------------------------------------
const ai = useGemini ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
const cache = fs.existsSync(CACHE_PATH) ? JSON.parse(fs.readFileSync(CACHE_PATH, "utf8")) : {};
if (!useGemini) {
  console.log(
    process.env.GEMINI_API_KEY
      ? "Option --no-gemini : systèmes Gemini ignorés."
      : "GEMINI_API_KEY absente : seuls les systèmes sans IA sont évalués (les résultats Gemini en cache sont réutilisés s'ils existent)."
  );
}

const rows = [];
const playlists = {};

for (const [i, profile] of PROFILES.entries()) {
  const prepared = preparePlaylistRequest(profileToPayload(profile), catalog);
  const { targets } = prepared;
  playlists[profile.id] = { profile, targets, systems: {} };

  const record = (system, playlist, extra = {}) => {
    rows.push({ profil: profile.id, systeme: system, humeur: profile.humeur, activite: profile.activite, meteo: profile.meteo, genre: profile.genre || "", artiste: profile.artiste || "", ...metrics(playlist, profile, targets), ...extra });
    playlists[profile.id].systems[system] = playlist.map((t) => ({ track_id: t.track_id, track_name: t.track_name, artists: t.artists, genre: t.track_genre, reason: t.curation_reason || t.reason }));
  };

  let t0 = performance.now();
  const rnd = randomPlaylist(i);
  record("aleatoire", rnd, { latence_ms: performance.now() - t0 });

  t0 = performance.now();
  const pop = popularityPlaylist(profile);
  record("popularite", pop, { latence_ms: performance.now() - t0 });

  t0 = performance.now();
  const loc = localPlaylist(prepared);
  record("moteur_local", loc, { latence_ms: performance.now() - t0 });

  let gem = cache[profile.id]?.model === MODEL ? cache[profile.id] : null;
  if (useGemini) {
    try {
      gem = await geminiSelection(ai, profile, prepared, cache);
    } catch (err) {
      console.warn(`[${profile.id}] Gemini a échoué : ${err.message}`);
      gem = null;
    }
  }
  if (gem) {
    const picks = gem.picks.map((p) => ({ ...byId.get(p.track_id), reason: p.reason })).filter((t) => t.track_id);
    const extra = {
      latence_ms: gem.latencyMs,
      titres_invalides: gem.invalidIds,
      taux_invalides: gem.returned ? gem.invalidIds / gem.returned : 0,
      essais: gem.attempts,
    };
    record("gemini_brut", picks.slice(0, K), extra);
    t0 = performance.now();
    const full = finalRanking(prepared, catalog, gem.picks, { limit: K }).tracks;
    record("gemini_pipeline", full, { ...extra, latence_ms: gem.latencyMs + (performance.now() - t0) });
  }
  console.log(`[${profile.id}] ${profile.humeur} / ${profile.activite} / ${profile.genre || "-"} / ${profile.artiste || "-"} : ok${gem ? " (+ Gemini)" : ""}`);
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))];
const csv = [
  columns.join(","),
  ...rows.map((r) => columns.map((c) => (r[c] === null || r[c] === undefined ? "" : typeof r[c] === "number" ? Number(r[c].toFixed(4)) : `"${String(r[c]).replace(/"/g, '""')}"`)).join(",")),
].join("\n");
fs.writeFileSync(path.join(RESULTS_DIR, "metrics_per_profile.csv"), csv);
fs.writeFileSync(path.join(RESULTS_DIR, "playlists.json"), JSON.stringify(playlists, null, 2));
fs.writeFileSync(
  path.join(RESULTS_DIR, "run_info.json"),
  JSON.stringify({ date: new Date().toISOString(), model: useGemini || Object.keys(cache).length ? MODEL : null, k: K, profiles: PROFILES.length, dataset: stats }, null, 2)
);

// Interprétation du modèle : vecteur cible produit par chaque humeur seule et par chaque activité seule
const targetTable = {
  humeurs: MOOD_OPTIONS.map((m) => ({ id: m.id, label: m.label, ...computeAudioTargets({ humeur: m.id }).targets })),
  activites: CONTEXT_OPTIONS.map((c) => ({ id: c.id, label: c.label, ...computeAudioTargets({ contexte_activite: c.id }).targets })),
};
fs.writeFileSync(path.join(RESULTS_DIR, "audio_targets.json"), JSON.stringify(targetTable, null, 2));

// Résumé console
const systems = [...new Set(rows.map((r) => r.systeme))];
const avg = (sys, key) => {
  const vals = rows.filter((r) => r.systeme === sys && r[key] !== null && r[key] !== undefined).map((r) => r[key]);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;
};
console.log("\nMoyennes sur les profils :");
console.table(
  Object.fromEntries(
    systems.map((s) => [s, {
      distance_audio: avg(s, "distance_audio").toFixed(3),
      precision_genre: (avg(s, "precision_genre") * 100).toFixed(1) + " %",
      diversite: (avg(s, "diversite_artistes") * 100).toFixed(1) + " %",
      violations: (avg(s, "taux_violation") * 100).toFixed(1) + " %",
      popularite: avg(s, "popularite_moyenne").toFixed(1),
      latence_ms: avg(s, "latence_ms").toFixed(0),
    }])
  )
);
console.log(`\nRésultats écrits dans ${path.relative(process.cwd(), RESULTS_DIR)}/. Lancez ensuite : python evaluation/analyze.py`);
