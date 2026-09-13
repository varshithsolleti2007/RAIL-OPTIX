# Railway Block Planning & Coordination System
## System Architecture PRD

**Version:** 1.0  
**Status:** Development Baseline  
**Date:** 14 September 2026  
**Project:** Smart India Hackathon 2026 Prototype

---

## 1. Purpose

This document defines the technical architecture and product requirements for a centralized Railway Block Planning & Coordination System.

The system coordinates maintenance and operational block requests submitted by different railway departments, identifies scheduling conflicts, supports centralized decision-making, and provides intelligent schedule recommendations.

The architecture is designed for an SIH prototype: practical, modular, secure, explainable, and extensible without unnecessary infrastructure complexity.

---

## 2. Problem Statement

Railway maintenance activities are carried out by multiple departments such as:

- Engineering
- Electrical
- Signalling & Telecommunication (S&T)
- Operations / Control

These activities may require the same railway section, overlapping time windows, common resources, or operational restrictions.

The system must provide a common platform where departments can:

1. Submit block requirements.
2. Track request status.
3. View approved schedules.
4. Detect conflicts with other departmental activities.
5. Coordinate modifications.
6. Allow the Control Officer to finalize the block plan.
7. Use historical and current data to generate intelligent scheduling recommendations.

---

## 3. Product Goal

Build a centralized digital platform that transforms departmental block requests into a coordinated and conflict-aware railway block schedule.

### Primary Goal

> Enable railway departments to collaboratively request, analyze, optimize, approve, and monitor maintenance blocks through a single role-based platform.

### Secondary Goals

- Reduce manual coordination.
- Detect overlapping or conflicting requests.
- Improve utilization of available block windows.
- Provide transparent approval workflows.
- Maintain complete request and decision history.
- Provide ML-assisted recommendations without removing human authority.

---

# 4. High-Level Architecture

The system follows a **four-layer architecture**:

```text
┌───────────────────────────────────────────────────────────────┐
│                        USERS / ROLES                          │
│ Admin | Control Officer | Engineering | Electrical | S&T     │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                         │
│                         React.js                              │
│                                                               │
│ Login | Dashboards | Requests | Calendar | Conflicts          │
│ Schedule | Notifications | Reports | AI Recommendations       │
└──────────────────────────────┬────────────────────────────────┘
                               │ REST API / HTTPS
                               ▼
┌───────────────────────────────────────────────────────────────┐
│                  APPLICATION / BUSINESS LAYER                 │
│                    Node.js + Express.js                       │
│                                                               │
│ Authentication | Authorization | Block Management             │
│ Conflict Detection | Scheduling | Notifications | Audit       │
└───────────────┬───────────────────────────────┬───────────────┘
                │                               │
                ▼                               ▼
┌──────────────────────────┐       ┌────────────────────────────┐
│       DATA LAYER         │       │     INTELLIGENCE LAYER     │
│        MongoDB           │       │       Python ML Service    │
│                          │       │                            │
│ Users                    │       │ Prediction                 │
│ Departments             │       │ Recommendation              │
│ Block Requests           │       │ Schedule Optimization      │
│ Blocks                   │       │                            │
│ Conflicts                │       │                            │
│ Schedules                │       │                            │
│ Notifications            │       │                            │
│ Audit Logs               │       │                            │
└──────────────────────────┘       └────────────────────────────┘
```

---

# 5. Architecture Principles

The implementation must follow these principles:

### 5.1 Modular Design

Authentication, block management, conflict detection, scheduling, notifications, and ML functionality must remain logically separated.

### 5.2 Role-Based Access

Every API and UI operation must be controlled according to the authenticated user's role.

### 5.3 Human-in-the-Loop

ML recommendations must assist the Control Officer rather than automatically making the final railway scheduling decision.

### 5.4 API-First Communication

The React frontend communicates with the backend through REST APIs. Business logic must remain in the backend rather than being duplicated in the frontend.

### 5.5 Data Traceability

Important actions such as creation, modification, approval, rejection, and rescheduling must be recorded.

### 5.6 Prototype Simplicity

The initial system should avoid unnecessary distributed infrastructure such as Kafka, Kubernetes, or complex microservice orchestration.

---

# 6. User Roles

## 6.1 Admin

Responsibilities:

