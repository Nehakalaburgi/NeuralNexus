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
import { slicePolylineAtProgress } from '../../utils/geoUtils';
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

/**
 * Shortest-arc angular interpolation to ensure smooth steering along curves
 */
function lerpAngle(start: number, end: number, factor: number): number {
  let diff = (end - start) % 360;
  if (diff < -180) diff += 360;
  if (diff > 180) diff -= 360;
  return (start + diff * factor + 360) % 360;
}

export const MapView: React.FC<MapViewProps> = ({
  worldState,
  isPaused = false,
  isPlaying = true,
  playbackSpeed = 1.0,
  onSelectIncident,
  onSelectResource,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  const animationFrameRef = useRef<number | null>(null);
  const progressRef = useRef<{ [routeId: string]: number }>({});
  const bearingRef = useRef<{ [resourceId: string]: number }>({});
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
      syncMarkers(map, markersRef.current, worldState, onSelectIncident, onSelectResource);
    });

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
    syncMarkers(map, markersRef.current, worldState, onSelectIncident, onSelectResource);
  }, [worldState, onSelectIncident, onSelectResource]);

  // 60fps Arc-Length Vehicle Traversal & Steering Ticker
  useEffect(() => {
    let lastTimestamp = performance.now();

    const animate = (currentTimestamp: number) => {
      const deltaSeconds = Math.min(0.1, (currentTimestamp - lastTimestamp) / 1000);
      lastTimestamp = currentTimestamp;

      const shouldAnimate = !isPaused && isPlaying !== false;

      if (shouldAnimate && worldState.activeRoutes && worldState.activeRoutes.length > 0) {
        worldState.activeRoutes.forEach((route: RouteGeometry) => {
          const coords = route.coordinates;
          if (!coords || coords.length < 2) return;

          const routeId = route.id;
          const resourceId = route.resourceId;
          if (!resourceId) return;

          // 1. Handle on-scene stabilization pause
          if (onSceneTimersRef.current[resourceId] !== undefined) {
            const currentTimer = onSceneTimersRef.current[resourceId] ?? 0;
            const updatedTimer = currentTimer - deltaSeconds;
            onSceneTimersRef.current[resourceId] = updatedTimer;

            if (updatedTimer <= 0) {
              delete onSceneTimersRef.current[resourceId];
              setTriageAlert(null);
              // Reset progress to loop route smoothly in ongoing demonstration
              progressRef.current[routeId] = 0;
            }
            return;
          }

          // 2. Initialize or increment progress
          if (progressRef.current[routeId] === undefined) {
            progressRef.current[routeId] = 0;
          }

          const effectiveSpeed = Math.max(0.1, playbackSpeed ?? 1.0);
          // Standard full route travel duration (~16 seconds at 1.0x speed)
          const baseProgressionRate = 0.0625 * effectiveSpeed;
          const currentProg = progressRef.current[routeId] ?? 0;
          const nextProg = Math.min(1.0, currentProg + deltaSeconds * baseProgressionRate);
          progressRef.current[routeId] = nextProg;

          // 3. Distance-based arc-length road interpolation
          const sliced = slicePolylineAtProgress(coords, nextProg);
          const currentPosition = sliced.position;
          const targetBearing = sliced.bearing;

          // 4. Smooth steering heading interpolation
          const prevBearing = bearingRef.current[resourceId] ?? targetBearing;
          const smoothedBearing = lerpAngle(
            prevBearing,
            targetBearing,
            Math.min(1, deltaSeconds * 12)
          );
          bearingRef.current[resourceId] = smoothedBearing;

          // 5. Update Mapbox vehicle marker position & directional rotation
          const marker = markersRef.current.get(resourceId);
          if (marker) {
            marker.setLngLat(currentPosition);
            const markerElement = marker.getElement();
            const iconWrapper = markerElement.querySelector('.vehicle-icon') as HTMLElement | null;
            if (iconWrapper) {
              iconWrapper.style.transform = `rotate(${smoothedBearing}deg)`;
            }
          }

          // 6. Scene arrival trigger (4-second stabilization window)
          if (nextProg >= 1.0) {
            if (onSceneTimersRef.current[resourceId] === undefined) {
              onSceneTimersRef.current[resourceId] = 4.0;
              const isHospitalLeg = route.legType === 'HOSPITAL_LEG';
              setTriageAlert(
                isHospitalLeg
                  ? `[HOSPITAL ARRIVAL] Unit ${resourceId} delivered patient to Emergency Trauma ICU.`
                  : `[ON SCENE] Unit ${resourceId} on-scene. Stabilizing patient & preparing evacuation...`
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
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-full border border-amber-500/50 bg-slate-900/95 text-amber-300 text-xs font-mono font-bold shadow-[0_0_25px_rgba(245,158,11,0.4)] backdrop-blur-md flex items-center gap-2.5 animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span>{triageAlert}</span>
        </div>
      )}
    </div>
  );
};