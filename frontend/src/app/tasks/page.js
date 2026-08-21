import React from "react";
import AppShell from "../../components/layout/AppShell";
import TasksView from "../../components/tasks/TasksView";

export const metadata = {
  title: "Tasks",
  description: "Search, filter, manage, and decompose execution tasks across all goals.",
};

export default function TasksPage() {
  return (
    <AppShell
      pageTitle="Tasks Execution"
      pageSubtitle="Search, filter, manage, and decompose execution tasks across all goals"
    >
      <TasksView />
    </AppShell>
  );
}