- Manage users.
- Manage departments.
- Manage railway sections and master data.
- Configure system-level settings.
- View audit records.
- Monitor overall system activity.

## 6.2 Control Officer

Primary coordination role.

Responsibilities:

- View all block requests.
- Review departmental requests.
- Detect and resolve conflicts.
- Modify proposed schedules.
- Accept or reject requests.
- Review ML recommendations.
- Publish the final block plan.
- Monitor active and upcoming blocks.

## 6.3 Engineering

Responsibilities:

- Create track and civil maintenance requests.
- Provide section, date, duration, work type, and priority.
- Track request status.
- View approved schedules.
- Respond to scheduling changes.

## 6.4 Electrical

Responsibilities:

- Create electrical/OHE-related block requests.
- Specify required time and railway section.
- Track approval status.
- View coordinated schedules.

## 6.5 S&T

Responsibilities:

- Create signalling and telecommunication maintenance requests.
- Specify work requirements and timing.
- Track requests and final schedules.

---

# 7. Role-Based Dashboard Architecture

The application uses one React application with role-specific navigation and dashboard content.

```text
                         LOGIN
                           │
                           ▼
                  Authentication API
                           │
                           ▼
                       JWT Token
                           │
                           ▼
                         ROLE
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ENGINEERING         ELECTRICAL            S&T
        │                  │                  │
        ▼                  ▼                  ▼
 Department Dashboard / Request Management

                           │
                           ▼
                    CONTROL OFFICER
                           │
                           ▼
                  Central Control Dashboard

                           │
                           ▼
                         ADMIN
                           │
                           ▼
                    Admin Dashboard
```

The frontend must not rely solely on hidden UI elements for authorization. The backend must independently verify permissions.

---

# 8. Core Functional Modules

## 8.1 Authentication Module

Responsibilities:

- User login.
- Password verification.
- JWT token generation.
- Token validation.
- Session protection.
- Role identification.

### API examples

```text
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

---

## 8.2 User & Department Management

Responsibilities:

- Create users.
- Assign department.
- Assign role.
- Activate/deactivate users.
- Maintain department information.

---

## 8.3 Block Request Management

A department creates a block request containing:

```text
Request ID
Department
Requested By
Railway Section
Work Type
Work Description
Date
Start Time
End Time
Duration
Priority
Required Resources
Operational Constraints
Status
Created At
Updated At
```

### Request lifecycle

```text
DRAFT
  ↓
SUBMITTED
  ↓
UNDER_REVIEW
  ├───────────────┐
  ▼               ▼
CONFLICT        NO CONFLICT
  │               │
  ▼               ▼
RESOLUTION      APPROVAL
  │               │
  └───────┬───────┘
          ▼
      APPROVED
          │
          ▼
      SCHEDULED
          │
          ▼
       COMPLETED
```

Alternative terminal states:

```text
REJECTED
CANCELLED
```

---

# 9. Conflict Detection Architecture

Conflict detection is a backend business service.

### Basic conflict conditions

A conflict may occur when:

1. Two requests target the same railway section.
2. Their time windows overlap.
3. They require incompatible resources.
4. Operational restrictions prevent simultaneous execution.
5. A request violates an existing approved block constraint.

### Basic time-overlap rule

For two requests A and B:

```text
A.start < B.end
AND
B.start < A.end
```

If both requests apply to the same constrained section/resource, an overlap exists.

### Example

```text
Engineering
10:00 ───────────── 13:00
████████████████████

Electrical
11:00 ──────────────── 14:00
     ███████████████████

            ↓
       TIME CONFLICT
```

The conflict service creates a conflict record and exposes it to the Control Officer.

---

# 10. Scheduling Architecture

The scheduling module combines:

- Requested time windows.
- Railway section availability.
- Existing approved blocks.
- Department priority.
- Resource constraints.
- Operational restrictions.
- Conflict information.

### Scheduling flow

```text
Department Requests
        │
        ▼
Validation
        │
        ▼
Conflict Detection
        │
        ▼
Constraint Analysis
        │
        ▼
Candidate Time Windows
        │
        ▼
ML / Optimization Recommendation
        │
        ▼
Control Officer Review
        │
        ▼
