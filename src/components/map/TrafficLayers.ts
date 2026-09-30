/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * TrafficLayers: Mapbox Vector Traffic & Tactical Congestion Overlay Engine
 * Renders official Mapbox Traffic vector tiles with custom neon glowing red/orange overlays
 * and real-time Bengaluru arterial bottleneck corridors.
 */

import type { Map, GeoJSONSource } from 'mapbox-gl';
import { TrafficSegment } from '../../types/emergency';

/**
 * Key Bengaluru Arterial Congestion Corridors Dataset
 * Realistic coordinates following high-density traffic corridors in Bengaluru
 */
export const BENGALURU_DEFAULT_TRAFFIC_CORRIDORS: TrafficSegment[] = [
  {
    id: 'TRF-01',
    name: 'Hosur Road / Dairy Circle Bottleneck',
    congestion: 'severe',
    delayMinutes: 10,
    speedKmH: 8,
    description: 'Severe arterial gridlock under Dairy Circle flyover. +10 min transit delay.',
    coordinates: [
      [77.6050, 12.9550],
      [77.6080, 12.9490],
      [77.6120, 12.9440],
      [77.6160, 12.9390],
      [77.6200, 12.9352],
    ],
  },
  {
    id: 'TRF-02',
    name: 'Silk Board Junction / Outer Ring Road Corridor',
    congestion: 'severe',
    delayMinutes: 14,
    speedKmH: 6,
    description: 'Catastrophic junction bottleneck. Transit speeds below 6 km/h.',
    coordinates: [
      [77.6180, 12.9150],
      [77.6230, 12.9175],
      [77.6280, 12.9190],
      [77.6350, 12.9220],
    ],
  },
  {
    id: 'TRF-03',
    name: 'MG Road / Trinity Circle Underpass Corridor',
    congestion: 'severe',
    delayMinutes: 12,
    speedKmH: 7,
    description: 'High-density collision bottleneck at Trinity Circle approach.',
    coordinates: [
      [77.6120, 12.9750],
      [77.6160, 12.9742],
      [77.6186, 12.9738],
      [77.6240, 12.9730],
    ],
  },
  {
    id: 'TRF-04',
    name: 'Old Airport Road / Domlur Flyover Corridor',
    congestion: 'heavy',
    delayMinutes: 6,
    speedKmH: 16,
    description: 'Heavy commute flow near Domlur flyover junction.',
    coordinates: [
      [77.6360, 12.9665],
      [77.6420, 12.9630],
      [77.6480, 12.9600],
      [77.6517, 12.9584],
    ],
  },
  {
    id: 'TRF-05',
    name: 'Bellandur / Outer Ring Road Tech Corridor',
    congestion: 'heavy',
    delayMinutes: 8,
    speedKmH: 14,
    description: 'Peak hour office corridor congestion.',
    coordinates: [
      [77.6620, 12.9320],
      [77.6720, 12.9380],
      [77.6820, 12.9430],
    ],
  },
  {
    id: 'TRF-06',
    name: 'Koramangala 80ft Road / 100ft Junction',
    congestion: 'moderate',
    delayMinutes: 4,
    speedKmH: 22,
    description: 'Moderate commercial traffic flow.',
    coordinates: [
      [77.6240, 12.9380],
      [77.6280, 12.9340],
      [77.6320, 12.9300],
    ],
  },
];

const TRAFFIC_VECTOR_SOURCE_ID = 'mapbox-traffic-source';
const TRAFFIC_CORRIDORS_SOURCE_ID = 'bengaluru-corridors-traffic-source';

const TRAFFIC_LAYER_IDS = [
  'mapbox-traffic-moderate-heavy',
  'mapbox-traffic-severe-glow',
  'mapbox-traffic-severe-line',
  'bengaluru-corridors-severe-glow',
  'bengaluru-corridors-heavy-glow',
  'bengaluru-corridors-main-line',
  'bengaluru-corridors-dash-pulse',
];

/**
 * Converts traffic segments into GeoJSON FeatureCollection
 */
function buildTrafficGeoJSON(segments: TrafficSegment[]): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return {
    type: 'FeatureCollection',
    features: segments.map((seg) => ({
      type: 'Feature',
      properties: {
        id: seg.id,
        name: seg.name,
        congestion: seg.congestion,
        delayMinutes: seg.delayMinutes,
        speedKmH: seg.speedKmH,
        description: seg.description ?? '',
        color: seg.congestion === 'severe' ? '#ef4444' : seg.congestion === 'heavy' ? '#f87171' : '#f97316',
      },
      geometry: {
        type: 'LineString',
        coordinates: seg.coordinates,
      },
    })),
  };
}

/**
 * Initializes both Mapbox Official Traffic Vector source and Bengaluru Key Corridors layer
 */
