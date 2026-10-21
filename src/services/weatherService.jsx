function mapWmoCodeToCondition(code) {
  if (code === 0) {
    return { conditionId: "soleil", description: "Ciel d\xE9gag\xE9 / Ensoleill\xE9" };
  }
  if (code >= 1 && code <= 3) {
    return { conditionId: "nuageux", description: code === 1 ? "L\xE9g\xE8rement voil\xE9" : "Nuageux / Couvert" };
  }
  if (code === 45 || code === 48) {
    return { conditionId: "brume", description: "Brouillard / Brume" };
  }
  if (code >= 51 && code <= 67 || code >= 80 && code <= 82) {
    return { conditionId: "pluie", description: "Pluie / Averses en direct" };
  }
  if (code >= 71 && code <= 77 || code >= 85 && code <= 86) {
    return { conditionId: "neige", description: "Chutes de neige" };
  }
  if (code >= 95 && code <= 99) {
    return { conditionId: "orage", description: "Orage et \xE9clairs" };
  }
  return { conditionId: "nuageux", description: "Temps mitig\xE9" };
}
export async function fetchLiveWeatherFromDevice() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(fetchLiveWeather("Paris"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          let cityName = "Votre position";
          try {
            const revUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`;
            const revRes = await fetch(revUrl);
            if (revRes.ok) {
              const revData = await revRes.json();
              cityName = revData.locality || revData.city || revData.principalSubdivision || "Votre position";
              if (revData.countryName) {
                cityName += `, ${revData.countryName}`;
              }
            }
          } catch {
            cityName = "Position locale GPS";
          }
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
          const weatherRes = await fetch(weatherUrl);
          const weatherData = await weatherRes.json();
          const current = weatherData.current;
          const mapped = mapWmoCodeToCondition(current?.weather_code ?? 0);
          resolve({
            ville: cityName,
            isDeviceGps: true,
            latitude,
            longitude,
            conditionId: mapped.conditionId,
            description: mapped.description,
            temperature: Math.round(current?.temperature_2m ?? 18),
            humidity: Math.round(current?.relative_humidity_2m ?? 65),
            windSpeed: Math.round(current?.wind_speed_10m ?? 10),
            isLoading: false,
            error: null,
            lastUpdated: /* @__PURE__ */ new Date()
          });
        } catch (err) {
          resolve(fetchLiveWeather("Paris"));
        }
      },
      (error) => {
        resolve(fetchLiveWeather("Paris"));
      },
      { timeout: 8e3, enableHighAccuracy: true }
    );
  });
}
export async function fetchLiveWeather(cityName) {
  const query = cityName.trim() || "Paris";
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query
    )}&count=1&language=fr&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      return {
        ville: query,
        isDeviceGps: false,
        conditionId: "pluie",
        description: "Pluie / Averses",
        temperature: 15,
        humidity: 80,
        windSpeed: 12,
        isLoading: false,
        error: null,
        lastUpdated: /* @__PURE__ */ new Date()
      };
    }
    const { latitude, longitude, name, country } = geoData.results[0];
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();
    const current = weatherData.current;
    const mapped = mapWmoCodeToCondition(current?.weather_code ?? 0);
    return {
      ville: `${name}${country ? `, ${country}` : ""}`,
      isDeviceGps: false,
      latitude,
      longitude,
      conditionId: mapped.conditionId,
      description: mapped.description,
      temperature: Math.round(current?.temperature_2m ?? 18),
      humidity: Math.round(current?.relative_humidity_2m ?? 65),
      windSpeed: Math.round(current?.wind_speed_10m ?? 10),
      isLoading: false,
      error: null,
      lastUpdated: /* @__PURE__ */ new Date()
    };
  } catch {
    return {
      ville: query,
      isDeviceGps: false,
      conditionId: "soleil",
      description: "Ensoleill\xE9 / \xC9claircies",
      temperature: 20,
      humidity: 50,
      windSpeed: 10,
      isLoading: false,
      error: null,
      lastUpdated: /* @__PURE__ */ new Date()
    };
  }
}
