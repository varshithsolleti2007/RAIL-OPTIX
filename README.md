# Railway Block Planning & Coordination System

Smart India Hackathon 2026 project. See `CLAUDE_CODE_PROJECT_CONTEXT.md` for
the full problem statement, architecture, and development order.

## Repository Structure

```text
frontend/   React + Vite + Tailwind + React Router + Axios + Recharts
backend/    Node + Express + Mongoose + JWT (main application backend)
ml/         Python + FastAPI + scikit-learn + OR-Tools (Intelligence Service)
```

Each folder has its own README/setup below. See each folder's `.env.example`
for required configuration.

### frontend

```bash
cd frontend
npm install
npm run dev
```

### backend

```bash
cd backend
npm install
cp .env.example .env   # then set MONGODB_URI and JWT_SECRET
npm run seed:admin      # bootstraps the first admin user
npm run dev
```

### ml

```bash
cd ml
python -m venv .venv
./.venv/Scripts/pip install -r requirements.txt   # Windows
uvicorn app.main:app --reload --port 8000
```

## PRD Set

This repo also contains the development PRDs for the SIH Railway Block Planning & Coordination System.

## Documents
1. `01-application-prd.md` — complete product and end-to-end application flow
2. `02-frontend-prd.md` — React frontend requirements
3. `03-backend-prd.md` — Node/Express backend requirements
4. `04-database-prd.md` — MongoDB data model and database requirements
5. `05-ml-prd.md` — ML/recommendation service requirements
6. `06-api-prd.md` — API contracts
7. `07-security-prd.md` — authentication, authorization and security
8. `08-testing-prd.md` — testing and acceptance scenarios
9. `09-deployment-ops-prd.md` — deployment and operations
10. `10-development-roadmap-prd.md` — implementation sequence

## Source Architecture
The existing architecture PRD should be treated as the high-level architecture baseline. These PRDs decompose it into implementation-ready specifications.

## Important Design Decision
ML is a decision-support layer. It must never silently replace the Control Officer's final scheduling authority.
