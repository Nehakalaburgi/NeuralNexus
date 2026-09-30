/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * State Management & WebSocket Hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { WorldState, RouteGeometry, AgentLog, SystemMode } from '../types/emergency';
import {
  initialWorldState,
  disruptedWorldState,
  trafficJamWorldState,
  ROUTE_COORDS_AMB_01_REROUTED_TO_MG_ROAD,
} from '../data/mockBengaluruState';

const DEFAULT_WS_URL =
  (import.meta.env?.VITE_WS_URL as string | undefined) || 'ws://localhost:5000';

export interface UseEmergencyStateReturn {
  worldState: WorldState;
  isMockMode: boolean;
  systemMode: SystemMode;
  isConnected: boolean;
  lastHeartbeat: string | null;
  selectedIncidentId: string | null;
  selectedResourceId: string | null;
  injectTrafficJam: () => void;
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

  const getTimestamp = () =>
    new Date().toLocaleTimeString('en-US', { hour12: false }) + ' IST';

  /**
   * Action 1A: Inject Traffic Gridlock & Dynamic Bypass Reroute Scenario
   * Simulates arterial bottleneck on Hosur Rd causing AMB-01 to dynamically detour via Victoria Layout & Adugodi
   */
  const injectTrafficJam = useCallback(() => {
    setWorldState(trafficJamWorldState);
    setSelectedIncidentId('INC-02');
    setSelectedResourceId('AMB-01');
    setLastHeartbeat(getTimestamp());
  }, []);

  /**
   * Action 1B: Inject Multi-Unit Disruption (Phase 2)
   * Transitions system to Disrupted State (AMB-02 breakdown + Sev-5 Crash at MG Road + Reallocation Proposal)
   */
  const injectDisruption = useCallback(() => {
    setWorldState(disruptedWorldState);
    setSelectedIncidentId('INC-03');
    setLastHeartbeat(getTimestamp());
  }, []);

  /**
   * Action 2: Human-In-The-Loop Approval
   */
  const approveReallocation = useCallback(() => {
    setWorldState((prev) => {
      if (!prev.pendingApproval) return prev;

      const approval = prev.pendingApproval;
      const timestamp = getTimestamp();

      // 1. Commit and finalize route polyline (solid cyan)
      const updatedRoutes: RouteGeometry[] = prev.activeRoutes
        .filter((r) => r.id !== 'ROUTE-02-ORIGINAL' && r.id !== 'ROUTE-03-PENDING')
        .concat([
          {
            id: 'ROUTE-03-COMMITTED',
            resourceId: approval.resourceId,
            incidentId: approval.incidentId,
            hospitalId: 'HOSP-02',
            type: 'DISPATCH',
            coordinates: ROUTE_COORDS_AMB_01_REROUTED_TO_MG_ROAD,
            isPendingApproval: false,
            color: '#2563eb',
            label: 'AMB-01 Committed Diversion Vector',
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
            assignedResourceIds: [approval.resourceId],
          };
        }
        if (inc.id === approval.previousIncidentId) {
          return {
            ...inc,
            status: 'PENDING' as const,
            assignedResourceId: undefined,
            assignedResourceIds: undefined,
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
      const timestamp = getTimestamp();

      // 1. Remove pending route and restore original route
      const updatedRoutes: RouteGeometry[] = prev.activeRoutes
        .filter((r) => r.id !== 'ROUTE-03-PENDING')
        .map((r) => {
          if (r.id === 'ROUTE-02-ORIGINAL') {
            return {
              ...r,
              id: 'ROUTE-02',
              color: '#2563eb',
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
    setLastHeartbeat(getTimestamp());
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

    let isMounted = true;

    const connectWebSocket = () => {
      try {
        const socket = new WebSocket(DEFAULT_WS_URL);
        socketRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          setLastHeartbeat(getTimestamp());
        };

        socket.onmessage = (event: MessageEvent<string>) => {
          if (!isMounted) return;
          try {
            const payload = JSON.parse(event.data);

            // Handle standard broadcast payload wrapper { event, data }
            const stateData = payload?.data ?? payload;

            if (
              stateData &&
              typeof stateData === 'object' &&
              ('systemStatus' in stateData || 'activeIncidents' in stateData)
            ) {
              setWorldState(stateData as WorldState);
              setLastHeartbeat(getTimestamp());
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
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted && !isMockMode) {
              connectWebSocket();
            }
          }, 5000);
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
    injectTrafficJam,
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
  wsUrl: string = DEFAULT_WS_URL
) {
  const [data, setData] = useState<EmergencySocketData<TIncident, TResource, TAssignment, TLog>>({
    incidents: [],
    resources: [],
    assignments: [],
    logs: [],
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      .then((resBody) => {
        if (!isMounted) return;
        // Unpack backend response envelope { status: "ok", data: state }
        const initialData = resBody?.data ?? resBody;
        if (initialData) {
          setData((prev) => ({
            ...prev,
            incidents: initialData.incidents ?? prev.incidents,
            resources: initialData.resources ?? prev.resources,
            assignments: initialData.assignments ?? prev.assignments,
            logs: initialData.decisionLogs ?? initialData.logs ?? prev.logs,
          }));
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Initial state fetch error:', err);
      });

    // 2. Resilient WebSocket connection loop
    const connectSocket = () => {
      try {
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          if (isMounted) setIsConnected(true);
        };

        socket.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          reconnectTimeoutRef.current = setTimeout(connectSocket, 5000);
        };

        socket.onerror = (err) => {
          console.error('WebSocket encountered an error:', err);
          if (isMounted) setIsConnected(false);
        };

        socket.onmessage = (event: MessageEvent<string>) => {
          if (!isMounted) return;
          try {
            const message = JSON.parse(event.data);
            switch (message.event) {
              case 'STATE_UPDATED': {
                const updated = message.data;
                setData((prev) => ({
                  ...prev,
                  incidents: updated.incidents ?? prev.incidents,
                  resources: updated.resources ?? prev.resources,
                  assignments: updated.assignments ?? prev.assignments,
                  logs: updated.decisionLogs ?? updated.logs ?? prev.logs,
                }));
                break;
              }
              case 'DECISION_LOG_ADDED':
              case 'EXPLANATION_EMITTED': {
                setData((prev) => ({
                  ...prev,
                  logs: [message.data, ...(prev.logs || [])],
                }));
                break;
              }
              case 'DISRUPTION_TRIGGERED': {
                const { resource, affectedIncident, disruptionLog } = message.data || {};
                setData((prev) => ({
                  ...prev,
                  resources: prev.resources.map((r: any) => (r._id === resource?._id ? resource : r)),
                  incidents: prev.incidents.map((i: any) => (i._id === affectedIncident?._id ? affectedIncident : i)),
                  logs: disruptionLog ? [disruptionLog, ...(prev.logs || [])] : prev.logs,
                }));
                break;
              }
            }
          } catch (err) {
            console.error('WS Parse error:', err);
          }
        };
      } catch {
        if (isMounted) {
          setIsConnected(false);
          reconnectTimeoutRef.current = setTimeout(connectSocket, 5000);
        }
      }
    };

    connectSocket();

    return () => {
      isMounted = false;
      controller.abort();
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [wsUrl]);

  return { ...data, isConnected };
}