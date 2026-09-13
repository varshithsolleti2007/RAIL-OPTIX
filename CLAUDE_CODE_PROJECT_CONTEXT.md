# Railway Block Planning & Coordination System
## Complete Project Context for Claude Code

**Project:** Smart India Hackathon 2026  
**Purpose:** This document is the single source of truth for Claude Code to understand the problem, proposed solution, system workflow, architecture, ML role, user roles, and development boundaries.

---

# 1. Project Overview

We are building a **Railway Block Planning & Coordination System** for coordinating maintenance and operational block requirements across multiple railway departments.

The system provides one centralized platform where departments such as:

- Engineering
- Electrical
- Signalling & Telecommunication (S&T)
- Control / Operations

can submit maintenance block requirements.

The platform analyzes these requests, identifies conflicts, considers railway section/resource/time constraints, generates feasible scheduling options, and uses an existing ML/optimization intelligence layer to recommend better block schedules.

The final scheduling authority remains with the **Control Officer**.

The system is a decision-support and coordination platform. It is not intended to autonomously control railway operations.

---

# 2. Problem

Railway maintenance activities are often dependent on shared infrastructure, shared sections, available time windows, operational restrictions, and coordination between departments.

Different departments may independently require blocks on the same railway section.

For example:

```text
Engineering
KAK → RJY
10:00 – 13:00
Track Maintenance

Electrical
KAK → RJY
11:00 – 14:00
OHE Maintenance
```

These requests overlap.

Without centralized coordination, the planning process can become difficult because the Control Officer has to consider:

- Which department requested the block?
- Which railway section is affected?
- When is the block required?
- How long will the work take?
- What priority does the work have?
- Are other departments requesting the same section?
- Are there resource conflicts?
- Are there existing approved blocks?
- Can multiple compatible works be combined?
- Can a request be moved to another feasible time?
- What is the impact on railway operations?

The main problem is therefore:

> **How can multiple departmental railway maintenance block requirements be centrally coordinated and converted into a feasible, conflict-aware and optimized block schedule while keeping the final decision under railway control?**

---

# 3. Proposed Solution

We propose a centralized web-based system that acts as a **digital coordination and decision-support platform**.

The system will:

1. Authenticate users.
2. Identify their department and role.
3. Provide role-specific dashboards.
4. Allow departments to submit block requests.
5. Validate submitted information.
6. Store requests centrally.
7. Detect scheduling conflicts.
8. Present conflicts to the Control Officer.
9. Analyze feasible scheduling alternatives.
10. Use ML/optimization to generate recommendations.
11. Allow the Control Officer to accept, modify, reject, or reschedule recommendations.
12. Publish the final block plan.
13. Notify affected departments.
14. Track execution/status.
15. Maintain an audit history.

The important design principle is:

> **Automation assists the Control Officer; it does not replace the Control Officer.**

---

# 4. Core Idea in One Sentence

> **Departments request blocks → the system validates and detects conflicts → scheduling intelligence generates feasible recommendations → Control Officer makes the final decision → the approved block plan is published to all concerned departments.**

---

# 5. Target Users

## 5.1 Admin

The Admin manages system-level information.

Responsibilities:

- Manage users.
- Manage departments.
- Manage railway sections/master data.
- Activate/deactivate users.
- View audit logs.
- Monitor overall system activity.

Admin is not the primary scheduling decision-maker.

---

## 5.2 Control Officer

This is the central coordination role.

Responsibilities:

- View all departmental block requests.
- Review pending requests.
- View conflicts.
- Analyze scheduling options.
- Review ML recommendations.
- Approve requests.
- Reject requests.
- Modify requests.
- Reschedule requests.
- Resolve conflicts.
- Publish final schedules.
- Monitor upcoming/active blocks.

The Control Officer is the **human decision authority**.

---

## 5.3 Engineering Department

Typical work:

- Track maintenance.
- Track inspection.
- Civil maintenance.
- Track equipment work.

Engineering can:

- Create block requests.
- Save drafts.
- Submit requests.
- View own requests.
- Track status.
- View approved schedules.
- Receive notifications.

---

