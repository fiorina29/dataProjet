/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { TopBar } from './components/TopBar';
import { LandingHeroPage } from './components/LandingHeroPage';
import { MoodAndWeatherSelector } from './components/MoodAndWeatherSelector';
import { TracksDataTable } from './components/TracksDataTable';
import { MyAccountPage } from './components/MyAccountPage';
import { RegistrationModal } from './components/RegistrationModal';
import { LoginModal } from './components/LoginModal';
import { ExportPlaylistModal } from './components/ExportPlaylistModal';
import {
  UserProfile,
  LiveWeatherState,
  SpotifyTrack,
  ServiceAuthStatus,
} from './types';
import {
  predictAudioTargetsLocally,
  rankTracksFromDataset,
} from './services/recommendationEngine';
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

  // Current Mood and Context
  const [selectedMood, setSelectedMood] = useState('joyeux');
  const [selectedContext, setSelectedContext] = useState('voiture');

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

  // Modals
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [tracksToExport, setTracksToExport] = useState<SpotifyTrack[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Model Inférence (computed in background)
  const mlOutput = useMemo(() => {
    return predictAudioTargetsLocally({
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
    });
  }, [userProfile, selectedMood, selectedContext, weatherState.conditionId, weatherState.ville]);

  // Ranked tracks
  const rankedTracks = useMemo(() => {
    return rankTracksFromDataset(
      mlOutput.spotify_audio_features_targets,
      mlOutput.genres_recommandes,
      userProfile?.artiste_prefere,
      KAGGLE_SPOTIFY_TRACKS
    );
  }, [mlOutput, userProfile?.artiste_prefere]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 350);
  };

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
              onGenerate={handleGenerate}
              isLoading={isGenerating}
            />

            {/* "Votre Playlist" */}
            <TracksDataTable
              tracks={rankedTracks}
              onOpenExportModal={handleOpenExportModal}
            />
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
      />
    </div>
  );
}
