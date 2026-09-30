/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * Bengaluru Metro Geospatial Benchmark Dataset & State Snapshots
 * Fully typed, strictly conformant, zero placeholders.
 */

import { Hospital, Incident, Resource, RouteGeometry, AgentLog, WorldState } from '../types/emergency';

/**
 * 4 Major Bengaluru Medical & Trauma Centers with Specialized Departments
 * Coordinates in [longitude, latitude] GeoJSON standard
 */
export const BENGALURU_HOSPITALS: Hospital[] = [
  {
    id: 'HOSP-01',
    name: 'Victoria Hospital (Burn ICU Hub)',
    location: {
      lat: 12.9634,
      lng: 77.5739,
    },
    availableBeds: 14,
    totalBeds: 120,
    traumaLevel: 1,
    specialization: 'Burn ICU & Critical Inhalation Trauma',
    specialties: ['Burn ICU', 'Toxicology', 'Hazmat Decontamination', 'Level-1 Trauma'],
    address: 'Fort Road, Near City Market, Kalasipalya, Bengaluru',
  },
  {
    id: 'HOSP-02',
    name: 'Bowring & Lady Curzon Hospital',
    location: {
      lat: 12.9830,
      lng: 77.6047,
    },
    availableBeds: 8,
    totalBeds: 85,
    traumaLevel: 2,
    specialization: 'Central Mass Casualty & Emergency',
    specialties: ['Mass Casualty Triage', 'Emergency Medicine', 'Pediatric ICU'],
    address: 'Lady Curzon Rd, Tasker Town, Shivajinagar, Bengaluru',
  },
  {
    id: 'HOSP-03',
    name: 'Manipal Hospital (Old Airport Rd)',
    location: {
      lat: 12.9584,
      lng: 77.6517,
    },
    availableBeds: 22,
    totalBeds: 150,
    traumaLevel: 1,
    specialization: 'Cardiology, Cath Lab & Stroke Unit',
    specialties: ['Cardiology Cath Lab', 'Neuro-Trauma', 'Comprehensive Stroke', 'Level-1 Trauma'],
    address: '98, HAL Old Airport Rd, Kodihalli, Bengaluru',
  },
  {
    id: 'HOSP-04',
    name: "St. John's Medical College Hospital",
    location: {
      lat: 12.9345,
      lng: 77.6195,
    },
    availableBeds: 18,
    totalBeds: 140,
    traumaLevel: 1,
    specialization: 'Level-1 Polytrauma & Surgical Suites',
    specialties: ['Polytrauma Resuscitation', 'Orthopedic Trauma', 'Cardiothoracic Surgery'],
    address: 'Sarjapur - Marathahalli Rd, John Nagar, Koramangala, Bengaluru',
  },
];

/**
 * Geographic Polylines for Realistic Metro Routes in Bengaluru
 * High-Precision True Road-Snapped Coordinates (Mapbox Driving Directions API)
 * Every point is physically aligned to actual streets, curves, and turns in Bengaluru.
 */
import {
  ROUTE_COORDS_FIRE_01,
  ROUTE_COORDS_AMB_03_FIRE,
  ROUTE_COORDS_AMB_01_INITIAL,
  ROUTE_COORDS_AMB_01_TRAFFIC_DETOUR,
  ROUTE_COORDS_AMB_01_REROUTED_TO_MG_ROAD,
  ROUTE_COORDS_AMB_02_PATROL,
  ROUTE_COORDS_EVAC_INC_01,
  ROUTE_COORDS_EVAC_INC_02,
  ROUTE_COORDS_EVAC_INC_03,
} from './roadRoutes';

export {
  ROUTE_COORDS_FIRE_01,
  ROUTE_COORDS_AMB_03_FIRE,
  ROUTE_COORDS_AMB_01_INITIAL,
  ROUTE_COORDS_AMB_01_TRAFFIC_DETOUR,
  ROUTE_COORDS_AMB_01_REROUTED_TO_MG_ROAD,
  ROUTE_COORDS_AMB_02_PATROL,
  ROUTE_COORDS_EVAC_INC_01,
  ROUTE_COORDS_EVAC_INC_02,
  ROUTE_COORDS_EVAC_INC_03,
  ROUTE_COORDS_EVAC_BURN_VICTORIA,
  ROUTE_COORDS_EVAC_CARDIAC_MANIPAL,
  ROUTE_COORDS_EVAC_TRAUMA_ST_JOHNS,
} from './roadRoutes';

