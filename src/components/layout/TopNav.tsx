/**
 * ResQAlloc Emergency Operations Center (EOC)
 * Architectural Flight Deck Navigation & Mission Telemetry
 * Craft: Editorial Brutalism & Cybernetic Operations Command
 */

import React from 'react';
import {
  Radio,
  ShieldAlert,
  Truck,
  Wifi,
  WifiOff,
  Clock,
  RefreshCw,
  Moon,
  Satellite,
  Map as MapIcon,
  Activity,
  Layers,
  Terminal,
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

  // Status configuration - High contrast, zero muddy gradients
  let statusBadgeStyle = 'border-[#00F0FF]/40 text-[#00F0FF] bg-[#00F0FF]/5';
  let statusDotStyle = 'bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]';
  let statusLabel = 'ACTIVE // DISPATCH RUNTIME';

  if (systemStatus === 'DISRUPTED') {
    statusBadgeStyle = 'border-[#FF2A3B] text-[#FF2A3B] bg-[#FF2A3B]/10';
    statusDotStyle = 'bg-[#FF2A3B] shadow-[0_0_10px_#FF2A3B] animate-ping';
    statusLabel = 'DISRUPTED // CRITICAL REALLOCATION';
  } else if (systemStatus === 'REASSESSING') {
    statusBadgeStyle = 'border-[#F59E0B] text-[#F59E0B] bg-[#F59E0B]/10';
    statusDotStyle = 'bg-[#F59E0B] shadow-[0_0_8px_#F59E0B] animate-pulse';
    statusLabel = 'EVAL // ALGORITHMIC BYPASS';
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-[#0A0C10]/95 backdrop-blur-md border-b border-[#1E2532] flex items-center justify-between px-4 pointer-events-auto select-none">
      {/* 1. Monolithic Brand & Grid Coordinate */}
      <div className="flex items-center gap-3.5">
        <div className="relative w-8 h-8 flex items-center justify-center bg-[#13171F] border border-[#1E2532]">
          <span className="absolute -top-1 -left-1 text-[8px] font-mono text-[#00F0FF] leading-none">+</span>
          <Radio className="w-4 h-4 text-[#00F0FF]" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="font-display font-black text-sm tracking-tight text-[#EDECE8] uppercase">
              ResQ<span className="text-[#00F0FF]">Alloc</span>
            </span>
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 bg-[#13171F] border border-[#1E2532] text-[#7A8394] tracking-wider uppercase">
              SECTOR-BLR // v2.4
            </span>
          </div>
          <span className="text-[9px] font-mono text-[#7A8394] tracking-wider uppercase">
            Autonomous Dispatch & Preemption Matrix
          </span>
        </div>
      </div>

      {/* 2. Tactical Telemetry HUD */}
      <div className="hidden xl:flex items-center gap-2">
        {/* Real-time System Pulse */}
        <div className={`flex items-center gap-2 px-3 py-1 border text-[11px] font-mono font-bold tracking-wider uppercase ${statusBadgeStyle}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDotStyle}`} />
          <span>{statusLabel}</span>
        </div>

        {/* Telemetry Monolith Data Readouts */}
        <div className="flex items-center bg-[#13171F] border border-[#1E2532] divide-x divide-[#1E2532] text-[11px] font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#FF2A3B]" />
            <span className="text-[#7A8394] uppercase tracking-wider text-[10px]">INCIDENTS:</span>
            <span className="font-bold text-[#FF2A3B]">{metrics.activeIncidents}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5">
            <Truck className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="text-[#7A8394] uppercase tracking-wider text-[10px]">FLEET AVAIL:</span>
            <span className="font-bold text-[#EDECE8]">
              {metrics.availableResources}<span className="text-[#7A8394]">/{metrics.totalFleet}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5">
            <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="text-[#7A8394] uppercase tracking-wider text-[10px]">AVG TRANSIT:</span>
            <span className="font-bold text-[#F59E0B]">{metrics.avgResponseTimeMin}m</span>
          </div>
        </div>
      </div>

      {/* 3. Operational Switches & Live Connection Hardware Toggle */}
      <div className="flex items-center gap-2.5">
        {/* Map Cartography Switcher */}
        {onSelectMapStyle && (
          <div className="hidden lg:flex items-center bg-[#13171F] border border-[#1E2532] p-0.5 text-[10px] font-mono font-bold">
            <div className="px-2 py-0.5 text-[#7A8394] flex items-center gap-1 border-r border-[#1E2532]">
              <Layers className="w-3 h-3 text-[#00F0FF]" />
              <span className="text-[9px] tracking-wider uppercase">LAYER</span>
            </div>
            {(['dark', 'satellite', 'streets'] as const).map((styleId) => {
              const isActive = activeMapStyle === styleId;
              const icons = {
                dark: <Moon className="w-2.5 h-2.5" />,
                satellite: <Satellite className="w-2.5 h-2.5" />,
                streets: <MapIcon className="w-2.5 h-2.5" />,
              };
              return (
                <button
                  key={styleId}
                  onClick={() => onSelectMapStyle(styleId)}
                  className={`flex items-center gap-1 px-2 py-1 cursor-pointer transition-all uppercase tracking-wider ${
                    isActive
                      ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-b-2 border-[#00F0FF]'
                      : 'text-[#7A8394] hover:text-[#EDECE8]'
                  }`}
                >
                  {icons[styleId]}
                  <span>{styleId}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Real-time Traffic Overlap Switch */}
        {onToggleTrafficOverlay && (
          <button
            onClick={onToggleTrafficOverlay}
            title="Toggle Arterial Congestion Corridors"
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer border transition-all ${
              showTrafficOverlay
                ? 'bg-[#FF5500]/15 text-[#FF5500] border-[#FF5500]/60 shadow-[0_0_10px_rgba(255,85,0,0.25)]'
                : 'bg-[#13171F] text-[#7A8394] border-[#1E2532] hover:text-[#EDECE8]'
            }`}
          >
            <Activity className={`w-3 h-3 ${showTrafficOverlay ? 'text-[#FF5500] animate-pulse' : 'text-[#7A8394]'}`} />
            <span>TRAFFIC</span>
          </button>
        )}

        {/* Hardware Status Pill */}
        <div className="hidden md:flex items-center gap-2 text-[10px] font-mono px-2.5 py-1 bg-[#13171F] border border-[#1E2532]">
          {isMockMode ? (
            <>
              <Radio className="w-3 h-3 text-[#F59E0B]" />
              <span className="text-[#F59E0B] font-semibold tracking-wider uppercase">MOCK SIMULATION</span>
              <span className="text-[#1E2532]">|</span>
              <span className="text-[#7A8394]">{lastHeartbeat ?? 'OFFLINE'}</span>
            </>
          ) : isConnected ? (
            <>
              <Wifi className="w-3 h-3 text-[#10B981]" />
              <span className="text-[#10B981] font-semibold tracking-wider uppercase">LIVE AUTHORITY</span>
              <span className="text-[#1E2532]">|</span>
              <span className="text-[#EDECE8]">{lastHeartbeat ?? 'LIVE'}</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-[#FF2A3B] animate-pulse" />
              <span className="text-[#FF2A3B] font-semibold tracking-wider uppercase">DISCONNECTED</span>
            </>
          )}
        </div>

        {/* State Re-Zero Button */}
        {onResetState && (
          <button
            onClick={onResetState}
            title="Re-Zero Simulation Baseline"
            className="p-1.5 bg-[#13171F] hover:bg-[#1E2532] border border-[#1E2532] text-[#7A8394] hover:text-[#00F0FF] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Tactile Hardware Mode Rocker Switch */}
        <button
          onClick={onToggleMockMode}
          className={`flex items-center gap-2 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border transition-all active:translate-y-0.5 ${
            isMockMode
              ? 'bg-[#F59E0B]/10 border-[#F59E0B]/80 text-[#F59E0B] hover:bg-[#F59E0B]/20'
              : 'bg-[#00F0FF]/10 border-[#00F0FF]/80 text-[#00F0FF] hover:bg-[#00F0FF]/20 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
          }`}
        >
          <Terminal className="w-3 h-3" />
          <span>{isMockMode ? 'MODE: MOCK' : 'MODE: LIVE'}</span>
        </button>
      </div>
    </header>
  );
};
