import React, { useState } from 'react';
import {
  MapPin,
  Music2,
  Mail,
  Heart,
  Sparkles,
  X,
  UserCheck,
  Youtube,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AVAILABLE_GENRES } from '../data/kaggleSampleDataset';
import { GoogleSignInButton } from './GoogleSignInButton';

export const RegistrationModal = ({
  isOpen,
  onClose,
  initialProfile,
  onSaveProfile,
  onGoogleSignIn,
  isInitialSignUp = false,
}) => {
  const [nom, setNom] = useState(initialProfile?.nom || 'Dupont');
  const [prenom, setPrenom] = useState(initialProfile?.prenom || 'Alexandre');
  const [email, setEmail] = useState(initialProfile?.email || 'alexandre.dupont@email.com');
  const [age, setAge] = useState(initialProfile?.age || 22);
  const [ville, setVille] = useState(initialProfile?.ville || 'Paris');
  const [genre, setGenre] = useState(
    initialProfile?.genre_musical_prefere || 'Pas de préférence'
  );
  const [artistePref, setArtistePref] = useState(
    initialProfile?.artiste_prefere || 'Daft Punk'
  );
  const [error, setError] = useState('');
  const [isVerifyingGoogle, setIsVerifyingGoogle] = useState(false);
  const [youtubeAccountStatus, setYoutubeAccountStatus] = useState(
    initialProfile?.hasGoogleAuth
      ? { isConnected: true, email: initialProfile?.email }
      : null
  );

  if (!isOpen) return null;

  // 1-Click Sign-in / Verification via Google & YouTube
  const handleGoogleQuickAuth = async () => {
    setIsVerifyingGoogle(true);
    setError('');
    try {
      if (onGoogleSignIn) {
        const authData = await onGoogleSignIn();
        if (authData) {
          const user = authData.user;
          const account = authData.youtubeAccount;
          const displayName = user.displayName || '';
          const parts = displayName.split(' ');
          const first = parts[0] || 'Utilisateur';
          const last = parts.slice(1).join(' ') || 'Google';

          setPrenom(first);
          setNom(last);
          setEmail(user.email || '');
          setYoutubeAccountStatus({
            isConnected: Boolean(account?.isConnected),
            hasInsufficientScope: Boolean(account?.hasInsufficientScope),
            email: user.email,
            displayName: user.displayName,
            reason: account?.reason,
          });

          if (account?.hasInsufficientScope) {
            setError(
              "Permissions YouTube insuffisantes : assurez-vous de cocher l'autorisation d'accès à vos playlists YouTube lors de la validation Google."
            );
          }
        }
      }
    } catch (err) {
      console.error('Google registration error:', err);
      setError(err.message || 'Erreur lors de la connexion Google');
    } finally {
      setIsVerifyingGoogle(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim()) {
      setError('Veuillez renseigner votre nom et prénom.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }
    if (age < 12 || age > 115) {
      setError('Veuillez entrer un âge valide.');
      return;
    }

    onSaveProfile({
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim(),
      age: Number(age),
      ville: ville.trim() || 'Paris',
      genre_musical_prefere: genre,
      artiste_prefere: artistePref.trim(),
      hasGoogleAuth: Boolean(youtubeAccountStatus?.isConnected),
      hasYouTubeAccount: Boolean(youtubeAccountStatus?.isConnected),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl space-y-5 animate-in fade-in duration-200 text-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 to-violet-600 text-white shadow-md shadow-pink-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isInitialSignUp ? 'Créer votre profil musical' : 'Modifier vos informations'}
              </h3>
              <p className="text-xs text-slate-500">
                Connectez votre compte Google / YouTube ou renseignez un compte lambda
              </p>
            </div>
          </div>
          {!isInitialSignUp && (
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Fast Google / YouTube Auth Option */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Youtube className="h-4 w-4 text-red-600" />
              Compte Google &amp; YouTube
            </span>
            {youtubeAccountStatus?.isConnected && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                Compte YouTube connecté
              </span>
            )}
          </div>

          <GoogleSignInButton
            onClick={handleGoogleQuickAuth}
            disabled={isVerifyingGoogle}
            text={
              isVerifyingGoogle
                ? 'Connexion et autorisation YouTube...'
                : youtubeAccountStatus?.isConnected
                ? `Connecté avec Google : ${email}`
                : "S'inscrire avec Google (Active l'export YouTube)"
            }
          />

          {youtubeAccountStatus?.isConnected && (
            <p className="text-[11px] text-emerald-700 font-medium">
              ✅ Votre compte Google ({email}) est prêt. Vous pourrez créer vos playlists directement dans votre compte YouTube.
            </p>
          )}

          {!youtubeAccountStatus?.isConnected && (
            <p className="text-[11px] text-slate-500">
              💡 La connexion avec Google permet de créer automatiquement vos playlists sur votre compte YouTube.
            </p>
          )}
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Ou compte standard / lambda
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom & Prénom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prénom *
              </label>
              <input
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ex: Alexandre"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Dupont"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Email & Âge */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse email (lambda ou Google) *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  placeholder="nom@exemple.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Âge *
              </label>
              <input
                type="number"
                min="12"
                max="115"
                required
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 20)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none transition-all font-mono-nums"
              />
            </div>
          </div>

          {/* Ville */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ville habituelle (utilisée si le GPS météo est inactif)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                placeholder="Ex: Paris, Lyon, Marseille..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Genre musical préféré & Artiste préféré */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Genre musical préféré
              </label>
              <div className="relative">
                <Music2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none transition-all cursor-pointer"
                >
                  {AVAILABLE_GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Artiste ou groupe préféré
              </label>
              <div className="relative">
                <Heart className="absolute left-3 top-2.5 h-4 w-4 text-rose-400" />
                <input
                  type="text"
                  value={artistePref}
                  onChange={(e) => setArtistePref(e.target.value)}
                  placeholder="Ex: Daft Punk, Coldplay..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            {!isInitialSignUp && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
            )}
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/25 hover:opacity-95 hover:scale-[1.01] transition-all"
            >
              <UserCheck className="h-4 w-4" />
              <span>
                {isInitialSignUp
                  ? 'Créer mon compte & Démarrer'
                  : 'Enregistrer mon profil'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
