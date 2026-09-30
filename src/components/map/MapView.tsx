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
import { slicePolylineAtProgress } from '../../utils/geoUtils';
import { Layers, Satellite, Map as MapIcon, Moon, Activity } from 'lucide-react';

export interface MapViewProps {
  worldState: WorldState;
  selectedIncidentId?: string | null;
  selectedResourceId?: string | null;
  activeMapStyle?: MapStyleId;
  showTrafficOverlay?: boolean;
  onSelectMapStyle?: (style: MapStyleId) => void;
  onToggleTrafficOverlay?: () => void;
  onSelectIncident?: (incident: Incident) => void;
  onSelectResource?: (resource: Resource) => void;
  onSelectHospital?: (hospital: Hospital) => void;
  onSelectTrafficSegment?: (segment: TrafficSegment) => void;
}

const BENGALURU_CENTER: [number, number] = [77.6186, 12.9650];

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
    url: 'mapbox://styles/mapbox/navigation-night-v1',
    icon: <MapIcon className="w-3.5 h-3.5" />,
  },
};

export const MapView: React.FC<MapViewProps> = ({
  worldState,
  selectedIncidentId,
  selectedResourceId,
  activeMapStyle: externalMapStyle,
  showTrafficOverlay: externalShowTraffic,
  onSelectMapStyle: externalOnSelectMapStyle,
  onToggleTrafficOverlay: externalOnToggleTraffic,
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

  // Active Traffic Overlay state
  const [internalShowTraffic, setInternalShowTraffic] = useState<boolean>(true);
  const showTraffic = externalShowTraffic ?? internalShowTraffic;

  const toggleTraffic = useCallback(() => {
    if (externalOnToggleTraffic) {
      externalOnToggleTraffic();
    } else {
      setInternalShowTraffic((prev) => !prev);
    }
  }, [externalOnToggleTraffic]);

  const handleStyleChange = useCallback((styleId: MapStyleId) => {
    if (externalOnSelectMapStyle) {
      externalOnSelectMapStyle(styleId);
    } else {
      setInternalMapStyle(styleId);
    }

    const map = mapRef.current;
    if (map) {
      map.setStyle(MAPBOX_STYLES[styleId].url);
      map.once('style.load', () => {
        clearAllVehicleLivePaths(map);
        initTrafficLayers(map, showTraffic, worldState.trafficSegments ?? BENGALURU_DEFAULT_TRAFFIC_CORRIDORS);
        syncRouteLayers(map, worldState.activeRoutes, selectedIncidentId, selectedResourceId);
      });
    }
  }, [externalOnSelectMapStyle, showTraffic, worldState.trafficSegments, worldState.activeRoutes, selectedIncidentId, selectedResourceId]);

  // Token management: Ingest from env or allow runtime fallback configuration
  const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const [activeToken, setActiveToken] = useState<string>(() => envToken || '');
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  const [isTokenMissing, setIsTokenMissing] = useState<boolean>(() => !envToken);

  // Vehicle along-route animation progress references (0.0 to 1.0) and on-scene pause timers
  const unitProgressRef = useRef<Record<string, number>>({});
  const unitPauseTimerRef = useRef<Record<string, number>>({});
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

    // Tactical navigation controls (bottom-right)
    map.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      }),
      'bottom-right'
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
      clearAllRouteLayers(map);
      clearAllVehicleLivePaths(map);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      vehicleMarkersMapRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [activeToken]);

  /**
   * 2. Synchronize Traffic Visibility when toggled
   */
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      setTrafficVisibility(map, showTraffic);
    }
  }, [showTraffic]);

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
        unitProgressRef.current[resource.id] = resource.status === 'DISPATCHED' ? 0.25 : 0;
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

      // Clean up live paths of inactive fleet units
      const activeUnitIds = new Set(
        worldState.resources
          .filter((r) => r.status === 'DISPATCHED' || r.status === 'REROUTED')
          .map((r) => r.id)
      );
      worldState.resources.forEach((r) => {
        if (!activeUnitIds.has(r.id)) {
          removeVehicleLivePath(map, r.id);
        }
      });
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

      const deltaSec = Math.min(0.1, (now - lastTickTimeRef.current) / 1000);
      lastTickTimeRef.current = now;

      worldState.resources.forEach((resource) => {
        // Only active dispatched / rerouted units travel along routes
        if (resource.status !== 'DISPATCHED' && resource.status !== 'REROUTED') {
          return;
        }

        // Locate assigned route: prioritize detour route if rerouted, otherwise dispatch route
        const activeRoute: RouteGeometry | undefined =
          worldState.activeRoutes.find((r) => r.resourceId === resource.id && r.type === 'DETOUR') ||
          worldState.activeRoutes.find(
            (r) => r.resourceId === resource.id && !r.id.includes('ORIGINAL') && !r.id.includes('CONGESTED')
          );

        if (!activeRoute || activeRoute.coordinates.length < 2) {
          return;
        }

        // Speed calibration: 1 emergency response minute = 6.0 seconds in simulation.
        // Units with smaller ETAs move proportionally faster and arrive sooner than distant units!
        const baseEtaMinutes = resource.currentEtaMinutes ?? 4.0;
        const totalTripDurationSec = Math.max(10, baseEtaMinutes * 6.0);
        const speedProgressPerSec = 1 / totalTripDurationSec;

        let currentProgress = unitProgressRef.current[resource.id] ?? 0;
        const currentPause = unitPauseTimerRef.current[resource.id] ?? 0;

        if (currentProgress >= 1.0) {
          // Unit reached scene: pause on scene for 3.0 seconds to simulate scene arrival / triage
          if (currentPause < 3.0) {
            unitPauseTimerRef.current[resource.id] = currentPause + deltaSec;
            currentProgress = 1.0;
          } else {
            // Restart loop smoothly from staging base
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

        // Slice road polyline into:
        // 1. sliced.travelled: Path segment already travelled by vehicle (Solid Sapphire Blue Line)
        // 2. sliced.remaining: Path segment which will be travelled by vehicle (Glowing Electric Blue Line)
        const sliced = slicePolylineAtProgress(
          activeRoute.coordinates,
          currentProgress,
          baseEtaMinutes
        );

        // Update real-time blue lines on map canvas at 60fps
        const map = mapRef.current;
        if (map && map.isStyleLoaded()) {
          const isSelected = selectedResourceId === resource.id || selectedIncidentId === resource.assignedIncidentId;
          updateVehicleLivePath(
            map,
            resource.id,
            sliced.travelled,
            sliced.remaining,
            Boolean(isSelected),
            resource.type
          );
        }

        const vehicleEntry = vehicleMarkersMapRef.current.get(resource.id);
        if (vehicleEntry) {
          // 1. Update marker position on Mapbox canvas directly at 60fps
          vehicleEntry.marker.setLngLat([sliced.position[0], sliced.position[1]]);

          // 2. Rotate vehicle body and forward compass pointer to face exact road direction
          const headingWrapper = vehicleEntry.element.querySelector<HTMLElement>(`[data-heading-wrapper="${resource.id}"]`);
          if (headingWrapper) {
            headingWrapper.style.transform = `rotate(${sliced.bearing}deg)`;
          }

          // 3. Update live distance & ETA pill in DOM without heavy React re-renders
          const etaEl = vehicleEntry.element.querySelector(`[data-eta-text="${resource.id}"]`);
          const distEl = vehicleEntry.element.querySelector(`[data-dist-text="${resource.id}"]`);
          const hoverEtaEl = vehicleEntry.element.querySelector(`[data-hover-eta="${resource.id}"]`);
          const hoverDistEl = vehicleEntry.element.querySelector(`[data-hover-dist="${resource.id}"]`);

          const isArrived = currentProgress >= 0.99;
          const isImminent = !isArrived && sliced.etaMinutes <= 0.2;

          if (etaEl) {
            etaEl.textContent = isArrived ? 'ON SCENE' : isImminent ? 'ARRIVING' : `${sliced.etaMinutes}m`;
          }
          if (distEl) {
            distEl.textContent = `${sliced.distanceRemainingKm}km`;
          }
          if (hoverEtaEl) {
            hoverEtaEl.textContent = isArrived ? 'On Scene' : isImminent ? 'Arriving' : `${sliced.etaMinutes} mins`;
          }
          if (hoverDistEl) {
            hoverDistEl.textContent = `${sliced.distanceRemainingKm} km`;
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
  }, [worldState.resources, worldState.activeRoutes, selectedResourceId, selectedIncidentId]);

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

      {/* Floating Map Utility Bar: Style Switcher + Traffic Toggle (Top Right) */}
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
      <div className="absolute top-18 left-20 z-10 pointer-events-none hidden md:flex flex-col gap-1.5 p-2.5 rounded-xl tactical-glass border border-slate-800/90 shadow-xl backdrop-blur-md max-w-[320px]">
        <div className="text-[9.5px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-800/80 pb-1">
          <span>Active Fleet Corridors</span>
          <span className="text-cyan-400">Live 60fps</span>
        </div>
        <div className="space-y-1 text-[9px] font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-4 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.9)]" />
            <span className="text-blue-300 font-semibold">Travelled Vehicle Path (Solid Blue)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-4 h-1 border-t-2 border-dashed border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.9)]" />
            <span className="text-blue-300 font-semibold">Upcoming Vehicle Path (Glowing Blue)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-4 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)]" />
            <span className="text-blue-300 font-medium">Ambulance Response Routes (Blue)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-4 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.95)]" />
            <span className="text-blue-300 font-medium">Fire Engine Response Corridor (Blue)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-4 h-1.5 rounded-full bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-pulse" />
            <span className="text-red-400 font-bold">Traffic Congestion Corridor (Red)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-4 h-1 border-t-2 border-dashed border-cyan-500" />
            <span className="text-cyan-400 font-medium">Hospital Evacuation Corridor</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-4 h-1 border-t-2 border-dashed border-amber-400" />
            <span className="text-amber-300 font-medium">Pending Reallocation Diversion</span>
          </div>
          {showTraffic && (
            <div className="flex items-center gap-2 text-slate-300 pt-1 border-t border-slate-800/60">
              <span className="w-4 h-1.5 rounded bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <span className="text-red-300">Real-Time Traffic Bottleneck Overlay</span>
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
