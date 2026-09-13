# ML Intelligence & Backend Integration PRD
## Railway Block Planning & Coordination System

**Version:** 1.0  
**Purpose:** Define exactly how the existing Python ML/optimization repository integrates with Node.js, MongoDB, and React.

---

## 1. Purpose

The existing Python/FastAPI repository is the **Intelligence Layer** of the Railway Block Planning & Coordination System.

It is not the complete application.

The target architecture is:

```text
React Frontend
      ↓
Node.js + Express
      ↓
MongoDB
      ↕
Python + FastAPI Intelligence Service
      ↓
Risk + Priority + MILP Optimization + Simulation + Recovery
```

The purpose of this document is to define:

- what data comes from MongoDB,
- what Node sends to Python,
- what Python does,
- how optimization works,
- what Python returns,
- how Node stores the result,
- how React displays it,
- how the Control Officer makes the final decision,
- how failure recovery works.

---

# 2. Core Principle

> **ML recommends; the Control Officer decides.**

Never implement:

```text
ML → automatic approval
```

Implement:

```text
ML
 ↓
Recommendation
 ↓
Control Officer
 ↓
Accept / Modify / Reject
 ↓
Final Schedule
```

The system is a **decision-support and coordination platform**, not an autonomous railway control system.

---

# 3. Responsibilities

### React

Responsible for:

- Login UI
- Dashboards
- Request forms
- Conflict visualization
- Schedule visualization
- Recommendation display
- Notifications

React must not perform authoritative scheduling or authorization.

### Node.js + Express

Responsible for:

- Authentication
- RBAC
- User/department management
- Block requests
- MongoDB access
- Business workflow
- Conflict orchestration
- Scheduling workflow
- Calling Python
- Final approval
- Notifications
- Audit logs

Node is the **main application backend**.

### MongoDB

Responsible for authoritative live application data:

```text
users
departments
railwaySections
blockRequests
blocks
conflicts
schedules
notifications
auditLogs
```

### Python + FastAPI

Responsible for:

- Risk prediction
- Priority scoring
- MILP optimization
- Simulation
- Failure simulation
- Recovery optimization
- Recommendation generation

Python is the **Intelligence Service**.

---

# 4. Existing Python Pipeline

The existing repository already contains:

```text
CSV
 ↓
Validation
 ↓
Risk Prediction
 ↓
Priority Scoring
 ↓
MILP Optimization
 ↓
Simulation
 ↓
Failure Simulation
 ↓
Recovery Optimization
 ↓
Metrics
 ↓
FastAPI
```

Do not rewrite this system unnecessarily.

First clean and verify it, then expose its capabilities through structured APIs.

---

# 5. Existing Components

## 5.1 Validation

File:

```text
validation/schema_validator.py
```

It:

- normalizes column names/aliases,
- checks required columns,
- validates ranges,
- normalizes supported values.

The same validation concepts should be reused for JSON requests.

---

## 5.2 Risk Prediction

Files:

```text
ml/risk_prediction.py
ml/predict_risk.py
```

Current model:

```text
RandomForestClassifier
```

Important limitation:

> Current labels are synthetic/rule-based. The model is a prototype and must not be presented as a production-validated railway safety predictor.

Conceptual flow:

```text
Task Data
   ↓
Risk Model
   ↓
Risk Class / Score
```

Risk should act as a planning signal, not directly approve or reject a block.

---

# 6. Priority Scoring

File:

```text
services/priority_scoring.py
```

The current implementation uses a heuristic weighted formula.

Conceptually:

```text
Priority
=
importance
+
urgency
+
risk-related factors
+
operational factors
```

The existing formula must be preserved unless a verified bug is found.

Priority is an input to scheduling optimization.

---

# 7. MILP Optimization

File:

```text
optimization/basic_optimizer.py
```

This is the most important existing intelligence component.

Technology:

```text
OR-Tools
+
SCIP
+
Mixed Integer Linear Programming
```

The optimizer assigns maintenance tasks to feasible block windows.

Conceptually:

```text
Maintenance Tasks
       +
Available Blocks
       +
Sections
       +
Block Types
       +
Approvals
       +
Durations
       +
Train Conflicts
       +
Priorities
       ↓
   MILP Solver
       ↓
Optimized Assignment
```

Do not replace this with a fake/random scheduler.

---

# 8. Optimization Decision Variable

