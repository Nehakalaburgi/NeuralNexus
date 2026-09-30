import type { Map, GeoJSONSource } from 'mapbox-gl';
import { RouteGeometry } from '../../types/emergency';

const ROUTE_SOURCE_ID = 'resqalloc-routes-source';
const ROUTE_LAYER_ID = 'resqalloc-routes-layer';

export function initRouteLayers(map: Map): void {
  if (map.getSource(ROUTE_SOURCE_ID)) return;

  map.addSource(ROUTE_SOURCE_ID, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [],
    },
  });

  map.addLayer({
    id: ROUTE_LAYER_ID,
    type: 'line',
    source: ROUTE_SOURCE_ID,
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-width': ['case', ['==', ['get', 'legType'], 'HOSPITAL_LEG'], 6, 5],
      'line-color': [
        'match',
        ['get', 'legType'],
        'DISPATCH_LEG',
        '#38bdf8', // Neon Sky Blue
        'HOSPITAL_LEG',
        '#2563eb', // Deep Cobalt Blue
        'HISTORIC_LEG',
        'rgba(56, 189, 248, 0.3)',
        '#38bdf8',
      ],
      'line-opacity': 0.9,
    },
  });
}

export function updateRouteLayers(map: Map, routes: RouteGeometry[] = []): void {
  const source = map.getSource(ROUTE_SOURCE_ID) as GeoJSONSource | undefined;
  if (!source) return;

  const features = routes.map((r) => ({
    type: 'Feature' as const,
    properties: {
      id: r.id,
      legType: r.legType || 'DISPATCH_LEG',
      resourceId: r.resourceId,
    },
    geometry: {
      type: 'LineString' as const,
      coordinates: r.coordinates,
    },
  }));

  source.setData({
    type: 'FeatureCollection',
    features,
  });
}