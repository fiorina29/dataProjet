import React from 'react';
import { Music, UserPlus } from 'lucide-react';

export const TopBar = ({
  profile,
  onSelectTab,
  onOpenSignUp,
  onOpenLogin,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 border-b border-slate-200/80 bg-white/85 px-6 py-3.5 backdrop-blur-md shadow-xs">
      {/* Zone 1: Single Brand Wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 text-white shadow-sm">
          <Music className="h-5 w-5" />
        </div>
        <button
          onClick={() => onSelectTab('generator')}
          className="text-left group"
        >
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 bg-clip-text text-transparent">
            MoodWave
          </span>
        </button>
      </div>

      {/* Zone 2: Auth Buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
        {!profile && (
          <div className="flex items-center gap-2">
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
          </div>
        )}
      </div>
    </header>
  );
};
