# 🚨 ResQAlloc: The Multi-Agent Emergency Response & Resource Coordination System
> **24-Hour Hackathon Specification & Implementation Guide**  
> **Module Owner:** Mandara — AI & Multi-Agent Logic Layer  
> **Tech Stack:** Node.js, TypeScript, Express, Google Gen AI SDK (`@google/genai`), Google Gemini 2.5 Flash

---

## 1. Problem Statement
Emergency situations often involve multiple incidents occurring simultaneously, while emergency resources such as ambulances, rescue teams, fire engines, and medical units are strictly limited. A sudden change in the field situation—such as the arrival of a new high-severity incident or a resource becoming mechanically unavailable—can compromise the entire response operation.

**ResQAlloc** is an autonomous multi-agent emergency response intelligence system that:
1. Ingests and triages incoming natural-language emergency reports.
2. Assesses severity, casualty estimates, and required specialized capabilities.
3. Coordinates multi-objective resource allocations minimizing travel delay while adhering to clinical triage priority.
4. Dynamically recalculates response plans when disruptive field events occur (e.g. unit breakdowns or mass-casualty events).
5. Enforces zero-trust database authority guardrails so hallucinated or stale LLM proposals never corrupt real-world dispatch state.
6. Generates executive, transparent, human-readable SITREPs detailing exact delay trade-offs for human dispatch commanders.

---

## 2. Team Architecture & Responsibilities

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RESQALLOC TEAM TOPOLOGY                         │
└────────────────────────────────────────────────────────────────────────┘

 [ 1. Jairaj: Backend & DB ] ◄──────────► [ 2. Mandara: AI & Multi-Agent ]
   • MongoDB Source of Truth               • Agent 1: Incident Assessment
   • Authority on Fleet Status             • Agent 2: Dynamic Allocation
   • REST CRUD APIs                        • Agent 3: Command & SITREP Plan
   • Decision & Audit Logs                 • Database Authority Guardrail
              ▲                                       ▲
              │                                       │
              ▼                                       ▼
 [ 3. Neha: Frontend & Map ] ◄──────────► [ 4. Koushik: Dynamic Replanner ]
   • Emergency Control Room Dashboard      • Scenario Simulator
   • Mapbox Live Route Visualizer          • Disruption Triggers
   • Decision Explanation Modal            • Reassessment State Machine
   • Commander Approval Workflow           • Cross-service Orchestration
```

---

## 3. Mandara's Role: AI & Multi-Agent Intelligence Layer

Mandara owns the cognitive decision-making and explainability core of ResQAlloc, comprising three cooperative agents, an architectural guardrail validator, and an orchestration pipeline.

```
                    ┌─────────────────────────────────┐
                    │ Raw Emergency Text / 911 Report │
                    └────────────────┬────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │  AGENT 1: INCIDENT ASSESSMENT   │
                    │  (Severity 1-5, Urgency, Needs) │
                    └────────────────┬────────────────┘
                                     │
                                     ▼
 ┌──────────────────────┐   ┌─────────────────────────────────┐
 │ MongoDB Fleet State  ├──►│   AGENT 2: RESOURCE ALLOCATION  │
 │ (Authoritative DB)   │   │   (Triage Priority, Proximity,  │
 └──────────────────────┘   │    Tactical Preemption Flags)   │
                            └────────────────┬────────────────┘
                                             │ (Proposes, does NOT write to DB)
                                             ▼
                            ┌─────────────────────────────────┐
                            │   DATABASE AUTHORITY GUARDRAIL  │
                            │   (Drops OUT_OF_SERVICE units,  │
                            │    Flags violations for audit)  │
                            └────────────────┬────────────────┘
                                             │
                                             ▼
                            ┌─────────────────────────────────┐
                            │    AGENT 3: COMMAND & SITREP    │
                            │  (Calculates +8m delay impacts, │
                            │   Generates human explanation)  │
                            └────────────────┬────────────────┘
                                             │
                                             ▼
                            ┌─────────────────────────────────┐
                            │ Commander Approval Modal (Neha) │
                            │  & Database Commit (Jairaj)     │
                            └─────────────────────────────────┘