Final Schedule
```

---

# 11. Intelligence / ML Architecture

ML is a separate service so that the core Node.js application remains independent of the ML implementation.

```text
                   Node.js Backend
                         │
                  REST / Internal API
                         │
                         ▼
                 Python ML Service
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
       Prediction              Recommendation
             │                       │
             └───────────┬───────────┘
                         ▼
                 Recommended Schedule
                         │
                         ▼
                  Control Officer
                         │
                  Human Decision
                         ▼
                  Final Schedule
```

## ML input data

Potential inputs:

- Historical block requests.
- Approved schedules.
- Actual block durations.
- Section information.
- Department.
- Work type.
- Priority.
- Time of day.
- Day/date.
- Previous conflicts.
- Operational constraints.

## ML output

The ML service may return:

```json
{
  "recommendedStartTime": "12:00",
  "recommendedEndTime": "14:00",
  "conflictScore": 0.08,
  "disruptionScore": 0.18,
  "confidence": 0.87,
  "reason": "Lower overlap with existing planned blocks"
}
```

The exact ML algorithm is intentionally not fixed at the architecture stage. It can be selected after sufficient historical/sample data is available.

---

# 12. Human-in-the-Loop Decision Model

The system must never represent an ML recommendation as an automatically approved railway block.

```text
ML Recommendation
        │
        ▼
Control Officer Review
        │
    ┌───┼───────────┐
    ▼   ▼           ▼
 Accept Modify     Reject
    │   │           │
    └───┼───────────┘
        ▼
 Final Decision
        │
        ▼
 Published Schedule
```

This provides accountability and makes the system suitable as a decision-support prototype.

---

# 13. Database Architecture

MongoDB is the primary data store.

## Collections

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

### Logical relationship

```text
User
 │
 ├──────── Department
 │
 └──────── BlockRequest
                 │
                 ├──────── RailwaySection
                 │
                 ├──────── Conflict
                 │
                 └──────── Schedule
                              │
                              └──── AuditLog
```

---

# 14. Main Data Entities

## User

```text
_id
name
email
passwordHash
role
departmentId
isActive
createdAt
updatedAt
```

## Department

```text
_id
name
code
description
isActive
createdAt
updatedAt
```

## Railway Section

```text
_id
sectionCode
name
division
startStation
endStation
status
createdAt
updatedAt
```

## Block Request

```text
_id
requestNumber
departmentId
requestedBy
sectionId
workType
description
date
startTime
endTime
priority
requiredResources
constraints
status
createdAt
updatedAt
```

## Conflict

```text
_id
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

## Schedule

```text
_id
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

## Audit Log

```text
_id
userId
action
entityType
entityId
previousValue
newValue
timestamp
```

---

# 15. Backend Architecture

The Node.js backend should use a layered structure.

```text
backend/
│
├── src/
│   ├── config/
│   │   └── db.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Department.js
│   │   ├── RailwaySection.js
│   │   ├── BlockRequest.js
│   │   ├── Block.js
│   │   ├── Conflict.js
│   │   ├── Schedule.js
│   │   ├── Notification.js
│   │   └── AuditLog.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── blockController.js
│   │   ├── conflictController.js
│   │   └── scheduleController.js
│   │
│   ├── services/
│   │   ├── conflictService.js
│   │   ├── schedulingService.js
│   │   ├── notificationService.js
│   │   └── auditService.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── blockRoutes.js
│   │   ├── conflictRoutes.js
│   │   └── scheduleRoutes.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   └── errorMiddleware.js
│   │
│   └── server.js
│
├── .env
├── package.json
└── package-lock.json
```

---

# 16. Frontend Architecture

```text
frontend/
│
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── StatCard.jsx
│   │   ├── BlockRequestCard.jsx
│   │   ├── ConflictAlert.jsx
│   │   └── ScheduleCalendar.jsx
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   │
│   │   ├── admin/
│   │   │   └── Dashboard.jsx
│   │   │
│   │   ├── control/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Requests.jsx
│   │   │   ├── Conflicts.jsx
│   │   │   └── Schedule.jsx
│   │   │
│   │   ├── engineering/
│   │   │   └── Dashboard.jsx
│   │   │
│   │   ├── electrical/
│   │   │   └── Dashboard.jsx
│   │   │
│   │   └── st/
│   │       └── Dashboard.jsx
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── routes/
│   │   └── AppRoutes.jsx
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
└── vite.config.js
```

---

# 17. API Architecture

The frontend communicates with Node.js using REST APIs.

## Authentication

```text
POST /api/auth/login
GET  /api/auth/me
```

## Block Requests

```text
POST   /api/block-requests
GET    /api/block-requests
GET    /api/block-requests/:id
PUT    /api/block-requests/:id
DELETE /api/block-requests/:id
```

## Control Actions

```text
POST /api/block-requests/:id/approve
POST /api/block-requests/:id/reject
POST /api/block-requests/:id/reschedule
```

## Conflicts

```text
GET  /api/conflicts
GET  /api/conflicts/:id
POST /api/conflicts/:id/resolve
```

## Schedule

```text
GET  /api/schedules
GET  /api/schedules/:id
POST /api/schedules/:id/publish
```

## ML

```text
POST /api/ml/recommendation
```

The Node backend acts as the main gateway between the frontend and the ML service.

---

# 18. End-to-End Request Flow

Example: Engineering submits a maintenance block.

```text
Engineering User
       │
       ▼
