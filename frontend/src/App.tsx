/**
 * ResQAlloc Emergency Control Room & AI Dynamic Resource Reallocation System
 * Root Application Coordinator
 * Integrates Mapbox GL canvas with floating tactical overlays, HITL approval gate, and simulation controls.
 */

import React, { useState, useEffect } from 'react';
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
    currentLifecycleStep,
    isAutoPilot,
    isPlaying,
    playbackSpeed,
    togglePlayback,
    setPlaybackSpeed,
    triggerLifecycleStep,
    step2TrafficGridlock,
    injectDisruption,
    approveReallocation,
    rejectReallocation,
    resetState,
    toggleMockMode,
    toggleAutoPilot,
    selectIncident,
    selectResource,
  } = useEmergencyState();

  // Telemetry status logging
  useEffect(() => {
    if (!isMockMode) {
      console.log(
        isConnected
          ? '✅ Connected to ResQAlloc backend WebSocket stream'
          : '⚠️ ResQAlloc WebSocket disconnected, attempting reconnect...'
      );
    }
  }, [isConnected, isMockMode]);

  const [activeMapStyle, setActiveMapStyle] = useState<MapStyleId>('dark');
  const [showTrafficOverlay, setShowTrafficOverlay] = useState<boolean>(true);
  const [is3DView, setIs3DView] = useState<boolean>(false);

  const toggleTrafficOverlay = () => {
    setShowTrafficOverlay((prev) => !prev);
  };

  const toggle3DView = () => {
    setIs3DView((prev) => !prev);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0b0f19] text-slate-100 select-none">
      {/* 1. Full-Screen Geospatial Canvas (z-0) */}
      <MapView
        worldState={worldState}
        selectedIncidentId={selectedIncidentId}
        selectedResourceId={selectedResourceId}
        activeMapStyle={activeMapStyle}
        showTrafficOverlay={showTrafficOverlay}
        is3DView={is3DView}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        onSelectMapStyle={setActiveMapStyle}
        onToggleTrafficOverlay={toggleTrafficOverlay}
        onToggle3DView={toggle3DView}
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
        is3DView={is3DView}
        onSelectMapStyle={setActiveMapStyle}
        onToggleTrafficOverlay={toggleTrafficOverlay}
        onToggle3DView={toggle3DView}
        onToggleMockMode={toggleMockMode}
        onResetState={resetState}
      />

      {/* 3. Left Incident Drawer (z-20) */}
      <IncidentDrawer
        incidents={worldState.activeIncidents}
        hospitals={worldState.hospitals}
        resources={worldState.resources}
        routes={worldState.activeRoutes}
        selectedIncidentId={selectedIncidentId}
        onSelectIncident={(incident) => selectIncident(incident.id)}
      />

      {/* 4. Right Fleet Inventory Drawer (z-20) */}
      <FleetDrawer
        resources={worldState.resources}
        hospitals={worldState.hospitals}
        metrics={worldState.metrics}
        selectedResourceId={selectedResourceId}
        onSelectResource={(resource) => selectResource(resource.id)}
      />

      {/* 5. Telemetry Terminal Stream (z-20) */}
      <AgentTelemetry
        logs={worldState.agentLogs}
        systemStatus={worldState.systemStatus}
      />

      {/* 6. Pitch Simulation Dock (z-20) */}
      <DemoControls
        systemStatus={worldState.systemStatus}
        isTrafficCongested={worldState.isTrafficCongested}
        hasPendingApproval={worldState.pendingApproval !== null}
        currentLifecycleStep={currentLifecycleStep}
        isAutoPilot={isAutoPilot}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        onSelectLifecycleStep={triggerLifecycleStep}
        onToggleAutoPilot={toggleAutoPilot}
        onTogglePlayPause={togglePlayback}
        onSelectSpeed={setPlaybackSpeed}
        onInjectTrafficJam={step2TrafficGridlock}
        onInjectDisruption={injectDisruption}
        onReset={resetState}
      />

      {/* 7. Human-In-The-Loop Approval Modal (z-50) */}
      <ApprovalModal
        pendingApproval={worldState.pendingApproval}
        onApprove={approveReallocation}
        onReject={rejectReallocation}
      />
    </main>
  );
};

export default App;