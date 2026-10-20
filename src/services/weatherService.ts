import { LiveWeatherState } from '../types';

/**
 * Maps WMO Weather interpretation codes (WW) to condition IDs
 */
function mapWmoCodeToCondition(code: number): { conditionId: string; description: string } {
  if (code === 0) {
    return { conditionId: 'soleil', description: 'Ciel dégagé / Ensoleillé' };
  }
  if (code >= 1 && code <= 3) {
    return { conditionId: 'nuageux', description: code === 1 ? 'Légèrement voilé' : 'Nuageux / Couvert' };
  }
  if (code === 45 || code === 48) {
    return { conditionId: 'brume', description: 'Brouillard / Brume' };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { conditionId: 'pluie', description: 'Pluie / Averses en direct' };
  }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return { conditionId: 'neige', description: 'Chutes de neige' };
  }
  if (code >= 95 && code <= 99) {
    return { conditionId: 'orage', description: 'Orage et éclairs' };
  }
  return { conditionId: 'nuageux', description: 'Temps mitigé' };
}

/**
 * Fetches real weather using exact device GPS coordinates via browser Geolocation API
 */
export async function fetchLiveWeatherFromDevice(): Promise<LiveWeatherState> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(fetchLiveWeather('Paris'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // 1. Reverse Geocode to get city name
          let cityName = 'Votre position';
          try {
            const revUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`;
            const revRes = await fetch(revUrl);
            if (revRes.ok) {
              const revData = await revRes.json();
              cityName = revData.locality || revData.city || revData.principalSubdivision || 'Votre position';
              if (revData.countryName) {
                cityName += `, ${revData.countryName}`;
              }
            }
          } catch {
            cityName = 'Position locale GPS';
          }

          // 2. Fetch live weather directly for device coordinates
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
            lastUpdated: new Date(),
          });
        } catch (err: any) {
          resolve(fetchLiveWeather('Paris'));
        }
      },
      (error) => {
        // Fallback to profile city Paris if user denies or timeout
        resolve(fetchLiveWeather('Paris'));
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  });
}

/**
 * Fetches real-time weather using city name string
 */
export async function fetchLiveWeather(cityName: string): Promise<LiveWeatherState> {
  const query = cityName.trim() || 'Paris';

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
        conditionId: 'pluie',
        description: 'Pluie / Averses',
        temperature: 15,
        humidity: 80,
        windSpeed: 12,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      };
    }

    const { latitude, longitude, name, country } = geoData.results[0];
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;

    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();
    const current = weatherData.current;
    const mapped = mapWmoCodeToCondition(current?.weather_code ?? 0);

    return {
      ville: `${name}${country ? `, ${country}` : ''}`,
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
      lastUpdated: new Date(),
    };
  } catch {
    return {
      ville: query,
      isDeviceGps: false,
      conditionId: 'soleil',
      description: 'Ensoleillé / Éclaircies',
      temperature: 20,
      humidity: 50,
      windSpeed: 10,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
    };
  }
}