Conceptually:

```text
x(task, block) ∈ {0,1}
```

Meaning:

```text
1 → task assigned to block
0 → task not assigned
```

The exact mathematical formulation already implemented in the repository is authoritative.

---

# 9. Hard Constraints

Hard constraints must never be violated.

Existing constraints include concepts such as:

- corridor compatibility,
- section compatibility,
- block-type compatibility,
- approval requirements,
- duration,
- train conflicts,
- task/block compatibility.

Conceptually:

```text
Task
 ↓
Is section compatible?
 ↓ yes
Is block type compatible?
 ↓ yes
Does duration fit?
 ↓ yes
Is approval valid?
 ↓ yes
Is there a train conflict?
 ↓ no
Candidate is feasible
```

---

# 10. Soft Preferences

After filtering infeasible options, the optimizer should choose the best feasible solution according to its objective.

Examples:

- higher priority,
- better block utilization,
- lower disruption,
- preferred timing.

Do not weaken hard constraints merely to schedule more tasks.

---

# 11. Optimization Objective

The current optimizer is intended to maximize priority-weighted schedule quality subject to constraints.

Conceptually:

```text
MAXIMIZE

Σ(task priority × assignment)
```

subject to:

```text
all hard constraints
```

The exact objective must remain based on the existing optimizer implementation.

---

# 12. MongoDB → Node → Python Data Flow

MongoDB is the live application source of truth.

Node collects relevant planning data:

```text
MongoDB
 │
 ├── pending block requests
 ├── approved schedules
 ├── available blocks
 ├── railway sections
 ├── resources
 ├── conflicts
 ├── train/operational constraints
 └── historical features where required
 │
 ▼
Node.js
 │
 ▼
Build planning context
 │
 ▼
Python/FastAPI
```

Python should not initially access the application's MongoDB directly.

This keeps responsibilities separated.

---

# 13. What Node Sends to Python

For a recommendation/optimization request, Node should send the current planning context.

Conceptual input:

```json
{
  "planningContext": {
    "date": "2026-09-18",
    "division": "Example Division"
  },
  "tasks": [
    {
      "taskId": "BR-101",
      "department": "ENGINEERING",
      "section": "KAK-RJY",
      "workType": "TRACK_MAINTENANCE",
      "durationMinutes": 180,
      "requestedStart": "10:00",
      "requestedEnd": "13:00",
      "priority": 92,
      "riskScore": 0.78
    }
  ],
  "blockWindows": [
    {
      "blockId": "BL-01",
      "section": "KAK-RJY",
      "blockType": "TRAFFIC_BLOCK",
      "start": "08:00",
      "end": "11:00",
      "approved": true
    }
  ],
  "existingSchedules": [],
  "trainConflicts": [],
  "constraints": []
}
```

This is a target contract. The exact fields must be aligned with the actual Python repository's schemas and optimizer inputs.

---

# 14. Python Processing Flow

```text
JSON Request
    ↓
Pydantic Validation
    ↓
Convert to internal structures
    ↓
Risk Prediction (if requested)
    ↓
Priority Scoring
    ↓
MILP Optimization
    ↓
Optional Simulation
    ↓
Build Recommendation
    ↓
JSON Response
```

Python should not need to write/read CSV files for every live application request.

---

# 15. Python Response

The Python service should return structured JSON.

Conceptual example:

```json
{
  "success": true,
  "optimizer": {
    "status": "OPTIMAL"
  },
  "assignments": [
    {
      "taskId": "BR-101",
      "blockId": "BL-01",
      "startTime": "08:00",
      "endTime": "11:00"
    }
  ],
  "risk": [],
  "priority": [],
  "metrics": {},
  "recommendations": [],
  "modelVersion": "v1"
}
```

Only return metrics that are actually calculated by the implementation.

Do not invent confidence, disruption, or risk metrics.

---

# 16. Recommended FastAPI Boundary

Target endpoints:

```text
GET  /health

POST /risk/predict

POST /priority/score

POST /schedule/optimize

POST /schedule/recommend

POST /simulate

POST /recovery/recommend

GET  /metrics
```

The exact API can be adjusted after inspecting the existing repository.

---

# 17. Main Recommendation Endpoint

The main Control workflow should use:

```text
POST /schedule/recommend
```

Conceptually it can combine:

