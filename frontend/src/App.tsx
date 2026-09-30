import React from 'react';
import { useEmergencyState } from './hooks/useEmergencyState';
import { MapView } from './components/map/MapView';
import { TopNav } from './components/layout/TopNav';
import { DemoControls } from './components/layout/DemoControls';
import { ApprovalModal } from './components/modals/ApprovalModal';
import { AgentTelemetry } from './components/panels/AgentTelemetry';
import { FleetDrawer } from './components/panels/FleetDrawer';
import { IncidentDrawer } from './components/panels/IncidentDrawer';

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
  } = useEmergencyState();

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 overflow-hidden text-slate-100 font-sans select-none">
      {/* 1. Top Tactical Header Navigation */}
      <TopNav isMockMode={isMockMode} onToggleMockMode={toggleMockMode} />

      {/* 2. Main Geospatial Workstation Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side Panel: Active Incident Feeds */}
        <aside className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/60 backdrop-blur-md z-10 shrink-0 shadow-xl">
          <IncidentDrawer incidents={worldState.activeIncidents} />
        </aside>

        {/* Center Canvas: Interactive Map Visualization & Demo Control Dock */}
        <main className="flex-1 relative flex flex-col min-w-0">
          <div className="flex-1 relative overflow-hidden">
            <MapView
              worldState={worldState}
              isPaused={isPaused}
              playbackSpeed={playbackSpeed}
            />
          </div>

          {/* Bottom Dock: Presentation & Scenario Controls */}
          <div className="shrink-0 z-20">
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
        </main>

        {/* Right Side Panel: Multi-Agent Telemetry & Resource Fleet Drawer */}
        <aside className="w-88 border-l border-slate-800 flex flex-col bg-slate-900/60 backdrop-blur-md z-10 shrink-0 shadow-xl">
          <section className="h-1/2 border-b border-slate-800 overflow-hidden flex flex-col">
            <AgentTelemetry logs={worldState.agentLogs} />
          </section>
          <section className="h-1/2 overflow-hidden flex flex-col">
            <FleetDrawer
              resources={worldState.resources}
              hospitals={worldState.hospitals}
            />
          </section>
        </aside>
      </div>

      {/* 3. Human-in-the-Loop (HITL) Verification Modal */}
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
    </div>
  );
};

export default App;