from app.services.priority_service import score_priority


def test_higher_risk_and_criticality_yields_higher_score():
    tasks = [
        {
            "task_id": "T1",
            "risk_probability": 0.9,
            "overdue_days": 60,
            "condition_score": 20,
            "safety_criticality": "High",
            "operational_criticality": "High",
        },
        {
            "task_id": "T2",
            "risk_probability": 0.1,
            "overdue_days": 0,
            "condition_score": 90,
            "safety_criticality": "Low",
            "operational_criticality": "Low",
        },
    ]

    scores = {s["task_id"]: s for s in score_priority(tasks)}

    assert scores["T1"]["priority_score"] > scores["T2"]["priority_score"]
    assert scores["T1"]["priority_level"] == "Urgent"
    assert scores["T2"]["priority_level"] == "Normal"