```text
Current planning data
       ↓
Risk
       +
Priority
       +
MILP optimization
       ↓
Candidate recommendations
```

Node then presents those candidates to the Control Officer.

---

# 18. Live Application Workflow

Example:

### Engineering submits:

```text
Section: KAK-RJY
10:00–13:00
Track Maintenance
HIGH
```

Node:

```text
Validate
 ↓
MongoDB
 ↓
Conflict Detection
```

Suppose Electrical already has:

```text
KAK-RJY
11:00–14:00
```

System detects overlap.

Then:

```text
Control Officer
 ↓
Generate Recommendation
 ↓
Node reads MongoDB
 ↓
Node builds planning context
 ↓
Python
 ↓
Risk + Priority + MILP
 ↓
Recommendation
 ↓
Node
 ↓
React
```

---

# 19. Control Officer UI

The recommendation should appear as:

```text
AI / OPTIMIZATION RECOMMENDATION

Engineering
KAK-RJY

Recommended Window:
08:00 – 11:00

Conflict:
None identified

Priority:
HIGH

Reason:
Compatible block window satisfying current constraints.

[ ACCEPT ]
[ MODIFY ]
[ REJECT ]
```

The exact displayed metrics must come from the actual Python result.

---

# 20. Final Approval Flow

If Control accepts:

```text
React
 ↓
POST /api/block-requests/:id/approve
 ↓
Node
 ↓
Check Control Officer authorization
 ↓
Revalidate current constraints
 ↓
Persist final schedule
 ↓
Create audit log
 ↓
Create notifications
```

MongoDB becomes the authoritative record of the final schedule.

Python does not directly approve the block.

---

# 21. Why Revalidate?

Suppose:

```text
10:00
↓
ML generates recommendation
```

Then another block is approved.

At:

```text
10:10
↓
Control clicks Accept
```

The recommendation may now be stale.

Therefore:

```text
Accept
 ↓
Node re-checks current state
 ↓
If changed → recompute/review
 ↓
Otherwise → finalize
```

Never blindly save an old recommendation.

---

# 22. CSV vs MongoDB

## CSV remains useful for:

- model training,
- historical datasets,
- offline experiments,
- demo data,
- pipeline testing.

## Live application uses:

```text
MongoDB
 ↓
Node
 ↓
Python
 ↓
Node
 ↓
MongoDB
```

Do not make the production application depend on manually generated CSV files.

---

# 23. Training vs Prediction

These are different.

## Training

```text
Historical Data
 ↓
Cleaning
 ↓
Feature Engineering
 ↓
Training
 ↓
Evaluation
 ↓
Saved Model
```

## Live Prediction

```text
Current Request
 ↓
Same preprocessing
 ↓
Saved Model
 ↓
Prediction
```

Do not retrain the model on every Control Officer request.

---

# 24. Historical Data

Potential historical information:

```text
Past requests
Past schedules
Actual durations
Past conflicts
Past disruptions
Past recovery actions
```

Training flow:

```text
Historical Data
 ↓
Feature Pipeline
 ↓
Model Training
 ↓
Model Evaluation
 ↓
Versioned Model
```

Current prototype CSV data can continue to be used for training.

Later, MongoDB historical records can be exported into a training dataset.

---

# 25. Simulation

Existing:

```text
simulation/sequential_simulator.py
simulation/block_failure_simulation.py
```

Purpose:

```text
Optimized Plan
 ↓
Sequential Replay
 ↓
Metrics
```

Failure:

```text
Optimized Plan
 ↓
Force Block Failure
 ↓
Observe affected tasks
 ↓
Recovery
```

Simulation is for evaluation/testing and should not automatically modify the live final schedule.

---

# 26. Recovery Optimization

Existing:

```text
optimization/recovery_optimizer.py
```

Workflow:

```text
Final Schedule
      ↓
Block Failure / Disruption
      ↓
Affected Tasks
      ↓
Find compatible alternate blocks
      ↓
Recovery Optimizer
      ↓
Recovery Recommendation
      ↓
Control Officer
      ↓
Accept / Modify / Reject
      ↓
Updated Schedule
```

Normal optimization creates a schedule.

Recovery optimization adapts an existing schedule after disruption.

---

# 27. ML Service Failure

If Python is unavailable:

```text
Python unavailable
      ↓
Node remains operational
      ↓
Conflict detection continues
      ↓
Deterministic feasibility checks continue
      ↓
Control can manually schedule
```

