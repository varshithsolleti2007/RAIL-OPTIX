from app.optimization.batch_optimizer import _tasks_are_compatible, optimize


def make_task(task_id, corridor="C1", section="S01", block_type="Engineering Block", priority_score=50, priority_level="Medium", duration=60, resources=None):
    return {
        "task_id": task_id,
        "corridor_id": corridor,
        "section_id": section,
        "required_block_type": block_type,
        "priority_score": priority_score,
        "priority_level": priority_level,
        "duration_minutes": duration,
        "required_resources": resources or [],
    }


def make_block(block_id, corridor="C1", section="S01", block_type="Engineering Block", duration=120, approved=True):
    return {
        "block_id": block_id,
        "corridor_id": corridor,
        "section_id": section,
        "block_type": block_type,
        "duration_minutes": duration,
        "approved": approved,
    }


def test_tasks_are_compatible_when_no_shared_resource():
    a = make_task("A", resources=["TEAM_1"])
    b = make_task("B", resources=["TEAM_2"])
    assert _tasks_are_compatible(a, b) is True


def test_tasks_incompatible_when_sharing_a_resource():
    a = make_task("A", resources=["TEAM_1"])
    b = make_task("B", resources=["TEAM_1"])
    assert _tasks_are_compatible(a, b) is False


def test_optimize_assigns_compatible_task_to_matching_block():
    tasks = [make_task("A")]
    blocks = [make_block("B1")]

    result = optimize(tasks, blocks)

    assert result["assignments"] == [{"task_id": "A", "block_id": "B1"}]
    assert result["unscheduled_task_ids"] == []


def test_optimize_leaves_task_unscheduled_when_block_unapproved():
    tasks = [make_task("A")]
    blocks = [make_block("B1", approved=False)]

    result = optimize(tasks, blocks)

    assert result["assignments"] == []
    assert result["unscheduled_task_ids"] == ["A"]


def test_optimize_respects_block_duration_capacity():
    tasks = [make_task("A", duration=80), make_task("B", duration=80)]
    blocks = [make_block("B1", duration=120)]

    result = optimize(tasks, blocks)

    # Only one of the two 80-minute tasks fits in a 120-minute block.
    assert len(result["assignments"]) == 1
    assert len(result["unscheduled_task_ids"]) == 1


def test_optimize_prefers_higher_priority_when_capacity_constrained():
    tasks = [
        make_task("LOW", duration=80, priority_score=10, priority_level="Low"),
        make_task("URGENT", duration=80, priority_score=90, priority_level="Urgent"),
    ]
    blocks = [make_block("B1", duration=120)]

    result = optimize(tasks, blocks)

    assert result["assignments"] == [{"task_id": "URGENT", "block_id": "B1"}]
