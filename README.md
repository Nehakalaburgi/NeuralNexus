# NeuralNexus: Crisis Command

> **GATEWAYS 2026 Hackathon Project**  
> **Crisis Command:** The Multi-Agent Emergency Response & Resource Coordination Agent.

---

## 👥 Team Workstreams & Responsibilities

1. **Backend & Database:** Node.js, Express API server, database layer, REST endpoints, and schema definitions.
2. **AI Agents & Gemini:** Multi-agent emergency response orchestrator, reasoning loops, and Gemini integration.
3. **Frontend & Mapbox:** React + Vite UI dashboard, interactive spatial map visualization, and real-time status UI.
4. **Dynamic Replanning & Integration:** Adaptive resource reallocation, constraint solver, and event bus integration.

---

## 📁 Project Structure

```
NeuralNexus/
├── client/          # React + Vite + TypeScript Frontend Application
├── server/          # Node.js + Express + TypeScript Backend API Server
├── shared/          # Common TypeScript interfaces & types shared across client & server
├── README.md        # Root project documentation & setup guide
└── .gitignore       # Git ignore rules for node_modules, build artifacts, etc.
```

---

## 🚀 Getting Started

Client and server are architected to be developed and run independently.

### 1. Shared Types Module
Before running `client` or `server` for the first time, install shared dependencies (if needed):
```bash
cd shared
npm install
```

### 2. Frontend Development (`client`)
To install dependencies and start the React + Vite frontend:
```bash
cd client
npm install
npm run dev
```
The frontend dev server runs at: `http://localhost:5173`

### 3. Backend Development (`server`)
To install dependencies and start the Node.js + Express server:
```bash
cd server
npm install
npm run dev
```
The backend server runs at: `http://localhost:5000`

---

## 🛠 Tech Stack Overview

- **Frontend:** React 19, Vite, TypeScript, Vanilla CSS
- **Backend:** Node.js, Express, TypeScript, tsx
- **Shared:** TypeScript declaration & interface contracts