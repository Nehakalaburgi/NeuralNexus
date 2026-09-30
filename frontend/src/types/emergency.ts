/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * Core TypeScript Data Contracts & Domain Models
 * Strict Mode Enforced: Zero Placeholders, No `any`, No `@ts-ignore`
 */

/**
 * Incident Severity Classification
 * 1: Minor (First-aid, Non-critical)
 * 2: Moderate (Stable injury/illness)
 * 3: Urgent (Serious condition requiring rapid transport)
 * 4: Severe (Life-threatening trauma or uncontrolled hazard)
 * 5: Catastrophic / Critical Mass Casualty (Immediate preemption priority)
 */
export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Operational lifecycle stages of an emergency incident
 */
export type IncidentStatus = 'PENDING' | 'TRIAGED' | 'ASSIGNED' | 'RESOLVED';

/**
 * Emergency Response Unit Categories
 */
export type ResourceType = 'AMBULANCE' | 'FIRE_TRUCK' | 'RESCUE_TEAM';

/**
 * Real-time operational state of a fleet unit across the 2-leg emergency mission lifecycle
 */
export type ResourceStatus =
  | 'IDLE'
  | 'DISPATCHED'
  | 'DISPATCHED_TO_SCENE'
  | 'ON_SCENE'
  | 'ON_SCENE_TRIAGING'
  | 'TRANSPORTING_PATIENT'
  | 'PATIENT_LOADED_EVACUATING'
  | 'EVACUATING_TO_HOSPITAL'
  | 'ARRIVED_HOSPITAL'
  | 'ADMITTED_AT_HOSPITAL'
  | 'PATIENT_DELIVERED'
  | 'MISSION_RESOLVED'
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'REROUTED';

/**
 * Autonomous Multi-Agent System Member Identifiers
 */
export type AgentName = 'TRIAGE' | 'LOGISTICS' | 'ALLOCATION' | 'COMMAND';

/**
 * Severity level for telemetry logs
 */
export type LogSeverity = 'INFO' | 'WARN' | 'CRITICAL';

/**
 * Urgency tag for Human-In-The-Loop approvals
 */
export type ApprovalUrgency = 'HIGH' | 'CRITICAL';

/**
 * Global operational system state indicator
 */
export type SystemStatus = 'ONLINE' | 'REASSESSING' | 'DISRUPTED';

/**
 * Dashboard execution mode
 */
export type SystemMode = 'MOCK' | 'LIVE_WS';

/**
 * Geographic Coordinate representation in [longitude, latitude] GeoJSON standard
 */
export type Coordinates = [number, number];

/**
 * Geographic Latitude/Longitude coordinate object
 */
export interface GeoLocation {
  lat: number;
  lng: number;
}

/**
 * Incident Location with human-readable street/metro address
 */
export interface IncidentLocation extends GeoLocation {
  address: string;
}

/**
 * Emergency Incident Model
 */
export interface Incident {
  id: string;
  title: string;
  severity: SeverityLevel;
  location: IncidentLocation;
  status: IncidentStatus;
  requiredResources: ResourceType[];
  assignedResourceId?: string;
  assignedResourceIds?: string[];
  targetHospitalId?: string;
  matchedSpecialty?: string;
  reportedAt: string;
  description?: string;
}

/**
 * Mapbox Visual Base Styles
 */
export type MapStyleId = 'dark' | 'satellite' | 'streets';

/**
 * Real-time Traffic Congestion Levels
 */
export type TrafficCongestionLevel = 'low' | 'moderate' | 'heavy' | 'severe';

/**
 * Traffic bottleneck corridor segment
 */
export interface TrafficSegment {
  id: string;
  name: string;
  congestion: TrafficCongestionLevel;
  coordinates: Coordinates[];
  delayMinutes: number;
  speedKmH: number;
  description?: string;
}

/**
 * Traffic status indicator on fleet resources
 */
export type UnitTrafficStatus = 'CLEAR' | 'BOTTLENECK' | 'REROUTED_BYPASS';

