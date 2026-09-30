# ANTIGRAVITY MASTER PROMPT & PHASED EXECUTION PLAYBOOK

This document guides the step-by-step implementation of the **ResQAlloc Emergency Control Room Dashboard**.
Before executing any phase, ensure you adhere to the project rules and standards:
- **Stack:** React (Vite), TypeScript (strict mode), Tailwind CSS v4 (`@tailwindcss/vite`), Lucide Icons, and raw `mapbox-gl`.
- **Target City:** Bengaluru, Karnataka, India (Center: `[77.5946, 12.9716]`).
- **Policy:** Zero placeholders, strict types (no `any`), modular single-phase delivery, and dark tactical command center styling.

---

## EXECUTION PHASES OVERVIEW

- **Phase 1:** Core dependencies, Vite + Tailwind v4 setup, and strict TypeScript contracts (`emergency.ts`).
- **Phase 2:** Bengaluru geospatial benchmark dataset, disruption state, and state management hook.
- **Phase 3:** Full-screen Mapbox GL canvas, custom pulsing DOM markers, and GeoJSON route layers.
- **Phase 4:** Tactical header navigation, hover-expandable side drawers, and real-time agent telemetry stream.
- **Phase 5:** Human-in-the-Loop (HITL) approval dialog, pitch simulation dock, and root app integration.

---

## >>> PHASE 1: Scaffolding, Tailwind v4 Setup & Type Definitions

### Objective
Install core dependencies, configure Tailwind CSS v4 using the modern `@tailwindcss/vite` plugin, establish base styles with tactical radar animations, and define all TypeScript data structures.

### Prompt to Antigravity

```text
Please execute Phase 1 of the ResQAlloc frontend build:

1. Provide the exact terminal commands to install the required production and development dependencies:
   - `mapbox-gl`, `lucide-react`
   - `@tailwindcss/vite`, `tailwindcss`
   - `@types/mapbox-gl`

2. Generate the complete `vite.config.ts` configured with React and the `@tailwindcss/vite` plugin.

3. Generate `src/index.css` featuring `@import "tailwindcss";` and custom keyframes for tactical radar pulsing, glowing markers, and dark scrollbars.

4. Generate the complete TypeScript definitions file at `src/types/emergency.ts` with no placeholders. Define:
   - `SeverityLevel`: 1 | 2 | 3 | 4 | 5
   - `IncidentStatus`: 'PENDING' | 'TRIAGED' | 'ASSIGNED' | 'RESOLVED'
   - `ResourceType`: 'AMBULANCE' | 'FIRE_TRUCK' | 'RESCUE_TEAM'
   - `ResourceStatus`: 'IDLE' | 'DISPATCHED' | 'ON_SCENE' | 'UNAVAILABLE' | 'REROUTED'
   - `AgentName`: 'TRIAGE' | 'LOGISTICS' | 'ALLOCATION' | 'COMMAND'
   - `Incident`: { id, title, severity: SeverityLevel, location: { lat: number, lng: number, address: string }, status: IncidentStatus, requiredResources: ResourceType[], assignedResourceId?: string, reportedAt: string }
   - `Resource`: { id, name, type: ResourceType, status: ResourceStatus, location: { lat: number, lng: number }, baseHospitalId?: string, currentEtaMinutes?: number }
   - `Hospital`: { id, name, location: { lat: number, lng: number }, availableBeds: number, totalBeds: number }
   - `RouteGeometry`: { id: string, resourceId: string, incidentId: string, coordinates: [number, number][], isPendingApproval: boolean, color: string }
   - `AgentLog`: { id: string, timestamp: string, agentName: AgentName, message: string, severity?: 'INFO' | 'WARN' | 'CRITICAL' }
   - `PendingApproval`: { id: string, incidentId: string, incidentTitle: string, severity: SeverityLevel, resourceId: string, resourceName: string, previousIncidentId?: string, previousIncidentTitle?: string, rationale: string, urgency: 'HIGH' | 'CRITICAL', timestamp: string }
   - `WorldState`: { systemStatus: 'ONLINE' | 'REASSESSING' | 'DISRUPTED', activeIncidents: Incident[], resources: Resource[], hospitals: Hospital[], activeRoutes: RouteGeometry[], agentLogs: AgentLog[], pendingApproval: PendingApproval | null, metrics: { activeIncidents: number, availableResources: number, totalFleet: number, avgResponseTimeMin: number } }

Output complete, production-ready files with zero placeholders.