/**
 * Baseline Incidents (Phase 1 / Normal Ingestion)
 */
export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-01',
    title: 'Commercial Complex Structural Fire',
    severity: 4,
    location: {
      lat: 12.9784,
      lng: 77.6413,
      address: '100ft Rd, Indiranagar, Bengaluru',
    },
    status: 'ASSIGNED',
    requiredResources: ['FIRE_TRUCK', 'AMBULANCE'],
    assignedResourceId: 'FIRE-01, AMB-03',
    assignedResourceIds: ['FIRE-01', 'AMB-03'],
    targetHospitalId: 'HOSP-03',
    reportedAt: '16:18:22 IST',
    description: 'Active electrical blaze on 2nd floor retail complex with heavy smoke entrapment. Dual response active: Fire containment + burn trauma standby.',
  },
  {
    id: 'INC-02',
    title: 'Acute Cardiac Distress (Elderly Patient)',
    severity: 2,
    location: {
      lat: 12.9352,
      lng: 77.6200,
      address: '5th Block, Koramangala, Bengaluru',
    },
    status: 'ASSIGNED',
    requiredResources: ['AMBULANCE'],
    assignedResourceId: 'AMB-01',
    assignedResourceIds: ['AMB-01'],
    targetHospitalId: 'HOSP-04',
    reportedAt: '16:24:10 IST',
    description: '68yo male experiencing crushing chest pain and shortness of breath. Patient conscious, vitals stable, ALS oxygen unit requested.',
  },
];

/**
 * Baseline Fleet Units (Phase 1 / Normal Ingestion)
 * All emergency response units actively dispatched with 60fps telemetry and road-snapped corridors
 */
export const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'FIRE-01',
    name: 'Heavy Tender T-04',
    type: 'FIRE_TRUCK',
    status: 'DISPATCHED',
    location: {
      lat: 12.9740,
      lng: 77.6250,
    },
    baseHospitalId: 'HOSP-03',
    currentEtaMinutes: 6,
    distanceRemainingKm: 2.8,
    assignedIncidentId: 'INC-01',
    heading: 75,
  },
  {
    id: 'AMB-03',
    name: 'Trauma Medic Unit Echo-3',
    type: 'AMBULANCE',
    status: 'DISPATCHED',
    location: {
      lat: 12.9584,
      lng: 77.6517,
    },
    baseHospitalId: 'HOSP-03',
    currentEtaMinutes: 4,
    distanceRemainingKm: 1.9,
    assignedIncidentId: 'INC-01',
    heading: 330,
  },
  {
    id: 'AMB-01',
    name: 'ALS Unit Bravo-1',
    type: 'AMBULANCE',
    status: 'DISPATCHED',
    location: {
      lat: 12.9550,
      lng: 77.6050,
    },
    baseHospitalId: 'HOSP-04',
    currentEtaMinutes: 4,
    distanceRemainingKm: 2.1,
    assignedIncidentId: 'INC-02',
    heading: 145,
  },
  {
    id: 'AMB-02',
    name: 'BLS Unit Delta-2',
    type: 'AMBULANCE',
    status: 'DISPATCHED',
    location: {
      lat: 12.9760,
      lng: 77.6000,
    },
    baseHospitalId: 'HOSP-02',
    currentEtaMinutes: 3,
    distanceRemainingKm: 1.4,
    assignedIncidentId: 'INC-03-STANDBY',
    heading: 270,
  },
  {
    id: 'RESCUE-01',
    name: 'Disaster Response Squad R-1',
    type: 'RESCUE_TEAM',
    status: 'IDLE',
    location: {
      lat: 12.9634,
      lng: 77.5739,
    },
    baseHospitalId: 'HOSP-01',
    heading: 0,
  },
];

/**
 * Baseline Active Routes (Two-Tone Blue Emergency Corridors)
 */