## 5.4 Electrical Department

Typical work:

- OHE maintenance.
- Electrical inspection.
- Traction-related maintenance.
- Electrical equipment work.

Electrical can:

- Create block requests.
- Submit requests.
- Track status.
- View approved schedules.
- Receive notifications.

---

## 5.5 S&T Department

Typical work:

- Signal maintenance.
- Interlocking work.
- Telecom maintenance.
- Cable-related maintenance.

S&T can:

- Create block requests.
- Submit requests.
- Track status.
- View approved schedules.
- Receive notifications.

---

# 6. System Architecture

The system has four logical layers.

```text
┌────────────────────────────────────────────────────────────┐
│                         USERS                              │
│ Admin | Control | Engineering | Electrical | S&T           │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                      │
│                       React Frontend                       │
│                                                            │
│ Dashboards | Forms | Requests | Conflicts | Schedule       │
│ Notifications | Reports | ML Recommendations               │
└────────────────────────────┬───────────────────────────────┘
                             │ REST API / HTTPS
                             ▼
┌────────────────────────────────────────────────────────────┐
│                 APPLICATION / BUSINESS LAYER               │
│                    Node.js + Express                       │
│                                                            │
│ Auth | RBAC | Requests | Conflict Detection                │
│ Scheduling | Notifications | Audit | ML Gateway            │
└───────────────┬──────────────────────────┬─────────────────┘
                │                          │
                ▼                          ▼
┌────────────────────────┐      ┌────────────────────────────┐
│       DATA LAYER       │      │     INTELLIGENCE LAYER     │
│        MongoDB         │      │ Existing Python/FastAPI ML  │
│                        │      │ + OR-Tools Optimization     │
│ Users                  │      │                            │
│ Departments            │      │ Risk Prediction            │
│ Requests               │      │ Priority Scoring            │
│ Sections               │      │ MILP Scheduling             │
│ Conflicts              │      │ Simulation                  │
│ Schedules              │      │ Failure Recovery            │
│ Notifications          │      │ Recommendations             │
│ Audit Logs             │      │                            │
└────────────────────────┘      └────────────────────────────┘
```

---

# 7. Technology Stack

## Frontend

```text
React
Vite
React Router
Axios
Tailwind CSS
Recharts
```

## Backend

```text
Node.js
Express.js
Mongoose
JWT
bcryptjs
dotenv
CORS
```

## Database

```text
MongoDB
```

## Intelligence Layer

The ML repository already exists and was created by another team member.

Current technology:

```text
Python
FastAPI
scikit-learn / RandomForest
OR-Tools / SCIP
joblib
CSV-based pipeline
```

The existing ML repository is not to be rewritten unnecessarily.

It should be cleaned, tested, and integrated into this architecture.

---

# 8. Existing ML Repository — Important Context

A separate Python/FastAPI repository already exists.

An audit found that it currently implements:

```text
CSV Input
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
FastAPI Read APIs
```

The current repository contains:

### 8.1 Validation

`validation/schema_validator.py`

Responsibilities:

- Normalize column names/aliases.
- Validate required columns.
- Validate ranges.
- Normalize input values.

### 8.2 Risk Model

`ml/risk_prediction.py`

`ml/predict_risk.py`

Current model:

```text
RandomForestClassifier
```

Important limitation:

> The current risk labels are generated from synthetic/rule-based logic, so this is a prototype model and should not be represented as a clinically/operationally validated real-world railway risk predictor.

The model saves:

```text
saved_models/maintenance_risk_model.joblib
```

and generates:

```text
maintenance_tasks_with_risk.csv
```

### 8.3 Priority Scoring

`services/priority_scoring.py`

Uses a heuristic weighted formula to calculate task priority.

Output:

```text
prioritized_tasks.csv
```

### 8.4 Optimization

`optimization/basic_optimizer.py`

This is the strongest part of the current ML repository.

It uses:

```text
OR-Tools + SCIP
MILP
```

to assign maintenance tasks to block windows while considering constraints such as:

- Corridor
- Railway section
- Block type
- Approval
- Duration
- Train conflicts
- Task/block compatibility
- Priority

