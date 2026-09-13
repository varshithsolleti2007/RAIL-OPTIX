from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["Intelligence Service"])


@router.get("/health")
def health_check():
    return {"status": "healthy"}


# Not yet implemented - see CLAUDE_CODE_PROJECT_CONTEXT.md §43 for the
# target Intelligence Service contract. The previous CSV-based prototype
# (risk model, priority scoring, MILP optimizer, simulation, recovery)
# was removed and is being rebuilt clean, module by module, rather than
# ported as-is. Each endpoint below is added only once its underlying
# logic actually exists:
#
#   POST /api/risk/predict
#   POST /api/priority/score
#   POST /api/schedule/recommend
#   POST /api/schedule/optimize
#   POST /api/simulate
#   POST /api/recovery/recommend
#   GET  /api/metrics
