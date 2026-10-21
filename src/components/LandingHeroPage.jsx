import { Sparkles, Headphones, Radio, UserPlus, LogIn, Disc3, CloudSun } from "lucide-react";
export const LandingHeroPage = ({
  onOpenSignUp,
  onOpenLogin,
  onContinueAsGuest
}) => {
  return <div className="py-8 sm:py-14 space-y-12">
      {
    /* Hero Banner */
  }
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-pink-500 to-amber-400 p-8 sm:p-14 text-white shadow-xl shadow-pink-500/10">
        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span>Votre musique accordée à votre vie en temps réel</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Des playlists générées par votre humeur, votre météo et votre moment.
          </h1>

          <p className="text-sm sm:text-base text-white/90 leading-relaxed font-normal">
            En voiture, en soirée, avec les enfants ou au travail... MoodWave écoute la météo de votre ville
            et votre énergie du jour pour concevoir la playlist parfaite et l'exporter en 1 clic sur Spotify ou YouTube.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <button
    onClick={onOpenSignUp}
    className="flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-neutral-900 shadow-lg hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
  >
              <UserPlus className="h-4 w-4 text-violet-600" />
              <span>S'inscrire (C'est gratuit)</span>
            </button>

            <button
    onClick={onOpenLogin}
    className="flex items-center gap-2 rounded-xl bg-neutral-950/40 hover:bg-neutral-950/60 px-5 py-3.5 text-sm font-semibold text-white border border-white/20 backdrop-blur-md transition-all"
  >
              <LogIn className="h-4 w-4" />
              <span>Se connecter</span>
            </button>

            <button
    onClick={onContinueAsGuest}
    className="text-xs text-white/90 hover:text-white underline underline-offset-4 font-medium transition-colors py-2"
  >
              Découvrir le générateur sans compte &rarr;
            </button>
          </div>
        </div>

        {
    /* Decorative Musical Elements */
  }
        <div className="absolute right-[-20px] bottom-[-20px] opacity-15 pointer-events-none hidden md:block">
          <Disc3 className="h-96 w-96 animate-spin duration-1000" />
        </div>
      </div>

      {
    /* Feature Pillars */
  }
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-pink-200/80 bg-white/90 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-pink-600 mb-4">
            <Headphones className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">12 Humeurs &amp; 10 Situations</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Voiture, fête, entraînement sportif, enfants... Chaque nuance émotionnelle et contextuelle ajuste le tempo et l'énergie.
          </p>
        </div>

        <div className="rounded-2xl border border-sky-200/80 bg-white/90 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 mb-4">
            <CloudSun className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Météo en direct par GPS</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            La géolocalisation de votre appareil détecte la météo réelle (pluie, soleil, nuages) pour créer l'ambiance sonore idéale.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-white/90 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
            <Radio className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Export Spotify &amp; YouTube</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Ouvrez et écoutez directement votre playlist sur votre plateforme favorite en un seul clic.
          </p>
        </div>
      </div>
    </div>;
};