export const INITIAL_ROUTES: RouteGeometry[] = [
  // 1. FIRE-01 -> Indiranagar Fire INC-01 (Neon Sky Blue Leg 1)
  {
    id: 'ROUTE-01-FIRE',
    resourceId: 'FIRE-01',
    incidentId: 'INC-01',
    hospitalId: 'HOSP-03',
    type: 'DISPATCH',
    legNumber: 1,
    coordinates: ROUTE_COORDS_FIRE_01,
    isPendingApproval: false,
    color: '#38bdf8', // Neon Sky Blue Leg 1
    label: 'FIRE-01 Primary Response Vector',
  },
  // 2. AMB-03 -> Indiranagar Fire INC-01 (Neon Sky Blue Leg 1)
  {
    id: 'ROUTE-01-AMB',
    resourceId: 'AMB-03',
    incidentId: 'INC-01',
    hospitalId: 'HOSP-03',
    type: 'DISPATCH',
    legNumber: 1,
    coordinates: ROUTE_COORDS_AMB_03_FIRE,
    isPendingApproval: false,
    color: '#38bdf8', // Neon Sky Blue Leg 1
    label: 'AMB-03 ALS Dispatch Vector',
  },
  // 3. AMB-01 -> Koramangala Cardiac INC-02 (Neon Sky Blue Leg 1)
  {
    id: 'ROUTE-02',
    resourceId: 'AMB-01',
    incidentId: 'INC-02',
    hospitalId: 'HOSP-04',
    type: 'DISPATCH',
    legNumber: 1,
    coordinates: ROUTE_COORDS_AMB_01_INITIAL,
    isPendingApproval: false,
    color: '#38bdf8', // Neon Sky Blue Leg 1
    label: 'AMB-01 ALS Dispatch Vector',
  },
  // 4. AMB-02 -> Central Corridor Standby Dispatch (Neon Sky Blue Leg 1)
  {
    id: 'ROUTE-02-DELTA',
    resourceId: 'AMB-02',
    incidentId: 'INC-03-STANDBY',
    hospitalId: 'HOSP-02',
    type: 'DISPATCH',
    legNumber: 1,
    coordinates: ROUTE_COORDS_AMB_02_PATROL,
    isPendingApproval: false,
    color: '#38bdf8', // Neon Sky Blue Leg 1
    label: 'AMB-02 BLS Standby Vector',
  },
  // 5. Evacuation Corridor: INC-01 Indiranagar -> HOSP-03 Manipal Hospital (Deep Cobalt Blue Leg 2)
  {
    id: 'ROUTE-EVAC-INC-01',
    incidentId: 'INC-01',
    hospitalId: 'HOSP-03',
    type: 'EVACUATION',
    legNumber: 2,
    coordinates: ROUTE_COORDS_EVAC_INC_01,
    isPendingApproval: false,
    color: '#2563eb', // Deep Cobalt Blue Leg 2
    label: 'INC-01 -> Manipal Trauma Evacuation Corridor',
  },
  // 6. Evacuation Corridor: INC-02 Koramangala -> HOSP-04 St. John's Hospital (Deep Cobalt Blue Leg 2)
  {
    id: 'ROUTE-EVAC-INC-02',
    incidentId: 'INC-02',
    hospitalId: 'HOSP-04',
    type: 'EVACUATION',
    legNumber: 2,
    coordinates: ROUTE_COORDS_EVAC_INC_02,
    isPendingApproval: false,
    color: '#2563eb', // Deep Cobalt Blue Leg 2
    label: 'INC-02 -> St. Johns Medical Evacuation Corridor',
  },
];

/**
 * Baseline Agent Reasoning Telemetry Stream
 */
