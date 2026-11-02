// src/data/moodwaveRules.js
// Règles partagées entre le serveur (server.jsx), le moteur de classement (recommender.js) et l'évaluation :
//  - correspondance entre le genre choisi par l'utilisateur (en français) et les genres du dataset Kaggle
//  - conversion humeur / activité / météo -> caractéristiques audio cibles
//  - regroupement des doublons du dataset (un même titre présent dans plusieurs genres)

/* ------------------------------------------------------------------ */
/* Outils texte                                                        */
/* ------------------------------------------------------------------ */

export const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Le dataset Kaggle sépare les artistes par ";" (parfois ","). */
export const splitArtists = (artists) =>
  String(artists ?? "")
    .split(/[;,]/)
    .map(normalizeText)
    .filter(Boolean);

export const trackKey = (trackName, artists) =>
  `${normalizeText(trackName)}|${splitArtists(artists).sort().join(",")}`;

/* ------------------------------------------------------------------ */
/* Familles de genres                                                  */
/* ------------------------------------------------------------------ */
// "aliases" : mots qu'on cherche dans le genre choisi par l'utilisateur (ordre important : du plus précis au plus large)
// "genres"  : valeurs de track_genre du dataset Kaggle qui comptent comme LE genre favori
// "related" : genres voisins (autorisés en petite quantité)

const GENRE_FAMILIES = [
  { key: "k-pop", aliases: ["k-pop", "kpop", "coree"], genres: ["k-pop"], related: ["j-pop", "pop"] },
  { key: "j-pop", aliases: ["j-pop", "jpop", "anime", "japon"], genres: ["j-pop", "j-rock", "j-dance", "j-idol", "anime"], related: ["k-pop"] },
  { key: "r-n-b", aliases: ["r&b", "rnb", "r-n-b", "r n b"], genres: ["r-n-b", "soul"], related: ["hip-hop", "funk"] },
  { key: "hip-hop", aliases: ["rap", "hip-hop", "hip hop", "hiphop", "trap", "drill"], genres: ["hip-hop"], related: ["r-n-b", "french", "dancehall"] },
  { key: "metal", aliases: ["metal"], genres: ["metal", "heavy-metal", "black-metal", "death-metal", "metalcore", "grindcore", "industrial"], related: ["hard-rock", "hardcore"] },
  { key: "punk", aliases: ["punk", "emo"], genres: ["punk", "punk-rock", "emo", "hardcore"], related: ["rock", "alt-rock"] },
  { key: "electro", aliases: ["electro", "edm", "techno", "house", "dance", "synthwave", "trance", "dubstep"], genres: ["edm", "electro", "electronic", "dance", "house", "deep-house", "progressive-house", "chicago-house", "techno", "detroit-techno", "minimal-techno", "trance", "dubstep", "drum-and-bass", "breakbeat", "club", "idm", "hardstyle", "garage"], related: ["synth-pop", "disco", "party"] },
  { key: "disco", aliases: ["disco", "funk", "groove"], genres: ["disco", "funk", "groove"], related: ["dance", "soul"] },
  { key: "indie", aliases: ["indie", "alternati"], genres: ["indie", "indie-pop", "alternative", "alt-rock"], related: ["rock", "folk", "singer-songwriter"] },
  { key: "rock", aliases: ["rock"], genres: ["rock", "alt-rock", "hard-rock", "rock-n-roll", "psych-rock", "punk-rock", "grunge", "british", "rockabilly"], related: ["indie", "alternative", "metal"] },
  { key: "pop", aliases: ["pop"], genres: ["pop", "indie-pop", "synth-pop", "power-pop", "pop-film"], related: ["dance", "r-n-b", "french"] },
  { key: "jazz", aliases: ["jazz"], genres: ["jazz"], related: ["blues", "soul"] },
  { key: "blues", aliases: ["blues"], genres: ["blues"], related: ["jazz", "soul"] },
  { key: "classical", aliases: ["classique", "classical", "opera", "piano", "orchestr"], genres: ["classical", "opera", "piano"], related: ["new-age", "ambient"] },
  { key: "ambient", aliases: ["ambient", "chill", "lofi", "lo-fi", "relax", "zen"], genres: ["ambient", "chill", "new-age", "sleep", "study", "trip-hop"], related: ["piano", "acoustic"] },
  { key: "acoustic", aliases: ["acousti", "folk", "guitare", "singer"], genres: ["acoustic", "folk", "singer-songwriter", "songwriter", "guitar"], related: ["indie", "country"] },
  { key: "country", aliases: ["country"], genres: ["country", "honky-tonk", "bluegrass"], related: ["folk", "acoustic"] },
  { key: "latino", aliases: ["latin", "reggaeton", "salsa", "bachata", "espagnol", "bresil", "samba"], genres: ["latin", "latino", "reggaeton", "salsa", "samba", "tango", "spanish", "brazil", "mpb", "pagode", "sertanejo", "forro"], related: ["dancehall"] },
  { key: "reggae", aliases: ["reggae", "dub", "ska", "dancehall"], genres: ["reggae", "dub", "dancehall", "ska"], related: ["afrobeat"] },
  { key: "afro", aliases: ["afro"], genres: ["afrobeat"], related: ["dancehall", "reggae"] },
  { key: "children", aliases: ["enfant", "kids", "disney"], genres: ["children", "kids", "disney"], related: ["pop"] },
  { key: "soul", aliases: ["soul", "gospel"], genres: ["soul", "gospel"], related: ["r-n-b", "funk"] },
  { key: "french", aliases: ["francais", "french", "variete", "chanson"], genres: ["french"], related: ["pop", "singer-songwriter"] },
];