```

---

## 4. Agent Detailed Specifications

### Agent 1 — Incident Assessment Agent
- **Purpose:** Ingests unformatted, panic-laden citizen emergency calls, field sensor warnings, or voice transcripts and produces structured clinical triage metrics.
- **Model:** Google Gemini (`gemini-2.5-flash`) with structured JSON schema.
- **Severity Matrix:**
  - `Severity 5 (Critical)`: Multi-trauma, mass casualties, highway pileups, trapped victims.
  - `Severity 4 (High)`: Spreading structural fire, severe isolated trauma, chemical leak.
  - `Severity 3 (Medium)`: Moderate injuries, stable trauma, non-spreading incidents.
  - `Severity 2 (Low)`: Minor injuries, fender-benders, contained property damage.
  - `Severity 1 (Routine)`: Non-urgent assistance, traffic impediment.

#### Input Example:
```text
"Major road accident near Electronic City. Multiple injuries reported."
```

#### Output Schema:
```json
{
  "severity": 5,
  "urgency": "critical",
  "requiredResources": ["ambulance", "rescue"],
  "location": "Electronic City",
  "casualtyEstimate": 5,
  "summary": "Major road accident near Electronic City",
  "confidence": 0.95,
  "tags": ["ai-triaged", "critical", "ambulance", "rescue"]
}
```

---

### Agent 2 — Resource Allocation Agent
- **Purpose:** Analyzes active incidents, fleet availability, assigned units, and travel time matrices to propose optimal resource-to-incident dispatches.
- **Core Triage & Preemption Rules:**
  1. **Strict Priority:** Severity 5 critical emergencies take absolute precedence over Severity 3 or lower incidents.
  2. **Tactical Preemption:** When all units of a required capability are deployed, Agent 2 is permitted to propose *preempting* an ambulance or rescue team from a lower-priority incident (e.g. reassigned from a stable Medical Emergency to a life-threatening mass casualty crash).
  3. **Proximity Optimization:** Selects the lowest estimated travel time among candidate units.
  4. **Non-Direct Execution Principle:** Agent 2 **never** mutates the database directly. It strictly formulates a proposed plan for verification.

#### Proposed Assignment Format:
```json
{
  "incidentId": "inc-electronic-city-crash",
  "incidentTitle": "Emergency at Electronic City",
  "resourceId": "res-amb-01",
  "resourceName": "Ambulance 01",
  "resourceType": "ambulance",
  "estimatedTravelMinutes": 9,
  "isPreemption": true,
  "preemptedFromIncidentId": "inc-medical-emergency",
  "rationale": "Emergency Preemption: Reassigned Ambulance 01 from lower severity Medical Emergency (Severity 3) to high-severity critical incident Emergency at Electronic City (Severity 5)."
}
```

---

### Database Authority Guardrail (Zero-Trust LLM Layer)
- **Problem:** LLMs can hallucinate resource availability or use stale context.
- **Rule:** **Jairaj's backend/MongoDB is the supreme authority.**
  - If Gemini proposes: `"Ambulance 02 is assigned to Road Accident"`
  - But MongoDB records: `Ambulance 02 -> status: "OUT_OF_SERVICE"`
  - **The Validator automatically strips the invalid assignment**, preserves system safety, issues an audit notice (`OVERRIDE: Prevented dispatch of Ambulance 02`), and marks `requiresHumanApproval = true`.

```typescript
// Enforced in src/services/validator.ts
if (authResource.status === 'OUT_OF_SERVICE') {
  rejectedAssignments.push({
    assignment: proposed,
    violationReason: `DATABASE AUTHORITY REJECTION: Resource "${authResource.name}" is marked OUT_OF_SERVICE in the database. Gemini proposal overridden.`,
    authoritativeResourceStatus: 'OUT_OF_SERVICE',
  });
}
```

---

### Agent 3 — Command & Planning Agent
- **Purpose:** Generates human-readable, transparent operational explanations for human dispatchers and judges.
- **Section 8 Originality Focus:** Explains *why* trade-offs were made, quantifies the exact delay impact on lower-priority incidents, and suggests mitigating commander actions.

#### Output Example:
```json
{
  "headline": "PRIORITY REALLOCATION: Critical Incident Preemption & Response Plan",
  "executiveExplanation": "Ambulance 01 was reassigned because a new high-severity incident was reported and Ambulance 02 became unavailable. The medical emergency will experience an estimated additional delay of 8 minutes.",
  "delayImpacts": [
    {
      "incidentId": "inc-medical-emergency",
      "incidentTitle": "Medical Emergency",
      "additionalDelayMinutes": 8,
      "reason": "Ambulance 01 was diverted to handle higher-severity critical incident Emergency at Electronic City."
    }
  ],
  "operationalRisks": [
    "Reduced fleet redundancy: Ambulance 02 offline.",
    "Patient outcome risk escalation due to delayed ETA on preempted lower-severity incidents."
  ],
  "recommendedActions": [
    "Dispatch commander to review and execute human approval for preempted unit re-routes.",
    "Alert incoming emergency hospital receiving wards of prioritized critical trauma arrivals.",
    "Issue mutual-aid standby request to neighboring municipal sector if secondary alarms trip."
  ],
  "requiresHumanApproval": true,
  "timestamp": "2026-09-30T09:47:00.000Z"
}
```

---

## 5. API Endpoints Reference

The AI layer runs as a standalone microservice on port `4000` (configurable via `PORT`):

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/ai/health` | Service health status, model target, and Gemini API key status |
| `POST` | `/api/ai/assess` | Ingests `{ text: string }` and returns Agent 1 structured triage assessment |
| `POST` | `/api/ai/allocate` | Computes Agent 2 allocations and passes them through the DB Validator |
| `POST` | `/api/ai/replan` | Executes full pipeline (Agent 1 -> Agent 2 -> DB Guardrail -> Agent 3) |
| `POST` | `/api/ai/explain` | Generates Agent 3 SITREP explanation for arbitrary plan deltas |
| `GET` | `/api/ai/demo/initial-state` | Returns the official initial hackathon seed state (3 incidents, 5 resources) |
| `POST` | `/api/ai/demo/simulate-disruption` | One-click simulation of the complete Electronic City disruption scenario |