export const INITIAL_AGENT_LOGS: AgentLog[] = [
  {
    id: 'LOG-001',
    timestamp: '16:18:25 IST',
    agentName: 'TRIAGE',
    message: '[TRIAGE] Indiranagar Structural Fire escalated: requires dual response (1x Fire Engine for containment, 1x ALS Ambulance for burn/smoke trauma standby).',
    severity: 'WARN',
  },
  {
    id: 'LOG-002',
    timestamp: '16:18:30 IST',
    agentName: 'LOGISTICS',
    message: 'Calculated multi-corridor travel isochrones: FIRE-01 via CMH Rd (ETA 6m), ALS AMB-03 via 100ft South Rd (ETA 4m). Designated Level-1 Trauma Hub: Manipal Hospital (22 beds).',
    severity: 'INFO',
  },
  {
    id: 'LOG-003',
    timestamp: '16:18:35 IST',
    agentName: 'ALLOCATION',
    message: 'Dual dispatch locked to INC-01: Heavy Tender FIRE-01 + ALS Unit AMB-03. Converging route vectors & Manipal Hospital evacuation corridor synchronized.',
    severity: 'INFO',
  },
  {
    id: 'LOG-004',
    timestamp: '16:24:15 IST',
    agentName: 'TRIAGE',
    message: 'Ingested call #INC-02 (Koramangala 5th Block). Cardiac distress, vitals stable. Severity classified: 2.',
    severity: 'INFO',
  },
  {
    id: 'LOG-005',
    timestamp: '16:24:22 IST',
    agentName: 'ALLOCATION',
    message: 'Dispatched ALS Unit AMB-01 from Richmond staging to INC-02. ETA 4 min. Base hospital St. Johns (18 beds) established as receiving trauma corridor.',
    severity: 'INFO',
  },
  {
    id: 'LOG-006',
    timestamp: '16:26:00 IST',
    agentName: 'COMMAND',
    message: 'Grid operating at optimal throughput. Active incidents: 2. Dispatched units: 3. Hospital evacuation corridors online.',
    severity: 'INFO',
  },
];

/**
 * Complete Baseline World State Snapshot (Normal Ingestion)
 */
export const initialWorldState: WorldState = {
  systemStatus: 'ONLINE',
  activeIncidents: INITIAL_INCIDENTS,
  resources: INITIAL_RESOURCES,
  hospitals: BENGALURU_HOSPITALS,
  activeRoutes: INITIAL_ROUTES,
  agentLogs: INITIAL_AGENT_LOGS,
  pendingApproval: null,
  metrics: {
    activeIncidents: 2,
    availableResources: 2,
    totalFleet: 5,
    avgResponseTimeMin: 4.8,
  },
};

/**
 * Disruption Incidents (Phase 2)
 */
export const DISRUPTED_INCIDENTS: Incident[] = [
  ...INITIAL_INCIDENTS,
  {
    id: 'INC-03',
    title: 'Multi-Vehicle Collision & Entrapment',
    severity: 5,
    location: {
      lat: 12.9738,
      lng: 77.6186,
      address: 'MG Road / Trinity Circle Junction, Bengaluru',
    },
    status: 'TRIAGED',
    requiredResources: ['AMBULANCE', 'RESCUE_TEAM'],
    targetHospitalId: 'HOSP-02',
    reportedAt: '16:31:05 IST',
    description: 'High-velocity 4-vehicle pileup under Trinity flyover. 3 victims entrapped with severe arterial hemorrhaging and airway compromise. Immediate Level-1 trauma response mandatory.',
  },
];

/**
 * Disrupted Fleet Units (AMB-02 broken down, AMB-01 proposed for reroute, FIRE-01 & AMB-03 on scene at INC-01)
 */
export const DISRUPTED_RESOURCES: Resource[] = [
  {
    id: 'FIRE-01',
    name: 'Heavy Tender T-04',
    type: 'FIRE_TRUCK',
    status: 'DISPATCHED',
    location: {
      lat: 12.97417,
      lng: 77.624945,
    },
    baseHospitalId: 'HOSP-03',
    currentEtaMinutes: 4,
    distanceRemainingKm: 1.8,
    assignedIncidentId: 'INC-01',
    heading: 75,
  },
  {
    id: 'AMB-03',
    name: 'Trauma Medic Unit Echo-3',
    type: 'AMBULANCE',
    status: 'DISPATCHED',
    location: {
      lat: 12.9584,
      lng: 77.6517,
    },
    baseHospitalId: 'HOSP-03',
    currentEtaMinutes: 2,
    distanceRemainingKm: 0.9,
    assignedIncidentId: 'INC-01',
    heading: 330,
  },
  {
    id: 'AMB-01',
    name: 'ALS Unit Bravo-1',
    type: 'AMBULANCE',
    status: 'REROUTED',
    location: {
      lat: 12.9440,
      lng: 77.6120,
    },
    baseHospitalId: 'HOSP-04',
    currentEtaMinutes: 3,
    distanceRemainingKm: 1.6,
    assignedIncidentId: 'INC-03',
    heading: 355,
  },
  {
    id: 'AMB-02',
    name: 'BLS Unit Delta-2',
    type: 'AMBULANCE',
    status: 'UNAVAILABLE',
    location: {
      lat: 12.9760,
      lng: 77.6000,
    },
    baseHospitalId: 'HOSP-02',
    currentEtaMinutes: undefined,
    distanceRemainingKm: undefined,
    heading: 270,
  },
  {
    id: 'RESCUE-01',
    name: 'Disaster Response Squad R-1',
    type: 'RESCUE_TEAM',
    status: 'IDLE',
    location: {
      lat: 12.9634,
      lng: 77.5739,
    },
    baseHospitalId: 'HOSP-01',
    heading: 0,
  },
];

