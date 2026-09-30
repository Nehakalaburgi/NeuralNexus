import { Incident, Resource, TravelEstimate } from '../types/agentTypes.js';

/**
 * 3 Official Hackathon Incidents
 */
export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc-road-accident',
    title: 'Road Accident',
    description: 'Collision involving two passenger vehicles on Hosur Road near Silk Board. Minor to moderate injuries.',
    severity: 3,
    urgency: 'medium',
    status: 'ASSIGNED',
    requiredResources: ['ambulance'],
    location: {
      name: 'Silk Board Junction',
      latitude: 12.9176,
      longitude: 77.6238,
    },
    casualtyEstimate: 1,
    reportedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    assignedResourceIds: ['res-amb-03'],
  },
  {
    id: 'inc-building-evac',
    title: 'Building Evacuation',
    description: 'Electrical fire and heavy smoke in commercial building basement. Occupants evacuating.',
    severity: 4,
    urgency: 'high',
    status: 'ASSIGNED',
    requiredResources: ['fire', 'rescue'],
    location: {
      name: 'Koramangala 5th Block',
      latitude: 12.9352,
      longitude: 77.6245,
    },
    casualtyEstimate: 0,
    reportedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    assignedResourceIds: ['res-fire-01', 'res-rescue-01'],
  },
  {
    id: 'inc-medical-emergency',
    title: 'Medical Emergency',
    description: 'Elderly patient reporting acute shortness of breath and elevated blood pressure at residential apartment.',
    severity: 3,
    urgency: 'medium',
    status: 'ASSIGNED',
    requiredResources: ['ambulance'],
    location: {
      name: 'HSR Layout Sector 1',
      latitude: 12.9121,
      longitude: 77.6446,
    },
    casualtyEstimate: 1,
    reportedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    assignedResourceIds: ['res-amb-01'],
  },
];

/**
 * 5 Official Hackathon Resources (with Ambulance 02 marked OUT_OF_SERVICE)
 */
export const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'res-amb-01',
    name: 'Ambulance 01',
    type: 'ambulance',
    status: 'ASSIGNED',
    currentLocation: {
      name: 'HSR Layout Sector 1',
      latitude: 12.9121,
      longitude: 77.6446,
    },
    assignedIncidentId: 'inc-medical-emergency',
    capabilities: ['ambulance', 'medical_unit', 'advanced_life_support'],
    fuelLevelPercent: 88,
    callSign: 'MEDIC-01',
  },
  {
    id: 'res-amb-02',
    name: 'Ambulance 02',
    type: 'ambulance',
    status: 'OUT_OF_SERVICE', // Explicitly marked OUT_OF_SERVICE per architecture specification
    currentLocation: {
      name: 'Silk Board Junction',
      latitude: 12.9176,
      longitude: 77.6238,
    },
    assignedIncidentId: null,
    capabilities: ['ambulance', 'basic_life_support'],
    fuelLevelPercent: 74,
    callSign: 'MEDIC-02',
  },
  {
    id: 'res-amb-03',
    name: 'Ambulance 03',
    type: 'ambulance',
    status: 'ASSIGNED',
    currentLocation: {
      name: 'St. John’s Hospital Base',
      latitude: 12.9312,
      longitude: 77.6186,
    },
    assignedIncidentId: 'inc-road-accident',
    capabilities: ['ambulance', 'advanced_life_support', 'trauma_care'],
    fuelLevelPercent: 95,
    callSign: 'MEDIC-03',
  },
  {
    id: 'res-fire-01',
    name: 'Fire Unit 01',
    type: 'fire',
    status: 'ASSIGNED',
    currentLocation: {
      name: 'Koramangala 5th Block',
      latitude: 12.9352,
      longitude: 77.6245,
    },
    assignedIncidentId: 'inc-building-evac',
    capabilities: ['fire', 'water_tender', 'hazmat'],
    fuelLevelPercent: 82,
    callSign: 'ENGINE-01',
  },
  {
    id: 'res-rescue-01',
    name: 'Rescue Unit 01',
    type: 'rescue',
    status: 'ASSIGNED',
    currentLocation: {
      name: 'Koramangala 5th Block',
      latitude: 12.9352,
      longitude: 77.6245,
    },
    assignedIncidentId: 'inc-building-evac',
    capabilities: ['rescue', 'hydraulic_extrication', 'structural_collapse'],
    fuelLevelPercent: 91,
    callSign: 'RESCUE-01',
  },
];

