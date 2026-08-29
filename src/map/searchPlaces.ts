import { GOOGLE_MAPS_API_KEY } from '@/lib/googleKey';
import type { LatLng, PlaceHit } from '@/types';

export async function searchPlaces(query: string): Promise<PlaceHit[]> {
  if (!GOOGLE_MAPS_API_KEY || query.trim().length < 2) return [];
  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.set('input', query.trim());
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY);
  url.searchParams.set('location', '-33.8688,151.2093');
  url.searchParams.set('radius', '80000');
  const response = await fetch(url.toString());
  const data = (await response.json()) as {
    predictions?: Array<{ place_id: string; description: string }>;
  };
  return (data.predictions ?? []).map((item) => ({
    placeId: item.place_id,
    description: item.description,
  }));
}

export async function getPlaceLocation(placeId: string): Promise<LatLng | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'geometry');
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY);
  const response = await fetch(url.toString());
  const data = (await response.json()) as {
    result?: { geometry?: { location?: { lat: number; lng: number } } };
  };
  const location = data.result?.geometry?.location;
  if (!location) return null;
  return { latitude: location.lat, longitude: location.lng };
}
