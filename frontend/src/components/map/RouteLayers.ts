/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * GeoJSON Route Layers & Polylines Coordinator for Mapbox GL JS
 * Renders high-visibility, multi-layer tactical emergency response vectors
 * with semantic styling per route category:
 * - Dispatch & Tactical Response: Emergency Cyan (#06b6d4) / Fire Engine Orange (#f97316)
 * - Hospital Evacuation Corridors: Medical Emerald (#10b981) / Teal (#14b8a6)
 * - Dynamic Bypass Detours: High-Visibility Amber (#f59e0b)
 * - Traffic Congestion Bottlenecks: Glowing Crimson Red (#ef4444)
 */

import type { Map, GeoJSONSource } from 'mapbox-gl';
import { RouteGeometry, Coordinates } from '../../types/emergency';

/**
 * Tracks currently rendered route layer and source IDs on the map canvas
 */
const activeRouteIds = new Set<string>();

/**
 * Synchronizes RouteGeometry arrays to Mapbox GeoJSON sources & layers
 */
export function syncRouteLayers(
  map: Map,
  routes: RouteGeometry[],
  selectedIncidentId?: string | null,
  selectedResourceId?: string | null
): void {
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

  // Sort routes by priority: evacuation corridors render below active vehicle vectors
  const sortedRoutes = [...routes].sort((a, b) => {
    const isEvacA = a.type === 'EVACUATION' || a.id.startsWith('ROUTE-EVAC-');
    const isEvacB = b.type === 'EVACUATION' || b.id.startsWith('ROUTE-EVAC-');
    if (isEvacA && !isEvacB) return -1;
    if (!isEvacA && isEvacB) return 1;
    return 0;
  });

  // 2. Add or update active routes
  sortedRoutes.forEach((route) => {
    const sourceId = `route-source-${route.id}`;
    const glowLayerId = `route-layer-glow-${route.id}`;
    const casingLayerId = `route-layer-casing-${route.id}`;
    const mainLayerId = `route-layer-main-${route.id}`;
    const coreLayerId = `route-layer-core-${route.id}`;

    const isEvacuation = route.type === 'EVACUATION' || route.id.startsWith('ROUTE-EVAC-');
    const isPending = route.isPendingApproval || route.type === 'REROUTE';
    const isDimmedOriginal = route.id.includes('ORIGINAL') && route.type !== 'CONGESTED_ORIGINAL';
    const isCongested = route.isCongested || route.type === 'CONGESTED_ORIGINAL';
    const isDetour = route.type === 'DETOUR';
    const isHospitalTransport = route.type === 'HOSPITAL_TRANSPORT' || route.legNumber === 2;

    // Use route's defined semantic color with robust fallbacks
    let routeColor = route.color || '#06b6d4';
    let glowColor = routeColor;
    let coreColor = '#ffffff';

    if (isCongested) {
      routeColor = '#ef4444';
      glowColor = '#dc2626';
      coreColor = '#fecaca';
    } else if (isPending || isDetour) {
      routeColor = '#f59e0b';
      glowColor = '#d97706';
      coreColor = '#fef3c7';
    } else if (isHospitalTransport || isEvacuation) {
      routeColor = route.color || '#10b981';
      glowColor = '#059669';
      coreColor = '#d1fae5';
    } else if (isDimmedOriginal) {
      routeColor = '#475569';
      glowColor = '#334155';
      coreColor = '#94a3b8';
    } else {
      routeColor = route.color || '#06b6d4';
      glowColor = '#0891b2';
      coreColor = '#e0f2fe';
    }

    // Determine focus/selection state
    const hasSelection = Boolean(selectedIncidentId || selectedResourceId);
    const isMatchingIncident = selectedIncidentId && route.incidentId === selectedIncidentId;
    const isMatchingResource = selectedResourceId && route.resourceId === selectedResourceId;
    const isHighlighted = Boolean(isMatchingIncident || isMatchingResource);

    let baseOpacity = hasSelection ? (isHighlighted ? 1.0 : 0.45) : (isDimmedOriginal ? 0.35 : 0.95);
    let glowOpacity = hasSelection ? (isHighlighted ? 0.95 : 0.35) : (isDimmedOriginal ? 0.2 : 0.8);
    let mainLineWidth = isHighlighted ? 6.2 : 5.0;
    let casingLineWidth = mainLineWidth + 3.2;
    let glowLineWidth = isHighlighted ? 22 : 16;
    let coreLineWidth = isHighlighted ? 2.2 : 1.7;

    if (isCongested) {
      mainLineWidth = isHighlighted ? 6.0 : 5.0;
      glowLineWidth = isHighlighted ? 22 : 16;
    } else if (isDimmedOriginal) {
      mainLineWidth = 3.5;
      glowLineWidth = 8;
    }

    casingLineWidth = mainLineWidth + 3.2;

    const geojsonData: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {
        id: route.id,
        type: route.type ?? 'DISPATCH',
        isPendingApproval: route.isPendingApproval,
        isCongested: isCongested,
        color: routeColor,
        label: route.label ?? '',
      },
      geometry: {
        type: 'LineString',
        coordinates: route.coordinates,
      },
    };

    const existingSource = map.getSource(sourceId) as GeoJSONSource | undefined;

    if (existingSource) {
      existingSource.setData(geojsonData);
      try {
        if (map.getLayer(glowLayerId)) {
          map.setPaintProperty(glowLayerId, 'line-color', glowColor);
          map.setPaintProperty(glowLayerId, 'line-opacity', glowOpacity);
          map.setPaintProperty(glowLayerId, 'line-width', glowLineWidth);
        }
        if (map.getLayer(casingLayerId)) {
          map.setPaintProperty(casingLayerId, 'line-width', casingLineWidth);
          map.setPaintProperty(casingLayerId, 'line-opacity', baseOpacity * 0.95);
        }
        if (map.getLayer(mainLayerId)) {
          map.setPaintProperty(mainLayerId, 'line-color', routeColor);
          map.setPaintProperty(mainLayerId, 'line-opacity', baseOpacity);
          map.setPaintProperty(mainLayerId, 'line-width', mainLineWidth);
        }
        if (map.getLayer(coreLayerId)) {
          map.setPaintProperty(coreLayerId, 'line-color', coreColor);
          map.setPaintProperty(coreLayerId, 'line-opacity', baseOpacity * 0.9);
          map.setPaintProperty(coreLayerId, 'line-width', coreLineWidth);
        }
      } catch {
        // Safe paint property update guard
      }
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData,
      });

      // Layer 1: Ambient Glow Polyline (Bottom Halo)
      map.addLayer({
        id: glowLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': glowColor,
          'line-width': glowLineWidth,
          'line-opacity': glowOpacity,
          'line-blur': isCongested ? 6 : isPending ? 5 : 4,
        },
      });

      // Layer 2: High-Contrast Dark Road Casing Outline
      map.addLayer({
        id: casingLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#020617',
          'line-width': casingLineWidth,
          'line-opacity': baseOpacity * 0.95,
        },
      });

      // Layer 3: Main Vector Line
      const dashArray = isCongested ? [2, 2] : isPending ? [3, 2] : isEvacuation ? [3, 3] : undefined;

      map.addLayer({
        id: mainLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': dashArray ? 'butt' : 'round',
        },
        paint: {
          'line-color': routeColor,
          'line-width': mainLineWidth,
          'line-opacity': baseOpacity,
          ...(dashArray ? { 'line-dasharray': dashArray } : {}),
        },
      });

      // Layer 4: High-Intensity Laser Core Line (Center Highlight)
      map.addLayer({
        id: coreLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': dashArray ? 'butt' : 'round',
        },
        paint: {
          'line-color': coreColor,
          'line-width': coreLineWidth,
          'line-opacity': baseOpacity * 0.9,
          ...(dashArray ? { 'line-dasharray': dashArray } : {}),
        },
      });

      activeRouteIds.add(route.id);
    }
  });
}

