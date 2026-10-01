/**
 * ResQAlloc Emergency Operations Center (EOC)
 * Pitch Dock: Tactical Dispatch Switchboard
 * Craft: Editorial Brutalism & Physical Control-Room Switches
 */

import React from 'react';
import {
  Play,
  Zap,
  RotateCcw,
  Sliders,
  AlertTriangle,
  Gauge,
} from 'lucide-react';
import { SystemStatus } from '../../types/emergency';

export interface DemoControlsProps {
  systemStatus: SystemStatus;
  isTrafficCongested?: boolean;
  hasPendingApproval: boolean;
  simulationSpeed?: number;
  onSpeedChange?: (speed: number) => void;
  onNormalIngestion: () => void;
  onInjectTrafficJam: () => void;
  onInjectDisruption: () => void;
  onReset: () => void;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  systemStatus,
  isTrafficCongested = false,
  hasPendingApproval,
  simulationSpeed = 1,
  onSpeedChange,
  onNormalIngestion,
  onInjectTrafficJam,
  onInjectDisruption,
  onReset,
}) => {
  const isDisrupted = systemStatus === 'DISRUPTED';
  const isTrafficActive = isTrafficCongested || (systemStatus === 'REASSESSING' && !hasPendingApproval);
  const isNormal = systemStatus === 'ONLINE' && !isTrafficActive;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto select-none">
      <div className="tactical-surface-glass border border-[#1E2532] shadow-[0_12px_40px_rgba(0,0,0,0.85)] flex items-stretch p-1 gap-1.5 corner-crosshair">
        {/* Switchboard Console Label */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#0A0C10] border border-[#1E2532] text-[10px] font-mono font-bold text-[#7A8394] tracking-widest uppercase">
          <Sliders className="w-3 h-3 text-[#00F0FF]" />
          <span>CONSOLE:</span>
        </div>

        {/* 1. Baseline Normal Dispatch */}
        <button
          onClick={onNormalIngestion}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer border active:translate-y-0.5 ${
            isNormal
              ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.3)]'
              : 'bg-[#13171F] text-[#7A8394] hover:text-[#EDECE8] border-[#1E2532] hover:border-[#7A8394]'
          }`}
        >
          <Play className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span>01 // BASELINE DISPATCH</span>
        </button>

        {/* 2. Congestion Detour Bypass */}
        <button
          onClick={onInjectTrafficJam}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer border active:translate-y-0.5 ${
            isTrafficActive
              ? 'bg-[#FF5500]/15 text-[#FF5500] border-[#FF5500] shadow-[0_0_15px_rgba(255,85,0,0.35)] animate-pulse'
              : 'bg-[#13171F] text-[#7A8394] hover:text-[#FF5500] border-[#1E2532] hover:border-[#FF5500]/50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-[#FF5500]" />
          <span>02 // TRAFFIC DETOUR</span>
        </button>

        {/* 3. Severe Preemption Disruption */}
        <button
          onClick={onInjectDisruption}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer border active:translate-y-0.5 ${
            isDisrupted
              ? 'bg-[#FF2A3B]/15 text-[#FF2A3B] border-[#FF2A3B] shadow-[0_0_20px_rgba(255,42,59,0.4)] animate-pulse'
              : 'bg-[#13171F] text-[#7A8394] hover:text-[#FF2A3B] border-[#1E2532] hover:border-[#FF2A3B]/50'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-[#FF2A3B]" />
          <span>03 // SEV-5 CRITICAL PREEMPT</span>
          {hasPendingApproval && (
            <span className="w-2 h-2 rounded-full bg-[#FF2A3B] animate-ping" />
          )}
        </button>

        {/* 4. Reset Switch */}
        <button
          onClick={onReset}
          title="Reset grid simulation to initial baseline"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-[#0A0C10] hover:bg-[#1E2532] text-[#7A8394] hover:text-[#EDECE8] border border-[#1E2532] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">RESET</span>
        </button>

        {/* 5. Rotary Speed Selector Tab */}
        <div className="flex items-center bg-[#0A0C10] border border-[#1E2532] divide-x divide-[#1E2532] ml-1">
          <div className="hidden sm:flex items-center gap-1 px-2 py-1.5 text-[10px] font-mono font-bold text-[#7A8394] uppercase">
            <Gauge className="w-3 h-3 text-[#00F0FF]" />
            <span className="hidden md:inline text-[9px] tracking-wider">VELOCITY</span>
          </div>
          {[0.5, 1, 2, 4].map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange?.(speed)}
              title={`Simulate fleet transit at ${speed}x real-time`}
              className={`px-2.5 py-1.5 text-xs font-mono font-bold tracking-wider transition-all cursor-pointer ${
                simulationSpeed === speed
                  ? 'bg-[#00F0FF] text-[#0A0C10] font-black'
                  : 'text-[#7A8394] hover:text-[#EDECE8] hover:bg-[#13171F]'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
