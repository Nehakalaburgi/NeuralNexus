/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * IncidentDrawer: Left Hover-Expandable Active Incident Overlay
 * Slides smoothly over Mapbox canvas without triggering canvas reflows or resizing.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  MapPin,
  Truck,
  Building2,
  Clock,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { Incident, Hospital, SeverityLevel } from '../../types/emergency';

export interface IncidentDrawerProps {
  incidents: Incident[];
  hospitals: Hospital[];
  selectedIncidentId?: string | null;
  onSelectIncident: (incident: Incident) => void;
}

export const IncidentDrawer: React.FC<IncidentDrawerProps> = ({
  incidents,
  hospitals,
  selectedIncidentId,
  onSelectIncident,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Helper: Find target hospital details
  const getHospital = (hospitalId?: string): Hospital | undefined => {
    if (!hospitalId) return undefined;
    return hospitals.find((h) => h.id === hospitalId);
  };

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 5:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-red-950/90 border border-red-500 text-red-400 tracking-wider flex items-center gap-1 glow-crimson">
            <Flame className="w-3 h-3 text-red-400 animate-pulse" />
            CRITICAL S5
          </span>
        );
      case 4:
      case 3:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/90 border border-amber-500 text-amber-400 tracking-wider flex items-center gap-1 glow-amber">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            URGENT S{severity}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/90 border border-cyan-500 text-cyan-300 tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            MODERATE S{severity}
          </span>
        );
    }
  };

  const criticalCount = incidents.filter((i) => i.severity === 5).length;
  const urgentCount = incidents.filter((i) => i.severity >= 3 && i.severity < 5).length;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed left-4 top-18 bottom-6 z-20 pointer-events-auto select-none transition-all duration-300 ease-in-out ${
        isHovered ? 'w-[380px]' : 'w-14'
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
              {urgentCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400" />}
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
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
                {incidents.length} Active
              </span>
            </div>

            {/* Incident Cards Scrollable Stream */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {incidents.map((incident) => {
                const isSelected = selectedIncidentId === incident.id;
                const hospital = getHospital(incident.targetHospitalId);

                return (
                  <div
                    key={incident.id}
                    onClick={() => onSelectIncident(incident)}
                    className={`p-3 rounded-xl transition-all duration-200 cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-900/95 border-cyan-400 glow-cyan ring-1 ring-cyan-400'
                        : 'bg-slate-900/70 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header Row: ID + Severity Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-black text-cyan-400">
                          #{incident.id}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400">
                          {incident.status}
                        </span>
                      </div>
                      {getSeverityBadge(incident.severity)}
                    </div>

                    {/* Incident Title */}
                    <h4 className="text-xs font-bold text-slate-100 mb-2 leading-snug">
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

                    {/* Assignment Details */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono">
                      {/* Resource Unit */}
                      <div className="flex items-center gap-1 text-slate-300">
                        <Truck className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">
                          {incident.assignedResourceId ? (
                            <span className="text-emerald-400 font-bold">
                              {incident.assignedResourceId}
                            </span>
                          ) : (
                            <span className="text-amber-400 font-bold">Unassigned</span>
                          )}
                        </span>
                      </div>

                      {/* Target Hospital */}
                      <div className="flex items-center gap-1 text-slate-300">
                        <Building2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate" title={hospital?.name}>
                          {hospital ? hospital.name.split(' ')[0] : 'Trauma Hub'}
                        </span>
                      </div>
                    </div>

                    {/* Footer: Reported Time & Interactive Map Hint */}
                    <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-slate-500">
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
