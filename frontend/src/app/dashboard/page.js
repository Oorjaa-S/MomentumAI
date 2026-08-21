import React from "react";
import AppShell from "../../components/layout/AppShell";
import DashboardView from "../../components/dashboard/DashboardView";

export const metadata = {
  title: "Dashboard",
  description: "Real-time goal orchestration, telemetry, and AI productivity execution engine.",
};

export default function DashboardPage() {
  return (
    <AppShell
      pageTitle="Dashboard"
      pageSubtitle="Your Personal Execution System & Digital Twin"
    >
      <DashboardView />
    </AppShell>
  );
}