export function hasGenrePreference(label) {
  const g = normalizeText(label);
  return Boolean(g) && !g.includes("pas de pref") && !g.includes("aucun") && g !== "tous";
}

/**
 * Transforme le genre choisi par l'utilisateur ("Rap", "Électro", "Classique"...) en famille de genres du dataset.
 * Renvoie null si l'utilisateur n'a pas de préférence.
 */
export function resolveGenreFamily(label) {
  if (!hasGenrePreference(label)) return null;
  const g = normalizeText(label);
  // 1) Le libellé est exactement un genre du dataset (ex. "j-rock", "deep-house") : ce genre précis est le genre favori,
  //    et le reste de sa famille devient "genres voisins".
  const exact = GENRE_FAMILIES.find((family) => family.genres.includes(g));
  if (exact) {
    const related = new Set([...exact.genres, ...exact.related].filter((x) => x !== g));
    return { key: g, label: String(label), genres: new Set([g]), related, custom: false };
  }
  // 2) Sinon, recherche par mots-clés (ex. "Hip-Hop / Rap", "Électronique / EDM") -> toute la famille.
  const found = GENRE_FAMILIES.find((family) => family.aliases.some((alias) => g.includes(alias)));
  if (found) {
    return { key: found.key, label: String(label), genres: new Set(found.genres), related: new Set(found.related), custom: false };
  }
  // Genre inconnu : on cherche les genres du dataset dont le nom ressemble
  const slug = g.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return { key: slug, label: String(label), genres: new Set([slug]), related: new Set(), custom: true };
}

const genreInFamily = (genre, family) => {
  const g = normalizeText(genre);
  if (!family || !g) return false;
  if (family.genres.has(g)) return true;
  if (family.custom) {
    const [slug] = family.genres;
    return g.includes(slug) || slug.includes(g);
  }
  return false;
};

const trackGenres = (track) => (track.all_genres && track.all_genres.length ? track.all_genres : [track.track_genre]);

/** Le morceau appartient-il au genre favori ? (on regarde tous les genres sous lesquels il apparaît dans le dataset) */
export const isFavoriteGenreTrack = (track, family) => trackGenres(track).some((g) => genreInFamily(g, family));

/** Le morceau est-il d'un genre voisin (ou d'un genre lié à l'humeur/au contexte) ? */
export function isRelatedGenreTrack(track, family, extraGenres = []) {
  if (isFavoriteGenreTrack(track, family)) return false;
  const extra = new Set(extraGenres.map(normalizeText));
  return trackGenres(track).some((g) => {
    const n = normalizeText(g);
    return (family && family.related.has(n)) || extra.has(n);
  });
}

/** Genre à afficher pour un morceau : celui qui correspond au genre favori s'il existe. */
export function displayGenre(track, family) {
  const match = trackGenres(track).find((g) => genreInFamily(g, family));
  return match || track.track_genre;
}

/* ------------------------------------------------------------------ */
/* Doublons du dataset                                                 */
/* ------------------------------------------------------------------ */
// Dans le dataset Kaggle, un même titre apparaît souvent plusieurs fois (une ligne par genre).
// On les regroupe en une seule entrée avec la liste de tous ses genres.

const catalogCache = new WeakMap();

