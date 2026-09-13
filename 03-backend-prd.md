# Backend PRD — Railway Block Planning System

## 1. Technology
- Node.js
- Express.js
- Mongoose
- MongoDB
- JWT
- bcryptjs
- dotenv
- CORS
- Central error middleware

## 2. Architecture

```text
Routes
  ↓
Middleware
  ↓
Controllers
  ↓
Services
  ↓
Models / MongoDB

Services also communicate with:
- ML service
- Notification mechanism
```

## 3. Backend Modules
- Auth
- Users
- Departments
- Railway sections
- Block requests
- Conflict detection
- Scheduling
- Notifications
- Audit
- ML gateway

## 4. API Conventions
Base path:
`/api`

Authentication:
```text
POST /api/auth/login
GET  /api/auth/me
```

Requests:
```text
POST   /api/block-requests
GET    /api/block-requests
GET    /api/block-requests/:id
PUT    /api/block-requests/:id
DELETE /api/block-requests/:id
POST   /api/block-requests/:id/submit
POST   /api/block-requests/:id/approve
POST   /api/block-requests/:id/reject
POST   /api/block-requests/:id/reschedule
```

Conflicts:
```text
GET  /api/conflicts
GET  /api/conflicts/:id
POST /api/conflicts/:id/resolve
```

Schedules:
```text
GET  /api/schedules
GET  /api/schedules/:id
POST /api/schedules/:id/publish
```

ML:
```text
POST /api/ml/recommendation
```

## 5. Authorization
JWT middleware validates identity. Role middleware checks permissions.

Example:
```text
ENGINEERING → create own departmental requests
ELECTRICAL   → create own departmental requests
S&T          → create own departmental requests
CONTROL      → review and finalize
ADMIN        → system administration
```

Every protected operation must be checked on the server.

## 6. Validation
Validate:
- Required fields
- Date/time
- Section ID
- Priority
- Work type
- Resources
- State transitions
- Ownership/department

Reject invalid transitions.

## 7. Conflict Service
For candidate request A and existing request B:
```text
same constrained section/resource
AND
A.start < B.end
AND
B.start < A.end
```
Then create/update a conflict record according to business rules.

## 8. Scheduling Service
Inputs:
- Requests
- Existing approved schedules
- Section availability
- Resource constraints
- Priorities
- Conflicts
- Operational constraints

Outputs:
- Feasible candidate windows
- Schedule changes
- Recommendation input for ML

## 9. Audit Service
Log important mutations:
- create
- submit
- modify
- approve
- reject
- reschedule
- publish
- resolve conflict
- cancel
- complete

## 10. Error Handling
Use consistent response shape:

```json
{
  "success": false,
  "message": "Human-readable message",
  "code": "VALIDATION_ERROR",
  "data": null
}
```

Never expose stack traces or secrets to clients.

## 11. Backend Acceptance Criteria
- Server starts with environment configuration.
- MongoDB connection is reliable.
- Protected endpoints reject missing/invalid JWTs.
- Role restrictions work independently of frontend.
- Requests and state transitions persist correctly.
- Conflicts are generated consistently.
- Audit entries exist for important actions.