The optimizer attempts to maximize priority-weighted scheduling quality.

### 8.5 Simulation

Existing simulation code:

```text
simulation/sequential_simulator.py
simulation/block_failure_simulation.py
```

It can:

- Replay the plan sequentially.
- Simulate a block failure.
- Observe effects on the schedule.

### 8.6 Recovery

`optimization/recovery_optimizer.py`

Can reassign affected tasks to compatible alternate blocks after a failure or disruption.

### 8.7 Existing API

`api/routes.py`

Currently exposes read-only FastAPI endpoints over generated CSV data plus metrics.

This API needs to evolve into a clean **Intelligence Service API** for the Node backend.

---

# 9. ML Is NOT the Entire Application

This is a critical instruction.

The existing Python repository represents only the:

> **Intelligence Layer**

It is NOT the main application.

Current situation:

```text
Existing:
Python/FastAPI
   ↓
CSV-based ML + Optimization prototype
```

Target:

```text
React
   ↓
Node/Express
   ↓
MongoDB
   ↕
Python Intelligence Service
```

The Node backend is the main application/business layer.

MongoDB is the main application database.

React is the user interface.

Python is the intelligence/optimization service.

---

# 10. Complete End-to-End Workflow

## Step 1 — User Login

A user opens the application.

```text
Login
 ↓
Email + Password
 ↓
Node Authentication API
 ↓
JWT
 ↓
Identify role + department
 ↓
Redirect to correct dashboard
```

Example:

```text
Engineering user
→ Engineering Dashboard

Electrical user
→ Electrical Dashboard

S&T user
→ S&T Dashboard

Control Officer
→ Control Dashboard

Admin
→ Admin Dashboard
```

---

# 11. Step 2 — Department Creates Request

Example Engineering request:

```text
Department: Engineering
Section: KAK-RJY
Work Type: Track Maintenance
Date: 18-09-2026
Start: 10:00
End: 13:00
Priority: HIGH
Description: Scheduled track maintenance
```

React sends:

```text
POST /api/block-requests
```

Node validates:

- User authenticated?
- User authorized?
- Required fields present?
- Date valid?
- Time valid?
- Section valid?
- Priority valid?

Then stores it in MongoDB.

Initial status:

```text
DRAFT
```

After submission:

```text
SUBMITTED
```

---

# 12. Step 3 — Backend Processes Request

After submission:

```text
React
 ↓
Node API
 ↓
Validation
 ↓
MongoDB
 ↓
Conflict Detection
```

The system checks existing requests and approved schedules.

---

# 13. Step 4 — Conflict Detection

Suppose:

```text
Engineering
KAK-RJY
10:00–13:00

Electrical
KAK-RJY
11:00–14:00
```

The system detects:

```text
Same constrained section
+
Overlapping time
=
Potential conflict
```

Basic time-overlap condition:

```text
A.start < B.end
AND
B.start < A.end
```

The system creates a conflict record.

Example:

```text
Conflict Type: TIME_OVERLAP
Severity: HIGH
Section: KAK-RJY
Requests: Engineering + Electrical
Status: OPEN
```

---

# 14. Step 5 — Control Officer Sees Conflict

Control dashboard:

```text
┌──────────────────────────────────────┐
│          CONTROL DASHBOARD            │
├──────────────────────────────────────┤
│ Pending Requests       18             │
│ Open Conflicts          4             │
│ Today's Blocks         12             │
│ Upcoming Blocks         9             │
└──────────────────────────────────────┘
```

Conflict:

```text
Engineering
10:00–13:00
████████████████

Electrical
11:00–14:00
    ███████████████

OVERLAP: 11:00–13:00
```

Control Officer can investigate.

---

# 15. Step 6 — Scheduling Analysis

Before asking the ML service, the backend should establish the basic feasible problem.

Inputs:

```text
Pending requests
Existing approved schedules
Railway sections
Block windows
Resources
Priorities
Constraints
Known conflicts
```

The system determines possible candidate windows.

Example:

```text
Engineering:
Requested 10:00–13:00

Candidate:
10:00–13:00 → conflict
14:00–17:00 → feasible
```

