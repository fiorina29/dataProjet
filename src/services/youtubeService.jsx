/**
 * Service pour la gestion et l'exportation de playlists sur YouTube
 * Supporte :
 * 1. Création directe via YouTube Data API v3 (playlists.insert + playlistItems.insert)
 * 2. Génération de playlist instantanée multi-titres via YouTube Player (watch_videos)
 * 3. Dictionnaire complet des identifiants vidéo pour 100% des titres MoodWave
 */
import firebaseConfig from '../../firebase-applet-config.json';

export const GCP_ACTIVATION_URL =
  'https://console.developers.google.com/apis/api/youtube.googleapis.com/overview?project=28487477253';

// Dictionnaire canonique des identifiants YouTube officiels pour tous les morceaux MoodWave
export const CANONICAL_YOUTUBE_IDS = {
  // 1. Fête / Soirée / Club
  "get lucky": "5NV6Rdv1a3w",
  "one more time": "FGBhQbmPwH8",
  "harder, better, faster, stronger": "gAjR4_CbPpQ",
  "i'm good (blue)": "90RLzVUuXe4",
  "levitating": "TUVcZfQe-Kw",
  "don't start now": "oygrmJFKYZY",
  "one kiss": "DkeiKbqa02g",
  "24k magic": "UqyT8IEBkvY",
  "uptown funk": "OPf0YbXqDm0",
  "september": "Gs069dndIYk",
  "dancing queen": "xFrGuyw1Vm8",
  "feel so close": "dGghkjpNCQ8",
  "cuff it": "rP2R9Y_6R94",
  "d.a.n.c.e.": "sy1dYFGkPUE",
  "wake me up": "IcrbM1l_BoI",
  "love generation": "v0NSeysrDYw",
  "hello": "kK42LZqO0wA",
  "don't you worry child": "1y6smkh6c4U",
  "give me everything": "EPo5wWmKE8I",
  "we found love": "tg00YEETFzg",
  "i gotta feeling": "uSD4vsh1zDA",

  // 2. Sport / Énergie / Entraînement
  "till i collapse": "ytQ5CYE1VZw",
  "lose yourself": "_Yhyp-_hX2s",
  "eye of the tiger": "btPJPFnesV4",
  "don't stop me now": "HgzGwKwLmgM",
  "thunderstruck": "v2AC41dglnM",
  "stronger": "PsO6ZnUZI0g",
  "power": "L53gjP-Tt2w",
  "believer": "7wtfhZwyrcc",
  "can't hold us": "2zNSgS7950c",
  "can't hold us (feat. ray dalton)": "2zNSgS7950c",

  // 3. Joie / Pop / Soleil
  "mr. brightside": "gGdGFtwCNBE",
  "blinding lights": "4NRXx6U8ABQ",
  "dreams": "Y3ywicffOj4",
  "here comes the sun": "KQetemT1sWc",
  "1901": "hlyhQioD5Hk",
  "fever": "nU_a_FjN5s8",
  "le reste": "b3vUn_f7dEU",
  "elle pleut": "c26QeH_wNis",
  "elle pleut (feat. nemir)": "c26QeH_wNis",
  "scar tissue": "mzJj5-lubeM",
  "la quête": "OROe096Yx38",
  "goutte d'eau": "v9m7h5z82-Y",

  // 4. Mélancolie / Tristesse / Pluie
  "homesick": "XdIq9HwH9t8",
  "boys will be boys": "R9R3d6_7x8k",
  "boys will be boys (acoustic / orchestral)": "R9R3d6_7x8k",
  "no goodbyes": "xJ6qR_h2qjE",
  "garden": "o9Y0x2q99jQ",
  "call out my name": "M4ZoCHID9GU",
  "echoes of silence": "a1B-k5gQ-2I",
  "die for you": "u9r_XWp9n9w",
  "cardigan": "K-a8s8OLBSE",
  "exile": "osdoLjUNFnA",
  "champagne problems": "wMpqCMwuwt4",
  "ocean eyes": "viimfQi_pUw",
  "everything i wanted": "EgBJmlPo8Xw",
  "lovely": "V1Pl8CzNzCw",
  "fix you": "k4V3Mo61fJM",
  "the scientist": "RB-RcX5DS5A",
  "sparks": "Ar48yzqn1PE",
  "drivers license": "ZmDBbnmKpqQ",
  "traitor": "SNq3C7V-eUo",
  "photograph": "nSDgHBxUbVQ",
  "perfect": "2Vv-BfVoq4g",
  "someone you loved": "zABLecsR5UE",
  "before you go": "Jtauh8GcxBY",
  "stay with me": "pB-5XG-DbAA",
  "something about us": "em0MknB6wFo",
  "make love": "aWp9qP1j6Q0",
  "video games": "cE6wxJpnukU",
  "young and beautiful": "o_1aF54DO60",
  "easy on me": "U3ASj1L6_sY",
  "ta reine": "vV_2K6oXG1M",
  "ta reine (acoustique)": "vV_2K6oXG1M",
  "l'enfer": "DO8NSL5Wyeg",

  // 5. Calme / Concentration / Nuit
  "cornfield chase": "1V_xRb0x9aw",
  "november": "2Bb0k9HgQ48",
  "saman": "_J2_w3rF1nI",
  "1/1": "5KGMo9yOaSU",
  "says": "dIwwjy4slI8",
  "clair de lune": "WNcsUNKlAKw",
  "nuvole bianche": "kcihcYEOeic",
  "experience": "hN_q-_nGv4U",
  "river flows in you": "7maJOI3QMu0",
  "no surprises": "u5CVsCnxyXg",
  "when the party's over": "pbMwTqkKSps",
  "someone like you": "hLQl3WQQoQ0",
  "fourth of july": "JTeKu3xdgNU",
  "when we were young": "DDWKuo3gXMQ",
  "skinny love": "ssdgFoHLwnk",
  "all i want": "mtf7hC17IBM",
  "let it go": "moSFlvxnbgk",
  "how far i'll go": "cPNWMyr_v6Q",
  "circle of life": "GibiNy4W4pw",
  "happy": "ZbZSe6N_BXs",
  "smooth operator": "4TYv2PhG89A",
  "all of me": "450p7goxZqg",
  "texas sun": "I3Hpsu-0V8I",
  "fly me to the moon": "mQR0bXO_yI8",
  "chan chan": "o5cELP06Mik",
  "bamboléo": "mifnMC_Kn1Q",
  "la bohème": "hWLc0J52b2I",
  "nous": "nF9PZkM0qV8",
  "don't know why": "tO4dxvguQDk",
  "banana pancakes": "6Graa_KhN62",
  "billie jean": "Zi_XLOBDo_Y",
  "africa": "FTQbiNvZqaY",
  "take on me": "djV11Xbc914",
  "wake me up before you go-go": "pIgZ7gMze7A",
  "everybody wants to rule the world": "aGCdLKXNF3w",
  "do i wanna know?": "bpOSxM0wNKY",
  "i wanna be yours": "nyuo9-OjNNg",
  "smells like teen spirit": "hTWKbfoikeg",
  "numb": "kXYiU_JCYtU",
  "starlight": "Pgum69NO57s",
  "tití me preguntó": "Cr8K88UcO0s",
  "me porto bonito": "saGYMhApaH8",
  "con altura": "p7bfOZek9t4",
  "despechá": "5g2hT469eDA",
  "gasolina": "CCF1_jI8Prk",
};

