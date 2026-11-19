"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { LoadingState } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { SlidersHorizontal } from "lucide-react";

interface Config {
  maxVoltage: number;
  minVoltage: number;
  maxCurrent: number;
  maxPower: number;
  maxImbalance: number;
  minPowerFactor: number;
  notifyHighVoltage: boolean;
  notifyLowVoltage: boolean;
  notifyOvercurrent: boolean;
  notifyImbalance: boolean;
  notifyPoorPF: boolean;
  notifyDeviceOffline: boolean;
}

export function ThresholdSettingsSection({ deviceId }: { deviceId: string | null }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(!!deviceId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!deviceId) return;
    fetch(`/api/devices/${deviceId}`)
      .then((r) => r.json())
      .then((data) => {
        setConfig(data.config);
        setLoading(false);
      });
  }, [deviceId]);

  const save = async () => {
    if (!deviceId || !config) return;
    setSaving(true);
    const res = await fetch(`/api/devices/${deviceId}/config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not save settings.");
      return;
    }
    toast.success("Threshold settings updated.");
  };

  if (loading) return <LoadingState label="Loading thresholds..." />;
  if (!deviceId || !config) {
    return (
      <EmptyState icon={SlidersHorizontal} title="No device to configure" description="Add a device first from the Devices page." />
    );
  }

  const num = (key: keyof Config) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setConfig({ ...config, [key]: Number(e.target.value) });
  const bool = (key: keyof Config) => (checked: boolean) => setConfig({ ...config, [key]: checked });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Threshold Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 pt-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Max voltage (V)" type="number" value={config.maxVoltage} onChange={num("maxVoltage")} />
          <Input label="Min voltage (V)" type="number" value={config.minVoltage} onChange={num("minVoltage")} />
          <Input label="Max current (A)" type="number" value={config.maxCurrent} onChange={num("maxCurrent")} />
          <Input label="Max power (W)" type="number" value={config.maxPower} onChange={num("maxPower")} />
          <Input label="Max imbalance (%)" type="number" value={config.maxImbalance} onChange={num("maxImbalance")} />
          <Input
            label="Min power factor"
            type="number"
            step="0.01"
            value={config.minPowerFactor}
            onChange={num("minPowerFactor")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border-subtle pt-3">
          <Switch
            label="High voltage alerts"
            description="Notify when voltage exceeds the configured maximum"
            checked={config.notifyHighVoltage}
            onChange={bool("notifyHighVoltage")}
          />
          <Switch
            label="Low voltage alerts"
            description="Notify when voltage drops below the configured minimum"
            checked={config.notifyLowVoltage}
            onChange={bool("notifyLowVoltage")}
          />
          <Switch
            label="Overcurrent alerts"
            description="Notify when current exceeds the configured maximum"
            checked={config.notifyOvercurrent}
            onChange={bool("notifyOvercurrent")}
          />
          <Switch
            label="Imbalance alerts"
            description="Notify when voltage or current imbalance exceeds the threshold"
            checked={config.notifyImbalance}
            onChange={bool("notifyImbalance")}
          />
          <Switch
            label="Poor power factor alerts"
            description="Notify when power factor drops below the configured minimum"
            checked={config.notifyPoorPF}
            onChange={bool("notifyPoorPF")}
          />
          <Switch
            label="Device offline alerts"
            description="Notify when a device stops reporting"
            checked={config.notifyDeviceOffline}
            onChange={bool("notifyDeviceOffline")}
          />
        </CardContent>
      </Card>

      <Button loading={saving} onClick={save}>
        Save settings
      </Button>
    </div>
  );
}
