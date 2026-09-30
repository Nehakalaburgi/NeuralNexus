/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * Pure DOM Marker Elements for Mapbox GL JS
 * High-performance 60fps rendering, custom tactical styling, concentric pulsing rings.
 */

import { Incident, Resource, Hospital } from '../../types/emergency';

/**
 * Creates a high-impact pulsing HTML marker element for an Incident
 * Severity 5: Intense Crimson pulse with hazard alert
 * Severity 3-4: Amber warning pulse
 * Severity 1-2: Cyan medical pulse
 */
export function createIncidentMarkerElement(
  incident: Incident,
  onClick?: (incident: Incident) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'group relative flex items-center justify-center cursor-pointer select-none';
  container.setAttribute('data-incident-id', incident.id);
  container.style.width = '48px';
  container.style.height = '48px';

  let pulseAnimationClass = 'animate-pulse-cyan';
  let badgeBgColor = 'bg-cyan-500';
  let badgeBorderColor = 'border-cyan-400';
  let glowColor = 'shadow-[0_0_15px_rgba(6,182,212,0.8)]';
  let severityLabel = `S${incident.severity}`;
  let severityTag = 'text-cyan-300';

  if (incident.severity === 5) {
    pulseAnimationClass = 'animate-pulse-crimson';
    badgeBgColor = 'bg-red-600';
    badgeBorderColor = 'border-red-400';
    glowColor = 'shadow-[0_0_25px_rgba(239,68,68,0.95)]';
    severityLabel = 'CRITICAL S5';
    severityTag = 'text-red-400 font-bold';
  } else if (incident.severity >= 3) {
    pulseAnimationClass = 'animate-pulse-amber';
    badgeBgColor = 'bg-amber-500';
    badgeBorderColor = 'border-amber-300';
    glowColor = 'shadow-[0_0_18px_rgba(245,158,11,0.85)]';
    severityLabel = `URGENT S${incident.severity}`;
    severityTag = 'text-amber-300 font-semibold';
  }

  // HTML structure with outer pulsing radar ring, central core, and hover telemetry pill
  container.innerHTML = `
    <!-- Outer concentric pulsing wave -->
    <div class="absolute inset-0 rounded-full ${pulseAnimationClass} opacity-75 pointer-events-none"></div>
    
    <!-- Secondary radar ring for Severity 5 -->
    ${
      incident.severity === 5
        ? '<div class="absolute -inset-2 rounded-full animate-ping opacity-35 bg-red-500 pointer-events-none"></div>'
        : ''
    }

    <!-- Core Interactive Icon Badge -->
    <div class="relative z-10 flex flex-col items-center justify-center w-8 h-8 rounded-full ${badgeBgColor} border-2 ${badgeBorderColor} ${glowColor} transition-transform duration-200 group-hover:scale-125">
      <svg class="w-4 h-4 text-slate-950 font-black" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L1 21h22L12 2zm0 3.8L19.5 19h-15L12 5.8zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
      </svg>
    </div>

    <!-- Severity Badge Label -->
    <div class="absolute -top-3 px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-slate-950/90 border border-slate-700 text-white tracking-wider shadow pointer-events-none whitespace-nowrap">
      ${severityLabel}
    </div>

    <!-- Hover Information Tooltip Card -->
    <div class="absolute bottom-12 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col min-w-[200px] p-2.5 rounded-lg bg-slate-950/95 border border-slate-800 backdrop-blur-md shadow-2xl z-50 pointer-events-none">
      <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5 mb-1.5">
        <span class="text-[10px] font-mono text-cyan-400 font-bold">${incident.id}</span>
        <span class="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 ${severityTag}">
          ${incident.status}
        </span>
      </div>
      <div class="text-xs font-semibold text-slate-100 line-clamp-1 leading-snug">${incident.title}</div>
      <div class="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
        <svg class="w-3 h-3 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
        <span class="truncate">${incident.location.address}</span>
      </div>
      <div class="text-[9px] font-mono text-slate-500 mt-1 flex items-center justify-between">
        <span>Reported: ${incident.reportedAt}</span>
        ${incident.assignedResourceId ? `<span class="text-emerald-400 font-bold">Unit: ${incident.assignedResourceId}</span>` : '<span class="text-amber-400 font-bold">Unassigned</span>'}
      </div>
    </div>
  `;

  if (onClick) {
    container.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick(incident);
    });
  }

  return container;
}

