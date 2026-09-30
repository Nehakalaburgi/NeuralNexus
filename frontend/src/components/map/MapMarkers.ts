/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * Pure DOM Marker Elements for Mapbox GL JS
 * High-performance 60fps rendering, custom tactical styling, concentric pulsing rings, domain-specific icons.
 */

import { Incident, Resource, Hospital, TrafficSegment } from '../../types/emergency';

/**
 * Identifies the domain emergency category for tailored visual iconography
 */
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
  if (incident.requiredResources.includes('RESCUE_TEAM') || text.includes('rescue')) {
    return 'RESCUE';
  }
  return 'GENERAL';
}

/**
 * Creates a high-impact pulsing HTML marker element for an Incident
 * - STRUCTURAL FIRE: Burning Flame / Fire Hazard icon with an intense pulsing Orange/Red ring
 * - MULTI-VEHICLE COLLISION: Crash impact hazard icon with rapid pulsing Red emergency ring
 * - CARDIAC / MEDICAL EMERGENCY: Heart-pulse ECG line icon with an Amber/Rose pulsing ring
 * - GENERAL / CIVIL RESCUE: Warning triangle / Shield alert with Yellow badge
 */
export function createIncidentMarkerElement(
  incident: Incident,
  onClick?: (incident: Incident) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'group relative flex items-center justify-center cursor-pointer select-none';
  container.setAttribute('data-incident-id', incident.id);
  container.style.width = '52px';
  container.style.height = '52px';

  const category = getIncidentCategory(incident);

  let pulseAnimationClass = 'animate-pulse-cyan';
  let badgeBgColor = 'bg-cyan-500';
  let badgeBorderColor = 'border-cyan-300';
  let glowColor = 'shadow-[0_0_18px_rgba(6,182,212,0.85)]';
  let severityLabel = `S${incident.severity}`;
  let severityTag = 'text-cyan-300';
  let secondaryRadarHtml = '';
  let iconSvg = '';

  switch (category) {
    case 'FIRE':
      // STRUCTURAL FIRE: Burning Flame / Fire Hazard with intense pulsing Orange/Red ring
      pulseAnimationClass = 'animate-pulse-orange-red';
      badgeBgColor = 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-600';
      badgeBorderColor = 'border-orange-300';
      glowColor = 'shadow-[0_0_24px_rgba(249,115,22,0.95)]';
      severityLabel = `FIRE S${incident.severity}`;
      severityTag = 'text-orange-400 font-bold';
      secondaryRadarHtml = '<div class="absolute -inset-2 rounded-full animate-ping opacity-45 bg-orange-500 pointer-events-none"></div>';
      iconSvg = `
        <svg class="w-4.5 h-4.5 text-amber-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      `;
      break;

    case 'CRASH':
      // MULTI-VEHICLE COLLISION / CRASH: Rapid pulsing Red emergency ring with AlertOctagon hazard
      pulseAnimationClass = 'animate-pulse-crimson';
      badgeBgColor = 'bg-gradient-to-br from-red-600 via-rose-700 to-red-800';
      badgeBorderColor = 'border-red-300';
      glowColor = 'shadow-[0_0_28px_rgba(239,68,68,1)]';
      severityLabel = 'CRASH S5';
      severityTag = 'text-red-400 font-bold';
      secondaryRadarHtml = '<div class="absolute -inset-2.5 rounded-full animate-ping opacity-55 bg-red-600 pointer-events-none"></div>';
      iconSvg = `
        <svg class="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      `;
      break;

    case 'CARDIAC':
      // CARDIAC / MEDICAL EMERGENCY: Heart-pulse / ECG line icon with Amber/Rose pulsing ring
      pulseAnimationClass = 'animate-pulse-rose';
      badgeBgColor = 'bg-gradient-to-br from-rose-500 via-rose-600 to-amber-600';
      badgeBorderColor = 'border-rose-300';
      glowColor = 'shadow-[0_0_20px_rgba(244,63,94,0.9)]';
      severityLabel = `CARDIAC S${incident.severity}`;
      severityTag = 'text-rose-400 font-bold';
      secondaryRadarHtml = '<div class="absolute -inset-1.5 rounded-full animate-ping opacity-30 bg-rose-500 pointer-events-none"></div>';
      iconSvg = `
        <svg class="w-4.5 h-4.5 text-rose-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
        </svg>
      `;
      break;

    case 'RESCUE':
    case 'GENERAL':
    default:
      // GENERAL / CIVIL RESCUE: Warning triangle / Shield alert with Yellow badge
      pulseAnimationClass = 'animate-pulse-amber';
      badgeBgColor = 'bg-gradient-to-br from-amber-500 to-yellow-600';
      badgeBorderColor = 'border-yellow-300';
      glowColor = 'shadow-[0_0_18px_rgba(245,158,11,0.85)]';
      severityLabel = `RESCUE S${incident.severity}`;
      severityTag = 'text-amber-300 font-semibold';
      iconSvg = `
        <svg class="w-4.5 h-4.5 text-slate-950 font-black" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L1 21h22L12 2zm0 3.8L19.5 19h-15L12 5.8zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
        </svg>
      `;
      break;
  }

  // Determine assigned units display string
  const assignedUnitsDisplay = incident.assignedResourceIds && incident.assignedResourceIds.length > 0
    ? incident.assignedResourceIds.join(', ')
    : incident.assignedResourceId || 'Unassigned';

  const requiredBadgesHtml = incident.requiredResources
    .map((r) => {
      if (r === 'FIRE_TRUCK') return '<span class="px-1 py-0.2 rounded bg-orange-950 border border-orange-600/70 text-orange-300 text-[8px]">FIRE ENGINE</span>';
      if (r === 'AMBULANCE') return '<span class="px-1 py-0.2 rounded bg-cyan-950 border border-cyan-600/70 text-cyan-300 text-[8px]">AMBULANCE</span>';
      return '<span class="px-1 py-0.2 rounded bg-indigo-950 border border-indigo-600/70 text-indigo-300 text-[8px]">RESCUE SQUAD</span>';
    })
    .join(' ');

  // HTML structure with outer concentric pulsing radar ring, central core, and hover telemetry card
  container.innerHTML = `
    <!-- Outer concentric pulsing wave -->
    <div class="absolute inset-0 rounded-full ${pulseAnimationClass} opacity-80 pointer-events-none"></div>
    
    <!-- Secondary radar ring for high-intensity incidents -->
    ${secondaryRadarHtml}

    <!-- Core Interactive Icon Badge -->
    <div class="relative z-10 flex flex-col items-center justify-center w-9 h-9 rounded-full ${badgeBgColor} border-2 ${badgeBorderColor} ${glowColor} transition-transform duration-200 group-hover:scale-125">
      ${iconSvg}
    </div>

    <!-- Severity Badge Label -->
    <div class="absolute -top-3.5 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-black bg-slate-950/95 border border-slate-700 text-white tracking-wider shadow pointer-events-none whitespace-nowrap">
      ${severityLabel}
    </div>

    <!-- Hover Information Tooltip Card -->
    <div class="absolute bottom-13 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col min-w-[220px] p-3 rounded-xl bg-slate-950/98 border border-slate-800 backdrop-blur-md shadow-2xl z-50 pointer-events-none">
      <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5 mb-1.5">
        <span class="text-[10px] font-mono text-cyan-400 font-bold">${incident.id}</span>
        <span class="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 ${severityTag}">
          ${incident.status}
        </span>
      </div>
      <div class="text-xs font-bold text-slate-100 line-clamp-1 leading-snug">${incident.title}</div>
      <div class="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
        <svg class="w-3 h-3 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
        <span class="truncate">${incident.location.address}</span>
      </div>
      <div class="mt-1.5 flex flex-wrap gap-1">
        ${requiredBadgesHtml}
      </div>
      <div class="text-[9px] font-mono text-slate-400 mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
        <span>Reported: ${incident.reportedAt}</span>
        <span class="${incident.assignedResourceId ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}">
          ${incident.assignedResourceId ? `Units: ${assignedUnitsDisplay}` : 'Unassigned'}
        </span>
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
 * Types:
 * - AMBULANCE (`AMB-*`): Ambulance / Stretcher / First-Aid Cross icon with active Emerald/Cyan beacon ring
 * - FIRE ENGINE (`FIRE-*`): Fire Truck / Flame-retardant tanker icon with active Crimson/Orange beacon ring
 * - RESCUE SQUAD (`RESCUE-*`): Search & Rescue Life-buoy / Heavy Wrench / Shield icon with Deep Indigo/Purple badge
 */
export function createResourceMarkerElement(
  resource: Resource,
  onClick?: (resource: Resource) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'group relative flex items-center justify-center cursor-pointer select-none';
  container.setAttribute('data-resource-id', resource.id);
  container.style.width = '48px';
  container.style.height = '48px';

  let borderColor = 'border-slate-600';
  let bgColor = 'bg-slate-900/90';
  let statusDotColor = 'bg-slate-400';
  let statusBadgeText: string = resource.status;
  let statusClass = 'text-slate-300';
  let beaconRingHtml = '';
  let pulseEffect = '';

  // Type-specific baseline configurations
  if (resource.type === 'AMBULANCE') {
    borderColor = 'border-emerald-400';
    bgColor = 'bg-slate-950/95';
    pulseEffect = 'shadow-[0_0_15px_rgba(16,185,129,0.7)]';
    if (resource.status === 'DISPATCHED' || resource.status === 'DISPATCHED_TO_SCENE') {
      beaconRingHtml = '<div class="absolute -inset-1 rounded-full animate-pulse-emerald opacity-75 pointer-events-none"></div>';
    }
  } else if (resource.type === 'FIRE_TRUCK') {
    borderColor = 'border-orange-500';
    bgColor = 'bg-slate-950/95';
    pulseEffect = 'shadow-[0_0_18px_rgba(249,115,22,0.85)]';
    if (resource.status === 'DISPATCHED' || resource.status === 'DISPATCHED_TO_SCENE') {
      beaconRingHtml = '<div class="absolute -inset-1 rounded-full animate-pulse-amber opacity-75 pointer-events-none"></div>';
    }
  } else if (resource.type === 'RESCUE_TEAM') {
    borderColor = 'border-indigo-400';
    bgColor = 'bg-indigo-950/90';
    pulseEffect = 'shadow-[0_0_16px_rgba(99,102,241,0.7)]';
    if (resource.status === 'DISPATCHED' || resource.status === 'DISPATCHED_TO_SCENE') {
      beaconRingHtml = '<div class="absolute -inset-1 rounded-full animate-pulse-purple opacity-75 pointer-events-none"></div>';
    }
  }

  const isEvacuating = resource.status === 'PATIENT_LOADED_EVACUATING' || resource.status === 'TRANSPORTING_PATIENT';
  const isOnScene = resource.status === 'ON_SCENE_TRIAGING' || resource.status === 'ON_SCENE';
  const isDelivered = resource.status === 'ARRIVED_HOSPITAL' || resource.status === 'PATIENT_DELIVERED';
  const isResolved = resource.status === 'MISSION_RESOLVED' || resource.status === 'AVAILABLE' || resource.status === 'IDLE';

  // Status overrides
  if (resource.status === 'DISPATCHED' || resource.status === 'DISPATCHED_TO_SCENE') {
    statusDotColor = 'bg-cyan-400 animate-pulse';
    statusClass = 'text-cyan-400 font-bold';
    statusBadgeText = 'DISPATCHED (LEG 1)';
  } else if (isEvacuating) {
    borderColor = 'border-emerald-400';
    bgColor = 'bg-emerald-950/95';
    statusDotColor = 'bg-emerald-400 animate-ping';
    statusBadgeText = 'PATIENT EVACUATION (LEG 2)';
    statusClass = 'text-emerald-300 font-bold';
    pulseEffect = 'shadow-[0_0_24px_rgba(16,185,129,0.9)]';
    beaconRingHtml = '<div class="absolute -inset-2 rounded-full animate-pulse-emerald opacity-80 pointer-events-none"></div><div class="absolute -inset-3.5 rounded-full animate-ping opacity-40 bg-emerald-600 pointer-events-none"></div>';
  } else if (isOnScene) {
    borderColor = 'border-emerald-400';
    bgColor = 'bg-emerald-950/95';
    statusDotColor = 'bg-emerald-400 animate-pulse';
    statusBadgeText = 'ON SCENE (TRIAGING)';
    statusClass = 'text-emerald-300 font-bold';
    pulseEffect = 'shadow-[0_0_20px_rgba(16,185,129,0.9)]';
    beaconRingHtml = '<div class="absolute -inset-1.5 rounded-full animate-pulse-emerald opacity-80 pointer-events-none"></div>';
  } else if (isDelivered) {
    borderColor = 'border-emerald-400';
    bgColor = 'bg-slate-950/95';
    statusDotColor = 'bg-emerald-400';
    statusBadgeText = 'ARRIVED AT HOSPITAL';
    statusClass = 'text-emerald-400 font-bold';
    pulseEffect = 'shadow-[0_0_18px_rgba(16,185,129,0.8)]';
    beaconRingHtml = '<div class="absolute -inset-2 rounded-full animate-ping opacity-35 bg-emerald-500 pointer-events-none"></div>';
  } else if (isResolved) {
    borderColor = 'border-emerald-500/70';
    bgColor = 'bg-slate-950/90';
    statusDotColor = 'bg-emerald-400';
    statusBadgeText = 'IDLE / READY';
    statusClass = 'text-emerald-400';
    beaconRingHtml = '';
  } else if (resource.status === 'REROUTED') {
    borderColor = 'border-amber-400';
    statusDotColor = 'bg-amber-400 animate-ping';
    statusClass = 'text-amber-400 font-bold';
    statusBadgeText = 'BYPASS REROUTED';
    pulseEffect = 'shadow-[0_0_20px_rgba(245,158,11,0.95)]';
    beaconRingHtml = '<div class="absolute -inset-1.5 rounded-full animate-ping opacity-45 bg-amber-500 pointer-events-none"></div>';
  } else if (resource.status === 'UNAVAILABLE') {
    borderColor = 'border-red-500';
    bgColor = 'bg-red-950/80';
    statusDotColor = 'bg-red-500';
    statusClass = 'text-red-400 font-bold';
    pulseEffect = 'shadow-[0_0_10px_rgba(239,68,68,0.6)]';
    beaconRingHtml = '';
  }

  // Distinct, domain-specific vehicle icons
  let iconSvg = '';
  if (isEvacuating) {
    // Dedicated Patient Stretcher / Pulse Transit Icon
    iconSvg = `
      <svg class="w-5 h-5 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    `;
  } else if (resource.type === 'AMBULANCE') {
    // Dedicated Ambulance Vehicle Logo
    iconSvg = `
      <svg class="w-4.5 h-4.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 10H6"/>
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"/>
        <path d="M8 8v4"/>
        <path d="M9 18h6"/>
        <circle cx="17" cy="18" r="2"/>
        <circle cx="7" cy="18" r="2"/>
      </svg>
    `;
  } else if (resource.type === 'FIRE_TRUCK') {
    // Fire Engine / Flame-retardant tanker
    iconSvg = `
      <svg class="w-4.5 h-4.5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
        <path d="M15 18H9"/>
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
        <circle cx="17" cy="18" r="2"/>
        <circle cx="7" cy="18" r="2"/>
      </svg>
    `;
  } else {
    // RESCUE SQUAD: Life-buoy / Search & Rescue Shield
    iconSvg = `
      <svg class="w-4.5 h-4.5 text-indigo-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="m4.93 4.93 4.24 4.24"/>
        <path d="m14.83 9.17 4.24-4.24"/>
        <path d="m14.83 14.83 4.24 4.24"/>
        <path d="m9.17 14.83-4.24 4.24"/>
        <circle cx="12" cy="12" r="4"/>
      </svg>
    `;
  }

  const targetHospName = resource.targetHospitalName ?? 'Victoria Hospital';

  container.innerHTML = `
    <!-- Concentric Active Beacon Ring -->
    ${beaconRingHtml}

    <!-- Narrative Milestone Floating Tag (Milestone A, B, C) -->
    <div data-milestone-tag="${resource.id}" class="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[8px] font-mono font-black tracking-wide shadow-xl pointer-events-none whitespace-nowrap z-20 transition-all duration-300 ${
      resource.status === 'REROUTED'
        ? 'bg-amber-950/95 border border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse'
        : isOnScene
        ? 'bg-emerald-950/95 border border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse'
        : isEvacuating
        ? 'bg-emerald-950/95 border border-emerald-400 text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.7)]'
        : isDelivered
        ? 'bg-emerald-950/95 border border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
        : isResolved
        ? 'bg-slate-950/95 border border-emerald-500/70 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
        : 'hidden'
    }">
      ${
        resource.status === 'REROUTED'
          ? 'AI RECALCULATING: CHOKEPOINT AHEAD'
          : isOnScene
          ? '[ON SCENE: STABILIZING PATIENT]'
          : isEvacuating
          ? `🚑 EVACUATING PATIENT -> ${targetHospName} (ETA: ${resource.currentEtaMinutes ?? 4.8} min)`
          : isDelivered
          ? '[AVAILABLE / READY]'
          : isResolved
          ? '[AVAILABLE / READY]'
          : ''
      }
    </div>

    <!-- Directional Heading Rotating Vehicle Body -->
    <div data-heading-wrapper="${resource.id}" class="relative flex items-center justify-center w-9 h-9 rounded-full ${bgColor} border-2 ${borderColor} ${pulseEffect} z-10" style="will-change: transform; transform-origin: center center;">
      <!-- Forward Heading Compass Beam Arrow -->
      <div class="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] ${resource.type === 'FIRE_TRUCK' ? 'border-b-orange-400 drop-shadow-[0_0_6px_rgba(249,115,22,1)]' : 'border-b-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,1)]'} pointer-events-none"></div>

      ${iconSvg}
      
      <!-- Tiny Status Indicator Dot -->
      <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${statusDotColor} border border-slate-950"></span>
    </div>

    <!-- Callsign Pill -->
    <div class="absolute -bottom-3 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-slate-950/95 border border-slate-700 text-slate-200 tracking-wider shadow pointer-events-none whitespace-nowrap z-10">
      ${resource.id}
    </div>

    <!-- Live Dynamic Distance & ETA Pill (Active during dispatch / hospital transport / on scene) -->
    ${
      resource.status === 'DISPATCHED' || resource.status === 'DISPATCHED_TO_SCENE' || resource.status === 'REROUTED' || isEvacuating || isOnScene
        ? `
        <div data-metric-pill="${resource.id}" class="absolute -bottom-7 px-1.5 py-0.2 rounded-full text-[7.5px] font-mono font-black bg-slate-950/95 border ${
          isEvacuating
            ? 'border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
            : isOnScene
            ? 'border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
            : 'border-cyan-400/80 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
        } pointer-events-none whitespace-nowrap flex items-center gap-1 z-10">
          <span data-eta-text="${resource.id}">${isOnScene ? 'TRIAGE' : isEvacuating ? 'EVAC' : `${resource.currentEtaMinutes ?? 4}m`}</span>
          <span class="text-slate-600">•</span>
          <span data-dist-text="${resource.id}">${isEvacuating ? (resource.targetHospitalName?.split(' ')[0] ?? 'Hospital') : `${resource.distanceRemainingKm ?? '2.4'}km`}</span>
        </div>
      `
        : ''
    }

    <!-- Hover Information Card -->
    <div class="absolute bottom-12 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col min-w-[210px] p-2.5 rounded-lg bg-slate-950/98 border border-slate-800 backdrop-blur-md shadow-2xl z-50 pointer-events-none">
      <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1 mb-1">
        <span class="text-[10px] font-mono text-cyan-400 font-bold">${resource.name}</span>
        <span class="text-[8px] font-mono px-1 rounded bg-slate-900 border border-slate-700 ${statusClass}">
          ${statusBadgeText}
        </span>
      </div>
      <div class="text-[10px] text-slate-300 font-mono flex items-center justify-between mt-1">
        <span class="text-slate-500">Unit Type:</span>
        <span class="text-slate-200 font-semibold">${resource.type.replace('_', ' ')}</span>
      </div>
      ${
        resource.status === 'TRANSPORTING_PATIENT' || resource.status === 'PATIENT_LOADED_EVACUATING'
          ? `
        <div class="mt-1 p-1 rounded bg-emerald-950/80 border border-emerald-500/70 text-[9px] font-mono text-emerald-300">
          <div class="font-bold text-emerald-200">🚑 Medical Transport En-Route</div>
          <div class="text-[8.5px] text-emerald-400 mt-0.5">Destination: ${resource.targetHospitalName ?? 'Victoria Hospital (Burn ICU)'}</div>
        </div>
        `
          : ''
      }
      <div class="text-[10px] text-slate-300 font-mono flex items-center justify-between mt-0.5">
        <span class="text-slate-500">ETA / Time:</span>
        <span class="text-cyan-400 font-bold" data-hover-eta="${resource.id}">${resource.currentEtaMinutes !== undefined ? `${resource.currentEtaMinutes} mins` : 'N/A'}</span>
      </div>
      <div class="text-[10px] text-slate-300 font-mono flex items-center justify-between mt-0.5">
        <span class="text-slate-500">Distance:</span>
        <span class="text-emerald-400 font-bold" data-hover-dist="${resource.id}">${resource.distanceRemainingKm !== undefined ? `${resource.distanceRemainingKm} km` : 'Active Route'}</span>
      </div>
      ${
        resource.trafficStatus === 'REROUTED_BYPASS'
          ? `
        <div class="mt-1.5 p-1 rounded bg-emerald-950/80 border border-emerald-500/70 text-[9px] font-mono text-emerald-300 flex items-center justify-between">
          <span class="flex items-center gap-1 font-bold">✅ Traffic Bypass Active</span>
          <span class="text-emerald-400 font-black">-${resource.trafficSavingsMinutes ?? '8.8'}m saved</span>
        </div>
        `
          : resource.trafficStatus === 'BOTTLENECK'
            ? `
        <div class="mt-1.5 p-1 rounded bg-red-950/80 border border-red-500/70 text-[9px] font-mono text-red-300 flex items-center justify-between animate-pulse">
          <span class="flex items-center gap-1 font-bold">⚠️ Severe Gridlock Delay</span>
          <span class="text-red-400 font-black">+${resource.trafficDelayMinutes ?? '10'}m</span>
        </div>
        `
            : ''
      }
      ${
        resource.assignedIncidentId
          ? `<div class="text-[9px] font-mono text-amber-400 mt-1 pt-1 border-t border-slate-800/60">Target Call: #${resource.assignedIncidentId}</div>`
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
 * Creates a distinct Medical Facility Marker element with live available bed count pill
 */