React should show:

```text
AI recommendation temporarily unavailable.
Manual scheduling tools remain available.
```

The entire application must not fail because the ML service is unavailable.

---

# 28. Recommendation Versioning

Store enough information to know when a recommendation was generated.

Conceptually:

```text
recommendationId
createdAt
request/context version
modelVersion
optimizerVersion
result
```

This helps determine whether a recommendation is stale.

---

# 29. Existing Repository Issues to Fix Before Integration

The existing audit found:

### Dependency manifest missing

Create:

```text
requirements.txt
```

or equivalent.

### Incorrect package files

Rename:

```text
_init_.py
```

to:

```text
__init__.py
```

### Import inconsistencies

Standardize imports.

### Duplicate bundle-analysis code

Determine which implementation is actually used before deleting anything.

### No `.gitignore`

Ignore:

```text
__pycache__/
*.pyc
.venv/
venv/
.env
```

### No tests

Add tests for:

```text
validation
risk
priority
optimizer
simulation
recovery
API
```

### Duplicate mappings

Centralize corridor/section/block-type mappings.

### Duplicate metrics

Create one authoritative metrics implementation.

---

# 30. Important 300 → 20 Investigation

The existing audit observed approximately:

```text
300 maintenance tasks
       ↓
20 optimized rows
       ↓
2 recovery rows
```

Do NOT change the optimizer just to increase this number.

Investigate:

```text
section mapping
corridor mapping
block type
approval
duration
train conflicts
available blocks
data joins
date/time compatibility
```

If the result is legitimate, document why.

If there is a mapping/data bug, fix the bug.

If there is an optimizer bug, fix it with tests.

---

# 31. Hard Constraint Principle

Never do:

```text
Only 20 tasks fit
 ↓
remove constraints
 ↓
300 tasks scheduled
```

Instead:

```text
Only 20 tasks fit
 ↓
investigate why
 ↓
verify constraints
 ↓
verify input data
 ↓
verify mappings
 ↓
verify solver
```

A smaller feasible solution is better than an invalid railway schedule.

---

# 32. Optimization Quality Metrics

Do not judge the optimizer only by the number of scheduled tasks.

Evaluate:

```text
feasibility
constraint violations
priority-weighted objective
unassigned tasks
conflict count
block utilization
schedule quality
recovery performance
```

Metrics must use one shared implementation.

---

# 33. Security

The intended communication is:

```text
Browser
  X
  │
  └── no direct dependency on Python

Node
 ↓
Python
```

The Python service should be internal/protected.

Do not expose ML service credentials to React.

Node handles the main authentication and authorization.

---

# 34. Performance

Do not run MILP every time the dashboard opens.

Dashboard:

```text
React
 ↓
Node
 ↓
MongoDB
```

Optimization:

```text
Control clicks Generate Recommendation
 ↓
Node
 ↓
Python
```

Run expensive optimization when actually needed.

---

# 35. Complete End-to-End Flow

```text
USER
 ↓
React
 ↓
Login
 ↓
Node Authentication
 ↓
JWT + Role
 ↓
Role Dashboard
 ↓
Department creates Block Request
 ↓
Node validates
 ↓
MongoDB stores request
 ↓
Conflict Detection
 ↓
Control Officer sees request/conflict
 ↓
Control asks for recommendation
 ↓
Node queries MongoDB
 ↓
Node builds planning context
 ↓
Python/FastAPI
 ↓
Input Validation
 ↓
Risk Prediction
 ↓
Priority Scoring
 ↓
MILP Optimization
 ↓
Optional Simulation
 ↓
Recommendation
 ↓
Python returns JSON
 ↓
Node
 ↓
React Control Dashboard
 ↓
Control Officer
 ↓
Accept / Modify / Reject
 ↓
Node revalidates
 ↓
MongoDB stores final schedule
 ↓
Notifications
 ↓
Audit Log
 ↓
Departments see final schedule
```

---

# 36. Failure/Recovery Flow

```text
Final Schedule
      ↓
Block becomes unavailable
      ↓
Node identifies affected tasks
      ↓
Build recovery context
      ↓
Python Recovery Optimizer
      ↓
Alternate compatible assignments
      ↓
Recommendation
      ↓
Control Officer
      ↓
Accept / Modify / Reject
      ↓
Node revalidates
      ↓
MongoDB updated schedule
      ↓
Notifications + Audit
```