export function initTrafficLayers(
  map: Map,
  showTraffic: boolean,
  customSegments: TrafficSegment[] = BENGALURU_DEFAULT_TRAFFIC_CORRIDORS
): void {
  if (!map.isStyleLoaded()) {
    return;
  }

  const visibility = showTraffic ? 'visible' : 'none';

  // 1. Register Official Mapbox Traffic Vector Source if not present
  try {
    if (!map.getSource(TRAFFIC_VECTOR_SOURCE_ID)) {
      map.addSource(TRAFFIC_VECTOR_SOURCE_ID, {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-traffic-v1',
      });
    }

    // Vector Layer A: Moderate & Heavy Congestion (Glowing Red #f87171)
    if (!map.getLayer('mapbox-traffic-moderate-heavy')) {
      map.addLayer({
        id: 'mapbox-traffic-moderate-heavy',
        type: 'line',
        source: TRAFFIC_VECTOR_SOURCE_ID,
        'source-layer': 'traffic',
        filter: ['in', ['get', 'congestion'], ['literal', ['moderate', 'heavy']]],
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility,
        },
        paint: {
          'line-color': '#f87171',
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2.0, 14, 4.0, 17, 7],
          'line-opacity': 0.9,
        },
      });
    }

    // Vector Layer B: Severe Gridlock Glow (Crimson Red #ef4444)
    if (!map.getLayer('mapbox-traffic-severe-glow')) {
      map.addLayer({
        id: 'mapbox-traffic-severe-glow',
        type: 'line',
        source: TRAFFIC_VECTOR_SOURCE_ID,
        'source-layer': 'traffic',
        filter: ['==', ['get', 'congestion'], 'severe'],
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility,
        },
        paint: {
          'line-color': '#ef4444',
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 4, 14, 8, 17, 14],
          'line-blur': 4,
          'line-opacity': 0.55,
        },
      });
    }

    // Vector Layer C: Severe Gridlock Main Line
    if (!map.getLayer('mapbox-traffic-severe-line')) {
      map.addLayer({
        id: 'mapbox-traffic-severe-line',
        type: 'line',
        source: TRAFFIC_VECTOR_SOURCE_ID,
        'source-layer': 'traffic',
        filter: ['==', ['get', 'congestion'], 'severe'],
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility,
        },
        paint: {
          'line-color': '#ef4444',
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2.4, 14, 4.5, 17, 8],
          'line-opacity': 0.95,
        },
      });
    }
  } catch {
    // Vector traffic layer fallback for custom/offline tile layers
  }

  // 2. Register Bengaluru Key Congested Arterial Corridors GeoJSON Source
  const corridorsGeoJSON = buildTrafficGeoJSON(customSegments);
  const existingCorridorSource = map.getSource(TRAFFIC_CORRIDORS_SOURCE_ID) as GeoJSONSource | undefined;

  if (existingCorridorSource) {
    existingCorridorSource.setData(corridorsGeoJSON);
  } else {
    try {
      map.addSource(TRAFFIC_CORRIDORS_SOURCE_ID, {
        type: 'geojson',
        data: corridorsGeoJSON,
      });

      // Corridor Layer 1: Severe Bottleneck Ambient Glow
      map.addLayer({
        id: 'bengaluru-corridors-severe-glow',
        type: 'line',
        source: TRAFFIC_CORRIDORS_SOURCE_ID,
        filter: ['==', ['get', 'congestion'], 'severe'],
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility,
        },
        paint: {
          'line-color': '#ef4444',
          'line-width': 12,
          'line-blur': 6,
          'line-opacity': 0.65,
        },
      });

      // Corridor Layer 2: Heavy Bottleneck Ambient Glow
      map.addLayer({
        id: 'bengaluru-corridors-heavy-glow',
        type: 'line',
        source: TRAFFIC_CORRIDORS_SOURCE_ID,
        filter: ['==', ['get', 'congestion'], 'heavy'],
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility,
        },
        paint: {
          'line-color': '#f97316',
          'line-width': 9,
          'line-blur': 4,
          'line-opacity': 0.5,
        },
      });

      // Corridor Layer 3: Main Arterial Traffic Line
      map.addLayer({
        id: 'bengaluru-corridors-main-line',
        type: 'line',
        source: TRAFFIC_CORRIDORS_SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility,
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 4,
          'line-opacity': 0.95,
        },
      });

      // Corridor Layer 4: Tactical Traffic Casing / Dashed Strobe
      map.addLayer({
        id: 'bengaluru-corridors-dash-pulse',
        type: 'line',
        source: TRAFFIC_CORRIDORS_SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility,
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': 1.5,
          'line-dasharray': [1, 3],
          'line-opacity': 0.7,
        },
      });
    } catch {
      // Safe guard
    }
  }
}

/**
 * Toggles visibility across all Mapbox traffic and corridor layers
 */
export function setTrafficVisibility(map: Map, isVisible: boolean): void {
  if (!map.isStyleLoaded()) {
    return;
  }

  const visibility = isVisible ? 'visible' : 'none';

  TRAFFIC_LAYER_IDS.forEach((layerId) => {
    try {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    } catch {
      // Safe ignore
    }
  });
}

/**
 * Clears and purges traffic layers and sources upon component unmount
 */
export function clearTrafficLayers(map: Map): void {
  TRAFFIC_LAYER_IDS.forEach((layerId) => {
    try {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    } catch {
      // Safe ignore
    }
  });

  try {
    if (map.getSource(TRAFFIC_CORRIDORS_SOURCE_ID)) {
      map.removeSource(TRAFFIC_CORRIDORS_SOURCE_ID);
    }
    if (map.getSource(TRAFFIC_VECTOR_SOURCE_ID)) {
      map.removeSource(TRAFFIC_VECTOR_SOURCE_ID);
    }
  } catch {
    // Safe ignore
  }
}
