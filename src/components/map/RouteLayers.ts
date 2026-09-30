/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * GeoJSON Route Layers & Polylines Coordinator for Mapbox GL JS
 * Highlights paths taken by all ambulances and fire vehicles with vivid glowing BLUE lines:
 * - Solid Sapphire Blue: Route paths for Ambulances (AMB-01, AMB-03, etc.) and Fire Tenders (FIRE-01)
 * - Glowing Dashed Electric/Cyan Blue: Upcoming vector to emergency scene
 * - Glowing Crimson RED: Traffic congestion / bottlenecks
 * - Glowing Amber: Pending reallocation diversion proposal
 * - Glowing Cyan: Hospital evacuation trauma corridor
 */

import type { Map, GeoJSONSource } from 'mapbox-gl';
import { RouteGeometry, Coordinates } from '../../types/emergency';

/**
 * Tracks currently rendered route layer and source IDs on the map canvas
 */
const activeRouteIds = new Set<string>();

/**
 * Tracks currently rendered real-time live vehicle path IDs
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

  // Sort routes by priority so active emergency vehicle blue routes render crisp on top of background corridors
  const sortedRoutes = [...routes].sort((a, b) => {
    const isEvacA = a.type === 'EVACUATION' || a.id.startsWith('ROUTE-EVAC-');
    const isEvacB = b.type === 'EVACUATION' || b.id.startsWith('ROUTE-EVAC-');
    if (isEvacA && !isEvacB) return -1;
    if (!isEvacA && isEvacB) return 1;
    return 0;
  });

  // 2. Add or update active vehicle paths (Ambulance + Fire), traffic bottlenecks, and evacuation vectors
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

    // Palette:
    // - All Vehicle Routes (Ambulances & Fire Trucks): Vivid High-Intensity Sapphire Blue (#2563eb / #3b82f6)
    // - Traffic Segments: Glowing Crimson RED (#ef4444)
    // - Pending Reroute: Glowing Amber warning halo with vivid Blue route core
    // - Hospital Evacuation: Subtle Medical Teal corridor (#0891b2)
    let routeColor = '#2563eb'; // Default vivid Sapphire Blue for all ambulances and fire trucks
    let glowColor = '#1d4ed8'; // Deep Royal Blue Glow
    let coreColor = '#93c5fd'; // Laser core highlight

    // Determine focus/selection state
    const hasSelection = Boolean(selectedIncidentId || selectedResourceId);
    const isMatchingIncident = selectedIncidentId && route.incidentId === selectedIncidentId;
    const isMatchingResource = selectedResourceId && route.resourceId === selectedResourceId;
    const isHighlighted = Boolean(isMatchingIncident || isMatchingResource);

    let baseOpacity = hasSelection ? (isHighlighted ? 1.0 : 0.45) : 0.98;
    let glowOpacity = hasSelection ? (isHighlighted ? 0.95 : 0.35) : 0.8;
    let mainLineWidth = isHighlighted ? 6.2 : 5.0;
    let casingLineWidth = mainLineWidth + 3.2;
    let glowLineWidth = isHighlighted ? 20 : 15;
    let coreLineWidth = isHighlighted ? 2.2 : 1.7;

    if (isCongested) {
      // Traffic Bottleneck -> Glowing RED
      routeColor = '#ef4444';
      glowColor = '#dc2626';
      coreColor = '#fecaca';
      baseOpacity = hasSelection ? (isHighlighted ? 1.0 : 0.45) : 0.95;
      glowOpacity = hasSelection ? (isHighlighted ? 0.95 : 0.45) : 0.85;
      mainLineWidth = isHighlighted ? 5.8 : 5.0;
      glowLineWidth = isHighlighted ? 20 : 16;
    } else if (isPending) {
      // Pending Reallocation Proposal -> Amber warning glow with vivid Blue ambulance route
      routeColor = '#2563eb';
      glowColor = '#f59e0b';
      coreColor = '#bfdbfe';
      baseOpacity = hasSelection ? (isHighlighted ? 1.0 : 0.4) : 0.95;
      glowOpacity = 0.85;
      mainLineWidth = isHighlighted ? 5.6 : 4.8;
      glowLineWidth = 18;
    } else if (isEvacuation) {
      // Hospital Evacuation -> Subtle Medical Teal corridor
      routeColor = '#0891b2';
      glowColor = '#06b6d4';
      coreColor = '#cffafe';
      baseOpacity = hasSelection ? (isHighlighted ? 0.85 : 0.25) : 0.65;
      glowOpacity = 0.45;
      mainLineWidth = isHighlighted ? 4.0 : 3.2;
      glowLineWidth = 8;
    } else if (isDimmedOriginal) {
      // Dimmed Original Inactive Vector -> Slate Gray
      routeColor = '#475569';
      glowColor = '#334155';
      coreColor = '#94a3b8';
      baseOpacity = 0.35;
      glowOpacity = 0.2;
      mainLineWidth = 3.5;
      glowLineWidth = 8;
    } else {
      // All Active Ambulance and Fire Engine Routes -> High-Visibility BLUE Lines
      routeColor = '#2563eb';
      glowColor = '#1d4ed8';
      coreColor = '#bfdbfe';
      baseOpacity = hasSelection ? (isHighlighted ? 1.0 : 0.45) : 0.98;
      glowOpacity = hasSelection ? (isHighlighted ? 0.95 : 0.35) : 0.8;
      mainLineWidth = isHighlighted ? 6.2 : 5.0;
      glowLineWidth = isHighlighted ? 20 : 15;
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
      // Update existing GeoJSON polyline geometry and dynamic paint styles
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
      // Register new GeoJSON LineString source
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

      // Layer 3: Main Vector Line (Solid Blue for Ambulance and Fire Routes)
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
 * Updates or initializes the real-time dynamic travelled (solid blue) and upcoming (glowing dashed blue)
 * path layers for a specific moving vehicle (Ambulances and Fire Trucks).
 * - Travelled: Path already covered from start to current position (Solid Blue Line)
 * - Upcoming: Path to be covered from current position to scene (Glowing Dashed Blue Line)
 */