/**
 * Disrupted Routes (Including Pending Reallocation Route in Amber + Evacuation Corridors)
 */
export const DISRUPTED_ROUTES: RouteGeometry[] = [
  // 1. FIRE-01 -> Indiranagar Fire INC-01 (Neon Sky Blue Leg 1)
  {
    id: 'ROUTE-01-FIRE',
    resourceId: 'FIRE-01',
    incidentId: 'INC-01',
    hospitalId: 'HOSP-03',
    type: 'DISPATCH',
    legNumber: 1,
    coordinates: ROUTE_COORDS_FIRE_01,
    isPendingApproval: false,
    color: '#38bdf8', // Neon Sky Blue
    label: 'FIRE-01 Active Response Vector',
  },
  // 2. AMB-03 -> Indiranagar Fire INC-01 (Neon Sky Blue Leg 1)
  {
    id: 'ROUTE-01-AMB',
    resourceId: 'AMB-03',
    incidentId: 'INC-01',
    hospitalId: 'HOSP-03',
    type: 'DISPATCH',
    legNumber: 1,
    coordinates: ROUTE_COORDS_AMB_03_FIRE,
    isPendingApproval: false,
    color: '#38bdf8', // Neon Sky Blue
    label: 'AMB-03 ALS Dispatch Vector',
  },
  // 3. Evacuation Corridor: INC-01 -> HOSP-03 Manipal Hospital (Deep Cobalt Blue Leg 2)
  {
    id: 'ROUTE-EVAC-INC-01',
    incidentId: 'INC-01',
    hospitalId: 'HOSP-03',
    type: 'EVACUATION',
    legNumber: 2,
    coordinates: ROUTE_COORDS_EVAC_INC_01,
    isPendingApproval: false,
    color: '#2563eb', // Deep Cobalt Blue
    label: 'INC-01 -> Manipal Trauma Evacuation Corridor',
  },
  // 4. Preempted route for AMB-01 to INC-02 (faint trail)
  {
    id: 'ROUTE-02-ORIGINAL',
    resourceId: 'AMB-01',
    incidentId: 'INC-02',
    hospitalId: 'HOSP-04',
    type: 'DISPATCH',
    legNumber: 1,
    coordinates: ROUTE_COORDS_AMB_01_INITIAL,
    isPendingApproval: false,
    color: '#1e3a8a', // Faint historic trail
    label: 'AMB-01 Preempted Vector',
  },
  // 5. Evacuation Corridor: INC-02 -> HOSP-04 St. John's (Deep Cobalt Blue Leg 2)
  {
    id: 'ROUTE-EVAC-INC-02',
    incidentId: 'INC-02',
    hospitalId: 'HOSP-04',
    type: 'EVACUATION',
    legNumber: 2,
    coordinates: ROUTE_COORDS_EVAC_INC_02,
    isPendingApproval: false,
    color: '#2563eb', // Deep Cobalt Blue
    label: 'INC-02 -> St. Johns Evacuation Corridor',
  },
  // 6. Proposed Reallocation Route: AMB-01 -> MG Road Crash INC-03 (High-Visibility Amber)
  {
    id: 'ROUTE-03-PENDING',
    resourceId: 'AMB-01',
    incidentId: 'INC-03',
    hospitalId: 'HOSP-02',
    type: 'REROUTE',
    legNumber: 1,
    coordinates: ROUTE_COORDS_AMB_01_REROUTED_TO_MG_ROAD,
    isPendingApproval: true,
    color: '#f59e0b', // Dynamic Amber diversion vector
    label: 'AMB-01 Proposed Diversion Vector (Amber)',
  },
  // 7. Evacuation Corridor: INC-03 MG Road -> HOSP-02 Bowring Hospital
  {
    id: 'ROUTE-EVAC-INC-03',
    incidentId: 'INC-03',
    hospitalId: 'HOSP-02',
    type: 'EVACUATION',
    legNumber: 2,
    coordinates: ROUTE_COORDS_EVAC_INC_03,
    isPendingApproval: false,
    color: '#2563eb', // Deep Cobalt Blue
    label: 'INC-03 -> Bowring Trauma Evacuation Corridor',
  },
];

