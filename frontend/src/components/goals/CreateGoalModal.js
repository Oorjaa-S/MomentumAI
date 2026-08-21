"use client";

import React, { useState } from "react";
import { X, Target, Sparkles } from "lucide-react";
import { createGoal } from "../../lib/api";

export default function CreateGoalModal({ isOpen, onClose, onGoalCreated }) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("14 days");
  const [priority, setPriority] = useState("High");
  const [availableHours, setAvailableHours] = useState(2);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a goal title");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const newGoal = await createGoal({
        title: title.trim(),
        deadline: deadline.trim() || "14 days",
        priority,
        available_hours: Number(availableHours) || 2,
        notes: notes.trim(),
      });
      onGoalCreated(newGoal);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay-backdrop" onClick={onClose}>
      <div className="modal-card-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <h3>
            <Target size={20} style={{ display: "inline", marginRight: "8px", color: "var(--primary)" }} />
            Create New Goal
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

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field-group">
            <label htmlFor="goal-title">Goal Title</label>
            <input
              id="goal-title"
              type="text"
              className="form-input-control"
              placeholder="e.g., Master FastAPI & Next.js Architecture"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field-group">
              <label htmlFor="goal-priority">Priority</label>
              <select
                id="goal-priority"
                className="form-input-control"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="form-field-group">
              <label htmlFor="goal-hours">Daily Available Hours</label>
              <input
                id="goal-hours"
                type="number"
                min="1"
                max="24"
                className="form-input-control"
                value={availableHours}
                onChange={(e) => setAvailableHours(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field-group">
            <label htmlFor="goal-deadline">Target Deadline</label>
            <input
              id="goal-deadline"
              type="text"
              className="form-input-control"
              placeholder="e.g., 14 days, 3 weeks, 2026-09-01"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="form-field-group">
            <label htmlFor="goal-notes">Notes / Current Context</label>
            <textarea
              id="goal-notes"
              className="form-input-control"
              rows={3}
              placeholder="Add key milestones, current background or skill level..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-footer-actions">
            <button type="button" className="btn-secondary-action" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action" disabled={loading}>
              {loading ? "Creating..." : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