/**
 * Creates an interactive DOM badge marker for an Emergency Fleet Resource
 * Types: Ambulance (cross), Fire Engine (flame), Rescue Team (shield)
 * Statuses: DISPATCHED (cyan), REROUTED (amber pulse), UNAVAILABLE (red strike), IDLE (slate)
 */
export function createResourceMarkerElement(
  resource: Resource,
  onClick?: (resource: Resource) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'group relative flex items-center justify-center cursor-pointer select-none';
  container.setAttribute('data-resource-id', resource.id);
  container.style.width = '44px';
  container.style.height = '44px';

  let borderColor = 'border-slate-600';
  let bgColor = 'bg-slate-900/90';
  let statusDotColor = 'bg-slate-400';
  let statusBadgeText = resource.status;
  let statusClass = 'text-slate-300';
  let pulseEffect = '';

  if (resource.status === 'DISPATCHED') {
    borderColor = 'border-cyan-400';
    bgColor = 'bg-slate-950/95';
    statusDotColor = 'bg-cyan-400 animate-pulse';
    statusClass = 'text-cyan-400 font-bold';
    pulseEffect = 'shadow-[0_0_12px_rgba(6,182,212,0.6)]';
  } else if (resource.status === 'REROUTED') {
    borderColor = 'border-amber-400';
    bgColor = 'bg-slate-950/95';
    statusDotColor = 'bg-amber-400 animate-ping';
    statusClass = 'text-amber-400 font-bold';
    pulseEffect = 'shadow-[0_0_16px_rgba(245,158,11,0.85)]';
  } else if (resource.status === 'UNAVAILABLE') {
    borderColor = 'border-red-500';
    bgColor = 'bg-red-950/80';
    statusDotColor = 'bg-red-500';
    statusClass = 'text-red-400 font-bold';
    pulseEffect = 'shadow-[0_0_10px_rgba(239,68,68,0.5)]';
  } else if (resource.status === 'ON_SCENE') {
    borderColor = 'border-emerald-400';
    bgColor = 'bg-slate-950/95';
    statusDotColor = 'bg-emerald-400';
    statusClass = 'text-emerald-400 font-bold';
    pulseEffect = 'shadow-[0_0_12px_rgba(16,185,129,0.6)]';
  }

  // Icon depending on resource type
  let iconSvg = '';
  if (resource.type === 'AMBULANCE') {
    iconSvg = `
      <svg class="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 8h-2V5a1 1 0 00-1-1H4a1 1 0 00-1 1v12a1 1 0 001 1h1.18a3 3 0 005.64 0h4.36a3 3 0 005.64 0H21a1 1 0 001-1v-6l-3-3zm-9 1v2H8v2h2v2h2v-2h2v-2h-2V9h-2zm-3 9a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm10 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM17 7.5L19.5 10H17V7.5z"/>
      </svg>
    `;
  } else if (resource.type === 'FIRE_TRUCK') {
    iconSvg = `
      <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    `;
  } else {
    iconSvg = `
      <svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
      </svg>
    `;
  }

  container.innerHTML = `
    <!-- Main vehicle marker circular shield -->
    <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${bgColor} border-2 ${borderColor} ${pulseEffect} transition-all duration-200 group-hover:scale-125">
      ${iconSvg}
      
      <!-- Tiny Status Indicator Dot -->
      <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${statusDotColor} border border-slate-950"></span>
    </div>

    <!-- Callsign Pill -->
    <div class="absolute -bottom-3 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-slate-950/90 border border-slate-700 text-slate-200 tracking-wider shadow pointer-events-none whitespace-nowrap">
      ${resource.id}
    </div>

    <!-- Hover Information Card -->
    <div class="absolute bottom-11 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col min-w-[190px] p-2.5 rounded-lg bg-slate-950/95 border border-slate-800 backdrop-blur-md shadow-2xl z-50 pointer-events-none">
      <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1 mb-1">
        <span class="text-[10px] font-mono text-cyan-400 font-bold">${resource.name}</span>
        <span class="text-[8px] font-mono px-1 rounded bg-slate-900 border border-slate-700 ${statusClass}">
          ${statusBadgeText}
        </span>
      </div>
      <div class="text-[10px] text-slate-300 font-mono flex items-center justify-between mt-1">
        <span class="text-slate-500">Unit Type:</span>
        <span class="text-slate-200 font-semibold">${resource.type}</span>
      </div>
      <div class="text-[10px] text-slate-300 font-mono flex items-center justify-between mt-0.5">
        <span class="text-slate-500">ETA to Scene:</span>
        <span class="text-cyan-400 font-bold">${resource.currentEtaMinutes !== undefined ? `${resource.currentEtaMinutes} mins` : 'N/A'}</span>
      </div>
      ${
        resource.assignedIncidentId
          ? `<div class="text-[9px] font-mono text-amber-400 mt-1 pt-1 border-t border-slate-800/60">Target: ${resource.assignedIncidentId}</div>`
          : '<div class="text-[9px] font-mono text-slate-500 mt-1 pt-1 border-t border-slate-800/60">Status: Staged & Ready</div>'
      }
    </div>
  `;

  if (onClick) {
    container.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick(resource);
    });
  }

  return container;
}