React Form
       │
       │ POST /api/block-requests
       ▼
Express API
       │
       ├── JWT Authentication
       │
       ├── Role Authorization
       │
       ├── Input Validation
       │
       ▼
Block Request Service
       │
       ├───────────────┐
       ▼               ▼
   MongoDB       Conflict Service
                       │
                       ▼
                Conflict Result
                       │
                       ▼
                 Scheduling
                       │
                       ▼
                  ML Service
                       │
                       ▼
                Recommendation
                       │
                       ▼
                Control Officer
                       │
                       ▼
                 Final Decision
                       │
                       ▼
                  MongoDB
                       │
                       ▼
                Notifications
                       │
                       ▼
                  Department
```

---

# 19. Notification Architecture

Notifications should be generated for important state changes.

Examples:

```text
Request Submitted
Request Under Review
Conflict Detected
Request Modified
Request Approved
Request Rejected
Schedule Published
Schedule Changed
Block Completed
```

Initial prototype implementation may use in-app notifications.

Future implementations may add:

- Email.
- SMS.
- Push notifications.

---

# 20. Audit & Traceability

Every important scheduling action should be recorded.

Example:

```text
Control Officer
     │
     ▼
Changed Engineering Request
     │
     ▼
Audit Log
     │
     ├── User
     ├── Action
     ├── Request ID
     ├── Previous Value
     ├── New Value
     └── Timestamp
```

This allows the system to answer:

- Who created the request?
- Who modified it?
- Who approved it?
- When was it approved?
- Why was it rescheduled?
- Which conflict was resolved?

---

# 21. Security Architecture

## Authentication

Use:

```text
Password
   ↓
bcrypt hashing
   ↓
Stored password hash
```

Never store plaintext passwords.

## Authorization

Use JWT-based authentication and role-based authorization.

```text
JWT
 │
 ├── userId
 ├── role
 └── expiry
```

Backend middleware verifies the token before protected operations.

## Security requirements

- Hash passwords.
- Validate request payloads.
- Protect private APIs.
- Enforce role permissions server-side.
- Store secrets in environment variables.
- Do not expose MongoDB credentials to React.
- Do not store sensitive secrets in source control.

---

# 22. Deployment Architecture

For the prototype:

```text
                   Internet
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
     React Frontend            Node Backend
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                      MongoDB                 ML Service
```

The exact cloud provider can be selected later.

Possible deployment categories:

```text
Frontend → Static hosting
Backend  → Node-compatible cloud server
Database → Managed MongoDB
ML       → Python-compatible service
```

---

# 23. Development Environment

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

## ML

```text
Python
FastAPI
scikit-learn
pandas
numpy
```

The ML stack is introduced after the core scheduling workflow is functional.

---

# 24. Non-Functional Requirements

## Performance

- Normal API requests should return quickly under prototype load.
- Dashboard data should load without unnecessary repeated requests.
- Conflict detection should execute automatically after relevant request changes.

## Reliability

- Backend errors must be handled centrally.
- Database failures must return meaningful API responses.
- Important state transitions must not silently fail.

## Scalability

The architecture should allow future expansion to:

- More divisions.
- More departments.
- Larger request volumes.
- More railway sections.
- Additional optimization algorithms.

## Maintainability

Business logic should be separated from controllers and database models.

## Usability

The interface should prioritize:

- Clear status indicators.
- Simple request forms.
- Easy conflict identification.
- Calendar/timeline-based schedule visualization.
- Role-specific information.

---

# 25. MVP Scope

The first working prototype should contain:

### Must Have

- Login.
- Role-based access.
- Department dashboards.
- Block request creation.
- Block request listing.
- Request status workflow.
- Conflict detection.
- Control Officer dashboard.
- Approve/reject/reschedule.
- Final schedule.
- Notifications.
- Audit history.

### Intelligence Layer

- Basic historical data storage.
- ML/optimization service interface.
- Schedule recommendation.
- Recommendation explanation.
- Human approval of recommendations.

### Optional Later

- Advanced prediction.
- Advanced optimization.
- External railway data integration.
- Email/SMS notifications.
- Mobile application.
- GIS/map integration.
- Real-time operational feeds.

---

# 26. Development Sequence

Development must follow this order:

```text
1. Architecture
       ↓
