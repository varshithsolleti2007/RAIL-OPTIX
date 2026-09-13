# Database PRD — Railway Block Planning System

## 1. Database
MongoDB with Mongoose.

## 2. Collections

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

## 3. User
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

## 4. Department
```text
_id
name
code
description
isActive
createdAt
updatedAt
```

## 5. RailwaySection
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

## 6. BlockRequest
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
requiredResources[]
constraints[]
status
createdAt
updatedAt
```

## 7. Conflict
```text
_id
requestIds[]
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

## 8. Schedule
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

## 9. Notification
```text
_id
recipientId
type
title
message
relatedEntityId
isRead
createdAt
```

## 10. AuditLog
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

## 11. Relationships

```text
User ──→ Department
User ──→ BlockRequest
Department ──→ BlockRequest
RailwaySection ──→ BlockRequest
BlockRequest ──→ Conflict
BlockRequest ──→ Schedule
User ──→ Notification
User ──→ AuditLog
```

## 12. Indexing
Create indexes for frequently queried fields:
- user email
- request number
- request status
- department
- section
- date
- conflict status
- schedule date/section

Compound indexes should be added after observing actual query patterns.

## 13. Data Rules
- Use references for entities that need independent lifecycle.
- Keep immutable audit records.
- Do not store plaintext passwords.
- Use timestamps.
- Validate enum-like fields at schema and service level.

## 14. Database Acceptance Criteria
All core workflows can be persisted and queried without duplicating authoritative state across unrelated collections.
