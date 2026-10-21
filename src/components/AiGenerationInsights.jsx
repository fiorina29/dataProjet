import {
  Sparkles,
  Zap,
  Clock,
  Compass,
  Sliders,
  CheckCircle2,
  Bot,
  Heart
} from "lucide-react";
export const AiGenerationInsights = ({
  aiResult,
  isLoading,
  onOpenTestModal,
  onRegenerate,
  isAiMode,
  onToggleAiMode,
  profile,
  selectedContext,
  selectedMood
}) => {
  const targets = aiResult?.spotify_audio_features_targets || {
    target_valence: 0.5,
    target_energy: 0.5,
    target_danceability: 0.5,
    target_acousticness: 0.5
  };
  const rawTitle = aiResult?.playlist_title || (selectedContext?.includes("fete") ? "Fiesta Dance & Pop Party" : selectedContext?.includes("sport") ? "Workout Motivation Booster" : "Recommandation Musicologique & ML");
  const cleanTitle = rawTitle.replace(/mistral/gi, "Vibes");
  const rawDesc = aiResult?.playlist_description || (selectedContext?.includes("fete") ? "S\xE9lection rythm\xE9e, joyeuse et dansante sans m\xE9lancolie." : selectedContext?.includes("sport") ? "Rythme intense et percutant pour booster vos performances." : "Inf\xE9rence des caract\xE9ristiques audio Spotify selon l'humeur, la m\xE9t\xE9o et le profil.");
  const cleanDesc = rawDesc.replace(/mistral/gi, "rythme");
  return <div className="rounded-3xl border border-violet-200/90 bg-gradient-to-br from-violet-50/70 via-white to-pink-50/60 p-6 sm:p-7 shadow-xs space-y-5">
      {
    /* Top Banner Header */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-violet-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-600 text-white shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                {cleanTitle}
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-600 text-white shadow-2xs">
                <CheckCircle2 className="h-3 w-3" />
                {aiResult?.isAiGenerated ? "IA Gemini Active" : "Heuristique"}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {cleanDesc}
            </p>
          </div>
        </div>

        {
    /* Action Controls & AI Toggle */
  }
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {
    /* AI vs Heuristic Toggle */
  }
          <button
    type="button"
    onClick={() => onToggleAiMode(!isAiMode)}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isAiMode ? "bg-violet-100/80 border-violet-300 text-violet-800" : "bg-white border-slate-200 text-slate-600"}`}
  >
            <Bot className="h-3.5 w-3.5 text-violet-600" />
            <span>Mode IA {isAiMode ? "Activ\xE9" : "D\xE9sactiv\xE9"}</span>
          </button>

          {
    /* Test Console Trigger */
  }
          <button
    type="button"
    onClick={onOpenTestModal}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 text-pink-700 text-xs font-bold shadow-2xs transition-all"
  >
            <Zap className="h-3.5 w-3.5 text-pink-500" />
            <span>Tester l'API Gemini</span>
          </button>
        </div>
      </div>

      {
    /* Active Personalization & Context Guarantees */
  }
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-white/70 border border-violet-100 text-xs">
        <span className="font-extrabold text-slate-700 flex items-center gap-1.5 shrink-0">
          <Heart className="h-3.5 w-3.5 text-rose-500" />
          Personnalisation :
        </span>

        {profile?.artiste_prefere && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 font-bold border border-rose-200/80">
            Artiste favori : {profile.artiste_prefere}
          </span>}

        {profile?.genre_musical_prefere && !profile.genre_musical_prefere.toLowerCase().includes("pas de pr\xE9f\xE9rence") && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-violet-50 text-violet-700 font-bold border border-violet-200/80">
            Genre : {profile.genre_musical_prefere}
          </span>}

        {selectedContext?.includes("fete") && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 font-bold border border-amber-200/80">
            🎉 Fête active : 100% dansant & joyeux (morceaux tristes exclus)
          </span>}

        {selectedContext?.includes("sport") && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/80">
            🏃 Sport actif : Énergie & motivation maximales (tempo élevé)
          </span>}
      </div>

      {
    /* Reasoning and Insights */
  }
      {aiResult?.ai_reasoning && <div className="p-4 rounded-2xl bg-white/90 border border-violet-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-violet-900 flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-violet-600" />
              Raisonnement Musicologique (Google AI Studio)
            </span>
            {aiResult.durationMs && <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {aiResult.durationMs} ms · {aiResult.model}
              </span>}
          </div>
          <p className="text-xs text-slate-700 leading-relaxed italic">
            "{aiResult.ai_reasoning}"
          </p>

          {
    /* Vibe Keywords Pills */
  }
          {aiResult.vibe_keywords && aiResult.vibe_keywords.length > 0 && <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400">Ambiance :</span>
              {aiResult.vibe_keywords.map((kw, idx) => <span
    key={idx}
    className="px-2 py-0.5 rounded-lg bg-violet-100/70 text-violet-700 text-[11px] font-semibold"
  >
                  #{kw.replace(/^#/, "")}
                </span>)}
            </div>}
        </div>}

      {
    /* Audio Features Targets Gauges */
  }
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-violet-600" />
            Cibles Audio Spotify Prédites :
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Genres : {aiResult?.genres_recommandes?.slice(0, 4).join(", ") || "pop, rock"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {
    /* Valence */
  }
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
              <span>Valence (Joie)</span>
              <span className="font-mono text-violet-600">
                {Math.round(targets.target_valence * 100)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
    className="h-full bg-gradient-to-r from-amber-400 to-pink-500 rounded-full transition-all duration-500"
    style={{ width: `${Math.round(targets.target_valence * 100)}%` }}
  />
            </div>
          </div>

          {
    /* Energy */
  }
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
              <span>Énergie</span>
              <span className="font-mono text-pink-600">
                {Math.round(targets.target_energy * 100)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
    className="h-full bg-gradient-to-r from-violet-500 to-pink-600 rounded-full transition-all duration-500"
    style={{ width: `${Math.round(targets.target_energy * 100)}%` }}
  />
            </div>
          </div>

          {
    /* Danceability */
  }
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
              <span>Dansabilité</span>
              <span className="font-mono text-purple-600">
                {Math.round(targets.target_danceability * 100)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
    className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-500"
    style={{ width: `${Math.round(targets.target_danceability * 100)}%` }}
  />
            </div>
          </div>

          {
    /* Acousticness */
  }
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
              <span>Acousticness</span>
              <span className="font-mono text-emerald-600">
                {Math.round(targets.target_acousticness * 100)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
    className="h-full bg-gradient-to-r from-sky-400 to-emerald-500 rounded-full transition-all duration-500"
    style={{ width: `${Math.round(targets.target_acousticness * 100)}%` }}
  />
            </div>
          </div>
        </div>
      </div>
    </div>;
};