/**
 * Creates a distinct Medical Facility Marker element with live bed capacity tag
 */
export function createHospitalMarkerElement(
  hospital: Hospital,
  onClick?: (hospital: Hospital) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'group relative flex items-center justify-center cursor-pointer select-none';
  container.setAttribute('data-hospital-id', hospital.id);
  container.style.width = '42px';
  container.style.height = '42px';

  const bedRatio = hospital.availableBeds / hospital.totalBeds;
  const bedBadgeColor = bedRatio < 0.15 ? 'text-amber-400 border-amber-500/50' : 'text-emerald-400 border-emerald-500/50';

  container.innerHTML = `
    <!-- Hospital Marker Center Badge -->
    <div class="relative flex items-center justify-center w-7 h-7 rounded-lg bg-slate-950/95 border-2 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-transform duration-200 group-hover:scale-125">
      <svg class="w-4 h-4 text-emerald-400 font-bold" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 10.5h-5.5V5c0-.28-.22-.5-.5-.5h-2c-.28 0-.5.22-.5.5v5.5H5c-.28 0-.5.22-.5.5v2c0 .28.22.5.5.5h5.5V19c0 .28.22.5.5.5h2c.28 0 .5-.22.5-.5v-5.5H19c.28 0 .5-.22.5-.5v-2c0-.28-.22-.5-.5-.5z"/>
      </svg>
    </div>

    <!-- Live Bed Count Tag -->
    <div class="absolute -bottom-3 px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-slate-950/90 border ${bedBadgeColor} shadow pointer-events-none whitespace-nowrap">
      ${hospital.availableBeds} BEDS
    </div>

    <!-- Hover Information Tooltip -->
    <div class="absolute bottom-10 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col min-w-[210px] p-2.5 rounded-lg bg-slate-950/95 border border-slate-800 backdrop-blur-md shadow-2xl z-50 pointer-events-none">
      <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1 mb-1">
        <span class="text-[10px] font-mono text-emerald-400 font-bold">${hospital.id}</span>
        <span class="text-[8px] font-mono px-1 rounded bg-slate-900 border border-slate-700 text-emerald-300">
          Trauma Level ${hospital.traumaLevel ?? 1}
        </span>
      </div>
      <div class="text-xs font-semibold text-slate-100 line-clamp-1">${hospital.name}</div>
      <div class="text-[10px] text-slate-400 mt-1 truncate">${hospital.address ?? 'Bengaluru Metro Area'}</div>
      <div class="flex items-center justify-between text-[10px] font-mono text-slate-300 mt-2 pt-1 border-t border-slate-800">
        <span class="text-slate-500">Available Beds:</span>
        <span class="font-bold ${bedRatio < 0.15 ? 'text-amber-400' : 'text-emerald-400'}">${hospital.availableBeds} / ${hospital.totalBeds}</span>
      </div>
    </div>
  `;

  if (onClick) {
    container.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick(hospital);
    });
  }

  return container;
}
