import { ModelInputPayload, ModelOutputPayload, SpotifyTrack } from '../types';
import { KAGGLE_SPOTIFY_TRACKS } from '../data/kaggleSampleDataset';

/**
 * Predict audio targets taking into account Mood, Activity Context, Weather, and User Profile
 */
export function predictAudioTargetsLocally(payload: ModelInputPayload): ModelOutputPayload {
  const { utilisateur, contexte } = payload;
  const mood = (contexte.humeur || '').toLowerCase();
  const activity = (contexte.contexte_activite || '').toLowerCase();
  const weather = (contexte.meteo || '').toLowerCase();
  const rawFavorite = (utilisateur.genre_musical_prefere || '').toLowerCase();
  const hasNoPreference = rawFavorite.includes('pas de préférence') || rawFavorite.includes('aucune') || !rawFavorite;
  const favoriteGenre = hasNoPreference ? '' : rawFavorite;

  // Defaults
  let target_valence = 0.5;
  let target_energy = 0.5;
  let target_danceability = 0.5;
  let target_acousticness = 0.5;
  const genres: Set<string> = new Set();

  // 1. Mood mapping
  if (mood.includes('triste')) {
    target_valence = 0.20;
    target_energy = 0.28;
    target_danceability = 0.20;
    target_acousticness = 0.85;
    genres.add('sad');
    genres.add('acoustic');
  } else if (mood.includes('joyeux')) {
    target_valence = 0.88;
    target_energy = 0.78;
    target_danceability = 0.76;
    target_acousticness = 0.15;
    genres.add('pop');
    genres.add('disco');
  } else if (mood.includes('energetique') || mood.includes('survolté')) {
    target_valence = 0.75;
    target_energy = 0.94;
    target_danceability = 0.85;
    target_acousticness = 0.05;
    genres.add('rock');
    genres.add('dance');
    genres.add('pop');
  } else if (mood.includes('chill') || mood.includes('paisible')) {
    target_valence = 0.52;
    target_energy = 0.38;
    target_danceability = 0.52;
    target_acousticness = 0.65;
    genres.add('indie');
    genres.add('ambient');
  } else if (mood.includes('nostalgique')) {
    target_valence = 0.48;
    target_energy = 0.45;
    target_danceability = 0.55;
    target_acousticness = 0.50;
    genres.add('rock');
    genres.add('pop');
  } else if (mood.includes('concentre')) {
    target_valence = 0.40;
    target_energy = 0.35;
    target_danceability = 0.30;
    target_acousticness = 0.75;
    genres.add('classical');
    genres.add('ambient');
  } else if (mood.includes('stresse') || mood.includes('déstresser')) {
    target_valence = 0.45;
    target_energy = 0.25;
    target_danceability = 0.30;
    target_acousticness = 0.85;
    genres.add('ambient');
    genres.add('acoustic');
  } else if (mood.includes('amoureux') || mood.includes('romantique')) {
    target_valence = 0.65;
    target_energy = 0.42;
    target_danceability = 0.58;
    target_acousticness = 0.60;
    genres.add('r-n-b');
    genres.add('pop');
  } else if (mood.includes('colere') || mood.includes('défouloir')) {
    target_valence = 0.30;
    target_energy = 0.98;
    target_danceability = 0.65;
    target_acousticness = 0.02;
    genres.add('rock');
    genres.add('metal');
  } else if (mood.includes('motivant')) {
    target_valence = 0.80;
    target_energy = 0.90;
    target_danceability = 0.78;
    target_acousticness = 0.08;
    genres.add('hip-hop');
    genres.add('rock');
  } else {
    // Default
    target_valence = 0.55;
    target_energy = 0.55;
    target_danceability = 0.50;
    target_acousticness = 0.45;
  }

  // 2. Activity Context modulation
  if (activity.includes('fete') || activity.includes('soirée')) {
    target_energy = Math.min(1.0, target_energy + 0.15);
    target_danceability = Math.min(1.0, target_danceability + 0.20);
    genres.add('disco');
    genres.add('dance');
  } else if (activity.includes('enfant') || activity.includes('famille')) {
    target_valence = Math.max(0.6, target_valence + 0.15);
    genres.add('children');
    genres.add('pop');
  } else if (activity.includes('voiture')) {
    target_energy = Math.min(1.0, target_energy + 0.08);
    genres.add('rock');
    genres.add('indie');
  } else if (activity.includes('sport')) {
    target_energy = Math.min(1.0, target_energy + 0.20);
    target_danceability = Math.min(1.0, target_danceability + 0.15);
    genres.add('dance');
    genres.add('hip-hop');
  } else if (activity.includes('travail') || activity.includes('études')) {
    target_energy = Math.max(0.15, target_energy - 0.15);
    genres.add('ambient');
    genres.add('classical');
  } else if (activity.includes('detente') || activity.includes('sommeil')) {
    target_acousticness = Math.min(1.0, target_acousticness + 0.20);
    target_energy = Math.max(0.10, target_energy - 0.25);
    genres.add('ambient');
    genres.add('acoustic');
  }

  // 3. Weather modulation
  if (weather.includes('pluie') || weather.includes('brume')) {
    target_acousticness = Math.min(1.0, target_acousticness + 0.12);
    target_energy = Math.max(0.08, target_energy - 0.10);
    genres.add('rainy');
    genres.add('acoustic');
  } else if (weather.includes('soleil')) {
    target_valence = Math.min(1.0, target_valence + 0.08);
  } else if (weather.includes('orage')) {
    target_energy = Math.min(1.0, target_energy + 0.15);
    genres.add('rock');
  }

  // 4. User profile favorite genre
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
    genres_recommandes: Array.from(genres).slice(0, 4)
  };
}

/**
 * Score and rank tracks from the dataset
 */
export function rankTracksFromDataset(
  targets: ModelOutputPayload['spotify_audio_features_targets'],
  recommendedGenres: string[],
  favoriteArtist?: string,
  tracksPool: SpotifyTrack[] = KAGGLE_SPOTIFY_TRACKS
): SpotifyTrack[] {
  const { target_valence, target_energy, target_danceability, target_acousticness } = targets;

  const scoredTracks = tracksPool.map((track) => {
    const dValence = Math.pow(track.valence - target_valence, 2);
    const dEnergy = Math.pow(track.energy - target_energy, 2);
    const dDance = Math.pow(track.danceability - target_danceability, 2);
    const dAcoustic = Math.pow(track.acousticness - target_acousticness, 2);

    let distance = Math.sqrt(dValence + dEnergy + dDance + dAcoustic);

    // Genre bonus
    const isGenreMatch = recommendedGenres.some(
      (g) => g.toLowerCase() === track.track_genre.toLowerCase()
    );
    if (isGenreMatch) {
      distance *= 0.75;
    }

    // Favorite artist bonus
    if (favoriteArtist && favoriteArtist.trim().length > 1) {
      if (track.artists.toLowerCase().includes(favoriteArtist.toLowerCase().trim())) {
        distance *= 0.50; // strong boost
      }
    }

    const rawScore = Math.max(0, 1 - distance / 2);
    const similarity_score = Math.min(99, Math.round(rawScore * 100));

    return {
      ...track,
      similarity_score
    };
  });

  return scoredTracks.sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));
}
