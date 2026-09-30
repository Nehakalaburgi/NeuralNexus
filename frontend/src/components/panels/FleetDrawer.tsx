/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * FleetDrawer: Right Hover-Expandable Fleet Telemetry & Resource Gauges Overlay
 * Provides real-time unit status, deployment gauges, and interactive vehicle focus.
 * Enhanced with domain-specific vehicle icons (Ambulance, Fire Engine Tanker, Rescue Squad).
 */

import React, { useState } from 'react';
import {
  Truck,
  Flame,
  LifeBuoy,
  Clock,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Ambulance,
  Hospital as HospitalIcon,
  Zap,
  Radio,
  Navigation,
  Shield,
} from 'lucide-react';
import { Resource, Hospital, WorldMetrics, ResourceStatus } from '../../types/emergency';

export interface FleetDrawerProps {
  resources: Resource[];
  hospitals: Hospital[];
  metrics?: WorldMetrics;
  selectedResourceId?: string | null;
  onSelectResource?: (resource: Resource) => void;
}

export const FleetDrawer: React.FC<FleetDrawerProps> = ({
  resources,
  hospitals,
  metrics = {
    activeIncidents: 3,
    availableResources: resources.filter((r) => r.status === 'AVAILABLE' || r.status === 'IDLE').length,
    totalFleet: resources.length,
    avgResponseTimeMin: 4.2,
  },
  selectedResourceId,
  onSelectResource,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const getHospitalName = (baseHospitalId?: string): string => {
    if (!baseHospitalId) return 'Metro Staging Hub';
    const h = hospitals.find((hosp) => hosp.id === baseHospitalId);
    return h ? h.name.split(' ')[0] ?? 'Hospital' : 'Metro Hub';
  };

  /**
   * Domain-specific vehicle iconography & aesthetic styling
   */
  const getResourceVisuals = (resource: Resource) => {
    switch (resource.type) {
      case 'AMBULANCE':
        return {
          icon: <Ambulance className="w-4 h-4 text-emerald-400" />,
          badgeLabel: 'ALS / BLS AMBULANCE',
          badgeClass: 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300',
          accentBorder: 'hover:border-emerald-500/80',
          selectedBorder: 'border-emerald-400 glow-emerald ring-1 ring-emerald-400',
        };

      case 'FIRE_TRUCK':
        return {
          icon: <Flame className="w-4 h-4 text-orange-400" />,
          badgeLabel: 'FIRE ENGINE / TANKER',
          badgeClass: 'bg-orange-950/80 border-orange-500/80 text-orange-300',
          accentBorder: 'hover:border-orange-500/80',
          selectedBorder: 'border-orange-400 glow-amber ring-1 ring-orange-400',
        };

      case 'RESCUE_TEAM':
        return {
          icon: <LifeBuoy className="w-4 h-4 text-indigo-300" />,
          badgeLabel: 'SEARCH & RESCUE SQUAD',
          badgeClass: 'bg-indigo-950/80 border-indigo-500/80 text-indigo-300',
          accentBorder: 'hover:border-indigo-500/80',
          selectedBorder: 'border-indigo-400 glow-cyan ring-1 ring-indigo-400',
        };

      case 'POLICE_PATROL':
      default:
        return {
          icon: <Shield className="w-4 h-4 text-cyan-300" />,
          badgeLabel: 'TACTICAL PATROL',
          badgeClass: 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300',
          accentBorder: 'hover:border-cyan-500/80',
          selectedBorder: 'border-cyan-400 glow-cyan ring-1 ring-cyan-400',
        };
    }
  };

  const getStatusBadge = (status: ResourceStatus) => {
    switch (status) {
      case 'PATIENT_LOADED_EVACUATING':
      case 'TRANSPORTING_PATIENT':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/90 border border-emerald-400 text-emerald-300 flex items-center gap-1 shadow-[0_0_12px_rgba(16,185,129,0.6)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            EVACUATING (LEG 2)
          </span>
        );
      case 'ARRIVED_HOSPITAL':
      case 'PATIENT_DELIVERED':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/90 border border-emerald-400 text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            DELIVERED
          </span>
        );
      case 'DISPATCHED_TO_SCENE':
      case 'DISPATCHED':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950/90 border border-cyan-400 text-cyan-300 flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            DISPATCHED (LEG 1)
          </span>
        );
      case 'REROUTED':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/90 border border-amber-500 text-amber-400 flex items-center gap-1 glow-amber shadow-[0_0_12px_rgba(245,158,11,0.5)]">
            <Zap className="w-2.5 h-2.5 text-amber-400 animate-ping" />
            REROUTED
          </span>
        );
      case 'UNAVAILABLE':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-red-950/90 border border-red-500 text-red-400 flex items-center gap-1">
            <AlertCircle className="w-2.5 h-2.5 text-red-400" />
            OFFLINE
          </span>
        );
      case 'ON_SCENE_TRIAGING':
      case 'ON_SCENE':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/90 border border-emerald-500 text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            ON SCENE
          </span>
        );
      case 'MISSION_RESOLVED':
      case 'AVAILABLE':
      case 'IDLE':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-900 border border-slate-700 text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            AVAILABLE
          </span>
        );
    }
  };

  const deployedCount = resources.filter(
    (r) =>
      r.status === 'DISPATCHED' ||
      r.status === 'DISPATCHED_TO_SCENE' ||
      r.status === 'REROUTED' ||
      r.status === 'ON_SCENE' ||
      r.status === 'ON_SCENE_TRIAGING' ||
      r.status === 'TRANSPORTING_PATIENT' ||
      r.status === 'PATIENT_LOADED_EVACUATING'
  ).length;
  const unavailableCount = resources.filter((r) => r.status === 'UNAVAILABLE').length;
  const idleCount = resources.filter(
    (r) => r.status === 'IDLE' || r.status === 'AVAILABLE' || r.status === 'MISSION_RESOLVED'
  ).length;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed right-4 top-18 bottom-56 z-20 pointer-events-auto select-none transition-all duration-300 ease-in-out ${
        isHovered ? 'w-[380px]' : 'w-14'
      }`}
    >
      <div className="w-full h-full rounded-2xl tactical-glass border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Collapsed Strip */}
        {!isHovered && (
          <div className="w-full h-full py-4 flex flex-col items-center justify-between text-slate-400 cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/80 text-cyan-400">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-300">
                {deployedCount}/{resources.length}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5 py-4">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {unavailableCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />}
            </div>

            <div className="writing-mode-vertical text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1 rotate-180">
              <span>FLEET</span>
              <ChevronLeft className="w-3 h-3 text-cyan-400" />
            </div>
          </div>
        )}

        {/* Expanded Content */}
        {isHovered && (
          <div className="w-full h-full flex flex-col">
            {/* Header & Gauge */}
            <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/60">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-100">
                    Fleet Telemetry & Deployment
                  </span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/80 text-cyan-400">
                  {metrics.availableResources}/{metrics.totalFleet} Avail ({deployedCount} Deployed)
                </span>
              </div>

              {/* Progress Utilization Meter */}
              <div className="w-full bg-slate-950 rounded-full h-2 flex overflow-hidden border border-slate-800">
                <div
                  className="bg-cyan-500 h-full transition-all duration-300"
                  style={{ width: `${(deployedCount / (resources.length || 1)) * 100}%` }}
                />
                <div
                  className="bg-red-500 h-full transition-all duration-300"
                  style={{ width: `${(unavailableCount / (resources.length || 1)) * 100}%` }}
                />
                <div
                  className="bg-slate-700 h-full transition-all duration-300"
                  style={{ width: `${(idleCount / (resources.length || 1)) * 100}%` }}
                />
              </div>

              {/* Gauge legend */}
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Deployed ({deployedCount})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Idle ({idleCount})
                </span>
                {unavailableCount > 0 && (
                  <span className="flex items-center gap-1 text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Offline ({unavailableCount})
                  </span>
                )}
              </div>
            </div>

            {/* Units Scrollable List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {resources.map((resource) => {
                const isSelected = selectedResourceId === resource.id;
                const visual = getResourceVisuals(resource);

                return (
                  <div
                    key={resource.id}
                    onClick={() => onSelectResource?.(resource)}
                    className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                      isSelected
                        ? `bg-slate-900/95 ${visual.selectedBorder}`
                        : `bg-slate-900/70 hover:bg-slate-900/90 border-slate-800 ${visual.accentBorder}`
                    }`}
                  >
                    {/* Header Row: Unit Call-sign + Status */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                          {visual.icon}
                        </div>
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-100 flex items-center gap-1.5">
                            <span>{resource.name}</span>
                          </div>
                          <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                            <span className="text-cyan-400 font-bold">{resource.id}</span>
                            <span>•</span>
                            <span className="text-[8.5px] text-slate-400">{visual.badgeLabel}</span>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(resource.status)}
                    </div>

                    {/* Operational Details */}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono">
                      {/* ETA & Distance */}
                      <div className="flex flex-col gap-0.5 text-slate-300">
                        <div className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>
                            ETA:{' '}
                            {resource.currentEtaMinutes !== undefined ? (
                              <span className="text-cyan-400 font-bold">
                                {resource.currentEtaMinutes}m
                              </span>
                            ) : (
                              <span className="text-slate-500">N/A</span>
                            )}
                          </span>
                        </div>
                        {resource.distanceRemainingKm !== undefined && (
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 pl-4">
                            <Navigation className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                            <span>Rem:</span>
                            <span className="text-emerald-400 font-bold">{resource.distanceRemainingKm}km</span>
                          </div>
                        )}
                      </div>

                      {/* Base Facility */}
                      <div className="flex items-center gap-1 text-slate-400 truncate self-start">
                        <HospitalIcon className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-slate-500">Base:</span>
                        <span className="text-slate-300 truncate">
                          {getHospitalName(resource.baseHospitalId)}
                        </span>
                      </div>
                    </div>

                    {/* Assigned Target Call */}
                    {resource.assignedIncidentId && (
                      <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                        <span className="flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5 text-amber-400" />
                          Target Call: #{resource.assignedIncidentId}
                        </span>
                        <span className="text-[8px] text-amber-400 font-semibold">Active Dispatch</span>
                      </div>
                    )}

                    {/* Traffic Status Indicator */}
                    {resource.trafficStatus === 'REROUTED_BYPASS' ? (
                      <div className="mt-1.5 px-2 py-1 rounded bg-emerald-950/80 border border-emerald-500/70 text-[9px] font-mono text-emerald-300 flex items-center justify-between shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                        <span className="flex items-center gap-1 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          ✅ Bypass Active
                        </span>
                        <span className="text-emerald-400 font-black">-{resource.trafficSavingsMinutes ?? '8.8'}m saved</span>
                      </div>
                    ) : resource.trafficStatus === 'BOTTLENECK' ? (
                      <div className="mt-1.5 px-2 py-1 rounded bg-red-950/80 border border-red-500/70 text-[9px] font-mono text-red-300 flex items-center justify-between animate-pulse">
                        <span className="flex items-center gap-1 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                          ⚠️ Traffic Gridlock
                        </span>
                        <span className="text-red-400 font-black">+{resource.trafficDelayMinutes ?? '10'}m delay</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
