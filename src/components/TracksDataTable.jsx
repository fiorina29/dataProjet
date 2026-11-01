import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  Search,
  ArrowUpDown,
  Share2,
  Music,
  CheckSquare,
  Square,
  Sparkles,
  Zap,
  Clock,
  Flame,
  Youtube,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { getYouTubeToken, exportToYouTube } from '../services/youtubeExport';

export const TracksDataTable = ({
  tracks,
  onOpenExportModal,
  favoriteArtist,
  selectedContext,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewLimit, setViewLimit] = useState('top20');
  const [sortField, setSortField] = useState('similarity');
  const [sortAsc, setSortAsc] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState(null);

  // YouTube Direct Export State
  const [isExportingYt, setIsExportingYt] = useState(false);
  const [exportProgressYt, setExportProgressYt] = useState(null);
  const [exportResultYt, setExportResultYt] = useState(null);
  const [exportErrorYt, setExportErrorYt] = useState(null);

  // Filtered and sorted master track list
  const sortedTracks = useMemo(() => {
    return [...tracks].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortField === 'similarity') {
        valA = a.similarity_score || 0;
        valB = b.similarity_score || 0;
      } else if (sortField === 'popularity') {
        valA = a.popularity;
        valB = b.popularity;
      } else if (sortField === 'valence') {
        valA = a.valence;
        valB = b.valence;
      } else if (sortField === 'energy') {
        valA = a.energy;
        valB = b.energy;
      } else if (sortField === 'tempo') {
        valA = a.tempo;
        valB = b.tempo;
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [tracks, sortField, sortAsc]);

  // Apply view limit (guaranteeing at least 20 if viewLimit is top20)
  const limitedTracks = useMemo(() => {
    if (viewLimit === 'top20') {
      return sortedTracks.slice(0, Math.max(20, Math.min(20, sortedTracks.length)));
    }
    if (viewLimit === 'top30') {
      return sortedTracks.slice(0, Math.max(20, Math.min(30, sortedTracks.length)));
    }
    return sortedTracks;
  }, [sortedTracks, viewLimit]);

  // Selected track ids (auto-updated when tracks or view limit changes)
  const [selectedIds, setSelectedIds] = useState(() => {
    const top20 = tracks.slice(0, Math.max(20, Math.min(20, tracks.length)));
    return new Set(top20.map((t) => t.track_id));
  });

  useEffect(() => {
    // Whenever tracks pool or view limit changes, default to selecting all tracks in current view (at least 20)
    const initialSet = new Set(limitedTracks.map((t) => t.track_id));
    setSelectedIds(initialSet);
  }, [tracks, viewLimit]);

  // Filter by search term
  const displayedTracks = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return limitedTracks;
    return limitedTracks.filter((track) => {
      return (
        track.track_name.toLowerCase().includes(term) ||
        track.artists.toLowerCase().includes(term) ||
        track.album_name.toLowerCase().includes(term) ||
        track.track_genre.toLowerCase().includes(term) ||
        (track.curation_reason && track.curation_reason.toLowerCase().includes(term))
      );
    });
  }, [limitedTracks, searchTerm]);

  // Selected tracks list
  const selectedTracksList = useMemo(() => {
    return tracks.filter((t) => selectedIds.has(t.track_id));
  }, [tracks, selectedIds]);

  // Audio synthesis preview tone
  const playPreviewTone = (track) => {
    if (playingTrackId === track.track_id) {
      setPlayingTrackId(null);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = 220 * Math.pow(2, (track.key || 0) / 12);
      osc.type = track.acousticness > 0.5 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 3.0);

      setPlayingTrackId(track.track_id);
      setTimeout(() => {
        setPlayingTrackId(null);
      }, 3000);
    } catch {
      setPlayingTrackId(track.track_id);
      setTimeout(() => setPlayingTrackId(null), 2000);
    }
  };

  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const formatTotalTime = (tracksList) => {
    const totalMs = tracksList.reduce((acc, t) => acc + (t.duration_ms || 210000), 0);
    const totalMinutes = Math.floor(totalMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes < 10 ? '0' : ''}${minutes}m`;
    }
    return `${minutes} min`;
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === displayedTracks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedTracks.map((t) => t.track_id)));
    }
  };

  const handleToggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Instant export for the top 20
  const handleQuickExportTop20 = () => {
    const top20 = displayedTracks.slice(0, 20);
    onOpenExportModal(top20.length >= 20 ? top20 : displayedTracks);
  };

  // Direct export to YouTube with getYouTubeToken and exportToYouTube
  const handleExportYouTube = async () => {
    setIsExportingYt(true);
    setExportProgressYt(null);
    setExportResultYt(null);
    setExportErrorYt(null);

    try {
      // 1) D'abord la popup Google, immédiatement dans le clic
      const token = await getYouTubeToken(import.meta.env.VITE_GOOGLE_CLIENT_ID);

      // Titres de la playlist générée par l'IA (artist + title)
      const targetTracks = selectedTracksList.length > 0 ? selectedTracksList : displayedTracks.slice(0, 20);
      const ytTracks = targetTracks.map((t) => ({
        title: t.track_name,
        artist: t.artists,
      }));

      // 2) Ensuite l'export
      const result = await exportToYouTube(token, ytTracks, {
        title: `MoodWave – ${selectedContext || 'Playlist'} – ${new Date().toLocaleDateString('fr-FR')}`,
        description: 'Playlist générée par MoodWave selon l\'humeur et la météo.',
        onProgress: (done, total, current) => {
          setExportProgressYt({ done, total, current });
        },
      });

      setExportProgressYt(null);
      setExportResultYt(result);
      window.open(result.playlistUrl, '_blank');
    } catch (e) {
      setExportProgressYt(null);
      let msg = e?.message || "Erreur lors de l'exportation vers YouTube.";
      if (msg.includes('popup_closed') || msg.includes('annulée')) {
        msg = "Connexion Google annulée. Veuillez autoriser l'accès à YouTube pour créer la playlist.";
      } else if (msg.includes('Quota') || msg.includes('quotaExceeded')) {
        msg = 'Quota YouTube du jour épuisé. Réessaie demain.';
      } else if (msg.includes('chaîne') || msg.includes('youtubeSignupRequired')) {
        msg = "Ce compte Google n'a pas de chaîne YouTube. Crée-en une puis réessaie.";
      }
      setExportErrorYt(msg);
    } finally {
      setIsExportingYt(false);
    }
  };

  // Compute playlist averages
  const playlistMetrics = useMemo(() => {
    const targetList = selectedTracksList.length > 0 ? selectedTracksList : displayedTracks;
    if (targetList.length === 0) {
      return { avgEnergy: 0, avgValence: 0, avgBpm: 0, avgMatch: 0 };
    }
    const sumEnergy = targetList.reduce((acc, t) => acc + t.energy, 0);
    const sumValence = targetList.reduce((acc, t) => acc + t.valence, 0);
    const sumBpm = targetList.reduce((acc, t) => acc + t.tempo, 0);
    const sumMatch = targetList.reduce((acc, t) => acc + (t.similarity_score || 85), 0);
    const count = targetList.length;

    return {
      avgEnergy: Math.round((sumEnergy / count) * 100),
      avgValence: Math.round((sumValence / count) * 100),
      avgBpm: Math.round(sumBpm / count),
      avgMatch: Math.round(sumMatch / count),
    };
  }, [selectedTracksList, displayedTracks]);

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 sm:p-7 shadow-sm space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Votre Playlist
            </h3>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              {displayedTracks.length} titres {displayedTracks.length >= 20 ? '(Garantie 20+ titres)' : ''}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              ⚡ Prête instantanément
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Génération optimisée croisant le contexte, votre profil d'inscription, votre humeur et la météo en direct
          </p>
        </div>

        {/* Action Controls & Fast Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Main Requested Button: Exporter sur YouTube */}
          <button
            onClick={handleExportYouTube}
            disabled={isExportingYt || displayedTracks.length === 0}
            className="flex items-center gap-2 rounded-2xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
            title="Exporter directement la playlist sur votre compte YouTube"
          >
            {isExportingYt ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Youtube className="h-4 w-4" />
            )}
            <span>Exporter sur YouTube</span>
          </button>

          {/* Quick Instant Export Top 20 */}
          <button
            onClick={handleQuickExportTop20}
            disabled={isExportingYt}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-pink-500/20 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
            title="Créer rapidement la playlist de 20 titres minimum et l'exporter"
          >
            <Zap className="h-4 w-4 text-yellow-300" />
            <span>Créer le Top 20 instantané</span>
          </button>

          {/* Export custom selection */}
          <button
            onClick={() => onOpenExportModal(selectedTracksList)}
            disabled={isExportingYt || selectedTracksList.length === 0}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Options d'export ({selectedTracksList.length})</span>
          </button>
        </div>
      </div>

      {/* Live YouTube Export Progress Bar (x/20 + titre en cours) */}
      {isExportingYt && exportProgressYt && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-2 truncate">
              <Loader2 className="h-4 w-4 animate-spin text-red-600 shrink-0" />
              <span>
                {exportProgressYt.done}/{exportProgressYt.total} · {exportProgressYt.current?.artist} – {exportProgressYt.current?.title}
              </span>
            </span>
            <span className="font-mono text-red-700 ml-2">
              {Math.round((exportProgressYt.done / (exportProgressYt.total || 1)) * 100)}%
            </span>
          </div>
          <div className="w-full bg-red-200/80 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${Math.round((exportProgressYt.done / (exportProgressYt.total || 1)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* YouTube Export Success View */}
      {exportResultYt && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span className="font-bold text-sm">
                Playlist créée avec succès sur votre compte YouTube ! ({exportResultYt.added.length} titres ajoutés)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={exportResultYt.playlistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-sm transition-colors shrink-0"
              >
                <Youtube className="h-4 w-4" />
                <span>Voir la playlist sur YouTube</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <button
                onClick={() => setExportResultYt(null)}
                className="px-3 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-100 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>

          {exportResultYt.notFound?.length > 0 && (
            <div className="pt-2 border-t border-emerald-200/70 text-amber-900">
              <span className="font-semibold text-amber-800">
                ⚠️ {exportResultYt.notFound.length} titre(s) introuvable(s) sur YouTube :
              </span>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-amber-800">
                {exportResultYt.notFound.map((t, idx) => (
                  <li key={idx}>
                    {t.artist} – {t.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* YouTube Export Error View */}
      {exportErrorYt && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="font-medium">{exportErrorYt}</span>
          </div>
          <button
            onClick={() => setExportErrorYt(null)}
            className="text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded-lg hover:bg-rose-100 transition-colors shrink-0"
          >
            Fermer
          </button>
        </div>
      )}

      {/* 2. Playlist Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-50/70 via-white to-pink-50/70 border border-violet-100/90 text-xs shadow-2xs">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Music className="h-3 w-3 text-violet-500" />
            Sélectionnés
          </span>
          <div className="text-base font-black text-slate-800 font-mono-nums">
            {selectedTracksList.length} titres
          </div>
          <div className="text-[10px] text-slate-500">
            Min. 20 recommandé
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Clock className="h-3 w-3 text-pink-500" />
            Durée totale
          </span>
          <div className="text-base font-black text-slate-800 font-mono-nums">
            {formatTotalTime(selectedTracksList.length > 0 ? selectedTracksList : displayedTracks)}
          </div>
          <div className="text-[10px] text-slate-500">
            Playlist continue
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-500" />
            Énergie Moyenne
          </span>
          <div className="text-base font-black text-orange-600 font-mono-nums">
            {playlistMetrics.avgEnergy}%
          </div>
          <div className="text-[10px] text-slate-500">
            Dynamisme sonore
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Valence (Joie)
          </span>
          <div className="text-base font-black text-amber-600 font-mono-nums">
            {playlistMetrics.avgValence}%
          </div>
          <div className="text-[10px] text-slate-500">
            Humeur positive
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Zap className="h-3 w-3 text-purple-500" />
            Tempo Moyen
          </span>
          <div className="text-base font-black text-purple-600 font-mono-nums">
            {playlistMetrics.avgBpm} BPM
          </div>
          <div className="text-[10px] text-slate-500">
            Vitesse de rythme
          </div>
        </div>
      </div>

      {/* 3. Search and View Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un titre, un artiste, un genre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-violet-500 focus:outline-none transition-all"
          />
        </div>

        {/* View Limit Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setViewLimit('top20')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewLimit === 'top20'
                ? 'bg-white text-violet-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Top 20 (Recommandé)
          </button>
          <button
            onClick={() => setViewLimit('top30')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewLimit === 'top30'
                ? 'bg-white text-violet-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Top 30
          </button>
          <button
            onClick={() => setViewLimit('all')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewLimit === 'all'
                ? 'bg-white text-violet-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous ({sortedTracks.length})
          </button>
        </div>
      </div>

      {/* 4. Tracks Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
            <tr>
              <th className="py-3 px-3.5 w-10 text-center">
                <button
                  onClick={handleToggleSelectAll}
                  className="text-slate-400 hover:text-slate-600"
                  title="Tout sélectionner / désélectionner"
                >
                  {selectedIds.size === displayedTracks.length && displayedTracks.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-violet-600" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-300" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3.5">Titre &amp; Artiste</th>
              <th className="py-3 px-3.5">Genre</th>
              <th className="py-3 px-3.5">
                <button
                  onClick={() => {
                    if (sortField === 'similarity') setSortAsc(!sortAsc);
                    else {
                      setSortField('similarity');
                      setSortAsc(false);
                    }
                  }}
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  <span>Score Match</span>
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="py-3 px-3.5">Valence</th>
              <th className="py-3 px-3.5">Énergie</th>
              <th className="py-3 px-3.5">Tempo</th>
              <th className="py-3 px-3.5 text-right">Durée</th>
              <th className="py-3 px-3.5 text-center w-16">Extrait</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedTracks.map((track, index) => {
              const isSelected = selectedIds.has(track.track_id);
              const isPlaying = playingTrackId === track.track_id;
              const isFavArtist =
                favoriteArtist &&
                track.artists.toLowerCase().includes(favoriteArtist.toLowerCase().trim());

              return (
                <tr
                  key={track.track_id || index}
                  className={`transition-colors ${
                    isSelected ? 'bg-violet-50/30' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <td className="py-3 px-3.5 text-center">
                    <div className="flex items-center gap-1.5 justify-center">
                      <button
                        onClick={() => handleToggleSelect(track.track_id)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-violet-600" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-300" />
                        )}
                      </button>
                      <span className="text-[11px] font-bold text-slate-400 w-5">
                        {index + 1}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 max-w-[220px] truncate">
                        {track.track_name}
                      </span>
                      {track.is_curated && (
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-violet-100 text-violet-800"
                          title={track.curation_reason || 'Recommandé par Gemini'}
                        >
                          <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                          IA
                        </span>
                      )}
                      {isFavArtist && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-100 text-rose-700">
                          ❤️ Favori
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 max-w-[260px] truncate">
                      {track.artists} · {track.album_name}
                    </div>
                    {track.curation_reason && (
                      <div className="text-[10px] text-violet-600 italic truncate max-w-[280px]">
                        "{track.curation_reason}"
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-3.5 text-slate-600 capitalize">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-[11px]">
                      {track.track_genre}
                    </span>
                  </td>

                  <td className="py-3 px-3.5">
                    <span className="font-mono-nums font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {track.similarity_score}%
                    </span>
                  </td>

                  <td className="py-3 px-3.5 font-mono-nums text-slate-600">
                    {track.valence.toFixed(2)}
                  </td>

                  <td className="py-3 px-3.5 font-mono-nums text-slate-600">
                    {track.energy.toFixed(2)}
                  </td>

                  <td className="py-3 px-3.5 font-mono-nums text-slate-600">
                    {Math.round(track.tempo)}
                  </td>

                  <td className="py-3 px-3.5 font-mono-nums text-slate-500 text-right">
                    {formatDuration(track.duration_ms)}
                  </td>

                  <td className="py-3 px-3.5 text-center">
                    <button
                      onClick={() => playPreviewTone(track)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                        isPlaying
                          ? 'bg-violet-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-700'
                      }`}
                      title="Écouter un extrait sonore synthétique"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 ml-0.5" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
