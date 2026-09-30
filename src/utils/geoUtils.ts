/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * Geospatial Mathematics & Polyline Interpolation Engine
 * Calculates Haversine distances, along-track interpolation, forward bearings, dynamic ETAs,
 * and polyline splitting for travelled (solid blue) vs upcoming (dashed blue) vehicle corridors.
 */

import { Coordinates } from '../types/emergency';

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates Haversine great-circle distance between two [lng, lat] points in kilometers
 */
export function haversineDistanceKm(coord1: Coordinates, coord2: Coordinates): number {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculates total road distance along a sequence of [lng, lat] polyline vertices in kilometers
 */
export function polylineDistanceKm(coordinates: Coordinates[]): number {
  if (coordinates.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];
    if (p1 && p2) {
      total += haversineDistanceKm(p1, p2);
    }
  }
  return total;
}

/**
 * Calculates forward compass bearing (0-360 degrees) between two geographic points
 */
export function calculateBearing(coord1: Coordinates, coord2: Coordinates): number {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));

  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

export interface InterpolationResult {
  position: Coordinates;
  bearing: number;
  distanceRemainingKm: number;
  totalDistanceKm: number;
  etaMinutes: number;
}

export interface SlicedPolylineResult {
  travelled: Coordinates[];
  remaining: Coordinates[];
  position: Coordinates;
  bearing: number;
  distanceTravelledKm: number;
  distanceRemainingKm: number;
  totalDistanceKm: number;
  etaMinutes: number;
}

/**
 * Splits a road polyline at a given progress (0.0 to 1.0) into:
 * 1. `travelled`: Road path segment from trip origin up to current vehicle position (Solid Blue Path)
 * 2. `remaining`: Road path segment from current vehicle position to destination incident (Upcoming Blue Path)
 */
export function slicePolylineAtProgress(
  coordinates: Coordinates[],
  progress: number,
  baseEtaMinutes?: number,
  speedKmH: number = 42
): SlicedPolylineResult {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const totalDistance = polylineDistanceKm(coordinates);

  const firstCoord: Coordinates = coordinates[0] ?? [77.6186, 12.9650];
  if (coordinates.length < 2 || totalDistance === 0) {
    return {
      travelled: [],
      remaining: coordinates.length > 0 ? [...coordinates] : [],
      position: firstCoord,
      bearing: 0,
      distanceTravelledKm: 0,
      distanceRemainingKm: 0,
      totalDistanceKm: 0,
      etaMinutes: 0,
    };
  }

  const secondCoord: Coordinates = coordinates[1] ?? firstCoord;

  // At journey start: no path travelled yet, full path is upcoming
  if (clampedProgress <= 0.0005) {
    return {
      travelled: [],
      remaining: [...coordinates],
      position: firstCoord,
      bearing: calculateBearing(firstCoord, secondCoord),
      distanceTravelledKm: 0,
      distanceRemainingKm: Number(totalDistance.toFixed(2)),
      totalDistanceKm: Number(totalDistance.toFixed(2)),
      etaMinutes: baseEtaMinutes !== undefined ? baseEtaMinutes : Number(((totalDistance / speedKmH) * 60).toFixed(1)),
    };
  }

  // At destination arrival: full path is travelled, no upcoming path remaining
  if (clampedProgress >= 0.9995) {
    const lastCoord: Coordinates = coordinates[coordinates.length - 1] ?? firstCoord;
    const prevCoord: Coordinates = coordinates[coordinates.length - 2] ?? lastCoord;
    return {
      travelled: [...coordinates],
      remaining: [],
      position: lastCoord,
      bearing: calculateBearing(prevCoord, lastCoord),
      distanceTravelledKm: Number(totalDistance.toFixed(2)),
      distanceRemainingKm: 0,
      totalDistanceKm: Number(totalDistance.toFixed(2)),
      etaMinutes: 0,
    };
  }

  const targetDistance = totalDistance * clampedProgress;
  let accumulatedDistance = 0;

  const travelled: Coordinates[] = [firstCoord];
  const remaining: Coordinates[] = [];

  let currentPosition: Coordinates = firstCoord;
  let bearing = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];
    if (!p1 || !p2) continue;

    const segmentDistance = haversineDistanceKm(p1, p2);

    if (accumulatedDistance + segmentDistance >= targetDistance) {
      const segmentProgress = segmentDistance > 0 ? (targetDistance - accumulatedDistance) / segmentDistance : 0;
      const clampedSegProg = Math.max(0, Math.min(1, segmentProgress));

      const lng = p1[0] + (p2[0] - p1[0]) * clampedSegProg;
      const lat = p1[1] + (p2[1] - p1[1]) * clampedSegProg;
      currentPosition = [lng, lat];
      bearing = calculateBearing(p1, p2);

      // Travelled segment ends at current interpolated vehicle position
      travelled.push(currentPosition);

      // Remaining segment starts at current interpolated vehicle position
      remaining.push(currentPosition);
      for (let j = i + 1; j < coordinates.length; j++) {
        const nextPt = coordinates[j];
        if (nextPt) remaining.push(nextPt);
      }
      break;
    } else {
      accumulatedDistance += segmentDistance;
      travelled.push(p2);
    }
  }

  const distanceRemainingKm = Math.max(0, totalDistance - targetDistance);
  const distanceTravelledKm = Math.min(totalDistance, targetDistance);
  const calculatedEta = (distanceRemainingKm / speedKmH) * 60;
  const etaMinutes = baseEtaMinutes !== undefined
    ? Math.max(0, baseEtaMinutes * (1 - clampedProgress))
    : calculatedEta;

  return {
    travelled: travelled.length >= 2 ? travelled : [],
    remaining: remaining.length >= 2 ? remaining : [],
    position: currentPosition,
    bearing: Math.round(bearing),
    distanceTravelledKm: Number(distanceTravelledKm.toFixed(2)),
    distanceRemainingKm: Number(distanceRemainingKm.toFixed(2)),
    totalDistanceKm: Number(totalDistance.toFixed(2)),
    etaMinutes: Number(Math.max(0, etaMinutes).toFixed(1)),
  };
}

/**
 * Interpolates real-time vehicle position, compass heading, remaining distance, and ETA
 * along an arbitrary multi-segment road polyline.
 * @param coordinates Polyline vertices in [lng, lat]
 * @param progress Progress fraction between 0.0 (start) and 1.0 (scene arrival)
 * @param baseEtaMinutes Optional baseline total ETA in minutes for proportional countdown
 * @param speedKmH Average emergency response speed (default: 42 km/h metro average)
 */
export function interpolateAlongPolyline(
  coordinates: Coordinates[],
  progress: number,
  baseEtaMinutes?: number,
  speedKmH: number = 42
): InterpolationResult {
  const result = slicePolylineAtProgress(coordinates, progress, baseEtaMinutes, speedKmH);
  return {
    position: result.position,
    bearing: result.bearing,
    distanceRemainingKm: result.distanceRemainingKm,
    totalDistanceKm: result.totalDistanceKm,
    etaMinutes: result.etaMinutes,
  };
}
