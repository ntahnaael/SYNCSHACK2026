import type { LatLng } from '@/types';

export const TERRITORY_RADIUS_METRES = 25;

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
  let rounded = points;
  // Two Chaikin passes turn hard GPS direction changes into a smooth curve.
  for (let pass = 0; pass < 2; pass += 1) {
    if (rounded.length < 3) break;
    const next: LatLng[] = [rounded[0]];
    for (let index = 0; index < rounded.length - 1; index += 1) {
      next.push(blend(rounded[index], rounded[index + 1], 0.25));
      next.push(blend(rounded[index], rounded[index + 1], 0.75));
    }
    next.push(rounded[rounded.length - 1]);
    rounded = next;
  }
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

  const endNormal = normalAt(points.length - 1);
  const startNormal = normalAt(0);
  const endCap = roundedCap(points[points.length - 1], endNormal, false);
  const startCap = roundedCap(points[0], startNormal, true);
  return [...left, ...endCap, ...right.reverse(), ...startCap];
}

function roundedCap(point: LatLng, normal: { x: number; y: number }, start: boolean) {
  const normalAngle = Math.atan2(normal.y, normal.x);
  const initialAngle = start ? normalAngle + Math.PI : normalAngle;
  const latitudeRadius = TERRITORY_RADIUS_METRES / 111_111;
  const longitudeRadius = TERRITORY_RADIUS_METRES / (111_111 * Math.cos((point.latitude * Math.PI) / 180));
  const steps = 8;
  const cap: LatLng[] = [];
  for (let index = 1; index < steps; index += 1) {
    const angle = initialAngle - (Math.PI * index) / steps;
    cap.push({
      latitude: point.latitude + Math.sin(angle) * latitudeRadius,
      longitude: point.longitude + Math.cos(angle) * longitudeRadius,
    });
  }
  return cap;
}