The candidate information can then be passed to the Intelligence Service.

---

# 16. Step 7 — ML / Intelligence Layer

This is where the friend's existing repository is used.

The Node backend sends structured information to the Python service.

Conceptually:

```text
Node Backend
     │
     │ request data
     ▼
Python Intelligence Service
     │
     ├── Risk Prediction
     ├── Priority Scoring
     ├── MILP Optimization
     ├── Simulation
     └── Recovery
     │
     ▼
Recommendations
```

The ML service should not own users, authentication, or the main application database.

---

# 17. What Each Intelligence Component Does

## 17.1 Risk Prediction

Purpose:

Estimate maintenance/task risk based on the available features.

Current implementation:

```text
RandomForestClassifier
```

Output can contribute to planning priority or risk awareness.

Example:

```text
Task Risk: HIGH
Risk Score: 0.78
```

Do not claim that the current model predicts actual railway accidents or safety events.

It is a prototype task-risk model.

---

# 18. Priority Scoring

Priority scoring combines task characteristics into a priority score.

Conceptually:

```text
Priority =
    Work Importance
  + Urgency
  + Risk
  + Operational Factors
```

The exact current formula in the existing repository should be preserved unless a verified bug is found.

Output:

```text
Task A → Priority 92
Task B → Priority 75
Task C → Priority 61
```

This helps the optimizer decide which tasks should receive preference when not all requests can fit.

---

# 19. MILP Optimization — Main Intelligence

The existing `basic_optimizer.py` uses a real MILP optimization model.

This is NOT merely a UI rule.

It attempts to assign tasks to feasible block windows subject to constraints.

Conceptually:

```text
Maintenance Tasks
        +
Available Block Windows
        +
Railway Constraints
        +
Train Conflicts
        +
Department Requirements
        +
Priority
        ↓
     MILP Solver
        ↓
Optimized Task → Block Assignment
```

The objective is approximately:

> Maximize the priority-weighted quality of the selected schedule while respecting hard constraints.

The exact objective and constraints already implemented in the repository must be preserved unless a verified defect is found.

---

# 20. Simulation

After an optimized plan is generated:

```text
Optimized Plan
      ↓
Sequential Simulation
      ↓
Execution Replay
      ↓
Metrics / Observations
```

The simulation is useful for testing whether the generated plan behaves reasonably under sequential execution.

---

# 21. Failure Simulation

The existing system can force a block failure.

Example:

```text
Original Plan

Block A → 10:00
Block B → 12:00
Block C → 14:00

        ↓

Block B fails
```

The system can simulate the effect.

---

# 22. Recovery Optimization

After a disruption:

```text
Block Failure
     ↓
Affected Tasks
     ↓
Find Alternate Compatible Blocks
     ↓
Recovery Optimizer
     ↓
Recovery Plan
```

Example:

```text
Original:
Task A → Block B

Block B unavailable

Recovery:
Task A → Block D
```

The recovery optimizer should respect compatibility and constraints.

---

# 23. ML Recommendation Workflow

The final intended flow is:

```text
Current Requests
      ↓
Backend Validation
      ↓
Conflict Detection
      ↓
Candidate Scheduling
      ↓
Intelligence Service
      │
      ├── Risk
      ├── Priority
      ├── Optimization
      └── Simulation/Recovery where needed
      ↓
Recommended Schedule
      ↓
Control Officer
      ↓
Accept / Modify / Reject
      ↓
Final Schedule
```

---

# 24. Human-in-the-Loop Requirement

This must never be removed.

The system must NOT do:

```text
ML
 ↓
Automatically approve railway block
```

Instead:

```text
ML
 ↓
Recommendation
 ↓
Control Officer Review
 ↓
Human Decision
 ↓
Final Schedule
```

The recommendation should show:

```text
Recommended Window
Conflict Score
Priority
Risk
Expected disruption
Reason / explanation
Model version
```

---

# 25. Example ML Recommendation

Input:

```text
Engineering request

Section: KAK-RJY
Requested: 10:00–13:00
Duration: 3 hours
Priority: HIGH

Existing:
Electrical block: 11:00–14:00
```

