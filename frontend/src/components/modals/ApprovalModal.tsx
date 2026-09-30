import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  ShieldAlert,
  Cpu,
  Zap,
} from 'lucide-react';
import { PendingApproval } from '../../types/emergency';

export interface ApprovalModalProps {
  pendingApproval?: PendingApproval | null;
  isOpen?: boolean;
  incidentId?: string;
  recommendedResourceId?: string;
  justification?: string;
  onApprove: () => void;
  onReject: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  pendingApproval,
  isOpen,
  incidentId: propIncidentId,
  recommendedResourceId: propResourceId,
  justification: propJustification,
  onApprove,
  onReject,
}) => {
  // Support both object and flat prop interfaces
  const isVisible = isOpen !== undefined ? isOpen : Boolean(pendingApproval);
  if (!isVisible) return null;

  const incidentId = pendingApproval?.incidentId || propIncidentId || 'INC-03';
  const incidentTitle = pendingApproval?.incidentTitle || incidentId;
  const previousIncidentTitle = pendingApproval?.previousIncidentTitle || 'Acute Cardiac Distress (Koramangala 5th Block)';
  const resourceId = pendingApproval?.resourceId || propResourceId || 'AMB-01';
  const resourceName = pendingApproval?.resourceName || resourceId;
  const justification =
    pendingApproval?.rationale ||
    propJustification ||
    'Primary unit AMB-02 disabled. Severe traffic bottleneck on primary arterial. Diverting AMB-01 via bypass corridor saves 11.4 mins for critical Level 5 crash.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border-2 border-red-500/50 bg-slate-900/95 p-6 shadow-2xl shadow-red-950/60 backdrop-blur-xl transition-all">
        {/* Glowing Ambient Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-red-500 to-rose-600 animate-pulse" />

        {/* Modal Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] shrink-0">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-slate-950">
                HITL Gate Active
              </span>
              <span className="text-xs text-red-400 font-mono font-bold">SEV-5 CRITICAL PREEMPTION</span>
            </div>
            <h2 className="text-lg font-black text-white mt-1 tracking-wide">
              Dynamic Resource Reallocation Required
            </h2>
          </div>
        </div>

        {/* Allocation Flow Card */}
        <div className="mb-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5 font-mono">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Multi-Agent Proposed Diversion
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <div className="flex-1 rounded-lg border border-slate-800 bg-slate-900/80 p-2.5 text-center">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Reallocate Unit</div>
              <div className="font-bold text-cyan-400 text-sm font-mono mt-0.5">{resourceName}</div>
              <div className="text-[9px] text-slate-500 font-mono mt-0.5">Preempting: {previousIncidentTitle}</div>
            </div>

            <div className="flex flex-col items-center shrink-0">
              <ArrowRight className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="text-[9px] text-amber-400 font-mono font-bold">BYPASS</span>
            </div>

            <div className="flex-1 rounded-lg border border-red-500/30 bg-red-950/30 p-2.5 text-center">
              <div className="text-[10px] text-red-400 font-mono uppercase">Target Scene</div>
              <div className="font-bold text-rose-300 text-sm font-mono mt-0.5">{incidentTitle}</div>
              <div className="text-[9px] text-red-400 font-mono mt-0.5">Trauma Entrapment</div>
            </div>
          </div>
        </div>

        {/* AI Rationale & Telemetry */}
        <div className="mb-6 space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Gemini Agent Rationale & Justification
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-mono">
              "{justification}"
            </p>
          </div>

          {/* Tradeoff Metric Badges */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[9px] text-slate-400 font-mono">GOLDEN HOUR GAIN</div>
                <div className="font-bold text-emerald-400 font-mono">+11.4 min Saved</div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-[9px] text-slate-400 font-mono">TARGET ETA</div>
                <div className="font-bold text-cyan-400 font-mono">3.2 min to Scene</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
          <button
            onClick={onReject}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-xs font-mono font-bold text-slate-300 hover:text-red-300 transition-colors cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject / Keep Original</span>
          </button>

          <button
            onClick={onApprove}
            type="button"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-mono font-black text-slate-950 shadow-lg shadow-emerald-950/50 transition-all border border-emerald-400/40 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>Authorize Reallocation</span>
          </button>
        </div>
      </div>
    </div>
  );
};