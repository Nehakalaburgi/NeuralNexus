import { Location } from '@shared/emergency';

/**
 * Calculates straight-line distance in kilometers between two geographic coordinates using Haversine formula
 */
export function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLon = ((loc2.lng - loc1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Distance in km rounded to 2 decimals
}

/**
 * Calculates Estimated Time of Arrival (ETA) in minutes given distance and speed
 * Default speed: 40 km/h for emergency vehicles in urban areas
 */
export function calculateEta(distanceKm: number, speedKmH: number = 40): number {
  if (distanceKm <= 0) return 1;
  const hours = distanceKm / speedKmH;
  return Math.max(1, Math.round(hours * 60));
}