export function createHospitalMarkerElement(
  hospital: Hospital,
  onClick?: (hospital: Hospital) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'group relative flex items-center justify-center cursor-pointer select-none';
  container.setAttribute('data-hospital-id', hospital.id);
  container.style.width = '44px';
  container.style.height = '44px';

  const bedRatio = hospital.availableBeds / hospital.totalBeds;
  const bedBadgeColor = bedRatio < 0.15 ? 'text-amber-400 border-amber-500/70 bg-amber-950/80' : 'text-emerald-400 border-emerald-500/70 bg-emerald-950/80';

  container.innerHTML = `
    <!-- Subtle Receiving Green Pulse Halo (Active on ambulance arrival) -->
    <div data-hospital-pulse="${hospital.id}" class="absolute -inset-2.5 rounded-xl animate-ping opacity-0 bg-emerald-500 pointer-events-none transition-opacity duration-500"></div>

    <!-- Hospital Marker Center Badge -->
    <div class="relative flex items-center justify-center w-7.5 h-7.5 rounded-lg bg-slate-950/98 border-2 border-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.55)] transition-transform duration-200 group-hover:scale-125 z-10">
      <svg class="w-4.5 h-4.5 text-emerald-400 font-bold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 7v4"/>
        <path d="M14 21v-3a2 2 0 0 0-4 0v3"/>
        <path d="M14 9h-4"/>
        <path d="M18 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/>
        <path d="M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16"/>
      </svg>
    </div>

    <!-- Live Bed Count Tag Pill -->
    <div class="absolute -bottom-3 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold border ${bedBadgeColor} shadow pointer-events-none whitespace-nowrap z-10">
      ${hospital.availableBeds} BEDS
    </div>

    <!-- Hover Information Tooltip -->
    <div class="absolute bottom-11 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col min-w-[210px] p-2.5 rounded-lg bg-slate-950/98 border border-slate-800 backdrop-blur-md shadow-2xl z-50 pointer-events-none">
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

/**
 * Creates a pulsating Traffic Gridlock Bottleneck Marker with Warning Badge
 */
export function createTrafficBottleneckMarkerElement(
  segment: TrafficSegment,
  onClick?: (segment: TrafficSegment) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'group relative flex items-center justify-center cursor-pointer select-none';
  container.setAttribute('data-traffic-id', segment.id);
  container.style.width = '48px';
  container.style.height = '48px';

  const isSevere = segment.congestion === 'severe';
  const badgeColor = isSevere ? 'bg-red-600' : 'bg-orange-500';
  const borderColor = isSevere ? 'border-red-400' : 'border-orange-400';
  const glowColor = isSevere ? 'shadow-[0_0_20px_rgba(239,68,68,0.9)]' : 'shadow-[0_0_15px_rgba(249,115,22,0.8)]';

  container.innerHTML = `
    <!-- Concentric Pulsing Strobe Wave -->
    <div class="absolute inset-0 rounded-full animate-ping opacity-60 ${isSevere ? 'bg-red-500' : 'bg-orange-500'} pointer-events-none"></div>

    <!-- Center Icon Badge -->
    <div class="relative flex items-center justify-center w-7.5 h-7.5 rounded-full ${badgeColor} border-2 ${borderColor} ${glowColor} transition-transform duration-200 group-hover:scale-125 z-10">
      <svg class="w-4 h-4 text-white font-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </div>

    <!-- Bottleneck Tag -->
    <div class="absolute -bottom-3 px-1.5 py-0.2 rounded text-[7.5px] font-mono font-black ${isSevere ? 'bg-red-950/95 border-red-500 text-red-300' : 'bg-orange-950/95 border-orange-500 text-orange-300'} border shadow pointer-events-none whitespace-nowrap z-10">
      +${segment.delayMinutes}m DELAY
    </div>

    <!-- Hover Info Card -->
    <div class="absolute bottom-11 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col min-w-[210px] p-2.5 rounded-lg bg-slate-950/98 border border-slate-800 backdrop-blur-md shadow-2xl z-50 pointer-events-none">
      <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1 mb-1">
        <span class="text-[10px] font-mono text-red-400 font-bold uppercase">${segment.congestion} Gridlock</span>
        <span class="text-[8px] font-mono px-1 rounded bg-slate-900 border border-slate-700 text-slate-300">
          ${segment.speedKmH} km/h avg
        </span>
      </div>
      <div class="text-xs font-bold text-slate-100 line-clamp-1">${segment.name}</div>
      <div class="text-[9.5px] text-slate-400 mt-1">${segment.description ?? 'Severe traffic bottleneck detected.'}</div>
      <div class="mt-1.5 pt-1 border-t border-slate-800 flex items-center justify-between text-[9px] font-mono text-amber-400 font-bold">
        <span>Impact: Arterial Delay</span>
        <span class="text-red-400 font-black">+${segment.delayMinutes} min</span>
      </div>
    </div>
  `;

  if (onClick) {
    container.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick(segment);
    });
  }

  return container;
}

