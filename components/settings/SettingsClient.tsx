"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { ProfileSection } from "./ProfileSection";
import { DeviceConfigSection } from "./DeviceConfigSection";
import { ThresholdSettingsSection } from "./ThresholdSettingsSection";

const TABS = [
  { value: "profile", label: "Profile" },
  { value: "device", label: "Device" },
  { value: "thresholds", label: "Thresholds & Alerts" },
];

export function SettingsClient({
  user,
  deviceId,
}: {
  user: { name: string; email: string };
  deviceId: string | null;
}) {
  const [tab, setTab] = useState("profile");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-foreground-muted">Manage your profile, device and alert preferences</p>
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "profile" && <ProfileSection user={user} />}
      {tab === "device" && <DeviceConfigSection deviceId={deviceId} />}
      {tab === "thresholds" && <ThresholdSettingsSection deviceId={deviceId} />}
    </div>
  );
}
