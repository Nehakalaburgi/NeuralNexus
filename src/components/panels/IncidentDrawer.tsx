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
          icon: <Flame className="w-4 h-4 text-orange-400 animate-pulse" />,
          badge: (
            <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-black bg-gradient-to-r from-orange-950 to-red-950 border border-orange-500 text-orange-300 tracking-wider flex items-center gap-1 glow-amber shadow-[0_0_12px_rgba(249,115,22,0.5)]">
              <Flame className="w-3 h-3 text-orange-400" />
              FIRE S{incident.severity}
            </span>
          ),
          accentBorder: 'hover:border-orange-500/80',
          selectedBorder: 'border-orange-400 glow-amber ring-1 ring-orange-400',
        };

      case 'CRASH':
        return {
          icon: <AlertOctagon className="w-4 h-4 text-red-400 animate-pulse" />,
          badge: (
            <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-black bg-red-950/90 border border-red-500 text-red-400 tracking-wider flex items-center gap-1 glow-crimson shadow-[0_0_15px_rgba(239,68,68,0.6)]">
              <AlertOctagon className="w-3 h-3 text-red-400" />
              CRITICAL S5
            </span>
          ),
          accentBorder: 'hover:border-red-500/80',
          selectedBorder: 'border-red-500 glow-crimson ring-1 ring-red-500',
        };

      case 'CARDIAC':
        return {
          icon: <HeartPulse className="w-4 h-4 text-rose-400 animate-pulse" />,
          badge: (
            <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-rose-950/90 border border-rose-500 text-rose-300 tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
              <HeartPulse className="w-3 h-3 text-rose-400" />
              CARDIAC S{incident.severity}
            </span>
          ),
          accentBorder: 'hover:border-rose-500/80',
          selectedBorder: 'border-rose-400 glow-cyan ring-1 ring-rose-400',
        };

      case 'RESCUE':
      case 'GENERAL':
      default:
        return {
          icon: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
          badge: (
            <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-amber-950/90 border border-amber-500 text-amber-300 tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              URGENT S{incident.severity}
            </span>
          ),
          accentBorder: 'hover:border-amber-500/80',
          selectedBorder: 'border-amber-400 glow-amber ring-1 ring-amber-400',
        };
    }
  };

  const criticalCount = incidents.filter((i) => i.severity === 5).length;
  const urgentCount = incidents.filter((i) => i.severity >= 3 && i.severity < 5).length;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed left-4 top-18 bottom-6 z-20 pointer-events-auto select-none transition-all duration-300 ease-in-out ${
        isHovered ? 'w-[400px]' : 'w-14'
      }`}
    >
      <div className="w-full h-full rounded-2xl tactical-glass border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Collapsed Indicator Strip */}
        {!isHovered && (
          <div className="w-full h-full py-4 flex flex-col items-center justify-between text-slate-400 cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              <div className="relative p-2 rounded-xl bg-red-950/80 border border-red-500/80 text-red-400 animate-pulse">
                <ShieldAlert className="w-5 h-5" />
                {incidents.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                    {incidents.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-300">
                {incidents.length}
              </span>
            </div>

            {/* Severity Pill Dots */}
            <div className="flex flex-col items-center gap-1.5 py-4">
              {criticalCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />}
              {urgentCount > 0 && <span className="w-2 h-2 rounded-full bg-orange-400" />}
              <span className="w-2 h-2 rounded-full bg-rose-400" />
            </div>

            <div className="writing-mode-vertical text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1 rotate-180">
              <span>INCIDENTS</span>
              <ChevronRight className="w-3 h-3 text-cyan-400" />
            </div>
          </div>
        )}

        {/* Expanded Panel Content */}
        {isHovered && (
          <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-100">
                  Active Emergency Calls
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/80 text-red-400">
                {incidents.length} Active Incidents
              </span>
            </div>

            {/* Incident Cards Scrollable Stream */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {incidents.map((incident) => {
                const isSelected = selectedIncidentId === incident.id;
                const hospital = getHospital(incident.targetHospitalId);
                const visual = getIncidentHeaderVisuals(incident);

                // Assigned unit IDs array
                const assignedUnits = incident.assignedResourceIds && incident.assignedResourceIds.length > 0
                  ? incident.assignedResourceIds
                  : incident.assignedResourceId
                    ? incident.assignedResourceId.split(',').map((s) => s.trim())
                    : [];

                return (
                  <div
                    key={incident.id}
                    onClick={() => onSelectIncident(incident)}
                    className={`p-3 rounded-xl transition-all duration-200 cursor-pointer border ${
                      isSelected
                        ? `bg-slate-900/95 ${visual.selectedBorder}`
                        : `bg-slate-900/70 hover:bg-slate-900/90 border-slate-800 ${visual.accentBorder}`
                    }`}
                  >
                    {/* Header Row: ID + Category/Severity Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-slate-950 border border-slate-800">
                          {visual.icon}
                        </div>
                        <span className="text-xs font-mono font-black text-cyan-400">
                          #{incident.id}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400">
                          {incident.status}
                        </span>
                      </div>
                      {visual.badge}
                    </div>

                    {/* Incident Title */}
                    <h4 className="text-xs font-bold text-slate-100 mb-1.5 leading-snug">
                      {incident.title}
                    </h4>

                    {/* Location Address */}
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-400 mb-2 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{incident.location.address}</span>
                    </div>

                    {/* Description */}
                    {incident.description && (
                      <p className="text-[10px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 mb-2 leading-relaxed">
                        {incident.description}
                      </p>
                    )}

                    {/* Required Protocol Resources Pills */}
                    <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                      <span className="text-[9px] font-mono text-slate-500">Required:</span>
                      {incident.requiredResources.map((reqType) => {
                        if (reqType === 'FIRE_TRUCK') {
                          return (
                            <span key={reqType} className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-orange-950/80 border border-orange-500/60 text-orange-300 flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5 text-orange-400" />
                              FIRE ENGINE
                            </span>
                          );
                        }
                        if (reqType === 'AMBULANCE') {
                          return (
                            <span key={reqType} className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 flex items-center gap-1">
                              <Ambulance className="w-2.5 h-2.5 text-cyan-400" />
                              AMBULANCE
                            </span>
                          );
                        }
                        return (
                          <span key={reqType} className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-indigo-950/80 border border-indigo-500/60 text-indigo-300 flex items-center gap-1">
                            <ShieldAlert className="w-2.5 h-2.5 text-indigo-400" />
                            RESCUE SQUAD
                          </span>
                        );
                      })}
                    </div>

                    {/* Assignment & Hospital Details */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono">
                      {/* Assigned Resources List */}
                      <div className="flex flex-col gap-1 text-slate-300">
                        <span className="text-[9px] text-slate-500 flex items-center gap-1">
                          <Truck className="w-3 h-3 text-cyan-400 shrink-0" />
                          Assigned Units:
                        </span>
                        {assignedUnits.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {assignedUnits.map((uId) => {
                              const resObj = getResourceDetails(uId);
                              return (
                                <div
                                  key={uId}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center justify-between gap-1.5 ${
                                    uId.startsWith('FIRE')
                                      ? 'bg-orange-950/80 border-orange-500/80 text-orange-300'
                                      : uId.startsWith('RESCUE')
                                        ? 'bg-indigo-950/80 border-indigo-500/80 text-indigo-300'
                                        : 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
                                  }`}
                                >
                                  <span className="flex items-center gap-1">
                                    {uId.startsWith('AMB') && <Ambulance className="w-2.5 h-2.5 text-emerald-400" />}
                                    {uId.startsWith('FIRE') && <Flame className="w-2.5 h-2.5 text-orange-400" />}
                                    {uId.startsWith('RESCUE') && <ShieldAlert className="w-2.5 h-2.5 text-indigo-400" />}
                                    {uId}
                                  </span>
                                  {resObj?.trafficStatus === 'REROUTED_BYPASS' ? (
                                    <span className="text-[7.5px] font-mono text-emerald-300 font-bold bg-emerald-950 px-1 py-0.2 rounded border border-emerald-500/70">
                                      ✅ Bypass -{resObj.trafficSavingsMinutes ?? '8.8'}m
                                    </span>
                                  ) : resObj?.trafficStatus === 'BOTTLENECK' ? (
                                    <span className="text-[7.5px] font-mono text-red-300 font-bold bg-red-950 px-1 py-0.2 rounded border border-red-500/70 animate-pulse">
                                      ⚠️ Delay +{resObj.trafficDelayMinutes ?? '10'}m
                                    </span>
                                  ) : resObj?.currentEtaMinutes !== undefined ? (
                                    <span className="text-[8px] font-mono text-cyan-300 font-semibold">
                                      {resObj.currentEtaMinutes}m{resObj.distanceRemainingKm ? ` • ${resObj.distanceRemainingKm}km` : ''}
                                    </span>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-amber-400 font-bold text-[9px]">Pending Dispatch</span>
                        )}
                      </div>

                      {/* Target Hospital */}
                      <div className="flex flex-col gap-1 text-slate-300">
                        <span className="text-[9px] text-slate-500 flex items-center gap-1">
                          <HospitalIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          Trauma Center:
                        </span>
                        <span className="truncate text-[9.5px] font-semibold text-slate-200" title={hospital?.name}>
                          {hospital ? hospital.name.split(' ')[0] : 'Trauma Hub'}
                        </span>
                      </div>
                    </div>

                    {/* Footer: Reported Time & Focus Map CTA */}
                    <div className="mt-2.5 flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1.5 border-t border-slate-800/40">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span>{incident.reportedAt}</span>
                      </div>
                      <span className="text-cyan-400 font-semibold group-hover:underline">
                        Focus on Map →
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