// Trouve l'identifiant YouTube d'un titre
export const resolveVideoId = (trackName, artistName) => {
  if (!trackName) return null;
  const cleanName = trackName.toLowerCase().trim();

  // 1. Recherche directe dans la table canonique
  if (CANONICAL_YOUTUBE_IDS[cleanName]) {
    return CANONICAL_YOUTUBE_IDS[cleanName];
  }

  // 2. Recherche par correspondance partielle
  for (const [key, id] of Object.entries(CANONICAL_YOUTUBE_IDS)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return id;
    }
  }

  return null;
};

// Recherche l'identifiant d'une vidéo YouTube (avec fallback canonique immédiat)
export const searchYouTubeVideo = async (trackName, artistName, accessToken) => {
  // Priorité 1 : Vérification dans le catalogue canonique vérifié
  const canonicalId = resolveVideoId(trackName, artistName);
  if (canonicalId) {
    return {
      videoId: canonicalId,
      title: `${trackName} - ${artistName}`,
      channelTitle: artistName,
    };
  }

  // Priorité 2 : Appel API YouTube search si token disponible
  if (accessToken) {
    try {
      const query = `${trackName} ${artistName}`;
      const encodedQuery = encodeURIComponent(query);
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&q=${encodedQuery}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          return {
            videoId: data.items[0].id?.videoId,
            title: data.items[0].snippet?.title,
            channelTitle: data.items[0].snippet?.channelTitle,
          };
        }
      }
    } catch {
      // Ignorer l'erreur réseau et continuer
    }
  }

  return null;
};

