"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CheckSquare,
  Search,
  Plus,
  Trash2,
  Edit2,
  ListTree,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  getGoals,
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  breakdownTask,
} from "../../lib/api";
import "./tasks.css";

export default function TasksView() {
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGoalFilter, setSelectedGoalFilter] = useState("ALL");
  const [selectedStatusTab, setSelectedStatusTab] = useState("ALL"); // ALL, PENDING, COMPLETED

  // Quick Add state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskGoalId, setNewTaskGoalId] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Edit task state
  const [editingTask, setEditingTask] = useState(null);

  // Task Breakdown Modal state
  const [breakdownResult, setBreakdownResult] = useState(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  const loadTasksData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [fetchedGoals, fetchedTasks] = await Promise.all([
        getGoals().catch(() => []),
        getAllTasks().catch(() => []),
      ]);

      setGoals(fetchedGoals);

      if (fetchedGoals.length > 0 && !newTaskGoalId) {
        setNewTaskGoalId(fetchedGoals[0].id.toString());
      }

      // Map goals for quick title lookup
      const goalLookup = {};
      fetchedGoals.forEach((g) => {
        goalLookup[g.id] = g;
      });

      const enrichedTasks = fetchedTasks.map((t) => {
        const parentGoal = goalLookup[t.goal_id];
        return {
          ...t,
          goal_id: Number(t.goal_id),
          goal_title: parentGoal?.title || "Strategic Goal",
          goal_priority: parentGoal?.priority || "Medium",
        };
      });

      setTasks(enrichedTasks);
    } catch (err) {
      console.error("Error loading tasks data:", err);
      setError("Failed to load tasks from backend. Ensure FastAPI server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }, [newTaskGoalId]);

  useEffect(() => {
    loadTasksData();
  }, [loadTasksData]);

  // Quick Add Task
  const handleQuickAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskGoalId) return;
    setIsAdding(true);
    try {
      const targetGoalId = Number(newTaskGoalId);
      const created = await createTask(targetGoalId, newTaskTitle.trim());
      const associatedGoal = goals.find((g) => g.id === targetGoalId);

      const newTaskObj = {
        ...created,
        id: created.id,
        title: created.title || newTaskTitle.trim(),
        completed: created.completed || false,
        goal_id: targetGoalId,
        goal_title: associatedGoal?.title || "Strategic Goal",
        goal_priority: associatedGoal?.priority || "Medium",
      };

      setTasks((prev) => [...prev, newTaskObj]);
      setNewTaskTitle("");
    } catch (err) {
      console.error("Failed to add task:", err);
    } finally {
      setIsAdding(false);
    }
  };

  // Toggle Completion
  const handleToggleTask = async (task) => {
    const newStatus = !task.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: newStatus } : t))
    );
    try {
      await updateTask(task.id, { title: task.title, completed: newStatus });
    } catch (err) {
      console.error("Failed to update task status:", err);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t))
      );
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await deleteTask(taskId);
    } catch (err) {
      console.error("Failed to delete task:", err);
      loadTasksData();
    }
  };

  // Save Edit Task
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      const updated = await updateTask(editingTask.id, {
        title: editingTask.title,
        completed: editingTask.completed,
      });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === updated.id
            ? { ...t, title: updated.title, completed: updated.completed }
            : t
        )
      );
      setEditingTask(null);
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  // AI Task Breakdown
  const handleBreakdownTask = async (taskId) => {
    setBreakdownLoading(true);
    setBreakdownResult(null);
    try {
      const result = await breakdownTask(taskId);
      setBreakdownResult(result);
    } catch (err) {
      console.error("Task breakdown failed:", err);
      alert("Failed to decompose task with AI. Please try again.");
    } finally {
      setBreakdownLoading(false);
    }
  };

  // Filtered tasks computation
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Goal filter (Strict numeric goal_id check)
      if (selectedGoalFilter !== "ALL") {
        if (Number(task.goal_id) !== Number(selectedGoalFilter)) {
          return false;
        }
      }

      // 2. Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(query);
        const matchesGoal = task.goal_title?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesGoal) return false;
      }

      // 3. Status tab filter
      if (selectedStatusTab === "PENDING" && task.completed) return false;
      if (selectedStatusTab === "COMPLETED" && !task.completed) return false;

      return true;
    });
  }, [tasks, searchQuery, selectedGoalFilter, selectedStatusTab]);

  // Counts based on active goal filter if one is selected
  const activeScopedTasks = useMemo(() => {
    if (selectedGoalFilter === "ALL") return tasks;
    return tasks.filter((t) => Number(t.goal_id) === Number(selectedGoalFilter));
  }, [tasks, selectedGoalFilter]);

  const totalCount = activeScopedTasks.length;
  const pendingCount = activeScopedTasks.filter((t) => !t.completed).length;
  const completedCount = activeScopedTasks.filter((t) => t.completed).length;

  const selectedGoalObject = useMemo(() => {
    if (selectedGoalFilter === "ALL") return null;
    return goals.find((g) => Number(g.id) === Number(selectedGoalFilter));
  }, [goals, selectedGoalFilter]);

  return (
    <div className="tasks-container">
      {/* 1. Filter Bar & Search */}
      <div className="tasks-filter-bar">
        <div className="tasks-filter-top-row">
          <div className="tasks-search-input-box">
            <Search size={15} className="tasks-search-icon" />
            <input
              type="text"
              className="tasks-search-input"
              placeholder="Search tasks by title or goal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="tasks-filters-group">
            <select
              className="task-filter-select"
              value={selectedGoalFilter}
              onChange={(e) => setSelectedGoalFilter(e.target.value)}
              aria-label="Filter by Goal"
            >
              <option value="ALL">All Goals ({goals.length})</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id.toString()}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="tasks-tab-row">
          <button
            type="button"
            className={`task-tab-btn ${selectedStatusTab === "ALL" ? "active" : ""}`}
            onClick={() => setSelectedStatusTab("ALL")}
          >
            All Tasks ({totalCount})
          </button>
          <button
            type="button"
            className={`task-tab-btn ${selectedStatusTab === "PENDING" ? "active" : ""}`}
            onClick={() => setSelectedStatusTab("PENDING")}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            className={`task-tab-btn ${selectedStatusTab === "COMPLETED" ? "active" : ""}`}
            onClick={() => setSelectedStatusTab("COMPLETED")}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Backend Error Alert */}
      {error && (
        <div
          style={{
            background: "var(--surface-secondary)",
            border: "1px solid var(--primary)",
            borderRadius: "12px",
            padding: "14px",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Tasks Management Card */}
      <div className="tasks-management-card">
        {/* Quick Add Form */}
        {goals.length > 0 && (
          <form onSubmit={handleQuickAddTask} className="quick-add-task-form">
            <input
              type="text"
              className="quick-add-input"
              placeholder="Add a new task to execute..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              disabled={isAdding}
            />
            <select
              className="quick-add-select"
              value={newTaskGoalId}
              onChange={(e) => setNewTaskGoalId(e.target.value)}
              aria-label="Assign to Goal"
            >
              {goals.map((g) => (
                <option key={g.id} value={g.id.toString()}>
                  {g.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="quick-add-btn"
              disabled={isAdding || !newTaskTitle.trim()}
            >
              <Plus size={14} style={{ display: "inline", marginRight: "4px" }} />
              {isAdding ? "Adding..." : "Add Task"}
            </button>
          </form>
        )}

        {/* Tasks List */}
        {loading ? (
          <div className="empty-tasks-box">
            <p>Loading execution tasks from Digital Twin...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-tasks-box">
            <CheckSquare size={32} style={{ color: "var(--primary)", margin: "0 auto" }} />
            <p>
              {selectedGoalFilter !== "ALL"
                ? `No tasks found for "${selectedGoalObject?.title || "this goal"}". Create a task or generate tasks with AI.`
                : searchQuery.trim()
                ? "No tasks match your search query."
                : "No tasks yet. Create a task or generate tasks from one of your goals."}
            </p>
          </div>
        ) : (
          <div className="tasks-main-list">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`task-row-card ${task.completed ? "completed" : ""}`}
              >
                <div className="task-row-left">
                  <button
                    type="button"
                    className={`custom-checkbox ${task.completed ? "checked" : ""}`}
                    onClick={() => handleToggleTask(task)}
                    aria-label="Toggle task"
                  >
                    {task.completed && <CheckSquare size={13} />}
                  </button>

                  <div className="task-row-info">
                    <span className="task-row-title">{task.title}</span>
                    <div className="task-row-meta">
                      <span className="task-goal-tag">
                        Goal: {task.goal_title}
                      </span>
                      <span>&bull;</span>
                      <span>Task #{task.id}</span>
                      {task.goal_priority && (
                        <>
                          <span>&bull;</span>
                          <span>Priority: {task.goal_priority}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="task-row-right">
                  <button
                    type="button"
                    className="task-action-icon-btn"
                    title="Decompose with AI Task Breakdown"
                    onClick={() => handleBreakdownTask(task.id)}
                  >
                    <ListTree size={14} />
                  </button>
                  <button
                    type="button"
                    className="task-action-icon-btn"
                    title="Edit task"
                    onClick={() => setEditingTask(task)}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="task-action-icon-btn"
                    title="Delete task"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Edit Modal */}
      {editingTask && (
        <div className="modal-overlay-backdrop" onClick={() => setEditingTask(null)}>
          <div className="modal-card-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Edit Task #{editingTask.id}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditingTask(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="form-field-group">
                <label>Task Title</label>
                <input
                  type="text"
                  className="form-input-control"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  required
                />
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-action">
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Breakdown Result Modal */}
      {(breakdownLoading || breakdownResult) && (
        <div
          className="modal-overlay-backdrop"
          onClick={() => {
            if (!breakdownLoading) setBreakdownResult(null);
          }}
        >
          <div className="modal-card-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={18} style={{ color: "var(--primary)" }} />
                AI Task Decomposition
              </h3>
              {!breakdownLoading && (
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setBreakdownResult(null)}
                >
                  &times;
                </button>
              )}
            </div>

            {breakdownLoading ? (
              <div style={{ padding: "30px 20px", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-lora-fallback)", color: "var(--text-muted)" }}>
                  Analyzing task context and decomposing into implementation steps...
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <h4
                    style={{
                      fontFamily: "var(--font-nunito-fallback)",
                      fontSize: "15px",
                      fontWeight: 800,
                      color: "var(--text)",
                    }}
                  >
                    {breakdownResult.task_title}
                  </h4>
                  <p
                    style={{
                      fontFamily: "var(--font-lora-fallback)",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginTop: "2px",
                    }}
                  >
                    Total Estimated Duration: {breakdownResult.total_estimated_minutes} min &bull; Goal:{" "}
                    {breakdownResult.goal_title}
                  </p>
                </div>

                <div className="subtasks-breakdown-box">
                  {breakdownResult.subtasks?.map((subtask) => (
                    <div key={subtask.step_order} className="subtask-step-item">
                      <span className="subtask-step-badge">Step {subtask.step_order}</span>
                      <div className="subtask-step-content">
                        <span className="subtask-step-title">{subtask.title}</span>
                        {subtask.description && (
                          <span className="subtask-step-desc">{subtask.description}</span>
                        )}
                        <span style={{ fontSize: "11px", color: "var(--accent)", marginTop: "2px" }}>
                          <Clock size={11} style={{ display: "inline", marginRight: "3px" }} />
                          {subtask.estimated_minutes} min &bull; {subtask.difficulty || "Medium"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {breakdownResult.summary && (
                  <p
                    style={{
                      fontFamily: "var(--font-lora-fallback)",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                    }}
                  >
                    {breakdownResult.summary}
                  </p>
                )}

                <div className="modal-footer-actions">
                  <button
                    type="button"
                    className="btn-primary-action"
                    onClick={() => setBreakdownResult(null)}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