/**
 * Optional live vehicle path hook (clean no-op/fallback)
 */
export function updateVehicleLivePath(
  _map: Map,
  _vehicleId: string,
  _travelledCoords: Coordinates[],
  _remainingCoords: Coordinates[],
  _isSelected: boolean = false,
  _resourceType?: 'AMBULANCE' | 'FIRE_TRUCK' | 'RESCUE_TEAM',
  _isLeg2HospitalTransport: boolean = false
): void {
  // Direct vector rendering managed by syncRouteLayers
}

export function removeVehicleLivePath(_map: Map, _vehicleId: string): void {
  // No-op
}

export function clearAllVehicleLivePaths(_map: Map): void {
  // No-op
}

/**
 * Safely removes a specific route's layers and source from Mapbox GL
 */
function removeRouteFromMap(map: Map, routeId: string): void {
  const coreLayerId = `route-layer-core-${routeId}`;
  const mainLayerId = `route-layer-main-${routeId}`;
  const casingLayerId = `route-layer-casing-${routeId}`;
  const glowLayerId = `route-layer-glow-${routeId}`;
  const sourceId = `route-source-${routeId}`;

  try {
    if (map.getLayer(coreLayerId)) map.removeLayer(coreLayerId);
    if (map.getLayer(mainLayerId)) map.removeLayer(mainLayerId);
    if (map.getLayer(casingLayerId)) map.removeLayer(casingLayerId);
    if (map.getLayer(glowLayerId)) map.removeLayer(glowLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
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
