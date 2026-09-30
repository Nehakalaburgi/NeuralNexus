// frontend/src/data/roadRoutes.ts
// Realistic road-snapped waypoints across Bengaluru corridors (Indiranagar, MG Road, Koramangala, Victoria, St. John's, Bowring)

// ==========================================
// 1. LEG 1: DISPATCH ROUTES (Station -> Incident)
// ==========================================

// FIRE-01: Dispatched from Indiranagar Fire Station to CMH Road Incident
export const FIRE01_INDIRANAGAR_DISPATCH: [number, number][] = [
  [77.6385, 12.9719], // Indiranagar Fire Station
  [77.6391, 12.9735],
  [77.6399, 12.9752],
  [77.6405, 12.9768],
  [77.6413, 12.9784], // Incident Scene: CMH Road / 100ft Rd Junction
];

// AMB-01: Dispatched from Ulsoor Depot to Indiranagar Incident
export const AMB01_INDIRANAGAR_DISPATCH: [number, number][] = [
  [77.6255, 12.9750], // Ulsoor Medical Depot
  [77.6288, 12.9755],
  [77.6320, 12.9760],
  [77.6355, 12.9770],
  [77.6382, 12.9778],
  [77.6413, 12.9784], // Incident Scene: CMH Road
];

// AMB-02: Dispatched from Madiwala Depot to Koramangala 5th Block
export const AMB02_KORAMANGALA_DISPATCH: [number, number][] = [
  [77.6190, 12.9220], // Madiwala Base
  [77.6195, 12.9255],
  [77.6200, 12.9290],
  [77.6202, 12.9325],
  [77.6200, 12.9352], // Incident Scene: Koramangala 5th Block
];

// ==========================================
// 2. DYNAMIC BYPASS ROUTE (Traffic Bottleneck Reroute)
// ==========================================

// AMB-01: Diverted away from severe arterial gridlock onto secondary arterial corridor
export const AMB01_INDIRANAGAR_BYPASS: [number, number][] = [
  [77.6320, 12.9760], // Divert Point (bottleneck ahead)
  [77.6315, 12.9730], // Cut down through secondary cross
  [77.6340, 12.9725], // Running parallel along 12th Main
  [77.6380, 12.9730],
  [77.6400, 12.9750],
  [77.6413, 12.9784], // Arrive at CMH Road scene (bypassing jam)
];

// ==========================================
// 3. LEG 2: HOSPITAL EVACUATION ROUTES (Incident -> Specialized Hospital)
// ==========================================

// AMB-01: Indiranagar Fire Scene -> Victoria Hospital (Specialized Burn ICU)
export const AMB01_VICTORIA_EVACUATION: [number, number][] = [
  [77.6413, 12.9784], // Indiranagar Incident Site
  [77.6350, 12.9765],
  [77.6250, 12.9745], // Old Airport Rd / Trinity
  [77.6120, 12.9720], // MG Road
  [77.6010, 12.9690], // Richmond Circle Flyover
  [77.5910, 12.9665], // Corporation Circle
  [77.5815, 12.9645], // City Market Underpass
  [77.5739, 12.9634], // Victoria Hospital Emergency Triage Bay
];

// AMB-02: Koramangala Incident -> St. John's Medical College Hospital
export const AMB02_STJOHNS_EVACUATION: [number, number][] = [
  [77.6200, 12.9352], // Koramangala 5th Block Site
  [77.6201, 12.9348],
  [77.6198, 12.9346],
  [77.6195, 12.9345], // St. John's Emergency Triage Gate
];

// AMB-03: MG Road Crash -> Bowring & Lady Curzon Hospital
export const AMB03_BOWRING_EVACUATION: [number, number][] = [
  [77.6186, 12.9738], // MG Road Crash Point
  [77.6150, 12.9755],
  [77.6110, 12.9780], // Commercial Street junction
  [77.6075, 12.9805], // Shivaji Nagar corridor
  [77.6047, 12.9830], // Bowring Hospital Emergency Gate
];

// ==========================================
// 4. LEGACY & COMPONENT ALIASES
// ==========================================
import { Coordinates } from '../types/emergency';

export const ROUTE_COORDS_FIRE_01: Coordinates[] = FIRE01_INDIRANAGAR_DISPATCH;
export const ROUTE_COORDS_AMB_03_FIRE: Coordinates[] = AMB01_INDIRANAGAR_DISPATCH;
export const ROUTE_COORDS_AMB_01_INITIAL: Coordinates[] = AMB01_INDIRANAGAR_DISPATCH;
export const ROUTE_COORDS_AMB_01_TRAFFIC_DETOUR: Coordinates[] = AMB01_INDIRANAGAR_BYPASS;
export const ROUTE_COORDS_AMB_01_REROUTED_TO_MG_ROAD: Coordinates[] = [
  [77.6320, 12.9760],
  [77.6250, 12.9745],
  [77.6186, 12.9738],
];
export const ROUTE_COORDS_AMB_02_PATROL: Coordinates[] = AMB02_KORAMANGALA_DISPATCH;

// Leg 2 Hospital Return Aliases
export const INDIRANAGAR_TO_VICTORIA: Coordinates[] = AMB01_VICTORIA_EVACUATION;
export const INDIRANAGAR_TO_VICTORIA_HOSPITAL: Coordinates[] = AMB01_VICTORIA_EVACUATION;
export const KORAMANGALA_TO_ST_JOHNS: Coordinates[] = AMB02_STJOHNS_EVACUATION;
export const MGROAD_TO_BOWRING: Coordinates[] = AMB03_BOWRING_EVACUATION;

export const ROUTE_COORDS_EVAC_INC_01: Coordinates[] = AMB01_VICTORIA_EVACUATION;
export const ROUTE_COORDS_EVAC_INC_02: Coordinates[] = AMB02_STJOHNS_EVACUATION;
export const ROUTE_COORDS_EVAC_INC_03: Coordinates[] = AMB03_BOWRING_EVACUATION;

export const ROUTE_COORDS_EVAC_BURN_VICTORIA: Coordinates[] = AMB01_VICTORIA_EVACUATION;
export const ROUTE_COORDS_EVAC_CARDIAC_MANIPAL: Coordinates[] = AMB02_STJOHNS_EVACUATION;
export const ROUTE_COORDS_EVAC_TRAUMA_ST_JOHNS: Coordinates[] = AMB03_BOWRING_EVACUATION;