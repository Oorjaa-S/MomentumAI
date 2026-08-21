import React from "react";
import AppShell from "../../components/layout/AppShell";
import PlannerView from "../../components/planner/PlannerView";

export const metadata = {
  title: "AI Planner",
  description: "Synthesize capacity-aware daily plans, prioritize backlogs, and get AI recommendations.",
};

export default function PlannerPage() {
  return (
    <AppShell
      pageTitle="AI Planner"
      pageSubtitle="Synthesize capacity-aware daily plans, prioritize backlogs, and get AI recommendations"
    >
      <PlannerView />
    </AppShell>
  );
}
