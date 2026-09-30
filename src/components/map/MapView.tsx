/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * Full-Viewport Mapbox GL JS Geospatial Canvas
 * Strict Lifecycle & Ref Management: Zero memory leaks, pure raw mapbox-gl.
 */

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { WorldState, Incident, Resource, Hospital } from '../../types/emergency';
import {
  createIncidentMarkerElement,
  createResourceMarkerElement,
  createHospitalMarkerElement,
} from './MapMarkers';
import { syncRouteLayers, clearAllRouteLayers } from './RouteLayers';

export interface MapViewProps {
  worldState: WorldState;
  selectedIncidentId?: string | null;
  selectedResourceId?: string | null;
  onSelectIncident?: (incident: Incident) => void;
  onSelectResource?: (resource: Resource) => void;
  onSelectHospital?: (hospital: Hospital) => void;
}

const BENGALURU_CENTER: [number, number] = [77.5946, 12.9716];

export const MapView: React.FC<MapViewProps> = ({
  worldState,
  selectedIncidentId,
  selectedResourceId,
  onSelectIncident,
  onSelectResource,
  onSelectHospital,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Token management: Ingest from env or allow runtime fallback configuration
  const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const [activeToken, setActiveToken] = useState<string>(() => envToken || '');
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  const [isTokenMissing, setIsTokenMissing] = useState<boolean>(() => !envToken);

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
      style: 'mapbox://styles/mapbox/dark-v11',
      center: BENGALURU_CENTER,
      zoom: 12.6,
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
      // Synchronize initial routes on map load
      syncRouteLayers(map, worldState.activeRoutes);
    });

    return () => {
      clearAllRouteLayers(map);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [activeToken]);

  /**
   * 2. Synchronize DOM Markers on World State Update
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Purge existing markers deterministically to prevent memory leaks and ghost markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

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
    });

    markersRef.current = newMarkers;

    // Synchronize route polylines
    if (map.isStyleLoaded()) {
      syncRouteLayers(map, worldState.activeRoutes);
    }
  }, [worldState, onSelectIncident, onSelectResource, onSelectHospital]);

  /**
   * 3. Handle Smooth Camera Pan (flyTo) when selection changes
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedIncidentId) {
      const target = worldState.activeIncidents.find((i) => i.id === selectedIncidentId);
      if (target) {
        map.flyTo({
          center: [target.location.lng, target.location.lat],
          zoom: 14.8,
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
          zoom: 14.8,
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