/**
 * 7-Step Emergency Dispatch-To-Hospital Lifecycle Stages
 */
export type EmergencyLifecycleStep =
  | 1 // 1. Dispatched on Primary Route
  | 2 // 2. Traffic Gridlock Detected & Dynamic Bypass Reroute
  | 3 // 3. On-Scene Arrival & Triage Timer
  | 4 // 4. Command Agent Matches Specialized Facility
  | 5 // 5. Leg 2 Hospital Transport (Transporting Patient)
  | 6 // 6. Patient Delivered & Bed Allocation
  | 7; // 7. Turnaround Complete & Unit Available

/**
 * Demo Presentation Playback Speed
 */
export type PlaybackSpeed = 0.5 | 1.0;

/**
 * Emergency Fleet Vehicle / Unit Model
 */
export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  location: GeoLocation;
  baseHospitalId?: string;
  currentEtaMinutes?: number;
  distanceRemainingKm?: number;
  assignedIncidentId?: string;
  targetHospitalId?: string;
  targetHospitalName?: string;
  heading?: number;
  trafficStatus?: UnitTrafficStatus;
  trafficDelayMinutes?: number;
  trafficSavingsMinutes?: number;
  lifecycleStep?: EmergencyLifecycleStep;
  triageSecondsRemaining?: number;
  demoMilestone?: string;
  patientPayload?: {
    condition: string;
    vitals: string;
    specialtyRequired: string;
    targetHospital: string;
  };
}

/**
 * Medical Facility / Trauma Center Model
 */
export interface Hospital {
  id: string;
  name: string;
  location: GeoLocation;
  availableBeds: number;
  totalBeds: number;
  traumaLevel?: number;
  address?: string;
  specialization?: string;
  specialties?: string[];
}

/**
 * Emergency Route Segment Category
 */
export type RouteType =
  | 'DISPATCH'
  | 'EVACUATION'
  | 'HOSPITAL_TRANSPORT'
  | 'REROUTE'
  | 'DETOUR'
  | 'CONGESTED_ORIGINAL';

/**
 * GeoJSON Polyline Route Geometry representation for Mapbox GL
 */
export interface RouteGeometry {
  id: string;
  resourceId?: string;
  incidentId?: string;
  hospitalId?: string;
  type?: RouteType;
  coordinates: Coordinates[];
  isPendingApproval: boolean;
  color: string;
  label?: string;
  totalDistanceKm?: number;
  distanceRemainingKm?: number;
  currentEtaMinutes?: number;
  isCongested?: boolean;
  trafficWarning?: string;
  legNumber?: 1 | 2;
}

/**
 * Real-time Telemetry and Reasoning Log from Multi-Agent system
 */
export interface AgentLog {
  id: string;
  timestamp: string;
  agentName: AgentName;
  message: string;
  severity?: LogSeverity;
}

/**
 * Human-in-the-Loop (HITL) Unit Reallocation Request
 */
export interface PendingApproval {
  id: string;
  incidentId: string;
  incidentTitle: string;
  severity: SeverityLevel;
  resourceId: string;
  resourceName: string;
  previousIncidentId?: string;
  previousIncidentTitle?: string;
  rationale: string;
  urgency: ApprovalUrgency;
  timestamp: string;
}

/**
 * Core Control Room Aggregate Metrics
 */
export interface WorldMetrics {
  activeIncidents: number;
  availableResources: number;
  totalFleet: number;
  avgResponseTimeMin: number;
}

/**
 * Complete Global World State Snapshot
 */
export interface WorldState {
  systemStatus: SystemStatus;
  activeIncidents: Incident[];
  resources: Resource[];
  hospitals: Hospital[];
  activeRoutes: RouteGeometry[];
  agentLogs: AgentLog[];
  pendingApproval: PendingApproval | null;
  metrics: WorldMetrics;
  trafficSegments?: TrafficSegment[];
  isTrafficCongested?: boolean;
}
