# RESQALLOC FRONTEND FILE STRUCTURE ARCHITECTURE

```text
resqalloc-ui/
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── vite.config.ts                   <-- Configured with @tailwindcss/vite plugin
├── src/
│   ├── main.tsx                     <-- React root entry + mapbox-gl/dist/mapbox-gl.css
│   ├── index.css                    <-- @import "tailwindcss"; + custom radar/pulse keyframes
│   ├── vite-env.d.ts
│   │
│   ├── types/
│   │   └── emergency.ts             <-- Complete TypeScript contracts (Full State Snapshot)
│   │
│   ├── data/
│   │   └── mockBengaluruState.ts     <-- Bengaluru coordinates, baseline state, & disruption state
│   │
│   ├── hooks/
│   │   └── useEmergencyState.ts     <-- State manager, mock transition triggers, and WS listener
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopNav.tsx           <-- Tactical telemetry header, status pulses, stats, mock toggle
│   │   │   └── DemoControls.tsx     <-- Floating bottom dock for pitch demo triggers
│   │   │
│   │   ├── map/
│   │   │   ├── MapView.tsx          <-- Full-screen raw Mapbox GL instance & marker/layer coordinator
│   │   │   ├── MapMarkers.ts        <-- Pure DOM marker builder (pulsing incidents, vehicles, hospitals)
│   │   │   └── RouteLayers.ts       <-- GeoJSON Source and Layer definitions for Mapbox polylines
│   │   │
│   │   ├── panels/
│   │   │   ├── IncidentDrawer.tsx   <-- Hover-expandable left panel with IncidentCard items
│   │   │   ├── FleetDrawer.tsx      <-- Hover-expandable right panel for unit inventory
│   │   │   └── AgentTelemetry.tsx   <-- Terminal stream showing agent reasoning
│   │   │
│   │   └── modals/
│   │       └── ApprovalModal.tsx    <-- Center HITL approval dialog for unit diversions
│   │
│   └── App.tsx                      <-- Root coordinator rendering MapView and floating overlays