2. Database / ER Design
       ↓
3. Project Setup
       ↓
4. MongoDB Connection
       ↓
5. Authentication
       ↓
6. Role-Based Authorization
       ↓
7. User & Department Management
       ↓
8. Block Request CRUD
       ↓
9. Conflict Detection
       ↓
10. Control Dashboard
       ↓
11. Scheduling Workflow
       ↓
12. Notifications & Audit
       ↓
13. ML Service
       ↓
14. ML Recommendation
       ↓
15. Testing
       ↓
16. Deployment
```

---

# 27. Architecture Decision Summary

| Decision | Selected Approach |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MongoDB |
| Database ODM | Mongoose |
| Authentication | JWT |
| Password Security | bcrypt |
| API Style | REST |
| ML Service | Python + FastAPI |
| ML Integration | Backend-to-ML API |
| Authorization | Role-Based Access Control |
| Scheduling Authority | Control Officer |
| ML Role | Decision Support |
| Notifications | In-app initially |
| Architecture | Modular 4-layer |
| Deployment | Cloud-ready |

---

# 28. Final Architecture

```text
                         ┌───────────────────────┐
                         │        USERS          │
                         │                       │
                         │ Admin                 │
                         │ Control Officer       │
                         │ Engineering           │
                         │ Electrical            │
                         │ S&T                   │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │    REACT FRONTEND     │
                         │                       │
                         │ Authentication        │
                         │ Role Dashboards       │
                         │ Requests              │
                         │ Conflicts             │
                         │ Schedule              │
                         │ Notifications         │
                         │ Recommendations       │
                         └───────────┬───────────┘
                                     │
                                  REST API
                                     │
                                     ▼
                 ┌─────────────────────────────────────┐
                 │         NODE + EXPRESS BACKEND      │
                 │                                     │
                 │ Auth & RBAC                         │
                 │ Block Management                    │
                 │ Conflict Detection                  │
                 │ Scheduling                          │
                 │ Notifications                       │
                 │ Audit                                │
                 └──────────────┬──────────────┬───────┘
                                │              │
                                ▼              ▼
                     ┌─────────────────┐   ┌───────────────┐
                     │     MONGODB     │   │  ML SERVICE   │
                     │                 │   │    Python     │
                     │ Users           │   │               │
                     │ Departments     │   │ Prediction    │
                     │ Requests        │   │ Optimization  │
                     │ Conflicts       │   │ Recommendation│
                     │ Schedules       │   └───────┬───────┘
                     │ Audit Logs      │           │
                     └─────────────────┘           │
                                                   │
                                                   ▼
                                         ┌──────────────────┐
                                         │ AI RECOMMENDATION│
                                         └────────┬─────────┘
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │ CONTROL OFFICER  │
                                         │ Human Decision   │
                                         └────────┬─────────┘
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │ FINAL BLOCK PLAN │
                                         └──────────────────┘
```

---

## 29. Architecture Success Criteria

The architecture is considered successfully implemented when:

- Each authorized role can log in.
- Each role receives an appropriate dashboard.
- Departments can submit block requests.
- Requests are persisted in MongoDB.
- Backend authorization prevents unauthorized operations.
- Overlapping requests can be detected.
- Control Officers can resolve conflicts.
- Final schedules can be published.
- Users can see schedule changes.
- Important actions are auditable.
- ML recommendations can be requested through a defined service interface.
- ML recommendations require human review before becoming final schedules.

---

**Document End**
