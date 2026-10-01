/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * IncidentDrawer: Left Hover-Expandable Active Incident Overlay
 * Slides smoothly over Mapbox canvas without triggering canvas reflows or resizing.
 * Enhanced with domain-specific incident site icons, multi-unit resource pills, and triage telemetry.
 */

import React, { useState } from 'react';
import {
  Flame,
  AlertOctagon,
  HeartPulse,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Truck,
  Ambulance,
  Hospital as HospitalIcon,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Incident, Hospital, Resource, RouteGeometry } from '../../types/emergency';
import { getIncidentCategory } from '../map/MapMarkers';

export interface IncidentDrawerProps {
  incidents: Incident[];
  hospitals: Hospital[];
  resources?: Resource[];
  routes?: RouteGeometry[];
  selectedIncidentId?: string | null;
  onSelectIncident: (incident: Incident) => void;
}

export const IncidentDrawer: React.FC<IncidentDrawerProps> = ({
  incidents,
  hospitals,
  resources = [],
  selectedIncidentId,
  onSelectIncident,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Helper: Find target hospital details
  const getHospital = (hospitalId?: string): Hospital | undefined => {
    if (!hospitalId) return undefined;
    return hospitals.find((h) => h.id === hospitalId);
  };

  // Helper: Find resource metrics
  const getResourceDetails = (resourceId: string): Resource | undefined => {
    return resources.find((r) => r.id === resourceId);
  };

  /**
   * Domain-specific incident header icon and styling badge
   */
  const getIncidentHeaderVisuals = (incident: Incident) => {
    const category = getIncidentCategory(incident);

    switch (category) {
      case 'FIRE':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-[#FF6B00]" />,
          badge: (
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-[#1f1105] border border-[#FF6B00]/70 text-[#FFA94D] tracking-wider flex items-center gap-1">
              <Flame className="w-2.5 h-2.5 text-[#FF6B00]" />
              FIRE // S{incident.severity}
            </span>
          ),
          accentBorder: 'hover:border-[#FF6B00]/70',
          selectedBorder: 'border-[#FF6B00] ring-1 ring-[#FF6B00]',
        };

      case 'CRASH':
        return {
          icon: <AlertOctagon className="w-3.5 h-3.5 text-[#FF2A3B]" />,
          badge: (
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-[#1e070a] border border-[#FF2A3B] text-[#FF6B6B] tracking-wider flex items-center gap-1">
              <AlertOctagon className="w-2.5 h-2.5 text-[#FF2A3B]" />
              CRITICAL // S5
            </span>
          ),
          accentBorder: 'hover:border-[#FF2A3B]/80',
          selectedBorder: 'border-[#FF2A3B] ring-1 ring-[#FF2A3B]',
        };

      case 'CARDIAC':
        return {
          icon: <HeartPulse className="w-3.5 h-3.5 text-[#F43F5E]" />,
          badge: (
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-[#1f0910] border border-[#F43F5E]/70 text-[#FDA4AF] tracking-wider flex items-center gap-1">
              <HeartPulse className="w-2.5 h-2.5 text-[#F43F5E]" />
              CARDIAC // S{incident.severity}
            </span>
          ),
          accentBorder: 'hover:border-[#F43F5E]/70',
          selectedBorder: 'border-[#F43F5E] ring-1 ring-[#F43F5E]',
        };

      case 'RESCUE':
      case 'GENERAL':
      default:
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />,
          badge: (
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-[#1c1303] border border-[#F59E0B]/70 text-[#FCD34D] tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5 text-[#F59E0B]" />
              URGENT // S{incident.severity}
            </span>
          ),
          accentBorder: 'hover:border-[#F59E0B]/70',
          selectedBorder: 'border-[#F59E0B] ring-1 ring-[#F59E0B]',
        };
    }
  };

  const criticalCount = incidents.filter((i) => i.severity === 5).length;
  const urgentCount = incidents.filter((i) => i.severity >= 3 && i.severity < 5).length;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed left-4 top-20 bottom-6 z-20 pointer-events-auto select-none transition-all duration-300 ease-in-out ${
        isHovered ? 'w-[410px]' : 'w-12'
      }`}
    >
      <div className="w-full h-full tactical-surface-glass border border-[#1E2532] corner-crosshair shadow-2xl overflow-hidden flex flex-col">
        {/* Collapsed Indicator Strip */}
        {!isHovered && (
          <div className="w-full h-full py-3.5 flex flex-col items-center justify-between text-[#7A8394] cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              <div className="relative p-2 bg-[#1A0A0D] border border-[#FF2A3B]/60 text-[#FF2A3B]">
                <ShieldAlert className="w-4 h-4" />
                {incidents.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FF2A3B] text-[#0A0C10] text-[8px] font-mono font-black flex items-center justify-center">
                    {incidents.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono font-bold text-[#EDECE8]">
                {incidents.length}
              </span>
            </div>

            {/* Severity Status Indicators */}
            <div className="flex flex-col items-center gap-1.5 py-2">
              {criticalCount > 0 && <span className="w-1.5 h-1.5 bg-[#FF2A3B] animate-ping" />}
              {urgentCount > 0 && <span className="w-1.5 h-1.5 bg-[#F59E0B]" />}
              <span className="w-1.5 h-1.5 bg-[#00F0FF]" />
            </div>

            {/* Clean Upright Vertical Label */}
            <div className="flex-1 flex flex-col items-center justify-center my-2 overflow-hidden">
              <span className="[writing-mode:vertical-rl] text-[10px] font-mono font-bold tracking-[0.25em] text-[#7A8394] uppercase whitespace-nowrap">
                INCIDENTS // QUEUE
              </span>
            </div>

            <div className="p-1 text-[#00F0FF]">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Expanded Panel Content */}
        {isHovered && (
          <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="p-3 border-b border-[#1E2532] flex items-center justify-between bg-[#0A0C10]/95">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#FF2A3B]" />
                <span className="font-display text-xs font-bold uppercase tracking-wider text-[#EDECE8]">
                  ACTIVE DISPATCH QUEUE
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#1E070A] border border-[#FF2A3B]/60 text-[#FF6B6B] uppercase">
                {incidents.length} ACTIVE
              </span>
            </div>

            {/* Incident Cards Scrollable Stream */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 bg-[#06080C]/80">
              {incidents.map((incident) => {
                const isSelected = selectedIncidentId === incident.id;
                const hospital = getHospital(incident.targetHospitalId);
                const visual = getIncidentHeaderVisuals(incident);

                const assignedUnits = incident.assignedResourceIds && incident.assignedResourceIds.length > 0
                  ? incident.assignedResourceIds
                  : incident.assignedResourceId
                    ? incident.assignedResourceId.split(',').map((s) => s.trim())
                    : [];

                return (
                  <div
                    key={incident.id}
                    onClick={() => onSelectIncident(incident)}
                    className={`p-3 transition-all duration-150 cursor-pointer border ${
                      isSelected
                        ? `bg-[#131722] ${visual.selectedBorder}`
                        : `bg-[#0B0E15] hover:bg-[#10141E] border-[#1E2532] ${visual.accentBorder}`
                    }`}
                  >
                    {/* Header Row: ID + Category/Severity Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-[#13171F] border border-[#1E2532]">
                          {visual.icon}
                        </div>
                        <span className="text-xs font-mono font-bold text-[#00F0FF]">
                          #{incident.id}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 border border-[#1E2532] text-[#7A8394] uppercase">
                          {incident.status}
                        </span>
                      </div>
                      {visual.badge}
                    </div>

                    {/* Incident Title */}
                    <h4 className="font-sans text-xs font-bold text-[#EDECE8] mb-1 leading-snug">
                      {incident.title}
                    </h4>

                    {/* Location Address */}
                    <div className="flex items-start gap-1.5 text-[10.5px] text-[#7A8394] mb-2 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-[#4A5568] shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{incident.location.address}</span>
                    </div>

                    {/* Description */}
                    {incident.description && (
                      <p className="text-[10px] text-[#A0AAB8] bg-[#07090E] p-2 border border-[#1E2532]/70 mb-2 leading-relaxed font-sans">
                        {incident.description}
                      </p>
                    )}

                    {/* Required Protocol Resources Pills */}
                    <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                      <span className="text-[9px] font-mono text-[#4A5568] uppercase">REQ:</span>
                      {incident.requiredResources.map((reqType) => {
                        if (reqType === 'FIRE_TRUCK') {
                          return (
                            <span key={reqType} className="px-1.5 py-0.5 text-[8.5px] font-mono font-bold uppercase bg-[#1f1105] border border-[#FF6B00]/50 text-[#FFA94D] flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5 text-[#FF6B00]" />
                              FIRE ENG
                            </span>
                          );
                        }
                        if (reqType === 'AMBULANCE') {
                          return (
                            <span key={reqType} className="px-1.5 py-0.5 text-[8.5px] font-mono font-bold uppercase bg-[#081829] border border-[#00F0FF]/50 text-[#67e8f9] flex items-center gap-1">
                              <Ambulance className="w-2.5 h-2.5 text-[#00F0FF]" />
                              AMBULANCE
                            </span>
                          );
                        }
                        return (
                          <span key={reqType} className="px-1.5 py-0.5 text-[8.5px] font-mono font-bold uppercase bg-[#161026] border border-[#a855f7]/50 text-[#d8b4fe] flex items-center gap-1">
                            <ShieldAlert className="w-2.5 h-2.5 text-[#c084fc]" />
                            RESCUE
                          </span>
                        );
                      })}
                    </div>

                    {/* Assignment & Hospital Details */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1E2532] text-[10px] font-mono">
                      {/* Assigned Resources List */}
                      <div className="flex flex-col gap-1 text-[#A0AAB8]">
                        <span className="text-[9px] text-[#4A5568] uppercase flex items-center gap-1">
                          <Truck className="w-3 h-3 text-[#00F0FF] shrink-0" />
                          UNITS:
                        </span>
                        {assignedUnits.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {assignedUnits.map((uId) => {
                              const resObj = getResourceDetails(uId);
                              return (
                                <div
                                  key={uId}
                                  className={`px-1.5 py-0.5 text-[9px] font-bold border flex items-center justify-between gap-1.5 ${
                                    uId.startsWith('FIRE')
                                      ? 'bg-[#1f1105] border-[#FF6B00]/60 text-[#FFA94D]'
                                      : uId.startsWith('RESCUE')
                                        ? 'bg-[#161026] border-[#a855f7]/60 text-[#d8b4fe]'
                                        : 'bg-[#082017] border-[#10b981]/60 text-[#6ee7b7]'
                                  }`}
                                >
                                  <span className="flex items-center gap-1 font-mono">
                                    {uId.startsWith('AMB') && <Ambulance className="w-2.5 h-2.5 text-[#34d399]" />}
                                    {uId.startsWith('FIRE') && <Flame className="w-2.5 h-2.5 text-[#FF6B00]" />}
                                    {uId.startsWith('RESCUE') && <ShieldAlert className="w-2.5 h-2.5 text-[#c084fc]" />}
                                    {uId}
                                  </span>
                                  {resObj?.trafficStatus === 'REROUTED_BYPASS' ? (
                                    <span className="text-[7.5px] font-mono text-[#34d399] font-bold bg-[#082017] px-1 py-0.2 border border-[#10b981]/70">
                                      BYPASS -{resObj.trafficSavingsMinutes ?? '8.8'}m
                                    </span>
                                  ) : resObj?.trafficStatus === 'BOTTLENECK' ? (
                                    <span className="text-[7.5px] font-mono text-[#FF6B6B] font-bold bg-[#1e070a] px-1 py-0.2 border border-[#FF2A3B]/70 animate-pulse">
                                      DELAY +{resObj.trafficDelayMinutes ?? '10'}m
                                    </span>
                                  ) : resObj?.currentEtaMinutes !== undefined ? (
                                    <span className="text-[8px] font-mono text-[#00F0FF] font-semibold">
                                      {resObj.currentEtaMinutes}m{resObj.distanceRemainingKm ? ` • ${resObj.distanceRemainingKm}km` : ''}
                                    </span>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[#F59E0B] font-bold text-[9px]">PENDING DISPATCH</span>
                        )}
                      </div>

                      {/* Target Hospital */}
                      <div className="flex flex-col gap-1 text-[#A0AAB8]">
                        <span className="text-[9px] text-[#4A5568] uppercase flex items-center gap-1">
                          <HospitalIcon className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                          TRAUMA HUB:
                        </span>
                        <span className="truncate text-[9.5px] font-semibold text-[#EDECE8]" title={hospital?.name}>
                          {hospital ? hospital.name.split(' ')[0] : 'Trauma Hub'}
                        </span>
                      </div>
                    </div>

                    {/* Footer: Reported Time & Focus Map CTA */}
                    <div className="mt-2.5 flex items-center justify-between text-[9px] font-mono text-[#4A5568] pt-1.5 border-t border-[#1E2532]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#4A5568]" />
                        <span>{incident.reportedAt}</span>
                      </div>
                      <span className="text-[#00F0FF] font-semibold hover:underline flex items-center gap-0.5">
                        FOCUS LOC →
                      </span>
                    </div>
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
