"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  Target,
  AlertCircle,
  Activity,
  Layers,
} from "lucide-react";
import { getDigitalTwin, getGoals, getTasks } from "../../lib/api";
import "./analytics.css";

export default function AnalyticsView() {
  const [digitalTwin, setDigitalTwin] = useState(null);
  const [goals, setGoals] = useState([]);
  const [goalTasksMap, setGoalTasksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dt, gList] = await Promise.all([
        getDigitalTwin().catch(() => null),
        getGoals().catch(() => []),
      ]);
      setDigitalTwin(dt);
      setGoals(gList);

      const tasksMap = {};
      await Promise.all(
        gList.map(async (g) => {
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
      console.error("Error loading analytics data:", err);
      setError("Failed to load telemetry analytics. Ensure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Calculations derived directly from real backend data
  const totalGoals = goals.length;
  let totalTasks = 0;
  let completedTasks = 0;
  let highPriorityTasks = 0;
  let mediumPriorityTasks = 0;
  let lowPriorityTasks = 0;

  goals.forEach((g) => {
    const tList = goalTasksMap[g.id] || [];
    totalTasks += tList.length;
    completedTasks += tList.filter((t) => t.completed).length;

    const prio = (g.priority || "Medium").toLowerCase();
    if (prio === "high") highPriorityTasks += tList.length;
    else if (prio === "low") lowPriorityTasks += tList.length;
    else mediumPriorityTasks += tList.length;
  });

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const pendingTasks = totalTasks - completedTasks;

  return (
    <div className="analytics-container">
      {/* Backend Error Alert */}
      {error && (
        <div style={{ background: "var(--surface-secondary)", border: "1px solid var(--primary)", borderRadius: "12px", padding: "14px", color: "var(--primary)", display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* 1. KPI Telemetry Metric Cards */}
      <div className="analytics-metrics-grid">
        <div className="analytics-kpi-card">
          <div className="analytics-kpi-icon" style={{ color: "var(--stat-1-color, var(--primary))" }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="analytics-kpi-info">
            <span className="analytics-kpi-label">Completion Rate</span>
            <span className="analytics-kpi-value">{completionRate}%</span>
            <span className="analytics-kpi-sub">{completedTasks} of {totalTasks} tasks done</span>
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="analytics-kpi-icon" style={{ color: "var(--stat-2-color, var(--secondary))" }}>
            <Target size={24} />
          </div>
          <div className="analytics-kpi-info">
            <span className="analytics-kpi-label">Active Goals</span>
            <span className="analytics-kpi-value">{totalGoals}</span>
            <span className="analytics-kpi-sub">Strategic roadmaps</span>
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="analytics-kpi-icon" style={{ color: "var(--stat-3-color, var(--accent))" }}>
            <TrendingUp size={24} />
          </div>
          <div className="analytics-kpi-info">
            <span className="analytics-kpi-label">Workload Pressure</span>
            <span className="analytics-kpi-value">{digitalTwin?.workload_pressure || "Optimal"}</span>
            <span className="analytics-kpi-sub">{pendingTasks} pending tasks</span>
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="analytics-kpi-icon" style={{ color: "var(--stat-4-color, var(--primary))" }}>
            <Clock size={24} />
          </div>
          <div className="analytics-kpi-info">
            <span className="analytics-kpi-label">Deadline Pressure</span>
            <span className="analytics-kpi-value">{digitalTwin?.deadline_pressure || "Low"}</span>
            <span className="analytics-kpi-sub">Digital Twin live state</span>
          </div>
        </div>
      </div>

      {/* 2. Main Analytics Sections */}
      <div className="analytics-main-grid">
        {/* Left Card: Execution Progress by Goal */}
        <div className="analytics-section-card">
          <div className="analytics-card-header">
            <h3>
              <Target size={18} style={{ color: "var(--primary)" }} />
              Execution Progress by Goal
            </h3>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)" }}>
              {goals.length} Goals
            </span>
          </div>

          {loading ? (
            <p style={{ fontFamily: "var(--font-lora-fallback)", color: "var(--text-muted)" }}>Loading metrics...</p>
          ) : goals.length === 0 ? (
            <p style={{ fontFamily: "var(--font-lora-fallback)", color: "var(--text-muted)" }}>
              No goals tracked yet. Create goals on the Goals page to see progress trends.
            </p>
          ) : (
            <div className="distribution-bars-list">
              {goals.map((goal) => {
                const gTasks = goalTasksMap[goal.id] || [];
                const gDone = gTasks.filter((t) => t.completed).length;
                const gPct = gTasks.length > 0 ? Math.round((gDone / gTasks.length) * 100) : 0;

                return (
                  <div key={goal.id} className="distribution-item">
                    <div className="dist-label-row">
                      <span>{goal.title}</span>
                      <span>{gDone}/{gTasks.length} ({gPct}%)</span>
                    </div>
                    <div className="dist-bar-track">
                      <div
                        className="dist-bar-fill"
                        style={{
                          width: `${gPct}%`,
                          backgroundColor: "var(--progress-fill, var(--primary))",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Card: Workload & Priority Distribution */}
        <div className="analytics-section-card">
          <div className="analytics-card-header">
            <h3>
              <Layers size={18} style={{ color: "var(--secondary)" }} />
              Priority & Status Distribution
            </h3>
          </div>

          <div className="distribution-bars-list">
            <div className="distribution-item">
              <div className="dist-label-row">
                <span>Completed Tasks</span>
                <span>{completedTasks} tasks ({completionRate}%)</span>
              </div>
              <div className="dist-bar-track">
                <div
                  className="dist-bar-fill"
                  style={{ width: `${completionRate}%`, backgroundColor: "var(--success, #F9F871)" }}
                />
              </div>
            </div>

            <div className="distribution-item">
              <div className="dist-label-row">
                <span>Pending Execution Tasks</span>
                <span>{pendingTasks} tasks ({100 - completionRate}%)</span>
              </div>
              <div className="dist-bar-track">
                <div
                  className="dist-bar-fill"
                  style={{ width: `${100 - completionRate}%`, backgroundColor: "var(--primary, #FF6F91)" }}
                />
              </div>
            </div>

            <div className="distribution-item" style={{ marginTop: "8px" }}>
              <div className="dist-label-row">
                <span>High Priority Goal Tasks</span>
                <span>{highPriorityTasks} tasks</span>
              </div>
              <div className="dist-bar-track">
                <div
                  className="dist-bar-fill"
                  style={{
                    width: totalTasks > 0 ? `${Math.round((highPriorityTasks / totalTasks) * 100)}%` : "0%",
                    backgroundColor: "var(--accent, #FF9671)",
                  }}
                />
              </div>
            </div>

            <div className="distribution-item">
              <div className="dist-label-row">
                <span>Medium Priority Goal Tasks</span>
                <span>{mediumPriorityTasks} tasks</span>
              </div>
              <div className="dist-bar-track">
                <div
                  className="dist-bar-fill"
                  style={{
                    width: totalTasks > 0 ? `${Math.round((mediumPriorityTasks / totalTasks) * 100)}%` : "0%",
                    backgroundColor: "var(--secondary, #FF9671)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Live Telemetry Summary */}
          {digitalTwin?.summary && (
            <div className="telemetry-summary-box" style={{ marginTop: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "var(--primary)" }}>
                Digital Twin Synthesis
              </span>
              <p>{digitalTwin.summary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
