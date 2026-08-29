import type { EventPin, LatLng } from '@/types';

export type MapCanvasProps = {
  pins: EventPin[];
  center: LatLng;
  userLocation: LatLng | null;
  onMapPress: (coord: LatLng) => void;
  onPinPress: (pin: EventPin) => void;
};
