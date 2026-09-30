/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * useEmergencyState Custom State Management Hook
 * Strictly typed with zero placeholders, full state snapshot management, and dormant WebSocket client.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { WorldState, RouteGeometry, AgentLog, SystemMode } from '../types/emergency';
import { initialWorldState, disruptedWorldState } from '../data/mockBengaluruState';

export interface UseEmergencyStateReturn {
  worldState: WorldState;
  isMockMode: boolean;
  systemMode: SystemMode;
  isConnected: boolean;
  lastHeartbeat: string | null;
  selectedIncidentId: string | null;
  selectedResourceId: string | null;
  injectDisruption: () => void;
  approveReallocation: () => void;
  rejectReallocation: () => void;
  resetState: () => void;
  toggleMockMode: () => void;
  selectIncident: (id: string | null) => void;
  selectResource: (id: string | null) => void;
}

export const useEmergencyState = (): UseEmergencyStateReturn => {
  const [worldState, setWorldState] = useState<WorldState>(initialWorldState);
  const [isMockMode, setIsMockMode] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastHeartbeat, setLastHeartbeat] = useState<string | null>(() => new Date().toLocaleTimeString('en-US', { hour12: false }) + ' IST');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  /**
   * Action 1: Inject Disruption
   * Transitions system to Disrupted State (AMB-02 breakdown + Sev-5 Crash at MG Road + Reallocation Proposal)
   */
  const injectDisruption = useCallback(() => {
    setWorldState(disruptedWorldState);
    setSelectedIncidentId('INC-03');
    setLastHeartbeat(new Date().toLocaleTimeString('en-US', { hour12: false }) + ' IST');
  }, []);

  /**
   * Action 2: Human-In-The-Loop Approval
   * Commits the proposed reallocation route, locks AMB-01 to Sev-5 MG Road crash, and clears pending modal.
   */
  const approveReallocation = useCallback(() => {
    setWorldState((prev) => {
      if (!prev.pendingApproval) return prev;

      const approval = prev.pendingApproval;
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' IST';

      // 1. Commit and finalize the route polyline (turn solid cyan)
      const updatedRoutes: RouteGeometry[] = prev.activeRoutes
        .filter((r) => r.id !== 'ROUTE-02-ORIGINAL' && r.id !== 'ROUTE-03-PENDING')
        .concat([
          {
            id: 'ROUTE-03-COMMITTED',
            resourceId: approval.resourceId,
            incidentId: approval.incidentId,
            coordinates: [
              [77.6120, 12.9440],
              [77.6145, 12.9520],
              [77.6170, 12.9600],
              [77.6180, 12.9680],
              [77.6186, 12.9738],
            ],
            isPendingApproval: false,
            color: '#06b6d4',
          },
        ]);

      // 2. Update resource assignments
      const updatedResources = prev.resources.map((res) => {
        if (res.id === approval.resourceId) {
          return {
            ...res,
            status: 'REROUTED' as const,
            assignedIncidentId: approval.incidentId,
            currentEtaMinutes: 3,
            heading: 355,
          };
        }
        return res;
      });

      // 3. Update incidents
      const updatedIncidents = prev.activeIncidents.map((inc) => {
        if (inc.id === approval.incidentId) {
          return {
            ...inc,
            status: 'ASSIGNED' as const,
            assignedResourceId: approval.resourceId,
          };
        }
        if (inc.id === approval.previousIncidentId) {
          return {
            ...inc,
            status: 'PENDING' as const,
            assignedResourceId: undefined,
          };
        }
        return inc;
      });

      // 4. Append audit logs
      const approvalLog: AgentLog = {
        id: `LOG-APPR-${Date.now()}`,
        timestamp,
        agentName: 'COMMAND',
        message: `OPERATOR APPROVED REALLOCATION [${approval.id}]: ${approval.resourceName} (${approval.resourceId}) diverted to ${approval.incidentTitle}. Estimated latency saved: 11.6 min.`,
        severity: 'CRITICAL',
      };

      const triageLog: AgentLog = {
        id: `LOG-TRG-${Date.now() + 1}`,
        timestamp,
        agentName: 'TRIAGE',
        message: `Koramangala call #INC-02 placed in high-priority mutual aid standby queue. Secondary BLS dispatch requested.`,
        severity: 'WARN',
      };

      return {
        ...prev,
        systemStatus: 'ONLINE',
        activeIncidents: updatedIncidents,
        resources: updatedResources,
        activeRoutes: updatedRoutes,
        pendingApproval: null,
        agentLogs: [...prev.agentLogs, approvalLog, triageLog],
        metrics: {
          ...prev.metrics,
          avgResponseTimeMin: 4.4,
        },
      };
    });
  }, []);

  /**
   * Action 3: Human-In-The-Loop Rejection
   * Rejects the proposed reallocation, maintains original unit course to Koramangala, and clears pending modal.
   */
  const rejectReallocation = useCallback(() => {
    setWorldState((prev) => {
      if (!prev.pendingApproval) return prev;

      const approval = prev.pendingApproval;
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' IST';

      // 1. Remove pending route and restore original route color
      const updatedRoutes: RouteGeometry[] = prev.activeRoutes
        .filter((r) => r.id !== 'ROUTE-03-PENDING')
        .map((r) => {
          if (r.id === 'ROUTE-02-ORIGINAL') {
            return {
              ...r,
              id: 'ROUTE-02',
              color: '#06b6d4',
            };
          }
          return r;
        });

      // 2. Revert resource assignment
      const updatedResources = prev.resources.map((res) => {
        if (res.id === approval.resourceId) {
          return {
            ...res,
            status: 'DISPATCHED' as const,
            assignedIncidentId: approval.previousIncidentId,
            currentEtaMinutes: 4,
            heading: 145,
          };
        }
        return res;
      });

      // 3. Append operator override audit log
      const rejectionLog: AgentLog = {
        id: `LOG-REJ-${Date.now()}`,
        timestamp,
        agentName: 'COMMAND',
        message: `OPERATOR OVERRIDE: Reallocation [${approval.id}] REJECTED. ${approval.resourceName} maintaining course to original scene. External mutual aid requested for MG Road crash.`,
        severity: 'WARN',
      };

      return {
        ...prev,
        systemStatus: 'ONLINE',
        resources: updatedResources,
        activeRoutes: updatedRoutes,
        pendingApproval: null,
        agentLogs: [...prev.agentLogs, rejectionLog],
      };
    });
  }, []);

  /**
   * Action 4: Reset Grid State to Baseline Benchmark
   */
  const resetState = useCallback(() => {
    setWorldState(initialWorldState);
    setSelectedIncidentId(null);
    setSelectedResourceId(null);
    setLastHeartbeat(new Date().toLocaleTimeString('en-US', { hour12: false }) + ' IST');
  }, []);

  /**
   * Action 5: Toggle Mock / Live WebSocket Mode
   */
  const toggleMockMode = useCallback(() => {
    setIsMockMode((prev) => !prev);
  }, []);

  /**
   * Selection Helpers
   */
  const selectIncident = useCallback((id: string | null) => {
    setSelectedIncidentId(id);
  }, []);

  const selectResource = useCallback((id: string | null) => {
    setSelectedResourceId(id);
  }, []);

  /**
   * Live WebSocket Listener (Dormant in Mock Mode, active when isMockMode === false)
   */
  useEffect(() => {
    if (isMockMode) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(true);
      return;
    }

    const wsUrl = (import.meta.env.VITE_WS_URL as string | undefined) || 'ws://localhost:8000/ws/emergency';
    let isMounted = true;

    const connectWebSocket = () => {
      try {
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          setLastHeartbeat(new Date().toLocaleTimeString('en-US', { hour12: false }) + ' IST');
        };

        socket.onmessage = (event: MessageEvent<string>) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data) as unknown;
            if (data && typeof data === 'object' && 'systemStatus' in data && 'activeIncidents' in data) {
              setWorldState(data as WorldState);
              setLastHeartbeat(new Date().toLocaleTimeString('en-US', { hour12: false }) + ' IST');
            }
          } catch {
            // Malformed packet ignored in stream
          }
        };

        socket.onerror = () => {
          if (!isMounted) return;
          setIsConnected(false);
        };

        socket.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          // Reconnection schedule (every 5 seconds)
          reconnectTimeoutRef.current = window.setTimeout(() => {
            if (isMounted && !isMockMode) {
              connectWebSocket();
            }
          }, 5000);
        };
      } catch {
        if (isMounted) {
          setIsConnected(false);
        }
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [isMockMode]);

  return {
    worldState,
    isMockMode,
    systemMode: isMockMode ? 'MOCK' : 'LIVE_WS',
    isConnected,
    lastHeartbeat,
    selectedIncidentId,
    selectedResourceId,
    injectDisruption,
    approveReallocation,
    rejectReallocation,
    resetState,
    toggleMockMode,
    selectIncident,
    selectResource,
  };
};
