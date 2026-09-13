# ML & Optimization PRD — Railway Block Planning System

## 1. Purpose
Provide decision-support recommendations for selecting feasible maintenance block windows while considering conflicts, disruption and historical patterns.

ML is advisory. The Control Officer makes the final decision.

## 2. ML Architecture

```text
MongoDB / Backend Data
        ↓
Data Preparation
        ↓
Feature Engineering
        ↓
Training / Validation
        ↓
Trained Model
        ↓
Python FastAPI Service
        ↓
Node.js ML Gateway
        ↓
React Recommendation UI
        ↓
Control Officer
```

## 3. Candidate Inputs
- Department
- Work type
- Section
- Requested date
- Requested start/end
- Duration
- Priority
- Historical duration
- Historical conflicts
- Existing schedules
- Section constraints
- Resource requirements
- Time/day features

## 4. Recommended ML Strategy

Do not begin with a complex deep-learning model.

Start with a deterministic scheduling/conflict engine and add ML where data supports it.

Possible stages:
1. Historical duration prediction.
2. Candidate-window ranking.
3. Disruption/conflict score.
4. Optimization/ranking of feasible windows.

Suitable initial models may include:
- Random Forest / Gradient Boosting for tabular prediction.
- Regression for duration estimation.
- Ranking/scoring model for candidate windows.

Final algorithm must be selected after inspecting available training data.

## 5. Feature Pipeline

```text
Raw Records
  ↓
Clean missing/invalid values
  ↓
Normalize timestamps/categories
  ↓
Generate features
  ↓
Train/validation split
  ↓
Model training
  ↓
Evaluation
  ↓
Versioned model
```

Avoid data leakage: features used at prediction time must also have been available at that time.

## 6. ML API

```text
POST /recommend
```

Input:
```json
{
  "requestId": "...",
  "sectionId": "...",
  "date": "2026-09-18",
  "requestedStart": "10:00",
  "requestedEnd": "13:00",
  "priority": "HIGH"
}
```

Output:
```json
{
  "recommendations": [
    {
      "startTime": "10:00",
      "endTime": "12:00",
      "conflictScore": 0.08,
      "disruptionScore": 0.18,
      "confidence": 0.87,
      "reason": "Lower overlap with existing planned blocks"
    }
  ],
  "modelVersion": "v1"
}
```

## 7. Explainability
Every recommendation should expose understandable factors such as:
- No section overlap.
- Lower expected disruption.
- Fits requested duration.
- Compatible resources.
- Historical feasibility.

Never display unsupported causal claims.

## 8. Fallback
If the ML service is unavailable or confidence/data quality is insufficient:
- Continue with deterministic conflict and scheduling logic.
- Clearly mark ML recommendation as unavailable.
- Do not block normal request processing.

## 9. Evaluation
Depending on task:
- Regression: MAE/RMSE.
- Classification: precision/recall/F1.
- Ranking/recommendation: top-k feasibility and conflict reduction.
- Operational metric: reduction in conflicts/disruption on validation scenarios.

## 10. ML Acceptance Criteria
- Service accepts validated scheduling inputs.
- Returns structured recommendations.
- Model version is recorded.
- Recommendation has confidence/score where applicable.
- Fallback works.
- Human approval remains mandatory.
