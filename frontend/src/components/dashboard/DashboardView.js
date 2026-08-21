"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Target,
  CheckSquare,
  Sparkles,
  TrendingUp,
  Plus,
  Clock,
  Trash2,
  ListTree,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  getGoals,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  generateTasks,
  getDigitalTwin,
  breakdownTask,
} from "../../lib/api";
import CreateGoalModal from "../goals/CreateGoalModal";
import AIModal from "../ai/AIModal";
import DashboardCalendar from "./DashboardCalendar";
import "./dashboard.css";

export default function DashboardView() {
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [digitalTwin, setDigitalTwin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Quick Add Task State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskGoalId, setNewTaskGoalId] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Modals State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [aiModalState, setAiModalState] = useState({
    isOpen: false,
    actionType: "",
    result: null,
    loading: false,
  });

  // Fetch initial dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [fetchedGoals, twinData] = await Promise.all([
        getGoals().catch(() => []),
        getDigitalTwin().catch(() => null),
      ]);

      setGoals(fetchedGoals);
      setDigitalTwin(twinData);

      if (fetchedGoals.length > 0) {
        if (!newTaskGoalId) {
          setNewTaskGoalId(fetchedGoals[0].id);
        }
        // Fetch tasks across all goals
        const tasksNested = await Promise.all(
          fetchedGoals.map((g) =>
            getTasks(g.id)
              .then((res) =>
                Array.isArray(res)
                  ? res.map((t) => ({ ...t, goal_id: g.id, goal_title: g.title }))
                  : []
              )
              .catch(() => [])
          )
        );
        setTasks(tasksNested.flat());
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Unable to connect to backend server. Make sure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }, [newTaskGoalId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Quick Task Creation
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskGoalId) return;
    setIsAddingTask(true);
    try {
      const created = await createTask(Number(newTaskGoalId), newTaskTitle.trim());
      const associatedGoal = goals.find((g) => g.id === Number(newTaskGoalId));
      setTasks((prev) => [
        ...prev,
        { ...created, goal_id: Number(newTaskGoalId), goal_title: associatedGoal?.title || "Goal" },
      ]);
      setNewTaskTitle("");
    } catch (err) {
      console.error("Failed to add task:", err);
    } finally {
      setIsAddingTask(false);
    }
  };

  // Toggle Task Completion
  const handleToggleTask = async (task) => {
    const newStatus = !task.completed;
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: newStatus } : t))
    );
    try {
      await updateTask(task.id, { title: task.title, completed: newStatus });
    } catch (err) {
      console.error("Failed to update task:", err);
      // Revert on failure
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
      loadDashboardData();
    }
  };

  // Trigger AI Action (Breakdown or Generate Tasks)
  const triggerAIAction = async (actionType, taskId = null, goalId = null) => {
    setAiModalState({ isOpen: true, actionType, result: null, loading: true });
    try {
      let data = null;
      if (actionType === "breakdown" && taskId) {
        data = await breakdownTask(taskId);
      } else if (actionType === "generate-tasks" && goalId) {
        data = await generateTasks(goalId);
        loadDashboardData(); // Refresh tasks
      }
      setAiModalState((prev) => ({ ...prev, result: data, loading: false }));
    } catch (err) {
      console.error(`AI ${actionType} error:`, err);
      setAiModalState((prev) => ({
        ...prev,
        result: { plan: err.message || "Failed to execute AI agent" },
        loading: false,
      }));
    }
  };

  // Computed Dynamic Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeGoalsCount = goals.length;

  return (
    <div className="dashboard-container">
      {/* Backend Connection Alert */}
      {error && (
        <div className="dashboard-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Dashboard 2-Column Grid (Tasks + Calendar & Goals) */}
      <div className="dashboard-main-grid">
        {/* Left Column: Main Task Section (Primary Focus) */}
        <div className="dashboard-card tasks-primary-card">
          <div className="card-header-row task-section-header">
            <div className="task-header-left">
              <h3>
                <CheckSquare size={18} style={{ color: "var(--primary)" }} />
                Today&apos;s Execution Tasks
              </h3>
              <div className="task-header-progress-group">
                <span className="task-progress-text">
                  <strong>{completedTasks}</strong> / {totalTasks} completed
                </span>
                <span className="badge-count">{completionRate}%</span>
              </div>
            </div>

            {/* Compact Header Progress Bar */}
            <div className="task-header-progress-track">
              <div
                className="task-header-progress-fill"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Quick Add Task Form */}
          {goals.length > 0 && (
            <form onSubmit={handleAddTask} className="quick-add-task-form">
              <input
                type="text"
                className="quick-add-input"
                placeholder="Add a new task to execute..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                disabled={isAddingTask}
              />
              <select
                className="quick-add-select"
                value={newTaskGoalId}
                onChange={(e) => setNewTaskGoalId(e.target.value)}
                aria-label="Assign to Goal"
              >
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="quick-add-btn"
                disabled={isAddingTask || !newTaskTitle.trim()}
              >
                <Plus size={14} />
                {isAddingTask ? "Adding..." : "Add"}
              </button>
            </form>
          )}

          {/* Tasks List */}
          <div className="tasks-list">
            {tasks.length === 0 ? (
              <div className="empty-tasks-box">
                <CheckSquare size={32} style={{ color: "var(--primary)", margin: "0 auto" }} />
                <p>No tasks created yet. Create a goal or use AI Task Generation to populate your queue.</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-card-item ${task.completed ? "completed" : ""}`}
                >
                  <div className="task-card-left">
                    <button
                      type="button"
                      className={`custom-checkbox ${task.completed ? "checked" : ""}`}
                      onClick={() => handleToggleTask(task)}
                      aria-label="Toggle task"
                    >
                      {task.completed && <CheckSquare size={13} />}
                    </button>
                    <div className="task-text-group">
                      <span className="task-title-text">{task.title}</span>
                      <span className="task-sub-meta">
                        {task.goal_title ? `Goal: ${task.goal_title}` : `Goal #${task.goal_id}`}
                      </span>
                    </div>
                  </div>

                  <div className="task-card-right">
                    <button
                      type="button"
                      className="task-action-icon-btn"
                      title="Decompose with AI Task Breakdown"
                      onClick={() => triggerAIAction("breakdown", task.id)}
                    >
                      <ListTree size={14} />
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
              ))
            )}
          </div>
        </div>

        {/* Right Column: Calendar Panel + Active Goals Overview */}
        <div className="dashboard-right-column">
          {/* Calendar Widget Panel */}
          <DashboardCalendar goals={goals} />

          {/* Active Goals Panel with Compact New Goal CTA in Header */}
          <div className="dashboard-card">
            <div className="card-header-row">
              <div className="card-header-title-group">
                <h3>
                  <Target size={18} style={{ color: "var(--primary)" }} />
                  Active Goals
                </h3>
                <span className="badge-count">{goals.length}</span>
              </div>

              {/* Compact "+ New Goal" Button in Header */}
              <button
                type="button"
                className="btn-compact-add-goal"
                onClick={() => setIsGoalModalOpen(true)}
                title="Create a new strategic goal"
              >
                <Plus size={14} />
                <span>New Goal</span>
              </button>
            </div>

            <div className="goals-list">
              {goals.length === 0 ? (
                <div className="empty-tasks-box">
                  <p>No active goals yet. Click &quot;+ New Goal&quot; above to create one.</p>
                </div>
              ) : (
                goals.map((goal) => {
                  const goalTasks = tasks.filter((t) => t.goal_id === goal.id);
                  const goalDone = goalTasks.filter((t) => t.completed).length;
                  const goalProgress =
                    goalTasks.length > 0 ? Math.round((goalDone / goalTasks.length) * 100) : 0;

                  return (
                    <div key={goal.id} className="goal-card-item">
                      <div className="goal-card-top">
                        <span className="goal-card-title">{goal.title}</span>
                        <span className="badge-count">
                          {goal.priority || "High"}
                        </span>
                      </div>

                      <div className="goal-card-meta">
                        <span>
                          <Clock size={12} style={{ display: "inline", marginRight: "4px" }} />
                          {goal.deadline || "Active"}
                        </span>
                        <span>&bull;</span>
                        <span>
                          {goalTasks.length} tasks ({goalProgress}% done)
                        </span>
                      </div>

                      <div className="goal-progress-bar-bg">
                        <div
                          className="goal-progress-bar-fill"
                          style={{ width: `${goalProgress}%` }}
                        />
                      </div>

                      <div className="goal-actions-row">
                        <button
                          type="button"
                          className="btn-goal-generate"
                          onClick={() => triggerAIAction("generate-tasks", null, goal.id)}
                          title="Generate concrete subtasks with AI"
                        >
                          <Sparkles size={12} />
                          Generate AI Tasks
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Goal Creation Modal */}
      <CreateGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onGoalCreated={() => loadDashboardData()}
      />

      {/* AI Results Output Modal */}
      <AIModal
        isOpen={aiModalState.isOpen}
        onClose={() => setAiModalState((prev) => ({ ...prev, isOpen: false }))}
        actionType={aiModalState.actionType}
        result={aiModalState.result}
        loading={aiModalState.loading}
        onTaskActionCompleted={() => loadDashboardData()}
      />
    </div>
  );
}
