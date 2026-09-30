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
  systemStatus: SystemStatus;
}

export const AgentTelemetry: React.FC<AgentTelemetryProps> = ({ logs, systemStatus }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<AgentName | 'ALL'>('ALL');
  const scrollBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to latest message on log stream update
  useEffect(() => {
    if (!isCollapsed) {
      scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isCollapsed]);

  const getAgentBadge = (agent: AgentName) => {
    switch (agent) {
      case 'TRIAGE':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-950/90 border border-purple-500/80 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.4)] flex items-center gap-1 shrink-0">
            <Activity className="w-2.5 h-2.5 text-purple-400" />
            TRIAGE
          </span>
        );
      case 'LOGISTICS':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-950/90 border border-blue-500/80 text-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.4)] flex items-center gap-1 shrink-0">
            <Zap className="w-2.5 h-2.5 text-blue-400" />
            LOGISTICS
          </span>
        );
      case 'ALLOCATION':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.4)] flex items-center gap-1 shrink-0">
            <Radio className="w-2.5 h-2.5 text-emerald-400" />
            ALLOCATION
          </span>
        );
      case 'COMMAND':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-950/90 border border-amber-500/80 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)] flex items-center gap-1 shrink-0">
            <Shield className="w-2.5 h-2.5 text-amber-400" />
            COMMAND
          </span>
        );
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedAgentFilter === 'ALL') return true;
    return log.agentName === selectedAgentFilter;
  });

  return (
    <div
      className={`fixed right-4 bottom-4 z-20 pointer-events-auto select-none transition-all duration-300 ease-in-out w-[440px] ${
        isCollapsed ? 'h-11' : 'h-52'
      }`}
    >
      <div className="w-full h-full rounded-2xl tactical-glass border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Terminal Header Bar */}
        <div className="h-11 px-3.5 bg-slate-900/90 border-b border-slate-800/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-slate-950 border border-slate-700 text-cyan-400">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
              Agent Telemetry Stream
            </span>
            <span className={`flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-slate-950 border ${
              systemStatus === 'DISRUPTED' ? 'text-red-400 border-red-500/60' : 'text-cyan-400 border-cyan-500/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${systemStatus === 'DISRUPTED' ? 'bg-red-500 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
              {systemStatus === 'DISRUPTED' ? 'REASSESSING' : 'LIVE'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Toggle */}
            {!isCollapsed && (
              <div className="flex items-center gap-1 text-[9px] font-mono">
                {(['ALL', 'TRIAGE', 'LOGISTICS', 'ALLOCATION', 'COMMAND'] as const).map((agent) => (
                  <button
                    key={agent}
                    onClick={() => setSelectedAgentFilter(agent)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                      selectedAgentFilter === agent
                        ? 'bg-cyan-900/80 text-cyan-300 font-bold border border-cyan-500/60'
                        : 'bg-slate-950/60 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {agent === 'ALL' ? 'ALL' : agent.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}

            {/* Collapse/Expand Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Scrollable Telemetry Terminal Body */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-2 bg-[#080c14]/90">
            {filteredLogs.map((log) => {
              let textSeverityClass = 'text-slate-300';
              if (log.severity === 'CRITICAL') {
                textSeverityClass = 'text-red-300 font-bold';
              } else if (log.severity === 'WARN') {
                textSeverityClass = 'text-amber-300';
              }

              return (
                <div
                  key={log.id}
                  className={`p-1.5 rounded-lg transition-colors flex items-start gap-2 border border-slate-800/40 ${
                    log.severity === 'CRITICAL'
                      ? 'bg-red-950/30 border-red-900/50 glow-crimson'
                      : 'bg-slate-900/40 hover:bg-slate-900/80'
                  }`}
                >
                  <span className="text-[9px] text-slate-500 shrink-0 mt-0.5">
                    {log.timestamp}
                  </span>
                  {getAgentBadge(log.agentName)}
                  <span className={`flex-1 leading-relaxed ${textSeverityClass}`}>
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
