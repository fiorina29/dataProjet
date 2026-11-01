import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Share2,
  Radio,
  ExternalLink,
  Youtube,
  Loader2,
  AlertCircle,
  ListMusic,
  FolderHeart,
  Sparkles,
} from 'lucide-react';
import { openYouTubeWithoutAccount } from '../services/youtubeService';
import { getYouTubeToken, exportToYouTube } from '../services/youtubeExport';
import { GoogleSignInButton } from './GoogleSignInButton';

export const ExportPlaylistModal = ({
  isOpen,
  onClose,
  selectedTracks = [],
  ville,
  humeur,
  contexteActivite,
  meteo,
  suggestedTitle,
  suggestedDescription,
  authStatus,
  getAccessToken,
  onGoogleSignIn,
  userProfile,
}) => {
  const [platform, setPlatform] = useState('youtube');

  const initialTitle = (suggestedTitle || `MoodWave • ${humeur} [${contexteActivite}] & ${meteo}`)
    .replace(/mistral/gi, 'Vibes');

  const initialDesc = (
    suggestedDescription ||
    `Playlist générée par MoodWave selon mon humeur (${humeur}), mon moment (${contexteActivite}) et la météo (${meteo}) à ${ville}.`
  ).replace(/mistral/gi, 'rythme');

  const [playlistTitle, setPlaylistTitle] = useState(initialTitle);
  const [playlistDescription, setPlaylistDescription] = useState(initialDesc);
  const [privacyStatus, setPrivacyStatus] = useState('unlisted');

  // Export progress states
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ progress: 0, message: '' });
  const [exportResult, setExportResult] = useState(null);
  const [exportError, setExportError] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Sync title when modal opens or suggestions change
  useEffect(() => {
    if (isOpen) {
      setPlaylistTitle(initialTitle);
      setPlaylistDescription(initialDesc);
      setExportResult(null);
      setExportError(null);
      setIsExporting(false);
      setExportProgress({ progress: 0, message: '' });
    }
  }, [isOpen, initialTitle, initialDesc]);

  if (!isOpen) return null;

  const isYouTubeConnected = Boolean(
    authStatus?.youtube?.isConnected || userProfile?.hasGoogleAuth
  );

  const handleSignInGoogle = async () => {
    setIsSigningIn(true);
    setExportError(null);
    try {
      if (onGoogleSignIn) {
        return await onGoogleSignIn();
      }
    } catch (err) {
      setExportError(err.message || 'Échec de la connexion avec Google');
      return null;
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);

    // 1. SPOTIFY EXPORT
    if (platform === 'spotify') {
      const url = `https://open.spotify.com/search/${encodeURIComponent(playlistTitle)}`;
      setTimeout(() => {
        setIsExporting(false);
        setExportResult({
          type: 'spotify',
          title: playlistTitle,
          url,
          message: 'Recherche prête sur Spotify Web Player',
        });
        window.open(url, '_blank', 'noopener,noreferrer');
      }, 300);
      return;
    }

    // 2. YOUTUBE EXPORT
    try {
      // 1) D'abord la popup Google immédiatement dans le clic
      const token = await getYouTubeToken(import.meta.env.VITE_GOOGLE_CLIENT_ID);

      const ytTracks = selectedTracks.map((t) => ({
        title: t.track_name,
        artist: t.artists,
      }));

      // 2) Ensuite l'export séquentiel
      const result = await exportToYouTube(token, ytTracks, {
        title: playlistTitle,
        description: playlistDescription,
        onProgress: (done, total, current) => {
          setExportProgress({
            progress: Math.round((done / (total || 1)) * 100),
            message: `${done}/${total} · ${current.artist} – ${current.title}`,
          });
        },
      });

      setExportResult({
        type: 'youtube',
        ...result,
      });

      window.open(result.playlistUrl, '_blank');
    } catch (err) {
      console.error('YouTube export failed:', err);
      let msg = err?.message || "Erreur lors de la création de la playlist sur YouTube.";
      if (msg.includes('popup_closed') || msg.includes('annulée')) {
        msg = "Connexion Google annulée. Veuillez autoriser l'accès à YouTube pour créer la playlist.";
      } else if (msg.includes('Quota') || msg.includes('quotaExceeded')) {
        msg = 'Quota YouTube du jour épuisé. Réessaie demain.';
      } else if (msg.includes('chaîne') || msg.includes('youtubeSignupRequired')) {
        msg = "Ce compte Google n'a pas de chaîne YouTube. Crée-en une puis réessaie.";
      }
      setExportError(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenWithoutAccount = () => {
    openYouTubeWithoutAccount(playlistTitle);
    handleClose();
  };

  const handleClose = () => {
    setExportResult(null);
    setExportError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl space-y-5 animate-in fade-in duration-200 text-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-md ${
                platform === 'spotify'
                  ? 'bg-emerald-500 shadow-emerald-500/20'
                  : 'bg-red-600 shadow-red-600/20'
              }`}
            >
              {platform === 'spotify' ? (
                <Radio className="h-5 w-5" />
              ) : (
                <Youtube className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Exporter la Playlist
              </h3>
              <p className="text-xs text-slate-500">
                Créez directement la playlist avec les {selectedTracks.length} titres de MoodWave
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success View */}
        {exportResult ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
              <Check className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">
                {exportResult.type === 'youtube'
                  ? 'Playlist créée sur votre compte YouTube !'
                  : 'Exporté avec succès vers Spotify !'}
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                {exportResult.type === 'youtube'
                  ? `Votre playlist "${playlistTitle}" contient les titres choisis par MoodWave.`
                  : "La page de recherche s'est ouverte dans votre lecteur."}
              </p>
            </div>

            {exportResult.type === 'youtube' && exportResult.notFound?.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 text-left space-y-1 max-w-md mx-auto">
                <span className="font-bold text-amber-800">
                  ⚠️ {exportResult.notFound.length} titre(s) introuvable(s) sur YouTube :
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800 max-h-24 overflow-y-auto">
                  {exportResult.notFound.map((t, idx) => (
                    <li key={idx}>
                      {t.artist} – {t.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notification de redirection */}
            <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-800 text-center">
              💡 Un onglet YouTube a été ouvert avec votre playlist. Cliquez ci-dessous pour y accéder directement :
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              {exportResult.type === 'youtube' && exportResult.playlistUrl && (
                <a
                  href={exportResult.playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 transition-all text-center justify-center w-full sm:w-auto"
                >
                  <Youtube className="h-4 w-4" />
                  <span>Voir ma nouvelle playlist sur YouTube</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}

              {exportResult.type === 'youtube' && (
                <a
                  href={exportResult.feedPlaylistsUrl || 'https://www.youtube.com/feed/playlists'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all text-center justify-center w-full sm:w-auto"
                >
                  <FolderHeart className="h-4 w-4 text-slate-500" />
                  <span>Mes playlists YouTube</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}

              {exportResult.type === 'spotify' && (
                <a
                  href={exportResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all text-center justify-center w-full sm:w-auto"
                >
                  <span>Accéder à Spotify</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}

              <button
                onClick={handleClose}
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Error Message */}
            {exportError && (
              <div className="flex flex-col gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{exportError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Platform Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Plateforme de destination *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPlatform('youtube')}
                  className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border transition-all ${
                    platform === 'youtube'
                      ? 'border-red-500 bg-red-50 text-red-700 font-bold shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Youtube className="h-4 w-4 text-red-600" />
                  <span className="text-xs">YouTube / YouTube Music</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlatform('spotify')}
                  className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border transition-all ${
                    platform === 'spotify'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Radio className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs">Spotify</span>
                </button>
              </div>
            </div>

            {/* YouTube Account Status or Sign In Prompt */}
            {platform === 'youtube' && (
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Youtube className="h-4 w-4 text-red-600" />
                    Compte YouTube :
                  </span>
                  {isYouTubeConnected ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[11px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Connecté ({userProfile?.email})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-[11px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Non connecté
                    </span>
                  )}
                </div>

                {!isYouTubeConnected && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-slate-600">
                      Connectez votre compte Google pour synchroniser votre playlist YouTube :
                    </p>
                    <GoogleSignInButton
                      onClick={handleSignInGoogle}
                      disabled={isSigningIn}
                      text={isSigningIn ? 'Connexion en cours...' : 'Se connecter avec Google / YouTube'}
                    />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">
                        Pas de compte YouTube ?
                      </span>
                      <button
                        type="button"
                        onClick={handleOpenWithoutAccount}
                        className="text-[11px] font-bold text-red-600 hover:underline"
                      >
                        Ouvrir YouTube sans compte →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Playlist Title & Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Titre de la playlist
              </label>
              <input
                type="text"
                value={playlistTitle}
                onChange={(e) => setPlaylistTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={playlistDescription}
                onChange={(e) => setPlaylistDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* Tracklist Preview */}
            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <ListMusic className="h-3.5 w-3.5 text-violet-600" />
                  Morceaux qui composeront la playlist :
                </span>
                <strong className="font-mono text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
                  {selectedTracks.length} titres identiques à MoodWave
                </strong>
              </div>

              {selectedTracks.length > 0 && (
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/60 p-2">
                  {selectedTracks.slice(0, 15).map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[11px] py-1"
                    >
                      <span className="truncate max-w-[340px] font-medium text-slate-800">
                        <span className="text-slate-400 font-mono mr-1.5">
                          {idx + 1}.
                        </span>
                        {t.track_name}{' '}
                        <span className="text-slate-500 font-normal">
                          · {t.artists}
                        </span>
                      </span>
                      <span className="text-slate-400 font-mono text-[10px] shrink-0">
                        {Math.floor(t.duration_ms / 60000)}:
                        {String(Math.floor((t.duration_ms % 60000) / 1000)).padStart(
                          2,
                          '0'
                        )}
                      </span>
                    </div>
                  ))}
                  {selectedTracks.length > 15 && (
                    <div className="text-[10px] text-center text-slate-400 italic pt-1">
                      + {selectedTracks.length - 15} autres titres inclus dans l'export
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Live Progress Bar during export */}
            {isExporting && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-red-900">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                    {exportProgress.message || 'Export en cours...'}
                  </span>
                  <span className="font-mono">{exportProgress.progress}%</span>
                </div>
                <div className="w-full bg-red-200/70 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={isExporting}
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>

              {platform === 'youtube' && !isYouTubeConnected && (
                <button
                  type="button"
                  onClick={handleOpenWithoutAccount}
                  disabled={isExporting}
                  className="w-full sm:w-auto rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
                >
                  Ouvrir YouTube sans compte
                </button>
              )}

              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting || selectedTracks.length === 0}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all ${
                  platform === 'spotify'
                    ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25'
                    : 'bg-red-600 hover:bg-red-700 shadow-red-600/25'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Création &amp; Redirection...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    <span>
                      {platform === 'spotify'
                        ? 'Exporter vers Spotify'
                        : 'Exporter sur YouTube'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
