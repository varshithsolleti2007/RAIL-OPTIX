# Backend/ML Audit & Remediation Plan

**Scope:** `backend/app/` (the only backend code that exists in this repo)
**Date:** 2026-09-14
**Auditor:** Claude Code (static read-through, no execution)

---

## 1. Executive Summary

The repo contains a **Python/FastAPI + pandas + OR-Tools pipeline**, not the Node.js/Express/MongoDB backend described in `03-backend-prd.md`, `04-database-prd.md`, and `05-ml-prd.md`. The PRDs describe a request/approval/conflict/JWT system with a MongoDB-backed Node API and an ML microservice behind it. What actually exists is a **synthetic-data batch pipeline**: generate CSVs → train a risk model → score priority → optimize a plan with a solver → simulate execution/failure → compute a recovery plan → serve the resulting CSVs over a handful of read-only FastAPI GET endpoints.

The pipeline logic itself (optimizer, simulator, recovery, validator) is reasonably well-structured and internally consistent. The problems are: **no persistence layer, no auth, no tests, no dependency manifest, broken/inconsistent imports in the bundling code path, and a wide gap between the PRDs and the implementation.**

**Status at a glance:**

| Area | Status |
|---|---|
| Synthetic data generation | ✅ Working (5 CSV generators) |
| Risk ML model (RandomForest) | ✅ Working, trained artifact present |
| Priority scoring | ✅ Working |
| Block optimization (OR-Tools/SCIP) | ✅ Working |
| Sequential + failure simulation | ✅ Working |
| Recovery re-planning | ✅ Working |
| Bundle/combination analysis | ⚠️ Present but broken imports; not wired into API |
| FastAPI serving layer | ⚠️ Read-only CSV passthrough only, no write endpoints |
| Auth / roles / JWT | ❌ Not implemented |
| Database (MongoDB or any) | ❌ Not implemented — everything is CSV files on disk |
| Node.js/Express layer from PRD | ❌ Does not exist |
| Tests | ❌ None found anywhere in repo |
| Dependency manifest (requirements.txt/pyproject) | ❌ Missing |
| `__init__.py` package markers | ⚠️ All misnamed `_init_.py` (single underscore) |
| CI / deployment config | ❌ Not implemented |

---

## 2. What Exists (Module-by-Module)

```
backend/app/
├── main.py                  FastAPI app, mounts one router
├── api/routes.py             8 GET endpoints, all read CSVs from disk
├── data/                     synthetic CSV generators + generated CSVs
├── ml/                        risk_prediction.py (train), predict_risk.py (score)
├── optimization/              basic_optimizer.py (OR-Tools), recovery_optimizer.py
├── simulation/                sequential_simulator.py, block_failure_simulation.py
├── services/                  data_loader, priority_scoring, bundle_*, plan_metrics, inspect_data
├── schemas/models.py         Pydantic models — defined but not used by routes.py
└── validation/schema_validator.py   column normalization + validation, used by loaders
```

### Pipeline flow (as actually wired, in run order)
1. `data/*.py` → generates `maintenance_tasks.csv`, `block_windows.csv`, `train_movements.csv`, `goods_forecasts.csv`, `resources.csv`
2. `ml/risk_prediction.py` → trains `RandomForestClassifier`, saves `saved_models/maintenance_risk_model.joblib`
3. `ml/predict_risk.py` → scores tasks → `maintenance_tasks_with_risk.csv`
4. `services/priority_scoring.py` → weights risk + overdue + criticality → `prioritized_tasks.csv`
5. `optimization/basic_optimizer.py` → OR-Tools SCIP solver assigns tasks to blocks → `optimized_plan.csv`
6. `simulation/sequential_simulator.py` → simulates in-block execution timing → `simulation_results.csv`
7. `simulation/block_failure_simulation.py` → simulates one block failing → `simulation_results_block_failure.csv`
8. `optimization/recovery_optimizer.py` → reassigns affected tasks to compatible blocks → `recovery_plan.csv`
9. `api/routes.py` → exposes each CSV as a JSON GET endpoint, plus `/plan-metrics`

