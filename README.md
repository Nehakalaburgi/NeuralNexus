# ResQAlloc | Tactical Emergency Control & AI Dynamic Resource Reallocation Dashboard

[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Mapbox GL JS](https://img.shields.io/badge/Mapbox_GL-v3.10-000000?logo=mapbox&logoColor=white)](https://www.mapbox.com/)

> **ResQAlloc** is an AI-powered autonomous multi-agent emergency response and dynamic fleet reallocation dashboard designed for urban command centers. Centered on the **Bengaluru Metro Area**, it demonstrates real-time triage, intelligent fleet preemption, and **Human-In-The-Loop (HITL)** authorization gates for mission-critical emergencies.

---

## 🚀 Key Capabilities

- 🗺️ **Full-Viewport Mapbox GL Geospatial Canvas:** High-resolution dark vector map centered on Bengaluru (`[77.5946, 12.9716]`) with 3D terrain pitch and dynamic zoom.
- 🚨 **Concentric Pulsing DOM Markers:** Real-time SVG markers with severity-coded pulse ripples (Severity 5 Crimson, Severity 3–4 Amber, Severity 1–2 Cyan).
- 🚑 **Dynamic GeoJSON Route Vectors:** Dual-layer polyline casing with ambient glowing flow vectors (Active solid cyan vs. proposed diversion dashed amber).
- 🤖 **Multi-Agent Telemetry Stream:** Live terminal feed of reasoning chains from `TRIAGE`, `LOGISTICS`, `ALLOCATION`, and `COMMAND` agents.
- 🛡️ **Human-In-The-Loop (HITL) Gate Modal:** Authorization dialog presenting Gemini Command Agent clinical rationale, preemption trade-offs, and estimated latency savings before committing route diversions.
- 🎛️ **Pitch Simulation Dock:** Instant presentation controls to trigger baseline ingestion, inject sudden fleet failures, or test live WebSocket streams.

---

## 📋 Prerequisites

- **Node.js:** `v18.0.0` or higher (Node.js 20+ recommended)
- **npm:** `v9.0.0` or higher
- **Mapbox Public Access Token:** (Free tier token from [mapbox.com](https://account.mapbox.com/))

---

## 🛠️ Quickstart Installation & Setup

### 1. Clone & Navigate to Repository
```bash
git clone <your-repository-url>
cd NeuralNexus
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment file and paste your Mapbox Public Token:
```bash
cp .env.example .env
```

Open `.env` and set your token:
```env
VITE_MAPBOX_TOKEN=pk.your_actual_mapbox_public_token_here
```

> 💡 **Note:** If you run the app without setting `.env`, a built-in tactical config overlay will prompt you to enter the token directly in the browser.

### 4. Start Development Server
```bash
npm run dev
```

Open your browser at `http://localhost:5173/`.

### 5. Production Build & Validation
```bash
# Type check and build bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🎮 How to Demo & Pitch the System

The dashboard includes a floating **Pitch Dock** at the bottom of the screen:

### Step 1: Baseline Normal Ingestion (`1. Normal Ingestion`)
- Click **`[1. Normal Ingestion]`** in the bottom dock.
- Inspect 2 active calls: Indiranagar Structural Fire (Severity 4) and Koramangala Cardiac Call (Severity 2).
- View dispatched units `FIRE-01` and `AMB-01` with active cyan route vectors.
- Hover over the **Left Incident Drawer** or click an incident card to trigger smooth camera flight (`flyTo`).

### Step 2: Inject Disruption & Reallocation (`2. Inject Disruption`)
- Click **`[2. Inject Disruption]`** in the bottom dock.
- **Trigger Sequence:**
  1. `AMB-02` suffers engine failure and transitions to `OFFLINE`.
  2. A catastrophic **Severity 5 Multi-Vehicle Crash** occurs at **MG Road / Trinity Circle**.
  3. The autonomous multi-agent system detects that closest idle capacity is zero.
  4. The algorithm calculates that diverting `AMB-01` from the stable Severity 2 call saves **11.6 minutes of Golden Hour latency**.
  5. A proposed diversion route is broadcast as a **flashing dashed amber polyline**.
  6. The **HITL Reallocation Modal** appears for human dispatcher authorization.

### Step 3: Dispatcher Decision Gate
- **Approve Reallocation (Green):**
  - Converts the route to solid neon cyan.
  - Formally re-routes `AMB-01` to the Trinity Circle crash scene.
  - Re-queues the Koramangala call for backup and logs an audit trail.
- **Reject / Keep Plan (Red):**
  - Keeps `AMB-01` on its original route to Koramangala.
  - Logs the operator override in the agent telemetry console.

### Step 4: Reset Grid (`Reset Grid`)
- Click **`[Reset Grid]`** to return all units and incidents to the baseline benchmark state.

---

## 📁 Project Architecture

```text
NeuralNexus/
├── .env.example                         <-- Environment template
├── .gitignore                           <-- Git safeguards (.env, node_modules, dist)
├── index.html                           <-- HTML5 entrypoint with Google Fonts
├── package.json                         <-- Scripts and dependencies
├── tsconfig.json                        <-- TypeScript project references
├── tsconfig.app.json                    <-- Strict client TypeScript config
├── tsconfig.node.json                   <-- Strict Vite tooling config
├── vite.config.ts                       <-- Vite + @tailwindcss/vite plugin
└── src/
    ├── main.tsx                         <-- React DOM entry + CSS imports
    ├── App.tsx                          <-- Root view coordinator & layer integrator
    ├── index.css                        <-- Tailwind v4 + tactical radar keyframes
    ├── vite-env.d.ts                    <-- Vite environment type declarations
    ├── types/
    │   └── emergency.ts                 <-- Strict TypeScript domain contracts
    ├── data/
    │   └── mockBengaluruState.ts        <-- Bengaluru coordinates & state benchmarks
    ├── hooks/
    │   └── useEmergencyState.ts         <-- Custom hook for state & WebSocket listener
    └── components/
        ├── layout/
        │   ├── TopNav.tsx               <-- Telemetry header & mock/live WS toggle
        │   └── DemoControls.tsx         <-- Bottom floating pitch simulation dock
        ├── map/
        │   ├── MapView.tsx              <-- Full-screen raw Mapbox GL instance
        │   ├── MapMarkers.ts            <-- Pure DOM marker builder (60fps)
        │   └── RouteLayers.ts           <-- GeoJSON line layer & glow coordinator
        ├── panels/
        │   ├── IncidentDrawer.tsx       <-- Hover-expandable left incident list
        │   ├── FleetDrawer.tsx          <-- Hover-expandable right fleet gauges
        │   └── AgentTelemetry.tsx       <-- Lower-right agent reasoning stream
        └── modals/
            └── ApprovalModal.tsx        <-- Center HITL unit reallocation dialog
```

---

## 📍 Bengaluru Metro Geospatial Benchmark

| Facility / Incident | Coordinates `[Lng, Lat]` | Classification |
|---|---|---|
| **Victoria Hospital** | `[77.5739, 12.9634]` | Level 1 Trauma Hub (14/120 Beds) |
| **Bowring & Lady Curzon Hospital** | `[77.6047, 12.9830]` | Level 2 Trauma Center (8/85 Beds) |
| **Manipal Hospital (Old Airport Rd)** | `[77.6517, 12.9584]` | Level 1 Trauma Hub (22/150 Beds) |
| **St. John's Medical College Hospital** | `[77.6195, 12.9345]` | Level 1 Trauma Hub (18/140 Beds) |
| **Indiranagar 100ft Rd** | `[77.6413, 12.9784]` | Incident #INC-01 (Severity 4 Fire) |
| **Koramangala 5th Block** | `[77.6200, 12.9352]` | Incident #INC-02 (Severity 2 Cardiac) |
| **MG Road / Trinity Circle** | `[77.6186, 12.9738]` | Incident #INC-03 (Severity 5 Collision) |

---

## 🔒 Security & Environment Safeguards

- **Never commit `.env` or `.env.local` files.** The `.gitignore` has been pre-configured to strictly ignore secrets.
- In production, set `VITE_MAPBOX_TOKEN` through your hosting provider's environment settings.

---

## 📄 License
This project is open-source and built for emergency response optimization.