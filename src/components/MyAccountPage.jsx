import React, { useState } from 'react';
import {
  User,
  MapPin,
  Edit3,
  Heart,
  Mail,
  Youtube,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';

export const MyAccountPage = ({
  profile,
  authStatus,
  onEditProfile,
  onToggleYoutube,
  onGoogleSignIn,
  onGoToGenerator,
}) => {
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const isYouTubeConnected = Boolean(
    authStatus.youtube?.isConnected || profile?.hasGoogleAuth
  );

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    setGoogleError('');
    try {
      if (onGoogleSignIn) {
        await onGoogleSignIn();
      }
    } catch (err) {
      console.error('Google connect error:', err);
      setGoogleError(err.message || 'Erreur lors de la connexion Google');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Mon Compte</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Informations de profil &amp; export de playlists YouTube
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
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.prenom}
                className="h-12 w-12 rounded-2xl border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 text-white shadow-md shadow-violet-500/20">
                <User className="h-6 w-6" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {profile?.prenom} {profile?.nom}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span>{profile?.email}</span>
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs border-t border-slate-100">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Âge :</span>
              <span className="font-mono-nums font-bold text-slate-800">
                {profile?.age} ans
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Ville par défaut :</span>
              <span className="flex items-center gap-1.5 font-bold text-violet-600">
                <MapPin className="h-3.5 w-3.5" />
                <span>{profile?.ville}</span>
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Genre musical préféré :</span>
              <span className="font-bold text-slate-800 capitalize bg-slate-100 px-2.5 py-1 rounded-lg">
                {profile?.genre_musical_prefere}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Artiste préféré :</span>
              <span className="flex items-center gap-1.5 font-bold text-rose-600">
                <Heart className="h-3.5 w-3.5" />
                <span>{profile?.artiste_prefere || 'Non renseigné'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Compte YouTube :</span>
              {isYouTubeConnected ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Connecté ({profile?.email})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Non connecté</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Carte 2: Connexion YouTube */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Compte YouTube</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Connectez votre compte Google / YouTube pour créer automatiquement des playlists dans votre bibliothèque
            </p>
          </div>

          {googleError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{googleError}</span>
            </div>
          )}

          <div className="space-y-4 pt-1">
            {/* YouTube */}
            <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
                    <Youtube className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      YouTube / YouTube Music
                    </h4>
                    <span
                      className={`text-[11px] font-semibold flex items-center gap-1 ${
                        isYouTubeConnected ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {isYouTubeConnected ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Compte connecté &amp; Actif
                        </>
                      ) : (
                        'Non connecté'
                      )}
                    </span>
                  </div>
                </div>

                {isYouTubeConnected ? (
                  <button
                    onClick={onToggleYoutube}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all shadow-2xs"
                  >
                    Déconnecter
                  </button>
                ) : null}
              </div>

              {isYouTubeConnected && (
                <div className="p-2.5 bg-white rounded-xl border border-rose-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    Compte : <strong className="text-slate-900">{profile?.email}</strong>
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                    Prêt pour création de playlist
                  </span>
                </div>
              )}

              {!isYouTubeConnected && (
                <div className="pt-1 space-y-2">
                  <p className="text-xs text-slate-600">
                    Connectez votre compte Google pour créer et enregistrer vos playlists directement dans YouTube :
                  </p>
                  <GoogleSignInButton
                    onClick={handleConnectGoogle}
                    disabled={isConnectingGoogle}
                    text={
                      isConnectingGoogle
                        ? 'Connexion en cours...'
                        : 'Connecter mon compte Google / YouTube'
                    }
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Action banner */}
      <div className="rounded-3xl bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-bold">Prêt pour votre prochaine session d'écoute ?</h4>
          <p className="text-xs text-white/90 mt-1">
            Générez une playlist adaptée à votre humeur et météo, et exportez-la sur votre compte YouTube.
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
