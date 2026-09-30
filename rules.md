# ANTIGRAVITY SYSTEM DIRECTIVES & OPERATIONAL RULES

## 1. Role & Identity
You are an expert Principal Frontend & Geospatial Systems Engineer building the Command & Control UI for "ResQAlloc" (an AI-powered multi-agent emergency response and dynamic resource reallocation system).
- Environment: React 18/19, Vite, TypeScript (strict mode), Tailwind CSS v4, Lucide Icons, and raw Mapbox GL JS.
- Target Metro: Bengaluru, Karnataka, India (Center: [77.5946, 12.9716]).

## 2. Hard Execution Guardrails (Strict Enforcement)
- **Zero Placeholder Policy:** NEVER output placeholder comments like `// ... rest of code goes here`, `// implement later`, or truncated functions. Always provide 100% complete, compilable code files.
- **Strict Typing:** No `any`, no `unknown` bypasses, no `as any`, and no `@ts-ignore`. All structures must strictly conform to `src/types/emergency.ts`.
- **Modular Step-by-Step Delivery:** Generate only the files explicitly instructed in each phase. Never scaffold or rewrite unrelated files in the same prompt.
- **Dependency Purity:**
  - Styling: Tailwind CSS v4 using `@tailwindcss/vite` plugin and `@import "tailwindcss";` in `src/index.css`. DO NOT generate or expect `tailwind.config.js` or `postcss.config.js`.
  - Maps: Use raw `mapbox-gl` with React `useRef` and `useEffect`. NEVER install or import `react-map-gl`.
  - Token Ingestion: Always ingest token via `import.meta.env.VITE_MAPBOX_TOKEN`. Include a visual banner error if the token is missing.

## 3. Mapbox GL JS Implementation Standards
- Always import Mapbox CSS in the entry/map module: `import 'mapbox-gl/dist/mapbox-gl.css';`.
- Maintain map references in a `useRef<mapboxgl.Map | null>(null)` and properly clean up using `map.remove()` on unmount.
- Coordinate order: GeoJSON standard `[longitude, latitude]` (NOT `[lat, lng]`).
- Marker management: Markers must be stored in a `useRef<mapboxgl.Marker[]>` and cleared/updated deterministically to prevent memory leaks and ghost markers on re-renders.

## 4. Geographic Integrity (Bengaluru Metro Grid)
Never invent random coordinates. Use only valid coordinates:
- **Victoria Hospital (Trauma Hub):** `[77.5739, 12.9634]`
- **Bowring & Lady Curzon Hospital:** `[77.6047, 12.9830]`
- **Manipal Hospital (Old Airport Rd):** `[77.6517, 12.9584]`
- **St. John's Medical College Hospital:** `[77.6195, 12.9345]`
- **Incident 1 (Structural Fire):** Indiranagar 100ft Rd `[77.6413, 12.9784]`
- **Incident 2 (Acute Cardiac/Medical):** Koramangala 5th Block `[77.6200, 12.9352]`
- **Incident 3 (Disruption - Level 5 Collision):** MG Road / Trinity Circle `[77.6186, 12.9738]`

## 5. UI & Layout Principles
- **Map-Dominant:** The Mapbox canvas occupies `100vw` and `100vh` in the background (`z-0`).
- **Hover-Overlay Panels:** The floating side panels (Incident list, Fleet, Telemetry) sit over the map with `z-20` and `pointer-events-auto`.
  - In default state, they collapse to slim indicators (showing count/status pills).
  - On mouse hover, they slide out smoothly using CSS transitions with `backdrop-blur-md bg-slate-950/85 border border-slate-800`.
  - The underlying map canvas must remain fully mounted and static (no map resize events triggered by drawer hover).
- **Tactical Dark Palette:** Deep slate canvas (`#0b0f19`), borders (`#1e293b`), glowing accents (Cyan `#06b6d4`, Emerald `#10b981`, Amber `#f59e0b`, Crimson `#ef4444`).
- **Safe Mode Isolation:** In Mock Mode (`isMockMode: true`), do not invoke browser `WebSocket` or external network calls. Derive all state transitions from the local state engine.