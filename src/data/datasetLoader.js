// src/data/datasetLoader.js
// Chargement du dataset Kaggle "Spotify Tracks Dataset" (maharshipandya) côté serveur (Node uniquement).
// Source : https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset
// 114 000 lignes, 114 genres (1 000 titres par genre), 20 colonnes dont les caractéristiques audio Spotify.
//
// Prétraitement :
//  1. lecture du CSV (gestion des guillemets et des virgules dans les titres) ;
//  2. suppression des lignes incomplètes (titre ou artiste manquant) et des valeurs audio invalides ;
//  3. conversion des types (nombres, booléen "explicit") ;
//  4. regroupement des doublons : un même titre apparaît dans plusieurs genres -> une seule entrée
//     avec la liste de tous ses genres (fait par buildCatalog dans moodwaveRules.js).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalog, splitArtists } from "./moodwaveRules.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_DATASET_PATH = path.resolve(__dirname, "../../data/dataset.csv");

const NUMERIC_COLUMNS = [
  "popularity", "duration_ms", "danceability", "energy", "key", "loudness", "mode",
  "speechiness", "acousticness", "instrumentalness", "liveness", "valence", "tempo", "time_signature",
];
const UNIT_COLUMNS = ["danceability", "energy", "speechiness", "acousticness", "instrumentalness", "liveness", "valence"];

/** Parseur CSV minimal conforme RFC 4180 (champs entre guillemets, "" échappés, retours à la ligne dans un champ). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Lit le CSV et renvoie les lignes nettoyées (une ligne = un couple titre/genre), plus des statistiques. */
export function loadRawTracks(csvPath = DEFAULT_DATASET_PATH) {
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const header = rows[0].map((h) => h.trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const stats = { rawRows: rows.length - 1, droppedMissing: 0, droppedInvalid: 0 };
  const tracks = [];

  for (let r = 1; r < rows.length; r += 1) {
    const cells = rows[r];
    const get = (col) => cells[idx[col]];
    const track_name = (get("track_name") || "").trim();
    const artists = (get("artists") || "").trim();
    const track_id = (get("track_id") || "").trim();
    if (!track_name || !artists || !track_id) { stats.droppedMissing += 1; continue; }

    const track = {
      track_id,
      artists,
      album_name: (get("album_name") || "").trim(),
      track_name,
      explicit: String(get("explicit")).trim().toLowerCase() === "true",
      track_genre: (get("track_genre") || "").trim(),
    };
    let valid = true;
    for (const col of NUMERIC_COLUMNS) {
      const v = Number(get(col));
      if (!Number.isFinite(v)) { valid = false; break; }
      track[col] = v;
    }
    if (valid && UNIT_COLUMNS.some((col) => track[col] < 0 || track[col] > 1)) valid = false;
    if (valid && (track.duration_ms <= 0 || track.tempo <= 0)) valid = false; // titres sans tempo / durée = silences, bruits
    if (!valid) { stats.droppedInvalid += 1; continue; }
    tracks.push(track);
  }
  stats.keptRows = tracks.length;
  return { tracks, stats };
}

let cached = null;

/**
 * Charge le dataset une seule fois et renvoie :
 *  - rawTracks : lignes nettoyées (titre × genre)
 *  - catalog   : titres uniques (doublons regroupés, champ all_genres)
 *  - genres    : liste triée des 114 genres du dataset
 *  - artists   : artistes les plus populaires (pour l'autocomplétion du formulaire)
 *  - stats     : chiffres du prétraitement (affichables dans le rapport)
 */
export function loadDataset(csvPath = DEFAULT_DATASET_PATH) {
  if (cached && cached.path === csvPath) return cached.data;
  const t0 = Date.now();
  const { tracks: rawTracks, stats } = loadRawTracks(csvPath);
  const catalog = buildCatalog(rawTracks);
  const genres = [...new Set(rawTracks.map((t) => t.track_genre))].sort((a, b) => a.localeCompare(b, "fr"));

  const artistPopularity = new Map();
  for (const t of catalog) {
    for (const name of String(t.artists).split(";").map((a) => a.trim()).filter(Boolean)) {
      artistPopularity.set(name, Math.max(artistPopularity.get(name) ?? 0, t.popularity ?? 0));
    }
  }
  const artists = [...artistPopularity.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3000)
    .map(([name]) => name)
    .sort((a, b) => a.localeCompare(b, "fr"));

  const data = {
    rawTracks,
    catalog,
    genres,
    artists,
    stats: {
      ...stats,
      uniqueTracks: catalog.length,
      genres: genres.length,
      artists: artistPopularity.size,
      loadMs: Date.now() - t0,
    },
  };
  cached = { path: csvPath, data };
  return data;
}

export { splitArtists };
