/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * Bengaluru Metro Geospatial Benchmark Dataset & State Snapshots
 * Fully typed, strictly conformant, zero placeholders.
 */

import { Hospital, Incident, Resource, RouteGeometry, AgentLog, WorldState, Coordinates } from '../types/emergency';

/**
 * 4 Major Bengaluru Medical & Trauma Centers
 * Coordinates in [longitude, latitude] GeoJSON standard
 */
export const BENGALURU_HOSPITALS: Hospital[] = [
  {
    id: 'HOSP-01',
    name: 'Victoria Hospital (Trauma Hub)',
    location: {
      lat: 12.9634,
      lng: 77.5739,
    },
    availableBeds: 14,
    totalBeds: 120,
    traumaLevel: 1,
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
    address: 'Sarjapur - Marathahalli Rd, John Nagar, Koramangala, Bengaluru',
  },
];

/**
 * Geographic Polylines for Realistic Metro Routes in Bengaluru
 * Coordinate sequences follow actual road corridors [lng, lat]
 */
export const ROUTE_COORDS_FIRE_01: Coordinates[] = [
  [77.6250, 12.9740], // Halasuru Fire Station staging
  [77.6295, 12.9752], // Old Madras Rd
  [77.6350, 12.9765], // CMH Road junction
  [77.6385, 12.9772], // 100ft Rd approach
  [77.6413, 12.9784], // Indiranagar 100ft Rd scene
];

export const ROUTE_COORDS_AMB_01_INITIAL: Coordinates[] = [
  [77.6050, 12.9550], // Richmond Town staging
  [77.6080, 12.9490], // Hosur Road flyover
  [77.6120, 12.9440], // Dairy Circle junction
  [77.6160, 12.9390], // Koramangala 80ft Rd
  [77.6200, 12.9352], // Koramangala 5th Block scene
];

export const ROUTE_COORDS_AMB_01_REROUTED_TO_MG_ROAD: Coordinates[] = [
  [77.6120, 12.9440], // Current position at Dairy Circle
  [77.6145, 12.9520], // Victoria Layout corridor
  [77.6170, 12.9600], // Richmond Road connector
  [77.6180, 12.9680], // Commissariat Road
  [77.6186, 12.9738], // MG Road / Trinity Circle underpass
];

export const ROUTE_COORDS_AMB_02_STANDBY: Coordinates[] = [
  [77.6000, 12.9760], // Cubbon Park perimeter
  [77.6060, 12.9755], // General Post Office junction
  [77.6120, 12.9750], // MG Road Brigade Rd junction
];

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
    requiredResources: ['FIRE_TRUCK', 'RESCUE_TEAM'],
    assignedResourceId: 'FIRE-01',
    targetHospitalId: 'HOSP-03',
    reportedAt: '16:18:22 IST',
    description: 'Active electrical blaze on 2nd floor retail complex. Heavy black smoke, roof venting underway, evacuation in progress.',
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
    targetHospitalId: 'HOSP-04',
    reportedAt: '16:24:10 IST',
    description: '68yo male experiencing crushing chest pain and shortness of breath. Patient conscious, vitals stable, ALS oxygen unit requested.',
  },
];

/**
 * Baseline Fleet Units (Phase 1 / Normal Ingestion)
 */
