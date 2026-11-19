"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { Cpu } from "lucide-react";

interface DeviceInfo {
  id: string;
  name: string;
  deviceIdentifier: string;
  apiKeyPrefix: string;
  location: string | null;
}

export function DeviceConfigSection({ deviceId }: { deviceId: string | null }) {
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(!!deviceId);
  const [form, setForm] = useState({ name: "", location: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!deviceId) return;
    fetch(`/api/devices/${deviceId}`)
      .then((r) => r.json())
      .then((data) => {
        setDevice(data.device);
        setForm({ name: data.device.name, location: data.device.location ?? "" });
        setLoading(false);
      });
  }, [deviceId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId) return;
    setSaving(true);
    const res = await fetch(`/api/devices/${deviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not save device.");
      return;
    }
    toast.success("Device configuration updated.");
  };

  if (loading) return <LoadingState label="Loading device configuration..." />;
  if (!device) {
    return (
      <EmptyState icon={Cpu} title="No device to configure" description="Add a device first from the Devices page." />
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Device Configuration</CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Device name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input label="Device identifier" value={device.deviceIdentifier} disabled />
          <Input label="API key" value={device.apiKeyPrefix} disabled hint="Manage from the device detail page" />
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving}>
              Save device
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