This is a coherent, **linear, file-driven batch pipeline**. Each stage reads the previous stage's CSV output and writes its own. There is no orchestration script that runs all 8 steps in order — a user has to run each `python -m app.xxx.yyy` manually in sequence.

### Risk ML model (`ml/`)
- `risk_prediction.py`: synthetic rule-based label (`risk_points >= 3` from condition score, overdue days, failure count, safety criticality) → trains RandomForest with OneHot + passthrough pipeline → saves joblib.
- `predict_risk.py`: loads the joblib, scores `maintenance_tasks.csv`, writes probabilities/levels.
- Honest docstring admits the label is "not an official railway risk standard" — good, matches the PRD's "ML is advisory" principle.
- No model versioning, no evaluation report persisted (classification_report only printed to stdout, never saved), no retraining trigger.

### Optimization (`optimization/`)
- `basic_optimizer.py`: real MILP via OR-Tools SCIP. Constraints: 1 task→≤1 block, block duration capacity, incompatible-task exclusion pairs. Objective: maximize priority-weighted assignment. This is legitimate optimization work, not a stub.
- `recovery_optimizer.py`: greedy re-assignment of tasks orphaned by a failed block, ranked by priority/remaining capacity/date. Reasonable heuristic, not a solver, but appropriate for a recovery pass.
- Both files independently redefine `SECTION_MAP`/`TASK_TO_BLOCK_SECTION`/normalization helpers that already exist in `validation/schema_validator.py` and `services/bundle_utils.py` — three parallel copies of the same corridor/section-normalization logic with slightly different implementations.

### Simulation (`simulation/`)
- `sequential_simulator.py`: walks each block's tasks in start-time order, detects delay/overflow/exceeds-block-end conditions.
- `block_failure_simulation.py`: reuses `prepare_plan` from the sequential simulator, marks one block "Blocked", propagates `replanning_required`.
- Straightforward, deterministic, no ML involved — matches PRD's "deterministic engine first" recommendation.

### Services (`services/`)
- `data_loader.py` + `validation/schema_validator.py`: solid — column alias normalization, type coercion, required/optional column checks, per-dataset validators. This is the best-engineered file in the codebase.
- `priority_scoring.py`, `plan_metrics.py`, `inspect_data.py`: small, working, single-purpose scripts.
- `bundle_analysis.py`, `bundle_candidates.py`, `bundle_utils.py`: **broken/inconsistent** (see Findings §3). Not referenced by `api/routes.py`, `main.py`, or any other module — dead code path, though `bundle_candidates.csv` output already exists in `data/` from a manual run.

