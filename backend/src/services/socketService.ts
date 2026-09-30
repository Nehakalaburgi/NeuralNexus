import { Server, Socket } from 'socket.io';

interface ReallocationPayload {
  incidentId: string;
  resourceId: string;
  timestamp: string;
}

export function setupSocketEvents(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Initial broadcast on client connection
    socket.emit('agent_status', {
      status: 'ONLINE',
      activeAgents: ['DISPATCH_OPTIMIZER', 'TRAFFIC_MONITOR', 'TRIAGE_COORDINATOR'],
      timestamp: new Date().toISOString(),
    });

    // Handle Human-in-the-Loop Approval from Frontend
    socket.on('approve_reallocation', (payload: ReallocationPayload) => {
      console.log(`[HITL Authorization] Incident ${payload.incidentId} approved for unit ${payload.resourceId}`);

      // Broadcast the confirmed reroute to all dashboards
      io.emit('approval_confirmed', {
        incidentId: payload.incidentId,
        resourceId: payload.resourceId,
        authorizedAt: payload.timestamp,
        log: {
          id: `log-backend-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          agentType: 'COMMAND_AGENT',
          severity: 'HIGH',
          message: `HITL OVERRIDE CONFIRMED: Unit ${payload.resourceId} locked into priority corridor for ${payload.incidentId}.`,
        },
      });
    });

    // Handle Human Rejection Override
    socket.on('reject_reallocation', (payload: { incidentId: string }) => {
      console.log(`[HITL Override] Commander rejected reallocation for incident ${payload.incidentId}`);
      io.emit('approval_rejected', { incidentId: payload.incidentId });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}
