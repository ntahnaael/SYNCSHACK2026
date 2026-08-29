import type { EventPin, LatLng } from '@/types';

export type MapCanvasProps = {
  pins: EventPin[];
  center: LatLng;
  userLocation: LatLng | null;
  userColor: string;
  userInitials: string;
  onViewChange: (coord: LatLng) => void;
  onPinPress: (pin: EventPin) => void;
};
