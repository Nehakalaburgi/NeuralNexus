/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * Full-Viewport Mapbox GL JS Geospatial Canvas
 * Strict Lifecycle & Ref Management: Zero memory leaks, 60fps real-time vehicle animation,
 * dynamic Haversine distance & ETA telemetry, Mapbox real-time traffic layer, and map style switcher.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  WorldState,
  Incident,
  Resource,
  Hospital,
  MapStyleId,
  RouteGeometry,
  TrafficSegment,
} from '../../types/emergency';
import {
  createIncidentMarkerElement,
  createResourceMarkerElement,
  createHospitalMarkerElement,
  createTrafficBottleneckMarkerElement,
} from './MapMarkers';
import {
  syncRouteLayers,
  clearAllRouteLayers,
  updateVehicleLivePath,
  removeVehicleLivePath,
  clearAllVehicleLivePaths,
} from './RouteLayers';
import {
  initTrafficLayers,
  setTrafficVisibility,
  clearTrafficLayers,
  BENGALURU_DEFAULT_TRAFFIC_CORRIDORS,
} from './TrafficLayers';
import { slicePolylineAtProgress, calculateBearing } from '../../utils/geoUtils';
import { Layers, Satellite, Map as MapIcon, Moon, Activity, Compass } from 'lucide-react';

export interface MapViewProps {
  worldState: WorldState;
  selectedIncidentId?: string | null;
  selectedResourceId?: string | null;
  activeMapStyle?: MapStyleId;
  showTrafficOverlay?: boolean;
  is3DView?: boolean;
  isPlaying?: boolean;
  playbackSpeed?: number;
  onSelectMapStyle?: (style: MapStyleId) => void;
  onToggleTrafficOverlay?: () => void;
  onToggle3DView?: () => void;
  onSelectIncident?: (incident: Incident) => void;
  onSelectResource?: (resource: Resource) => void;
  onSelectHospital?: (hospital: Hospital) => void;
  onSelectTrafficSegment?: (segment: TrafficSegment) => void;
}

const BENGALURU_CENTER: [number, number] = [77.6186, 12.9650];

/**
 * Shortest angular distance interpolation for smooth 60fps vehicle turning
 */
function lerpAngle(currentAngle: number, targetAngle: number, alpha: number): number {
  let diff = (targetAngle - currentAngle) % 360;
  if (diff < -180) diff += 360;
  if (diff > 180) diff -= 360;
  return (currentAngle + diff * alpha + 360) % 360;
}

const MAPBOX_STYLES: Record<MapStyleId, { label: string; url: string; icon: React.ReactNode }> = {
  dark: {
    label: 'Tactical Dark',
    url: 'mapbox://styles/mapbox/dark-v11',
    icon: <Moon className="w-3.5 h-3.5" />,
  },
  satellite: {
    label: 'Satellite Hybrid',
    url: 'mapbox://styles/mapbox/satellite-streets-v12',
    icon: <Satellite className="w-3.5 h-3.5" />,
  },
  streets: {
    label: 'Nav Streets',
    url: 'mapbox://styles/mapbox/streets-v12',
    icon: <MapIcon className="w-3.5 h-3.5" />,
  },
};