---

# 37. Responsibility Matrix

| Function | React | Node | MongoDB | Python |
|---|---:|---:|---:|---:|
| Login UI | ✓ | | | |
| Authentication | | ✓ | ✓ | |
| Authorization | | ✓ | | |
| Request Creation | ✓ | ✓ | ✓ | |
| Conflict Detection | Display | ✓ | ✓ | |
| Scheduling Workflow | Display | ✓ | ✓ | |
| Risk Prediction | Display | Gateway | | ✓ |
| Priority Scoring | Display | Gateway | | ✓ |
| MILP Optimization | Display | Gateway | | ✓ |
| Simulation | Display | Gateway | | ✓ |
| Recovery | Display | Gateway | | ✓ |
| Final Approval | UI | ✓ | ✓ | |
| Notifications | UI | ✓ | ✓ | |
| Audit | Display | ✓ | ✓ | |

---

# 38. Target Repository Structure

Main project:

```text
railway-block-planning/
│
├── frontend/
│
├── backend/
│
├── ml-service/
│
├── docs/
│
└── README.md
```

Python service:

```text
ml-service/
└── app/
    ├── api/
    ├── schemas/
    ├── ml/
    ├── services/
    ├── optimization/
    ├── simulation/
    └── validation/
```

The existing repository should be moved/adapted into `ml-service` only after it has been cleaned and verified.

---

# 39. Implementation Sequence

Follow this order:

```text
1. Clean existing Python repository
        ↓
2. Verify CSV pipeline
        ↓
3. Understand exact existing input/output schemas
        ↓
4. Add Pydantic request/response models
        ↓
5. Expose existing logic through FastAPI
        ↓
6. Test Python service independently
        ↓
7. Design MongoDB schemas
        ↓
8. Build Node backend
        ↓
9. Authentication + RBAC
        ↓
10. Block request workflow
        ↓
11. Conflict detection
        ↓
12. Control dashboard
        ↓
13. Connect Node → Python
        ↓
14. Recommendation UI
        ↓
15. Final approval + audit
        ↓
16. Simulation/recovery integration
        ↓
17. End-to-end testing
        ↓
18. Deployment
```

---

# 40. Claude Code Instructions

When working on this project:

1. Read the existing Python repository before modifying it.
2. Preserve the working ML and MILP logic.
3. Do not rewrite the optimizer without evidence.
4. Do not invent ML outputs.
5. Do not call synthetic risk labels production railway safety labels.
6. Keep CSV support for training/testing.
7. Use JSON for live Node ↔ Python communication.
8. Keep MongoDB as the live application source of truth.
9. Keep Node as the main application backend.
10. Keep Python as the Intelligence Service.
11. Do not let Python directly approve final blocks.
12. Revalidate recommendations before final approval.
13. Add tests before major refactoring.
14. Do not delete modules until their usage is verified.
15. Do not weaken constraints to make optimization output look better.
16. Prefer small, testable changes.
17. If the existing implementation conflicts with this document, inspect the actual code and explain the conflict before making a destructive architectural change.
18. Never fabricate data or claim unsupported model accuracy.
19. Do not introduce Kafka, Kubernetes, Redis, or other infrastructure unless a real requirement is demonstrated.

---

# 41. Definition of Done

ML integration is complete when:

```text
MongoDB
 ↓
Node collects current planning state
 ↓
Node builds validated JSON
 ↓
Python receives request
 ↓
Pydantic validation
 ↓
Risk / Priority / MILP / Simulation / Recovery as required
 ↓
Python returns structured JSON
 ↓
Node receives result
 ↓
React displays recommendation
 ↓
Control Officer reviews
 ↓
Node revalidates
 ↓
Final schedule stored in MongoDB
 ↓
Notification + Audit
```

And when Python is unavailable:

```text
Node continues operating
+
Conflict detection continues
+
Manual/deterministic scheduling remains available
```

---

# 42. Final Architecture Statement

> **MongoDB stores the live railway planning state, Node.js orchestrates the application and business workflow, Python/FastAPI analyzes the current planning context using risk prediction, priority scoring, MILP optimization, simulation and recovery logic, and React presents the resulting recommendations to the Control Officer, who makes the final human scheduling decision.**