/**
 * Disrupted Agent Reasoning Stream with Gemini Command Agent Reallocation Rationale
 */
export const DISRUPTED_AGENT_LOGS: AgentLog[] = [
  ...INITIAL_AGENT_LOGS,
  {
    id: 'LOG-007',
    timestamp: '16:30:50 IST',
    agentName: 'LOGISTICS',
    message: 'TELEMETRY FAULT: BLS Unit AMB-02 reported engine transmission failure on MG Rd. Unit status transitioned to UNAVAILABLE.',
    severity: 'CRITICAL',
  },
  {
    id: 'LOG-008',
    timestamp: '16:31:08 IST',
    agentName: 'TRIAGE',
    message: 'INCOMING SEV-5 CALL: Catastrophic 4-car pileup at MG Road / Trinity Circle. Multiple entrapments with arterial bleeding.',
    severity: 'CRITICAL',
  },
  {
    id: 'LOG-009',
    timestamp: '16:31:15 IST',
    agentName: 'ALLOCATION',
    message: 'Grid capacity depleted: Closest idle ambulance AMB-02 is offline. Evaluating active fleet preemption matrix...',
    severity: 'WARN',
  },
  {
    id: 'LOG-010',
    timestamp: '16:31:25 IST',
    agentName: 'COMMAND',
    message: 'PREEMPTION ALGORITHM TRIGGERED: Candidate unit AMB-01 currently servicing Severity 2 cardiac patient. Reallocating AMB-01 to Severity 5 crash saves 11.6 min Golden Hour latency.',
    severity: 'CRITICAL',
  },
  {
    id: 'LOG-011',
    timestamp: '16:31:30 IST',
    agentName: 'COMMAND',
    message: 'HITL GATEWAY: Generated diversion request APPR-8821. Holding execution pending Human Operator verification.',
    severity: 'WARN',
  },
];

/**
 * Complete Disrupted World State Snapshot (Phase 2)
 */
export const disruptedWorldState: WorldState = {
  systemStatus: 'DISRUPTED',
  activeIncidents: DISRUPTED_INCIDENTS,
  resources: DISRUPTED_RESOURCES,
  hospitals: BENGALURU_HOSPITALS,
  activeRoutes: DISRUPTED_ROUTES,
  agentLogs: DISRUPTED_AGENT_LOGS,
  pendingApproval: {
    id: 'APPR-8821',
    incidentId: 'INC-03',
    incidentTitle: 'Multi-Vehicle Collision & Entrapment',
    severity: 5,
    resourceId: 'AMB-01',
    resourceName: 'ALS Unit Bravo-1',
    previousIncidentId: 'INC-02',
    previousIncidentTitle: 'Acute Cardiac Distress (Koramangala 5th Block)',
    rationale: 'CRITICAL PREEMPTION: Severity 5 mass-casualty trauma at MG Road with active airway compromise outweighs stable Severity 2 cardiac patient. AMB-01 is 3.2 mins from Trinity Circle. Standby BLS queue re-ordered for Koramangala. Diverting AMB-01 reduces Level-5 emergency response time from 14.8m to 3.2m (saving 11.6 min Golden Hour window). Dual dispatch for Indiranagar Fire remains active (FIRE-01 + AMB-03).',
    urgency: 'CRITICAL',
    timestamp: '16:31:30 IST',
  },
  metrics: {
    activeIncidents: 3,
    availableResources: 1,
    totalFleet: 5,
    avgResponseTimeMin: 6.8,
  },
};

