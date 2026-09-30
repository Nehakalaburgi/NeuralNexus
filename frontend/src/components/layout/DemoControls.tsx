import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  AlertOctagon,
  Building2,
  Navigation,
} from 'lucide-react';

interface DemoControlsProps {
  activePhase: number;
  isPaused: boolean;
  playbackSpeed: number;
  onTriggerPhase: (phaseNumber: number) => void;
  onTogglePause: () => void;
  onSetPlaybackSpeed: (speed: number) => void;
  onResetSimulation: () => void;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  activePhase,
  isPaused,
  playbackSpeed,
  onTriggerPhase,
  onTogglePause,
  onSetPlaybackSpeed,
  onResetSimulation,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-md">
      {/* 1. Sequential Phase Steps */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mr-1">
          Tactical Scenarios:
        </span>

        {/* Phase 1: Normal Ingestion & Dispatch */}
        <button
          onClick={() => onTriggerPhase(1)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${activePhase === 1
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-950/50'
              : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-750'
            }`}
        >
          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
          <span>1. Normal Dispatch</span>
        </button>

        {/* Phase 2: Traffic Jam & Dynamic Bypass */}
        <button
          onClick={() => onTriggerPhase(2)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${activePhase === 2
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-950/50'
              : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-750'
            }`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
          <span>2. Traffic Gridlock & Bypass</span>
        </button>

        {/* Phase 3: Hospital Evacuation Handover */}
        <button
          onClick={() => onTriggerPhase(3)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${activePhase === 3
              ? 'bg-blue-600/25 text-blue-300 border-blue-500/50 shadow-md shadow-blue-950/50'
              : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-750'
            }`}
        >
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span>3. Hospital Evacuation (Leg 2)</span>
        </button>
      </div>

      {/* 2. Playback Speed & Controls */}
      <div className="flex items-center gap-3">
        {/* Speed Toggle Pills */}
        <div className="flex items-center rounded-lg bg-slate-950/60 p-0.5 border border-slate-800">
          <button
            onClick={() => onSetPlaybackSpeed(0.5)}
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${playbackSpeed === 0.5 ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            0.5x Slow
          </button>
          <button
            onClick={() => onSetPlaybackSpeed(1.0)}
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${playbackSpeed === 1.0 ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            1.0x Normal
          </button>
          <button
            onClick={() => onSetPlaybackSpeed(2.0)}
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${playbackSpeed === 2.0 ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            2.0x Fast
          </button>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={onTogglePause}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
        >
          {isPaused ? (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resume</span>
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              <span>Pause</span>
            </>
          )}
        </button>

        {/* Reset Simulation Button */}
        <button
          onClick={onResetSimulation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-red-950/40 border border-slate-700/80 hover:border-red-500/40 text-xs font-semibold text-slate-300 hover:text-red-300 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};