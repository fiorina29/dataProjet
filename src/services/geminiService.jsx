export async function fetchAiStatus() {
  try {
    const res = await fetch("/api/ai/status");
    if (!res.ok) {
      return {
        status: "unconfigured",
        hasKey: false,
        primaryModel: "gemini-3.8-flash",
        fallbackModel: "gemini-3.1-flash-lite"
      };
    }
    const data = await res.json();
    return {
      status: data.status || "online",
      hasKey: Boolean(data.hasKey),
      primaryModel: data.primaryModel || "gemini-3.8-flash",
      fallbackModel: data.fallbackModel || "gemini-3.1-flash-lite",
      lastChecked: data.timestamp
    };
  } catch (error) {
    console.error("Failed to fetch AI status:", error);
    return {
      status: "unconfigured",
      hasKey: false,
      primaryModel: "gemini-3.8-flash",
      fallbackModel: "gemini-3.1-flash-lite"
    };
  }
}
export async function runAiTest(prompt) {
  const defaultPrompt = prompt || "Donne une phrase courte et po\xE9tique reliant l'\xE9tat d'esprit, la pluie ou le soleil et la musique.";
  try {
    const res = await fetch("/api/ai/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: defaultPrompt })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        prompt: defaultPrompt,
        error: data.error || "Erreur lors du test Gemini API"
      };
    }
    return {
      success: true,
      model: data.model,
      prompt: data.prompt,
      response: data.response,
      durationMs: data.durationMs,
      timestamp: data.timestamp
    };
  } catch (error) {
    return {
      success: false,
      prompt: defaultPrompt,
      error: error?.message || "Impossible de joindre le serveur pour le test IA"
    };
  }
}
export async function fetchAiPlaylistPrediction(payload) {
  try {
    const res = await fetch("/api/ai/predict-playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Erreur du serveur IA");
    }
    return {
      success: true,
      isAiGenerated: true,
      model: data.model || "gemini-3.8-flash",
      durationMs: data.durationMs,
      playlist_title: data.playlist_title,
      playlist_description: data.playlist_description,
      ai_reasoning: data.ai_reasoning,
      spotify_audio_features_targets: data.spotify_audio_features_targets,
      genres_recommandes: data.genres_recommandes || [],
      vibe_keywords: data.vibe_keywords || [],
      curated_tracks: data.curated_tracks || []
    };
  } catch (err) {
    console.warn("AI playlist generation failed or unavailable, falling back:", err.message);
    throw err;
  }
}
