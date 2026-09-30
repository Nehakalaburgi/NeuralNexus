# 🚨 NeuralNexus: Crisis Command & AI Emergency Control Room

> **GATEWAYS 2026 Hackathon Project**  
> **ResQAlloc / Crisis Command:** Autonomous Multi-Agent Dynamic Emergency Response, Live Geospatial Dispatch & Resource Reallocation System.

---

## 📁 Organized Project Structure

The project is modularized into distinct, decoupled directories for maximum clarity, ease of maintenance, and rapid development:

```text
NeuralNexus/
├── frontend/             # 🌐 React 19 + Vite + Mapbox GL Emergency Control Room UI
│   ├── src/
│   │   ├── components/   # Map canvas, tactical panels, telemetry drawers, modals
│   │   │   ├── layout/   # TopNav, DemoControls pitch dock
│   │   │   ├── map/      # MapView, MapMarkers, RouteLayers, TrafficLayers
│   │   │   ├── modals/   # Human-In-The-Loop (HITL) Approval Modal
│   │   │   └── panels/   # FleetDrawer, IncidentDrawer, AgentTelemetry stream
│   │   ├── data/         # Bengaluru road network routes, mock state snapshots
│   │   ├── hooks/        # useEmergencyState state management hook
│   │   ├── types/        # Emergency domain contracts & types
│   │   └── utils/        # 60fps real-time polyline slicing & Haversine distance
│   ├── public/           # Favicon and static assets
│   ├── index.html        # HTML entry point
│   ├── package.json      # Frontend package configuration & dependencies
│   ├── vite.config.ts    # Vite bundler & Tailwind CSS configuration
│   └── tsconfig.json     # TypeScript strict configuration
│
├── backend/              # ⚙️ Node.js + Express + WebSocket + MongoDB Multi-Agent API
│   ├── src/
│   │   ├── models/       # Mongoose Schemas (Incident, Resource, Assignment, DecisionLog)
│   │   ├── routes/       # REST API endpoints (Incidents, Resources, Assignments)
│   │   ├── services/     # WebSocket broadcast, Replanning engine, Disruption handler
│   │   ├── scenarios/    # Multi-unit disaster simulation scenarios
│   │   └── server.ts     # Main Express + WebSocket server entry point
│   ├── package.json      # Backend package configuration
│   ├── tsconfig.json     # Backend TypeScript configuration
│   └── .env.example      # Backend environment variables template
│
├── shared/               # 📦 Common TypeScript interfaces shared across packages
│   ├── src/              # Type definitions and data models
│   ├── package.json      # Shared package configuration
│   └── tsconfig.json     # Shared TypeScript configuration
│
├── package.json          # 🚀 Root orchestration package (runs both with 1 command)
└── README.md             # Project documentation & quickstart guide
```

---

## 🚀 Quick Start Guide

You can run the entire system (both Backend and Frontend) with a **single command** from the root folder, or run each part independently.

### Option A: Run Full Stack Concurrently (Recommended)

From the project root directory:

```bash
# 1. Install all dependencies across all folders
npm run install:all

# 2. Start both Backend (Port 5000) and Frontend (Port 5173) together
npm run dev
```

- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API & WebSocket:** [http://localhost:5000](http://localhost:5000)

---

### Option B: Run Services Separately

#### 1. Frontend Development (`frontend/`)
```bash
# From root:
npm run dev:frontend

# Or directly in frontend folder:
cd frontend
npm install
npm run dev
```
Runs the Mapbox emergency canvas and tactical dashboard on `http://localhost:5173`.

#### 2. Backend API & WebSocket (`backend/`)
```bash
# From root:
npm run dev:backend

# Or directly in backend folder:
cd backend
npm install
npm run dev
```
Runs the Express REST API and live WebSocket server on `http://localhost:5000`.

---

## 🛠 Available Root Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs both Backend and Frontend concurrently with colored terminal logs |
| `npm run dev:frontend` | Runs the Frontend Vite development server |
| `npm run dev:backend` | Runs the Backend Express/WebSocket server with auto-reload (`tsx watch`) |
| `npm run build` | Builds both Frontend and Backend for production bundle |
| `npm run build:frontend` | Compiles the React + TypeScript frontend bundle |
| `npm run build:backend` | Compiles the Backend TypeScript server |
| `npm run install:all` | Installs npm dependencies across root, frontend, and backend |

---

## 🔑 Environment Variables Configuration

- **Frontend (`frontend/.env`)**:
  ```env
  VITE_MAPBOX_TOKEN=your_mapbox_public_token
  VITE_BACKEND_WS_URL=ws://localhost:5000
  VITE_BACKEND_API_URL=http://localhost:5000
  ```

- **Backend (`backend/.env`)**:
  ```env
  PORT=5000
  MONGO_URI=mongodb://127.0.0.1:27017/resqalloc?directConnection=true
  NODE_ENV=development
  ```