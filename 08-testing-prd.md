# Testing PRD — Railway Block Planning System

## 1. Testing Layers

```text
Unit Tests
   ↓
API / Integration Tests
   ↓
Frontend Component Tests
   ↓
End-to-End Tests
   ↓
Security / Permission Tests
   ↓
ML Evaluation
```

## 2. Critical Unit Tests
- Time overlap detection.
- Status transition validation.
- Role permission checks.
- Request validation.
- Schedule constraint checks.

## 3. API Tests
Test:
- Login success/failure.
- Protected endpoints.
- Role restrictions.
- CRUD.
- Approval/rejection.
- Conflict resolution.
- Schedule publication.

## 4. End-to-End Scenarios

### Scenario A — Normal Request
```text
Engineering login
→ create request
→ submit
→ no conflict
→ Control review
→ approve
→ publish
→ Engineering sees schedule
```

### Scenario B — Conflict
```text
Engineering request
+
Electrical overlapping request
→ conflict detected
→ Control sees conflict
→ reschedule one request
→ conflict cleared
→ approve
→ publish
```

### Scenario C — Unauthorized Action
```text
Engineering user
→ attempts Control approval API
→ backend returns 403
```

### Scenario D — ML Failure
```text
Request
→ ML unavailable
→ deterministic scheduling continues
→ UI shows recommendation unavailable
```

## 5. Acceptance Threshold
No critical security, authorization, data-integrity or core workflow defects may remain in the demo build.
