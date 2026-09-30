/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * Complete 7-Step Emergency Dispatch-to-Hospital Lifecycle & WebSocket Hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  WorldState,
  RouteGeometry,
  AgentLog,
  SystemMode,
  EmergencyLifecycleStep,
  PlaybackSpeed,
} from '../types/emergency';
import {
  initialWorldState,
  disruptedWorldState,
  ROUTE_COORDS_FIRE_01,
  ROUTE_COORDS_AMB_03_FIRE,
  ROUTE_COORDS_AMB_01_INITIAL,
  ROUTE_COORDS_AMB_01_TRAFFIC_DETOUR,
  ROUTE_COORDS_AMB_01_REROUTED_TO_MG_ROAD,
  ROUTE_COORDS_EVAC_BURN_VICTORIA,
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
  currentLifecycleStep: EmergencyLifecycleStep;
  isAutoPilot: boolean;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  triggerLifecycleStep: (step: EmergencyLifecycleStep) => void;
  step1Dispatch: () => void;
  step2TrafficGridlock: () => void;
  step3OnSceneTriage: () => void;
  step4SpecializedHospitalMatch: () => void;
  step5TransportPatient: () => void;
  step6PatientDelivered: () => void;
  step7UnitAvailable: () => void;
  toggleAutoPilot: () => void;
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
  const [currentLifecycleStep, setCurrentLifecycleStep] = useState<EmergencyLifecycleStep>(1);
  const [isAutoPilot, setIsAutoPilot] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeedState] = useState<PlaybackSpeed>(1.0);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPilotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const setPlaybackSpeed = useCallback((speed: PlaybackSpeed) => {
    setPlaybackSpeedState(speed);
  }, []);

  const getTimestamp = () =>
    new Date().toLocaleTimeString('en-US', { hour12: false }) + ' IST';

  /**
   * STEP 1: INITIAL DISPATCH (Leg 1)
   * Dispatched vehicle starts on primary road network en-route to incident
   */
  const step1Dispatch = useCallback(() => {
    setCurrentLifecycleStep(1);
    const timestamp = getTimestamp();

    const leg1Routes: RouteGeometry[] = [
      {
        id: 'ROUTE-01-FIRE',
        resourceId: 'FIRE-01',
        incidentId: 'INC-01',
        hospitalId: 'HOSP-03',
        type: 'DISPATCH',
        legNumber: 1,
        coordinates: ROUTE_COORDS_FIRE_01,
        isPendingApproval: false,
        color: '#f97316', // Fire Engine Orange
        label: 'FIRE-01 Leg 1 Primary Route',
      },
      {
        id: 'ROUTE-01-AMB',
        resourceId: 'AMB-03',
        incidentId: 'INC-01',
        hospitalId: 'HOSP-03',
        type: 'DISPATCH',
        legNumber: 1,
        coordinates: ROUTE_COORDS_AMB_03_FIRE,
        isPendingApproval: false,
        color: '#06b6d4', // ALS Cyan
        label: 'AMB-03 Leg 1 Primary Route',
      },
      {
        id: 'ROUTE-02-AMB',
        resourceId: 'AMB-01',
        incidentId: 'INC-02',
        hospitalId: 'HOSP-04',
        type: 'DISPATCH',
        legNumber: 1,
        coordinates: ROUTE_COORDS_AMB_01_INITIAL,
        isPendingApproval: false,
        color: '#06b6d4', // ALS Cyan
        label: 'AMB-01 Leg 1 Primary Route',
      },
    ];

    const log: AgentLog = {
      id: `LOG-DISP-${Date.now()}`,
      timestamp,
      agentName: 'COMMAND',
      message: '[COMMAND] Step 1: Emergency dispatch initialized. Units FIRE-01, AMB-03, and AMB-01 en route along road-snapped arterial corridors (Leg 1: Station -> Scene).',
      severity: 'INFO',
    };

    setWorldState((prev) => ({
      ...prev,
      systemStatus: 'ONLINE',
      activeRoutes: leg1Routes,
      resources: prev.resources.map((r) => {
        if (r.id === 'FIRE-01' || r.id === 'AMB-03' || r.id === 'AMB-01') {
          return {
            ...r,
            status: 'DISPATCHED_TO_SCENE' as const,
            lifecycleStep: 1,
            trafficStatus: 'CLEAR' as const,
            currentEtaMinutes: r.id === 'AMB-03' ? 4 : r.id === 'FIRE-01' ? 6 : 4,
          };
        }
        return r;
      }),
      agentLogs: [...prev.agentLogs, log],
    }));

    setSelectedIncidentId('INC-01');
    setSelectedResourceId('AMB-03');
    setLastHeartbeat(timestamp);
  }, []);

  /**
   * STEP 2: TRAFFIC DETECTION & DYNAMIC REROUTE (Leg 1)
   * Dispatched vehicle detects severe traffic gridlock and detaches to alternate road vector
   */
  const step2TrafficGridlock = useCallback(() => {
    setCurrentLifecycleStep(2);
    const timestamp = getTimestamp();

    // Specific Agent Log mandated by requirements:
    const gridlockLog: AgentLog = {
      id: `LOG-GRID-${Date.now()}`,
      timestamp,
      agentName: 'LOGISTICS',
      message: '[LOGISTICS] Gridlock detected on primary route (+11 min delay). Recalculating dynamic bypass.',
      severity: 'CRITICAL',
    };

    const rerouteLog: AgentLog = {
      id: `LOG-REROUTE-${Date.now() + 1}`,
      timestamp,
      agentName: 'COMMAND',
      message: '[COMMAND] Dynamic AI Detour vector locked: AMB-01 diverted via Victoria Layout bypass (-8.8 min savings).',
      severity: 'WARN',
    };

    const trafficRoutes: RouteGeometry[] = [
      {
        id: 'ROUTE-01-FIRE',
        resourceId: 'FIRE-01',
        incidentId: 'INC-01',
        hospitalId: 'HOSP-03',
        type: 'DISPATCH',
        legNumber: 1,
        coordinates: ROUTE_COORDS_FIRE_01,
        isPendingApproval: false,
        color: '#f97316', // Fire Engine Orange
        label: 'FIRE-01 Leg 1 Primary Route',
      },
      {
        id: 'ROUTE-01-AMB',
        resourceId: 'AMB-03',
        incidentId: 'INC-01',
        hospitalId: 'HOSP-03',
        type: 'DISPATCH',
        legNumber: 1,
        coordinates: ROUTE_COORDS_AMB_03_FIRE,
        isPendingApproval: false,
        color: '#06b6d4', // ALS Cyan
        label: 'AMB-03 Leg 1 Primary Route',
      },
      {
        id: 'ROUTE-02-CONGESTED',
        resourceId: 'AMB-01',
        incidentId: 'INC-02',
        hospitalId: 'HOSP-04',
        type: 'CONGESTED_ORIGINAL',
        coordinates: ROUTE_COORDS_AMB_01_INITIAL,
        isPendingApproval: false,
        isCongested: true,
        trafficWarning: 'TRAFFIC BOTTLENECK: Hosur Rd Gridlock (+11m delay)',
        color: '#ef4444', // Glowing Red Gridlock
        label: 'Hosur Rd Severe Bottleneck (Red)',
      },
      {
        id: 'ROUTE-02-DETOUR',
        resourceId: 'AMB-01',
        incidentId: 'INC-02',
        hospitalId: 'HOSP-04',
        type: 'DETOUR',
        legNumber: 1,
        coordinates: ROUTE_COORDS_AMB_01_TRAFFIC_DETOUR,
        isPendingApproval: false,
        color: '#f59e0b', // Dynamic Amber Bypass
        label: 'AMB-01 Dynamic Bypass Vector (Amber)',
      },
    ];

    setWorldState((prev) => ({
      ...prev,
      systemStatus: 'REASSESSING',
      isTrafficCongested: true,
      activeRoutes: trafficRoutes,
      resources: prev.resources.map((r) => {
        if (r.id === 'AMB-01') {
          return {
            ...r,
            status: 'REROUTED' as const,
            lifecycleStep: 2,
            trafficStatus: 'REROUTED_BYPASS' as const,
            trafficSavingsMinutes: 8.8,
            currentEtaMinutes: 5,
          };
        }
        return r;
      }),
      agentLogs: [...prev.agentLogs, gridlockLog, rerouteLog],
    }));

    setSelectedResourceId('AMB-01');
    setSelectedIncidentId('INC-02');
    setLastHeartbeat(timestamp);
  }, []);

  /**
   * STEP 3: ON-SCENE ARRIVAL & TRIAGE
   * Unit arrives at incident scene coordinates; status updates to ON_SCENE_TRIAGING with 4-5s triage timer
   */
  const step3OnSceneTriage = useCallback(() => {
    setCurrentLifecycleStep(3);
    const timestamp = getTimestamp();

    const triageLog: AgentLog = {
      id: `LOG-TRIAGE-${Date.now()}`,
      timestamp,
      agentName: 'TRIAGE',
      message: '[TRIAGE] Step 3: Units arrived on-scene at Indiranagar 100ft Rd. Performing on-scene triage timer (4.5s)... Victim with 3rd-degree burns & smoke inhalation stabilized for emergency transport.',
      severity: 'WARN',
    };

    setWorldState((prev) => ({
      ...prev,
      systemStatus: 'ONLINE',
      resources: prev.resources.map((r) => {
        if (r.id === 'AMB-03' || r.id === 'FIRE-01') {
          return {
            ...r,
            status: 'ON_SCENE_TRIAGING' as const,
            lifecycleStep: 3,
            triageSecondsRemaining: 4,
            currentEtaMinutes: 0,
            distanceRemainingKm: 0,
          };
        }
        return r;
      }),
      agentLogs: [...prev.agentLogs, triageLog],
    }));

    setSelectedIncidentId('INC-01');
    setSelectedResourceId('AMB-03');
    setLastHeartbeat(timestamp);
  }, []);

  /**
   * STEP 4: SPECIALIZED HOSPITAL MATCHING
   * Command Agent matches incident type to the correct receiving specialized hospital:
   * - Structural Fire (Indiranagar INC-01) -> Victoria Hospital Burn ICU [77.5739, 12.9634] (HOSP-01)
   * - Medical Emergency (Koramangala INC-02) -> St. John's Medical College Hospital [77.6195, 12.9345] (HOSP-04)
   * - Trauma Crash (MG Road INC-03) -> Bowring & Lady Curzon Hospital [77.6047, 12.9830] (HOSP-02)
   */
  const step4SpecializedHospitalMatch = useCallback(() => {
    setCurrentLifecycleStep(4);
    const timestamp = getTimestamp();

    const matchLog: AgentLog = {
      id: `LOG-MATCH-${Date.now()}`,
      timestamp,
      agentName: 'COMMAND',
      message: '[COMMAND] Step 4: AI Facility Matching: Incident INC-01 (Structural Fire) matched to Victoria Hospital (Burn ICU Hub - 14/120 beds). Burn ICU bed reservation locked.',
      severity: 'INFO',
    };

    const logisticsLog: AgentLog = {
      id: `LOG-CORR-${Date.now() + 1}`,
      timestamp,
      agentName: 'LOGISTICS',
      message: '[LOGISTICS] Generated Leg 2 Evacuation corridor: Indiranagar -> Victoria Hospital Burn ICU gate (7.2 km road vector).',
      severity: 'INFO',
    };

    setWorldState((prev) => ({
      ...prev,
      activeIncidents: prev.activeIncidents.map((inc) => {
        if (inc.id === 'INC-01') {
          return {
            ...inc,
            targetHospitalId: 'HOSP-01',
            matchedSpecialty: 'Victoria Hospital (Burn ICU Hub)',
          };
        }
        return inc;
      }),
      resources: prev.resources.map((r) => {
        if (r.id === 'AMB-03') {
          return {
            ...r,
            targetHospitalId: 'HOSP-01',
            targetHospitalName: 'Victoria Hospital (Burn ICU Hub)',
            lifecycleStep: 4,
            patientPayload: {
              condition: 'Severe 3rd Degree Inhalation & Burn Trauma',
              vitals: 'BP 110/70, SpO2 96% on 15L O2',
              specialtyRequired: 'Burn ICU',
              targetHospital: 'Victoria Hospital (Burn ICU Hub)',
            },
          };
        }
        return r;
      }),
      agentLogs: [...prev.agentLogs, matchLog, logisticsLog],
    }));

    setLastHeartbeat(timestamp);
  }, []);

  /**
   * STEP 5: HOSPITAL EVACUATION (Leg 2 Transport)
   * Generates new Leg 2 route polyline (Incident -> Hospital in Medical Emerald #10b981)
   * Vehicle status: PATIENT_LOADED_EVACUATING
   * Marks Leg 1 route as subtle faded trail
   */
  const step5TransportPatient = useCallback(() => {
    setCurrentLifecycleStep(5);
    const timestamp = getTimestamp();

    const leg2Routes: RouteGeometry[] = [
      {
        id: 'ROUTE-EVAC-BURN-VICTORIA',
        resourceId: 'AMB-03',
        incidentId: 'INC-01',
        hospitalId: 'HOSP-01',
        type: 'HOSPITAL_TRANSPORT',
        legNumber: 2,
        coordinates: ROUTE_COORDS_EVAC_BURN_VICTORIA,
        isPendingApproval: false,
        color: '#10b981', // Medical Emerald Leg 2
        label: 'AMB-03 Leg 2: Victoria Hospital Burn ICU Evacuation',
        currentEtaMinutes: 4.8,
        totalDistanceKm: 7.2,
      },
      {
        id: 'ROUTE-01-FIRE',
        resourceId: 'FIRE-01',
        incidentId: 'INC-01',
        hospitalId: 'HOSP-03',
        type: 'DISPATCH',
        legNumber: 1,
        coordinates: ROUTE_COORDS_FIRE_01,
        isPendingApproval: false,
        color: '#475569', // Subtle faded Leg 1 trail
        label: 'FIRE-01 On-Scene Indiranagar',
      },
      {
        id: 'ROUTE-01-AMB-FADED',
        resourceId: 'AMB-03',
        incidentId: 'INC-01',
        hospitalId: 'HOSP-03',
        type: 'DISPATCH',
        legNumber: 1,
        coordinates: ROUTE_COORDS_AMB_03_FIRE,
        isPendingApproval: false,
        color: '#334155', // Subtle historic trail
        label: 'AMB-03 Leg 1 Historic Trail',
      },
    ];

    const evacLog: AgentLog = {
      id: `LOG-EVAC-${Date.now()}`,
      timestamp,
      agentName: 'LOGISTICS',
      message: '[LOGISTICS] Step 5: Code-3 Patient Evacuation underway: AMB-03 en route to Victoria Hospital Burn ICU along road-snapped emergency vector.',
      severity: 'CRITICAL',
    };

    setWorldState((prev) => ({
      ...prev,
      activeRoutes: leg2Routes,
      resources: prev.resources.map((r) => {
        if (r.id === 'AMB-03') {
          return {
            ...r,
            status: 'PATIENT_LOADED_EVACUATING' as const,
            lifecycleStep: 5,
            targetHospitalId: 'HOSP-01',
            targetHospitalName: 'Victoria Hospital (Burn ICU Hub)',
            currentEtaMinutes: 4.8,
            distanceRemainingKm: 7.2,
          };
        }
        return r;
      }),
      agentLogs: [...prev.agentLogs, evacLog],
    }));

    setSelectedResourceId('AMB-03');
    setLastHeartbeat(timestamp);
  }, []);

  /**
   * STEP 6: PATIENT DELIVERED & BED ALLOCATION
   * Unit arrives at hospital gate; status updates to ARRIVED_HOSPITAL;
   * Target hospital available beds decrements in real-time (14 -> 13)
   */
  const step6PatientDelivered = useCallback(() => {
    setCurrentLifecycleStep(6);
    const timestamp = getTimestamp();

    const deliveredLog: AgentLog = {
      id: `LOG-DELIVERED-${Date.now()}`,
      timestamp,
      agentName: 'COMMAND',
      message: '[COMMAND AGENT] Step 6: Patient arrived at Victoria Hospital emergency bay. Bed allocated (Available beds: 14 -> 13). Clinical handover complete.',
      severity: 'INFO',
    };

    setWorldState((prev) => ({
      ...prev,
      // Decrement bed count on HOSP-01
      hospitals: prev.hospitals.map((h) => {
        if (h.id === 'HOSP-01') {
          return {
            ...h,
            availableBeds: Math.max(0, h.availableBeds - 1),
          };
        }
        return h;
      }),
      resources: prev.resources.map((r) => {
        if (r.id === 'AMB-03') {
          return {
            ...r,
            status: 'ARRIVED_HOSPITAL' as const,
            lifecycleStep: 6,
            currentEtaMinutes: 0,
            distanceRemainingKm: 0,
          };
        }
        return r;
      }),
      agentLogs: [...prev.agentLogs, deliveredLog],
    }));

    setLastHeartbeat(timestamp);
  }, []);

  /**
   * STEP 7: UNIT TURNAROUND & RESET TO AVAILABLE / IDLE
   * Unit completes sanitization and resets to MISSION_RESOLVED / AVAILABLE / IDLE at base
   */
  const step7UnitAvailable = useCallback(() => {
    setCurrentLifecycleStep(7);
    const timestamp = getTimestamp();

    const availableLog: AgentLog = {
      id: `LOG-AVAIL-${Date.now()}`,
      timestamp,
      agentName: 'COMMAND',
      message: '[COMMAND AGENT] Patient safely admitted to Victoria Hospital (Burn ICU Hub) Emergency Triage. Unit AMB-03 restocked and available for redeployment.',
      severity: 'INFO',
    };

    setWorldState((prev) => ({
      ...prev,
      resources: prev.resources.map((r) => {
        if (r.id === 'AMB-03') {
          return {
            ...r,
            status: 'MISSION_RESOLVED' as const,
            lifecycleStep: 7,
            assignedIncidentId: undefined,
            targetHospitalId: undefined,
            targetHospitalName: undefined,
            patientPayload: undefined,
          };
        }
        return r;
      }),
      agentLogs: [...prev.agentLogs, availableLog],
    }));

    setLastHeartbeat(timestamp);
  }, []);

  /**
   * Master Lifecycle Step Trigger
   */
  const triggerLifecycleStep = useCallback(
    (step: EmergencyLifecycleStep) => {
      switch (step) {
        case 1:
          step1Dispatch();
          break;
        case 2:
          step2TrafficGridlock();
          break;
        case 3:
          step3OnSceneTriage();
          break;
        case 4:
          step4SpecializedHospitalMatch();
          break;
        case 5:
          step5TransportPatient();
          break;
        case 6:
          step6PatientDelivered();
          break;
        case 7:
          step7UnitAvailable();
          break;
      }
    },
    [
      step1Dispatch,
      step2TrafficGridlock,
      step3OnSceneTriage,
      step4SpecializedHospitalMatch,
      step5TransportPatient,
      step6PatientDelivered,
      step7UnitAvailable,
    ]
  );

  /**
   * Auto-Pilot Simulator: Automatically cycles through all 7 steps smoothly and deliberately
   * Calibrated with slow, presentation-ready pacing so observers can clearly monitor vehicle movements and response corridors
   */
  const toggleAutoPilot = useCallback(() => {
    setIsAutoPilot((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isAutoPilot || !isPlaying) {
      if (autoPilotTimerRef.current) {
        clearTimeout(autoPilotTimerRef.current);
        autoPilotTimerRef.current = null;
      }
      return;
    }

    // Step-specific baseline durations (in milliseconds) for controlled, cinematic pitch pacing:
    // Step 1: 20.0s (Units FIRE-01, AMB-03, AMB-01 drive Leg 1 along road network in tactical corridors)
    // Step 2: 20.0s (Severe red gridlock detected, AI calculates bypass, AMB-01 travels detour)
    // Step 3: 6.5s (On-scene arrival, triage countdown timer, green beacon)
    // Step 4: 6.5s (Command Agent AI matches Victoria Hospital Burn ICU, bed reservation locked)
    // Step 5: 22.0s (AMB-03 transports patient along Medical Emerald evacuation corridor to Victoria Hospital)
    // Step 6: 6.5s (Patient delivered at hospital gate, ICU bed count decrements in real-time)
    // Step 7: 6.5s (Ambulance restocked & sanitized, resets to AVAILABLE)
    const getBaseStepDuration = (step: EmergencyLifecycleStep): number => {
      switch (step) {
        case 1:
          return 20000;
        case 2:
          return 20000;
        case 3:
          return 6500;
        case 4:
          return 6500;
        case 5:
          return 22000;
        case 6:
          return 6500;
        case 7:
          return 6500;
        default:
          return 12000;
      }
    };

    let isCancelled = false;

    const scheduleStep = (currentStep: EmergencyLifecycleStep) => {
      if (isCancelled || !isPlaying) return;
      const baseDuration = getBaseStepDuration(currentStep);
      const effectiveDuration = Math.round(baseDuration / playbackSpeed);

      autoPilotTimerRef.current = setTimeout(() => {
        if (isCancelled) return;
        const nextStep = ((currentStep % 7) + 1) as EmergencyLifecycleStep;
        triggerLifecycleStep(nextStep);
        scheduleStep(nextStep);
      }, effectiveDuration);
    };

    scheduleStep(currentLifecycleStep);

    return () => {
      isCancelled = true;
      if (autoPilotTimerRef.current) {
        clearTimeout(autoPilotTimerRef.current);
        autoPilotTimerRef.current = null;
      }
    };
  }, [isAutoPilot, isPlaying, playbackSpeed, currentLifecycleStep, triggerLifecycleStep]);

  /**
   * Scenario: Traffic Jam & Dynamic Detour
   */
  const injectTrafficJam = useCallback(() => {
    step2TrafficGridlock();
  }, [step2TrafficGridlock]);

  /**
   * Scenario: Multi-Unit Disruption (Phase 2)
   */
  const injectDisruption = useCallback(() => {
    setWorldState(disruptedWorldState);
    setSelectedIncidentId('INC-03');
    setLastHeartbeat(getTimestamp());
  }, []);

  /**
   * Human-In-The-Loop Approval
   */
  const approveReallocation = useCallback(() => {
    setWorldState((prev) => {
      if (!prev.pendingApproval) return prev;

      const approval = prev.pendingApproval;
      const timestamp = getTimestamp();

      const updatedRoutes: RouteGeometry[] = prev.activeRoutes
        .filter((r) => r.id !== 'ROUTE-02-ORIGINAL' && r.id !== 'ROUTE-03-PENDING')
        .concat([
          {
            id: 'ROUTE-03-COMMITTED',
            resourceId: approval.resourceId,
            incidentId: approval.incidentId,
            hospitalId: 'HOSP-02',
            type: 'DISPATCH',
            legNumber: 1,
            coordinates: ROUTE_COORDS_AMB_01_REROUTED_TO_MG_ROAD,
            isPendingApproval: false,
            color: '#06b6d4', // Committed ALS dispatch cyan
            label: 'AMB-01 Committed Diversion Vector',
          },
        ]);

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
   * Human-In-The-Loop Rejection
   */
  const rejectReallocation = useCallback(() => {
    setWorldState((prev) => {
      if (!prev.pendingApproval) return prev;

      const approval = prev.pendingApproval;
      const timestamp = getTimestamp();

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
   * Reset Grid State
   */
  const resetState = useCallback(() => {
    setWorldState(initialWorldState);
    setSelectedIncidentId(null);
    setSelectedResourceId(null);
    setCurrentLifecycleStep(1);
    setIsAutoPilot(false);
    setLastHeartbeat(getTimestamp());
  }, []);

  /**
   * Toggle Mock / Live Mode
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
            // Malformed packet ignored
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
    currentLifecycleStep,
    isAutoPilot,
    isPlaying,
    playbackSpeed,
    togglePlayback,
    setPlaybackSpeed,
    triggerLifecycleStep,
    step1Dispatch,
    step2TrafficGridlock,
    step3OnSceneTriage,
    step4SpecializedHospitalMatch,
    step5TransportPatient,
    step6PatientDelivered,
    step7UnitAvailable,
    toggleAutoPilot,
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
                  resources: prev.resources.map((r) =>
                    typeof r === 'object' && r !== null && '_id' in r && (r as Record<string, unknown>)._id === resource?._id
                      ? (resource as TResource)
                      : r
                  ),
                  incidents: prev.incidents.map((i) =>
                    typeof i === 'object' && i !== null && '_id' in i && (i as Record<string, unknown>)._id === affectedIncident?._id
                      ? (affectedIncident as TIncident)
                      : i
                  ),
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