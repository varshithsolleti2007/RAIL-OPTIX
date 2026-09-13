# Deployment & Operations PRD

## 1. Target Architecture

```text
Browser
  ↓ HTTPS
Frontend Hosting
  ↓ HTTPS
Node/Express API
  ├── MongoDB
  └── Python ML Service
```

## 2. Environments
Maintain separate:
- Development
- Demo/Staging
- Production (future)

## 3. Environment Variables

Frontend:
```text
VITE_API_BASE_URL
```

Backend:
```text
PORT
MONGODB_URI
JWT_SECRET
ML_SERVICE_URL
CLIENT_URL
```

ML:
```text
MODEL_PATH
PORT
```

## 4. Logging
Log:
- Server errors
- Authentication failures
- Important state changes
- ML request failures
- Database connection events

Do not log passwords, JWT secrets or unnecessary sensitive information.

## 5. Backups
Managed database backups should be enabled for any non-demo deployment.

## 6. Health Checks
Backend:
`GET /health`

ML:
`GET /health`

Health endpoints should report service availability without exposing secrets.

## 7. Deployment Acceptance Criteria
- Frontend can reach backend.
- Backend can reach MongoDB.
- Backend can reach ML service when enabled.
- Environment secrets are configured outside source code.
- Health checks work.
- Core end-to-end flow works after deployment.
