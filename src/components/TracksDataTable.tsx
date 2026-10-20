import React, { useState } from 'react';
import { Play, Pause, Search, ArrowUpDown, Share2, Music, CheckSquare, Square, Radio, Youtube } from 'lucide-react';
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
  const [sortField, setSortField] = useState<'similarity' | 'popularity' | 'valence' | 'energy' | 'tempo'>('similarity');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(tracks.map((t) => t.track_id))
  );
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  // Web Audio synth for playback preview
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

  const handleToggleSelectAll = () => {
    if (selectedIds.size === tracks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tracks.map((t) => t.track_id)));
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

  const filteredTracks = tracks
    .filter((track) => {
      const term = searchTerm.toLowerCase();
      return (
        track.track_name.toLowerCase().includes(term) ||
        track.artists.toLowerCase().includes(term) ||
        track.album_name.toLowerCase().includes(term) ||
        track.track_genre.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
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

  const selectedTracksList = tracks.filter((t) => selectedIds.has(t.track_id));

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 sm:p-7 shadow-sm space-y-5">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-black text-slate-900">
            Votre Playlist ({filteredTracks.length} titres)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Sélection générée sur-mesure selon votre humeur, votre contexte et la météo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher titre, artiste..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-violet-500 focus:outline-none transition-all"
            />
          </div>

          {/* Export to Spotify or YouTube */}
          <button
            onClick={() => onOpenExportModal(selectedTracksList)}
            disabled={selectedTracksList.length === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Exporter ({selectedTracksList.length}) sur Spotify / YouTube</span>
          </button>
        </div>
      </div>

      {/* Select All Row */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <button
          onClick={handleToggleSelectAll}
          className="flex items-center gap-2 hover:text-slate-800 transition-colors font-medium"
        >
          {selectedIds.size === tracks.length ? (
            <CheckSquare className="h-4 w-4 text-violet-600" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
          <span>Tout cocher / décocher</span>
        </button>

        <span className="font-mono-nums font-semibold text-slate-700">
          {selectedTracksList.length} sur {tracks.length} titres sélectionnés
        </span>
      </div>

      {/* Table */}
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
            {filteredTracks.map((track) => {
              const isSelected = selectedIds.has(track.track_id);
              const isPlaying = playingTrackId === track.track_id;

              return (
                <tr
                  key={track.track_id}
                  className={`hover:bg-violet-50/30 transition-colors ${
                    isSelected ? 'bg-violet-50/15' : ''
                  }`}
                >
                  <td className="py-3 px-3.5">
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
                  </td>

                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 max-w-[200px] truncate">
                        {track.track_name}
                      </span>
                      {favoriteArtist && track.artists.toLowerCase().includes(favoriteArtist.toLowerCase().trim()) && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-rose-100 text-rose-700">
                          ❤️ Favori
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 max-w-[240px] truncate">
                      {track.artists} · {track.album_name}
                    </div>
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
                      title="Écouter un extrait sonore"
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
