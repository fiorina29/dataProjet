import React from 'react';
import { User, MapPin, Music, Radio, Edit3, CheckCircle2, Heart, Mail, Youtube, ArrowRight } from 'lucide-react';
import { UserProfile, ServiceAuthStatus } from '../types';

interface MyAccountPageProps {
  profile: UserProfile;
  authStatus: ServiceAuthStatus;
  onEditProfile: () => void;
  onToggleSpotify: () => void;
  onToggleYoutube: () => void;
  onGoToGenerator: () => void;
}

export const MyAccountPage: React.FC<MyAccountPageProps> = ({
  profile,
  authStatus,
  onEditProfile,
  onToggleSpotify,
  onToggleYoutube,
  onGoToGenerator,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Mon Compte</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Informations renseignées lors de votre inscription &amp; synchronisation musicale
          </p>
        </div>

        <button
          onClick={onEditProfile}
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <Edit3 className="h-3.5 w-3.5 text-violet-600" />
          <span>Modifier mon profil</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Carte 1: Profil Utilisateur */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 text-white shadow-md shadow-violet-500/20">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {profile.prenom} {profile.nom}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span>{profile.email}</span>
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs border-t border-slate-100">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Âge :</span>
              <span className="font-mono-nums font-bold text-slate-800">{profile.age} ans</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Ville par défaut :</span>
              <span className="flex items-center gap-1.5 font-bold text-violet-600">
                <MapPin className="h-3.5 w-3.5" />
                <span>{profile.ville}</span>
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Genre musical préféré :</span>
              <span className="font-bold text-slate-800 capitalize bg-slate-100 px-2.5 py-1 rounded-lg">
                {profile.genre_musical_prefere}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Artiste préféré :</span>
              <span className="flex items-center gap-1.5 font-bold text-rose-600">
                <Heart className="h-3.5 w-3.5" />
                <span>{profile.artiste_prefere || 'Non renseigné'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Carte 2: Connexions Musicales (Spotify & YouTube) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Comptes de Streaming</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Associez vos plateformes pour exporter vos playlists en un clic
            </p>
          </div>

          <div className="space-y-3.5 pt-1">
            {/* Spotify */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/50">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white">
                  <Radio className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Spotify</h4>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {authStatus.spotify.isConnected ? 'Connecté' : 'Non connecté'}
                  </span>
                </div>
              </div>

              <button
                onClick={onToggleSpotify}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  authStatus.spotify.isConnected
                    ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                }`}
              >
                {authStatus.spotify.isConnected ? 'Déconnecter' : 'Connecter'}
              </button>
            </div>

            {/* YouTube */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-rose-100 bg-rose-50/50">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white">
                  <Youtube className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">YouTube Music</h4>
                  <span className="text-[11px] text-red-700 font-medium">
                    {authStatus.youtube.isConnected ? 'Connecté' : 'Non connecté'}
                  </span>
                </div>
              </div>

              <button
                onClick={onToggleYoutube}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  authStatus.youtube.isConnected
                    ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                }`}
              >
                {authStatus.youtube.isConnected ? 'Déconnecter' : 'Connecter'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action banner */}
      <div className="rounded-3xl bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-bold">Prêt pour votre prochaine session d'écoute ?</h4>
          <p className="text-xs text-white/90 mt-1">
            Générez une playlist basée sur votre humeur et le moment présent.
          </p>
        </div>
        <button
          onClick={onGoToGenerator}
          className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-slate-900 shadow-md hover:bg-slate-100 transition-colors whitespace-nowrap"
        >
          <span>Accéder au Générateur</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
