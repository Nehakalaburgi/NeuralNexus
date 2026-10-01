/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * AgentTelemetry: Lower-Right Floating Terminal Feed for Multi-Agent Reasoning
 * Displays real-time reasoning streams from TRIAGE, LOGISTICS, ALLOCATION, and COMMAND agents.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  Activity,
  Radio,
} from 'lucide-react';
import { AgentLog, AgentName, SystemStatus } from '../../types/emergency';

export interface AgentTelemetryProps {
  logs: AgentLog[];
  systemStatus?: SystemStatus;
}

export const AgentTelemetry: React.FC<AgentTelemetryProps> = ({ logs, systemStatus = 'ONLINE' }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<AgentName | 'ALL'>('ALL');
  const scrollBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to latest message on log stream update
  useEffect(() => {
    if (!isCollapsed) {
      scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isCollapsed]);

  const getAgentBadge = (agent?: AgentName | string) => {
    const norm = (agent || 'COMMAND').toUpperCase();
    if (norm.includes('TRIAGE')) {
      return (
        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-[#1a0f26] border border-[#a855f7]/60 text-[#d8b4fe] flex items-center gap-1 shrink-0">
          <Activity className="w-2.5 h-2.5 text-[#c084fc]" />
          TRIAGE
        </span>
      );
    }
    if (norm.includes('LOGISTICS')) {
      return (
        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-[#081829] border border-[#00F0FF]/50 text-[#67e8f9] flex items-center gap-1 shrink-0">
          <Zap className="w-2.5 h-2.5 text-[#00F0FF]" />
          LOGISTICS
        </span>
      );
    }
    if (norm.includes('ALLOCATION') || norm.includes('ALLOC')) {
      return (
        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-[#082017] border border-[#10b981]/60 text-[#6ee7b7] flex items-center gap-1 shrink-0">
          <Radio className="w-2.5 h-2.5 text-[#34d399]" />
          ALLOC
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-[#261706] border border-[#f59e0b]/60 text-[#fcd34d] flex items-center gap-1 shrink-0">
        <Shield className="w-2.5 h-2.5 text-[#fbbf24]" />
        CMD
      </span>
    );
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedAgentFilter === 'ALL') return true;
    const name = log.agentName || (log.agentType ? (log.agentType.replace('_AGENT', '') as AgentName) : 'COMMAND');
    return name === selectedAgentFilter;
  });

  const getAgentFilterLabel = (agent: AgentName | 'ALL') => {
    switch (agent) {
      case 'ALL':
        return 'ALL';
      case 'TRIAGE':
        return 'TRI';
      case 'LOGISTICS':
        return 'LOG';
      case 'ALLOCATION':
        return 'ALC';
      case 'COMMAND':
        return 'CMD';
    }
  };

  return (
    <div
      className={`fixed right-4 bottom-4 z-20 pointer-events-auto select-none transition-all duration-300 ease-in-out w-[480px] ${
        isCollapsed ? 'h-9' : 'h-56'
      }`}
    >
      <div className="w-full h-full tactical-surface-glass border border-[#1E2532] corner-crosshair shadow-2xl flex flex-col overflow-hidden">
        {/* Terminal Header Bar */}
        <div className="h-9 px-2.5 bg-[#0A0C10]/95 border-b border-[#1E2532] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1 bg-[#13171F] border border-[#1E2532] text-[#00F0FF] shrink-0">
              <Terminal className="w-3 h-3" />
            </div>
            <span className="font-mono text-[11px] font-bold text-[#EDECE8] tracking-wider uppercase whitespace-nowrap">
              AGENT TELEMETRY
            </span>
            <span
              className={`flex items-center gap-1 text-[8.5px] font-mono px-1.5 py-0.5 border whitespace-nowrap shrink-0 ${
                systemStatus === 'DISRUPTED'
                  ? 'text-[#FF2A3B] border-[#FF2A3B]/60 bg-[#FF2A3B]/10'
                  : 'text-[#00F0FF] border-[#00F0FF]/40 bg-[#00F0FF]/10'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 shrink-0 ${
                  systemStatus === 'DISRUPTED'
                    ? 'bg-[#FF2A3B] animate-ping'
                    : 'bg-[#00F0FF] animate-pulse'
                }`}
              />
              {systemStatus === 'DISRUPTED' ? 'REASSESSING' : 'LIVE'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Filter Toggle */}
            {!isCollapsed && (
              <div className="flex items-center gap-0.5 text-[8.5px] font-mono bg-[#0D1017] p-0.5 border border-[#1E2532]">
                {(['ALL', 'TRIAGE', 'LOGISTICS', 'ALLOCATION', 'COMMAND'] as const).map((agent) => (
                  <button
                    key={agent}
                    onClick={() => setSelectedAgentFilter(agent)}
                    className={`px-1.5 py-0.5 cursor-pointer uppercase transition-all whitespace-nowrap ${
                      selectedAgentFilter === agent
                        ? 'bg-[#00F0FF] text-[#0A0C10] font-black shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                        : 'text-[#7A8394] hover:text-[#EDECE8]'
                    }`}
                  >
                    {getAgentFilterLabel(agent)}
                  </button>
                ))}
              </div>
            )}

            {/* Collapse/Expand Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-[#1E2532] text-[#7A8394] hover:text-[#EDECE8] transition-colors cursor-pointer shrink-0"
            >
              {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Scrollable Telemetry Terminal Body */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto p-2.5 font-mono text-[11px] space-y-1.5 bg-[#06080C]/90 divide-y divide-[#1E2532]/40">
            {filteredLogs.map((log) => {
              const isCrit = log.severity === 'CRITICAL';
              const isWarn = log.severity === 'WARN';

              return (
                <div
                  key={log.id}
                  className={`pt-1.5 first:pt-0 flex items-start gap-2 ${
                    isCrit ? 'text-[#FF6B6B]' : isWarn ? 'text-[#FCD34D]' : 'text-[#A0AAB8]'
                  }`}
                >
                  <span className="text-[9px] text-[#4A5568] shrink-0 mt-0.5 font-mono">
                    {log.timestamp}
                  </span>
                  {getAgentBadge(log.agentName)}
                  <span className="flex-1 leading-snug break-words font-mono text-[10.5px]">
                    {log.message}
                  </span>
                </div>
              );
            })}
            <div ref={scrollBottomRef} />
          </div>
        )}
      </div>
    </div>
  );
};