/**
 * Traffic Jam Scenario: Active Fleet Resources
 * AMB-01 is actively rerouted along the dynamic Victoria Layout bypass detour to beat Hosur Road gridlock
 */
export const TRAFFIC_JAM_RESOURCES: Resource[] = [
  {
    id: 'FIRE-01',
    name: 'Heavy Tender T-04',
    type: 'FIRE_TRUCK',
    status: 'DISPATCHED',
    location: {
      lat: 12.97417,
      lng: 77.624945,
    },
    baseHospitalId: 'HOSP-03',
    currentEtaMinutes: 6,
    distanceRemainingKm: 2.8,
    assignedIncidentId: 'INC-01',
    heading: 75,
  },
  {
    id: 'AMB-03',
    name: 'Trauma Medic Unit Echo-3',
    type: 'AMBULANCE',
    status: 'DISPATCHED',
    location: {
      lat: 12.9584,
      lng: 77.6517,
    },
    baseHospitalId: 'HOSP-03',
    currentEtaMinutes: 4,
    distanceRemainingKm: 1.9,
    assignedIncidentId: 'INC-01',
    heading: 330,
  },
  {
    id: 'AMB-01',
    name: 'ALS Unit Bravo-1',
    type: 'AMBULANCE',
    status: 'REROUTED',
    location: {
      lat: 12.9550,
      lng: 77.6050,
    },
    baseHospitalId: 'HOSP-04',
    currentEtaMinutes: 5,
    distanceRemainingKm: 2.6,
    assignedIncidentId: 'INC-02',
    heading: 135,
    trafficStatus: 'REROUTED_BYPASS',
    trafficSavingsMinutes: 8.8,
  },
  {
    id: 'AMB-02',
    name: 'BLS Unit Delta-2',
    type: 'AMBULANCE',
    status: 'DISPATCHED',
    location: {
      lat: 12.9760,
      lng: 77.6000,
    },
    baseHospitalId: 'HOSP-02',
    currentEtaMinutes: 3,
    distanceRemainingKm: 1.4,
    assignedIncidentId: 'INC-03-STANDBY',
    heading: 270,
  },
  {
    id: 'RESCUE-01',
    name: 'Disaster Response Squad R-1',
    type: 'RESCUE_TEAM',
    status: 'IDLE',
    location: {
      lat: 12.9634,
      lng: 77.5739,
    },
    baseHospitalId: 'HOSP-01',
    heading: 0,
  },
];

/**
 * Traffic Jam Scenario: Active Routes
 * Includes red flashing congested original segment + high-visibility amber dynamic detour vector
 */
