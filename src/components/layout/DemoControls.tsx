/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * DemoControls: Floating Bottom Dock for Instant Hackathon Pitch Simulation Triggers
 * Allows seamless switching between Baseline Ingestion, Disruption Injection, Grid Reset, and Vehicle Speed.
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
      <div className="p-1.5 rounded-2xl tactical-glass border border-slate-700/80 shadow-[0_10px_35px_rgba(0,0,0,0.7)] flex items-center gap-2">
        {/* Pitch Dock Label */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold text-slate-400 border-r border-slate-800">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>PITCH DOCK:</span>
        </div>

        {/* 1. Normal Ingestion Scenario */}
        <button
          onClick={onNormalIngestion}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-200 cursor-pointer border ${
            isNormal
              ? 'bg-cyan-950/90 text-cyan-300 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
          }`}
        >
          <Play className="w-3.5 h-3.5 text-cyan-400" />
          <span>1. Normal Dispatch</span>
        </button>

        {/* 2. Simulate Traffic Jam & Dynamic Detour */}
        <button
          onClick={onInjectTrafficJam}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-200 cursor-pointer border ${
            isTrafficActive
              ? 'bg-orange-950/90 text-orange-300 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)] animate-pulse'
              : 'bg-slate-900/80 text-slate-400 hover:text-orange-400 border-slate-800 hover:border-orange-900/60'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
          <span>2. Traffic Jam & Detour</span>
        </button>

        {/* 3. Inject Sev-5 Disruption Scenario */}
        <button
          onClick={onInjectDisruption}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-200 cursor-pointer border ${
            isDisrupted
              ? 'bg-red-950/90 text-red-300 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse'
              : 'bg-slate-900/80 text-slate-400 hover:text-red-400 border-slate-800 hover:border-red-900/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-red-400" />
          <span>3. Sev-5 Disruption</span>
          {hasPendingApproval && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        {/* 4. Reset Grid */}
        <button
          onClick={onReset}
          title="Reset simulation to initial baseline benchmark"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 transition-all duration-200 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Reset</span>
        </button>

        {/* 5. Speed Control Tab */}
        <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
          <div className="hidden sm:flex items-center gap-1 px-1.5 py-1 text-[10px] font-mono text-slate-400 font-bold uppercase">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline text-slate-300">SPEED:</span>
          </div>
          {[0.5, 1, 2, 4].map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange?.(speed)}
              title={`Simulate vehicle velocity at ${speed}x real-time`}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer border ${
                simulationSpeed === speed
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-400/90 shadow-[0_0_12px_rgba(6,182,212,0.45)]'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
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
