/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * Root Application Coordinator
 * Integrates Mapbox GL canvas with floating tactical overlays, HITL approval gate, and simulation controls.
 */

import React, { useState } from 'react';
import { useEmergencyState } from './hooks/useEmergencyState';
import { MapView } from './components/map/MapView';
import { TopNav } from './components/layout/TopNav';
import { IncidentDrawer } from './components/panels/IncidentDrawer';
import { FleetDrawer } from './components/panels/FleetDrawer';
import { AgentTelemetry } from './components/panels/AgentTelemetry';
import { DemoControls } from './components/layout/DemoControls';
import { ApprovalModal } from './components/modals/ApprovalModal';
import { MapStyleId } from './types/emergency';

export const App: React.FC = () => {
  const {
    worldState,
    isMockMode,
    isConnected,
    lastHeartbeat,
    selectedIncidentId,
    selectedResourceId,
    injectTrafficJam,
    injectDisruption,
    approveReallocation,
    rejectReallocation,
    resetState,
    toggleMockMode,
    selectIncident,
    selectResource,
  } = useEmergencyState();

  const [activeMapStyle, setActiveMapStyle] = useState<MapStyleId>('dark');
  const [showTrafficOverlay, setShowTrafficOverlay] = useState<boolean>(true);

  const toggleTrafficOverlay = () => {
    setShowTrafficOverlay((prev) => !prev);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0b0f19] text-slate-100">
      {/* 1. Full-Screen Mapbox GL Geospatial Canvas (z-0) */}
      <MapView
        worldState={worldState}
        selectedIncidentId={selectedIncidentId}
        selectedResourceId={selectedResourceId}
        activeMapStyle={activeMapStyle}
        showTrafficOverlay={showTrafficOverlay}
        onSelectMapStyle={setActiveMapStyle}
        onToggleTrafficOverlay={toggleTrafficOverlay}
        onSelectIncident={(incident) => selectIncident(incident.id)}
        onSelectResource={(resource) => selectResource(resource.id)}
      />

      {/* 2. Tactical Telemetry Navigation Header (z-30) */}
      <TopNav
        worldState={worldState}
        isMockMode={isMockMode}
        isConnected={isConnected}
        lastHeartbeat={lastHeartbeat}
        activeMapStyle={activeMapStyle}
        showTrafficOverlay={showTrafficOverlay}
        onSelectMapStyle={setActiveMapStyle}
        onToggleTrafficOverlay={toggleTrafficOverlay}
        onToggleMockMode={toggleMockMode}
        onResetState={resetState}
      />

      {/* 3. Left Hover-Expandable Active Incident Drawer (z-20) */}
      <IncidentDrawer
        incidents={worldState.activeIncidents}
        hospitals={worldState.hospitals}
        resources={worldState.resources}
        routes={worldState.activeRoutes}
        selectedIncidentId={selectedIncidentId}
        onSelectIncident={(incident) => selectIncident(incident.id)}
      />

      {/* 4. Right Hover-Expandable Fleet Inventory Drawer (z-20) */}
      <FleetDrawer
        resources={worldState.resources}
        hospitals={worldState.hospitals}
        metrics={worldState.metrics}
        selectedResourceId={selectedResourceId}
        onSelectResource={(resource) => selectResource(resource.id)}
      />

      {/* 5. Lower-Right Multi-Agent Telemetry Terminal Stream (z-20) */}
      <AgentTelemetry
        logs={worldState.agentLogs}
        systemStatus={worldState.systemStatus}
      />

      {/* 6. Bottom Floating Pitch Simulation Dock (z-20) */}
      <DemoControls
        systemStatus={worldState.systemStatus}
        isTrafficCongested={worldState.isTrafficCongested}
        hasPendingApproval={worldState.pendingApproval !== null}
        onNormalIngestion={resetState}
        onInjectTrafficJam={injectTrafficJam}
        onInjectDisruption={injectDisruption}
        onReset={resetState}
      />

      {/* 7. Human-In-The-Loop (HITL) Unit Reallocation Modal (z-50) */}
      <ApprovalModal
        pendingApproval={worldState.pendingApproval}
        onApprove={approveReallocation}
        onReject={rejectReallocation}
      />
    </main>
  );
};

export default App;
