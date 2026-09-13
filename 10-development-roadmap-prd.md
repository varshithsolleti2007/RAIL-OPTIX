# Development Roadmap PRD

## Phase 1 — Foundation
- Create repository.
- Create React/Vite frontend.
- Create Node/Express backend.
- Configure MongoDB.
- Establish environment variables.
- Establish API client.

## Phase 2 — Authentication
- User schema.
- Login.
- Password hashing.
- JWT.
- Auth middleware.
- Role middleware.
- Protected frontend routes.

## Phase 3 — Master Data
- Departments.
- Users.
- Railway sections.
- Work types.
- Priorities.

## Phase 4 — Block Requests
- Request schema.
- Create/edit/save draft.
- Submit.
- List/detail.
- Status management.

## Phase 5 — Conflict Engine
- Time overlap.
- Section conflict.
- Resource conflict.
- Conflict records.
- Conflict UI.

## Phase 6 — Control Center
- Unified request queue.
- Conflict dashboard.
- Approve/reject/reschedule.
- Schedule timeline.
- Publish final plan.

## Phase 7 — Notifications & Audit
- Notification records.
- In-app notification UI.
- Audit logs.
- History view.

## Phase 8 — ML
- Prepare historical/sample dataset.
- Build baseline model.
- Evaluate.
- Expose FastAPI endpoint.
- Connect Node gateway.
- Show recommendation UI.
- Add fallback.

## Phase 9 — Testing
- Unit.
- Integration.
- E2E.
- Security.
- ML evaluation.

## Phase 10 — Demo & Deployment
- Seed realistic demo data.
- Deploy.
- Test all roles.
- Prepare SIH demo scenario.
- Prepare architecture explanation.

## Recommended build order

```text
Database
  ↓
Backend
  ↓
Authentication
  ↓
Requests
  ↓
Conflict Engine
  ↓
Control Dashboard
  ↓
Scheduling
  ↓
Frontend polish
  ↓
Notifications/Audit
  ↓
ML
  ↓
Testing
  ↓
Deployment
```

Do not start ML before the deterministic core workflow works.