Intelligence Service may return:

```json
{
  "recommendations": [
    {
      "startTime": "08:00",
      "endTime": "11:00",
      "conflictScore": 0.05,
      "disruptionScore": 0.15,
      "confidence": 0.86,
      "reason": "Feasible window with no identified overlap"
    }
  ],
  "modelVersion": "v1"
}
```

The Control Officer sees:

```text
AI RECOMMENDATION

08:00 – 11:00

Conflict Score: LOW
Disruption Score: LOW
Confidence: 86%

Reason:
Feasible window with no identified overlap.

[Accept]
[Modify]
[Reject]
```

The exact output must reflect what the ML service actually calculates. Do not invent metrics that the model does not provide.

---

# 26. Final Approval

If the Control Officer accepts:

```text
Recommendation
 ↓
Final validation
 ↓
Create/update schedule
 ↓
APPROVED
 ↓
SCHEDULED
 ↓
Publish
```

If the officer modifies it:

```text
Recommendation
 ↓
Control Officer changes time
 ↓
Conflict re-check
 ↓
Final validation
 ↓
Schedule
```

If rejected:

```text
Recommendation
 ↓
Reject
 ↓
Request remains unresolved / returns to review
```

---

# 27. Final Schedule Publication

Once finalized:

```text
Final Block Plan
      ↓
MongoDB
      ↓
Notification Service
      ↓
Affected Departments
```

Each department can see only the information appropriate to its role while Control/Admin can see broader system information.

---

# 28. Execution and Completion

After a scheduled block occurs:

```text
SCHEDULED
    ↓
IN_PROGRESS
    ↓
COMPLETED
```

If something goes wrong:

```text
IN_PROGRESS
    ↓
FAILED / DISRUPTED
    ↓
Recovery Analysis
    ↓
Alternate Plan
```

The exact status model should remain consistent across frontend/backend/database.

---

# 29. Core Data Model

MongoDB should contain the application's authoritative data.

Collections:

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

Important principle:

> CSV files belong to the current ML prototype/testing workflow. They must not become the authoritative database for the complete application.

---

# 30. Block Request Data

A block request should conceptually contain:

```text
requestNumber
departmentId
requestedBy
sectionId
workType
description
date
startTime
endTime
duration
priority
requiredResources
constraints
status
createdAt
updatedAt
```

---

# 31. Conflict Data

```text
requestIds
sectionId
conflictType
severity
description
status
resolvedBy
resolution
createdAt
resolvedAt
```

---

# 32. Schedule Data

```text
requestId
sectionId
date
startTime
endTime
status
approvedBy
approvalTimestamp
createdAt
updatedAt
```

---

# 33. Audit Data

Every important action should be traceable.

Example:

```text
Control Officer
     ↓
Rescheduled Request #BR-102
     ↓
Audit Log

Action:
RESCHEDULE

Old:
10:00–13:00

New:
14:00–17:00

Actor:
Control Officer

Timestamp:
...
```

---

# 34. Frontend Behavior

The application should be one React application.

It must dynamically render content according to role.

Example:

```text
                    Login
                      ↓
                 Auth Context
                      ↓
                    Role
                      │
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
 Engineering      Electrical        S&T
 Dashboard        Dashboard       Dashboard

                      +

                Control Officer
                      ↓
              Control Dashboard

                      +

                    Admin
                      ↓
               Admin Dashboard
```

Do not create five completely separate applications.

---

# 35. Engineering Dashboard

Display:

```text
Total Requests
Pending
Approved
Rejected
Upcoming Blocks
Recent Requests
Notifications
```

Actions:

```text
+ Create Block Request
View Requests
View Schedule
View Notifications
```

---

# 36. Electrical Dashboard

Similar structure but with electrical-specific work types and information.

---

# 37. S&T Dashboard

Similar structure but with S&T-specific work types and information.

---

# 38. Control Dashboard

This is the most information-rich dashboard.

It should contain:

```text
KPIs
Request Queue
Conflict Queue
Schedule Timeline
Department Summary
Priority Requests
AI Recommendations
Upcoming Blocks
Notifications
```