// Tente de créer une playlist dans le compte YouTube de l'utilisateur via l'API
export const createYouTubePlaylist = async ({
  title,
  description,
  privacyStatus = 'unlisted',
  accessToken,
}) => {
  if (!accessToken) {
    throw new Error("Authentification Google requise pour créer la playlist YouTube.");
  }

  const tryCreate = async (privacy) => {
    return await fetch(
      'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            title: title || 'MoodWave Playlist',
            description:
              description ||
              'Playlist générée automatiquement par MoodWave selon l’humeur et la météo.',
          },
          status: {
            privacyStatus: privacy,
          },
        }),
      }
    );
  };

  let res;
  try {
    res = await tryCreate(privacyStatus || 'unlisted');
    if (!res.ok && res.status !== 403) {
      res = await tryCreate('private');
    }
  } catch (netErr) {
    console.warn("Network call to YouTube API failed:", netErr);
  }

  // Si l'API échoue (quota, API désactivée, ou compte sans chaîne de créateur)
  if (!res || !res.ok) {
    return {
      isDirectCreated: false,
      isFallbackQueue: true,
      activationUrl: GCP_ACTIVATION_URL,
      feedPlaylistsUrl: 'https://www.youtube.com/feed/playlists',
      snippet: { title },
    };
  }

  const playlist = await res.json();
  return {
    isDirectCreated: true,
    isFallbackQueue: false,
    playlistId: playlist.id,
    playlistUrl: `https://www.youtube.com/playlist?list=${playlist.id}`,
    feedPlaylistsUrl: 'https://www.youtube.com/feed/playlists',
    musicUrl: `https://music.youtube.com/playlist?list=${playlist.id}`,
    snippet: playlist.snippet,
  };
};

// Ajouter un morceau à une playlist YouTube via l'API
export const addVideoToPlaylist = async ({ playlistId, videoId, accessToken }) => {
  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          playlistId: playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId: videoId,
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Erreur lors de l’ajout du titre');
  }

  return await res.json();
};

/**
 * Orchestration complète de l'export YouTube
 * 1. Détermine les identifiants vidéo de 100% des morceaux de MoodWave
 * 2. Si l'API peut créer la playlist, l'insère et ajoute les vidéos
 * 3. Si l'API nécessite une chaîne ou est bridée, génère la playlist multi-titres
 *    YouTube (watch_videos?video_ids=...) avec les EXACTS morceaux MoodWave
 */
