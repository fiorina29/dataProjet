// src/services/youtubeExport.ts
// Crée une vraie playlist YouTube sur le compte de l'utilisateur à partir des titres choisis par l'IA.
//
// Pré-requis :
// 1. Dans index.html, avant </head> :
//      <script src="https://accounts.google.com/gsi/client" async defer></script>
// 2. Dans .env (le Client ID n'est PAS un secret, il peut être côté front) :
//      VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com

import firebaseConfig from '../../firebase-applet-config.json';

declare const google: any;

export interface Track {
  title: string;
  artist: string;
}

export interface ExportResult {
  playlistUrl: string;
  added: Track[];
  notFound: Track[];
}

const SCOPE = 'https://www.googleapis.com/auth/youtube';
const API = 'https://www.googleapis.com/youtube/v3';

/** Ouvre la popup Google et renvoie un access token OAuth (valable ~1h). */
export function getYouTubeToken(clientId?: string): Promise<string> {
  const actualClientId =
    clientId ||
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
    firebaseConfig?.oAuthClientId ||
    '298471907714-kp0j6j5uh5n7nd110u03fb5j644cmg2q.apps.googleusercontent.com';

  return new Promise((resolve, reject) => {
    if (!(window as any).google?.accounts?.oauth2) {
      reject(new Error("Le script Google Identity Services n'est pas chargé."));
      return;
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: actualClientId,
      scope: SCOPE,
      callback: (resp: any) =>
        resp.error ? reject(new Error(resp.error_description || resp.error)) : resolve(resp.access_token),
      error_callback: (err: any) =>
        reject(new Error(err?.type === 'popup_closed' ? 'Connexion Google annulée.' : 'Popup Google bloquée.')),
    });

    client.requestAccessToken();
  });
}

async function yt(path: string, token: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const reason = data?.error?.errors?.[0]?.reason;
    if (reason === 'quotaExceeded') {
      throw new Error('Quota YouTube du jour épuisé. Réessaie demain.');
    }
    if (reason === 'youtubeSignupRequired') {
      throw new Error("Ce compte Google n'a pas de chaîne YouTube. Crée-en une puis réessaie.");
    }
    throw new Error(data?.error?.message || `Erreur YouTube (${res.status})`);
  }

  return data;
}

/** Cherche la vidéo la plus pertinente pour un titre (coûte 100 unités de quota). */
async function findVideoId(track: Track, token: string): Promise<string | null> {
  const q = encodeURIComponent(`${track.artist} ${track.title}`);
  const data = await yt(
    `/search?part=snippet&type=video&videoCategoryId=10&maxResults=1&q=${q}`,
    token
  );
  return data.items?.[0]?.id?.videoId ?? null;
}

async function createPlaylist(token: string, title: string, description: string): Promise<string> {
  const data = await yt('/playlists?part=snippet,status', token, {
    method: 'POST',
    body: JSON.stringify({
      snippet: { title, description },
      status: { privacyStatus: 'private' }, // 'public' ou 'unlisted' possibles
    }),
  });
  return data.id;
}

async function addVideo(token: string, playlistId: string, videoId: string): Promise<void> {
  await yt('/playlistItems?part=snippet', token, {
    method: 'POST',
    body: JSON.stringify({
      snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId } },
    }),
  });
}

/**
 * Export complet. IMPORTANT : passe un token déjà obtenu (voir getYouTubeToken),
 * demandé directement dans le onClick, sinon le navigateur bloque la popup.
 */
export async function exportToYouTube(
  token: string,
  tracks: Track[],
  opts: {
    title: string;
    description?: string;
    onProgress?: (done: number, total: number, current: Track) => void;
  }
): Promise<ExportResult> {
  const playlistId = await createPlaylist(
    token,
    opts.title,
    opts.description ?? 'Playlist générée par MoodWave'
  );

  const added: Track[] = [];
  const notFound: Track[] = [];

  // Séquentiel : garde l'ordre choisi par l'IA et évite les erreurs 409 de YouTube.
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    opts.onProgress?.(i, tracks.length, track);
    try {
      const videoId = await findVideoId(track, token);
      if (!videoId) {
        notFound.push(track);
        continue;
      }
      await addVideo(token, playlistId, videoId);
      added.push(track);
    } catch (e: any) {
      // Le quota épuisé est bloquant : on arrête et on remonte l'erreur.
      if (String(e.message).includes('Quota')) throw e;
      notFound.push(track);
    }
  }

  opts.onProgress?.(tracks.length, tracks.length, tracks[tracks.length - 1]);

  return {
    playlistUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
    added,
    notFound,
  };
}
