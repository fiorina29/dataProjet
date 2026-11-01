import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Configure Google Auth Provider with full YouTube scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/youtube');
provider.addScope('https://www.googleapis.com/auth/youtube.force-ssl');

// Force Google consent screen to ensure YouTube scopes are granted (fixes 'insufficient authentication scopes')
provider.setCustomParameters({
  prompt: 'consent select_account',
  access_type: 'offline',
});

// Flag to indicate if we are in the middle of a sign-in flow
let isSigningIn = false;

// Cache the access token in memory (never in localStorage or sessionStorage)
let cachedAccessToken = null;

// Initialize auth state listener
export const initAuth = (onAuthSuccess, onAuthFailure) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async () => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error("Impossible d'obtenir le jeton d'accès Google.");
    }

    cachedAccessToken = credential.accessToken;

    // Verify granted scopes
    const accountStatus = await verifyYouTubeAccount(cachedAccessToken, result.user);

    return {
      user: result.user,
      accessToken: cachedAccessToken,
      youtubeAccount: accountStatus,
    };
  } catch (error) {
    console.error('Google Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async () => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token) => {
  cachedAccessToken = token;
};

// Check if the user has a valid YouTube account through their Google account
export const verifyYouTubeAccount = async (accessToken, user) => {
  if (!accessToken) {
    return { isConnected: false, hasInsufficientScope: false, reason: 'Non authentifié avec Google' };
  }

  try {
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`
    );
    if (tokenInfoRes.ok) {
      const info = await tokenInfoRes.json();
      const grantedScopes = (info.scope || '').split(' ');
      const hasYouTubeScope = grantedScopes.some((s) => s.includes('youtube'));
      
      if (!hasYouTubeScope) {
        return {
          isConnected: false,
          hasInsufficientScope: true,
          email: user?.email || info.email,
          reason:
            "Permissions YouTube insuffisantes : vous devez cocher l'autorisation YouTube lors de la connexion Google.",
        };
      }
    }
  } catch (err) {
    console.warn('Verification check:', err);
  }

  // Any authenticated Google account has YouTube account capabilities
  return {
    isConnected: true,
    hasInsufficientScope: false,
    email: user?.email,
    displayName: user?.displayName || 'Compte Google / YouTube',
    avatar: user?.photoURL || null,
  };
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
