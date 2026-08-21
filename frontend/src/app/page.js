import React from "react";
import AppShell from "../components/layout/AppShell";
import DashboardView from "../components/dashboard/DashboardView";

export const metadata = {
  title: "Dashboard",
  description: "Real-time goal orchestration & AI execution engine.",
};

export default function HomePage() {
  return (
    <AppShell
      pageTitle="Productivity Dashboard"
      pageSubtitle="Real-time goal orchestration & AI execution engine"
    >
      <DashboardView />
    </AppShell>
  );
}
