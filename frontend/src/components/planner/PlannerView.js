"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Calendar,
  TrendingUp,
  ArrowRight,
  Target,
  Clock,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Brain,
  Sliders,
} from "lucide-react";
import {
  generateDailyPlan,
  prioritizeTasks,
  getNextTask,
  generateRoadmap,
  getDigitalTwin,
  getGoals,
} from "../../lib/api";
import "./planner.css";

export default function PlannerView() {
  const [digitalTwin, setDigitalTwin] = useState(null);
  const [goals, setGoals] = useState([]);
  const [availableHours, setAvailableHours] = useState(3.0);
  const [activeTab, setActiveTab] = useState("DAILY_PLAN"); // DAILY_PLAN, PRIORITIZE, NEXT_TASK, ROADMAP

  // AI execution states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Results cache
  const [dailyPlan, setDailyPlan] = useState(null);
  const [prioritizedData, setPrioritizedData] = useState(null);
  const [nextTaskData, setNextTaskData] = useState(null);

  // Roadmap input state
  const [roadmapInput, setRoadmapInput] = useState({
    goal: "",
    days: 7,
    hours: 2,
    skill_level: "Beginner",
    current_knowledge: "Basic fundamentals",
  });
  const [roadmapResult, setRoadmapResult] = useState(null);

  const loadInitialData = useCallback(async () => {
    try {
      const [dt, gList] = await Promise.all([
        getDigitalTwin().catch(() => null),
        getGoals().catch(() => []),
      ]);
      setDigitalTwin(dt);
      setGoals(gList);
      if (dt?.total_available_hours) {
        setAvailableHours(dt.total_available_hours);
      }
    } catch (err) {
      console.error("Initial planner load error:", err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 1. Generate Daily Plan
  const handleGenerateDailyPlan = async () => {
    setLoading(true);
    setError("");
    try {
      const plan = await generateDailyPlan({
        available_hours_override: availableHours,
      });
      setDailyPlan(plan);
      setActiveTab("DAILY_PLAN");
    } catch (err) {
      console.error("Daily planner error:", err);
      setError(err.message || "Failed to generate daily plan");
    } finally {
      setLoading(false);
    }
  };

  // 2. Prioritize Tasks
  const handlePrioritizeTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const prio = await prioritizeTasks();
      setPrioritizedData(prio);
      setActiveTab("PRIORITIZE");
    } catch (err) {
      console.error("Prioritization error:", err);
      setError(err.message || "Failed to prioritize tasks");
    } finally {
      setLoading(false);
    }
  };

  // 3. Get Next Best Task
  const handleGetNextTask = async () => {
    setLoading(true);
    setError("");
    try {
      const next = await getNextTask({
        available_minutes: Math.round(availableHours * 60),
      });
      setNextTaskData(next);
      setActiveTab("NEXT_TASK");
    } catch (err) {
      console.error("Next task error:", err);
      setError(err.message || "Failed to recommend next best task");
    } finally {
      setLoading(false);
    }
  };

  // 4. Generate Roadmap
  const handleGenerateRoadmap = async (e) => {
    e.preventDefault();
    if (!roadmapInput.goal.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await generateRoadmap(roadmapInput);
      setRoadmapResult(res);
      setActiveTab("ROADMAP");
    } catch (err) {
      console.error("Roadmap error:", err);
      setError(err.message || "Failed to generate AI roadmap");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="planner-container">
      {/* 1. Header with Capacity Slider & Digital Twin Status */}
      <div className="planner-header-bar">
        <div className="planner-header-info">
          <h2>
            <Sparkles size={20} style={{ color: "var(--primary)" }} />
            AI Productivity Intelligence Center
          </h2>
          <p>
            Digital Twin State:{" "}
            <strong>{digitalTwin?.workload_pressure || "Optimal"} Load</strong> &bull;{" "}
            {digitalTwin?.total_tasks || 0} Total Tasks ({digitalTwin?.remaining_tasks?.length || 0} Pending)
          </p>
        </div>

        <div className="planner-capacity-control">
          <Sliders size={15} style={{ color: "var(--primary)" }} />
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>
            Today&apos;s Capacity:
          </span>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            className="capacity-slider"
            value={availableHours}
            onChange={(e) => setAvailableHours(parseFloat(e.target.value))}
          />
          <span className="capacity-value-label">{availableHours} hrs</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ background: "var(--surface-secondary)", border: "1px solid var(--primary)", borderRadius: "12px", padding: "14px", color: "var(--primary)", display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. AI Actions Strip */}
      <div className="ai-actions-strip">
        <button
          type="button"
          className={`ai-action-card-btn ai-action-1 ${activeTab === "DAILY_PLAN" ? "active" : ""}`}
          onClick={handleGenerateDailyPlan}
          disabled={loading}
        >
          <div className="ai-action-title">
            <Calendar size={16} style={{ color: "var(--ai-daily-color, var(--primary))" }} />
            <span>Daily Execution Plan</span>
          </div>
          <span className="ai-action-desc">
            Schedule today&apos;s tasks strictly fitted to {availableHours}h capacity.
          </span>
        </button>

        <button
          type="button"
          className={`ai-action-card-btn ai-action-2 ${activeTab === "PRIORITIZE" ? "active" : ""}`}
          onClick={handlePrioritizeTasks}
          disabled={loading}
        >
          <div className="ai-action-title">
            <TrendingUp size={16} style={{ color: "var(--ai-prioritize-color, var(--secondary))" }} />
            <span>Smart Prioritization</span>
          </div>
          <span className="ai-action-desc">
            Rank pending backlog across all goals into P1-P4 tiers.
          </span>
        </button>

        <button
          type="button"
          className={`ai-action-card-btn ai-action-3 ${activeTab === "NEXT_TASK" ? "active" : ""}`}
          onClick={handleGetNextTask}
          disabled={loading}
        >
          <div className="ai-action-title">
            <Brain size={16} style={{ color: "var(--accent-strong, var(--primary))" }} />
            <span>Next Best Task</span>
          </div>
          <span className="ai-action-desc">
            Instant recommendation for what single task to execute right now.
          </span>
        </button>

        <button
          type="button"
          className={`ai-action-card-btn ai-action-4 ${activeTab === "ROADMAP" ? "active" : ""}`}
          onClick={() => setActiveTab("ROADMAP")}
          disabled={loading}
        >
          <div className="ai-action-title">
            <Target size={16} style={{ color: "var(--ai-roadmap-color, var(--accent))" }} />
            <span>Roadmap Generator</span>
          </div>
          <span className="ai-action-desc">
            Generate strategic multi-day roadmap & breakdown for new topics.
          </span>
        </button>
      </div>

      {/* 3. Main Workspace Display */}
      <div className="planner-workspace-card">
        {loading ? (
          <div style={{ padding: "40px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <RefreshCw size={28} className="spin-animate" style={{ color: "var(--primary)" }} />
            <p style={{ fontFamily: "var(--font-lora-fallback)", color: "var(--text-muted)" }}>
              Running Phase 2 AI Agents against live Digital Twin telemetry...
            </p>
          </div>
        ) : activeTab === "DAILY_PLAN" ? (
          /* TAB 1: Daily Execution Plan */
          <div>
            <div className="planner-section-header">
              <h3>
                <Calendar size={18} style={{ color: "var(--primary)" }} />
                Today&apos;s Capacity-Aware Daily Plan
              </h3>
              {dailyPlan && (
                <div className="capacity-summary-badge">
                  <span>Planned: <strong>{dailyPlan.total_planned_minutes} min</strong></span>
                  <span>&bull;</span>
                  <span>Buffer Remaining: <strong>{dailyPlan.remaining_capacity_minutes} min</strong></span>
                </div>
              )}
            </div>

            {!dailyPlan ? (
              <div style={{ textAlign: "center", padding: "36px 20px" }}>
                <p style={{ fontFamily: "var(--font-lora-fallback)", color: "var(--text-muted)" }}>
                  Click &quot;Daily Execution Plan&quot; above to synthesize an optimized schedule.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                {dailyPlan.summary && (
                  <p style={{ fontFamily: "var(--font-lora-fallback)", fontSize: "13px", color: "var(--text)", background: "var(--surface-secondary)", padding: "12px 16px", borderRadius: "10px" }}>
                    {dailyPlan.summary}
                  </p>
                )}

                <div className="scheduled-plan-list">
                  {dailyPlan.planned_tasks?.map((pt) => (
                    <div key={pt.task_id} className="plan-item-card">
                      <div className="plan-rank-badge">#{pt.rank}</div>
                      <div className="plan-item-content">
                        <span className="plan-item-title">{pt.task_title}</span>
                        <p className="plan-item-reason">{pt.reason}</p>
                        <div className="plan-item-meta">
                          <span><Clock size={11} style={{ display: "inline", marginRight: "3px" }} />{pt.estimated_minutes} min</span>
                          <span>&bull;</span>
                          <span>Priority: {pt.priority}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "PRIORITIZE" ? (
          /* TAB 2: Smart Prioritization */
          <div>
            <div className="planner-section-header">
              <h3>
                <TrendingUp size={18} style={{ color: "var(--secondary)" }} />
                Ranked Priority Tiers (Cross-Goal Backlog)
              </h3>
              {prioritizedData && (
                <span className="capacity-summary-badge">
                  {prioritizedData.prioritized_tasks?.length || 0} Tasks Evaluated
                </span>
              )}
            </div>

            {!prioritizedData ? (
              <div style={{ textAlign: "center", padding: "36px 20px" }}>
                <p style={{ fontFamily: "var(--font-lora-fallback)", color: "var(--text-muted)" }}>
                  Click &quot;Smart Prioritization&quot; above to rank all tasks.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                {prioritizedData.focus_recommendation && (
                  <div style={{ background: "var(--surface-secondary)", borderLeft: "4px solid var(--primary)", padding: "12px 16px", borderRadius: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "var(--primary)" }}>Focus Recommendation</span>
                    <p style={{ fontFamily: "var(--font-lora-fallback)", fontSize: "13px", marginTop: "4px", color: "var(--text)" }}>
                      {prioritizedData.focus_recommendation}
                    </p>
                  </div>
                )}

                <div className="scheduled-plan-list">
                  {prioritizedData.prioritized_tasks?.map((pt) => (
                    <div key={pt.task_id} className="plan-item-card">
                      <div className="plan-rank-badge">#{pt.rank}</div>
                      <div className="plan-item-content">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                          <span className="plan-item-title">{pt.task_title}</span>
                          <span className={`tier-header-badge tier-${pt.priority_tier?.toLowerCase().substring(0, 2) || "p3"}`}>
                            {pt.priority_tier}
                          </span>
                        </div>
                        <p className="plan-item-reason">{pt.reasoning}</p>
                        <div className="plan-item-meta">
                          <span>Goal: {pt.goal_title}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "NEXT_TASK" ? (
          /* TAB 3: Next Best Task */
          <div>
            <div className="planner-section-header">
              <h3>
                <Brain size={18} style={{ color: "var(--primary)" }} />
                Instant Task Recommendation
              </h3>
            </div>

            {!nextTaskData ? (
              <div style={{ textAlign: "center", padding: "36px 20px" }}>
                <p style={{ fontFamily: "var(--font-lora-fallback)", color: "var(--text-muted)" }}>
                  Click &quot;Next Best Task&quot; above to calculate the highest leverage action.
                </p>
              </div>
            ) : (
              <div style={{ marginTop: "16px" }}>
                <div className="next-task-hero-card">
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "var(--primary)", letterSpacing: "0.05em" }}>
                      Highest Leverage Focus Item
                    </span>
                    <h4 className="next-task-hero-title" style={{ marginTop: "4px" }}>
                      {nextTaskData.task_title}
                    </h4>
                    <div className="plan-item-meta" style={{ marginTop: "6px" }}>
                      <span>Goal: {nextTaskData.goal_title}</span>
                      <span>&bull;</span>
                      <span>Duration: {nextTaskData.estimated_minutes} min</span>
                      <span>&bull;</span>
                      <span>Difficulty: {nextTaskData.difficulty || "Medium"}</span>
                    </div>
                  </div>

                  <p style={{ fontFamily: "var(--font-lora-fallback)", fontSize: "14px", color: "var(--text)", lineHeight: "1.6" }}>
                    <strong>Why this task:</strong> {nextTaskData.reason}
                  </p>

                  <div className="next-task-kickoff-box">
                    <span>Immediate Kickoff Action</span>
                    <p>{nextTaskData.suggested_action}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* TAB 4: Roadmap Generator */
          <div>
            <div className="planner-section-header">
              <h3>
                <Target size={18} style={{ color: "var(--accent)" }} />
                AI Strategic Roadmap Generator
              </h3>
            </div>

            <form onSubmit={handleGenerateRoadmap} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px" }}>
                <div className="form-field-group">
                  <label>Learning / Project Goal</label>
                  <input
                    type="text"
                    className="form-input-control"
                    placeholder="e.g. Master Docker & Kubernetes"
                    value={roadmapInput.goal}
                    onChange={(e) => setRoadmapInput({ ...roadmapInput, goal: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label>Target Days</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    className="form-input-control"
                    value={roadmapInput.days}
                    onChange={(e) => setRoadmapInput({ ...roadmapInput, days: Number(e.target.value) })}
                  />
                </div>

                <div className="form-field-group">
                  <label>Daily Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    className="form-input-control"
                    value={roadmapInput.hours}
                    onChange={(e) => setRoadmapInput({ ...roadmapInput, hours: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn-primary-action" disabled={loading || !roadmapInput.goal.trim()}>
                  <Sparkles size={14} />
                  {loading ? "Generating..." : "Generate AI Roadmap"}
                </button>
              </div>
            </form>

            {roadmapResult && (
              <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <h4 style={{ fontFamily: "var(--font-nunito-fallback)", fontSize: "16px", fontWeight: 800, color: "var(--text)" }}>
                  Roadmap for &quot;{roadmapResult.goal}&quot;
                </h4>
                <div className="ai-output-container">
                  <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                    {roadmapResult.plan}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
