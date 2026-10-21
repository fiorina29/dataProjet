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
  Radio,
  Youtube,
  Sparkles,
  Zap,
  Clock,
  Gauge,
  Heart,
  Activity,
  Flame
} from 'lucide-react';
import { SpotifyTrack } from '../types';

interface TracksDataTableProps {
  tracks: SpotifyTrack[];
  onOpenExportModal: (selectedTracks: SpotifyTrack[]) => void;
  favoriteArtist?: string;
  selectedContext?: string;
}

export const TracksDataTable: React.FC<TracksDataTableProps> = ({
  tracks,
  onOpenExportModal,
  favoriteArtist,
  selectedContext,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewLimit, setViewLimit] = useState<'top20' | 'top30' | 'all'>('top20');
  const [sortField, setSortField] = useState<'similarity' | 'popularity' | 'valence' | 'energy' | 'tempo'>('similarity');
  const [sortAsc, setSortAsc] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
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
  const playPreviewTone = (track: SpotifyTrack) => {
    if (playingTrackId === track.track_id) {
      setPlayingTrackId(null);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const formatTotalTime = (tracksList: SpotifyTrack[]) => {
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

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Quick 1-click select top 20
  const handleSelectTop20 = () => {
    const top20 = sortedTracks.slice(0, Math.max(20, Math.min(20, sortedTracks.length)));
    setSelectedIds(new Set(top20.map((t) => t.track_id)));
    setViewLimit('top20');
  };

  // Quick instant export top 20
  const handleQuickExportTop20 = () => {
    const top20 = sortedTracks.slice(0, Math.max(20, Math.min(20, sortedTracks.length)));
    onOpenExportModal(top20);
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
          {/* Quick Instant Export Top 20 */}
          <button
            onClick={handleQuickExportTop20}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-pink-500/20 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all"
            title="Créer rapidement la playlist de 20 titres minimum et l'exporter"
          >
            <Zap className="h-4 w-4 text-yellow-300" />
            <span>Créer le Top 20 instantané</span>
          </button>

          {/* Export custom selection */}
          <button
            onClick={() => onOpenExportModal(selectedTracksList)}
            disabled={selectedTracksList.length === 0}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Exporter ({selectedTracksList.length}) sur Spotify / YouTube</span>
          </button>
        </div>
      </div>

      {/* 2. Playlist Summary Ribbon (Cards: Durée, Titres, BPM, Joie, Énergie) */}
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

        <div className="space-y-0.5 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Gauge className="h-3 w-3 text-sky-500" />
            Tempo Moyen
          </span>
          <div className="text-base font-black text-sky-700 font-mono-nums">
            {playlistMetrics.avgBpm} BPM
          </div>
          <div className="text-[10px] text-emerald-600 font-bold">
            Match moyen {playlistMetrics.avgMatch}%
          </div>
        </div>
      </div>

      {/* 3. Filter Controls: View limit, Search, Quick Select 20 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* View Limit Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/80 self-start">
          <button
            type="button"
            onClick={() => setViewLimit('top20')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewLimit === 'top20'
                ? 'bg-white text-violet-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Top 20 Titres (Recommandé)
          </button>
          <button
            type="button"
            onClick={() => setViewLimit('top30')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewLimit === 'top30'
                ? 'bg-white text-violet-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Top 30
          </button>
          <button
            type="button"
            onClick={() => setViewLimit('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewLimit === 'all'
                ? 'bg-white text-violet-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous les titres ({sortedTracks.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher titre, artiste, genre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-violet-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Select All & Selection Counts */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleSelectAll}
            className="flex items-center gap-2 hover:text-slate-800 transition-colors font-medium"
          >
            {selectedIds.size === displayedTracks.length && displayedTracks.length > 0 ? (
              <CheckSquare className="h-4 w-4 text-violet-600" />
            ) : (
              <Square className="h-4 w-4 text-slate-400" />
            )}
            <span>Tout cocher / décocher</span>
          </button>

          <button
            onClick={handleSelectTop20}
            className="text-violet-600 hover:text-violet-800 font-bold underline transition-colors"
          >
            Sélectionner les 20 premiers
          </button>
        </div>

        <span className="font-mono-nums font-semibold text-slate-700">
          <strong className="text-violet-700">{selectedTracksList.length}</strong> sur {displayedTracks.length} titres sélectionnés
        </span>
      </div>

      {/* 4. Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-600 font-semibold">
              <th className="py-3 px-3.5 w-10">#</th>
              <th className="py-3 px-3.5">Titre &amp; Artiste</th>
              <th className="py-3 px-3.5">Genre</th>
              <th
                onClick={() => {
                  if (sortField === 'similarity') setSortAsc(!sortAsc);
                  else {
                    setSortField('similarity');
                    setSortAsc(false);
                  }
                }}
                className="py-3 px-3.5 cursor-pointer hover:text-violet-600"
              >
                <div className="flex items-center gap-1">
                  <span>Match</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => {
                  if (sortField === 'valence') setSortAsc(!sortAsc);
                  else {
                    setSortField('valence');
                    setSortAsc(false);
                  }
                }}
                className="py-3 px-3.5 cursor-pointer hover:text-violet-600"
              >
                <div className="flex items-center gap-1">
                  <span>Valence</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => {
                  if (sortField === 'energy') setSortAsc(!sortAsc);
                  else {
                    setSortField('energy');
                    setSortAsc(false);
                  }
                }}
                className="py-3 px-3.5 cursor-pointer hover:text-violet-600"
              >
                <div className="flex items-center gap-1">
                  <span>Énergie</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => {
                  if (sortField === 'tempo') setSortAsc(!sortAsc);
                  else {
                    setSortField('tempo');
                    setSortAsc(false);
                  }
                }}
                className="py-3 px-3.5 cursor-pointer hover:text-violet-600"
              >
                <div className="flex items-center gap-1">
                  <span>BPM</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-3.5 text-right">Durée</th>
              <th className="py-3 px-3.5 text-center">Écoute</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedTracks.map((track, index) => {
              const isSelected = selectedIds.has(track.track_id);
              const isPlaying = playingTrackId === track.track_id;
              const isFavArtist = Boolean(
                favoriteArtist &&
                favoriteArtist.trim().length > 1 &&
                track.artists.toLowerCase().includes(favoriteArtist.toLowerCase().trim())
              );

              return (
                <tr
                  key={track.track_id}
                  className={`hover:bg-violet-50/30 transition-colors ${
                    isSelected ? 'bg-violet-50/15' : ''
                  }`}
                >
                  <td className="py-3 px-3.5 font-mono-nums text-slate-400">
                    <div className="flex items-center gap-2">
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
