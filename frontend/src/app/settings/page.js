import React from "react";
import AppShell from "../../components/layout/AppShell";
import SettingsView from "../../components/settings/SettingsView";

export const metadata = {
  title: "Settings",
  description: "Configure workspace theme, daily productivity capacity, and system preferences.",
};

export default function SettingsPage() {
  return (
    <AppShell
      pageTitle="Settings & Configuration"
      pageSubtitle="Configure workspace theme, daily productivity capacity, and system preferences"
    >
      <SettingsView />
    </AppShell>
  );
}
