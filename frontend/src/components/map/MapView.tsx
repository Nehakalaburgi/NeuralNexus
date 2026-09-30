import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  WorldState,
  RouteGeometry,
  Incident,
  Resource,
  Hospital,
  TrafficSegment,
  MapStyleId,
} from '../../types/emergency';
import { calculateBearing } from '../../utils/geoUtils';
import { initRouteLayers, updateRouteLayers } from './RouteLayers';
import { initTrafficLayers } from './TrafficLayers';
import { syncMarkers } from './MapMarkers';

mapboxgl.accessToken =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  'pk.eyJ1IjoiZGV2LWVtZXJnZW5jeSIsImEiOiJjbHN2eGJ0MWgwMHF5MmtwZnlicTFleDZtIn0.placeholder';

export interface MapViewProps {
  worldState: WorldState;
  selectedIncidentId?: string | null;
  selectedResourceId?: string | null;
  activeMapStyle?: MapStyleId;
  showTrafficOverlay?: boolean;
  is3DView?: boolean;
  isPlaying?: boolean;
  isPaused?: boolean;
  playbackSpeed?: number;
  onSelectMapStyle?: (style: MapStyleId) => void;
  onToggleTrafficOverlay?: () => void;
  onToggle3DView?: () => void;
  onSelectIncident?: (incident: Incident) => void;
  onSelectResource?: (resource: Resource) => void;
  onSelectHospital?: (hospital: Hospital) => void;
  onSelectTrafficSegment?: (segment: TrafficSegment) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  worldState,
  isPaused = false,
  isPlaying = true,
  playbackSpeed = 1.0,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  const animationFrameRef = useRef<number | null>(null);
  const progressRef = useRef<{ [routeId: string]: number }>({});
  const onSceneTimersRef = useRef<{ [resourceId: string]: number }>({});
  const [triageAlert, setTriageAlert] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [77.62, 12.965],
      zoom: 12.8,
      pitch: 45,
      bearing: -15,
      antialias: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

    const handleResize = () => map.resize();
    window.addEventListener('resize', handleResize);

    map.on('load', () => {
      map.resize();
      initTrafficLayers(map, true);
      initRouteLayers(map);
      mapRef.current = map;
      updateRouteLayers(map, worldState.activeRoutes);
      syncMarkers(map, markersRef.current, worldState);
    });

    // Extra safety resize after render
    const resizeTimer = setTimeout(() => {
      if (map && map.isStyleLoaded()) {
        map.resize();
      }
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    updateRouteLayers(map, worldState.activeRoutes);
    syncMarkers(map, markersRef.current, worldState);
  }, [worldState]);

  useEffect(() => {
    let lastTimestamp = performance.now();

    const animate = (currentTimestamp: number) => {
      const deltaSeconds = (currentTimestamp - lastTimestamp) / 1000;
      lastTimestamp = currentTimestamp;

      const shouldAnimate = !isPaused && isPlaying !== false;

      if (shouldAnimate && worldState.activeRoutes && worldState.activeRoutes.length > 0) {
        worldState.activeRoutes.forEach((route: RouteGeometry) => {
          const coords = route.coordinates;
          if (!coords || coords.length < 2) return;

          const routeId = route.id;
          const resourceId = route.resourceId;
          if (!resourceId) return;

          if (onSceneTimersRef.current[resourceId] !== undefined) {
            const currentTimer = onSceneTimersRef.current[resourceId] ?? 0;
            onSceneTimersRef.current[resourceId] = currentTimer - deltaSeconds;
            if ((onSceneTimersRef.current[resourceId] ?? 0) <= 0) {
              delete onSceneTimersRef.current[resourceId];
              setTriageAlert(null);
            }
            return;
          }

          if (progressRef.current[routeId] === undefined) {
            progressRef.current[routeId] = 0;
          }

          const effectiveSpeed = playbackSpeed ?? 1.0;
          const baseSpeed = 0.045 * effectiveSpeed;
          const currentProg = progressRef.current[routeId] ?? 0;
          progressRef.current[routeId] = Math.min(
            1.0,
            currentProg + deltaSeconds * baseSpeed
          );

          const progress = progressRef.current[routeId] ?? 0;
          const totalPoints = coords.length;
          const currentPointIndex = Math.min(
            Math.floor(progress * (totalPoints - 1)),
            totalPoints - 2
          );

          const p1 = coords[currentPointIndex];
          const p2 = coords[currentPointIndex + 1];
          if (!p1 || !p2) return;

          const segmentProgress = progress * (totalPoints - 1) - currentPointIndex;

          const lng = p1[0] + (p2[0] - p1[0]) * segmentProgress;
          const lat = p1[1] + (p2[1] - p1[1]) * segmentProgress;

          const bearing = calculateBearing(p1, p2);

          const marker = markersRef.current.get(resourceId);
          if (marker) {
            marker.setLngLat([lng, lat]);
            const markerElement = marker.getElement();
            const iconWrapper = markerElement.querySelector('.vehicle-icon') as HTMLElement;
            if (iconWrapper) {
              iconWrapper.style.transform = `rotate(${bearing}deg)`;
            }
          }

          if (progress >= 1.0 && route.legType === 'DISPATCH_LEG') {
            if (onSceneTimersRef.current[resourceId] === undefined) {
              onSceneTimersRef.current[resourceId] = 4.0;
              setTriageAlert(
                `[ON SCENE] Unit ${resourceId} stabilizing victim. Preparing evacuation...`
              );
            }
          }
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [worldState, isPaused, isPlaying, playbackSpeed]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      {triageAlert && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full border border-amber-500/40 bg-slate-900/90 text-amber-300 text-xs font-mono shadow-2xl backdrop-blur-md flex items-center gap-2 animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          {triageAlert}
        </div>
      )}
    </div>
  );
};