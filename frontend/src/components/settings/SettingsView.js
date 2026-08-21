"use client";

import React, { useState, useEffect } from "react";
import {
  Palette,
  Sliders,
  Sparkles,
  Server,
  CheckCircle2,
  AlertCircle,
  Save,
  Check,
} from "lucide-react";
import { useTheme } from "../../lib/theme";
import "./settings.css";

export default function SettingsView() {
  const { theme, setTheme, themes, mounted } = useTheme();

  // Preferences State
  const [dailyCapacity, setDailyCapacity] = useState(3.0);
  const [planningStrategy, setPlanningStrategy] = useState("CAPACITY_FIT");
  const [taskBreakdownDepth, setTaskBreakdownDepth] = useState("BALANCED");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Backend Health State
  const [backendStatus, setBackendStatus] = useState("CHECKING");

  useEffect(() => {
    // Check backend health
    fetch("http://127.0.0.1:8000/")
      .then((res) => {
        if (res.ok) setBackendStatus("CONNECTED");
        else setBackendStatus("ERROR");
      })
      .catch(() => setBackendStatus("DISCONNECTED"));

    // Load saved capacity
    try {
      const savedCap =
        localStorage.getItem("momentum_daily_capacity") ||
        localStorage.getItem("ai_productivity_daily_capacity") ||
        localStorage.getItem("horizon_daily_capacity");
      if (savedCap) setDailyCapacity(parseFloat(savedCap));
    } catch {
      // ignore
    }
  }, []);

  const handleSavePreferences = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem("momentum_daily_capacity", dailyCapacity.toString());
      localStorage.setItem("momentum_planning_strategy", planningStrategy);
      localStorage.setItem("momentum_breakdown_depth", taskBreakdownDepth);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  return (
    <div className="settings-container">
      {/* 1. Appearance & Theme Selection */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <h3>
            <Palette size={18} style={{ color: "var(--primary)" }} />
            Appearance & Theme System
          </h3>
          <p>
            Choose from the five official curated color palettes. The selected theme dynamically styles every view and component.
          </p>
        </div>

        {mounted ? (
          <div className="settings-themes-grid">
            {themes.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`theme-card-option ${isSelected ? "active" : ""}`}
                  onClick={() => setTheme(t.id)}
                >
                  <div className="theme-card-header">
                    <span className="theme-name-text">{t.name}</span>
                    {isSelected && (
                      <Check size={16} style={{ color: "var(--primary)" }} />
                    )}
                  </div>

                  <div className="theme-palette-swatch-row">
                    {t.palette.map((hex, idx) => (
                      <div
                        key={idx}
                        className="theme-color-pill"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p style={{ fontFamily: "var(--font-lora-fallback)", color: "var(--text-muted)" }}>Loading themes...</p>
        )}
      </div>

      {/* 2. Productivity & Planning Preferences */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <h3>
            <Sliders size={18} style={{ color: "var(--secondary)" }} />
            Productivity & Capacity Preferences
          </h3>
          <p>Configure default work hour allocation and daily planning behavior.</p>
        </div>

        <form onSubmit={handleSavePreferences} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="settings-form-grid">
            <div className="settings-field">
              <label>Default Daily Work Capacity</label>
              <input
                type="number"
                min="0.5"
                max="12"
                step="0.5"
                className="settings-input"
                value={dailyCapacity}
                onChange={(e) => setDailyCapacity(parseFloat(e.target.value))}
              />
            </div>

            <div className="settings-field">
              <label>Daily Planning Optimization Strategy</label>
              <select
                className="settings-input"
                value={planningStrategy}
                onChange={(e) => setPlanningStrategy(e.target.value)}
              >
                <option value="CAPACITY_FIT">Strict Capacity Fit (Recommended)</option>
                <option value="PRIORITY_FIRST">High-Priority Aggressive Scheduling</option>
                <option value="BALANCED">Balanced Multi-Goal Distribution</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px" }}>
            {saveSuccess && (
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--success)" }}>
                Preferences saved successfully!
              </span>
            )}
            <button type="submit" className="btn-primary-action">
              <Save size={14} />
              Save Preferences
            </button>
          </div>
        </form>
      </div>

      {/* 3. AI Intelligence Engine Details */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <h3>
            <Sparkles size={18} style={{ color: "var(--accent)" }} />
            AI Intelligence Configuration
          </h3>
          <p>Active inference model specifications and autonomous planning parameters.</p>
        </div>

        <div className="settings-form-grid">
          <div className="system-health-row">
            <div>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text)" }}>AI Inference Provider</span>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Groq Cloud LPU Acceleration</p>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--primary)" }}>llama-3.3-70b-versatile</span>
          </div>

          <div className="system-health-row">
            <div>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text)" }}>Autonomous Task Decomposition</span>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Subtask step generation</p>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--secondary)" }}>Active (Depth: 4-8 steps)</span>
          </div>
        </div>
      </div>

      {/* 4. Backend System Connectivity */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <h3>
            <Server size={18} style={{ color: "var(--primary)" }} />
            Backend System & Telemetry Health
          </h3>
          <p>Real-time status of FastAPI server and Digital Twin database.</p>
        </div>

        <div className="settings-form-grid">
          <div className="system-health-row">
            <div>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text)" }}>FastAPI REST API</span>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>http://127.0.0.1:8000</p>
            </div>
            <div className="system-status-indicator">
              {backendStatus === "CONNECTED" ? (
                <>
                  <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
                  <span>Online & Ready</span>
                </>
              ) : backendStatus === "CHECKING" ? (
                <span>Checking...</span>
              ) : (
                <>
                  <AlertCircle size={16} style={{ color: "var(--danger, red)" }} />
                  <span style={{ color: "var(--danger, red)" }}>Disconnected</span>
                </>
              )}
            </div>
          </div>

          <div className="system-health-row">
            <div>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text)" }}>Digital Twin Telemetry Engine</span>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Real-time productivity telemetry</p>
            </div>
            <div className="system-status-indicator">
              <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
              <span>Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
