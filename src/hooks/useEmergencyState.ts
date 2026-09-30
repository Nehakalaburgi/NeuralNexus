/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * State Management & WebSocket Hooks
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
  const [lastHeartbeat, setLastHeartbeat] = useState<string | null>(
    () => new Date().toLocaleTimeString('en-US', { hour12: false }) + ' IST'
  );
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Action 1: Inject Disruption
   */
  const injectDisruption = useCallback(() => {
    setWorldState(disruptedWorldState);
    setSelectedIncidentId('INC-03');
    setLastHeartbeat(new Date().toLocaleTimeString('en-US', { hour12: false }) + ' IST');
  }, []);

  /**
   * Action 2: Human-In-The-Loop Approval
   */
  const approveReallocation = useCallback(() => {
    setWorldState((prev) => {
      if (!prev.pendingApproval) return prev;

      const approval = prev.pendingApproval;
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' IST';

      // 1. Commit and finalize route polyline (solid cyan)
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
        message: `Koramangala call #${approval.previousIncidentId} placed in high-priority mutual aid standby queue. Secondary BLS dispatch requested.`,
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
   */
  const rejectReallocation = useCallback(() => {
    setWorldState((prev) => {
      if (!prev.pendingApproval) return prev;

      const approval = prev.pendingApproval;
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' IST';

      // 1. Remove pending route and restore original route
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

      // 2. Revert resource assignment to previous call
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

      // 3. Re-link previous incident back to original unit
      const updatedIncidents = prev.activeIncidents.map((inc) => {
        if (inc.id === approval.previousIncidentId) {
          return {
            ...inc,
            status: 'ASSIGNED' as const,
            assignedResourceId: approval.resourceId,
          };
        }
        return inc;
      });

      // 4. Append operator override audit log
      const rejectionLog: AgentLog = {
        id: `LOG-REJ-${Date.now()}`,
        timestamp,
        agentName: 'COMMAND',
        message: `OPERATOR OVERRIDE: Reallocation [${approval.id}] REJECTED. ${approval.resourceName} maintaining course to original scene. External mutual aid requested for ${approval.incidentTitle}.`,
        severity: 'WARN',
      };

      return {
        ...prev,
        systemStatus: 'ONLINE',
        activeIncidents: updatedIncidents,
        resources: updatedResources,
        activeRoutes: updatedRoutes,
        pendingApproval: null,
        agentLogs: [...prev.agentLogs, rejectionLog],
      };
    });
  }, []);

  /**
   * Action 4: Reset Grid State
   */
  const resetState = useCallback(() => {
    setWorldState(initialWorldState);
    setSelectedIncidentId(null);
    setSelectedResourceId(null);
    setLastHeartbeat(new Date().toLocaleTimeString('en-US', { hour12: false }) + ' IST');
  }, []);

  /**
   * Action 5: Toggle Mode
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
   * Live WebSocket Listener
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
          reconnectTimeoutRef.current = setTimeout(() => {
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

/**
 * Standalone auxiliary hook for granular event-based socket feeds
 */
export interface EmergencySocketData<TIncident = unknown, TResource = unknown, TAssignment = unknown, TLog = unknown> {
  incidents: TIncident[];
  resources: TResource[];
  assignments: TAssignment[];
  logs: TLog[];
}

export function useEmergencySocket<TIncident = unknown, TResource = unknown, TAssignment = unknown, TLog = unknown>(
  wsUrl: string = 'ws://localhost:5000'
) {
  const [data, setData] = useState<EmergencySocketData<TIncident, TResource, TAssignment, TLog>>({
    incidents: [],
    resources: [],
    assignments: [],
    logs: [],
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const httpUrl = wsUrl.replace(/^ws/, 'http');

    // 1. Initial REST fetch for baseline state
    fetch(`${httpUrl}/api/state`, { credentials: 'omit', signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error status ${res.status}`);
        return res.json();
      })
      .then((initialData: Partial<EmergencySocketData<TIncident, TResource, TAssignment, TLog>>) => {
        if (isMounted && initialData) {
          setData((prev) => ({ ...prev, ...initialData }));
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Initial state fetch error:', err);
      });

    // 2. Open live WebSocket connection
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      if (isMounted) setIsConnected(true);
    };

    socket.onclose = () => {
      if (isMounted) setIsConnected(false);
    };

    socket.onerror = (err) => {
      console.error('WebSocket encountered an error:', err);
      if (isMounted) setIsConnected(false);
    };

    socket.onmessage = (event: MessageEvent<string>) => {
      if (!isMounted) return;
      try {
        const message = JSON.parse(event.data);
        if (message.event === 'STATE_UPDATED') {
          setData(message.data);
        } else if (message.event === 'DECISION_LOG_ADDED') {
          setData((prev) => ({
            ...prev,
            logs: [message.data, ...(prev.logs || [])],
          }));
        }
      } catch (err) {
        console.error('WS Parse error:', err);
      }
    };

    return () => {
      isMounted = false;
      controller.abort();
      socket.close();
    };
  }, [wsUrl]);

  return { ...data, isConnected };
}