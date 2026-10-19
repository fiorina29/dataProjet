import React, { useState } from 'react';
import { User, MapPin, Music2, Mail, Heart, Sparkles, X, UserCheck } from 'lucide-react';
import { UserProfile } from '../types';
import { AVAILABLE_GENRES } from '../data/kaggleSampleDataset';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile?: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  isInitialSignUp?: boolean;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  initialProfile,
  onSaveProfile,
  isInitialSignUp = false,
}) => {
  const [nom, setNom] = useState(initialProfile?.nom || 'Dupont');
  const [prenom, setPrenom] = useState(initialProfile?.prenom || 'Alexandre');
  const [email, setEmail] = useState(initialProfile?.email || 'alexandre.dupont@email.com');
  const [age, setAge] = useState(initialProfile?.age || 22);
  const [ville, setVille] = useState(initialProfile?.ville || 'Paris');
  const [genre, setGenre] = useState(initialProfile?.genre_musical_prefere || 'Pas de préférence');
  const [artistePref, setArtistePref] = useState(initialProfile?.artiste_prefere || 'Daft Punk');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
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
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl space-y-5 animate-in fade-in duration-200 text-slate-800">
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
                Ces critères personnaliseront chaque recommandation selon vos goûts
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
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

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
                Adresse email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              Ville habituelle (utilisée par défaut si le GPS est inactif)
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
              <span>{isInitialSignUp ? 'Créer mon compte & Démarrer' : 'Enregistrer mon profil'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
