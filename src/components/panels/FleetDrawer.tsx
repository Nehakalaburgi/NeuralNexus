/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * FleetDrawer: Right Hover-Expandable Fleet Telemetry & Resource Gauges Overlay
 * Provides real-time unit status, deployment gauges, and interactive vehicle focus.
 */

import React, { useState } from 'react';
import {
  Truck,
  Flame,
  Shield,
  Clock,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Activity,
  Zap,
} from 'lucide-react';
import { Resource, Hospital, WorldMetrics, ResourceType, ResourceStatus } from '../../types/emergency';

export interface FleetDrawerProps {
  resources: Resource[];
  hospitals: Hospital[];
  metrics: WorldMetrics;
  selectedResourceId?: string | null;
  onSelectResource: (resource: Resource) => void;
}

export const FleetDrawer: React.FC<FleetDrawerProps> = ({
  resources,
  hospitals,
  metrics,
  selectedResourceId,
  onSelectResource,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const getHospitalName = (baseHospitalId?: string): string => {
    if (!baseHospitalId) return 'Metro Staging Hub';
    const h = hospitals.find((hosp) => hosp.id === baseHospitalId);
    return h ? h.name.split(' ')[0] ?? 'Hospital' : 'Metro Hub';
  };

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case 'AMBULANCE':
        return <Activity className="w-4 h-4 text-cyan-400" />;
      case 'FIRE_TRUCK':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'RESCUE_TEAM':
        return <Shield className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getStatusBadge = (status: ResourceStatus) => {
    switch (status) {
      case 'DISPATCHED':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950/90 border border-cyan-500 text-cyan-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            DISPATCHED
          </span>
        );
      case 'REROUTED':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/90 border border-amber-500 text-amber-400 flex items-center gap-1 glow-amber">
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
      case 'ON_SCENE':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/90 border border-emerald-500 text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            ON SCENE
          </span>
        );
      case 'IDLE':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-900 border border-slate-700 text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            STAGED IDLE
          </span>
        );
    }
  };

  const deployedCount = resources.filter((r) => r.status === 'DISPATCHED' || r.status === 'REROUTED' || r.status === 'ON_SCENE').length;
  const unavailableCount = resources.filter((r) => r.status === 'UNAVAILABLE').length;
  const idleCount = resources.filter((r) => r.status === 'IDLE').length;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed right-4 top-18 bottom-56 z-20 pointer-events-auto select-none transition-all duration-300 ease-in-out ${
        isHovered ? 'w-[360px]' : 'w-14'
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
                    Fleet Inventory & Telemetry
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

                return (
                  <div
                    key={resource.id}
                    onClick={() => onSelectResource(resource)}
                    className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-900/95 border-cyan-400 glow-cyan ring-1 ring-cyan-400'
                        : 'bg-slate-900/70 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header Row: Unit Call-sign + Status */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded bg-slate-950 border border-slate-800">
                          {getTypeIcon(resource.type)}
                        </div>
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-100">
                            {resource.name}
                          </div>
                          <div className="text-[9px] font-mono text-slate-500">
                            ID: {resource.id}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(resource.status)}
                    </div>

                    {/* Operational Details */}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono">
                      {/* ETA */}
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

                      {/* Base Facility */}
                      <div className="flex items-center gap-1 text-slate-400 truncate">
                        <span className="text-slate-500">Base:</span>
                        <span className="text-slate-300 truncate">
                          {getHospitalName(resource.baseHospitalId)}
                        </span>
                      </div>
                    </div>

                    {/* Assigned Target Call */}
                    {resource.assignedIncidentId && (
                      <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                        <span>Target: #{resource.assignedIncidentId}</span>
                        <span className="text-[8px] text-amber-400/80">Active Dispatch</span>
                      </div>
                    )}
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