export function buildCatalog(tracks) {
  if (catalogCache.has(tracks)) return catalogCache.get(tracks);
  const byKey = new Map();
  for (const track of tracks) {
    const key = trackKey(track.track_name, track.artists);
    const existing = byKey.get(key);
    if (existing) {
      if (track.track_genre && !existing.all_genres.includes(track.track_genre)) {
        existing.all_genres.push(track.track_genre);
      }
      existing.alt_ids.add(track.track_id);
      if ((track.popularity ?? 0) > (existing.popularity ?? 0)) existing.popularity = track.popularity;
    } else {
      byKey.set(key, { ...track, all_genres: track.track_genre ? [track.track_genre] : [], alt_ids: new Set([track.track_id]) });
    }
  }
  const catalog = Array.from(byKey.values());
  catalogCache.set(tracks, catalog);
  return catalog;
}

/* ------------------------------------------------------------------ */
/* Humeur + activité + météo -> caractéristiques audio                 */
/* ------------------------------------------------------------------ */

const clamp = (v) => Math.max(0, Math.min(1, v));

/**
 * Renvoie les cibles audio et les genres "d'ambiance" du dataset (sad, sleep, party...)
 * pour une humeur, une activité et une météo données. Les accents sont ignorés
 * ("Fête" = "fete", "Stressé" = "stresse"...).
 */
export function computeAudioTargets(contexte = {}) {
  const mood = normalizeText(contexte.humeur);
  const activity = normalizeText(contexte.contexte_activite);
  const weather = normalizeText(`${contexte.meteo || ""} ${contexte.weatherDescription || ""}`);

  let valence = 0.55;
  let energy = 0.55;
  let dance = 0.55;
  let acoustic = 0.4;
  const moodGenres = new Set();

  if (mood.includes("trist") || mood.includes("melancol") || mood.includes("deprim")) {
    valence = 0.2; energy = 0.3; dance = 0.35; acoustic = 0.7;
    moodGenres.add("sad");
  } else if (mood.includes("joyeu") || mood.includes("heureu") || mood.includes("content")) {
    valence = 0.85; energy = 0.72; dance = 0.75; acoustic = 0.15;
    moodGenres.add("happy");
  } else if (mood.includes("energ") || mood.includes("survolt") || mood.includes("motiv")) {
    valence = 0.75; energy = 0.9; dance = 0.75; acoustic = 0.07;
  } else if (mood.includes("chill") || mood.includes("paisib") || mood.includes("calme") || mood.includes("detendu")) {
    valence = 0.55; energy = 0.35; dance = 0.5; acoustic = 0.6;
    moodGenres.add("chill");
  } else if (mood.includes("nostalg")) {
    valence = 0.45; energy = 0.45; dance = 0.5; acoustic = 0.5;
  } else if (mood.includes("concentr") || mood.includes("focus")) {
    valence = 0.45; energy = 0.35; dance = 0.35; acoustic = 0.65;
    moodGenres.add("study");
  } else if (mood.includes("stress") || mood.includes("anxi")) {
    valence = 0.5; energy = 0.28; dance = 0.4; acoustic = 0.7;
    moodGenres.add("chill");
  } else if (mood.includes("amour") || mood.includes("romant")) {
    valence = 0.65; energy = 0.45; dance = 0.6; acoustic = 0.45;
    moodGenres.add("romance");
  } else if (mood.includes("colere") || mood.includes("enerv") || mood.includes("defoul")) {
    valence = 0.3; energy = 0.95; dance = 0.55; acoustic = 0.03;
  } else if (mood.includes("reveu") || mood.includes("flott")) {
    valence = 0.5; energy = 0.35; dance = 0.4; acoustic = 0.6;
    moodGenres.add("ambient");
  } else if (mood.includes("sombre") || mood.includes("nocturne")) {
    valence = 0.22; energy = 0.5; dance = 0.45; acoustic = 0.3;
  }

  const contextGenres = new Set();
  if (activity.includes("fete") || activity.includes("soiree") || activity.includes("party")) {
    valence = Math.max(0.75, valence); energy = Math.max(0.78, energy); dance = Math.max(0.78, dance); acoustic = Math.min(0.15, acoustic);
    contextGenres.add("party").add("dance");
  } else if (activity.includes("sport") || activity.includes("workout") || activity.includes("muscu") || activity.includes("course")) {
    energy = Math.max(0.85, energy); dance = Math.max(0.68, dance); valence = Math.max(0.55, valence); acoustic = Math.min(0.12, acoustic);
  } else if (activity.includes("enfant") || activity.includes("famille")) {
    valence = Math.max(0.7, valence);
    contextGenres.add("children");
  } else if (activity.includes("voiture") || activity.includes("route") || activity.includes("trajet")) {
    energy = clamp(energy + 0.1);
  } else if (activity.includes("travail") || activity.includes("etude") || activity.includes("revis")) {
    energy = Math.min(0.45, energy); dance = Math.min(0.5, dance); acoustic = Math.max(0.5, acoustic);
    contextGenres.add("study");
  } else if (activity.includes("sommeil") || activity.includes("dorm") || activity.includes("nuit")) {
    energy = Math.min(0.2, energy); dance = Math.min(0.35, dance); acoustic = Math.max(0.75, acoustic); valence = Math.min(valence, 0.5);
    contextGenres.add("sleep");
  } else if (activity.includes("detente") || activity.includes("relax") || activity.includes("lecture")) {
    energy = Math.min(0.35, energy); acoustic = Math.max(0.6, acoustic);
    contextGenres.add("chill");
  } else if (activity.includes("cuisine") || activity.includes("repas")) {
    valence = Math.max(0.6, valence);
  } else if (activity.includes("marche") || activity.includes("balade") || activity.includes("plein air")) {
    energy = clamp(energy + 0.05); valence = Math.max(0.55, valence);
  } else if (activity.includes("romanti") || activity.includes("diner")) {
    energy = Math.min(0.5, energy); acoustic = Math.max(0.45, acoustic);
    contextGenres.add("romance");
  }

  if (weather.includes("soleil") || weather.includes("degage")) valence = clamp(valence + 0.05);
  else if (weather.includes("pluie") || weather.includes("bruine") || weather.includes("averse")) { valence = clamp(valence - 0.07); acoustic = clamp(acoustic + 0.05); }
  else if (weather.includes("orage")) energy = clamp(energy + 0.07);
  else if (weather.includes("neige") || weather.includes("nuage") || weather.includes("couvert") || weather.includes("brouillard")) valence = clamp(valence - 0.03);

  const round = (v) => Number(clamp(v).toFixed(2));
  return {
    targets: {
      target_valence: round(valence),
      target_energy: round(energy),
      target_danceability: round(dance),
      target_acousticness: round(acoustic),
    },
    contextGenres: [...moodGenres, ...contextGenres],
  };
}

