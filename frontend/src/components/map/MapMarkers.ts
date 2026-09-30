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
  worldState: WorldState,
  onSelectIncident?: (incident: Incident) => void,
  onSelectResource?: (resource: Resource) => void
): void {
  const activeIds = new Set<string>();

  // 1. Incidents
  worldState.activeIncidents.forEach((inc: Incident) => {
    const key = `inc-${inc.id}`;
    activeIds.add(key);

    const coords = toLngLat(inc.location);

    if (!markersMap.has(key)) {
      const el = document.createElement('div');
      el.className = 'cursor-pointer select-none group relative';
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <span class="absolute w-9 h-9 rounded-full bg-red-500/40 animate-ping pointer-events-none"></span>
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-700 border-2 border-white flex items-center justify-center text-sm shadow-[0_0_16px_rgba(239,68,68,0.85)] transition-transform group-hover:scale-125">
            🚨
          </div>
          <span class="absolute -bottom-5 px-2 py-0.5 rounded bg-slate-950/95 border border-red-500/70 text-[10px] text-white font-mono font-bold whitespace-nowrap shadow-lg">
            ${inc.title.split(' ')[0]} ${inc.severity ? `S${inc.severity}` : ''}
          </span>
        </div>
      `;
      if (onSelectIncident) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectIncident(inc);
        });
      }
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
      el.className = 'cursor-pointer select-none group relative';
      el.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 border-2 border-white flex items-center justify-center text-sm shadow-[0_0_14px_rgba(16,185,129,0.7)] transition-transform group-hover:scale-125">
            🏥
          </div>
          <span class="mt-1 px-1.5 py-0.5 rounded bg-slate-950/95 border border-emerald-500/70 text-[9.5px] text-emerald-300 font-mono font-bold whitespace-nowrap shadow-md">
            ${hosp.name.split(' ')[0]}: ${hosp.availableBeds} beds
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
        if (bedText) bedText.innerText = `${hosp.name.split(' ')[0]}: ${hosp.availableBeds} beds`;
      }
    }
  });

  // 3. Vehicles
  const activeMovingResourceIds = new Set(
    (worldState.activeRoutes || []).map((r) => r.resourceId).filter(Boolean)
  );

  worldState.resources.forEach((res: Resource) => {
    const key = res.id;
    activeIds.add(key);

    const coords = toLngLat(res.location);
    const isFire = res.type === 'FIRE_TRUCK';

    if (!markersMap.has(key)) {
      const el = document.createElement('div');
      el.className = 'cursor-pointer select-none group relative';
      el.setAttribute('data-resource-id', res.id);
      const icon = isFire ? '🚒' : '🚑';
      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          <!-- Active Beacon Halo -->
          <div class="absolute -inset-1 rounded-full animate-ping opacity-35 ${isFire ? 'bg-orange-500' : 'bg-cyan-500'} pointer-events-none"></div>

          <!-- Rotating Vehicle Body -->
          <div class="vehicle-icon w-9 h-9 rounded-full bg-slate-950 border-2 ${isFire ? 'border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.85)]' : 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.85)]'} flex items-center justify-center text-sm relative" style="will-change: transform; transform-origin: center center;">
            <!-- Directional Compass Arrow Beam -->
            <div class="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] ${isFire ? 'border-b-orange-400' : 'border-b-cyan-400'} pointer-events-none"></div>
            <span>${icon}</span>
          </div>

          <!-- Callsign Tag -->
          <span class="vehicle-badge mt-1 px-1.5 py-0.2 rounded bg-slate-950/95 border ${isFire ? 'border-orange-500/70 text-orange-300' : 'border-cyan-500/70 text-cyan-300'} text-[9px] font-mono font-bold whitespace-nowrap shadow-lg">
            ${res.id}
          </span>
        </div>
      `;
      if (onSelectResource) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectResource(res);
        });
      }
      const marker = new mapboxgl.Marker({ element: el }).setLngLat(coords).addTo(map);
      markersMap.set(key, marker);
    } else {
      // Only reset position if unit is NOT actively being animated along a road
      if (!activeMovingResourceIds.has(res.id)) {
        const marker = markersMap.get(key);
        if (marker) {
          marker.setLngLat(coords);
        }
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