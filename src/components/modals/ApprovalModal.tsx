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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06080C]/90 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl tactical-surface-glass border-2 border-[#FF2A3B] corner-crosshair shadow-[0_0_50px_rgba(255,42,59,0.3)] overflow-hidden flex flex-col">
        {/* Top Caution Hazard Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF2A3B] via-[#F59E0B] to-[#FF2A3B]" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E2532] bg-[#1A0608]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-[#26080B] border border-[#FF2A3B] text-[#FF2A3B]">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black px-1.5 py-0.5 bg-[#FF2A3B] text-[#0A0C10] tracking-wider uppercase">
                  HITL GATE // {pendingApproval.id}
                </span>
                <span className="text-[10px] font-mono text-[#FF6B6B] font-bold tracking-widest uppercase">
                  HIGH-PRIORITY DIVERSION
                </span>
              </div>
              <h2 className="font-display text-sm sm:text-base font-extrabold text-[#EDECE8] tracking-wide mt-1 uppercase">
                CRITICAL UNIT REALLOCATION OVERRIDE
              </h2>
            </div>
          </div>

          <div className="text-right font-mono text-[9.5px] text-[#7A8394] hidden sm:block">
            <div>LOGGED: {pendingApproval.timestamp}</div>
            <div className="text-[#FF2A3B] font-bold">SEVERITY 5 PREEMPTION</div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh] bg-[#0A0C10]/95">
          {/* Unit Diversion Comparison Card */}
          <div className="p-3.5 bg-[#0D1017] border border-[#1E2532] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#7A8394] border-b border-[#1E2532] pb-2">
              <div className="flex items-center gap-1.5 text-[#00F0FF]">
                {pendingApproval.resourceId.startsWith('AMB') ? (
                  <Ambulance className="w-4 h-4" />
                ) : (
                  <Truck className="w-4 h-4" />
                )}
                <span>DIVERTING UNIT: {pendingApproval.resourceName} [{pendingApproval.resourceId}]</span>
              </div>
              <span className="text-[#F59E0B] text-[10px] uppercase">TIME-CRITICAL DIVERSION</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-11 items-center gap-2.5">
              {/* Source / Preempted Call */}
              <div className="sm:col-span-5 p-3 bg-[#080B10] border border-[#1E2532]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono text-[#4A5568] uppercase">PREEMPTED INCIDENT</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-[#081829] border border-[#00F0FF]/40 text-[#00F0FF]">
                    SEV 2
                  </span>
                </div>
                <div className="font-sans text-xs font-semibold text-[#A0AAB8] line-clamp-1">
                  {pendingApproval.previousIncidentTitle ?? 'Acute Distress (Koramangala 5th Block)'}
                </div>
                <div className="text-[9.5px] text-[#7A8394] mt-1 font-mono">
                  ACTION: Queueing secondary standby unit
                </div>
              </div>

              {/* Arrow Connector */}
              <div className="sm:col-span-1 flex items-center justify-center">
                <div className="p-1.5 bg-[#1A0A0D] border border-[#FF2A3B]/60 text-[#FF2A3B]">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Target / High Severity Emergency */}
              <div className="sm:col-span-5 p-3 bg-[#1A070A] border border-[#FF2A3B]/70 shadow-[0_0_15px_rgba(255,42,59,0.15)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono text-[#FF6B6B] uppercase font-bold">TARGET INCIDENT</span>
                  <span className="text-[9px] font-mono font-black px-1.5 py-0.2 bg-[#FF2A3B] text-[#0A0C10]">
                    SEV 5 CRITICAL
                  </span>
                </div>
                <div className="font-sans text-xs font-bold text-[#FF9E9E] line-clamp-1">
                  {pendingApproval.incidentTitle}
                </div>
                <div className="text-[9.5px] text-[#FF8585] mt-1 font-mono font-semibold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-[#FF2A3B] shrink-0" />
                  <span>Immediate Trauma Preemption</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gemini Command Agent Natural Language Justification */}
          <div className="p-3.5 bg-[#0D1017] border border-[#1E2532]">
            <div className="flex items-center gap-2 mb-2 text-xs font-mono font-bold text-[#FCD34D]">
              <BrainCircuit className="w-4 h-4 text-[#F59E0B]" />
              <span className="font-display tracking-wide uppercase">AI COMMAND REASONING RATIONALE</span>
            </div>
            <p className="font-sans text-xs text-[#EDECE8] leading-relaxed bg-[#06080C] p-3 border border-[#1E2532] italic">
              "{pendingApproval.rationale}"
            </p>
            <div className="mt-2.5 flex items-center gap-4 text-[10px] font-mono text-[#7A8394]">
              <span className="flex items-center gap-1 text-[#10B981]">
                <Clock className="w-3 h-3" />
                <span>GOLDEN HOUR GAIN: +11.6m SAVED</span>
              </span>
              <span className="flex items-center gap-1 text-[#00F0FF]">
                <Zap className="w-3 h-3" />
                <span>TARGET ETA: 3.2 MINS</span>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 border-t border-[#1E2532] bg-[#0A0C10] flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            onClick={onReject}
            className="w-full sm:w-auto px-4 py-2 bg-[#13171F] hover:bg-[#1E070A] text-[#7A8394] hover:text-[#FF6B6B] border border-[#1E2532] hover:border-[#FF2A3B]/60 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>REJECT // MAINTAIN DISPATCH</span>
          </button>

          <button
            onClick={onApprove}
            className="w-full sm:w-auto px-5 py-2 bg-[#00F0FF] hover:bg-[#38F9D7] text-[#0A0C10] border border-[#00F0FF] font-mono text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>AUTHORIZE REALLOCATION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
