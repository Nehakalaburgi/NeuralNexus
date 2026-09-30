/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * DemoControls: Floating Bottom Dock for 7-Step Hackathon Pitch Simulation & Auto-Pilot Orchestration
 * Allows seamless sequential step-by-step demonstration to hackathon judges.
 */

import React from 'react';
import {
  Play,
  Pause,
  Zap,
  RotateCcw,
  AlertTriangle,
  Flame,
  Hospital as HospitalIcon,
  Navigation,
  CheckCircle2,
  BedDouble,
  ShieldCheck,
  Gauge,
} from 'lucide-react';
import { SystemStatus, EmergencyLifecycleStep, PlaybackSpeed } from '../../types/emergency';

export interface DemoControlsProps {
  systemStatus: SystemStatus;
  isTrafficCongested?: boolean;
  hasPendingApproval: boolean;
  currentLifecycleStep: EmergencyLifecycleStep;
  isAutoPilot: boolean;
  isPlaying?: boolean;
  playbackSpeed?: PlaybackSpeed;
  onSelectLifecycleStep: (step: EmergencyLifecycleStep) => void;
  onToggleAutoPilot: () => void;
  onTogglePlayPause?: () => void;
  onSelectSpeed?: (speed: PlaybackSpeed) => void;
  onInjectTrafficJam?: () => void;
  onInjectDisruption: () => void;
  onReset: () => void;
}

const LIFECYCLE_STEPS: Array<{
  step: EmergencyLifecycleStep;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  activeColor: string;
}> = [
  {
    step: 1,
    label: '1. Leg 1 Dispatch',
    shortLabel: '1. Dispatch',
    icon: <Navigation className="w-3 h-3 text-sky-400" />,
    activeColor: 'bg-sky-950/90 text-sky-300 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]',
  },
  {
    step: 2,
    label: '2. Gridlock Reroute',
    shortLabel: '2. Reroute',
    icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
    activeColor: 'bg-amber-950/90 text-amber-300 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]',
  },
  {
    step: 3,
    label: '3. On-Scene Triage',
    shortLabel: '3. Triage',
    icon: <Flame className="w-3 h-3 text-orange-400" />,
    activeColor: 'bg-orange-950/90 text-orange-300 border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.5)]',
  },
  {
    step: 4,
    label: '4. AI Hospital Match',
    shortLabel: '4. Match Hub',
    icon: <HospitalIcon className="w-3 h-3 text-cyan-400" />,
    activeColor: 'bg-cyan-950/90 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]',
  },
  {
    step: 5,
    label: '5. Leg 2 Evacuation',
    shortLabel: '5. Evacuate',
    icon: <Navigation className="w-3 h-3 text-emerald-400" />,
    activeColor: 'bg-emerald-950/90 text-emerald-300 border-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.6)]',
  },
  {
    step: 6,
    label: '6. Bed Handover (-1)',
    shortLabel: '6. Handover',
    icon: <BedDouble className="w-3 h-3 text-emerald-400" />,
    activeColor: 'bg-emerald-950/90 text-emerald-300 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
  },
  {
    step: 7,
    label: '7. Mission Resolved',
    shortLabel: '7. Available',
    icon: <ShieldCheck className="w-3 h-3 text-indigo-400" />,
    activeColor: 'bg-indigo-950/90 text-indigo-300 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.5)]',
  },
];

