/**
 * NeuralNexus - Shared Types & Interfaces
 * Common type definitions for Crisis Command System modules.
 */

// System & Health types
export interface SystemStatus {
  service: string;
  status: 'online' | 'degraded' | 'offline';
  timestamp: string;
}

// Emergency Response Incident interface stub
export interface IncidentSummary {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'active' | 'resolved';
  createdAt: string;
}

// Agent status stub
export interface AgentStatus {
  agentId: string;
  name: string;
  role: string;
  status: 'idle' | 'busy' | 'offline';
}

export * from "./emergency.js";
