import { KAGGLE_SPOTIFY_TRACKS } from "../data/kaggleSampleDataset";
export function matchesGenre(trackGenre, testGenre) {
  if (!trackGenre || !testGenre) return false;
  const tg = trackGenre.toLowerCase().trim();
  const ug = testGenre.toLowerCase().trim();
  if (tg === ug) return true;
  if (ug.includes("pop") && tg.includes("pop")) return true;
  if (ug.includes("rock") && (tg.includes("rock") || tg.includes("metal"))) return true;
  if (ug.includes("indie") && (tg.includes("indie") || tg.includes("rock"))) return true;
  if ((ug.includes("\xE9lectro") || ug.includes("electro") || ug.includes("dance") || ug.includes("edm") || ug.includes("synthwave")) && (tg.includes("dance") || tg.includes("disco") || tg.includes("electronic") || tg.includes("edm"))) return true;
  if ((ug.includes("hip-hop") || ug.includes("rap")) && (tg.includes("hip-hop") || tg.includes("rap"))) return true;
  if ((ug.includes("acoustique") || ug.includes("folk")) && (tg.includes("acoustic") || tg.includes("folk"))) return true;
  if ((ug.includes("jazz") || ug.includes("blues")) && (tg.includes("jazz") || tg.includes("blues"))) return true;
  if (ug.includes("classique") && tg.includes("classical")) return true;
  if (ug.includes("ambient") && (tg.includes("ambient") || tg.includes("chill"))) return true;
  if (ug.includes("disco") && (tg.includes("disco") || tg.includes("funk") || tg.includes("dance"))) return true;
  if (ug.includes("metal") && tg.includes("metal")) return true;
  if (ug.includes("enfants") && tg.includes("children")) return true;
  if (ug.includes("latino") && tg.includes("latino")) return true;
  if (ug.includes("r&b") && (tg.includes("r-n-b") || tg.includes("pop"))) return true;
  return false;
}
export function predictAudioTargetsLocally(payload) {
  const { utilisateur, contexte } = payload;
  const mood = (contexte.humeur || "").toLowerCase();
  const activity = (contexte.contexte_activite || "").toLowerCase();
  const weather = (contexte.meteo || "").toLowerCase();
  const rawFavorite = (utilisateur.genre_musical_prefere || "").toLowerCase();
  const hasNoPreference = rawFavorite.includes("pas de pr\xE9f\xE9rence") || rawFavorite.includes("aucune") || !rawFavorite;
  const favoriteGenre = hasNoPreference ? "" : rawFavorite;
  let target_valence = 0.55;
  let target_energy = 0.55;
  let target_danceability = 0.55;
  let target_acousticness = 0.4;
  const genres = /* @__PURE__ */ new Set();
  if (mood.includes("triste")) {
    target_valence = 0.2;
    target_energy = 0.25;
    target_danceability = 0.25;
    target_acousticness = 0.85;
    genres.add("sad");
    genres.add("acoustic");
  } else if (mood.includes("joyeux")) {
    target_valence = 0.88;
    target_energy = 0.78;
    target_danceability = 0.8;
    target_acousticness = 0.12;
    genres.add("pop");
    genres.add("disco");
  } else if (mood.includes("energetique") || mood.includes("survolt\xE9")) {
    target_valence = 0.8;
    target_energy = 0.95;
    target_danceability = 0.85;
    target_acousticness = 0.05;
    genres.add("rock");
    genres.add("dance");
    genres.add("hip-hop");
  } else if (mood.includes("chill") || mood.includes("paisible")) {
    target_valence = 0.55;
    target_energy = 0.35;
    target_danceability = 0.5;
    target_acousticness = 0.65;
    genres.add("indie");
    genres.add("ambient");
  } else if (mood.includes("nostalgique")) {
    target_valence = 0.5;
    target_energy = 0.5;
    target_danceability = 0.55;
    target_acousticness = 0.45;
    genres.add("rock");
    genres.add("pop");
  } else if (mood.includes("concentre")) {
    target_valence = 0.45;
    target_energy = 0.35;
    target_danceability = 0.3;
    target_acousticness = 0.75;
    genres.add("classical");
    genres.add("ambient");
  } else if (mood.includes("stresse") || mood.includes("d\xE9stresser")) {
    target_valence = 0.5;
    target_energy = 0.25;
    target_danceability = 0.35;
    target_acousticness = 0.8;
    genres.add("ambient");
    genres.add("acoustic");
  } else if (mood.includes("amoureux") || mood.includes("romantique")) {
    target_valence = 0.7;
    target_energy = 0.45;
    target_danceability = 0.6;
    target_acousticness = 0.5;
    genres.add("pop");
    genres.add("r-n-b");
  } else if (mood.includes("colere") || mood.includes("d\xE9fouloir")) {
    target_valence = 0.35;
    target_energy = 0.98;
    target_danceability = 0.65;
    target_acousticness = 0.02;
    genres.add("rock");
    genres.add("metal");
  } else if (mood.includes("motivant")) {
    target_valence = 0.85;
    target_energy = 0.92;
    target_danceability = 0.8;
    target_acousticness = 0.05;
    genres.add("hip-hop");
    genres.add("rock");
  }
  if (activity.includes("fete") || activity.includes("soir\xE9e")) {
    target_valence = Math.max(0.85, target_valence);
    target_energy = Math.max(0.8, target_energy);
    target_danceability = Math.max(0.8, target_danceability);
    target_acousticness = Math.min(0.1, target_acousticness);
    genres.add("dance");
    genres.add("disco");
    genres.add("pop");
  } else if (activity.includes("sport") || activity.includes("workout")) {
    target_energy = Math.max(0.9, target_energy);
    target_danceability = Math.max(0.72, target_danceability);
    target_valence = Math.max(0.65, target_valence);
    target_acousticness = Math.min(0.1, target_acousticness);
    genres.add("hip-hop");
    genres.add("rock");
    genres.add("dance");
  } else if (activity.includes("enfant") || activity.includes("famille")) {
    target_valence = Math.max(0.7, target_valence);
    genres.add("children");
    genres.add("pop");
  } else if (activity.includes("voiture")) {
    target_energy = Math.min(1, target_energy + 0.1);
    genres.add("rock");
    genres.add("indie");
    genres.add("dance");
  } else if (activity.includes("travail") || activity.includes("\xE9tudes")) {
    target_energy = Math.min(0.4, target_energy);
    genres.add("ambient");
    genres.add("classical");
  } else if (activity.includes("detente") || activity.includes("sommeil")) {
    target_acousticness = Math.max(0.7, target_acousticness);
    target_energy = Math.min(0.25, target_energy);
    genres.add("ambient");
    genres.add("acoustic");
  }
  if (weather.includes("soleil")) {
    target_valence = Math.min(1, target_valence + 0.05);
  } else if (weather.includes("orage")) {
    target_energy = Math.min(1, target_energy + 0.08);
  }
  if (favoriteGenre) {
    genres.add(favoriteGenre);
  }
  return {
    spotify_audio_features_targets: {
      target_valence: Number(target_valence.toFixed(2)),
      target_energy: Number(target_energy.toFixed(2)),
      target_danceability: Number(target_danceability.toFixed(2)),
      target_acousticness: Number(target_acousticness.toFixed(2))
    },
    genres_recommandes: Array.from(genres).slice(0, 5)
  };
}
export function rankTracksFromDataset(targets, recommendedGenres, favoriteArtist, favoriteGenre, activityContext, mood, tracksPool = KAGGLE_SPOTIFY_TRACKS, aiCuratedTracks) {
  const { target_valence, target_energy, target_danceability, target_acousticness } = targets;
  const act = (activityContext || "").toLowerCase();
  const md = (mood || "").toLowerCase();
  const curatedMap = /* @__PURE__ */ new Map();
  if (aiCuratedTracks && aiCuratedTracks.length > 0) {
    for (const item of aiCuratedTracks) {
      const key = `${item.track_name.toLowerCase().trim()}|${item.artists.toLowerCase().trim()}`;
      curatedMap.set(key, item);
      curatedMap.set(item.track_name.toLowerCase().trim(), item);
    }
  }
  const workingPool = tracksPool.map((t) => {
    const fullKey = `${t.track_name.toLowerCase().trim()}|${t.artists.toLowerCase().trim()}`;
    const nameKey = t.track_name.toLowerCase().trim();
    const artistKey = t.artists.toLowerCase().trim();
    const curated = curatedMap.get(fullKey) || curatedMap.get(nameKey) || (favoriteArtist && artistKey.includes(favoriteArtist.toLowerCase().trim()) ? { track_name: t.track_name, artists: t.artists, reason: `S\xE9lectionn\xE9 par l'IA pour correspondre \xE0 votre artiste favori ${favoriteArtist} et au contexte ${activityContext || "actuel"}` } : void 0);
    if (curated) {
      return {
        ...t,
        is_curated: true,
        curation_reason: curated.reason
      };
    }
    return { ...t };
  });
  const filteredPool = workingPool.filter((track) => {
    if (track.is_curated) return true;
    if (act.includes("fete") || act.includes("soir\xE9e")) {
      if (track.track_genre === "sad") return false;
      if (track.track_genre === "classical") return false;
      if (track.valence < 0.38) return false;
      if (track.energy < 0.5) return false;
      if (track.danceability < 0.48) return false;
      if (track.acousticness > 0.6) return false;
    }
    if (act.includes("sport") || act.includes("workout")) {
      if (track.track_genre === "sad") return false;
      if (track.track_genre === "classical") return false;
      if (track.energy < 0.58) return false;
      if (track.tempo < 95) return false;
      if (track.acousticness > 0.5) return false;
    }
    if (act.includes("sommeil")) {
      if (track.energy > 0.45) return false;
      if (track.danceability > 0.65) return false;
      if (track.loudness > -7) return false;
    }
    if (act.includes("enfant")) {
      if (track.explicit) return false;
    }
    return true;
  });
  let candidates = filteredPool;
  if (candidates.length < 20) {
    const remaining = workingPool.filter((t) => !candidates.some((c) => c.track_id === t.track_id));
    candidates = [...candidates, ...remaining];
  }
  const scoredTracks = candidates.map((track) => {
    const dValence = Math.pow(track.valence - target_valence, 2);
    const dEnergy = Math.pow(track.energy - target_energy, 2);
    const dDance = Math.pow(track.danceability - target_danceability, 2);
    const dAcoustic = Math.pow(track.acousticness - target_acousticness, 2);
    let distance = Math.sqrt(dValence + dEnergy + dDance + dAcoustic);
    if (track.is_curated) {
      distance *= 0.2;
    }
    const isArtistMatch = Boolean(
      favoriteArtist && favoriteArtist.trim().length > 1 && track.artists.toLowerCase().includes(favoriteArtist.toLowerCase().trim())
    );
    if (isArtistMatch) {
      distance *= 0.35;
    }
    const isUserGenreMatch = Boolean(
      favoriteGenre && !favoriteGenre.toLowerCase().includes("pas de pr\xE9f\xE9rence") && matchesGenre(track.track_genre, favoriteGenre)
    );
    if (isUserGenreMatch) {
      distance *= 0.55;
    }
    if (isArtistMatch && isUserGenreMatch) {
      distance *= 0.3;
    }
    const isRecommendedGenreMatch = recommendedGenres.some((g) => matchesGenre(track.track_genre, g));
    if (isRecommendedGenreMatch) {
      distance *= 0.75;
    }
    if ((act.includes("fete") || act.includes("soir\xE9e")) && track.danceability >= 0.75 && track.valence >= 0.75) {
      distance *= 0.7;
    }
    if ((act.includes("sport") || act.includes("workout")) && track.energy >= 0.85 && track.tempo >= 120) {
      distance *= 0.7;
    }
    const rawScore = Math.max(0.1, 1 - distance / 1.7);
    const similarity_score = Math.min(99, Math.round(rawScore * 100));
    return {
      ...track,
      similarity_score
    };
  });
  const sorted = scoredTracks.sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));
  return sorted;
}