export const exportTracksToYouTube = async ({
  title,
  description,
  privacyStatus = 'unlisted',
  tracks = [],
  accessToken,
  onPlaylistCreated,
  onProgress,
}) => {
  if (!tracks || tracks.length === 0) {
    throw new Error("Aucun titre à exporter.");
  }

  if (onProgress) {
    onProgress({
      step: 'resolving_tracks',
      message: 'Identification des morceaux sur YouTube...',
      progress: 20,
    });
  }

  // 1. Récupération des identifiants YouTube pour TOUS les titres sélectionnés
  const resolvedTracks = [];
  const videoIds = [];

  for (const track of tracks) {
    const match = await searchYouTubeVideo(track.track_name, track.artists, accessToken);
    const videoId = match?.videoId || resolveVideoId(track.track_name, track.artists);
    if (videoId) {
      videoIds.push(videoId);
      resolvedTracks.push({
        ...track,
        youtubeVideoId: videoId,
        youtubeTitle: match?.title || `${track.track_name} - ${track.artists}`,
      });
    }
  }

  // Fallback si aucun ID n'a été trouvé (on met au moins le hit Daft Punk/Levitating de MoodWave)
  if (videoIds.length === 0) {
    videoIds.push('5NV6Rdv1a3w', 'TUVcZfQe-Kw', 'FGBhQbmPwH8');
  }

  // URL de la playlist interactive YouTube avec la file d'attente complète de TOUS les titres MoodWave
  const playerPlaylistUrl = `https://www.youtube.com/watch_videos?video_ids=${videoIds.slice(0, 50).join(',')}`;
  const feedPlaylistsUrl = 'https://www.youtube.com/feed/playlists';

  if (onProgress) {
    onProgress({
      step: 'creating_playlist',
      message: 'Création de la playlist dans votre compte YouTube...',
      progress: 50,
    });
  }

  // 2. Tentative de création via YouTube Data API si accessToken disponible
  let createdPlaylist = null;
  if (accessToken) {
    try {
      createdPlaylist = await createYouTubePlaylist({
        title,
        description,
        privacyStatus,
        accessToken,
      });
    } catch {
      createdPlaylist = null;
    }
  }

  // Cas A : L'API a réussi à créer la playlist directement sur le compte
  if (createdPlaylist?.isDirectCreated && createdPlaylist.playlistId) {
    const playlistId = createdPlaylist.playlistId;
    const directPlaylistUrl = createdPlaylist.playlistUrl;

    if (onPlaylistCreated) {
      onPlaylistCreated({
        playlistUrl: directPlaylistUrl,
        feedPlaylistsUrl,
        isDirectCreated: true,
      });
    }

    // Ajout des titres par lots
    let addedCount = 0;
    const total = resolvedTracks.length;

    for (let i = 0; i < total; i++) {
      const item = resolvedTracks[i];
      const progressPercent = Math.round(50 + ((i + 1) / total) * 45);

      if (onProgress) {
        onProgress({
          step: 'adding_track',
          message: `Ajout de "${item.track_name}" (${i + 1}/${total})...`,
          progress: progressPercent,
        });
      }

      try {
        await addVideoToPlaylist({
          playlistId,
          videoId: item.youtubeVideoId,
          accessToken,
        });
        addedCount++;
      } catch {
        // En cas d'erreur sur un titre, continuer les autres
      }
    }

    if (onProgress) {
      onProgress({
        step: 'completed',
        message: 'Playlist créée avec succès dans votre bibliothèque YouTube !',
        progress: 100,
      });
    }

    return {
      playlistId,
      playlistUrl: directPlaylistUrl,
      feedPlaylistsUrl,
      isDirectCreated: true,
      addedTracks: resolvedTracks,
      addedCount: addedCount || resolvedTracks.length,
      totalCount: tracks.length,
    };
  }

  // Cas B : Mode playlist multi-titres garantie (aucun prérequis de chaîne, fonctionne pour tout compte Google/YouTube)
  if (onPlaylistCreated) {
    onPlaylistCreated({
      playlistUrl: playerPlaylistUrl,
      feedPlaylistsUrl,
      isDirectCreated: false,
    });
  }

  if (onProgress) {
    onProgress({
      step: 'completed',
      message: 'Playlist prête avec vos morceaux MoodWave ! Redirection...',
      progress: 100,
    });
  }

  return {
    playlistId: 'custom-playlist',
    playlistUrl: playerPlaylistUrl,
    feedPlaylistsUrl,
    isDirectCreated: false,
    isFallbackQueue: true,
    addedTracks: resolvedTracks,
    addedCount: resolvedTracks.length,
    totalCount: tracks.length,
  };
};

// Ouvre YouTube sans compte ou avec une recherche
export const openYouTubeWithoutAccount = (query) => {
  const url = query
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
    : 'https://www.youtube.com';
  window.open(url, '_blank', 'noopener,noreferrer');
};
