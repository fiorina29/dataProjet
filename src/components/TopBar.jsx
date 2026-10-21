import { Music, User, UserPlus, Sparkles } from "lucide-react";
export const TopBar = ({
  profile,
  authStatus,
  activeTab,
  onSelectTab,
  onOpenSignUp,
  onOpenLogin,
  onLogout,
  aiStatus,
  onOpenAiTest
}) => {
  return <header className="sticky top-0 z-30 flex items-center justify-between gap-8 border-b border-slate-200/80 bg-white/85 px-6 py-3.5 backdrop-blur-md shadow-xs">
      {
    /* Zone 1: Single Brand Wordmark */
  }
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 text-white shadow-sm">
          <Music className="h-5 w-5" />
        </div>
        <button
    onClick={() => onSelectTab(profile ? "generator" : "home")}
    className="text-left group"
  >
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 bg-clip-text text-transparent">
            MoodWave
          </span>
        </button>
      </div>

      {
    /* Zone 2: Navigation Links */
  }
      <nav className="flex items-center gap-6 text-sm font-semibold text-slate-600">
        <button
    onClick={() => onSelectTab("home")}
    className={`whitespace-nowrap transition-colors ${activeTab === "home" ? "text-violet-600 font-bold" : "hover:text-slate-900"}`}
  >
          Accueil
        </button>
        <button
    onClick={() => onSelectTab("generator")}
    className={`whitespace-nowrap transition-colors ${activeTab === "generator" ? "text-violet-600 font-bold" : "hover:text-slate-900"}`}
  >
          Générateur
        </button>
        {profile && <button
    onClick={() => onSelectTab("account")}
    className={`whitespace-nowrap transition-colors ${activeTab === "account" ? "text-violet-600 font-bold" : "hover:text-slate-900"}`}
  >
            Mon Compte
          </button>}
      </nav>

      {
    /* Zone 3: AI Test + Auth Buttons */
  }
      <div className="flex items-center gap-2.5 shrink-0">
        <button
    type="button"
    onClick={onOpenAiTest}
    title="Ouvrir la console de test de l'IA Gemini (Google AI Studio)"
    className="flex items-center gap-1.5 rounded-xl border border-violet-200/90 bg-violet-50/80 hover:bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-800 shadow-2xs transition-all hover:scale-102"
  >
          <Sparkles className="h-3.5 w-3.5 text-violet-600 animate-pulse" />
          <span className="hidden sm:inline">IA Gemini</span>
          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-extrabold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Test
          </span>
        </button>

        {profile ? <div className="flex items-center gap-2">
            <button
    onClick={() => onSelectTab("account")}
    className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 text-xs font-bold text-slate-800 transition-colors"
  >
              <User className="h-3.5 w-3.5 text-violet-600" />
              <span>{profile.prenom || profile.nom}</span>
            </button>
            <button
    onClick={onLogout}
    className="text-xs text-slate-400 hover:text-slate-700 font-medium px-2 py-1 transition-colors"
  >
              Déconnexion
            </button>
          </div> : <div className="flex items-center gap-2">
            <button
    onClick={onOpenLogin}
    className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
  >
              Se connecter
            </button>
            <button
    onClick={onOpenSignUp}
    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95 transition-opacity"
  >
              <UserPlus className="h-3.5 w-3.5" />
              <span>S'inscrire</span>
            </button>
          </div>}
      </div>
    </header>;
};
