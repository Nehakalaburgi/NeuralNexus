/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * Top Navigation Header & Telemetry Dashboard Bar
 * Displays brand identity, live agent heartbeat, system metrics, map style switcher, and mock/live WS toggle.
 */

import React from 'react';
import {
  Radio,
  ShieldAlert,
  Truck,
  Wifi,
  WifiOff,
  Cpu,
  Clock,
  RefreshCw,
  Moon,
  Satellite,
  Map as MapIcon,
  Activity,
} from 'lucide-react';
import { WorldState, MapStyleId } from '../../types/emergency';

export interface TopNavProps {
  worldState: WorldState;
  isMockMode: boolean;
  isConnected: boolean;
  lastHeartbeat: string | null;
  activeMapStyle?: MapStyleId;
  showTrafficOverlay?: boolean;
  onSelectMapStyle?: (style: MapStyleId) => void;
  onToggleTrafficOverlay?: () => void;
  onToggleMockMode: () => void;
  onResetState?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  worldState,
  isMockMode,
  isConnected,
  lastHeartbeat,
  activeMapStyle = 'dark',
  showTrafficOverlay = true,
  onSelectMapStyle,
  onToggleTrafficOverlay,
  onToggleMockMode,
  onResetState,
}) => {
  const { metrics, systemStatus } = worldState;

  // Status indicator styling
  let statusBadgeClass = 'bg-cyan-950/80 border-cyan-500/60 text-cyan-400';
  let statusDotClass = 'bg-cyan-400 animate-pulse';
  let statusText = 'ONLINE | AGENTS ACTIVE';

  if (systemStatus === 'DISRUPTED') {
    statusBadgeClass = 'bg-red-950/80 border-red-500/80 text-red-400';
    statusDotClass = 'bg-red-500 animate-ping';
    statusText = 'DISRUPTED | REASSESSING';
  } else if (systemStatus === 'REASSESSING') {
    statusBadgeClass = 'bg-amber-950/80 border-amber-500/80 text-amber-400';
    statusDotClass = 'bg-amber-400 animate-pulse';
    statusText = 'REALLOCATING RESOURCES';
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 px-4 tactical-glass border-b border-slate-800 flex items-center justify-between pointer-events-auto select-none">
      {/* 1. Brand Logo & System Subtitle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/90 border border-cyan-400/80 glow-cyan">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-black tracking-wider text-slate-100 uppercase">
              ResQ<span className="text-cyan-400">Alloc</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-400">
              v2.4-Bengaluru
            </span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1.5">
            <span>AI Autonomous Multi-Agent Dispatch & Reallocation Grid</span>
          </div>
        </div>
      </div>

      {/* 2. System Status & Real-Time Pulse */}
      <div className="hidden xl:flex items-center gap-4">
        {/* Heartbeat Badge */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-bold ${statusBadgeClass}`}>
          <span className={`w-2 h-2 rounded-full ${statusDotClass}`}></span>
          <span>{statusText}</span>
        </div>

        {/* Live Metrics Ticker */}
        <div className="flex items-center gap-3 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span className="text-slate-500">Active:</span>
            <span className="font-bold text-red-400">{metrics.activeIncidents}</span>
          </div>
          <div className="w-px h-3.5 bg-slate-800" />
          <div className="flex items-center gap-1.5 text-slate-300">
            <Truck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-500">Fleet Avail:</span>
            <span className="font-bold text-cyan-400">
              {metrics.availableResources}/{metrics.totalFleet}
            </span>
          </div>
          <div className="w-px h-3.5 bg-slate-800" />
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-500">Avg Latency:</span>
            <span className="font-bold text-amber-400">{metrics.avgResponseTimeMin}m</span>
          </div>
        </div>
      </div>

      {/* 3. Controls, Map Style Switcher, WebSocket Indicator, & Mode Switcher */}
      <div className="flex items-center gap-3">
        {/* Map Style Switcher Group */}
        {onSelectMapStyle && (
          <div className="hidden lg:flex items-center p-1 rounded-lg bg-slate-950/80 border border-slate-800 gap-1 text-[10px] font-mono font-bold">
            <button
              onClick={() => onSelectMapStyle('dark')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition-colors ${
                activeMapStyle === 'dark'
                  ? 'bg-cyan-900/80 text-cyan-300 border border-cyan-500/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon className="w-3 h-3" />
              <span>Dark</span>
            </button>
            <button
              onClick={() => onSelectMapStyle('satellite')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition-colors ${
                activeMapStyle === 'satellite'
                  ? 'bg-cyan-900/80 text-cyan-300 border border-cyan-500/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Satellite className="w-3 h-3" />
              <span>Satellite</span>
            </button>
            <button
              onClick={() => onSelectMapStyle('streets')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition-colors ${
                activeMapStyle === 'streets'
                  ? 'bg-cyan-900/80 text-cyan-300 border border-cyan-500/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapIcon className="w-3 h-3" />
              <span>Streets</span>
            </button>
          </div>
        )}

        {/* Traffic Overlay Toggle Button */}
        {onToggleTrafficOverlay && (
          <button
            onClick={onToggleTrafficOverlay}
            title="Toggle Real-Time Traffic Congestion Overlay"
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all duration-200 cursor-pointer border ${
              showTrafficOverlay
                ? 'bg-orange-950/80 text-orange-300 border-orange-500/80 shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                : 'bg-slate-900/80 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <Activity className={`w-3 h-3 ${showTrafficOverlay ? 'text-orange-400 animate-pulse' : 'text-slate-500'}`} />
            <span>TRAFFIC</span>
          </button>
        )}

        {/* Connection Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded bg-slate-900/90 border border-slate-800 text-slate-400">
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">FEED SYNC</span>
              <span className="text-slate-600">|</span>
              <span>{lastHeartbeat ?? 'Live'}</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-red-400 animate-pulse" />
              <span className="text-red-400 font-semibold">WS DISCONNECTED</span>
            </>
          )}
        </div>

        {/* Reset Grid Benchmark Shortcut */}
        {onResetState && (
          <button
            onClick={onResetState}
            title="Reset Grid to Baseline"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Mode Toggle Button */}
        <button
          onClick={onToggleMockMode}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-200 border cursor-pointer ${
            isMockMode
              ? 'bg-amber-950/60 border-amber-500/80 text-amber-300 hover:bg-amber-900/60'
              : 'bg-cyan-950/60 border-cyan-500/80 text-cyan-300 hover:bg-cyan-900/60'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>{isMockMode ? 'MOCK MODE' : 'LIVE WS'}</span>
        </button>
      </div>
    </header>
  );
};
