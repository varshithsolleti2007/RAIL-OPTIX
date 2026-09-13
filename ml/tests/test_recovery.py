from app.optimization.recovery import recommend_recovery


def make_task(task_id, priority_score=50, corridor="C1", section="S01", block_type="Engineering Block", duration=60):
    return {
        "task_id": task_id,
        "corridor_id": corridor,
        "section_id": section,
        "required_block_type": block_type,
        "priority_score": priority_score,
        "duration_minutes": duration,
    }


def make_block(block_id, corridor="C1", section="S01", block_type="Engineering Block", duration=90, approved=True):
    return {
        "block_id": block_id,
        "corridor_id": corridor,
        "section_id": section,
        "block_type": block_type,
        "duration_minutes": duration,
        "approved": approved,
    }


def test_finds_alternate_block_excluding_failed_one():
    tasks = [make_task("A")]
    blocks = [make_block("FAILED"), make_block("ALT")]

    result = recommend_recovery(tasks, blocks, failed_block_ids=["FAILED"])

    assert result["assignments"] == [
        {"task_id": "A", "recovery_block_id": "ALT", "status": "Reassigned", "reason": "Compatible recovery block found."}
    ]


def test_no_compatible_block_returns_unresolved():
    tasks = [make_task("A", block_type="Traffic Block")]
    blocks = [make_block("B1", block_type="Engineering Block")]

    result = recommend_recovery(tasks, blocks, failed_block_ids=[])

    assert result["assignments"][0]["status"] == "No Compatible Block"
    assert result["assignments"][0]["recovery_block_id"] is None


def test_higher_priority_task_gets_first_pick():
    tasks = [make_task("LOW", priority_score=10), make_task("HIGH", priority_score=90)]
    blocks = [make_block("ONLY_ONE")]

    result = recommend_recovery(tasks, blocks, failed_block_ids=[])

    assignments = {a["task_id"]: a for a in result["assignments"]}
    assert assignments["HIGH"]["recovery_block_id"] == "ONLY_ONE"