export const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'AMB-01',
    name: 'ALS Unit Bravo-1',
    type: 'AMBULANCE',
    status: 'DISPATCHED',
    location: {
      lat: 12.9440,
      lng: 77.6120,
    },
    baseHospitalId: 'HOSP-04',
    currentEtaMinutes: 4,
    assignedIncidentId: 'INC-02',
    heading: 145,
  },
  {
    id: 'FIRE-01',
    name: 'Heavy Tender T-04',
    type: 'FIRE_TRUCK',
    status: 'DISPATCHED',
    location: {
      lat: 12.9765,
      lng: 77.6350,
    },
    baseHospitalId: 'HOSP-03',
    currentEtaMinutes: 6,
    assignedIncidentId: 'INC-01',
    heading: 75,
  },
  {
    id: 'AMB-02',
    name: 'BLS Unit Delta-2',
    type: 'AMBULANCE',
    status: 'IDLE',
    location: {
      lat: 12.9750,
      lng: 77.6120,
    },
    baseHospitalId: 'HOSP-02',
    currentEtaMinutes: 2,
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
 * Baseline Active Routes
 */
export const INITIAL_ROUTES: RouteGeometry[] = [
  {
    id: 'ROUTE-01',
    resourceId: 'FIRE-01',
    incidentId: 'INC-01',
    coordinates: ROUTE_COORDS_FIRE_01,
    isPendingApproval: false,
    color: '#06b6d4',
  },
  {
    id: 'ROUTE-02',
    resourceId: 'AMB-01',
    incidentId: 'INC-02',
    coordinates: ROUTE_COORDS_AMB_01_INITIAL,
    isPendingApproval: false,
    color: '#06b6d4',
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
    message: 'Ingested emergency call #INC-01 (100ft Rd Indiranagar). NLP parsed high-temperature structural fire. Severity classified: 4.',
    severity: 'WARN',
  },
  {
    id: 'LOG-002',
    timestamp: '16:18:30 IST',
    agentName: 'LOGISTICS',
    message: 'Calculated travel isochrone from Halasuru station. Traffic friction on CMH Rd: moderate (+1.8m delay).',
    severity: 'INFO',
  },
  {
    id: 'LOG-003',
    timestamp: '16:18:35 IST',
    agentName: 'ALLOCATION',
    message: 'Optimal dispatch match: Heavy Tender FIRE-01 locked to INC-01. ETA 6 min. Route vector broadcast to MDT.',
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
    message: 'Dispatched ALS Unit AMB-01 from Richmond staging to INC-02. ETA 4 min. Base hospital St. Johns alerted.',
    severity: 'INFO',
  },
  {
    id: 'LOG-006',
    timestamp: '16:26:00 IST',
    agentName: 'COMMAND',
    message: 'Grid operating at optimal throughput. Active incidents: 2. Average emergency response latency: 5.2 min.',
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
    totalFleet: 4,
    avgResponseTimeMin: 5.2,
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
 * Disrupted Fleet Units (AMB-02 broken down, AMB-01 rerouted)
 */
export const DISRUPTED_RESOURCES: Resource[] = [
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
    assignedIncidentId: 'INC-03',
    heading: 355,
  },
  {
    id: 'FIRE-01',
    name: 'Heavy Tender T-04',
    type: 'FIRE_TRUCK',
    status: 'DISPATCHED',
    location: {
      lat: 12.9765,
      lng: 77.6350,
    },
    baseHospitalId: 'HOSP-03',
    currentEtaMinutes: 4,
    assignedIncidentId: 'INC-01',
    heading: 75,
  },
  {
    id: 'AMB-02',
    name: 'BLS Unit Delta-2',
    type: 'AMBULANCE',
    status: 'UNAVAILABLE',
    location: {
      lat: 12.9750,
      lng: 77.6120,
    },
    baseHospitalId: 'HOSP-02',
    currentEtaMinutes: undefined,
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
 * Disrupted Routes (Including Pending Reallocation Route)
 */
export const DISRUPTED_ROUTES: RouteGeometry[] = [
  {
    id: 'ROUTE-01',
    resourceId: 'FIRE-01',
    incidentId: 'INC-01',
    coordinates: ROUTE_COORDS_FIRE_01,
    isPendingApproval: false,
    color: '#06b6d4',
  },
  {
    id: 'ROUTE-02-ORIGINAL',
    resourceId: 'AMB-01',
    incidentId: 'INC-02',
    coordinates: ROUTE_COORDS_AMB_01_INITIAL,
    isPendingApproval: false,
    color: '#475569', // Dimmed original route
  },
  {
    id: 'ROUTE-03-PENDING',
    resourceId: 'AMB-01',
    incidentId: 'INC-03',
    coordinates: ROUTE_COORDS_AMB_01_REROUTED_TO_MG_ROAD,
    isPendingApproval: true,
    color: '#f59e0b', // Flashing amber proposed reallocation vector
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
    rationale: 'CRITICAL PREEMPTION: Severity 5 mass-casualty trauma at MG Road with active airway compromise outweighs stable Severity 2 cardiac patient. AMB-01 is 3.2 mins from Trinity Circle. Standby BLS queue re-ordered for Koramangala. Diverting AMB-01 reduces Level-5 emergency response time from 14.8m to 3.2m (saving 11.6 min Golden Hour window).',
    urgency: 'CRITICAL',
    timestamp: '16:31:30 IST',
  },
  metrics: {
    activeIncidents: 3,
    availableResources: 1,
    totalFleet: 4,
    avgResponseTimeMin: 7.8,
  },
};