Example:

```text
┌──────────────────────────────────────────┐
│             CONTROL CENTER               │
├──────────────────────────────────────────┤
│ Pending   Conflicts   Today   Upcoming   │
│   18          4         12       9       │
├──────────────────────────────────────────┤
│ Request Queue                            │
│                                          │
│ Engineering   HIGH   KAK-RJY             │
│ Electrical    HIGH   KAK-RJY             │
│ S&T           MED    RJY-SLO             │
├──────────────────────────────────────────┤
│ Conflicts                                │
│ KAK-RJY  Engineering ↔ Electrical        │
├──────────────────────────────────────────┤
│ AI Recommendation                        │
│ Recommended: 08:00–11:00                 │
│                                          │
│ [Accept] [Modify] [Reject]               │
└──────────────────────────────────────────┘
```

---

# 39. Admin Dashboard

Show:

```text
Users
Departments
Railway Sections
System Activity
Audit Logs
Overall Statistics
```

Admin should not automatically receive Control Officer permissions unless explicitly configured.

---

# 40. Backend Responsibility

Node.js/Express is the main application backend.

It owns:

- Authentication
- Authorization
- User management
- Department management
- Block request CRUD
- Request state transitions
- Conflict orchestration
- Scheduling workflow
- Notifications
- Audit logging
- ML service integration

Node should NOT duplicate the ML algorithm.

It should call the Python Intelligence Service.

---

# 41. Intelligence Service Responsibility

Python/FastAPI owns:

- Risk prediction.
- Priority scoring where appropriate.
- Optimization.
- Simulation.
- Failure simulation.
- Recovery optimization.
- Recommendation generation.

It should NOT own:

- User login.
- JWT authentication for the main application.
- Department management.
- Main user database.
- Final approval.
- Main frontend state.

---

# 42. Communication Between Node and Python

Target architecture:

```text
React
  ↓
Node.js
  ↓
HTTP request
  ↓
Python FastAPI
  ↓
ML/Optimization
  ↓
JSON response
  ↓
Node.js
  ↓
React
```

Node is the gateway.

The browser should not directly call the internal ML service in the production architecture.

---

# 43. Target Intelligence API

The existing read-only CSV API should eventually expose clean service-oriented endpoints.

Potential endpoints:

```text
GET  /health
POST /risk/predict
POST /priority/score
POST /schedule/recommend
POST /schedule/optimize
POST /simulate
POST /recovery/recommend
GET  /metrics
```

The exact endpoints can be adjusted after inspecting the current repository.

Do not create endpoints for functionality that does not exist.

---

# 44. Structured JSON Over CSV for Integration

Current:

```text
CSV
 ↓
Python pipeline
 ↓
CSV
 ↓
FastAPI reads CSV
```

Target:

```text
Node
 ↓
JSON
 ↓
FastAPI
 ↓
Python logic
 ↓
JSON
 ↓
Node
```

CSV should remain available for:

- Historical data.
- Training.
- Offline experiments.
- Demo datasets.
- Pipeline testing.

But the application integration should use JSON APIs.

---

# 45. Important Existing ML Repository Issues

The previous audit identified these issues.

Claude Code must address them carefully.

### 45.1 No dependency manifest

There is currently no reliable:

```text
requirements.txt
pyproject.toml
```

Create a reproducible dependency manifest.

### 45.2 Incorrect `__init__.py` names

Several packages contain:

```text
_init_.py
```

instead of:

```text
__init__.py
```

Correct them.

### 45.3 Import inconsistencies

Different modules currently use incompatible import conventions.

Examples include:

```python
from app.services.data_loader import ...
```

and:

```python
from backend.app.services.bundle_utils import ...
```

and:

```python
from resource_utils import ...
```

Standardize imports using one project structure.

### 45.4 Duplicate bundle analysis modules

There are duplicate/overlapping bundle-analysis implementations.

Determine which implementation is actually used before removing anything.

### 45.5 Missing `.gitignore`

Add Python and project-specific ignores.

Do not commit:

```text
__pycache__/
*.pyc
.venv/
venv/
.env
temporary generated files
```

