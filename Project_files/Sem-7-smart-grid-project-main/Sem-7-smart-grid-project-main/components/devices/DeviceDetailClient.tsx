"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, Trash2, Wifi, WifiOff, Copy, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/Loading";
import { relativeTime } from "@/lib/utils";
import { PHASE_LABELS, type PhaseKey } from "@/types";

interface DeviceDetail {
  id: string;
  name: string;
  deviceIdentifier: string;
  apiKeyPrefix: string;
  location: string | null;
  lastSeenAt: string | null;
  wifiSignal: number | null;
  demoMode: boolean;
  connectionStatus: "online" | "offline" | "provisioning";
  ipAddress: string | null;
  pollInterval: number | null;
}

interface SensorStatus {
  phase: PhaseKey;
  connected: boolean;
  lastReading: string | null;
}

const STATUS_TONE = { online: "green", offline: "red", provisioning: "amber" } as const;

export function DeviceDetailClient({ deviceId }: { deviceId: string }) {
  const router = useRouter();
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [sensorStatus, setSensorStatus] = useState<SensorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", location: "", ipAddress: "" });
  const [saving, setSaving] = useState(false);
  const [polling, setPolling] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = () => {
    fetch(`/api/devices/${deviceId}`)
      .then((r) => r.json())
      .then((data) => {
        setDevice(data.device);
        setSensorStatus(data.sensorStatus ?? []);
        setForm({
          name: data.device.name,
          location: data.device.location ?? "",
          ipAddress: data.device.ipAddress ?? "",
        });
        setLoading(false);
      });
  };

  const pollNow = async () => {
    if (!device?.ipAddress) {
      toast.error("Assign an IP address to this device first.");
      return;
    }
    setPolling(true);
    try {
      const res = await fetch(`/api/devices/${deviceId}/poll`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully polled ESP32 at ${device.ipAddress}! Ingested fresh readings.`);
        load();
      } else {
        toast.error(data.error ?? "Failed to poll ESP32.");
      }
    } catch {
      toast.error("Network error while communicating with ESP32.");
    } finally {
      setPolling(false);
    }
  };

  useEffect(load, [deviceId]);

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/devices/${deviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not save changes.");
      return;
    }
    toast.success("Device updated.");
    load();
  };

  const toggleDemo = async (enabled: boolean) => {
    await fetch("/api/demo/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, enabled }),
    });
    load();
  };

  const regenerateKey = async () => {
    const res = await fetch(`/api/devices/${deviceId}/regenerate-key`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast.error("Could not regenerate key.");
      return;
    }
    setNewKey(data.apiKey);
    load();
  };

  const deleteDevice = async () => {
    const res = await fetch(`/api/devices/${deviceId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete device.");
      return;
    }
    toast.success("Device deleted.");
    router.push("/dashboard/devices");
  };

  if (loading || !device) return <LoadingState label="Loading device..." />;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/devices" className="flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to devices
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{device.name}</h1>
            <Badge tone={STATUS_TONE[device.connectionStatus]} dot>
              {device.connectionStatus}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-foreground-muted">{device.deviceIdentifier}</p>
        </div>

        {device.ipAddress && (
          <Button
            onClick={pollNow}
            disabled={polling}
            className="gap-2 bg-accent-blue hover:bg-accent-blue/90"
          >
            <RefreshCw className={`size-4 ${polling ? "animate-spin" : ""}`} />
            {polling ? "Fetching from ESP32..." : "Fetch Live Readings from ESP32"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted">
            {device.connectionStatus === "online" ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
            Last Seen
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{relativeTime(device.lastSeenAt)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Mapped IP Address</p>
          <p className="mt-1 font-mono text-base font-semibold text-foreground">
            {device.ipAddress ?? <span className="text-foreground-muted font-normal text-sm">Not assigned</span>}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Wi-Fi Signal</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{device.wifiSignal ? `${device.wifiSignal} dBm` : "—"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Demo Mode</p>
          <div className="mt-1">
            <Switch checked={device.demoMode} onChange={toggleDemo} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Sensor Status</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-3">
          {sensorStatus.map((s) => (
            <div key={s.phase} className="flex items-center justify-between rounded-xl border border-border-subtle p-3.5">
              <div>
                <p className="text-sm font-medium text-foreground">PZEM {s.phase}</p>
                <p className="text-xs text-foreground-muted">{PHASE_LABELS[s.phase]}</p>
              </div>
              {s.connected ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-accent-green">
                  <CheckCircle2 className="size-4" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-medium text-accent-red">
                  <XCircle className="size-4" /> Disconnected
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Device Configuration</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <form onSubmit={saveDetails} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Device name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <Input
              label="ESP32 IP Address"
              value={form.ipAddress}
              onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
              placeholder="192.168.1.45"
              hint="IP address of the ESP32 on your local Wi-Fi / Ethernet"
            />
            <div className="sm:col-span-2">
              <Button type="submit" loading={saving}>
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>API Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-3">
          <div className="flex items-center justify-between rounded-xl border border-border-subtle p-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">Current API key</p>
              <code className="text-xs text-foreground-muted">{device.apiKeyPrefix}</code>
            </div>
            <Button variant="outline" size="sm" onClick={regenerateKey} className="gap-1.5">
              <RefreshCw className="size-3.5" /> Regenerate
            </Button>
          </div>

          <div className="rounded-xl bg-surface-muted p-4">
            <p className="mb-2 text-xs font-medium text-foreground">ESP32 ingestion example</p>
            <pre className="overflow-x-auto text-xs text-foreground-muted">
{`POST ${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/iot/readings
Authorization: Bearer <DEVICE_API_KEY>
Content-Type: application/json

{
  "deviceId": "${device.deviceIdentifier}",
  "phases": {
    "R": { "voltage": 230.5, "current": 5.2, "power": 1100, "energy": 12.5, "frequency": 50.0, "powerFactor": 0.92 },
    "Y": { "voltage": 228.7, "current": 4.8, "power": 980,  "energy": 11.8, "frequency": 50.1, "powerFactor": 0.89 },
    "B": { "voltage": 232.1, "current": 6.1, "power": 1300, "energy": 13.4, "frequency": 49.9, "powerFactor": 0.94 }
  }
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card className="border-accent-red/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-accent-red">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground-muted">Permanently delete this device and all of its readings and alerts.</p>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)} className="gap-1.5">
              <Trash2 className="size-3.5" /> Delete device
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal open={!!newKey} onClose={() => setNewKey(null)} title="New API key generated">
        <div className="space-y-4">
          <p className="text-sm text-foreground-muted">
            The previous key has been revoked. Copy this new key now — it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-muted px-3 py-2.5">
            <code className="flex-1 overflow-x-auto text-xs text-foreground">{newKey}</code>
            <button
              onClick={() => {
                if (newKey) navigator.clipboard.writeText(newKey);
                toast.success("Copied to clipboard.");
              }}
              className="shrink-0 rounded-lg p-1.5 hover:bg-surface"
            >
              <Copy className="size-4 text-foreground-muted" />
            </button>
          </div>
          <Button className="w-full" onClick={() => setNewKey(null)}>
            Done
          </Button>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this device?"
        description="This will permanently remove the device, its readings and alert history. This cannot be undone."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteDevice}>
            Delete permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
}
