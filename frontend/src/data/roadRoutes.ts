import { Coordinates } from '../types/emergency';

// Leg 1: Station to Incident Coordinates
export const FIRE01_INDIRANAGAR_DISPATCH: Coordinates[] = [
  [77.6385, 12.9719],
  [77.6391, 12.9735],
  [77.6399, 12.9752],
  [77.6405, 12.9768],
  [77.6413, 12.9784],
];

export const AMB01_INDIRANAGAR_DISPATCH: Coordinates[] = [
  [77.6255, 12.975],
  [77.6288, 12.9755],
  [77.632, 12.976],
  [77.6355, 12.977],
  [77.6382, 12.9778],
  [77.6413, 12.9784],
];

export const AMB02_KORAMANGALA_DISPATCH: Coordinates[] = [
  [77.619, 12.922],
  [77.6195, 12.9255],
  [77.62, 12.929],
  [77.6202, 12.9325],
  [77.62, 12.9352],
];

// Leg 1 Bypass: Traffic Reroute
export const AMB01_INDIRANAGAR_BYPASS: Coordinates[] = [
  [77.632, 12.976],
  [77.6315, 12.973],
  [77.634, 12.9725],
  [77.638, 12.973],
  [77.64, 12.975],
  [77.6413, 12.9784],
];

// Leg 2: Incident to Hospital
export const AMB01_VICTORIA_EVACUATION: Coordinates[] = [
  [77.6413, 12.9784],
  [77.635, 12.9765],
  [77.625, 12.9745],
  [77.612, 12.972],
  [77.601, 12.969],
  [77.591, 12.9665],
  [77.5815, 12.9645],
  [77.5739, 12.9634],
];

export const AMB02_STJOHNS_EVACUATION: Coordinates[] = [
  [77.62, 12.9352],
  [77.6201, 12.9348],
  [77.6198, 12.9346],
  [77.6195, 12.9345],
];

export const AMB03_BOWRING_EVACUATION: Coordinates[] = [
  [77.6186, 12.9738],
  [77.615, 12.9755],
  [77.611, 12.978],
  [77.6075, 12.9805],
  [77.6047, 12.983],
];

// Compatibility / Legacy Aliases
export const ROUTE_COORDS_FIRE_01: Coordinates[] = FIRE01_INDIRANAGAR_DISPATCH;
export const ROUTE_COORDS_AMB_03_FIRE: Coordinates[] = AMB01_INDIRANAGAR_DISPATCH;
export const ROUTE_COORDS_AMB_01_INITIAL: Coordinates[] = AMB01_INDIRANAGAR_DISPATCH;
export const ROUTE_COORDS_AMB_01_TRAFFIC_DETOUR: Coordinates[] = AMB01_INDIRANAGAR_BYPASS;
export const ROUTE_COORDS_AMB_01_REROUTED_TO_MG_ROAD: Coordinates[] = [
  [77.632, 12.976],
  [77.625, 12.9745],
  [77.6186, 12.9738],
];
export const ROUTE_COORDS_AMB_02_PATROL: Coordinates[] = AMB02_KORAMANGALA_DISPATCH;

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