### 45.6 No tests

Add tests around:

- Validation.
- Risk prediction.
- Priority scoring.
- Optimizer.
- Simulation.
- Recovery.
- API schemas.

### 45.7 Duplicated mappings

Corridor/section/block-type mappings are duplicated in multiple modules.

Centralize them into one source of truth.

### 45.8 Metrics duplication

`services/plan_metrics.py` and the API's inline metrics implementation differ.

Create one authoritative metrics implementation.

### 45.9 Suspicious optimization output

Current audit observed approximately:

```text
300 maintenance tasks
        ↓
20 optimized plan rows
        ↓
2 recovery rows
```

Do NOT automatically assume this is a bug.

Investigate:

- Section mapping.
- Corridor mapping.
- Block compatibility.
- Block type.
- Approval constraints.
- Duration.
- Train conflicts.
- Data availability.

Determine whether the low scheduling count is caused by intentional constraints or incorrect data/mapping.

---

# 46. What Claude Code Must NOT Do

This section is extremely important.

## Do NOT rewrite the existing ML system from scratch.

## Do NOT replace the MILP optimizer with a fake heuristic.

The existing OR-Tools/SCIP optimizer is valuable.

## Do NOT claim the RandomForest model is production-validated.

Its current labels are synthetic/rule-based.

## Do NOT make ML automatically approve blocks.

## Do NOT move the entire application into Python.

Python is the Intelligence Service.

## Do NOT make MongoDB dependent on CSV files.

MongoDB is the main application data store.

## Do NOT expose the ML service directly to the browser as the main architecture.

Node should act as the application gateway.

## Do NOT add unnecessary infrastructure.

Do not introduce:

```text
Kafka
Kubernetes
Redis
microservice mesh
complex event buses
```

unless there is a demonstrated requirement.

---

# 47. Important Development Principle

Build the system in this order:

```text
1. Clean existing ML repository
          ↓
2. Verify ML pipeline
          ↓
3. Define database schema
          ↓
4. Build Node backend
          ↓
5. Authentication + RBAC
          ↓
6. Block request workflow
          ↓
7. Conflict detection
          ↓
8. Control dashboard
          ↓
9. Scheduling workflow
          ↓
10. Integrate Python Intelligence Service
          ↓
11. ML recommendations
          ↓
12. Notifications
          ↓
13. Audit
          ↓
14. Testing
          ↓
15. Deployment
```

Do not start by building everything simultaneously.

---

# 48. Current Development State

At the beginning of this project:

### Existing

```text
Python/FastAPI Intelligence Prototype
        │
        ├── Validation
        ├── RandomForest risk model
        ├── Priority scoring
        ├── MILP optimization
        ├── Simulation
        ├── Failure simulation
        ├── Recovery optimization
        └── Read-only FastAPI API
```

### Not yet implemented

```text
React frontend
Node/Express application backend
MongoDB application database
Authentication
RBAC
Department dashboards
Control dashboard
Real application workflow
Application notifications
Application audit system
Production ML API integration
```

---

# 49. Final Target System

```text
                         USERS
                           │
                           ▼
                  ┌─────────────────┐
                  │ React Frontend  │
                  └────────┬────────┘
                           │
                        REST API
                           │
                           ▼
                  ┌─────────────────┐
                  │ Node + Express  │
                  │                 │
                  │ Auth            │
                  │ RBAC            │
                  │ Requests        │
                  │ Conflicts       │
                  │ Scheduling      │
                  │ Notifications   │
                  │ Audit           │
                  └───────┬─────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
       ┌─────────────┐       ┌──────────────────┐
       │  MongoDB    │       │ Python/FastAPI   │
       │             │       │ Intelligence     │
       │ Application │       │ Service          │
       │ Data        │       │                  │
       └─────────────┘       │ Risk             │
                             │ Priority         │
                             │ MILP Optimization│
                             │ Simulation       │
                             │ Recovery         │
                             └────────┬─────────┘
                                      │
                                      ▼
                              Recommendations
                                      │
                                      ▼
                              Control Officer
                                      │
                                      ▼
                                Final Schedule
```

---

