"use client";

import React, { useState } from "react";
import { X, Sparkles, CheckCircle, Clock, ArrowRight, ListChecks, Compass } from "lucide-react";

export default function AIModal({ isOpen, onClose, actionType, goalData, onTaskActionCompleted }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const getTitle = () => {
    switch (actionType) {
      case "daily-plan":
        return "AI Daily Execution Schedule";
      case "prioritize":
        return "Smart Cross-Goal Prioritization";
      case "next-task":
        return "AI Next Best Task Recommendation";
      case "breakdown":
        return "AI Task Breakdown & Subtasks";
      case "roadmap":
        return "Long-Term Goal Roadmap";
      default:
        return "AI Productivity Intelligence";
    }
  };

  return (
    <div className="modal-overlay-backdrop" onClick={onClose}>
      <div className="modal-card-box" style={{ maxWidth: "680px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <h3>
            <Sparkles size={20} style={{ display: "inline", marginRight: "8px", color: "var(--primary)" }} />
            {getTitle()}
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ color: "var(--danger)", fontSize: "13px", fontWeight: "700" }}>
            {error}
          </div>
        )}

        <div className="ai-output-container">
          {loading && (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <Sparkles size={28} className="theme-toggle-icon" style={{ animation: "spin 2s linear infinite" }} />
              <p style={{ marginTop: "12px", fontFamily: "var(--font-nunito-fallback)", fontWeight: "700" }}>
                AI Agents analyzing productivity state...
              </p>
            </div>
          )}

          {!loading && result && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Daily Plan Result */}
              {result.planned_tasks && (
                <div>
                  <h4 style={{ fontFamily: "var(--font-nunito-fallback)", marginBottom: "8px", color: "var(--primary)" }}>
                    Scheduled Tasks ({result.total_scheduled_minutes || 0} min / {result.available_minutes || 0} min capacity)
                  </h4>
                  <p style={{ marginBottom: "12px", fontSize: "14px" }}>{result.reasoning}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {result.planned_tasks.map((pt, idx) => (
                      <div key={idx} className="task-card-item">
                        <div className="task-card-left">
                          <CheckCircle size={16} style={{ color: "var(--primary)" }} />
                          <div className="task-text-group">
                            <span className="task-title-text">{pt.task_title || pt.title}</span>
                            <span className="task-sub-meta">Goal: #{pt.goal_id} &bull; {pt.estimated_minutes} min &bull; {pt.time_slot}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prioritized Tasks Result */}
              {result.prioritized_tasks && (
                <div>
                  <h4 style={{ fontFamily: "var(--font-nunito-fallback)", marginBottom: "8px", color: "var(--primary)" }}>
                    Ranked Urgency & Impact Queue
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {result.prioritized_tasks.map((pt, idx) => (
                      <div key={idx} className="task-card-item">
                        <div className="task-card-left">
                          <span className="badge-count">#{pt.rank || idx + 1}</span>
                          <div className="task-text-group">
                            <span className="task-title-text">{pt.task_title || pt.title}</span>
                            <span className="task-sub-meta">{pt.reasoning}</span>
                          </div>
                        </div>
                        <span className="badge-count" style={{ color: "var(--accent)" }}>
                          {pt.priority_score || pt.difficulty || "High"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Task Result */}
              {result.recommended_task && (
                <div>
                  <h4 style={{ fontFamily: "var(--font-nunito-fallback)", marginBottom: "8px", color: "var(--primary)" }}>
                    Recommended Next Action
                  </h4>
                  <div className="task-card-item" style={{ borderColor: "var(--primary)" }}>
                    <div className="task-card-left">
                      <ArrowRight size={18} style={{ color: "var(--primary)" }} />
                      <div className="task-text-group">
                        <span className="task-title-text" style={{ fontSize: "16px" }}>
                          {result.recommended_task.title}
                        </span>
                        <span className="task-sub-meta">Goal: #{result.recommended_task.goal_id}</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ marginTop: "12px", fontSize: "14px" }}>
                    <strong>Why this task:</strong> {result.recommendation_reason || result.reasoning}
                  </p>
                </div>
              )}

              {/* Task Breakdown Result */}
              {result.subtasks && (
                <div>
                  <h4 style={{ fontFamily: "var(--font-nunito-fallback)", marginBottom: "8px", color: "var(--primary)" }}>
                    Subtask Decompositions ({result.subtasks.length})
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {result.subtasks.map((st, idx) => (
                      <div key={idx} className="task-card-item">
                        <div className="task-card-left">
                          <ListChecks size={16} style={{ color: "var(--primary)" }} />
                          <div className="task-text-group">
                            <span className="task-title-text">{st.title}</span>
                            <span className="task-sub-meta">{st.estimated_minutes} min &bull; {st.description || st.notes || ""}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generic Roadmap or Analysis Output */}
              {result.plan && (
                <div>
                  <h4 style={{ fontFamily: "var(--font-nunito-fallback)", marginBottom: "8px", color: "var(--primary)" }}>
                    Roadmap & Execution Strategy
                  </h4>
                  <div style={{ whiteSpace: "pre-line", fontSize: "14px" }}>
                    {typeof result.plan === "string" ? result.plan : JSON.stringify(result.plan, null, 2)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer-actions">
          <button type="button" className="btn-primary-action" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
