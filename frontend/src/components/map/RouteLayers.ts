/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * GeoJSON Route Layers & Two-Tone Blue Polyline Engine for Mapbox GL JS
 * Implements strict two-tone emergency vector visualization:
 * - Leg 1 (Station -> Incident): Neon Sky Blue (#38bdf8) with cyan-blue glow
 * - Leg 2 (Incident -> Hospital): Deep Cobalt Blue (#2563eb) with deep cobalt halo
 * - Historic Traversed Trail: Faint low-opacity blue trail (#1e3a8a / opacity 0.35)
 * - Congestion Bottleneck: Glowing Crimson Red (#ef4444)
 * - Dynamic AI Bypass Detour: High-Visibility Amber (#f59e0b)
 */

import type { Map, GeoJSONSource } from 'mapbox-gl';
import { RouteGeometry, Coordinates } from '../../types/emergency';

/**
 * Set of active static route layer IDs rendered on the canvas
 */
const activeRouteIds = new Set<string>();

/**
 * Set of active live vehicle path layer IDs
 */
const activeLiveVehicleIds = new Set<string>();

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
    const isFadedTrail = route.id.includes('FADED') || route.id.includes('TRAIL');
    const isCongested = route.isCongested || route.type === 'CONGESTED_ORIGINAL';
    const isDetour = route.type === 'DETOUR';
    const isHospitalTransport = route.type === 'HOSPITAL_TRANSPORT' || route.legNumber === 2;
    const isLeg1 = route.legNumber === 1 || route.type === 'DISPATCH';

    // Two-Tone Blue & Tactical Color System
    let routeColor = '#38bdf8'; // Default Neon Sky Blue (Leg 1)
    let glowColor = '#0284c7';
    let coreColor = '#e0f2fe';

    if (isCongested) {
      routeColor = '#ef4444'; // Glowing Red Gridlock
      glowColor = '#dc2626';
      coreColor = '#fecaca';
    } else if (isPending || isDetour) {
      routeColor = '#f59e0b'; // Dynamic Amber Bypass
      glowColor = '#d97706';
      coreColor = '#fef3c7';
    } else if (isHospitalTransport || isEvacuation) {
      routeColor = '#2563eb'; // Deep Cobalt Blue (Leg 2)
      glowColor = '#1d4ed8';
      coreColor = '#dbeafe';
    } else if (isFadedTrail || isDimmedOriginal) {
      routeColor = '#1e3a8a'; // Faint Historic Blue Trail
      glowColor = '#1e293b';
      coreColor = '#334155';
    } else if (isLeg1) {
      routeColor = '#38bdf8'; // Neon Sky Blue (Leg 1)
      glowColor = '#0284c7';
      coreColor = '#ffffff';
    } else {
      routeColor = route.color || '#38bdf8';
      glowColor = '#0284c7';
      coreColor = '#ffffff';
    }

    // Determine focus/selection state
    const hasSelection = Boolean(selectedIncidentId || selectedResourceId);
    const isMatchingIncident = selectedIncidentId && route.incidentId === selectedIncidentId;
    const isMatchingResource = selectedResourceId && route.resourceId === selectedResourceId;
    const isHighlighted = Boolean(isMatchingIncident || isMatchingResource);

    let baseOpacity = hasSelection ? (isHighlighted ? 1.0 : 0.45) : (isFadedTrail || isDimmedOriginal ? 0.35 : 0.95);
    let glowOpacity = hasSelection ? (isHighlighted ? 0.95 : 0.35) : (isFadedTrail || isDimmedOriginal ? 0.2 : 0.8);
    let mainLineWidth = isHighlighted ? 6.5 : 5.2;
    let casingLineWidth = mainLineWidth + 3.2;
    let glowLineWidth = isHighlighted ? 24 : 18;
    let coreLineWidth = isHighlighted ? 2.4 : 1.8;

    if (isCongested) {
      mainLineWidth = isHighlighted ? 6.2 : 5.0;
      glowLineWidth = isHighlighted ? 24 : 18;
    } else if (isFadedTrail || isDimmedOriginal) {
      mainLineWidth = 3.5;
      glowLineWidth = 8;
      casingLineWidth = 5.5;
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
      const dashArray = isCongested ? [2, 2] : isPending ? [3, 2] : isEvacuation ? [4, 2] : undefined;

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
 * Real-Time 60fps Dynamic Vehicle Live Path Visualizer
 * Renders:
 * 1. Faint, low-opacity historic blue trail for traversed road segment
 * 2. High-intensity two-tone blue vector for upcoming road segment (Neon Sky Blue for Leg 1 / Deep Cobalt Blue for Leg 2)
 */
export function updateVehicleLivePath(
  map: Map,
  vehicleId: string,
  travelledCoords: Coordinates[],
  remainingCoords: Coordinates[],
  isSelected: boolean = false,
  _resourceType?: 'AMBULANCE' | 'FIRE_TRUCK' | 'RESCUE_TEAM',
  isLeg2HospitalTransport: boolean = false
): void {
  if (!map.isStyleLoaded()) return;

  const srcTravelledId = `live-src-travelled-${vehicleId}`;
  const srcRemainingId = `live-src-remaining-${vehicleId}`;

  const layerTravelledGlow = `live-lay-travelled-glow-${vehicleId}`;
  const layerTravelledMain = `live-lay-travelled-main-${vehicleId}`;

  const layerRemainingGlow = `live-lay-remaining-glow-${vehicleId}`;
  const layerRemainingCasing = `live-lay-remaining-casing-${vehicleId}`;
  const layerRemainingMain = `live-lay-remaining-main-${vehicleId}`;
  const layerRemainingCore = `live-lay-remaining-core-${vehicleId}`;

  // Two-tone color calibration
  const remainingColor = isLeg2HospitalTransport ? '#2563eb' : '#38bdf8'; // Cobalt Blue for Leg 2, Neon Sky Blue for Leg 1
  const remainingGlowColor = isLeg2HospitalTransport ? '#1d4ed8' : '#0284c7';
  const remainingCoreColor = isLeg2HospitalTransport ? '#dbeafe' : '#ffffff';

  const validTravelled: [number, number][] =
    travelledCoords.length >= 2
      ? (travelledCoords as [number, number][])
      : travelledCoords.length === 1 && travelledCoords[0]
      ? [travelledCoords[0], travelledCoords[0]]
      : [];

  const validRemaining: [number, number][] =
    remainingCoords.length >= 2
      ? (remainingCoords as [number, number][])
      : remainingCoords.length === 1 && remainingCoords[0]
      ? [remainingCoords[0], remainingCoords[0]]
      : [];

  const travelledData: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: { id: vehicleId, segment: 'travelled' },
    geometry: {
      type: 'LineString',
      coordinates: validTravelled,
    },
  };

  const remainingData: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: { id: vehicleId, segment: 'remaining' },
    geometry: {
      type: 'LineString',
      coordinates: validRemaining,
    },
  };

  // 1. Update or create Remaining Active Path Source
  const existingRemainingSrc = map.getSource(srcRemainingId) as GeoJSONSource | undefined;
  if (existingRemainingSrc) {
    existingRemainingSrc.setData(remainingData);
  } else if (remainingCoords.length >= 2) {
    map.addSource(srcRemainingId, { type: 'geojson', data: remainingData });

    // Glow
    map.addLayer({
      id: layerRemainingGlow,
      type: 'line',
      source: srcRemainingId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': remainingGlowColor,
        'line-width': isSelected ? 22 : 16,
        'line-opacity': isSelected ? 0.95 : 0.85,
        'line-blur': 4,
      },
    });

    // Casing
    map.addLayer({
      id: layerRemainingCasing,
      type: 'line',
      source: srcRemainingId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#020617',
        'line-width': isSelected ? 9.5 : 8.0,
        'line-opacity': 0.95,
      },
    });

    // Main
    map.addLayer({
      id: layerRemainingMain,
      type: 'line',
      source: srcRemainingId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': remainingColor,
        'line-width': isSelected ? 6.5 : 5.2,
        'line-opacity': 1.0,
      },
    });

    // Laser Core
    map.addLayer({
      id: layerRemainingCore,
      type: 'line',
      source: srcRemainingId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': remainingCoreColor,
        'line-width': isSelected ? 2.5 : 1.8,
        'line-opacity': 0.95,
      },
    });

    activeLiveVehicleIds.add(vehicleId);
  }

  // 2. Update or create Faint Historic Blue Traversed Trail Source
  const existingTravelledSrc = map.getSource(srcTravelledId) as GeoJSONSource | undefined;
  if (existingTravelledSrc) {
    existingTravelledSrc.setData(travelledData);
  } else if (travelledCoords.length >= 2) {
    map.addSource(srcTravelledId, { type: 'geojson', data: travelledData });

    // Faint Trail Glow
    map.addLayer({
      id: layerTravelledGlow,
      type: 'line',
      source: srcTravelledId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#1e3a8a',
        'line-width': 8,
        'line-opacity': 0.25,
        'line-blur': 3,
      },
    });

    // Faint Trail Line
    map.addLayer({
      id: layerTravelledMain,
      type: 'line',
      source: srcTravelledId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 3.0,
        'line-opacity': 0.35,
        'line-dasharray': [2, 3],
      },
    });
  }
}

