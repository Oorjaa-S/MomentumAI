"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Target,
  Plus,
  Sparkles,
  Clock,
  CheckCircle2,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  ListTodo,
} from "lucide-react";
import {
  getGoals,
  getTasks,
  deleteGoal,
  updateGoal,
  generateTasks,
} from "../../lib/api";
import CreateGoalModal from "./CreateGoalModal";
import AIModal from "../ai/AIModal";
import "./goals.css";

export default function GoalsView() {
  const [goals, setGoals] = useState([]);
  const [goalTasksMap, setGoalTasksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const [aiModalState, setAiModalState] = useState({
    isOpen: false,
    actionType: "",
    result: null,
    loading: false,
  });

  const loadGoalsAndTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const fetchedGoals = await getGoals();
      setGoals(fetchedGoals);

      // Fetch tasks for each goal
      const tasksMap = {};
      await Promise.all(
        fetchedGoals.map(async (g) => {
          try {
            const tasks = await getTasks(g.id);
            tasksMap[g.id] = Array.isArray(tasks) ? tasks : [];
          } catch {
            tasksMap[g.id] = [];
          }
        })
      );
      setGoalTasksMap(tasksMap);
    } catch (err) {
      console.error("Error loading goals:", err);
      setError("Failed to connect to backend server. Make sure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoalsAndTasks();
  }, [loadGoalsAndTasks]);

  const handleDeleteGoal = async (goalId) => {
    if (!confirm("Are you sure you want to delete this strategic goal?")) return;
    try {
      await deleteGoal(goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      const newMap = { ...goalTasksMap };
      delete newMap[goalId];
      setGoalTasksMap(newMap);
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  const handleGenerateTasks = async (goalId) => {
    setAiModalState({
      isOpen: true,
      actionType: "generate-tasks",
      result: null,
      loading: true,
    });
    try {
      const resultTasks = await generateTasks(goalId);
      setGoalTasksMap((prev) => ({ ...prev, [goalId]: resultTasks }));
      setAiModalState({
        isOpen: true,
        actionType: "generate-tasks",
        result: { plan: `Successfully generated ${resultTasks.length} concrete action tasks for Goal #${goalId}.` },
        loading: false,
      });
      loadGoalsAndTasks();
    } catch (err) {
      console.error("Failed to generate AI tasks:", err);
      setAiModalState({
        isOpen: true,
        actionType: "generate-tasks",
        result: { plan: err.message || "Failed to generate AI tasks" },
        loading: false,
      });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingGoal) return;
    try {
      const updated = await updateGoal(editingGoal.id, {
        title: editingGoal.title,
        deadline: editingGoal.deadline,
        priority: editingGoal.priority,
        available_hours: Number(editingGoal.available_hours),
        notes: editingGoal.notes,
      });
      setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      setEditingGoal(null);
    } catch (err) {
      console.error("Failed to update goal:", err);
    }
  };

  // Stats calculation
  const totalGoals = goals.length;
  let totalTasksCount = 0;
  let totalCompletedCount = 0;

  Object.values(goalTasksMap).forEach((taskList) => {
    totalTasksCount += taskList.length;
    totalCompletedCount += taskList.filter((t) => t.completed).length;
  });

  const overallProgress =
    totalTasksCount > 0 ? Math.round((totalCompletedCount / totalTasksCount) * 100) : 0;

  return (
    <div className="goals-container">
      {/* 1. Header & Summary Strip */}
      <div className="goals-header-bar">
        <div className="goals-header-info">
          <h2>Strategic Goals & Milestones</h2>
          <p>Define high-level objectives, allocate daily capacity, and generate execution roadmaps.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div className="goals-summary-strip">
            <div className="goals-stat-pill">
              <Target size={16} style={{ color: "var(--primary)" }} />
              <span>Goals: <strong>{totalGoals}</strong></span>
            </div>
            <div className="goals-stat-pill">
              <ListTodo size={16} style={{ color: "var(--secondary)" }} />
              <span>Tasks: <strong>{totalTasksCount}</strong></span>
            </div>
            <div className="goals-stat-pill">
              <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
              <span>Progress: <strong>{overallProgress}%</strong></span>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary-action"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} />
            New Goal
          </button>
        </div>
      </div>

      {/* Backend Error Alert */}
      {error && (
        <div style={{ background: "var(--surface-secondary)", border: "1px solid var(--primary)", borderRadius: "12px", padding: "14px", color: "var(--primary)", display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Goals Cards Grid */}
      {loading ? (
        <div className="goals-empty-state">
          <p>Loading strategic goals from Digital Twin...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="goals-empty-state">
          <Target size={36} style={{ color: "var(--primary)" }} />
          <h3>No Strategic Goals Defined</h3>
          <p>Create your first high-impact goal to unlock AI roadmap generation and task decomposition.</p>
          <button
            type="button"
            className="btn-primary-action"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} />
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="goals-cards-grid">
          {goals.map((goal) => {
            const tasks = goalTasksMap[goal.id] || [];
            const completedCount = tasks.filter((t) => t.completed).length;
            const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

            return (
              <div key={goal.id} className="goal-card">
                <div>
                  <div className="goal-card-header">
                    <div className="goal-title-group">
                      <h3 className="goal-title-text">{goal.title}</h3>
                      {goal.notes && <p className="goal-notes-text">{goal.notes}</p>}
                    </div>
                    <span className="goal-badge-priority">
                      {goal.priority || "Medium"}
                    </span>
                  </div>

                  <div className="goal-meta-grid" style={{ marginTop: "12px" }}>
                    <div className="goal-meta-item">
                      <Calendar size={13} style={{ color: "var(--primary)" }} />
                      <span>{goal.deadline || "Ongoing"}</span>
                    </div>
                    <div className="goal-meta-item">
                      <Clock size={13} style={{ color: "var(--secondary)" }} />
                      <span>{goal.available_hours || 1}h daily</span>
                    </div>
                    <div className="goal-meta-item">
                      <ListTodo size={13} style={{ color: "var(--accent)" }} />
                      <span>{tasks.length} tasks</span>
                    </div>
                  </div>

                  <div className="goal-progress-section" style={{ marginTop: "14px" }}>
                    <div className="goal-progress-label-row">
                      <span>Progress ({completedCount}/{tasks.length} done)</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="goal-progress-bar-container">
                      <div
                        className="goal-progress-bar-value"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Nested Subtasks Preview */}
                  {tasks.length > 0 && (
                    <div className="goal-tasks-preview" style={{ marginTop: "14px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Action Plan ({tasks.length})
                      </span>
                      {tasks.slice(0, 3).map((t) => (
                        <div key={t.id} className={`goal-task-mini-item ${t.completed ? "done" : ""}`}>
                          <CheckCircle2 size={13} style={{ color: t.completed ? "var(--success)" : "var(--text-muted)", flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                        </div>
                      ))}
                      {tasks.length > 3 && (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", paddingLeft: "6px" }}>
                          +{tasks.length - 3} more tasks
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="goal-card-actions">
                  <button
                    type="button"
                    className="btn-tertiary-action"
                    onClick={() => handleGenerateTasks(goal.id)}
                    title="Generate actionable subtasks using AI Task Decomposer"
                  >
                    <Sparkles size={13} />
                    Generate AI Tasks
                  </button>

                  <div className="goal-action-btn-group">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setEditingGoal(goal)}
                      title="Edit Goal"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => handleDeleteGoal(goal.id)}
                      title="Delete Goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Creation Modal */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGoalCreated={() => loadGoalsAndTasks()}
      />

      {/* Goal Edit Modal */}
      {editingGoal && (
        <div className="modal-overlay-backdrop" onClick={() => setEditingGoal(null)}>
          <div className="modal-card-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Edit Goal: {editingGoal.title}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditingGoal(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="form-field-group">
                <label>Goal Title</label>
                <input
                  type="text"
                  className="form-input-control"
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-field-group">
                  <label>Deadline</label>
                  <input
                    type="text"
                    className="form-input-control"
                    value={editingGoal.deadline}
                    onChange={(e) => setEditingGoal({ ...editingGoal, deadline: e.target.value })}
                  />
                </div>
                <div className="form-field-group">
                  <label>Priority</label>
                  <select
                    className="form-input-control"
                    value={editingGoal.priority}
                    onChange={(e) => setEditingGoal({ ...editingGoal, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="form-field-group">
                <label>Daily Hours Allocated</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  className="form-input-control"
                  value={editingGoal.available_hours}
                  onChange={(e) => setEditingGoal({ ...editingGoal, available_hours: e.target.value })}
                />
              </div>

              <div className="form-field-group">
                <label>Notes & Context</label>
                <textarea
                  className="form-input-control"
                  rows={3}
                  value={editingGoal.notes}
                  onChange={(e) => setEditingGoal({ ...editingGoal, notes: e.target.value })}
                />
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => setEditingGoal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-action">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Modal */}
      <AIModal
        isOpen={aiModalState.isOpen}
        onClose={() => setAiModalState((prev) => ({ ...prev, isOpen: false }))}
        actionType={aiModalState.actionType}
        result={aiModalState.result}
        loading={aiModalState.loading}
        onTaskActionCompleted={() => loadGoalsAndTasks()}
      />
    </div>
  );
}