---

## 6. Hackathon Demo Scenario Walkthrough (Koushik's Simulator)

### Initial Stable State:
- **Incident 1:** Road Accident at Silk Board (Severity 3) — Assigned: **Ambulance 02**
- **Incident 2:** Building Evacuation at Koramangala (Severity 4) — Assigned: **Fire 01, Rescue 01**
- **Incident 3:** Medical Emergency at HSR Layout (Severity 3) — Assigned: **Ambulance 01**
- **Available Base Unit:** Ambulance 03 at St. John's Hospital (available / reserve)

### Step 1: Disruption Injected
1. Field breakdown alert: **Ambulance 02 engine failure** ➔ Database updates status to `OUT_OF_SERVICE`.
2. Reserve **Ambulance 03** is dispatched to cover the Silk Board Road Accident.
3. Sudden high-severity emergency reported:
   > *"Major road accident near Electronic City. Multiple injuries reported."*

### Step 2: Multi-Agent Cascade
1. **Agent 1** analyzes the incoming call:
   - Output: `Severity: 5 (Critical)`, `Required Resources: ["ambulance", "rescue"]`, `Location: "Electronic City"`.
2. **Agent 2** discovers all ambulances are committed. Since the new accident is `Severity 5`:
   - It selects **Ambulance 01** (9 minutes away at HSR) to be **preempted** from the Severity 3 Medical Emergency.
3. **Database Authority Guardrail** verifies the proposal against MongoDB:
   - Rejects any attempt to use Ambulance 02 (`OUT_OF_SERVICE`).
   - Validates Ambulance 01 preemption.
   - Flags `requiresHumanApproval = true`.
4. **Agent 3** calculates delay delta (+8 minutes on the Medical Emergency) and generates the human-readable explanation for Neha's dashboard modal:
   > *"Ambulance 01 was reassigned because a new high-severity incident was reported and Ambulance 02 became unavailable. The medical emergency will experience an estimated additional delay of 8 minutes."*
5. Human Commander clicks **"Approve Reassignment"** on Neha's dashboard ➔ Jairaj's backend commits the updated assignments to MongoDB ➔ Mapbox updates the routes in real time.

---

## 7. Verification & Testing

To test the entire system locally:
```bash
# Execute standalone test harness
npm run test:pipeline
```

To start the API service for backend and frontend integration:
```bash
npm run dev
```
Test with curl:
```bash
# Test Agent 1 Assessment
curl -X POST http://localhost:4000/api/ai/assess \
  -H "Content-Type: application/json" \
  -d '{"text": "Major road accident near Electronic City. Multiple injuries reported."}'

# Trigger Hackathon Scenario
curl -X POST http://localhost:4000/api/ai/demo/simulate-disruption
```