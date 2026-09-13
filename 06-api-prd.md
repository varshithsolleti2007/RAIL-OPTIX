# API Contract PRD — Railway Block Planning System

## 1. General
Base URL:
```text
/api
```

All protected endpoints require:
```text
Authorization: Bearer <JWT>
```

## 2. Standard Success Response
```json
{
  "success": true,
  "message": "Request successful",
  "data": {}
}
```

## 3. Authentication

### Login
`POST /auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Response includes authenticated user and token.

### Current User
`GET /auth/me`

## 4. Block Request

### Create
`POST /block-requests`

### List
`GET /block-requests`

Query filters:
```text
status
department
section
date
priority
page
limit
search
```

### Detail
`GET /block-requests/:id`

### Update
`PUT /block-requests/:id`

### Submit
`POST /block-requests/:id/submit`

### Approve
`POST /block-requests/:id/approve`

### Reject
`POST /block-requests/:id/reject`

### Reschedule
`POST /block-requests/:id/reschedule`

## 5. Conflicts

`GET /conflicts`

`GET /conflicts/:id`

`POST /conflicts/:id/resolve`

## 6. Schedules

`GET /schedules`

`GET /schedules/:id`

`POST /schedules/:id/publish`

## 7. Notifications

`GET /notifications`

`PATCH /notifications/:id/read`

## 8. Admin

```text
GET/POST/PUT /users
GET/POST/PUT /departments
GET/POST/PUT /railway-sections
GET /audit-logs
```

## 9. ML

Node backend exposes:
`POST /ml/recommendation`

Node validates/authenticates the request and calls the internal Python service.

## 10. Error Codes
Use stable codes:
```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
INVALID_STATE
ML_UNAVAILABLE
INTERNAL_ERROR
```