export function updateVehicleLivePath(
  map: Map,
  vehicleId: string,
  travelledCoords: Coordinates[],
  remainingCoords: Coordinates[],
  isSelected: boolean = false,
  resourceType?: 'AMBULANCE' | 'FIRE_TRUCK' | 'RESCUE_TEAM'
): void {
  if (!map.isStyleLoaded()) return;

  const travelledSourceId = `v-src-trav-${vehicleId}`;
  const upcomingSourceId = `v-src-upcom-${vehicleId}`;

  const travGlow = `v-lyr-trav-glow-${vehicleId}`;
  const travCasing = `v-lyr-trav-casing-${vehicleId}`;
  const travMain = `v-lyr-trav-main-${vehicleId}`;
  const travCore = `v-lyr-trav-core-${vehicleId}`;

  const upGlow = `v-lyr-up-glow-${vehicleId}`;
  const upCasing = `v-lyr-up-casing-${vehicleId}`;
  const upMain = `v-lyr-up-main-${vehicleId}`;
  const upCore = `v-lyr-up-core-${vehicleId}`;

  // High-Visibility Electric Blue & Sapphire Blue Palette for ALL Emergency Vehicles (Ambulances & Fire Engines)
  const travMainColor = '#2563eb'; // Deep Vivid Sapphire Blue (Solid Travelled Path)
  const travGlowColor = '#1d4ed8'; // Intense Royal Blue Glow
  const travCoreColor = '#93c5fd'; // Laser Core Highlight

  const upMainColor = '#3b82f6';   // Glowing Electric Cobalt Blue (Dashed Upcoming Path)
  const upGlowColor = '#1d4ed8';   // Intense Royal Blue Glow
  const upCoreColor = '#bfdbfe';   // Bright Blue Core

  const hasTravelled = travelledCoords.length >= 2;
  const hasUpcoming = remainingCoords.length >= 2;

  const validTravelled: Coordinates[] = hasTravelled ? travelledCoords : [];
  const validRemaining: Coordinates[] = hasUpcoming ? remainingCoords : [];

  const travelledGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: { vehicleId, segment: 'TRAVELLED', resourceType },
    geometry: { type: 'LineString', coordinates: validTravelled },
  };

  const upcomingGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: { vehicleId, segment: 'UPCOMING', resourceType },
    geometry: { type: 'LineString', coordinates: validRemaining },
  };

  const travSource = map.getSource(travelledSourceId) as GeoJSONSource | undefined;
  const upSource = map.getSource(upcomingSourceId) as GeoJSONSource | undefined;

  // Selection styling weights
  const travMainWidth = isSelected ? 6.5 : 5.0;
  const travCoreWidth = isSelected ? 2.4 : 1.8;
  const travCasingWidth = isSelected ? 10.0 : 8.0;
  const travGlowWidth = isSelected ? 22 : 16;
  const travOpacity = hasTravelled ? (isSelected ? 1.0 : 0.95) : 0;
  const travGlowOpacity = hasTravelled ? (isSelected ? 0.95 : 0.75) : 0;

  const upMainWidth = isSelected ? 5.5 : 4.4;
  const upCoreWidth = isSelected ? 2.0 : 1.5;
  const upCasingWidth = isSelected ? 9.0 : 7.2;
  const upGlowWidth = isSelected ? 18 : 13;
  const upOpacity = hasUpcoming ? (isSelected ? 1.0 : 0.95) : 0;
  const upGlowOpacity = hasUpcoming ? (isSelected ? 0.85 : 0.65) : 0;

  if (travSource && upSource) {
    travSource.setData(travelledGeoJSON);
    upSource.setData(upcomingGeoJSON);

    try {
      if (map.getLayer(travMain)) {
        map.setPaintProperty(travMain, 'line-color', travMainColor);
        map.setPaintProperty(travMain, 'line-opacity', travOpacity);
        map.setPaintProperty(travMain, 'line-width', travMainWidth);
      }
      if (map.getLayer(travCore)) {
        map.setPaintProperty(travCore, 'line-color', travCoreColor);
        map.setPaintProperty(travCore, 'line-opacity', travOpacity * 0.95);
        map.setPaintProperty(travCore, 'line-width', travCoreWidth);
      }
      if (map.getLayer(travCasing)) {
        map.setPaintProperty(travCasing, 'line-opacity', travOpacity * 0.95);
        map.setPaintProperty(travCasing, 'line-width', travCasingWidth);
      }
      if (map.getLayer(travGlow)) {
        map.setPaintProperty(travGlow, 'line-color', travGlowColor);
        map.setPaintProperty(travGlow, 'line-opacity', travGlowOpacity);
        map.setPaintProperty(travGlow, 'line-width', travGlowWidth);
      }

      if (map.getLayer(upMain)) {
        map.setPaintProperty(upMain, 'line-color', upMainColor);
        map.setPaintProperty(upMain, 'line-opacity', upOpacity);
        map.setPaintProperty(upMain, 'line-width', upMainWidth);
      }
      if (map.getLayer(upCore)) {
        map.setPaintProperty(upCore, 'line-color', upCoreColor);
        map.setPaintProperty(upCore, 'line-opacity', upOpacity * 0.9);
        map.setPaintProperty(upCore, 'line-width', upCoreWidth);
      }
      if (map.getLayer(upCasing)) {
        map.setPaintProperty(upCasing, 'line-opacity', upOpacity * 0.9);
        map.setPaintProperty(upCasing, 'line-width', upCasingWidth);
      }
      if (map.getLayer(upGlow)) {
        map.setPaintProperty(upGlow, 'line-color', upGlowColor);
        map.setPaintProperty(upGlow, 'line-opacity', upGlowOpacity);
        map.setPaintProperty(upGlow, 'line-width', upGlowWidth);
      }
    } catch {
      // Safe dynamic property update
    }

    return;
  }

  // Initialize Travelled Source & Blue Layers if not present
  if (!travSource) {
    map.addSource(travelledSourceId, {
      type: 'geojson',
      data: travelledGeoJSON,
    });

    // 1. Travelled Path: Glowing Sapphire Blue Halo
    map.addLayer({
      id: travGlow,
      type: 'line',
      source: travelledSourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': travGlowColor,
        'line-width': travGlowWidth,
        'line-opacity': travGlowOpacity,
        'line-blur': 4,
      },
    });

    // 2. Travelled Path: Dark contrast casing
    map.addLayer({
      id: travCasing,
      type: 'line',
      source: travelledSourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#020617',
        'line-width': travCasingWidth,
        'line-opacity': travOpacity * 0.95,
      },
    });

    // 3. Travelled Path: Main Solid Sapphire BLUE Line (Defines path travelled)
    map.addLayer({
      id: travMain,
      type: 'line',
      source: travelledSourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': travMainColor,
        'line-width': travMainWidth,
        'line-opacity': travOpacity,
      },
    });

    // 4. Travelled Path: Ice-blue laser core
    map.addLayer({
      id: travCore,
      type: 'line',
      source: travelledSourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': travCoreColor,
        'line-width': travCoreWidth,
        'line-opacity': travOpacity * 0.95,
      },
    });
  }

  // Initialize Upcoming Source & Blue Layers if not present
  if (!upSource) {
    map.addSource(upcomingSourceId, {
      type: 'geojson',
      data: upcomingGeoJSON,
    });

    // 1. Upcoming Path: Vibrant Cyan / Sky Blue Halo
    map.addLayer({
      id: upGlow,
      type: 'line',
      source: upcomingSourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': upGlowColor,
        'line-width': upGlowWidth,
        'line-opacity': upGlowOpacity,
        'line-blur': 5,
      },
    });

    // 2. Upcoming Path: Dark contrast casing
    map.addLayer({
      id: upCasing,
      type: 'line',
      source: upcomingSourceId,
      layout: { 'line-join': 'round', 'line-cap': 'butt' },
      paint: {
        'line-color': '#020617',
        'line-width': upCasingWidth,
        'line-opacity': upOpacity * 0.9,
        'line-dasharray': [3, 2],
      },
    });

    // 3. Upcoming Path: Glowing Dashed Blue Vector (Defines path to be travelled)
    map.addLayer({
      id: upMain,
      type: 'line',
      source: upcomingSourceId,
      layout: { 'line-join': 'round', 'line-cap': 'butt' },
      paint: {
        'line-color': upMainColor,
        'line-width': upMainWidth,
        'line-opacity': upOpacity,
        'line-dasharray': [3, 2],
      },
    });

    // 4. Upcoming Path: Glowing light blue core
    map.addLayer({
      id: upCore,
      type: 'line',
      source: upcomingSourceId,
      layout: { 'line-join': 'round', 'line-cap': 'butt' },
      paint: {
        'line-color': upCoreColor,
        'line-width': upCoreWidth,
        'line-opacity': upOpacity * 0.9,
        'line-dasharray': [3, 2],
      },
    });
  }

  activeLiveVehicleIds.add(vehicleId);
}

