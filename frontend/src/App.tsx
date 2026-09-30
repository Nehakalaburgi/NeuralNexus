import React, { useState } from 'react';
import { useEmergencyState } from './hooks/useEmergencyState';
import { MapView } from './components/map/MapView';
import { TopNav } from './components/layout/TopNav';
import { DemoControls } from './components/layout/DemoControls';
import { ApprovalModal } from './components/modals/ApprovalModal';
import { AgentTelemetry } from './components/panels/AgentTelemetry';
import { FleetDrawer } from './components/panels/FleetDrawer';
import { IncidentDrawer } from './components/panels/IncidentDrawer';
import { MapStyleId } from './types/emergency';

export const App: React.FC = () => {
  const {
    worldState,
    isMockMode,
    activePhase,
    isPaused,
    playbackSpeed,
    pendingApproval,
    toggleMockMode,
    triggerPhase,
    approveReallocation,
    rejectReallocation,
    togglePause,
    setPlaybackSpeed,
    resetSimulation,
    selectIncident,
    selectResource,
  } = useEmergencyState();

  const [activeMapStyle, setActiveMapStyle] = useState<MapStyleId>('dark');
  const [showTrafficOverlay, setShowTrafficOverlay] = useState<boolean>(true);
  const [is3DView, setIs3DView] = useState<boolean>(false);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* 1. Full-Screen 100vw x 100vh Mapbox Geospatial Canvas (z-0) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapView
          worldState={worldState}
          isPaused={isPaused}
          playbackSpeed={playbackSpeed}
          showTrafficOverlay={showTrafficOverlay}
          is3DView={is3DView}
          onSelectIncident={(incident) => selectIncident(incident.id)}
          onSelectResource={(resource) => selectResource(resource.id)}
        />
      </div>

      {/* 2. Tactical Telemetry Navigation Header (Floating Top z-30) */}
      <TopNav
        worldState={worldState}
        isMockMode={isMockMode}
        activeMapStyle={activeMapStyle}
        showTrafficOverlay={showTrafficOverlay}
        is3DView={is3DView}
        onSelectMapStyle={setActiveMapStyle}
        onToggleTrafficOverlay={() => setShowTrafficOverlay((prev) => !prev)}
        onToggle3DView={() => setIs3DView((prev) => !prev)}
        onToggleMockMode={toggleMockMode}
        onResetState={resetSimulation}
      />

      {/* 3. Floating Left Incident Drawer (z-20) */}
      <IncidentDrawer
        incidents={worldState.activeIncidents}
        hospitals={worldState.hospitals}
        resources={worldState.resources}
        routes={worldState.activeRoutes}
        onSelectIncident={(incident) => selectIncident(incident.id)}
      />

      {/* 4. Floating Right Fleet Inventory Drawer (z-20) */}
      <FleetDrawer
        resources={worldState.resources}
        hospitals={worldState.hospitals}
        metrics={worldState.metrics}
        onSelectResource={(resource) => selectResource(resource.id)}
      />

      {/* 5. Floating Bottom-Right Multi-Agent Telemetry Stream (z-20) */}
      <AgentTelemetry
        logs={worldState.agentLogs}
        systemStatus={worldState.systemStatus}
      />

      {/* 6. Floating Bottom Presentation & Scenario Controls Dock (z-30) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none max-w-[98vw]">
        <div className="rounded-2xl tactical-glass border border-slate-700/90 shadow-[0_10px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl overflow-hidden">
          <DemoControls
            activePhase={activePhase}
            isPaused={isPaused}
            playbackSpeed={playbackSpeed}
            onTriggerPhase={triggerPhase}
            onTogglePause={togglePause}
            onSetPlaybackSpeed={setPlaybackSpeed}
            onResetSimulation={resetSimulation}
          />
        </div>
      </div>

      {/* 7. Human-in-the-Loop (HITL) Verification Modal (z-50) */}
      {pendingApproval && (
        <ApprovalModal
          isOpen={true}
          incidentId={pendingApproval.incidentId}
          recommendedResourceId={pendingApproval.recommendedResourceId}
          justification={pendingApproval.justification}
          onApprove={approveReallocation}
          onReject={rejectReallocation}
        />
      )}
    </main>
  );
};

export default App;