/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { TopBar } from './components/TopBar';
import { MoodAndWeatherSelector } from './components/MoodAndWeatherSelector';
import { TracksDataTable } from './components/TracksDataTable';
import { MyAccountPage } from './components/MyAccountPage';
import { RegistrationModal } from './components/RegistrationModal';
import { LoginModal } from './components/LoginModal';
import { GeminiAiTestModal } from './components/GeminiAiTestModal';
import {
  rankTracksFromDataset,
} from './services/recommendationEngine';
import { fetchAiStatus, fetchAiPlaylistPrediction } from './services/geminiService';
import {
  initAuth,
  googleSignIn,
  logout as googleLogout,
  verifyYouTubeAccount,
} from './services/authService';
import { KAGGLE_SPOTIFY_TRACKS } from './data/kaggleSampleDataset';

export default function App() {
  // Navigation: 'generator' | 'account'
  const [activeTab, setActiveTab] = useState('generator');

  // User Profile
  const [userProfile, setUserProfile] = useState(() => {
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
      hasGoogleAuth: false,
      hasYouTubeAccount: false,
    };
  });

  // Current Mood and Context (must be chosen by user before generation)
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedContext, setSelectedContext] = useState('');
  const [hasGeneratedPlaylist, setHasGeneratedPlaylist] = useState(false);
  const [rankedTracks, setRankedTracks] = useState([]);
  const generationRequestId = useRef(0);

  // Live real-time Weather state
  const [weatherState, setWeatherState] = useState({
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

  // YouTube account status
  const [authStatus, setAuthStatus] = useState({
    youtube: {
      isConnected: false,
      displayName: 'Non connecté',
    },
  });

  // AI Engine State
  const [aiStatus, setAiStatus] = useState({
    status: 'checking',
    hasKey: true,
    primaryModel: 'gemini-3.8-flash',
    fallbackModel: 'gemini-3.1-flash-lite',
  });
  const [isAiTestModalOpen, setIsAiTestModalOpen] = useState(false);

  // Modals
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load AI status from server
  const loadAiStatus = useCallback(async () => {
    const status = await fetchAiStatus();
    setAiStatus(status);
  }, []);

  useEffect(() => {
    loadAiStatus();
  }, [loadAiStatus]);

  // Handle Firebase Auth Listener on Mount
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        if (token) {
          const account = await verifyYouTubeAccount(token, user);
          setAuthStatus((prev) => ({
            ...prev,
            youtube: {
              isConnected: Boolean(account.isConnected),
              displayName: user.displayName || user.email || 'YouTube Connecté',
            },
          }));
        }
      },
      () => {
        setAuthStatus((prev) => ({
          ...prev,
          youtube: {
            isConnected: false,
            displayName: 'Non connecté',
          },
        }));
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Google Sign-In with YouTube scope handler
  const handleGoogleSignIn = useCallback(async () => {
    const authData = await googleSignIn();
    if (authData?.user) {
      const user = authData.user;
      const account = authData.youtubeAccount;
      const displayName = user.displayName || '';
      const parts = displayName.trim().split(' ');
      const first = parts[0] || 'Utilisateur';
      const last = parts.slice(1).join(' ') || 'Google';

      const updatedProfile = {
        nom: userProfile?.nom && userProfile.nom !== 'Dupont' ? userProfile.nom : last,
        prenom: userProfile?.prenom && userProfile.prenom !== 'Alexandre' ? userProfile.prenom : first,
        email: user.email || userProfile?.email || '',
        age: userProfile?.age || 22,
        genre_musical_prefere: userProfile?.genre_musical_prefere || 'Pas de préférence',
        artiste_prefere: userProfile?.artiste_prefere || 'Daft Punk',
        ville: userProfile?.ville || 'Paris',
        avatarUrl: user.photoURL,
        hasGoogleAuth: true,
        hasYouTubeAccount: Boolean(account?.isConnected),
      };

      setUserProfile(updatedProfile);
      localStorage.setItem('moodwave_user_profile_v2', JSON.stringify(updatedProfile));

      setAuthStatus((prev) => ({
        ...prev,
        youtube: {
          isConnected: Boolean(account?.isConnected),
          displayName: displayName || user.email || 'YouTube',
        },
      }));

      return authData;
    }
  }, [userProfile]);

  // Toggle YouTube Connection
  const handleToggleYoutube = useCallback(async () => {
    if (authStatus.youtube.isConnected) {
      await googleLogout();
      setAuthStatus((prev) => ({
        ...prev,
        youtube: {
          isConnected: false,
          displayName: 'Non connecté',
        },
      }));
    } else {
      await handleGoogleSignIn();
    }
  }, [authStatus.youtube.isConnected, handleGoogleSignIn]);

  // Save profile handler
  const handleSaveProfile = (profile) => {
    setUserProfile(profile);
    localStorage.setItem('moodwave_user_profile_v2', JSON.stringify(profile));
    setActiveTab('generator');
  };

  const handleLogout = async () => {
    await googleLogout();
    setUserProfile(null);
    setYoutubeAccountInfo(null);
    setAuthStatus((prev) => ({
      ...prev,
      youtube: { isConnected: false, displayName: 'Non connecté' },
    }));
    localStorage.removeItem('moodwave_user_profile_v2');
    setActiveTab('generator');
  };

  const handleLoginSuccess = (email) => {
    const newProfile = {
      nom: 'Dupont',
      prenom: 'Alexandre',
      email: email,
      age: 22,
      genre_musical_prefere: 'Pas de préférence',
      artiste_prefere: 'Daft Punk',
      ville: 'Paris',
      hasGoogleAuth: false,
      hasYouTubeAccount: false,
    };
    handleSaveProfile(newProfile);
  };

  const [generationError, setGenerationError] = useState(null);

  useEffect(() => {
    generationRequestId.current += 1;
    setRankedTracks([]);
    setHasGeneratedPlaylist(false);
    setIsGenerating(false);
    setGenerationError(null);
  }, [
    selectedMood,
    selectedContext,
    userProfile?.artiste_prefere,
    userProfile?.genre_musical_prefere,
    weatherState.conditionId,
    weatherState.temperature,
    weatherState.ville,
  ]);

  // Show a playlist only after Gemini has returned at least 20 matching curated tracks.
  const executeGeneration = useCallback(async () => {
    if (!selectedMood || !selectedContext) {
      return;
    }

    const requestId = ++generationRequestId.current;
    setIsGenerating(true);
    setGenerationError(null);
    setHasGeneratedPlaylist(false);
    setRankedTracks([]);

    try {
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
      const tracks = rankTracksFromDataset(
        result.spotify_audio_features_targets,
        result.genres_recommandes,
        userProfile?.artiste_prefere,
        userProfile?.genre_musical_prefere,
        selectedContext,
        selectedMood,
        KAGGLE_SPOTIFY_TRACKS,
        result.curated_tracks
      );
      if (requestId !== generationRequestId.current) return;
      setRankedTracks(tracks);
      setHasGeneratedPlaylist(true);
    } catch (err) {
      if (requestId !== generationRequestId.current) return;
      console.error('Gemini AI playlist generation failed:', err);
      setGenerationError(err.message || "Impossible d'obtenir une playlist valide de l'IA.");
    } finally {
      if (requestId === generationRequestId.current) {
        setIsGenerating(false);
      }
    }
  }, [userProfile, weatherState, selectedMood, selectedContext]);

  return (
    <div className="min-h-screen text-slate-800 flex flex-col selection:bg-pink-500 selection:text-white">
      {/* 1. Header Navigation */}
      <TopBar
        profile={userProfile}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSignUp={() => setIsSignUpModalOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Main Page Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              onSaveProfile={handleSaveProfile}
              onGenerate={executeGeneration}
              isLoading={isGenerating}
              onOpenAiTest={() => setIsAiTestModalOpen(true)}
            />

            {/* Error Notification if Gemini fails */}
            {generationError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-sm flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <div>
                    <strong className="font-bold">Erreur de génération IA :</strong> {generationError}
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

            {/* No playlist is shown until Gemini has returned a valid curated playlist. */}
            {!hasGeneratedPlaylist ? (
              <div className="rounded-3xl border border-dashed border-violet-200/90 bg-white/70 p-8 sm:p-12 text-center space-y-4 shadow-xs">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-100 to-pink-100 text-violet-600 shadow-xs">
                  <Sparkles className="h-8 w-8 text-violet-600 animate-pulse" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {isGenerating
                      ? "L'IA prépare votre playlist..."
                      : generationError
                      ? "La playlist n'a pas pu être validée"
                      : 'Prêt à créer votre playlist sur-mesure ?'}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isGenerating
                      ? "Aucune chanson ne s'affichera avant la réponse de Gemini."
                      : generationError
                      ? "Réessayez pour obtenir 20 titres du catalogue, dont au moins 5 de votre artiste préféré."
                      : <>Sélectionnez votre <strong>humeur</strong> et votre <strong>contexte d'activité</strong> ci-dessus, puis cliquez sur <strong>« Générer la playlist »</strong>. Gemini sélectionnera les 20 morceaux selon vos préférences, votre humeur et la météo.</>}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                  <span
                    className={`px-3 py-1 rounded-full font-bold border transition-all ${
                      selectedMood
                        ? 'bg-violet-50 text-violet-700 border-violet-200 shadow-2xs'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {selectedMood ? `✓ Humeur : ${selectedMood}` : '1. Choisir une humeur'}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full font-bold border transition-all ${
                      selectedContext
                        ? 'bg-pink-50 text-pink-700 border-pink-200 shadow-2xs'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {selectedContext ? `✓ Contexte : ${selectedContext}` : '2. Choisir un contexte'}
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* THE ONLY MUSIC LIST: "Votre Playlist" */}
                <TracksDataTable
                  tracks={rankedTracks}
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
              onToggleYoutube={handleToggleYoutube}
              onGoogleSignIn={handleGoogleSignIn}
              onGoToGenerator={() => setActiveTab('generator')}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 px-6 py-6 text-center text-xs text-slate-500">
        <p>
          MoodWave · Playlists sur-mesure YouTube créées selon votre humeur, votre contexte et la météo en direct
        </p>
      </footer>

      {/* Modals */}
      <RegistrationModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        initialProfile={userProfile || undefined}
        onSaveProfile={handleSaveProfile}
        onGoogleSignIn={handleGoogleSignIn}
        isInitialSignUp={!userProfile}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onGoogleSignIn={handleGoogleSignIn}
        onSwitchToSignUp={() => setIsSignUpModalOpen(true)}
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
