/**
 * NeuralNexus - Shared Types & Interfaces
 * Common type definitions for Crisis Command System modules.
 */
export interface SystemStatus {
    service: string;
    status: 'online' | 'degraded' | 'offline';
    timestamp: string;
}
export interface IncidentSummary {
    id: string;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'reported' | 'active' | 'resolved';
    createdAt: string;
}
export interface AgentStatus {
    agentId: string;
    name: string;
    role: string;
    status: 'idle' | 'busy' | 'offline';
}