export const DemoControls: React.FC<DemoControlsProps> = ({
  systemStatus,
  hasPendingApproval,
  currentLifecycleStep,
  isAutoPilot,
  isPlaying = true,
  playbackSpeed = 1.0,
  onSelectLifecycleStep,
  onToggleAutoPilot,
  onTogglePlayPause,
  onSelectSpeed,
  onInjectDisruption,
  onReset,
}) => {
  const isDisrupted = systemStatus === 'DISRUPTED';

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none max-w-[98vw]">
      <div className="p-1.5 rounded-2xl tactical-glass border border-slate-700/90 shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex flex-wrap items-center justify-center gap-1.5 backdrop-blur-xl">
        {/* Play / Pause Simulation Freeze Button */}
        {onTogglePlayPause && (
          <button
            onClick={onTogglePlayPause}
            title={isPlaying ? 'Freeze Simulation to Answer Judges' : 'Resume Simulation'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-black transition-all duration-200 cursor-pointer border ${
              !isPlaying
                ? 'bg-amber-950 text-amber-300 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.6)] animate-pulse'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-700 hover:border-cyan-500'
            }`}
          >
            {!isPlaying ? (
              <>
                <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>RESUME</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-cyan-400" />
                <span>FREEZE</span>
              </>
            )}
          </button>
        )}

        {/* Speed Selector Pills */}
        {onSelectSpeed && (
          <div className="hidden sm:flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectSpeed(0.5)}
              title="0.5x Presentation Speed (Cinematic & Slow)"
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                playbackSpeed === 0.5
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/70 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gauge className="w-2.5 h-2.5" />
              <span>0.5x SLOW</span>
            </button>
            <button
              onClick={() => onSelectSpeed(1.0)}
              title="1.0x Normal Speed"
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                playbackSpeed === 1.0
                  ? 'bg-slate-800 text-slate-100 border border-slate-600 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>1.0x NORMAL</span>
            </button>
          </div>
        )}

        <div className="w-px h-5 bg-slate-800 hidden sm:block" />

        {/* Auto-Pilot / Full Mission Simulator Trigger */}
        <button
          onClick={onToggleAutoPilot}
          title={isAutoPilot ? 'Pause Automated Mission Pitch' : 'Simulate Full 2-Leg Emergency Mission (Dispatch -> Evacuation -> Admission)'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-black transition-all duration-200 cursor-pointer border ${
            isAutoPilot
              ? 'bg-emerald-950 text-emerald-300 border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.6)] animate-pulse'
              : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-700 hover:border-emerald-500'
          }`}
        >
          {isAutoPilot ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{isAutoPilot ? 'FULL MISSION RUNNING' : 'SIMULATE FULL MISSION'}</span>
        </button>

        <div className="w-px h-5 bg-slate-800 hidden sm:block" />

        {/* Sequential 7 Lifecycle Step Buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {LIFECYCLE_STEPS.map((item) => {
            const isActive = currentLifecycleStep === item.step;
            return (
              <button
                key={item.step}
                onClick={() => onSelectLifecycleStep(item.step)}
                title={item.label}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10.5px] font-mono font-bold transition-all duration-150 cursor-pointer border ${
                  isActive
                    ? item.activeColor
                    : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {item.icon}
                <span className="hidden xl:inline">{item.label}</span>
                <span className="xl:hidden">{item.shortLabel}</span>
                {isActive && <CheckCircle2 className="w-2.5 h-2.5 text-current shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="w-px h-5 bg-slate-800 hidden sm:block" />

        {/* Sev-5 Disruption Pitch Scenario */}
        <button
          onClick={onInjectDisruption}
          title="Inject Catastrophic Sev-5 Crash and Trigger Preemption Reallocation"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10.5px] font-mono font-bold transition-all duration-200 cursor-pointer border ${
            isDisrupted
              ? 'bg-red-950/90 text-red-300 border-red-500 shadow-[0_0_16px_rgba(239,68,68,0.6)] animate-pulse'
              : 'bg-slate-900/80 text-slate-400 hover:text-red-400 border-slate-800 hover:border-red-900'
          }`}
        >
          <Zap className="w-3 h-3 text-red-400" />
          <span className="hidden sm:inline">Sev-5 Preemption</span>
          {hasPendingApproval && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
        </button>

        {/* Reset Simulation Button */}
        <button
          onClick={onReset}
          title="Reset simulation to default vehicle depots, active incident pins, and baseline bed capacities"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-cyan-500 shadow-md transition-all duration-200 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>🔄 Reset Simulation</span>
        </button>
      </div>
    </div>
  );
};
