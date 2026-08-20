export interface UserCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
  cityName?: string;
  timestamp?: number;
}

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Estimates travel duration in minutes based on distance and transport mode
 */
export function calculateEstimatedDurationMin(
  distanceKm: number,
  mode: 'car' | 'moto' | 'bike' | 'walk' | 'transit' = 'car'
): number {
  if (distanceKm <= 0) return 0;
  switch (mode) {
    case 'moto':
      return Math.max(3, Math.round(distanceKm * 2.6 + 3));
    case 'bike':
      return Math.max(4, Math.round(distanceKm * 4.2 + 2));
    case 'walk':
      return Math.max(5, Math.round(distanceKm * 12));
    case 'transit':
      return Math.max(10, Math.round(distanceKm * 4.5 + 8));
    case 'car':
    default:
      return Math.max(4, Math.round(distanceKm * 3.3 + 4));
  }
}

/**
 * Request real browser GPS location with fallback
 */
export async function requestBrowserGeolocation(): Promise<UserCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não é suportada neste navegador ou dispositivo.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        let formattedAddress = `Coordenadas: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        let detectedCity: string | undefined;

        // Try gentle reverse geocoding via OpenStreetMap Nominatim with fast timeout
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt-BR`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data && data.address) {
              const road = data.address.road || data.address.suburb || data.address.neighbourhood;
              const city = data.address.city || data.address.town || data.address.municipality;
              const state = data.address.state_code || data.address.state;

              if (road && city) {
                formattedAddress = `${road}, ${city} ${state ? `- ${state}` : ''}`;
              } else if (data.display_name) {
                formattedAddress = data.display_name.split(',').slice(0, 3).join(', ');
              }

              if (city && state) {
                detectedCity = `${city}, ${state}`;
              }
            }
          }
        } catch {
          // If reverse geocoding is unavailable or times out, fallback to coordinates
          formattedAddress = `Localização Atual (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        }

        resolve({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          address: formattedAddress,
          cityName: detectedCity,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let msg = 'Não foi possível obter sua localização.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Permissão de localização negada pelo usuário ou navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Sinal de GPS/localização indisponível no momento.';
            break;
          case error.TIMEOUT:
            msg = 'Tempo limite esgotado ao buscar sinal de GPS.';
            break;
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Builds Google Maps Multi-Stop URL starting from user's current GPS location
 */
export function buildMultiStopNavigationUrl(
  origin: { lat?: number; lng?: number; address?: string } | string,
  destinations: { lat: number; lng: number; name?: string; address?: string }[],
  returnToOrigin: boolean = false
): string {
  if (destinations.length === 0) return '';

  let originStr = 'My+Location';
  if (typeof origin === 'object') {
    if (origin.lat !== undefined && origin.lng !== undefined) {
      originStr = `${origin.lat},${origin.lng}`;
    } else if (origin.address) {
      originStr = encodeURIComponent(origin.address);
    }
  } else if (typeof origin === 'string' && origin.trim()) {
    if (origin.toLowerCase().includes('gps') || origin.toLowerCase().includes('atual')) {
      originStr = 'My+Location';
    } else {
      originStr = encodeURIComponent(origin);
    }
  }

  const finalDestination = returnToOrigin
    ? originStr
    : `${destinations[destinations.length - 1].lat},${destinations[destinations.length - 1].lng}`;

  const waypoints = destinations
    .slice(0, returnToOrigin ? destinations.length : destinations.length - 1)
    .map((d) => `${d.lat},${d.lng}`)
    .join('|');

  let url = `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${finalDestination}&travelmode=driving`;
  if (waypoints) {
    url += `&waypoints=${waypoints}`;
  }
  return url;
}

/**
 * Builds single destination navigation starting directly from GPS
 */
export function buildDirectGpsNavigationUrl(
  destination: { lat?: number; lng?: number; address: string },
  userCoordinates?: UserCoordinates | null
): string {
  const destQuery =
    destination.lat && destination.lng
      ? `${destination.lat},${destination.lng}`
      : encodeURIComponent(destination.address);

  const originQuery =
    userCoordinates?.lat && userCoordinates?.lng
      ? `${userCoordinates.lat},${userCoordinates.lng}`
      : 'My+Location';

  return `https://www.google.com/maps/dir/?api=1&origin=${originQuery}&destination=${destQuery}&travelmode=driving`;
}

/**
 * Builds Waze Navigation Link to a coordinate
 */
export function buildWazeNavigationUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}
