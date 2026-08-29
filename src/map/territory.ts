import type { LatLng } from '@/types';

export const TERRITORY_RADIUS_METRES = 18;

const MINIMUM_SOURCE_SPACING_METRES = 5;
const MAXIMUM_SOURCE_POINTS = 480;

function distanceBetween(a: LatLng, b: LatLng) {
  const latitudeMetres = (a.latitude - b.latitude) * 111_111;
  const longitudeMetres = (a.longitude - b.longitude) * 111_111 * Math.cos((a.latitude * Math.PI) / 180);
  return Math.hypot(latitudeMetres, longitudeMetres);
}

/**
 * Creates one buffered convex territory from the visited locations. A single
 * polygon keeps its transparent shade uniform instead of darkening where
 * individual coverage circles would overlap.
 */
export function territoryPolygon(points: LatLng[]) {
  const spaced: LatLng[] = [];
  for (const point of points) {
    const previous = spaced.at(-1);
    if (!previous || distanceBetween(previous, point) >= MINIMUM_SOURCE_SPACING_METRES) {
      spaced.push(point);
    }
  }

  const sources =
    spaced.length <= MAXIMUM_SOURCE_POINTS
      ? spaced
      : spaced.filter((_, index) => index % Math.ceil(spaced.length / MAXIMUM_SOURCE_POINTS) === 0 || index === spaced.length - 1);

  const buffered = sources.flatMap((point) => bufferedRing(point));
  return convexHull(buffered);
}

function bufferedRing(point: LatLng) {
  const latitudeRadius = TERRITORY_RADIUS_METRES / 111_111;
  const longitudeRadius = TERRITORY_RADIUS_METRES / (111_111 * Math.cos((point.latitude * Math.PI) / 180));
  return Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * Math.PI * 2;
    return {
      latitude: point.latitude + Math.sin(angle) * latitudeRadius,
      longitude: point.longitude + Math.cos(angle) * longitudeRadius,
    };
  });
}

function convexHull(points: LatLng[]) {
  if (points.length < 3) return points;
  const sorted = [...points].sort((a, b) => a.longitude - b.longitude || a.latitude - b.latitude);
  const cross = (origin: LatLng, a: LatLng, b: LatLng) =>
    (a.longitude - origin.longitude) * (b.latitude - origin.latitude) -
    (a.latitude - origin.latitude) * (b.longitude - origin.longitude);
  const buildHalf = (input: LatLng[]) => {
    const half: LatLng[] = [];
    for (const point of input) {
      while (half.length >= 2 && cross(half[half.length - 2], half[half.length - 1], point) <= 0) half.pop();
      half.push(point);
    }
    return half;
  };
  const lower = buildHalf(sorted);
  const upper = buildHalf([...sorted].reverse());
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
