"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeSelector from "./ThemeSelector";
import "./app-shell.css";
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Sparkles,
  BarChart3,
  Settings,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { getDigitalTwin } from "../../lib/api";

export default function AppShell({
  children,
  pageTitle = "Dashboard",
  pageSubtitle = "Your Personal Execution System",
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [digitalTwin, setDigitalTwin] = useState(null);

  useEffect(() => {
    getDigitalTwin()
      .then((data) => setDigitalTwin(data))
      .catch(() => setDigitalTwin(null));
  }, [pathname]);

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Goals", href: "/goals", icon: Target },
    { label: "Tasks", href: "/tasks", icon: CheckSquare },
    { label: "AI Planner", href: "/ai-planner", icon: Sparkles },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const isItemActive = (itemHref) => {
    if (itemHref === "/") {
      return pathname === "/" || pathname === "/dashboard";
    }
    if (itemHref === "/tasks") {
      return pathname?.toLowerCase() === "/tasks";
    }
    if (itemHref === "/ai-planner") {
      return pathname === "/ai-planner" || pathname === "/planner";
    }
    if (itemHref === "/analytics") {
      return pathname === "/analytics" || pathname?.toLowerCase() === "/insights";
    }
    if (itemHref === "/settings") {
      return pathname === "/settings" || pathname === "/theme-test";
    }
    return pathname === itemHref || pathname?.startsWith(itemHref);
  };

  return (
    <div className="app-shell-container">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-mobile-overlay ${mobileOpen ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Main Sidebar */}
      <aside className={`app-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand-icon-box">
            <Zap size={22} />
          </div>
          <div className="brand-title-group">
            <span className="brand-title">MomentumAI</span>
            <span className="brand-subtitle">Your Personal Execution System</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Core Workspace</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`app-nav-item ${active ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={18} className="nav-item-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="twin-status-badge">
            <div className="twin-indicator-pulse" />
            <div className="twin-text-group">
              <span className="twin-label">Digital Twin</span>
              <span className="twin-status-value">
                {digitalTwin?.workload_pressure
                  ? `${digitalTwin.workload_pressure} Load`
                  : "Telemetry Active"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="app-main-wrapper">
        {/* Top Header */}
        <header className="app-header">
          <div className="header-left">
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="header-title-area">
              <h1 className="header-page-title">{pageTitle}</h1>
              <p className="header-subtitle">{pageSubtitle}</p>
            </div>
          </div>

          <div className="header-right">
            <ThemeSelector />
          </div>
        </header>

        {/* Content Area */}
        <main className="app-content-area">{children}</main>
      </div>
    </div>
  );
}