/* ------------------------------------------------------------------ */
/* Distance audio                                                      */
/* ------------------------------------------------------------------ */

export function audioDistance(track, targets) {
  // L'énergie et la positivité comptent davantage : ce sont elles qui traduisent l'humeur et le contexte.
  const dV = (Number(track.valence) - targets.target_valence) ** 2 * 1.3;
  const dE = (Number(track.energy) - targets.target_energy) ** 2 * 1.5;
  const dD = (Number(track.danceability) - targets.target_danceability) ** 2;
  const dA = (Number(track.acousticness) - targets.target_acousticness) ** 2 * 0.8;
  return Math.sqrt(dV + dE + dD + dA);
}

/**
 * Distance utilisée pour classer les titres : distance audio + un léger a priori de popularité.
 * Avec 80 000 titres, beaucoup de morceaux inconnus (popularité 0) ont des caractéristiques proches de la cible ;
 * sans ce terme, les playlists seraient remplies de titres obscurs. Poids 0,15 : un titre populaire mais mal adapté
 * reste derrière un titre bien adapté.
 */
export const POPULARITY_WEIGHT = 0.15;
export function rankingDistance(track, targets) {
  return audioDistance(track, targets) + POPULARITY_WEIGHT * (1 - (Number(track.popularity) || 0) / 100);
}

/** Règles strictes par activité (ex. pas de titre explicite avec des enfants). Partagées par le moteur et l'évaluation. */
export function violatesActivity(track, activity) {
  const act = normalizeText(activity);
  const genres = (track.all_genres && track.all_genres.length ? track.all_genres : [track.track_genre]).map(normalizeText);
  if (act.includes("fete") || act.includes("soiree")) {
    if (genres.includes("sad") || genres.includes("classical")) return true;
    if (track.valence < 0.38 || track.energy < 0.5 || track.danceability < 0.48 || track.acousticness > 0.6) return true;
  }
  if (act.includes("sport") || act.includes("workout")) {
    if (genres.includes("sad") || genres.includes("classical")) return true;
    if (track.energy < 0.58 || track.tempo < 95 || track.acousticness > 0.5) return true;
  }
  if (act.includes("sommeil") || act.includes("dormir")) {
    if (track.energy > 0.45 || track.danceability > 0.65 || track.loudness > -7) return true;
  }
  if (act.includes("enfant") && track.explicit) return true;
  return false;
}

/** L'activité impose-t-elle des règles strictes ? */
export function activityHasConstraints(activity) {
  const act = normalizeText(activity);
  return ["fete", "soiree", "sport", "workout", "sommeil", "dormir", "enfant"].some((k) => act.includes(k));
}

export function similarityScore(track, targets) {
  return Math.min(99, Math.round(Math.max(0.1, 1 - audioDistance(track, targets) / 1.9) * 100));
}
