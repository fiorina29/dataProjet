import { useState } from "react";
import { LogIn, Mail, Lock, X } from "lucide-react";
export const LoginModal = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onSwitchToSignUp
}) => {
  const [email, setEmail] = useState("alexandre.dupont@email.com");
  const [password, setPassword] = useState("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022");
  if (!isOpen) return null;
  const handleSubmit = (e) => {
    e.preventDefault();
    onLoginSuccess(email);
    onClose();
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in fade-in duration-200 text-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <LogIn className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Connexion</h3>
              <p className="text-xs text-slate-500">Accédez à vos playlists MoodWave</p>
            </div>
          </div>
          <button
    onClick={onClose}
    className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
  >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
    type="email"
    required
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-violet-500 focus:outline-none"
  />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
    type="password"
    required
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-violet-500 focus:outline-none"
  />
            </div>
          </div>

          <button
    type="submit"
    className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:opacity-95 transition-all"
  >
            Se connecter
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          <span>Pas encore de compte ? </span>
          <button
    onClick={() => {
      onClose();
      onSwitchToSignUp();
    }}
    className="font-bold text-violet-600 hover:underline"
  >
            S'inscrire
          </button>
        </div>
      </div>
    </div>;
};
