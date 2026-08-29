import { GOOGLE_MAPS_API_KEY } from '@/lib/googleKey';

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (el: HTMLElement, opts: Record<string, unknown>) => GoogleMap;
        Marker: new (opts: Record<string, unknown>) => GoogleMarker;
        Polygon: new (opts: Record<string, unknown>) => GooglePolygon;
        Size: new (w: number, h: number) => unknown;
        Point: new (x: number, y: number) => unknown;
        places: {
          AutocompleteService: new () => {
            getPlacePredictions: (
              req: { input: string; locationBias?: unknown },
              cb: (preds: Array<{ place_id: string; description: string }> | null) => void,
            ) => void;
          };
          PlacesService: new (el: HTMLElement) => {
            getDetails: (
              req: { placeId: string; fields: string[] },
              cb: (
                place: {
                  geometry?: { location?: { lat: () => number; lng: () => number } };
                  name?: string;
                  formatted_address?: string;
                } | null,
              ) => void,
            ) => void;
          };
        };
      };
    };
  }
}

type GoogleMap = {
  panTo: (latLng: { lat: number; lng: number }) => void;
  getCenter: () => { lat: () => number; lng: () => number } | undefined;
  setOptions: (opts: Record<string, unknown>) => void;
  addListener: (event: string, handler: (e?: { latLng?: { lat: () => number; lng: () => number } }) => void) => void;
};

type GoogleMarker = {
  setMap: (map: GoogleMap | null) => void;
  addListener: (event: string, handler: () => void) => void;
};

type GooglePolygon = {
  setMap: (map: GoogleMap | null) => void;
};

let loading: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (loading) return loading;
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error('Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY'));
  }

  loading = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Google Maps failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.dataset.googleMaps = '1';
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places`;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error('Google Maps failed to load. Check the API key and enabled APIs.'));
    };
    document.head.appendChild(script);
  });

  return loading;
}
