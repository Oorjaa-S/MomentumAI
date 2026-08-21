"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme, THEMES } from "../../lib/theme";
import { Palette, Check } from "lucide-react";

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="theme-selector-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="theme-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select theme"
        title={`Current theme: ${currentThemeObj.name}`}
      >
        <Palette size={18} className="theme-toggle-icon" />
        <span className="theme-toggle-label">{currentThemeObj.name}</span>
        <div className="theme-mini-swatches">
          {currentThemeObj.palette.slice(0, 3).map((color, idx) => (
            <span
              key={idx}
              className="mini-swatch-dot"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </button>

      {isOpen && (
        <div className="theme-dropdown-menu">
          <div className="theme-dropdown-header">
            <span>Select Workspace Theme</span>
          </div>
          <div className="theme-options-list">
            {THEMES.map((t) => {
              const isSelected = t.id === theme;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`theme-option-item ${isSelected ? "selected" : ""}`}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="theme-option-info">
                    <span className="theme-option-name">{t.name}</span>
                    <div className="theme-option-palette">
                      {t.palette.map((color, idx) => (
                        <span
                          key={idx}
                          className="theme-palette-pill"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="theme-check-icon" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
