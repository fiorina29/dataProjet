import { KAGGLE_SPOTIFY_TRACKS } from "../data/kaggleSampleDataset";
import {
  normalizeText,
  trackKey,
  resolveGenreFamily,
  isFavoriteGenreTrack,
  displayGenre,
  buildCatalog,
  computeAudioTargets,
} from "../data/moodwaveRules";

/**
 * Vrai si deux genres sont de la même famille
 * (ex. "Rap" et "hip-hop", "Électro" et "house", "Classique" et "classical").
 * Accepte un genre texte ou un morceau (avec tous ses genres).
 */
function matchesGenre(trackGenreOrTrack, testGenre) {
  if (!trackGenreOrTrack || !testGenre) return false;
  const track = typeof trackGenreOrTrack === "string" ? { track_genre: trackGenreOrTrack } : trackGenreOrTrack;
  const family = resolveGenreFamily(testGenre);
  if (family && isFavoriteGenreTrack(track, family)) return true;
  if (typeof trackGenreOrTrack === "string") {
    const reverse = resolveGenreFamily(trackGenreOrTrack);
    return Boolean(reverse && isFavoriteGenreTrack({ track_genre: testGenre }, reverse));
  }
  return false;
}

/** Cibles audio calculées à partir de l'humeur, de l'activité et de la météo (accents ignorés). */
function predictAudioTargetsLocally(payload) {
  const { utilisateur = {}, contexte = {} } = payload || {};
  const { targets, contextGenres } = computeAudioTargets(contexte);
  const family = resolveGenreFamily(utilisateur.genre_musical_prefere);
  const genres = family ? [utilisateur.genre_musical_prefere, ...contextGenres] : contextGenres;
  return {
    spotify_audio_features_targets: targets,
    genres_recommandes: Array.from(new Set(genres)).slice(0, 5),
  };
}

/**
 * Classement final : même logique que la version d'origine (bonus IA, artiste favori, genre favori,
 * genres recommandés, puis tri par score), avec trois corrections :
 *  - le genre favori est reconnu par famille ("Hip-Hop" / "Rap" = hip-hop, "Électro" = edm/house...) ;
 *  - les accents ne cassent plus les règles d'activité ("Fête", "Soirée"...) ;
 *  - les doublons du dataset (même titre dans plusieurs genres) n'apparaissent qu'une fois.
 */
function rankTracksFromDataset(
  targets,
  recommendedGenres = [],
  favoriteArtist,
  favoriteGenre,
  activityContext,
  mood,
  tracksPool = KAGGLE_SPOTIFY_TRACKS,
  aiCuratedTracks = []
) {
  const { target_valence, target_energy, target_danceability, target_acousticness } = targets;
  const act = normalizeText(activityContext);
  const family = resolveGenreFamily(favoriteGenre);
  const artist = normalizeText(favoriteArtist);
  const hasFavoriteArtist = artist.length > 1 && !artist.includes("pas de pref") && !artist.includes("aucun");
  const otherGenres = (recommendedGenres || []).filter((g) => normalizeText(g) !== normalizeText(favoriteGenre));

  // Index des propositions de l'IA (par identifiant, par titre+artistes, puis par titre seul)
  const curatedById = new Map();
  const curatedByKey = new Map();
  const curatedByName = new Map();
  (aiCuratedTracks || []).forEach((item, index) => {
    const entry = { ...item, aiRank: index };
    if (item.track_id) curatedById.set(item.track_id, entry);
    curatedByKey.set(trackKey(item.track_name, item.artists), entry);
    if (!curatedByName.has(normalizeText(item.track_name))) curatedByName.set(normalizeText(item.track_name), entry);
  });

  const workingPool = buildCatalog(tracksPool).map((t) => {
    const isArtistMatch = hasFavoriteArtist && normalizeText(t.artists).includes(artist);
    const curated =
      [...(t.alt_ids || [t.track_id])].map((id) => curatedById.get(id)).find(Boolean) ||
      curatedByKey.get(trackKey(t.track_name, t.artists)) ||
      curatedByName.get(normalizeText(t.track_name)) ||
      (isArtistMatch
        ? { reason: `Sélectionné pour correspondre à votre artiste favori ${favoriteArtist} et au contexte ${activityContext || "actuel"}`, aiRank: 999 }
        : undefined);
    const base = { ...t, isArtistMatch, track_genre: displayGenre(t, family) };
    return curated ? { ...base, is_curated: true, curation_reason: curated.reason, aiRank: curated.aiRank } : { ...base, aiRank: 1000 };
  });

  const isParty = act.includes("fete") || act.includes("soiree");
  const isSport = act.includes("sport") || act.includes("workout");
  const genreOf = (t) => (t.all_genres && t.all_genres.length ? t.all_genres : [t.track_genre]).map(normalizeText);

  const filteredPool = workingPool.filter((track) => {
    if (track.is_curated) return true;
    const g = genreOf(track);
    if (isParty) {
      if (g.includes("sad") || g.includes("classical")) return false;
      if (track.valence < 0.38 || track.energy < 0.5 || track.danceability < 0.48 || track.acousticness > 0.6) return false;
    }
    if (isSport) {
      if (g.includes("sad") || g.includes("classical")) return false;
      if (track.energy < 0.58 || track.tempo < 95 || track.acousticness > 0.5) return false;
    }
    if (act.includes("sommeil")) {
      if (track.energy > 0.45 || track.danceability > 0.65 || track.loudness > -7) return false;
    }
    if (act.includes("enfant") && track.explicit) return false;
    return true;
  });

  let candidates = filteredPool;
  if (candidates.length < 20) {
    const ids = new Set(candidates.map((c) => c.track_id));
    candidates = [...candidates, ...workingPool.filter((t) => !ids.has(t.track_id))];
  }

  const scoredTracks = candidates.map((track) => {
    const dValence = Math.pow(track.valence - target_valence, 2);
    const dEnergy = Math.pow(track.energy - target_energy, 2);
    const dDance = Math.pow(track.danceability - target_danceability, 2);
    const dAcoustic = Math.pow(track.acousticness - target_acousticness, 2);
    let distance = Math.sqrt(dValence + dEnergy + dDance + dAcoustic);

    if (track.is_curated) distance *= 0.2;
    if (track.isArtistMatch) distance *= 0.35;
    const isUserGenreMatch = Boolean(family) && isFavoriteGenreTrack(track, family);
    if (isUserGenreMatch) distance *= 0.55;
    if (track.isArtistMatch && isUserGenreMatch) distance *= 0.3;
    if (otherGenres.some((g) => matchesGenre(track, g))) distance *= 0.75;
    if (isParty && track.danceability >= 0.75 && track.valence >= 0.75) distance *= 0.7;
    if (isSport && track.energy >= 0.85 && track.tempo >= 120) distance *= 0.7;

    const rawScore = Math.max(0.1, 1 - distance / 1.7);
    return { ...track, similarity_score: Math.min(99, Math.round(rawScore * 100)) };
  });

  return scoredTracks
    .sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0) || a.aiRank - b.aiRank)
    .map(({ isArtistMatch, aiRank, alt_ids, all_genres, ...track }) => track);
}

export {
  matchesGenre,
  predictAudioTargetsLocally,
  rankTracksFromDataset
};
