import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CloudRain,
  Sun,
  Cloud,
  CloudLightning,
  Snowflake,
  Wind,
  MapPin,
  LocateFixed,
  Droplets,
  Radio,
  Car,
  PartyPopper,
  Baby,
  Dumbbell,
  Laptop,
  Bath,
  Utensils,
  Moon,
  Footprints,
  Heart,
  Music2,
} from 'lucide-react';
import {
  MOOD_OPTIONS,
  CONTEXT_OPTIONS,
  KAGGLE_ARTISTS,
  KAGGLE_GENRES,
} from '../data/kaggleSampleDataset';
import { fetchLiveWeather, fetchLiveWeatherFromDevice } from '../services/weatherService';

export const MoodAndWeatherSelector = ({
  profile,
  selectedMood,
  onSelectMood,
  selectedContext,
  onSelectContext,
  weatherState,
  onUpdateWeather,
  onSaveProfile,
  onGenerate,
  isLoading,
  isAiMode = true,
  onOpenAiTest,
}) => {
  const [cityInput, setCityInput] = useState(profile.ville);
  const [isChangingCity, setIsChangingCity] = useState(false);
  const [favoriteGenre, setFavoriteGenre] = useState(
    KAGGLE_GENRES.includes(profile.genre_musical_prefere)
      ? profile.genre_musical_prefere
      : ''
  );
  const [favoriteArtist, setFavoriteArtist] = useState(profile.artiste_prefere || '');
  const [preferencesSaved, setPreferencesSaved] = useState(false);
  const savedGenre = KAGGLE_GENRES.includes(profile.genre_musical_prefere)
    ? profile.genre_musical_prefere
    : '';

  useEffect(() => {
    setFavoriteGenre(
      KAGGLE_GENRES.includes(profile.genre_musical_prefere)
        ? profile.genre_musical_prefere
        : ''
    );
    setFavoriteArtist(profile.artiste_prefere || '');
  }, [profile.genre_musical_prefere, profile.artiste_prefere]);

  const handleSavePreferences = () => {
    onSaveProfile({
      ...profile,
      genre_musical_prefere: favoriteGenre,
      artiste_prefere: favoriteArtist.trim(),
    });
    setPreferencesSaved(true);
  };

  // Auto-detect device location on first mount
  useEffect(() => {
    let isCancelled = false;

    const autoLocate = async () => {
      onUpdateWeather({ ...weatherState, isLoading: true });
      const liveGps = await fetchLiveWeatherFromDevice();
      if (!isCancelled) {
        onUpdateWeather(liveGps);
        setCityInput(liveGps.ville);
      }
    };

    autoLocate();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleLocateMe = async () => {
    onUpdateWeather({ ...weatherState, isLoading: true });
    const liveGps = await fetchLiveWeatherFromDevice();
    onUpdateWeather(liveGps);
    setCityInput(liveGps.ville);
    setIsChangingCity(false);
  };

  const handleManualCitySearch = async () => {
    onUpdateWeather({ ...weatherState, isLoading: true });
    const live = await fetchLiveWeather(cityInput || profile.ville);
    onUpdateWeather(live);
    setIsChangingCity(false);
  };

  const getWeatherIcon = (conditionId) => {
    switch (conditionId) {
      case 'pluie':
        return <CloudRain className="h-6 w-6 text-sky-500" />;
      case 'soleil':
        return <Sun className="h-6 w-6 text-amber-500" />;
      case 'nuageux':
        return <Cloud className="h-6 w-6 text-slate-400" />;
      case 'orage':
        return <CloudLightning className="h-6 w-6 text-yellow-500" />;
      case 'neige':
        return <Snowflake className="h-6 w-6 text-cyan-400" />;
      case 'brume':
        return <Wind className="h-6 w-6 text-slate-400" />;
      default:
        return <Cloud className="h-6 w-6 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Cheerful Live Context Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Welcome greeting card with warm colors */}
        <div className="rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 text-white shadow-lg shadow-violet-500/10 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-2">
              <Sparkles className="h-3 w-3 text-yellow-300" />
              <span>Générateur en direct</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Bonjour {profile.prenom || profile.nom} !
            </h2>
            <p className="text-xs text-white/90 mt-1 max-w-xl">
              Choisissez votre humeur et votre moment actuel. La musique s'ajuste instantanément
              à la météo en direct de votre position.
            </p>
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-white/80 border-t border-white/10 mt-3">
            <span>Style favori : <strong className="text-white capitalize">{profile.genre_musical_prefere}</strong></span>
            {profile.artiste_prefere && (
              <>
                <span aria-hidden="true">·</span>
                <span>Artiste : <strong className="text-white">{profile.artiste_prefere}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Editable profile music preferences */}
        <div className="rounded-3xl border border-violet-100 bg-white p-5 shadow-md shadow-violet-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Music2 className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Préférences musicales</span>
              <span className="text-[10px] text-violet-600 font-semibold">Profil MoodWave</span>
            </div>
          </div>
          <label className="block text-[10px] font-semibold text-slate-600" htmlFor="favorite-genre">
            Genre préféré
          </label>
          <select
            id="favorite-genre"
            value={favoriteGenre}
            onChange={(event) => {
              setFavoriteGenre(event.target.value);
              setPreferencesSaved(false);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
          >
            <option value="">Choisir un genre</option>
            {KAGGLE_GENRES.map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
          <label className="block text-[10px] font-semibold text-slate-600" htmlFor="favorite-artist">
            Artiste préféré
          </label>
          <input
            id="favorite-artist"
            type="text"
            list="generator-kaggle-artists"
            value={favoriteArtist}
            onChange={(event) => {
              setFavoriteArtist(event.target.value);
              setPreferencesSaved(false);
            }}
            placeholder="Choisir ou saisir un artiste"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
          />
          <datalist id="generator-kaggle-artists">
            {KAGGLE_ARTISTS.map((artist) => (
              <option key={artist} value={artist} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={handleSavePreferences}
            disabled={
              favoriteGenre === savedGenre &&
              favoriteArtist.trim() === (profile.artiste_prefere || '')
            }
            className="w-full rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {preferencesSaved ? 'Préférences enregistrées' : 'Enregistrer'}
          </button>
        </div>

        {/* Live Weather Card with direct GPS */}
        <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-md shadow-sky-500/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 block truncate max-w-[150px]">
                  {weatherState.ville}
                </span>
                <span className="text-[10px] text-sky-600 font-semibold">
                  {weatherState.isDeviceGps ? '📍 GPS appareil direct' : 'Ville renseignée'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLocateMe}
              disabled={weatherState.isLoading}
              className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-slate-600 hover:text-sky-600 transition-colors bg-slate-50 hover:bg-sky-50 px-2 py-1 rounded-lg"
              title="Relancer la géolocalisation de l'appareil"
            >
              <LocateFixed className={`h-3.5 w-3.5 ${weatherState.isLoading ? 'animate-spin text-sky-600' : ''}`} />
              <span>GPS</span>
            </button>
          </div>

          {/* Temperature & Live Condition */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-sky-50 border border-slate-100 shadow-sm">
                {getWeatherIcon(weatherState.conditionId)}
              </div>
              <div>
                <div className="text-2xl font-black text-slate-800 font-mono-nums">
                  {weatherState.isLoading ? '--' : `${weatherState.temperature}°C`}
                </div>
                <div className="max-w-[150px] truncate text-xs font-bold text-sky-700 capitalize">
                  {weatherState.isLoading ? 'Détection météo...' : weatherState.description}
                </div>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400 space-y-1 font-mono-nums">
              <div className="flex items-center gap-1 justify-end">
                <Droplets className="h-3 w-3 text-sky-500" />
                <span>{weatherState.humidity ?? 65}%</span>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <Wind className="h-3 w-3 text-slate-400" />
                <span>{weatherState.windSpeed ?? 12} km/h</span>
              </div>
            </div>
          </div>

          {/* Change city toggle */}
          {isChangingCity ? (
            <div className="pt-2 flex items-center gap-2">
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Ex: Marseille, Lyon..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualCitySearch();
                }}
              />
              <button
                onClick={handleManualCitySearch}
                className="rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-500"
              >
                OK
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsChangingCity(true)}
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors block text-left"
            >
              Changer manuellement de ville &rarr;
            </button>
          )}
        </div>
      </div>

      {/* 2. Selection de l'Humeur */}
      <div className="rounded-3xl bg-white/90 border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>1. Quelle est votre humeur du moment ?</span>
            </h3>
            <p className="text-xs text-slate-500">
              Cliquez sur l'émotion qui correspond à votre énergie actuelle
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize self-start sm:self-auto ${
            selectedMood ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-800'
          }`}>
            {selectedMood ? `Humeur choisie : ${selectedMood}` : 'Étape 1 : Choisissez une humeur'}
          </span>
        </div>

        {/* 12 Diverse, clean, joyful Mood Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {MOOD_OPTIONS.map((mood) => {
            const isSelected = selectedMood && selectedMood.toLowerCase() === mood.id.toLowerCase();
            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => onSelectMood(mood.id)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-violet-500 bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md shadow-pink-500/20 scale-[1.02]'
                    : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40 text-slate-800'
                }`}
              >
                <span className="text-2xl shrink-0">{mood.emoji}</span>
                <span className="text-xs font-bold truncate">
                  {mood.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Selection du Contexte & Activité */}
      <div className="rounded-3xl bg-white/90 border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>2. Quel est votre contexte ou activité ?</span>
            </h3>
            <p className="text-xs text-slate-500">
              Voiture, enfants, soirée festive, séance de sport... Le rythme s'adapte à votre situation
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize self-start sm:self-auto ${
            selectedContext ? 'bg-pink-100 text-pink-700' : 'bg-amber-100 text-amber-800'
          }`}>
            {selectedContext ? `Contexte choisi : ${selectedContext}` : 'Étape 2 : Choisissez un contexte'}
          </span>
        </div>

        {/* 10 Situational Context Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CONTEXT_OPTIONS.map((ctx) => {
            const isSelected = selectedContext && selectedContext.toLowerCase() === ctx.id.toLowerCase();
            return (
              <button
                key={ctx.id}
                type="button"
                onClick={() => onSelectContext(ctx.id)}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-pink-500 bg-pink-600 text-white shadow-md shadow-pink-500/20 scale-[1.02]'
                    : 'border-slate-200 bg-white hover:border-pink-200 hover:bg-pink-50/40 text-slate-800'
                }`}
              >
                <span className="text-xl shrink-0">{ctx.emoji}</span>
                <span className="text-xs font-bold truncate">
                  {ctx.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Action Button: Générer la playlist */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="text-xs text-slate-500 text-center sm:text-left space-y-1">
          <div>
            Météo : <strong className="text-slate-800 capitalize">{weatherState.conditionId} ({weatherState.temperature}°C)</strong> · 
            Humeur : <strong className="text-violet-600 capitalize">{selectedMood || 'À choisir'}</strong> · 
            Contexte : <strong className="text-pink-600 capitalize">{selectedContext || 'À choisir'}</strong>
          </div>
          <div className="flex items-center gap-2 justify-center sm:justify-start text-[11px] text-slate-600">
            <span className="flex items-center gap-1 font-semibold text-violet-700">
              <Sparkles className="h-3 w-3 text-violet-500" />
              Moteur : {isAiMode ? 'Google AI Studio (Gemini 3.8 Flash)' : 'Algorithme Local'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              20 titres min.
            </span>
            {onOpenAiTest && (
              <button
                type="button"
                onClick={onOpenAiTest}
                className="text-violet-600 underline hover:text-violet-800 font-bold ml-1"
              >
                Tester l'API
              </button>
            )}
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={isLoading || !selectedMood || !selectedContext}
          className={`w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl px-8 py-4 text-sm font-black transition-all ${
            selectedMood && selectedContext
              ? 'bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 text-white shadow-xl shadow-pink-500/25 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          } disabled:opacity-60`}
        >
          <Sparkles className={`h-5 w-5 ${selectedMood && selectedContext ? 'text-yellow-300 animate-pulse' : 'text-slate-400'}`} />
          <span>
            {isLoading
              ? 'Génération des 20 titres par l\'IA...'
              : !selectedMood && !selectedContext
              ? '1. Choisissez une humeur & un contexte'
              : !selectedMood
              ? '1. Choisissez une humeur'
              : !selectedContext
              ? '2. Choisissez un contexte'
              : isAiMode
              ? 'Générer la Playlist (20 titres min.)'
              : 'Générer Votre Playlist (20 titres)'}
          </span>
        </button>
      </div>
    </div>
  );
};
