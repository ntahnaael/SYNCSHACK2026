import type { LatLng } from '@/types';

export const TERRITORY_RADIUS_METRES = 15;

const MINIMUM_SOURCE_SPACING_METRES = 5;
const MAXIMUM_SOURCE_POINTS = 480;

function distanceBetween(a: LatLng, b: LatLng) {
  const latitudeMetres = (a.latitude - b.latitude) * 111_111;
  const longitudeMetres = (a.longitude - b.longitude) * 111_111 * Math.cos((a.latitude * Math.PI) / 180);
  return Math.hypot(latitudeMetres, longitudeMetres);
}

/**
 * Creates one buffered territory path from the visited locations. The single
 * polygon keeps its transparent shade uniform and follows turns in the route,
 * rather than filling the shortcut inside an L-shaped walk.
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

  if (sources.length < 2) return sources.flatMap((point) => bufferedRing(point));
  return bufferedPath(roundCorners(sources));
}

function roundCorners(points: LatLng[]) {
  if (points.length < 3) return points;
  const rounded: LatLng[] = [points[0]];
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    // Cut the inside of each turn into a short curve before buffering it.
    rounded.push(blend(previous, current, 0.76), blend(current, next, 0.24));
  }
  rounded.push(points[points.length - 1]);
  return rounded;
}

function blend(a: LatLng, b: LatLng, amount: number): LatLng {
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * amount,
    longitude: a.longitude + (b.longitude - a.longitude) * amount,
  };
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

function bufferedPath(points: LatLng[]) {
  const latitudeRadius = TERRITORY_RADIUS_METRES / 111_111;
  const normalAt = (index: number) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const dx = (next.longitude - previous.longitude) * Math.cos((points[index].latitude * Math.PI) / 180);
    const dy = next.latitude - previous.latitude;
    const length = Math.hypot(dx, dy) || 1;
    // Perpendicular in a locally projected coordinate plane.
    return { x: -dy / length, y: dx / length };
  };

  const left: LatLng[] = [];
  const right: LatLng[] = [];
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const normal = normalAt(index);
    const longitudeRadius = TERRITORY_RADIUS_METRES / (111_111 * Math.cos((point.latitude * Math.PI) / 180));
    left.push({
      latitude: point.latitude + normal.y * latitudeRadius,
      longitude: point.longitude + normal.x * longitudeRadius,
    });
    right.push({
      latitude: point.latitude - normal.y * latitudeRadius,
      longitude: point.longitude - normal.x * longitudeRadius,
    });
  }
  return [...left, ...right.reverse()];
}