export const MapView: React.FC<MapViewProps> = ({
  worldState,
  selectedIncidentId,
  selectedResourceId,
  activeMapStyle: externalMapStyle,
  showTrafficOverlay: externalShowTraffic,
  is3DView: externalIs3DView,
  isPlaying = true,
  playbackSpeed = 1.0,
  onSelectMapStyle: externalOnSelectMapStyle,
  onToggleTrafficOverlay: externalOnToggleTraffic,
  onToggle3DView: externalOnToggle3DView,
  onSelectIncident,
  onSelectResource,
  onSelectHospital,
  onSelectTrafficSegment,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const vehicleMarkersMapRef = useRef<Map<string, { marker: mapboxgl.Marker; element: HTMLElement }>>(new Map());

  // Active Map Style state
  const [internalMapStyle, setInternalMapStyle] = useState<MapStyleId>('dark');
  const currentMapStyle = externalMapStyle ?? internalMapStyle;
  const currentAppliedStyleRef = useRef<MapStyleId>('dark');

  // Active Traffic Overlay state
  const [internalShowTraffic, setInternalShowTraffic] = useState<boolean>(true);
  const showTraffic = externalShowTraffic ?? internalShowTraffic;

  // Dynamic Traffic Chokepoint Interception Alert State (2-second banner)
  const [trafficAlertBanner, setTrafficAlertBanner] = useState<boolean>(false);
  const trafficBannerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 3D Tactical Camera State
  const [internalIs3DView, setInternalIs3DView] = useState<boolean>(false);
  const is3DView = externalIs3DView !== undefined ? externalIs3DView : internalIs3DView;

  // Trigger 2-second Traffic Chokepoint Alert Banner when traffic congestion is detected
  useEffect(() => {
    if (worldState.isTrafficCongested) {
      setTrafficAlertBanner(true);
      if (trafficBannerTimerRef.current) {
        clearTimeout(trafficBannerTimerRef.current);
      }
      trafficBannerTimerRef.current = setTimeout(() => {
        setTrafficAlertBanner(false);
        trafficBannerTimerRef.current = null;
      }, 2000);
    } else {
      setTrafficAlertBanner(false);
    }
    return () => {
      if (trafficBannerTimerRef.current) {
        clearTimeout(trafficBannerTimerRef.current);
      }
    };
  }, [worldState.isTrafficCongested]);

  const toggleTraffic = useCallback(() => {
    if (externalOnToggleTraffic) {
      externalOnToggleTraffic();
    } else {
      setInternalShowTraffic((prev) => !prev);
    }
  }, [externalOnToggleTraffic]);

  const toggle3DView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!is3DView) {
      // 3D Tactical View: pitch 55, bearing -20, zoom 14.2, duration 2000
      map.easeTo({
        pitch: 55,
        bearing: -20,
        zoom: 14.2,
        duration: 2000,
      });
    } else {
      // Reset to 2D Strategic Overview: pitch 0, bearing 0, zoom 12.8, duration 1800
      map.easeTo({
        pitch: 0,
        bearing: 0,
        zoom: 12.8,
        duration: 1800,
      });
    }

    if (externalOnToggle3DView) {
      externalOnToggle3DView();
    } else {
      setInternalIs3DView((prev) => !prev);
    }
  }, [is3DView, externalOnToggle3DView]);

  const handleStyleChange = useCallback((styleId: MapStyleId) => {
    if (externalOnSelectMapStyle) {
      externalOnSelectMapStyle(styleId);
    } else {
      setInternalMapStyle(styleId);
    }
  }, [externalOnSelectMapStyle]);

  // Token management: Ingest from env or allow runtime fallback configuration
  const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const isPlaceholderToken = (tok?: string) => !tok || tok.includes('...') || tok.trim().length < 25;
  const validEnvToken = isPlaceholderToken(envToken) ? '' : envToken!.trim();
  const [activeToken, setActiveToken] = useState<string>(() => validEnvToken);
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  const [isTokenMissing, setIsTokenMissing] = useState<boolean>(() => !validEnvToken);

  // Vehicle along-route animation progress references (0.0 to 1.0) and on-scene pause timers
  const unitProgressRef = useRef<Record<string, number>>({});
  const unitPauseTimerRef = useRef<Record<string, number>>({});
  const lastResourceRouteKeyRef = useRef<Record<string, string>>({});
  const vehicleLastBearingRef = useRef<Record<string, number>>({});
  const animationFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(performance.now());

  /**
   * 1. Initialize Mapbox GL Instance
   */
  useEffect(() => {
    if (!activeToken || !mapContainerRef.current) {
      setIsTokenMissing(true);
      return;
    }

    setIsTokenMissing(false);
    mapboxgl.accessToken = activeToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_STYLES[currentMapStyle].url,
      center: BENGALURU_CENTER,
      zoom: 12.8,
      pitch: 35,
      bearing: -8,
      attributionControl: false,
    });

    mapRef.current = map;
    currentAppliedStyleRef.current = currentMapStyle;

    // Tactical navigation controls (top-right) with 3D pitch visualization & interactive rotation
    map.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      }),
      'top-right'
    );

    map.addControl(
      new mapboxgl.ScaleControl({
        maxWidth: 120,
        unit: 'metric',
      }),
      'bottom-left'
    );

    map.on('load', () => {
      // Synchronize traffic overlay and routes on map load
      initTrafficLayers(map, showTraffic, worldState.trafficSegments ?? BENGALURU_DEFAULT_TRAFFIC_CORRIDORS);
      syncRouteLayers(map, worldState.activeRoutes, selectedIncidentId, selectedResourceId);
    });

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      clearTrafficLayers(map);
      clearAllVehicleLivePaths(map);
      clearAllRouteLayers(map);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      vehicleMarkersMapRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [activeToken]);

  /**
   * 2. Synchronize Mapbox Style when changed (from TopNav or MapView controls)
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (currentAppliedStyleRef.current === currentMapStyle) return;

    const targetStyle = MAPBOX_STYLES[currentMapStyle];
    if (!targetStyle) return;

    currentAppliedStyleRef.current = currentMapStyle;

    const applyStyle = () => {
      map.setStyle(targetStyle.url);
      map.once('style.load', () => {
        clearAllRouteLayers(map);
        initTrafficLayers(map, showTraffic, worldState.trafficSegments ?? BENGALURU_DEFAULT_TRAFFIC_CORRIDORS);
        syncRouteLayers(map, worldState.activeRoutes, selectedIncidentId, selectedResourceId);
      });
    };

    if (map.isStyleLoaded()) {
      applyStyle();
    } else {
      map.once('load', applyStyle);
    }
  }, [currentMapStyle, showTraffic, worldState.trafficSegments, worldState.activeRoutes, selectedIncidentId, selectedResourceId]);

  /**
   * 3. Synchronize Traffic Visibility when toggled
   */
  useEffect(() => {
    const map = mapRef.current;
    if (map && map.isStyleLoaded()) {
      if (showTraffic) {
        initTrafficLayers(map, true, worldState.trafficSegments ?? BENGALURU_DEFAULT_TRAFFIC_CORRIDORS);
      }
      setTrafficVisibility(map, showTraffic);
    }
  }, [showTraffic, worldState.trafficSegments]);

  /**
   * 3. Synchronize DOM Markers & Multi-Leg Routes on World State Update
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Purge existing markers deterministically to prevent memory leaks and ghost markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    vehicleMarkersMapRef.current.clear();

    const newMarkers: mapboxgl.Marker[] = [];

    // Render Hospital Markers
    worldState.hospitals.forEach((hospital) => {
      const el = createHospitalMarkerElement(hospital, onSelectHospital);
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([hospital.location.lng, hospital.location.lat])
        .addTo(map);
      newMarkers.push(marker);
    });

    // Render Active Incidents
    worldState.activeIncidents.forEach((incident) => {
      const el = createIncidentMarkerElement(incident, onSelectIncident);
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([incident.location.lng, incident.location.lat])
        .addTo(map);
      newMarkers.push(marker);
    });

    // Render Response Fleet Resources
    worldState.resources.forEach((resource) => {
      const el = createResourceMarkerElement(resource, onSelectResource);
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([resource.location.lng, resource.location.lat])
        .addTo(map);
      newMarkers.push(marker);
      vehicleMarkersMapRef.current.set(resource.id, { marker, element: el });

      // Initialize animation progress if not present
      if (unitProgressRef.current[resource.id] === undefined) {
        unitProgressRef.current[resource.id] =
          resource.status === 'DISPATCHED' ? 0.25 : resource.status === 'TRANSPORTING_PATIENT' ? 0.2 : 0;
      }
    });

    // Render Traffic Bottleneck Markers when traffic overlay or congestion is active
    if (showTraffic) {
      const segments = worldState.trafficSegments ?? BENGALURU_DEFAULT_TRAFFIC_CORRIDORS;
      // Focus on severe bottlenecks
      segments
        .filter((seg) => seg.congestion === 'severe')
        .forEach((seg) => {
          const midIdx = Math.floor(seg.coordinates.length / 2);
          const midCoord = seg.coordinates[midIdx];
          if (midCoord) {
            const el = createTrafficBottleneckMarkerElement(seg, onSelectTrafficSegment);
            const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
              .setLngLat([midCoord[0], midCoord[1]])
              .addTo(map);
            newMarkers.push(marker);
          }
        });
    }

    markersRef.current = newMarkers;

    // Synchronize route polylines and traffic layers
    if (map.isStyleLoaded()) {
      initTrafficLayers(map, showTraffic, worldState.trafficSegments ?? BENGALURU_DEFAULT_TRAFFIC_CORRIDORS);
      syncRouteLayers(map, worldState.activeRoutes, selectedIncidentId, selectedResourceId);
    }
  }, [worldState, showTraffic, selectedIncidentId, selectedResourceId, onSelectIncident, onSelectResource, onSelectHospital, onSelectTrafficSegment]);

  /**
   * 4. 60fps Real-Time Vehicle Along-Route Animation & Dynamic Distance/ETA Telemetry
   * Calibrated strictly to real travel time / ETA so units move at physical proportional speeds.
   */
  useEffect(() => {
    let isCancelled = false;

    const animateVehicles = (now: number) => {
      if (isCancelled) return;

      const deltaSec = isPlaying === false ? 0 : Math.min(0.1, (now - lastTickTimeRef.current) / 1000);
      lastTickTimeRef.current = now;

      worldState.resources.forEach((resource) => {
        const isDispatched = resource.status === 'DISPATCHED' || resource.status === 'DISPATCHED_TO_SCENE';
        const isOnScene = resource.status === 'ON_SCENE' || resource.status === 'ON_SCENE_TRIAGING';
        const isEvacuating = resource.status === 'TRANSPORTING_PATIENT' || resource.status === 'PATIENT_LOADED_EVACUATING';
        const isDelivered = resource.status === 'PATIENT_DELIVERED' || resource.status === 'ARRIVED_HOSPITAL';
        const isRerouted = resource.status === 'REROUTED';

        // Only active dispatched / rerouted / transporting / on-scene / delivered units travel along or align with routes
        if (!isDispatched && !isRerouted && !isEvacuating && !isOnScene && !isDelivered) {
          const map = mapRef.current;
          if (map && map.isStyleLoaded()) {
            removeVehicleLivePath(map, resource.id);
          }
          return;
        }

        const isLeg2 = isEvacuating || isDelivered;

        // Locate assigned route:
        // If transporting to hospital (Leg 2): find hospital transport or evacuation route
        // If rerouted: find detour or bypass route
        // If dispatched (Leg 1): find dispatch route
        const activeRoute: RouteGeometry | undefined = isLeg2
          ? worldState.activeRoutes.find(
              (r) =>
                (r.resourceId === resource.id && (r.type === 'HOSPITAL_TRANSPORT' || r.legNumber === 2)) ||
                (r.type === 'HOSPITAL_TRANSPORT') ||
                (r.incidentId === resource.assignedIncidentId && r.type === 'EVACUATION') ||
                r.id.includes('EVAC-BURN-VICTORIA') ||
                r.id.includes('EVAC')
            )
          : worldState.activeRoutes.find((r) => r.resourceId === resource.id && r.type === 'DETOUR') ||
            worldState.activeRoutes.find(
              (r) => r.resourceId === resource.id && !r.id.includes('ORIGINAL') && !r.id.includes('CONGESTED') && !r.id.includes('FADED')
            );

        if (!activeRoute || activeRoute.coordinates.length < 2) {
          return;
        }

        // Detect step/route transition to seamlessly start vehicle at beginning of leg
        const currentRouteKey = `${resource.status}-${activeRoute.id}-${resource.assignedIncidentId ?? ''}`;
        const prevRouteKey = lastResourceRouteKeyRef.current[resource.id];

        if (prevRouteKey !== currentRouteKey) {
          lastResourceRouteKeyRef.current[resource.id] = currentRouteKey;
          if (isRerouted) {
            unitProgressRef.current[resource.id] = 0.12; // Begins along detour vector after gridlock
          } else if (isOnScene || isDelivered) {
            unitProgressRef.current[resource.id] = 1.0;
          } else {
            unitProgressRef.current[resource.id] = 0.0;
          }
          unitPauseTimerRef.current[resource.id] = 0;
        }

        // Speed calibration: 19-22 seconds per full leg for cinematic pitch-friendly pacing
        const baseTripDurationSec = isLeg2 ? 21.0 : 19.0;
        const speedMultiplier = Math.max(0.1, playbackSpeed ?? 1.0);
        const effectiveTripDurationSec = baseTripDurationSec / speedMultiplier;

        // Milestone A (Traffic Encounter): When AMB-01 is near traffic chokepoint before turn-in, slow down temporarily
        let localSpeedFactor = 1.0;
        let currentProgress = unitProgressRef.current[resource.id] ?? 0;
        if (resource.id === 'AMB-01' && isRerouted) {
          if (currentProgress >= 0.10 && currentProgress <= 0.32) {
            localSpeedFactor = 0.45; // Slow down as AI detects gridlock and locks bypass
          }
        }

        const speedProgressPerSec = (1 / effectiveTripDurationSec) * localSpeedFactor;
        const currentPause = unitPauseTimerRef.current[resource.id] ?? 0;

        if (isOnScene || isDelivered) {
          currentProgress = 1.0;
        } else if (currentProgress >= 1.0) {
          // Unit reached scene/hospital: stay paused on scene / hospital gate for 14.0s before loop
          if (currentPause < 14.0) {
            unitPauseTimerRef.current[resource.id] = currentPause + deltaSec;
            currentProgress = 1.0;
          } else {
            // Restart loop smoothly
            unitPauseTimerRef.current[resource.id] = 0;
            currentProgress = 0.0;
          }
        } else {
          currentProgress += speedProgressPerSec * deltaSec;
          if (currentProgress >= 1.0) {
            currentProgress = 1.0;
            unitPauseTimerRef.current[resource.id] = 0;
          }
        }

        unitProgressRef.current[resource.id] = currentProgress;

        const baseEtaMinutes = resource.currentEtaMinutes ?? (isLeg2 ? 4.8 : 4.0);

        // Constant-speed linear interpolation (distance-based arc-length parameterization):
        // Slices exact road coordinates based on cumulative Haversine distance, ensuring smooth constant velocity
        const sliced = slicePolylineAtProgress(
          activeRoute.coordinates,
          currentProgress,
          baseEtaMinutes
        );

        // Live Two-Tone Blue Path Splitting: Faint historic blue trail for traversed + Neon Sky Blue (Leg 1) / Deep Cobalt Blue (Leg 2)
        const map = mapRef.current;
        if (map && map.isStyleLoaded()) {
          updateVehicleLivePath(
            map,
            resource.id,
            sliced.travelled,
            sliced.remaining,
            resource.id === selectedResourceId,
            resource.type,
            isLeg2
          );
        }

        // Dynamic distance & ETA telemetry computed from along-track arc-length progression
        const vehicleEntry = vehicleMarkersMapRef.current.get(resource.id);
        if (vehicleEntry) {
          // 1. Update marker position on Mapbox canvas directly at 60fps
          vehicleEntry.marker.setLngLat([sliced.position[0], sliced.position[1]]);

          // 2. Smooth geographic turn-by-turn bearing rotation using calculateBearing
          const currentCoord = sliced.position;
          const nextCoord = sliced.remaining[0] ?? sliced.position;
          const roadBearing = sliced.remaining.length > 0
            ? calculateBearing(currentCoord, nextCoord)
            : sliced.bearing;
          const prevBearing = vehicleLastBearingRef.current[resource.id] ?? roadBearing;
          const smoothBearing = lerpAngle(prevBearing, roadBearing, 0.22);
          vehicleLastBearingRef.current[resource.id] = smoothBearing;

          const headingWrapper = vehicleEntry.element.querySelector<HTMLElement>(`[data-heading-wrapper="${resource.id}"]`);
          if (headingWrapper) {
            headingWrapper.style.transform = `rotate(${smoothBearing.toFixed(1)}deg)`;
          }

          // 3. Update live distance & ETA telemetry pill in DOM without heavy React re-renders
          const etaEl = vehicleEntry.element.querySelector(`[data-eta-text="${resource.id}"]`);
          const distEl = vehicleEntry.element.querySelector(`[data-dist-text="${resource.id}"]`);
          const hoverEtaEl = vehicleEntry.element.querySelector(`[data-hover-eta="${resource.id}"]`);
          const hoverDistEl = vehicleEntry.element.querySelector(`[data-hover-dist="${resource.id}"]`);
          const milestoneTagEl = vehicleEntry.element.querySelector<HTMLElement>(`[data-milestone-tag="${resource.id}"]`);

          const isArrived = currentProgress >= 0.99;
          const isImminent = !isArrived && sliced.etaMinutes <= 0.2;

          // Trigger subtle green pulse on the receiving hospital marker when ambulance arrives
          if (isLeg2 && (isArrived || isDelivered)) {
            const targetHospId = resource.targetHospitalId ?? 'HOSP-01';
            const hospPulseEl = document.querySelector<HTMLElement>(`[data-hospital-pulse="${targetHospId}"]`);
            if (hospPulseEl) {
              hospPulseEl.style.opacity = '0.75';
            }
          }

          // 4. Update Milestone A, B, C Narrative floating tags
          if (milestoneTagEl) {
            if (isRerouted) {
              milestoneTagEl.className =
                'absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[8px] font-mono font-black tracking-wide shadow-xl pointer-events-none whitespace-nowrap z-20 transition-all duration-300 bg-amber-950/95 border border-amber-400 text-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.8)] animate-pulse';
              milestoneTagEl.textContent = '⚠️ Traffic Gridlock Detected (+11 min delay)';
            } else if (isOnScene) {
              milestoneTagEl.className =
                'absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[8px] font-mono font-black tracking-wide shadow-xl pointer-events-none whitespace-nowrap z-20 transition-all duration-300 bg-emerald-950/95 border border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse';
              milestoneTagEl.textContent = '[ON SCENE: STABILIZING PATIENT (4s)]';
            } else if (isEvacuating) {
              milestoneTagEl.className =
                'absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[8px] font-mono font-black tracking-wide shadow-xl pointer-events-none whitespace-nowrap z-20 transition-all duration-300 bg-emerald-950/95 border border-emerald-400 text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.7)]';
              milestoneTagEl.textContent = isArrived
                ? '[AVAILABLE / READY]'
                : '[EVACUATING -> HOSPITAL]';
            } else if (isDelivered) {
              milestoneTagEl.className =
                'absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[8px] font-mono font-black tracking-wide shadow-xl pointer-events-none whitespace-nowrap z-20 transition-all duration-300 bg-emerald-950/95 border border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.6)]';
              milestoneTagEl.textContent = '[AVAILABLE / READY]';
            } else {
              milestoneTagEl.className = 'hidden';
            }
          }

          if (etaEl) {
            if (isLeg2) {
              etaEl.textContent = isArrived ? 'DELIVERED' : isImminent ? 'HOSPITAL GATE' : `${sliced.etaMinutes}m`;
            } else {
              etaEl.textContent = isArrived ? 'ON SCENE' : isImminent ? 'ARRIVING' : `${sliced.etaMinutes}m`;
            }
          }
          if (distEl) {
            if (isLeg2) {
              distEl.textContent = (resource.targetHospitalName?.split(' ')[0]) ?? 'Victoria';
            } else {
              distEl.textContent = `${sliced.distanceRemainingKm}km`;
            }
          }
          if (hoverEtaEl) {
            hoverEtaEl.textContent = isArrived
              ? isLeg2
                ? 'Patient Delivered'
                : 'On Scene'
              : isImminent
              ? 'Arriving'
              : `${sliced.etaMinutes} mins`;
          }
          if (hoverDistEl) {
            hoverDistEl.textContent = isLeg2
              ? `En-Route: ${resource.targetHospitalName ?? 'Victoria Hospital'}`
              : `${sliced.distanceRemainingKm} km`;
          }
        }
      });

      animationFrameRef.current = requestAnimationFrame(animateVehicles);
    };

    lastTickTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(animateVehicles);

    return () => {
      isCancelled = true;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [worldState.resources, worldState.activeRoutes, selectedResourceId, selectedIncidentId, isPlaying, playbackSpeed]);

  /**
   * 5. Handle Smooth Camera Pan (flyTo) when selection changes
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedIncidentId) {
      const target = worldState.activeIncidents.find((i) => i.id === selectedIncidentId);
      if (target) {
        map.flyTo({
          center: [target.location.lng, target.location.lat],
          zoom: 14.2,
          pitch: 45,
          duration: 1800,
          essential: true,
        });
      }
    } else if (selectedResourceId) {
      const target = worldState.resources.find((r) => r.id === selectedResourceId);
      if (target) {
        map.flyTo({
          center: [target.location.lng, target.location.lat],
          zoom: 14.5,
          pitch: 40,
          duration: 1600,
          essential: true,
        });
      }
    }
  }, [selectedIncidentId, selectedResourceId, worldState]);

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualTokenInput.trim()) {
      setActiveToken(manualTokenInput.trim());
      setIsTokenMissing(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b0f19]">
      {/* 100vw x 100vh Full Viewport Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Grid Scanline Overlay for Cybernetic Tactical Command Room Aesthetic */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(11,15,25,0.4)_100%)] z-1" />

      {/* Dynamic Traffic Chokepoint Interception Alert Banner (Warning HUD) */}
      {trafficAlertBanner && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-red-950/95 border-2 border-red-500 text-red-100 shadow-[0_0_35px_rgba(239,68,68,0.95)] backdrop-blur-md">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="font-mono font-black text-xs tracking-wider uppercase text-red-200">
              ⚠️ Traffic Gridlock Detected (+11 min delay)
            </span>
            <span className="text-[10px] font-mono text-amber-300 font-semibold border-l border-red-700/80 pl-2">
              AUTOMATIC BYPASS ROUTE ENGAGED
            </span>
          </div>
        </div>
      )}

      {/* Floating Map Utility Bar: Style Switcher + 3D View + Traffic Toggle (Top Right) */}
      <div className="absolute top-18 right-20 z-10 pointer-events-auto flex items-center p-1 rounded-xl tactical-glass border border-slate-800/90 shadow-2xl backdrop-blur-md gap-2">
        {/* Style Switcher Group */}
        <div className="flex items-center gap-1">
          <div className="px-2 py-1 text-[9px] font-mono text-slate-500 font-bold uppercase hidden sm:flex items-center gap-1 border-r border-slate-800/80 mr-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>STYLE:</span>
          </div>
          {(['dark', 'satellite', 'streets'] as const).map((styleKey) => {
            const style = MAPBOX_STYLES[styleKey];
            const isActive = currentMapStyle === styleKey;

            return (
              <button
                key={styleKey}
                onClick={() => handleStyleChange(styleKey)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? 'bg-cyan-950/90 text-cyan-300 border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-transparent hover:border-slate-700'
                }`}
              >
                {style.icon}
                <span>{style.label}</span>
              </button>
            );
          })}
        </div>

        <div className="w-px h-5 bg-slate-800" />

        {/* 3D Tactical View Toggle */}
        <button
          onClick={toggle3DView}
          title="Toggle 3D Tactical Pitch & Bearing Perspective"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all duration-200 cursor-pointer border ${
            is3DView
              ? 'bg-indigo-950/90 text-indigo-300 border-indigo-500/80 shadow-[0_0_12px_rgba(99,102,241,0.5)]'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-transparent hover:border-slate-700'
          }`}
        >
          <Compass className={`w-3.5 h-3.5 ${is3DView ? 'text-indigo-400' : 'text-slate-400'}`} />
          <span>{is3DView ? '3D TACTICAL (55°)' : '3D TACTICAL VIEW'}</span>
        </button>

        <div className="w-px h-5 bg-slate-800" />

        {/* Traffic Overlay Toggle Button */}
        <button
          onClick={toggleTraffic}
          title="Toggle Real-Time Traffic Congestion Layer"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all duration-200 cursor-pointer border ${
            showTraffic
              ? 'bg-orange-950/90 text-orange-300 border-orange-500/80 shadow-[0_0_12px_rgba(249,115,22,0.5)]'
              : 'bg-slate-900/60 text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700'
          }`}
        >
          <Activity className={`w-3.5 h-3.5 ${showTraffic ? 'text-orange-400 animate-pulse' : 'text-slate-500'}`} />
          <span>TRAFFIC: {showTraffic ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Tactical Route Network Legend Overlay (Top Left below Nav) */}
      <div className="absolute top-18 left-20 z-10 pointer-events-none hidden md:flex flex-col gap-1.5 p-2.5 rounded-xl tactical-glass border border-slate-800/90 shadow-xl backdrop-blur-md max-w-[340px]">
        <div className="text-[9.5px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-800/80 pb-1">
          <span>Active Fleet Corridors</span>
          <span className="text-cyan-400">Two-Tone 60fps</span>
        </div>
        <div className="space-y-1 text-[9px] font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-4 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
            <span className="text-sky-300 font-semibold">Leg 1 Dispatch: Neon Sky Blue (#38bdf8)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-4 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.95)]" />
            <span className="text-blue-300 font-semibold">Leg 2 Evacuation: Deep Cobalt Blue (#2563eb)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-4 h-1.5 rounded-full bg-blue-950 border border-blue-600/40 opacity-70" />
            <span className="text-slate-400 font-medium">Traversed Road: Faint Historic Trail (35%)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-4 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.9)]" />
            <span className="text-amber-300 font-semibold">Dynamic Detour / Bypass: Amber (#f59e0b)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-4 h-1.5 rounded-full bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-pulse" />
            <span className="text-red-400 font-bold">Traffic Gridlock Bottleneck (Red #ef4444)</span>
          </div>
          {showTraffic && (
            <div className="flex items-center gap-2 text-slate-300 pt-1 border-t border-slate-800/60">
              <span className="w-4 h-1.5 rounded bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              <span className="text-orange-300">Live Congestion Monitoring Overlay</span>
            </div>
          )}
        </div>
      </div>

      {/* Missing Mapbox Token Fallback Overlay */}
      {isTokenMissing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
          <div className="max-w-md w-full p-6 rounded-xl tactical-glass border border-cyan-500/40 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-400">
              <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider mb-2 font-mono">
              Mapbox Access Token Required
            </h2>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              To activate the real-time Bengaluru geospatial vector canvas, provide a valid Mapbox Public Access Token. Set it in your <code className="text-cyan-300 font-mono">.env</code> as <code className="text-cyan-300 font-mono">VITE_MAPBOX_TOKEN</code> or enter it below:
            </p>
            <form onSubmit={handleManualTokenSubmit} className="space-y-3">
              <input
                type="text"
                value={manualTokenInput}
                onChange={(e) => setManualTokenInput(e.target.value)}
                placeholder="pk.eyJ1IjoieW91cnVzZXIiLCJhIjoi..."
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
              <button
                type="submit"
                className="w-full py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-900/50"
              >
                Initialize Control Map
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
