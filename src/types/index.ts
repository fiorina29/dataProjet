/**
 * Data structures for the Spotify & YouTube Mood, Context & Weather Playlist Generator
 */

export interface UserProfile {
  nom: string;
  prenom: string;
  email: string;
  age: number;
  genre_musical_prefere: string;
  artiste_prefere: string;
  ville: string;
}

export interface UserContext {
  humeur: string;
  contexte_activite: string; // e.g. 'voiture', 'fete', 'enfant', 'sport', 'travail', 'detente'
  meteo: string;
}

export interface LiveWeatherState {
  ville: string;
  isDeviceGps: boolean;
  latitude?: number;
  longitude?: number;
  conditionId: string; // 'pluie', 'soleil', 'nuageux', 'orage', 'neige', 'brume'
  description: string;
  temperature: number;
  humidity?: number;
  windSpeed?: number;
  isLoading: boolean;
  error?: string | null;
  lastUpdated?: Date;
}

// Request sent to the ML Model
export interface ModelInputPayload {
  utilisateur: {
    age: number;
    genre_musical_prefere: string;
    artiste_prefere?: string;
    ville: string;
  };
  contexte: {
    humeur: string;
    contexte_activite?: string;
    meteo: string;
  };
}

export interface AudioFeaturesTargets {
  target_valence: number;
  target_energy: number;
  target_danceability: number;
  target_acousticness: number;
}

export interface ModelOutputPayload {
  spotify_audio_features_targets: AudioFeaturesTargets;
  genres_recommandes: string[];
}

export interface SpotifyTrack {
  track_id: string;
  artists: string;
  album_name: string;
  track_name: string;
  popularity: number;
  duration_ms: number;
  explicit: boolean;
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
  time_signature: number;
  track_genre: string;
  similarity_score?: number;
}

export interface ServiceAuthStatus {
  spotify: {
    isConnected: boolean;
    displayName: string;
  };
  youtube: {
    isConnected: boolean;
    displayName: string;
  };
}

export interface CuratedTrackSuggestion {
  track_name: string;
  artists: string;
  reason: string;
}

export interface AiPlaylistResult {
  success: boolean;
  isAiGenerated: boolean;
  model: string;
  durationMs?: number;
  playlist_title?: string;
  playlist_description?: string;
  ai_reasoning?: string;
  spotify_audio_features_targets: AudioFeaturesTargets;
  genres_recommandes: string[];
  vibe_keywords?: string[];
  curated_tracks?: CuratedTrackSuggestion[];
  error?: string;
}

export interface AiStatusState {
  status: 'online' | 'unconfigured' | 'checking';
  hasKey: boolean;
  primaryModel: string;
  fallbackModel: string;
  lastChecked?: string;
}

export interface AiTestResult {
  success: boolean;
  model?: string;
  prompt: string;
  response?: string;
  durationMs?: number;
  error?: string;
  timestamp?: string;
}
