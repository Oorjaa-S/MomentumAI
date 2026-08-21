import React from "react";
import AppShell from "../../components/layout/AppShell";
import SettingsView from "../../components/settings/SettingsView";

export const metadata = {
  title: "Settings",
  description: "Evaluate and configure active color themes across all workspace views.",
};

export default function ThemeTestPage() {
  return (
    <AppShell
      pageTitle="Theme System & Settings"
      pageSubtitle="Evaluate and configure active color themes across all workspace views"
    >
      <SettingsView />
    </AppShell>
  );
}
