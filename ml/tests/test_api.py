from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200


def test_priority_score_endpoint():
    response = client.post(
        "/api/priority/score",
        json={
            "tasks": [
                {
                    "task_id": "T1",
                    "risk_probability": 0.8,
                    "overdue_days": 40,
                    "condition_score": 30,
                    "safety_criticality": "High",
                    "operational_criticality": "High",
                }
            ]
        },
    )
    assert response.status_code == 200
    assert response.json()["scores"][0]["task_id"] == "T1"


def test_schedule_recommend_endpoint():
    response = client.post(
        "/api/schedule/recommend",
        json={
            "requestId": "r1",
            "sectionId": "s1",
            "priority": "HIGH",
            "durationMinutes": 120,
            "candidateWindows": [
                {"startTime": "2026-09-18T14:00:00", "endTime": "2026-09-18T16:00:00"}
            ],
            "existingBookings": [],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["modelVersion"] == "v1"
    assert len(body["recommendations"]) == 1


def test_schedule_optimize_endpoint():
    response = client.post(
        "/api/schedule/optimize",
        json={
            "tasks": [
                {
                    "task_id": "A",
                    "corridor_id": "C1",
                    "section_id": "S01",
                    "required_block_type": "Engineering Block",
                    "priority_score": 50,
                    "priority_level": "Medium",
                    "duration_minutes": 60,
                    "required_resources": [],
                }
            ],
            "blocks": [
                {
                    "block_id": "B1",
                    "corridor_id": "C1",
                    "section_id": "S01",
                    "block_type": "Engineering Block",
                    "duration_minutes": 90,
                    "approved": True,
                }
            ],
        },
    )
    assert response.status_code == 200
    assert response.json()["assignments"] == [{"task_id": "A", "block_id": "B1"}]


def test_simulate_endpoint():
    response = client.post(
        "/api/simulate",
        json={
            "tasks": [
                {
                    "task_id": "A",
                    "block_id": "B1",
                    "planned_start": "2026-09-18T10:00:00",
                    "planned_end": "2026-09-18T11:00:00",
                    "duration_minutes": 60,
                    "block_duration_minutes": 180,
                }
            ],
            "failed_block_id": None,
        },
    )
    assert response.status_code == 200
    assert response.json()["results"][0]["status"] == "Completed"


def test_recovery_recommend_endpoint():
    response = client.post(
        "/api/recovery/recommend",
        json={
            "tasks": [
                {
                    "task_id": "A",
                    "corridor_id": "C1",
                    "section_id": "S01",
                    "required_block_type": "Engineering Block",
                    "priority_score": 50,
                    "duration_minutes": 60,
                }
            ],
            "available_blocks": [
                {
                    "block_id": "B2",
                    "corridor_id": "C1",
                    "section_id": "S01",
                    "block_type": "Engineering Block",
                    "duration_minutes": 90,
                    "approved": True,
                }
            ],
            "failed_block_ids": ["B1"],
        },
    )
    assert response.status_code == 200
    assert response.json()["assignments"][0]["recovery_block_id"] == "B2"


def test_metrics_endpoint():
    response = client.get("/api/metrics")
    assert response.status_code == 200
    assert "risk_model_version" in response.json()
