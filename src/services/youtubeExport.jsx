import firebaseConfig from "../../firebase-applet-config.json";
const SCOPE = "https://www.googleapis.com/auth/youtube";
const API = "https://www.googleapis.com/youtube/v3";
function getYouTubeToken(clientId) {
  const actualClientId = clientId || import.meta.env?.VITE_GOOGLE_CLIENT_ID || firebaseConfig?.oAuthClientId || "298471907714-kp0j6j5uh5n7nd110u03fb5j644cmg2q.apps.googleusercontent.com";
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error("Le script Google Identity Services n'est pas charg\xE9."));
      return;
    }
    const client = google.accounts.oauth2.initTokenClient({
      client_id: actualClientId,
      scope: SCOPE,
      callback: (resp) => resp.error ? reject(new Error(resp.error_description || resp.error)) : resolve(resp.access_token),
      error_callback: (err) => reject(new Error(err?.type === "popup_closed" ? "Connexion Google annul\xE9e." : "Popup Google bloqu\xE9e."))
    });
    client.requestAccessToken();
  });
}
async function yt(path, token, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers || {}
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason = data?.error?.errors?.[0]?.reason;
    if (reason === "quotaExceeded") {
      throw new Error("Quota YouTube du jour \xE9puis\xE9. R\xE9essaie demain.");
    }
    const error = new Error(data?.error?.message || `Erreur YouTube (${res.status})`);
    error.reason = reason;
    throw error;
  }
  return data;
}
async function findVideoId(track, token) {
  const q = encodeURIComponent(`${track.artist} ${track.title}`);
  const data = await yt(
    `/search?part=snippet&type=video&videoCategoryId=10&maxResults=1&q=${q}`,
    token
  );
  return data.items?.[0]?.id?.videoId ?? null;
}
async function createPlaylist(token, title, description) {
  const data = await yt("/playlists?part=snippet,status", token, {
    method: "POST",
    body: JSON.stringify({
      snippet: { title, description },
      status: { privacyStatus: "private" }
      // 'public' ou 'unlisted' possibles
    })
  });
  return data.id;
}
async function addVideo(token, playlistId, videoId) {
  await yt("/playlistItems?part=snippet", token, {
    method: "POST",
    body: JSON.stringify({
      snippet: { playlistId, resourceId: { kind: "youtube#video", videoId } }
    })
  });
}
async function exportToYouTube(token, tracks, opts) {
  let playlistId = null;
  try {
    playlistId = await createPlaylist(
      token,
      opts.title,
      opts.description ?? "Playlist g\xE9n\xE9r\xE9e par MoodWave"
    );
  } catch (error) {
    if (error.reason !== "youtubeSignupRequired") throw error;
  }
  const added = [];
  const notFound = [];
  const videoIds = [];
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    opts.onProgress?.(i, tracks.length, track);
    try {
      const videoId = await findVideoId(track, token);
      if (!videoId) {
        notFound.push(track);
        continue;
      }
      if (playlistId) {
        await addVideo(token, playlistId, videoId);
      }
      videoIds.push(videoId);
      added.push(track);
    } catch (e) {
      if (String(e.message).includes("Quota")) throw e;
      notFound.push(track);
    }
  }
  opts.onProgress?.(tracks.length, tracks.length, tracks[tracks.length - 1]);
  if (playlistId) {
    return {
      mode: "playlist",
      playlistUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
      added,
      notFound
    };
  }
  if (videoIds.length === 0) {
    throw new Error("Aucun titre n'a \xE9t\xE9 trouv\xE9 sur YouTube.");
  }
  return {
    mode: "temporary",
    playlistUrl: `https://www.youtube.com/watch_videos?video_ids=${videoIds.slice(0, 50).join(",")}`,
    added,
    notFound
  };
}
export {
  exportToYouTube,
  getYouTubeToken
};