/**
 * Safely removes a specific vehicle's dynamic live path layers and sources
 */
export function removeVehicleLivePath(map: Map, vehicleId: string): void {
  const layerIds = [
    `v-lyr-trav-core-${vehicleId}`,
    `v-lyr-trav-main-${vehicleId}`,
    `v-lyr-trav-casing-${vehicleId}`,
    `v-lyr-trav-glow-${vehicleId}`,
    `v-lyr-up-core-${vehicleId}`,
    `v-lyr-up-main-${vehicleId}`,
    `v-lyr-up-casing-${vehicleId}`,
    `v-lyr-up-glow-${vehicleId}`,
  ];

  layerIds.forEach((lyrId) => {
    try {
      if (map.getLayer(lyrId)) map.removeLayer(lyrId);
    } catch {
      // Safe layer cleanup guard
    }
  });

  const sourceIds = [`v-src-trav-${vehicleId}`, `v-src-upcom-${vehicleId}`];

  sourceIds.forEach((srcId) => {
    try {
      if (map.getSource(srcId)) map.removeSource(srcId);
    } catch {
      // Safe source cleanup guard
    }
  });

  activeLiveVehicleIds.delete(vehicleId);
}

/**
 * Purges all dynamic vehicle live path layers and sources
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
    if (map.getLayer(coreLayerId)) {
      map.removeLayer(coreLayerId);
    }
    if (map.getLayer(mainLayerId)) {
      map.removeLayer(mainLayerId);
    }
    if (map.getLayer(casingLayerId)) {
      map.removeLayer(casingLayerId);
    }
    if (map.getLayer(glowLayerId)) {
      map.removeLayer(glowLayerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  } catch {
    // Ignore cleanup on unmounted map instances
  }
}

/**
 * Completely purges all custom route layers, sources, and live vehicle paths on component unmount
 */
export function clearAllRouteLayers(map: Map): void {
  activeRouteIds.forEach((routeId) => {
    removeRouteFromMap(map, routeId);
  });
  activeRouteIds.clear();
  clearAllVehicleLivePaths(map);
}
