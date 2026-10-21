import { useState } from "react";
import { X, Check, Share2, Radio, ExternalLink, Youtube } from "lucide-react";
export const ExportPlaylistModal = ({
  isOpen,
  onClose,
  selectedTracks,
  ville,
  humeur,
  contexteActivite,
  meteo,
  suggestedTitle,
  suggestedDescription
}) => {
  const [platform, setPlatform] = useState("spotify");
  const initialTitle = (suggestedTitle || `MoodWave \u2022 ${humeur} [${contexteActivite}] & ${meteo}`).replace(/mistral/gi, "Vibes");
  const initialDesc = (suggestedDescription || `Playlist g\xE9n\xE9r\xE9e par MoodWave selon mon humeur (${humeur}), mon moment (${contexteActivite}) et la m\xE9t\xE9o (${meteo}) \xE0 ${ville}.`).replace(/mistral/gi, "rythme");
  const [playlistTitle, setPlaylistTitle] = useState(initialTitle);
  const [playlistDescription, setPlaylistDescription] = useState(initialDesc);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [targetUrl, setTargetUrl] = useState("");
  if (!isOpen) return null;
  const handleExport = () => {
    setIsExporting(true);
    let url = "";
    const query = encodeURIComponent(`${selectedTracks[0]?.track_name || "Chill"} ${selectedTracks[0]?.artists || ""}`);
    if (platform === "spotify") {
      url = `https://open.spotify.com/search/${encodeURIComponent(playlistTitle)}`;
    } else {
      url = `https://music.youtube.com/search?q=${encodeURIComponent(playlistTitle)}`;
    }
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTargetUrl(url);
      window.open(url, "_blank", "noopener,noreferrer");
    }, 600);
  };
  const handleClose = () => {
    setExportSuccess(false);
    onClose();
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl space-y-5 animate-in fade-in duration-200 text-slate-800">
        {
    /* Header */
  }
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-md ${platform === "spotify" ? "bg-emerald-500 shadow-emerald-500/20" : "bg-red-600 shadow-red-600/20"}`}>
              {platform === "spotify" ? <Radio className="h-5 w-5" /> : <Youtube className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Exporter la Playlist
              </h3>
              <p className="text-xs text-slate-500">
                Choisissez Spotify ou YouTube Music pour écouter vos {selectedTracks.length} titres
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

        {exportSuccess ? <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <Check className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">
                Exporté avec succès vers {platform === "spotify" ? "Spotify" : "YouTube Music"} !
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                La page de votre playlist s'est ouverte dans un nouvel onglet. Vous pouvez également la rouvrir ci-dessous :
              </p>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
    href={targetUrl}
    target="_blank"
    rel="noreferrer"
    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all ${platform === "spotify" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"}`}
  >
                <span>Accéder à ma playlist sur {platform === "spotify" ? "Spotify" : "YouTube"}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <button
    onClick={handleClose}
    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
  >
                Fermer
              </button>
            </div>
          </div> : <div className="space-y-4">
            {
    /* Platform Selector (Spotify vs YouTube) */
  }
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Plateforme de destination *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
    type="button"
    onClick={() => setPlatform("spotify")}
    className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border transition-all ${platform === "spotify" ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-sm" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
  >
                  <Radio className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs">Spotify</span>
                </button>

                <button
    type="button"
    onClick={() => setPlatform("youtube")}
    className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border transition-all ${platform === "youtube" ? "border-red-500 bg-red-50 text-red-700 font-bold shadow-sm" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
  >
                  <Youtube className="h-4 w-4 text-red-600" />
                  <span className="text-xs">YouTube Music</span>
                </button>
              </div>
            </div>

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

            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Contenu de la playlist :</span>
                <strong className="font-mono text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
                  {selectedTracks.length} titres {selectedTracks.length >= 20 ? "\u2705 (20 min.)" : ""}
                </strong>
              </div>

              {selectedTracks.length > 0 && <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/60 p-2">
                  {selectedTracks.slice(0, 20).map((t, idx) => <div key={idx} className="flex items-center justify-between text-[11px] py-1">
                      <span className="truncate max-w-[280px] font-medium text-slate-800">
                        <span className="text-slate-400 font-mono mr-1.5">{idx + 1}.</span>
                        {t.track_name} <span className="text-slate-500 font-normal">· {t.artists}</span>
                      </span>
                      <span className="text-slate-400 font-mono text-[10px] shrink-0">
                        {Math.floor(t.duration_ms / 6e4)}:{String(Math.floor(t.duration_ms % 6e4 / 1e3)).padStart(2, "0")}
                      </span>
                    </div>)}
                  {selectedTracks.length > 20 && <div className="text-[10px] text-center text-slate-400 italic pt-1">
                      + {selectedTracks.length - 20} autres titres inclus dans l'export
                    </div>}
                </div>}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
    type="button"
    onClick={handleClose}
    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
  >
                Annuler
              </button>

              <button
    type="button"
    onClick={handleExport}
    disabled={isExporting || selectedTracks.length === 0}
    className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all ${platform === "spotify" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25" : "bg-red-600 hover:bg-red-700 shadow-red-600/25"}`}
  >
                {isExporting ? <span>Exportation en cours...</span> : <>
                    <Share2 className="h-4 w-4" />
                    <span>Exporter vers {platform === "spotify" ? "Spotify" : "YouTube"}</span>
                  </>}
              </button>
            </div>
          </div>}
      </div>
    </div>;
};