export const TRAFFIC_JAM_ROUTES: RouteGeometry[] = [
  // 1. FIRE-01 -> Indiranagar Fire INC-01 (Neon Sky Blue Leg 1)
  {
    id: 'ROUTE-01-FIRE',
    resourceId: 'FIRE-01',
    incidentId: 'INC-01',
    hospitalId: 'HOSP-03',
    type: 'DISPATCH',
    legNumber: 1,
    coordinates: ROUTE_COORDS_FIRE_01,
    isPendingApproval: false,
    color: '#38bdf8', // Neon Sky Blue
    label: 'FIRE-01 Primary Response Vector',
  },
  // 2. AMB-03 -> Indiranagar Fire INC-01 (Neon Sky Blue Leg 1)
  {
    id: 'ROUTE-01-AMB',
    resourceId: 'AMB-03',
    incidentId: 'INC-01',
    hospitalId: 'HOSP-03',
    type: 'DISPATCH',
    legNumber: 1,
    coordinates: ROUTE_COORDS_AMB_03_FIRE,
    isPendingApproval: false,
    color: '#38bdf8', // Neon Sky Blue
    label: 'AMB-03 ALS Dispatch Vector',
  },
  // 3. Evacuation Corridor: INC-01 Indiranagar -> HOSP-03 Manipal Hospital
  {
    id: 'ROUTE-EVAC-INC-01',
    incidentId: 'INC-01',
    hospitalId: 'HOSP-03',
    type: 'EVACUATION',
    legNumber: 2,
    coordinates: ROUTE_COORDS_EVAC_INC_01,
    isPendingApproval: false,
    color: '#2563eb', // Deep Cobalt Blue
    label: 'INC-01 -> Manipal Trauma Evacuation Corridor',
  },
  // 4. Congested Original Route: Hosur Road Gridlock (Flashing Red Warning where Traffic is Present)
  {
    id: 'ROUTE-02-CONGESTED',
    resourceId: 'AMB-01',
    incidentId: 'INC-02',
    hospitalId: 'HOSP-04',
    type: 'CONGESTED_ORIGINAL',
    coordinates: ROUTE_COORDS_AMB_01_INITIAL,
    isPendingApproval: false,
    isCongested: true,
    trafficWarning: 'TRAFFIC BOTTLENECK: Dairy Circle Gridlock (+10m delay)',
    color: '#ef4444', // Glowing Red where traffic is present
    label: 'Hosur Rd Traffic Bottleneck (Red)',
  },
  // 5. Dynamic AI Detour Bypass Route: AMB-01 via Victoria Layout & Adugodi (High-Visibility Amber)
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
    label: 'AMB-01 Active Bypass Route (Amber -8.8m saved)',
  },
  // 6. AMB-02 -> Central Corridor Standby Dispatch (Neon Sky Blue Leg 1)
  {
    id: 'ROUTE-02-DELTA',
    resourceId: 'AMB-02',
    incidentId: 'INC-03-STANDBY',
    hospitalId: 'HOSP-02',
    type: 'DISPATCH',
    legNumber: 1,
    coordinates: ROUTE_COORDS_AMB_02_PATROL,
    isPendingApproval: false,
    color: '#38bdf8', // Neon Sky Blue
    label: 'AMB-02 BLS Standby Vector',
  },
  // 7. Evacuation Corridor: INC-02 Koramangala -> HOSP-04 St. John's Hospital
  {
    id: 'ROUTE-EVAC-INC-02',
    incidentId: 'INC-02',
    hospitalId: 'HOSP-04',
    type: 'EVACUATION',
    legNumber: 2,
    coordinates: ROUTE_COORDS_EVAC_INC_02,
    isPendingApproval: false,
    color: '#2563eb', // Deep Cobalt Blue
    label: 'INC-02 -> St. Johns Evacuation Corridor',
  },
];

/**
 * Traffic Jam Scenario: Multi-Agent Reasoning Telemetry Logs
 */
export const TRAFFIC_JAM_AGENT_LOGS: AgentLog[] = [
  ...INITIAL_AGENT_LOGS,
  {
    id: 'LOG-TRF-001',
    timestamp: '16:27:10 IST',
    agentName: 'LOGISTICS',
    message: 'TRAFFIC INTERCEPT: Severe arterial gridlock detected on Hosur Rd / Dairy Circle corridor (+10 min transit delay, speed < 8 km/h). ETA spiked from 4.0m to 14.0m.',
    severity: 'CRITICAL',
  },
  {
    id: 'LOG-TRF-002',
    timestamp: '16:27:18 IST',
    agentName: 'COMMAND',
    message: 'AUTONOMOUS REROUTING: Diverting ALS Unit AMB-01 via Victoria Layout & Adugodi arterial bypass. Projected ETA reduced to 5.2 mins (saved 8.8 min delay).',
    severity: 'WARN',
  },
  {
    id: 'LOG-TRF-003',
    timestamp: '16:27:25 IST',
    agentName: 'ALLOCATION',
    message: 'Dynamic Traffic Bypass Vector locked on map canvas. Koramangala Cardiac call #INC-02 response time secured within Golden Hour parameters.',
    severity: 'INFO',
  },
];

/**
 * Complete Traffic Jam & Dynamic Detour World State Snapshot
 */
export const trafficJamWorldState: WorldState = {
  systemStatus: 'REASSESSING',
  activeIncidents: INITIAL_INCIDENTS,
  resources: TRAFFIC_JAM_RESOURCES,
  hospitals: BENGALURU_HOSPITALS,
  activeRoutes: TRAFFIC_JAM_ROUTES,
  agentLogs: TRAFFIC_JAM_AGENT_LOGS,
  pendingApproval: null,
  isTrafficCongested: true,
  metrics: {
    activeIncidents: 2,
    availableResources: 2,
    totalFleet: 5,
    avgResponseTimeMin: 5.2,
  },
};