### API layer (`api/routes.py`)
- 8 endpoints, all `GET`, all just `pd.read_csv` → JSON. No `POST /recommend` (the PRD's core ML contract), no request/approval endpoints, no auth, no pagination, no filtering.
- `schemas/models.py` defines a full Pydantic domain model (`Asset`, `MaintenanceTask`, `RiskPrediction`, `OptimizedPlan`, etc.) that **routes.py never imports or uses** — response shapes are whatever `pandas.to_dict()` produces, unvalidated.

---

## 3. Findings

### Correctness / will actually break
1. **`services/bundle_analysis.py:5`** — `from resource_utils import parse_required_resources` is a bare same-directory import. This only works if the script is run with its own folder on `sys.path` (e.g., `python bundle_analysis.py` from inside `services/`). It will `ModuleNotFoundError` if imported as `app.services.bundle_analysis` or run via `python -m`.
2. **`services/bundle_candidates.py:6-11`** and **`services/bundle_utils.py:5`** — import via `from backend.app.services...` (repo-root-relative), while every other module in the codebase (`optimization/*.py`, `simulation/*.py`, `main.py`) imports via `from app....` (backend-dir-relative, matching how `uvicorn app.main:app` is presumably run from inside `backend/`). These two conventions are mutually incompatible in the same process — whichever way you set `sys.path`/cwd to satisfy one, the other breaks.
3. **Duplicate task loop in `bundle_candidates.py:138-139`** — `print("Bundle candidate generation completed.")` is printed twice; cosmetic but signals no code review pass happened on this file.
4. All `__init__.py` files across `api/`, `ml/`, `optimization/`, `schemas/`, `services/`, `validation/`, and `app/` itself are actually named **`_init_.py`** (single underscores). Python 3 namespace packages mean imports still resolve without any `__init__.py`, so this hasn't broken anything yet — but it means these files do nothing, package-level `__init__` code (if ever added) will silently not run, and it reads as an unintentional typo/rename rather than a deliberate namespace-package choice.

### Architecture mismatch vs. PRDs
5. `03-backend-prd.md` specifies Node.js + Express + Mongoose + MongoDB + JWT; the actual backend is Python + FastAPI + pandas CSVs. `05-ml-prd.md`'s architecture diagram (`MongoDB → ... → Python FastAPI Service → Node.js ML Gateway → React UI`) assumes the Python service sits *behind* a Node gateway that doesn't exist.
6. `05-ml-prd.md §6` specifies `POST /recommend` as the ML contract with conflict/disruption/confidence scores per candidate window. The implemented API has no `/recommend` endpoint at all — it only exposes pre-computed batch CSV outputs.
7. No database anywhere. `04-database-prd.md`'s MongoDB schema has no counterpart; all state is flat files in `backend/app/data/`, regenerated by re-running scripts, with no persistence guarantees, concurrency handling, or audit trail (`03-backend-prd.md §9` requires an audit log — none exists).
8. No auth/roles anywhere (`07-security-prd.md`), so every acceptance criterion in that PRD ("Protected endpoints reject missing/invalid JWTs", "Role restrictions work") is unmet by construction — there's no middleware layer at all.

### Process / hygiene gaps
9. **No dependency manifest** (`requirements.txt`, `pyproject.toml`, `Pipfile`) anywhere in the repo, despite depending on `fastapi`, `pandas`, `scikit-learn`, `joblib`, `ortools`, and presumably `uvicorn`. Anyone cloning this cannot install a matching environment.
10. **No tests** anywhere in the repo (`08-testing-prd.md` describes acceptance scenarios that have zero automated coverage).
11. **No orchestration/entrypoint** ties the 8-stage pipeline together — a new developer has to read the source to discover the run order (data gen → train → predict → prioritize → optimize → simulate → simulate-failure → recover).
12. Three separate hand-rolled copies of corridor/section/block-type normalization logic (`optimization/basic_optimizer.py`, `optimization/recovery_optimizer.py`, `services/bundle_utils.py`, and again in `validation/schema_validator.py`) — a change to the section-mapping table (`SEC_A_B → S01`, etc.) has to be made in 4 places today.
13. `schemas/models.py` is fully written but completely unused — either the API layer should validate through it, or it should be removed/marked as a future-work stub so it doesn't mislead readers into thinking responses are validated.
14. Model training (`ml/risk_prediction.py`) has no persisted evaluation metrics or model version string, despite `05-ml-prd.md §10` requiring "Model version is recorded."

---

## 4. Remediation Plan

Ordered by leverage (fix cheap/high-impact things first), not by PRD section number.

### Phase 0 — Make the repo runnable by someone else (~1 day)
- [ ] Add `backend/requirements.txt` (or `pyproject.toml`) pinning `fastapi`, `uvicorn`, `pandas`, `scikit-learn`, `joblib`, `ortools`.
- [ ] Rename every `_init_.py` → `__init__.py` (7 files: `app/`, `app/api/`, `app/ml/`, `app/optimization/`, `app/schemas/`, `app/services/`, `app/validation/`).
- [ ] Add one root-cause fix for imports: standardize every module in `backend/app/**` on the `app.*`-relative style (matching `main.py`, `optimization/*`, `simulation/*`) and delete the `backend.app.*` variant in `bundle_candidates.py`/`bundle_utils.py`, and fix the bare import in `bundle_analysis.py`.
- [ ] Add a single `backend/app/pipeline.py` (or a `Makefile`/shell script) that runs all 8 stages in order, so the pipeline is a one-command operation instead of tribal knowledge.

### Phase 1 — Consolidate duplicated logic (~0.5 day)
- [ ] Move `SECTION_MAP`, corridor/block-type normalization into one shared module (`validation/schema_validator.py` already has the most complete version) and have `optimization/basic_optimizer.py`, `optimization/recovery_optimizer.py`, and `services/bundle_utils.py` import from it instead of redefining it.
- [ ] Decide the fate of `services/bundle_*.py`: either wire it into the pipeline (it looks like a legitimate "combine same-corridor tasks into one block" feature that nothing currently calls) and expose it via an API route, or delete it if superseded by `basic_optimizer.py`'s own compatibility constraints. Right now it's neither integrated nor removed.

### Phase 2 — Close the ML PRD gap (~2-3 days)
- [ ] Implement `POST /api/ml/recommendation` (or `/recommend` per `05-ml-prd.md §6`) that takes a candidate block request and returns ranked window recommendations with conflict/disruption/confidence scores + a human-readable `reason` — this is the actual PRD-defined contract, and today's API only serves pre-baked batch CSVs.
- [ ] Persist model evaluation (`classification_report` output) and a `model_version` string alongside the joblib file (e.g. `saved_models/maintenance_risk_model.v1.json` metadata sidecar), so `/plan-metrics`-style endpoints can report it per `05-ml-prd.md §10`.
- [ ] Wire `schemas/models.py` into `api/routes.py` as `response_model=...` on each endpoint, or delete the file — right now it's undead code that implies validation that doesn't happen.

### Phase 3 — Decide the real backend architecture (~decision + follow-on work)
The PRDs and the code have diverged enough that this needs an explicit decision, not just more code:
- [ ] **Option A:** Update `03-backend-prd.md`/`04-database-prd.md`/`05-ml-prd.md` to reflect reality — a Python/FastAPI service is the backend, no separate Node gateway, and CSV/pandas is an accepted interim store.
- [ ] **Option B:** Build the Node/Express/Mongo layer the PRDs describe, with this FastAPI app demoted to an internal "ML/optimization microservice" behind it, matching the original architecture diagram.
- [ ] Either way: add persistence (SQLite/Postgres/Mongo) so `optimized_plan.csv`, `recovery_plan.csv`, etc. aren't the source of truth — re-running any pipeline stage currently clobbers the previous output with no history/audit trail.
- [ ] Add the auth/role layer from `07-security-prd.md` once the architecture decision is made (no point building JWT middleware for a service that might be replaced/relegated).

### Phase 4 — Testing (~ongoing, start immediately alongside Phase 0)
- [ ] Unit tests for `validation/schema_validator.py` (pure functions, highest value per test written).
- [ ] Unit tests for `optimization/basic_optimizer.py`'s compatibility rules (`tasks_are_compatible`, `times_overlap`) and `recovery_optimizer.py`'s `is_compatible` — these encode real business rules and have zero coverage today.
- [ ] A smoke test that runs the full 8-stage pipeline end-to-end on the checked-in synthetic data and asserts each output CSV is non-empty with expected columns.
- [ ] API tests for the 8 existing endpoints (`TestClient` from FastAPI, trivial to add, currently zero coverage).

---

## 5. Suggested Immediate Next Step

Given everything above, the highest-leverage single next action is **Phase 0** — it's cheap, unblocks everyone else, and fixes the one item (`bundle_analysis.py`'s import) that is an actual latent bug rather than a gap. Say the word and I'll implement Phase 0 directly.
