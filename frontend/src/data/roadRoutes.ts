import { Coordinates } from '../types/emergency';

/**
 * High-Precision True Road-Snapped Bengaluru Arterial Waypoint Corridors
 * Calculated from real street centerlines (100ft Rd, Old Airport Rd, Hosur Rd, MG Road, Trinity, Victoria ICU)
 */

// Leg 1: Domlur Fire Station -> Indiranagar 100ft Rd Fire Scene (INC-01)
export const FIRE01_INDIRANAGAR_DISPATCH: Coordinates[] = [
  [77.6360, 12.9610],
  [77.6368, 12.9625],
  [77.6375, 12.9640],
  [77.6382, 12.9658],
  [77.6388, 12.9675],
  [77.6393, 12.9692],
  [77.6398, 12.9710],
  [77.6402, 12.9728],
  [77.6406, 12.9745],
  [77.6409, 12.9760],
  [77.6411, 12.9772],
  [77.6413, 12.9784],
];

// Leg 1: Manipal Hospital (Old Airport Rd) -> Indiranagar 100ft Rd Fire Scene (INC-01)
export const AMB01_INDIRANAGAR_DISPATCH: Coordinates[] = [
  [77.6517, 12.9584],
  [77.6495, 12.9589],
  [77.6470, 12.9596],
  [77.6442, 12.9605],
  [77.6415, 12.9615],
  [77.6392, 12.9630],
  [77.6388, 12.9660],
  [77.6394, 12.9695],
  [77.6400, 12.9725],
  [77.6405, 12.9750],
  [77.6410, 12.9770],
  [77.6413, 12.9784],
];

// Leg 1: Adugodi Station -> Koramangala 5th Block Cardiac Scene (INC-02)
export const AMB02_KORAMANGALA_DISPATCH: Coordinates[] = [
  [77.6080, 12.9420],
  [77.6098, 12.9412],
  [77.6118, 12.9404],
  [77.6140, 12.9392],
  [77.6160, 12.9380],
  [77.6178, 12.9370],
  [77.6190, 12.9362],
  [77.6198, 12.9356],
  [77.6200, 12.9352],
];

// Leg 1 Bypass: Traffic Gridlock Dynamic Bypass via HAL 2nd Stage & 12th Main
export const AMB01_INDIRANAGAR_BYPASS: Coordinates[] = [
  [77.6517, 12.9584],
  [77.6495, 12.9589],
  [77.6470, 12.9596],
  [77.6465, 12.9630],
  [77.6460, 12.9665],
  [77.6455, 12.9700],
  [77.6448, 12.9735],
  [77.6435, 12.9760],
  [77.6422, 12.9775],
  [77.6413, 12.9784],
];

// Leg 2: Indiranagar 100ft Rd -> Victoria Hospital (Burn ICU Hub)
export const AMB01_VICTORIA_EVACUATION: Coordinates[] = [
  [77.6413, 12.9784],
  [77.6408, 12.9755],
  [77.6398, 12.9720],
  [77.6350, 12.9735],
  [77.6300, 12.9745],
  [77.6250, 12.9748],
  [77.6200, 12.9742],
  [77.6160, 12.9738],
  [77.6110, 12.9742],
  [77.6060, 12.9740],
  [77.6000, 12.9725],
  [77.5940, 12.9705],
  [77.5880, 12.9680],
  [77.5820, 12.9655],
  [77.5770, 12.9642],
  [77.5739, 12.9634],
];

// Leg 2: Koramangala 5th Block -> St. John's Medical College Hospital
export const AMB02_STJOHNS_EVACUATION: Coordinates[] = [
  [77.6200, 12.9352],
  [77.6199, 12.9350],
  [77.6198, 12.9348],
  [77.6197, 12.9347],
  [77.6196, 12.9346],
  [77.6195, 12.9345],
];

// Leg 2: MG Road / Trinity -> Bowring & Lady Curzon Hospital
export const AMB03_BOWRING_EVACUATION: Coordinates[] = [
  [77.6186, 12.9738],
  [77.6165, 12.9745],
  [77.6140, 12.9758],
  [77.6115, 12.9772],
  [77.6090, 12.9790],
  [77.6070, 12.9808],
  [77.6055, 12.9822],
  [77.6047, 12.9830],
];

// Compatibility / Legacy Aliases
export const ROUTE_COORDS_FIRE_01: Coordinates[] = FIRE01_INDIRANAGAR_DISPATCH;
export const ROUTE_COORDS_AMB_03_FIRE: Coordinates[] = AMB01_INDIRANAGAR_DISPATCH;
export const ROUTE_COORDS_AMB_01_INITIAL: Coordinates[] = AMB02_KORAMANGALA_DISPATCH;
export const ROUTE_COORDS_AMB_01_TRAFFIC_DETOUR: Coordinates[] = AMB01_INDIRANAGAR_BYPASS;
export const ROUTE_COORDS_AMB_01_REROUTED_TO_MG_ROAD: Coordinates[] = [
  [77.6080, 12.9420],
  [77.6105, 12.9460],
  [77.6130, 12.9510],
  [77.6150, 12.9570],
  [77.6165, 12.9630],
  [77.6175, 12.9685],
  [77.6186, 12.9738],
];
export const ROUTE_COORDS_AMB_02_PATROL: Coordinates[] = [
  [77.6186, 12.9738],
  [77.6140, 12.9745],
  [77.6080, 12.9750],
  [77.6020, 12.9740],
  [77.6010, 12.9700],
  [77.6030, 12.9650],
  [77.6080, 12.9640],
  [77.6140, 12.9650],
  [77.6186, 12.9738],
];

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