from app.ml_models.risk_model import predict_risk


def test_predict_risk_returns_expected_shape():
    tasks = [
        {
            "task_id": "T1",
            "condition_score": 20,
            "asset_age_years": 30,
            "failure_count_12m": 5,
            "overdue_days": 90,
            "safety_criticality": "High",
            "operational_criticality": "High",
            "department": "Engineering",
        },
        {
            "task_id": "T2",
            "condition_score": 95,
            "asset_age_years": 1,
            "failure_count_12m": 0,
            "overdue_days": 0,
            "safety_criticality": "Low",
            "operational_criticality": "Low",
            "department": "Electrical",
        },
    ]

    predictions = predict_risk(tasks)

    assert len(predictions) == 2
    for prediction in predictions:
        assert prediction["risk_level"] in ("Low", "High")
        assert 0 <= prediction["risk_probability"] <= 1
        assert prediction["model_version"] == "v1"
