import React from "react";
import AppShell from "../../components/layout/AppShell";
import AnalyticsView from "../../components/analytics/AnalyticsView";

export const metadata = {
  title: "Analytics",
  description: "Telemetry, workload pressure analysis, and goal execution metrics.",
};

export default function AnalyticsPage() {
  return (
    <AppShell
      pageTitle="Analytics & Insights"
      pageSubtitle="Telemetry, workload pressure analysis, and goal execution metrics"
    >
      <AnalyticsView />
    </AppShell>
  );
}
