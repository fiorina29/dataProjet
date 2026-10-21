/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { TopBar } from './components/TopBar';
import { LandingHeroPage } from './components/LandingHeroPage';
import { MoodAndWeatherSelector } from './components/MoodAndWeatherSelector';
import { TracksDataTable } from './components/TracksDataTable';
import { MyAccountPage } from './components/MyAccountPage';
import { RegistrationModal } from './components/RegistrationModal';
import { LoginModal } from './components/LoginModal';
import { ExportPlaylistModal } from './components/ExportPlaylistModal';
import { GeminiAiTestModal } from './components/GeminiAiTestModal';
import { AiGenerationInsights } from './components/AiGenerationInsights';
import {
  UserProfile,
  LiveWeatherState,
  SpotifyTrack,
  ServiceAuthStatus,
  AiStatusState,
  AiPlaylistResult,
} from './types';
import {
  predictAudioTargetsLocally,
  rankTracksFromDataset,
} from './services/recommendationEngine';
import { fetchAiStatus, fetchAiPlaylistPrediction } from './services/geminiService';
import { KAGGLE_SPOTIFY_TRACKS } from './data/kaggleSampleDataset';

export default function App() {
  // Navigation: 'home' | 'generator' | 'account'
  const [activeTab, setActiveTab] = useState<'home' | 'generator' | 'account'>('generator');

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('moodwave_user_profile_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    // Default logged in profile
    return {
      nom: 'Dupont',
      prenom: 'Alexandre',
      email: 'alexandre.dupont@email.com',
      age: 22,
      genre_musical_prefere: 'Pas de préférence',
      artiste_prefere: 'Daft Punk',
      ville: 'Paris',
    };
  });

  // Current Mood and Context (must be chosen by user before generation)
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedContext, setSelectedContext] = useState<string>('');
  const [hasGeneratedPlaylist, setHasGeneratedPlaylist] = useState<boolean>(false);

  // Live real-time Weather state
  const [weatherState, setWeatherState] = useState<LiveWeatherState>({
    ville: userProfile?.ville || 'Paris',
    isDeviceGps: true,
    conditionId: 'soleil',
    description: 'Ciel dégagé / Ensoleillé',
    temperature: 21,
    humidity: 55,
    windSpeed: 10,
    isLoading: false,
    lastUpdated: new Date(),
  });

  // Streaming Accounts Status (Spotify & YouTube)
  const [authStatus, setAuthStatus] = useState<ServiceAuthStatus>({
    spotify: {
      isConnected: true,
      displayName: userProfile ? `${userProfile.prenom} (Spotify Premium)` : 'Connecté',
    },
    youtube: {
      isConnected: true,
      displayName: userProfile ? `${userProfile.prenom} (YouTube Music)` : 'Connecté',
    },
  });

  // AI Engine State
  const [isAiMode, setIsAiMode] = useState(true);
  const [aiStatus, setAiStatus] = useState<AiStatusState>({
    status: 'checking',
    hasKey: true,
    primaryModel: 'gemini-3.8-flash',
    fallbackModel: 'gemini-3.1-flash-lite',
  });
  const [aiResult, setAiResult] = useState<AiPlaylistResult | null>(null);
  const [isAiTestModalOpen, setIsAiTestModalOpen] = useState(false);

  // Modals
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [tracksToExport, setTracksToExport] = useState<SpotifyTrack[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load AI status from server
  const loadAiStatus = useCallback(async () => {
    const status = await fetchAiStatus();
    setAiStatus(status);
  }, []);

  useEffect(() => {
    loadAiStatus();
  }, [loadAiStatus]);

  // Save profile handler
  const handleSaveProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('moodwave_user_profile_v2', JSON.stringify(profile));
    setActiveTab('generator');
  };

  const handleLogout = () => {
    setUserProfile(null);
    localStorage.removeItem('moodwave_user_profile_v2');
    setActiveTab('home');
  };

  const handleLoginSuccess = (email: string) => {
    const newProfile: UserProfile = {
      nom: 'Dupont',
      prenom: 'Alexandre',
      email: email,
      age: 22,
      genre_musical_prefere: 'Pas de préférence',
      artiste_prefere: 'Daft Punk',
      ville: 'Paris',
    };
    handleSaveProfile(newProfile);
  };

  // Local heuristic fallback Model Inference
  const mlOutput = useMemo(() => {
    return predictAudioTargetsLocally({
      utilisateur: {
        age: userProfile?.age || 22,
        genre_musical_prefere: userProfile?.genre_musical_prefere || 'Pas de préférence',
        artiste_prefere: userProfile?.artiste_prefere,
        ville: userProfile?.ville || weatherState.ville,
      },
      contexte: {
        humeur: selectedMood || 'joyeux',
        contexte_activite: selectedContext || 'voiture',
        meteo: weatherState.conditionId,
      },
    });
  }, [userProfile, selectedMood, selectedContext, weatherState.conditionId, weatherState.ville]);

  const [generationError, setGenerationError] = useState<string | null>(null);

  // Real Gemini AI Generation trigger — ONLY when user clicks on "Générer la playlist"
  const executeGeneration = useCallback(async () => {
    if (!selectedMood || !selectedContext) {
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      if (isAiMode) {
        const result = await fetchAiPlaylistPrediction({
          utilisateur: {
            age: userProfile?.age || 22,
            genre_musical_prefere: userProfile?.genre_musical_prefere || 'Pas de préférence',
            artiste_prefere: userProfile?.artiste_prefere,
            ville: userProfile?.ville || weatherState.ville,
          },
          contexte: {
            humeur: selectedMood,
            contexte_activite: selectedContext,
            meteo: weatherState.conditionId,
          },
          temperature: weatherState.temperature,
          weatherDescription: weatherState.description,
        });
        setAiResult(result);
      }
      setHasGeneratedPlaylist(true);
    } catch (err: any) {
      console.error('Gemini AI call failed:', err);
      setGenerationError(err.message || "Erreur de génération par l'IA");
      setHasGeneratedPlaylist(false);
    } finally {
      setIsGenerating(false);
    }
  }, [isAiMode, userProfile, weatherState, selectedMood, selectedContext]);

  // Compute effective targets and genres
  const effectiveTargets = useMemo(() => {
    if (isAiMode && aiResult?.spotify_audio_features_targets) {
      return aiResult.spotify_audio_features_targets;
    }
    return mlOutput.spotify_audio_features_targets;
  }, [isAiMode, aiResult, mlOutput]);

  const effectiveGenres = useMemo(() => {
    if (isAiMode && aiResult?.genres_recommandes && aiResult.genres_recommandes.length > 0) {
      return aiResult.genres_recommandes;
    }
    return mlOutput.genres_recommandes;
  }, [isAiMode, aiResult, mlOutput]);

  // Ranked tracks adapting strictly to chosen context and user musical tastes (artist + genre) from retrieved database
  const rankedTracks = useMemo(() => {
    if (!hasGeneratedPlaylist) return [];
    return rankTracksFromDataset(
      effectiveTargets,
      effectiveGenres,
      userProfile?.artiste_prefere,
      userProfile?.genre_musical_prefere,
      selectedContext,
      selectedMood,
      KAGGLE_SPOTIFY_TRACKS,
      aiResult?.curated_tracks
    );
  }, [
    hasGeneratedPlaylist,
    effectiveTargets,
    effectiveGenres,
    userProfile?.artiste_prefere,
    userProfile?.genre_musical_prefere,
    selectedContext,
    selectedMood,
    aiResult?.curated_tracks
  ]);

  const handleOpenExportModal = (tracks: SpotifyTrack[]) => {
    setTracksToExport(tracks);
    setIsExportModalOpen(true);
  };

  return (
    <div className="min-h-screen text-slate-800 flex flex-col selection:bg-pink-500 selection:text-white">
      {/* 1. Header Navigation */}
      <TopBar
        profile={userProfile}
        authStatus={authStatus}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSignUp={() => setIsSignUpModalOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        aiStatus={aiStatus}
        onOpenAiTest={() => setIsAiTestModalOpen(true)}
      />

      {/* 2. Main Page Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Landing View (Home) */}
        {activeTab === 'home' && (
          <LandingHeroPage
            onOpenSignUp={() => setIsSignUpModalOpen(true)}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onContinueAsGuest={() => setActiveTab('generator')}
          />
        )}

        {/* Generator View */}
        {activeTab === 'generator' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Mood, Activity Context & Device GPS Weather */}
            <MoodAndWeatherSelector
              profile={
                userProfile || {
                  nom: '',
                  prenom: 'Invité',
                  email: '',
                  age: 22,
                  genre_musical_prefere: 'Pas de préférence',
                  artiste_prefere: '',
                  ville: 'Paris',
                }
              }
              selectedMood={selectedMood}
              onSelectMood={setSelectedMood}
              selectedContext={selectedContext}
              onSelectContext={setSelectedContext}
              weatherState={weatherState}
              onUpdateWeather={setWeatherState}
              onGenerate={executeGeneration}
              isLoading={isGenerating}
              isAiMode={isAiMode}
              onOpenAiTest={() => setIsAiTestModalOpen(true)}
            />

            {/* Error Notification if Gemini fails */}
            {generationError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-sm flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <div>
                    <strong className="font-bold">Erreur de génération IA (HTTP 500) :</strong> {generationError}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={executeGeneration}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all shrink-0"
                >
                  Réessayer
                </button>
              </div>
            )}

            {/* Only display the playlist after the user has explicitly clicked on "Générer la playlist" */}
            {!hasGeneratedPlaylist ? (
              <div className="rounded-3xl border border-dashed border-violet-200/90 bg-white/70 p-8 sm:p-12 text-center space-y-4 shadow-xs">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-100 to-pink-100 text-violet-600 shadow-xs">
                  <Sparkles className="h-8 w-8 text-violet-600 animate-pulse" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Prêt à créer votre playlist sur-mesure ?
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sélectionnez votre <strong>humeur</strong> et votre <strong>contexte d'activité</strong> ci-dessus, puis cliquez sur <strong>« Générer la playlist »</strong>. L'IA sélectionnera les 20 meilleurs morceaux de notre base de données selon vos préférences d'inscription, votre humeur et la météo.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                  <span className={`px-3 py-1 rounded-full font-bold border transition-all ${selectedMood ? 'bg-violet-50 text-violet-700 border-violet-200 shadow-2xs' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {selectedMood ? `✓ Humeur : ${selectedMood}` : '1. Choisir une humeur'}
                  </span>
                  <span className={`px-3 py-1 rounded-full font-bold border transition-all ${selectedContext ? 'bg-pink-50 text-pink-700 border-pink-200 shadow-2xs' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {selectedContext ? `✓ Contexte : ${selectedContext}` : '2. Choisir un contexte'}
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* AI Insights & Reasoning Banner (Audio targets & parameters ONLY, no song list) */}
                <AiGenerationInsights
                  aiResult={aiResult}
                  isLoading={isGenerating}
                  onOpenTestModal={() => setIsAiTestModalOpen(true)}
                  onRegenerate={executeGeneration}
                  isAiMode={isAiMode}
                  onToggleAiMode={setIsAiMode}
                  profile={userProfile}
                  selectedContext={selectedContext}
                  selectedMood={selectedMood}
                />

                {/* THE ONLY MUSIC LIST: "Votre Playlist" */}
                <TracksDataTable
                  tracks={rankedTracks}
                  onOpenExportModal={handleOpenExportModal}
                  favoriteArtist={userProfile?.artiste_prefere}
                  selectedContext={selectedContext}
                />
              </>
            )}
          </div>
        )}

        {/* Account View */}
        {activeTab === 'account' && userProfile && (
          <div className="animate-in fade-in duration-200">
            <MyAccountPage
              profile={userProfile}
              authStatus={authStatus}
              onEditProfile={() => setIsSignUpModalOpen(true)}
              onToggleSpotify={() =>
                setAuthStatus((prev) => ({
                  ...prev,
                  spotify: {
                    ...prev.spotify,
                    isConnected: !prev.spotify.isConnected,
                  },
                }))
              }
              onToggleYoutube={() =>
                setAuthStatus((prev) => ({
                  ...prev,
                  youtube: {
                    ...prev.youtube,
                    isConnected: !prev.youtube.isConnected,
                  },
                }))
              }
              onGoToGenerator={() => setActiveTab('generator')}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 px-6 py-6 text-center text-xs text-slate-500">
        <p>MoodWave · Playlists sur-mesure Spotify &amp; YouTube adaptées à votre humeur, votre contexte et la météo en direct</p>
      </footer>

      {/* Modals */}
      <RegistrationModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        initialProfile={userProfile || undefined}
        onSaveProfile={handleSaveProfile}
        isInitialSignUp={!userProfile}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSignUp={() => setIsSignUpModalOpen(true)}
      />

      <ExportPlaylistModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        selectedTracks={tracksToExport}
        ville={weatherState.ville}
        humeur={selectedMood}
        contexteActivite={selectedContext}
        meteo={weatherState.conditionId}
        suggestedTitle={aiResult?.playlist_title}
        suggestedDescription={aiResult?.playlist_description}
      />

      <GeminiAiTestModal
        isOpen={isAiTestModalOpen}
        onClose={() => setIsAiTestModalOpen(false)}
        aiStatus={aiStatus}
        onRefreshStatus={loadAiStatus}
      />
    </div>
  );
}