/**
 * Removes dynamic live path layers for a vehicle
 */
export function removeVehicleLivePath(map: Map, vehicleId: string): void {
  const layerIds = [
    `live-lay-travelled-glow-${vehicleId}`,
    `live-lay-travelled-main-${vehicleId}`,
    `live-lay-remaining-glow-${vehicleId}`,
    `live-lay-remaining-casing-${vehicleId}`,
    `live-lay-remaining-main-${vehicleId}`,
    `live-lay-remaining-core-${vehicleId}`,
  ];

  const sourceIds = [
    `live-src-travelled-${vehicleId}`,
    `live-src-remaining-${vehicleId}`,
  ];

  try {
    layerIds.forEach((layId) => {
      if (map.getLayer(layId)) map.removeLayer(layId);
    });
    sourceIds.forEach((srcId) => {
      if (map.getSource(srcId)) map.removeSource(srcId);
    });
    activeLiveVehicleIds.delete(vehicleId);
  } catch {
    // Safe cleanup
  }
}

/**
 * Clears all live vehicle paths
 */
export function clearAllVehicleLivePaths(map: Map): void {
  activeLiveVehicleIds.forEach((vehicleId) => {
    removeVehicleLivePath(map, vehicleId);
  });
  activeLiveVehicleIds.clear();
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
