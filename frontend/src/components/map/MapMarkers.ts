import mapboxgl from 'mapbox-gl';
import { WorldState, Resource, Incident, Hospital } from '../../types/emergency';

function toLngLat(loc: { lat: number; lng: number } | [number, number]): [number, number] {
  if (Array.isArray(loc)) {
    return [loc[0], loc[1]];
  }
  return [loc.lng, loc.lat];
}

export function getIncidentCategory(incident: Incident): 'FIRE' | 'CRASH' | 'CARDIAC' | 'RESCUE' | 'GENERAL' {
  const text = `${incident.title} ${incident.description ?? ''}`.toLowerCase();
  if (text.includes('fire') || text.includes('blaze') || text.includes('smoke') || text.includes('combustion')) {
    return 'FIRE';
  }
  if (text.includes('collision') || text.includes('crash') || text.includes('pileup') || text.includes('entrapment') || text.includes('vehicle')) {
    return 'CRASH';
  }
  if (text.includes('cardiac') || text.includes('heart') || text.includes('chest pain') || text.includes('stroke') || text.includes('medical')) {
    return 'CARDIAC';
  }
  if (Array.isArray(incident.requiredResources) && incident.requiredResources.includes('RESCUE_TEAM')) {
    return 'RESCUE';
  }
  return 'GENERAL';
}

export function syncMarkers(
  map: mapboxgl.Map,
  markersMap: Map<string, mapboxgl.Marker>,
  worldState: WorldState
): void {
  const activeIds = new Set<string>();

  // 1. Incidents
  worldState.activeIncidents.forEach((inc: Incident) => {
    const key = `inc-${inc.id}`;
    activeIds.add(key);

    const coords = toLngLat(inc.location);

    if (!markersMap.has(key)) {
      const el = document.createElement('div');
      el.className = 'cursor-pointer select-none';
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <span class="absolute w-8 h-8 rounded-full bg-red-500/40 animate-ping"></span>
          <div class="w-7 h-7 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-xs shadow-lg">
            🚨
          </div>
          <span class="absolute -bottom-5 px-1.5 py-0.5 rounded bg-slate-900/90 border border-red-500/50 text-[10px] text-white font-mono whitespace-nowrap">
            ${inc.title}
          </span>
        </div>
      `;
      const marker = new mapboxgl.Marker({ element: el }).setLngLat(coords).addTo(map);
      markersMap.set(key, marker);
    }
  });

  // 2. Hospitals
  worldState.hospitals.forEach((hosp: Hospital) => {
    const key = `hosp-${hosp.id}`;
    activeIds.add(key);

    const coords = toLngLat(hosp.location);

    if (!markersMap.has(key)) {
      const el = document.createElement('div');
      el.className = 'cursor-pointer select-none';
      el.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="w-6 h-6 rounded-lg bg-emerald-600 border border-white flex items-center justify-center text-xs shadow-md">
            🏥
          </div>
          <span class="mt-1 px-1.5 py-0.5 rounded bg-slate-900/90 border border-emerald-500/50 text-[10px] text-emerald-300 font-mono whitespace-nowrap">
            ${hosp.name}: ${hosp.availableBeds} beds
          </span>
        </div>
      `;
      const marker = new mapboxgl.Marker({ element: el }).setLngLat(coords).addTo(map);
      markersMap.set(key, marker);
    } else {
      const marker = markersMap.get(key);
      if (marker) {
        marker.setLngLat(coords);
        const bedText = marker.getElement().querySelector('span');
        if (bedText) bedText.innerText = `${hosp.name}: ${hosp.availableBeds} beds`;
      }
    }
  });

  // 3. Vehicles
  worldState.resources.forEach((res: Resource) => {
    const key = res.id;
    activeIds.add(key);

    const coords = toLngLat(res.location);

    if (!markersMap.has(key)) {
      const el = document.createElement('div');
      el.className = 'cursor-pointer select-none';
      const icon = res.type === 'FIRE_TRUCK' ? '🚒' : '🚑';
      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div class="vehicle-icon w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-sm shadow-xl" style="will-change: transform; transform-origin: center center;">
            ${icon}
          </div>
          <span class="vehicle-badge mt-1 px-1.5 py-0.2 rounded bg-slate-900/95 border border-cyan-400/60 text-[9px] text-cyan-300 font-mono whitespace-nowrap">
            ${res.id}
          </span>
        </div>
      `;
      const marker = new mapboxgl.Marker({ element: el }).setLngLat(coords).addTo(map);
      markersMap.set(key, marker);
    } else {
      const marker = markersMap.get(key);
      if (marker) {
        marker.setLngLat(coords);
      }
    }
  });

  // Clean stale markers
  markersMap.forEach((marker, id) => {
    if (!activeIds.has(id)) {
      marker.remove();
      markersMap.delete(id);
    }
  });
}