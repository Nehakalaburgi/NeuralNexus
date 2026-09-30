/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * GeoJSON Route Layers & Polylines Coordinator for Mapbox GL JS
 * Handles active cyan glow vectors and flashing dashed amber pending reallocation lines.
 */

import type { Map, GeoJSONSource } from 'mapbox-gl';
import { RouteGeometry } from '../../types/emergency';

/**
 * Tracks currently rendered route layer and source IDs on the map canvas
 */
const activeRouteIds = new Set<string>();

/**
 * Synchronizes RouteGeometry arrays to Mapbox GeoJSON sources & layers
 */
export function syncRouteLayers(map: Map, routes: RouteGeometry[]): void {
  if (!map.isStyleLoaded()) {
    return;
  }

  const incomingRouteIds = new Set(routes.map((r) => r.id));

  // 1. Remove obsolete route sources & layers no longer in state
  activeRouteIds.forEach((routeId) => {
    if (!incomingRouteIds.has(routeId)) {
      removeRouteFromMap(map, routeId);
      activeRouteIds.delete(routeId);
    }
  });

  // 2. Add or update active and pending route vectors
  routes.forEach((route) => {
    const sourceId = `route-source-${route.id}`;
    const glowLayerId = `route-layer-glow-${route.id}`;
    const mainLayerId = `route-layer-main-${route.id}`;

    const geojsonData: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {
        id: route.id,
        isPendingApproval: route.isPendingApproval,
        color: route.color,
      },
      geometry: {
        type: 'LineString',
        coordinates: route.coordinates,
      },
    };

    const existingSource = map.getSource(sourceId) as GeoJSONSource | undefined;

    if (existingSource) {
      // Update existing GeoJSON polyline geometry
      existingSource.setData(geojsonData);
    } else {
      // Register new GeoJSON LineString source
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData,
      });

      // Layer 1: Ambient Glow / Casing Polyline
      map.addLayer({
        id: glowLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': route.isPendingApproval ? '#f59e0b' : route.color || '#06b6d4',
          'line-width': route.isPendingApproval ? 10 : 8,
          'line-opacity': route.isPendingApproval ? 0.45 : 0.35,
          'line-blur': route.isPendingApproval ? 6 : 4,
        },
      });

      // Layer 2: Main Vector Line (Solid or Dashed for Pending Reallocation)
      map.addLayer({
        id: mainLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': route.isPendingApproval ? '#f59e0b' : route.color || '#06b6d4',
          'line-width': route.isPendingApproval ? 4 : 3.5,
          'line-opacity': 0.95,
          ...(route.isPendingApproval ? { 'line-dasharray': [2, 2] } : {}),
        },
      });

      activeRouteIds.add(route.id);
    }
  });
}

/**
 * Safely removes a specific route's layers and source from Mapbox GL
 */
function removeRouteFromMap(map: Map, routeId: string): void {
  const glowLayerId = `route-layer-glow-${routeId}`;
  const mainLayerId = `route-layer-main-${routeId}`;
  const sourceId = `route-source-${routeId}`;

  try {
    if (map.getLayer(glowLayerId)) {
      map.removeLayer(glowLayerId);
    }
    if (map.getLayer(mainLayerId)) {
      map.removeLayer(mainLayerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  } catch {
    // Ignore cleanup on unmounted map instances
  }
}

/**
 * Completely purges all custom route layers and sources on component unmount
 */
export function clearAllRouteLayers(map: Map): void {
  activeRouteIds.forEach((routeId) => {
    removeRouteFromMap(map, routeId);
  });
  activeRouteIds.clear();
}
