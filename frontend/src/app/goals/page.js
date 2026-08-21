import React from "react";
import AppShell from "../../components/layout/AppShell";
import GoalsView from "../../components/goals/GoalsView";

export const metadata = {
  title: "Goals",
  description: "Define objectives, allocate capacity, and decompose strategic goals with AI.",
};

export default function GoalsPage() {
  return (
    <AppShell
      pageTitle="Strategic Goals"
      pageSubtitle="Define objectives, allocate capacity, and decompose goals with AI"
    >
      <GoalsView />
    </AppShell>
  );
}
