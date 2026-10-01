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
} from 'lucide-react';
import { Resource, Hospital, WorldMetrics, ResourceStatus } from '../../types/emergency';

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

  /**
   * Domain-specific vehicle iconography & aesthetic styling
   */
  const getResourceVisuals = (resource: Resource) => {
    switch (resource.type) {
      case 'AMBULANCE':
        return {
          icon: <Ambulance className="w-3.5 h-3.5 text-[#00F0FF]" />,
          badgeLabel: 'ALS / BLS AMBULANCE',
          accentBorder: 'hover:border-[#00F0FF]/60',
          selectedBorder: 'border-[#00F0FF] ring-1 ring-[#00F0FF]',
        };

      case 'FIRE_TRUCK':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-[#FF6B00]" />,
          badgeLabel: 'FIRE ENGINE / TANKER',
          accentBorder: 'hover:border-[#FF6B00]/60',
          selectedBorder: 'border-[#FF6B00] ring-1 ring-[#FF6B00]',
        };

      case 'RESCUE_TEAM':
        return {
          icon: <LifeBuoy className="w-3.5 h-3.5 text-[#C084FC]" />,
          badgeLabel: 'SEARCH & RESCUE SQUAD',
          accentBorder: 'hover:border-[#C084FC]/60',
          selectedBorder: 'border-[#C084FC] ring-1 ring-[#C084FC]',
        };
    }
  };

  const getStatusBadge = (status: ResourceStatus) => {
    switch (status) {
      case 'DISPATCHED':
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-[#081829] border border-[#00F0FF]/60 text-[#00F0FF] flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#00F0FF] animate-pulse" />
            DISPATCHED
          </span>
        );
      case 'REROUTED':
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-[#1f1604] border border-[#F59E0B] text-[#FCD34D] flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-[#F59E0B] animate-ping" />
            REROUTED
          </span>
        );
      case 'UNAVAILABLE':
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-[#1e070a] border border-[#FF2A3B] text-[#FF6B6B] flex items-center gap-1">
            <AlertCircle className="w-2.5 h-2.5 text-[#FF2A3B]" />
            OFFLINE
          </span>
        );
      case 'ON_SCENE':
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-[#082017] border border-[#10B981] text-[#6EE7B7] flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-[#10B981]" />
            ON SCENE
          </span>
        );
      case 'IDLE':
      default:
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-[#0D1017] border border-[#1E2532] text-[#7A8394] flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#4A5568]" />
            STAGED
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
      className={`fixed right-4 top-20 bottom-60 z-20 pointer-events-auto select-none transition-all duration-300 ease-in-out ${
        isHovered ? 'w-[390px]' : 'w-12'
      }`}
    >
      <div className="w-full h-full tactical-surface-glass border border-[#1E2532] corner-crosshair shadow-2xl overflow-hidden flex flex-col">
        {/* Collapsed Strip */}
        {!isHovered && (
          <div className="w-full h-full py-3.5 flex flex-col items-center justify-between text-[#7A8394] cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-[#081829] border border-[#00F0FF]/50 text-[#00F0FF]">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-bold text-[#EDECE8]">
                {deployedCount}/{resources.length}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5 py-2">
              <span className="w-1.5 h-1.5 bg-[#00F0FF]" />
              <span className="w-1.5 h-1.5 bg-[#FF6B00]" />
              <span className="w-1.5 h-1.5 bg-[#10B981]" />
              {unavailableCount > 0 && <span className="w-1.5 h-1.5 bg-[#FF2A3B] animate-ping" />}
            </div>

            {/* Clean Upright Vertical Label */}
            <div className="flex-1 flex flex-col items-center justify-center my-2 overflow-hidden">
              <span className="[writing-mode:vertical-rl] text-[10px] font-mono font-bold tracking-[0.25em] text-[#7A8394] uppercase whitespace-nowrap">
                FLEET // UNITS
              </span>
            </div>

            <div className="p-1 text-[#00F0FF]">
              <ChevronLeft className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Expanded Content */}
        {isHovered && (
          <div className="w-full h-full flex flex-col">
            {/* Header & Gauge */}
            <div className="p-3 border-b border-[#1E2532] bg-[#0A0C10]/95">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#00F0FF]" />
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-[#EDECE8]">
                    FLEET TELEMETRY
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#081829] border border-[#00F0FF]/50 text-[#00F0FF]">
                  {metrics.availableResources}/{metrics.totalFleet} AVAIL
                </span>
              </div>

              {/* Progress Utilization Meter */}
              <div className="w-full bg-[#06080C] h-1.5 flex overflow-hidden border border-[#1E2532]">
                <div
                  className="bg-[#00F0FF] h-full transition-all duration-300"
                  style={{ width: `${(deployedCount / (resources.length || 1)) * 100}%` }}
                />
                <div
                  className="bg-[#FF2A3B] h-full transition-all duration-300"
                  style={{ width: `${(unavailableCount / (resources.length || 1)) * 100}%` }}
                />
                <div
                  className="bg-[#2A3447] h-full transition-all duration-300"
                  style={{ width: `${(idleCount / (resources.length || 1)) * 100}%` }}
                />
              </div>

              {/* Gauge legend */}
              <div className="flex items-center justify-between text-[9px] font-mono text-[#7A8394] mt-2">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#00F0FF]" /> DEPLOYED ({deployedCount})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#4A5568]" /> STAGED ({idleCount})
                </span>
                {unavailableCount > 0 && (
                  <span className="flex items-center gap-1 text-[#FF6B6B]">
                    <span className="w-1.5 h-1.5 bg-[#FF2A3B]" /> OFFLINE ({unavailableCount})
                  </span>
                )}
              </div>
            </div>

            {/* Units Scrollable List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 bg-[#06080C]/80">
              {resources.map((resource) => {
                const isSelected = selectedResourceId === resource.id;
                const visual = getResourceVisuals(resource);

                return (
                  <div
                    key={resource.id}
                    onClick={() => onSelectResource(resource)}
                    className={`p-2.5 transition-all duration-150 cursor-pointer border ${
                      isSelected
                        ? `bg-[#131722] ${visual.selectedBorder}`
                        : `bg-[#0B0E15] hover:bg-[#10141E] border-[#1E2532] ${visual.accentBorder}`
                    }`}
                  >
                    {/* Header Row: Unit Call-sign + Status */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#13171F] border border-[#1E2532]">
                          {visual.icon}
                        </div>
                        <div>
                          <div className="font-sans text-xs font-bold text-[#EDECE8] flex items-center gap-1.5">
                            <span>{resource.name}</span>
                          </div>
                          <div className="text-[9px] font-mono text-[#7A8394] flex items-center gap-1">
                            <span className="text-[#00F0FF] font-bold">{resource.id}</span>
                            <span>•</span>
                            <span className="text-[8.5px] uppercase">{visual.badgeLabel}</span>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(resource.status)}
                    </div>

                    {/* Operational Details */}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#1E2532] text-[10px] font-mono">
                      {/* ETA & Distance */}
                      <div className="flex flex-col gap-0.5 text-[#A0AAB8]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#00F0FF] shrink-0" />
                          <span>
                            ETA:{' '}
                            {resource.currentEtaMinutes !== undefined ? (
                              <span className="text-[#00F0FF] font-bold">
                                {resource.currentEtaMinutes}m
                              </span>
                            ) : (
                              <span className="text-[#4A5568]">N/A</span>
                            )}
                          </span>
                        </div>
                        {resource.distanceRemainingKm !== undefined && (
                          <div className="flex items-center gap-1 text-[9px] text-[#7A8394] pl-4">
                            <Navigation className="w-2.5 h-2.5 text-[#10B981] shrink-0" />
                            <span>REM:</span>
                            <span className="text-[#6EE7B7] font-bold">{resource.distanceRemainingKm}km</span>
                          </div>
                        )}
                      </div>

                      {/* Base Facility */}
                      <div className="flex items-center gap-1 text-[#7A8394] truncate self-start">
                        <HospitalIcon className="w-3 h-3 text-[#10B981] shrink-0" />
                        <span className="text-[#4A5568] uppercase text-[9px]">BASE:</span>
                        <span className="text-[#EDECE8] truncate text-[9.5px]">
                          {getHospitalName(resource.baseHospitalId)}
                        </span>
                      </div>
                    </div>

                    {/* Assigned Target Call */}
                    {resource.assignedIncidentId && (
                      <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-[#FCD34D] bg-[#1a1202] px-2 py-0.5 border border-[#F59E0B]/40">
                        <span className="flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5 text-[#F59E0B]" />
                          CALL: #{resource.assignedIncidentId}
                        </span>
                        <span className="text-[8px] text-[#F59E0B] font-semibold uppercase">ACTIVE DISPATCH</span>
                      </div>
                    )}

                    {/* Traffic Status Indicator */}
                    {resource.trafficStatus === 'REROUTED_BYPASS' ? (
                      <div className="mt-1.5 px-2 py-1 bg-[#082017] border border-[#10B981]/60 text-[9px] font-mono text-[#6EE7B7] flex items-center justify-between">
                        <span className="flex items-center gap-1 font-bold">
                          <span className="w-1.5 h-1.5 bg-[#10B981] animate-pulse" />
                          BYPASS ACTIVE
                        </span>
                        <span className="text-[#34D399] font-bold">-{resource.trafficSavingsMinutes ?? '8.8'}m SAVED</span>
                      </div>
                    ) : resource.trafficStatus === 'BOTTLENECK' ? (
                      <div className="mt-1.5 px-2 py-1 bg-[#1e070a] border border-[#FF2A3B]/60 text-[9px] font-mono text-[#FF6B6B] flex items-center justify-between">
                        <span className="flex items-center gap-1 font-bold">
                          <span className="w-1.5 h-1.5 bg-[#FF2A3B] animate-ping" />
                          TRAFFIC GRIDLOCK
                        </span>
                        <span className="text-[#FF2A3B] font-bold">+{resource.trafficDelayMinutes ?? '10'}m DELAY</span>
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
