/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * ApprovalModal: Human-In-The-Loop (HITL) Critical Reallocation Gate Dialog
 * Displays clinical rationale, preemption comparison, and decision action buttons.
 */

import React from 'react';
import {
  ShieldAlert,
  Flame,
  ArrowRight,
  Clock,
  Truck,
  Ambulance,
  CheckCircle2,
  XCircle,
  BrainCircuit,
  Zap,
} from 'lucide-react';
import { PendingApproval } from '../../types/emergency';

export interface ApprovalModalProps {
  pendingApproval: PendingApproval | null;
  onApprove: () => void;
  onReject: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  pendingApproval,
  onApprove,
  onReject,
}) => {
  if (!pendingApproval) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl tactical-glass border-2 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)] overflow-hidden flex flex-col">
        {/* Top Glowing Red Accent Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800/90 bg-red-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-900/60 border border-red-400 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.6)]">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-red-600 text-slate-950 tracking-wider uppercase">
                  HITL Gate: {pendingApproval.id}
                </span>
                <span className="text-[10px] font-mono text-red-400 font-bold tracking-widest uppercase">
                  HIGH-PRIORITY DIVERSION
                </span>
              </div>
              <h2 className="text-base font-black text-slate-100 tracking-wide mt-0.5">
                CRITICAL UNIT REALLOCATION REQUIRED
              </h2>
            </div>
          </div>

          <div className="text-right font-mono text-[10px] text-slate-400 hidden sm:block">
            <div>Timestamp: {pendingApproval.timestamp}</div>
            <div className="text-red-400 font-bold">Severity 5 Preemption</div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Unit Diversion Comparison Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 text-cyan-400">
                {pendingApproval.resourceId.startsWith('AMB') ? (
                  <Ambulance className="w-4 h-4" />
                ) : (
                  <Truck className="w-4 h-4" />
                )}
                <span>Diverting Unit: {pendingApproval.resourceName} ({pendingApproval.resourceId})</span>
              </div>
              <span className="text-amber-400">Time-Critical Re-Route</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-11 items-center gap-3">
              {/* Source / Preempted Call */}
              <div className="sm:col-span-5 p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Preempted Call</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300">
                    SEV 2 MODERATE
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                  {pendingApproval.previousIncidentTitle ?? 'Acute Cardiac Distress (Koramangala 5th Block)'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Action: Queueing secondary backup unit
                </div>
              </div>

              {/* Arrow Connector */}
              <div className="sm:col-span-1 flex items-center justify-center">
                <div className="p-1.5 rounded-full bg-red-950 border border-red-500/80 text-red-400">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Target / High Severity Emergency */}
              <div className="sm:col-span-5 p-3 rounded-lg bg-red-950/40 border border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono text-red-400 uppercase font-bold">Target Scene</span>
                  <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-red-600 text-slate-950">
                    SEV 5 CRITICAL
                  </span>
                </div>
                <div className="text-xs font-bold text-red-200 line-clamp-1">
                  {pendingApproval.incidentTitle}
                </div>
                <div className="text-[10px] text-red-300 mt-1 font-mono font-semibold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-400 shrink-0" />
                  <span>Immediate Trauma Entrapment</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gemini Command Agent Natural Language Justification */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-xs font-mono font-bold text-amber-300">
              <BrainCircuit className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Gemini Command Agent Reasoning Rationale:</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
              "{pendingApproval.rationale}"
            </p>
            <div className="mt-2 flex items-center gap-4 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <Clock className="w-3 h-3" />
                <span>Golden Hour Gain: +11.6 mins saved</span>
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <Zap className="w-3 h-3" />
                <span>Target ETA: 3.2 mins</span>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={onReject}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/50 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject / Keep Original Plan</span>
          </button>

          <button
            onClick={onApprove}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 border border-emerald-400 font-mono text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:shadow-[0_0_30px_rgba(16,185,129,0.8)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve Reallocation (Commit Route)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
