# Railway Block Planning & Coordination System — Application PRD

## 1. Product Objective
Build a centralized web application for coordinating railway maintenance block requests across Engineering, Electrical, S&T, and Control. The platform converts departmental requirements into a conflict-aware, centrally reviewed schedule.

## 2. Core User Roles
- Admin — users, departments, master data, audit and system monitoring.
- Control Officer — review, coordinate, resolve conflicts, approve/reject/reschedule and publish final blocks.
- Engineering — submit and track track/civil maintenance blocks.
- Electrical — submit and track electrical/OHE blocks.
- S&T — submit and track signalling/telecom blocks.

## 3. Core Modules
1. Authentication and RBAC
2. Role-specific dashboards
3. Block request management
4. Conflict detection and resolution
5. Central scheduling
6. Calendar/timeline visualization
7. ML-assisted recommendations
8. Notifications
9. Audit/history
10. Master-data administration
11. Reports/analytics

## 4. End-to-End Application Flow

```text
Login
  ↓
JWT Authentication + Role Authorization
  ↓
Role Dashboard
  ↓
Department submits Block Request
  ↓
Validation
  ↓
Persist Request
  ↓
Automatic Conflict Detection
  ↓
┌───────────────┬─────────────────┐
│ Conflict      │ No Conflict     │
↓               ↓
Resolve/Modify  Continue Review
└───────────────┴────────┐
                         ↓
                 Scheduling Analysis
                         ↓
                 ML Recommendation
                         ↓
                 Control Officer
                         ↓
              Accept / Modify / Reject
                         ↓
                 Final Block Schedule
                         ↓
                  Publish Schedule
                         ↓
                 Notify Departments
                         ↓
                    Execute Block
                         ↓
                    Complete
                         ↓
                   Audit / History
```

## 5. Request State Machine

```text
DRAFT → SUBMITTED → UNDER_REVIEW
                         ↓
                  CONFLICT_DETECTED
                         ↓
                  CONFLICT_RESOLVED
                         ↓
                     APPROVED
                         ↓
                    SCHEDULED
                         ↓
                    IN_PROGRESS
                         ↓
                    COMPLETED

Rejected / Cancelled may occur where permitted.
```

## 6. Functional Requirements

### Authentication
- Login with email/password.
- Secure password hashing.
- JWT-based authenticated sessions.
- Logout and protected routes.

### Block Requests
A request must capture:
- Request number
- Department
- Requester
- Section
- Work type
- Description
- Date
- Start/end time
- Priority
- Required resources
- Constraints
- Status

### Control
- Unified request queue.
- Filters by date, section, department, priority and status.
- Conflict queue.
- Approve, reject, modify and reschedule.
- Publish final schedule.

### Notifications
Generate in-app notifications for submission, conflict, modification, approval, rejection, publication and schedule changes.

### Audit
Record actor, action, entity, previous value, new value and timestamp.

## 7. Non-Functional Requirements
- Responsive desktop-first UI.
- Clear status and priority indicators.
- Server-side authorization.
- Validation on client and server.
- Modular codebase.
- Explainable ML recommendations.
- No automatic final approval by ML.

## 8. MVP Acceptance Criteria
The prototype is complete when a user can log in, submit a request, persist it, detect an overlap, expose it to Control, resolve it, obtain a recommendation, approve/modify it, publish a schedule, notify affected users and retain an audit trail.
