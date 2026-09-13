# Security PRD — Railway Block Planning System

## 1. Authentication
- Passwords hashed using bcrypt.
- JWT for authenticated API access.
- Tokens have expiry.
- Protected routes require valid authentication.

## 2. Authorization
RBAC must be enforced on the backend.

```text
ADMIN
CONTROL_OFFICER
ENGINEERING
ELECTRICAL
ST
```

A department user must not access another department's restricted management actions.

## 3. Input Security
- Validate all request bodies.
- Validate query parameters.
- Sanitize data where appropriate.
- Reject malformed IDs.
- Restrict allowed enum values.
- Apply request size limits.

## 4. Secrets
Store:
```text
MONGODB_URI
JWT_SECRET
ML_SERVICE_URL
```
in environment variables.

Never commit `.env` to source control.

## 5. API Security
- CORS restricted to trusted frontend origins in production.
- Rate limiting for authentication endpoints.
- Generic authentication errors.
- Centralized error handling.
- No stack traces in production.

## 6. Data Security
- Minimum necessary data.
- Audit sensitive administrative actions.
- Database credentials never exposed to browser.
- Use TLS/HTTPS in deployment.

## 7. Acceptance Criteria
Unauthorized users cannot perform protected actions even if they manually call APIs. Sensitive credentials never appear in frontend bundles or API responses.