/**
 * Initial resource-to-incident assignment map
 */
export const INITIAL_ASSIGNMENTS: Record<string, string> = {
  'res-amb-01': 'inc-medical-emergency',
  'res-amb-03': 'inc-road-accident',
  'res-fire-01': 'inc-building-evac',
  'res-rescue-01': 'inc-building-evac',
};

/**
 * Geographic Travel Estimates Matrix (Bengaluru corridor)
 */
export const TRAVEL_ESTIMATES: TravelEstimate[] = [
  // Amb-01 (at HSR Layout Sector 1)
  { resourceId: 'res-amb-01', incidentId: 'inc-medical-emergency', estimatedMinutes: 2, distanceKm: 0.8 },
  { resourceId: 'res-amb-01', incidentId: 'inc-road-accident', estimatedMinutes: 11, distanceKm: 4.2 },
  { resourceId: 'res-amb-01', incidentId: 'inc-building-evac', estimatedMinutes: 14, distanceKm: 5.1 },
  { resourceId: 'res-amb-01', incidentId: 'inc-electronic-city-crash', estimatedMinutes: 9, distanceKm: 7.4 },

  // Amb-02 (at Silk Board - OUT_OF_SERVICE)
  { resourceId: 'res-amb-02', incidentId: 'inc-road-accident', estimatedMinutes: 3, distanceKm: 1.1 },
  { resourceId: 'res-amb-02', incidentId: 'inc-medical-emergency', estimatedMinutes: 10, distanceKm: 3.9 },
  { resourceId: 'res-amb-02', incidentId: 'inc-building-evac', estimatedMinutes: 9, distanceKm: 3.5 },
  { resourceId: 'res-amb-02', incidentId: 'inc-electronic-city-crash', estimatedMinutes: 16, distanceKm: 10.8 },

  // Amb-03 (at St. John's Hospital)
  { resourceId: 'res-amb-03', incidentId: 'inc-road-accident', estimatedMinutes: 8, distanceKm: 3.1 },
  { resourceId: 'res-amb-03', incidentId: 'inc-medical-emergency', estimatedMinutes: 12, distanceKm: 4.8 },
  { resourceId: 'res-amb-03', incidentId: 'inc-building-evac', estimatedMinutes: 6, distanceKm: 2.2 },
  { resourceId: 'res-amb-03', incidentId: 'inc-electronic-city-crash', estimatedMinutes: 19, distanceKm: 13.2 },

  // Fire-01 (at Koramangala)
  { resourceId: 'res-fire-01', incidentId: 'inc-building-evac', estimatedMinutes: 4, distanceKm: 1.5 },
  { resourceId: 'res-fire-01', incidentId: 'inc-electronic-city-crash', estimatedMinutes: 22, distanceKm: 14.5 },

  // Rescue-01 (at Koramangala)
  { resourceId: 'res-rescue-01', incidentId: 'inc-building-evac', estimatedMinutes: 4, distanceKm: 1.5 },
  { resourceId: 'res-rescue-01', incidentId: 'inc-electronic-city-crash', estimatedMinutes: 18, distanceKm: 12.1 },
];

/**
 * Hackathon High-Severity Disruption Event
 */
export const HACKATHON_DEMO_INCIDENT_REPORT = 
  'Major road accident near Electronic City. Multiple injuries reported.';
