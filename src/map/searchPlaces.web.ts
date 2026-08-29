import type { LatLng, PlaceHit } from '@/types';

import { loadGoogleMaps } from './loadGoogleMaps.web';

export async function searchPlaces(query: string): Promise<PlaceHit[]> {
  if (query.trim().length < 2) return [];
  await loadGoogleMaps();
  const service = new window.google!.maps.places.AutocompleteService();
  return new Promise((resolve) => {
    service.getPlacePredictions({ input: query.trim() }, (predictions) => {
      resolve(
        (predictions ?? []).map((item) => ({
          placeId: item.place_id,
          description: item.description,
        })),
      );
    });
  });
}

export async function getPlaceLocation(
  placeId: string,
): Promise<(LatLng & { name: string }) | null> {
  await loadGoogleMaps();
  const node = document.createElement('div');
  const service = new window.google!.maps.places.PlacesService(node);
  return new Promise((resolve) => {
    service.getDetails({ placeId, fields: ['geometry', 'name', 'formatted_address'] }, (place) => {
      const location = place?.geometry?.location;
      if (!location) {
        resolve(null);
        return;
      }
      resolve({
        latitude: location.lat(),
        longitude: location.lng(),
        name: place.formatted_address ?? place.name ?? '',
      });
    });
  });
}