# 50. Example Complete Scenario

This is the scenario that should work in the final demo.

## Situation

Three departments submit work.

```text
Engineering
KAK-RJY
10:00–13:00
Track Maintenance
HIGH

Electrical
KAK-RJY
11:00–14:00
OHE Maintenance
HIGH

S&T
RJY-SLO
12:00–14:00
Signal Maintenance
MEDIUM
```

## System

```text
All requests submitted
        ↓
MongoDB
        ↓
Conflict detection
        ↓
Engineering ↔ Electrical conflict
        ↓
Control dashboard
```

## Intelligence

```text
Requests + constraints
        ↓
Priority
        ↓
Candidate windows
        ↓
MILP optimization
        ↓
Recommended schedule
```

Possible recommendation:

```text
Engineering → 08:00–11:00
Electrical  → 11:00–14:00
S&T         → 12:00–14:00
```

If S&T is on a different section and compatible, it may remain unchanged.

## Control Officer

Reviews:

```text
Recommendation
      ↓
Accept / Modify / Reject
```

Suppose Control accepts.

```text
Final Schedule
      ↓
Publish
      ↓
Engineering notified
Electrical notified
S&T notified
```

## Later disruption

Suppose Electrical's block fails.

```text
Failure
  ↓
Simulation / Recovery
  ↓
Find alternate compatible window
  ↓
Recovery recommendation
  ↓
Control Officer approval
  ↓
Updated schedule
```

This demonstrates the full intelligence-assisted workflow.

---

# 51. Demo Story

The SIH prototype should demonstrate one complete journey rather than dozens of disconnected features.

Recommended demo:

```text
1. Login as Engineering
2. Create block request
3. Login/view as Electrical
4. Create overlapping request
5. Open Control dashboard
6. Show conflict automatically detected
7. Open AI recommendation
8. Show optimized alternative
9. Control Officer accepts/modifies
10. Publish final schedule
11. Show departmental notification
12. Simulate a block failure
13. Show recovery recommendation
14. Show updated plan
15. Show audit history
```

This creates a clear story:

> **Request → Conflict → Intelligence → Human Decision → Final Schedule → Disruption → Recovery**

---

# 52. Coding Rules for Claude Code

When implementing:

1. Inspect the existing repository before changing it.
2. Preserve working logic.
3. Make small, verifiable changes.
4. Do not silently change business rules.
5. Run tests/import checks after changes.
6. Keep frontend, backend, database and ML responsibilities separated.
7. Use environment variables for secrets and service URLs.
8. Keep API contracts documented.
9. Prefer reusable services over duplicated logic.
10. Never fabricate functionality that is not implemented.
11. When uncertain, inspect the existing code/data first.
12. Explain significant architectural changes before making destructive changes.
13. Do not delete existing ML modules unless their usage has been verified.
14. Keep CSV pipeline support until JSON service integration is proven.
15. Treat the Control Officer as the final scheduling authority.

---

# 53. Immediate Task

The immediate task is NOT to build the whole application.

First:

```text
Existing ML Repository
        ↓
Clean
        ↓
Fix imports
        ↓
Fix __init__.py
        ↓
requirements.txt
        ↓
.gitignore
        ↓
Remove tracked pycache
        ↓
Centralize mappings
        ↓
Centralize metrics
        ↓
Add tests
        ↓
Verify pipeline
```

Then convert it into a clean Python Intelligence Service.

Only after that should the main application be built around it.

---

# 54. Definition of Success

The complete system should allow:

```text
Different Railway Departments
            ↓
Submit Maintenance Requirements
            ↓
Centralized Data
            ↓
Conflict Detection
            ↓
Feasibility Analysis
            ↓
ML + Optimization
            ↓
Schedule Recommendation
            ↓
Control Officer Review
            ↓
Final Approved Schedule
            ↓
Department Notifications
            ↓
Execution Monitoring
            ↓
Failure / Disruption
            ↓
Recovery Recommendation
            ↓
Updated Final Plan
            ↓
Audit History
```

The final product should feel like **one coherent railway coordination platform**, not a frontend, backend, and ML repository artificially connected together.
