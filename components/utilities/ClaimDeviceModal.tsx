"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Dropdown } from "@/components/ui/Dropdown";
import { Copy, CheckCircle2, Wifi } from "lucide-react";

interface NodeOption {
  id: string;
  name: string;
  device: { id: string } | null;
}

interface PendingDevice {
  id: string;
  deviceIdentifier: string;
  wifiSsid: string;
}

const MODE_TABS = [
  { value: "new", label: "Create new utility" },
  { value: "existing", label: "Attach to existing" },
];

export function ClaimDeviceModal({
  pendingDevice,
  open,
  onClose,
  onClaimed,
}: {
  pendingDevice: PendingDevice | null;
  open: boolean;
  onClose: () => void;
  onClaimed: () => void;
}) {
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [utilityNodeId, setUtilityNodeId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [location, setLocation] = useState("");
  const [nodeOptions, setNodeOptions] = useState<NodeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ apiKey: string } | null>(null);

  // Reset the form's defaults when a different pending device is opened —
  // adjusting state during render rather than in an Effect, per
  // https://react.dev/learn/you-might-not-need-an-effect
  const [prefilledForId, setPrefilledForId] = useState<string | null>(null);
  if (open && pendingDevice && pendingDevice.id !== prefilledForId) {
    setPrefilledForId(pendingDevice.id);
    setName(pendingDevice.wifiSsid);
    setDeviceName(pendingDevice.deviceIdentifier);
  }

  useEffect(() => {
    if (!open || !pendingDevice) return;
    fetch("/api/utility-nodes")
      .then((r) => r.json())
      .then((data) => setNodeOptions(data.nodes ?? []));
  }, [open, pendingDevice]);

  const handleClose = () => {
    setResult(null);
    setMode("new");
    setParentId("");
    setUtilityNodeId("");
    setLocation("");
    setPrefilledForId(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingDevice) return;
    if (mode === "existing" && !utilityNodeId) {
      toast.error("Select a utility to attach to.");
      return;
    }

    setLoading(true);
    const body =
      mode === "new"
        ? { mode, name, parentId: parentId || null, deviceName, location }
        : { mode, utilityNodeId, deviceName, location };

    const res = await fetch(`/api/devices/pending/${pendingDevice.id}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Could not claim device.");
      return;
    }

    setResult({ apiKey: data.apiKey });
    onClaimed();
  };

  const copyKey = () => {
    if (result) {
      navigator.clipboard.writeText(result.apiKey);
      toast.success("API key copied to clipboard.");
    }
  };

  if (!pendingDevice) return null;

  if (result) {
    return (
      <Modal open={open} onClose={handleClose} title="Device claimed and mapped">
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-accent-green-soft px-3 py-2.5 text-sm text-accent-green">
            <CheckCircle2 className="size-4 shrink-0" />
            Copy the API key now — it won&apos;t be shown again.
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-muted px-3 py-2.5">
            <code className="flex-1 overflow-x-auto text-xs text-foreground">{result.apiKey}</code>
            <button onClick={copyKey} className="shrink-0 rounded-lg p-1.5 hover:bg-surface">
              <Copy className="size-4 text-foreground-muted" />
            </button>
          </div>
          <Button className="w-full" onClick={handleClose}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  const availableNodes = nodeOptions.filter((n) => !n.device);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Map discovered device"
      description={
        <span className="flex items-center gap-1.5">
          <Wifi className="size-3.5" /> {pendingDevice.deviceIdentifier} — network &ldquo;{pendingDevice.wifiSsid}&rdquo;
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Tabs tabs={MODE_TABS} value={mode} onChange={(v) => setMode(v as "new" | "existing")} className="w-full" />

        {mode === "new" ? (
          <>
            <Input
              label="New utility name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              hint="Pre-filled from the Wi-Fi network it announced"
              required
            />
            <div>
              <p className="mb-1.5 text-sm font-medium text-foreground">Nest under (optional)</p>
              <Dropdown
                options={[{ label: "None — top-level utility", value: "" }, ...nodeOptions.map((n) => ({ label: n.name, value: n.id }))]}
                value={parentId}
                onChange={setParentId}
                className="w-full"
              />
            </div>
          </>
        ) : (
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">Attach to</p>
            {availableNodes.length === 0 ? (
              <p className="rounded-xl bg-surface-muted px-3 py-2.5 text-sm text-foreground-muted">
                Every utility already has a device. Use &ldquo;Create new utility&rdquo; instead.
              </p>
            ) : (
              <Dropdown
                options={availableNodes.map((n) => ({ label: n.name, value: n.id }))}
                value={utilityNodeId}
                onChange={setUtilityNodeId}
                className="w-full"
              />
            )}
          </div>
        )}

        <Input label="Device name" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} required />
        <Input label="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />

        <Button type="submit" className="w-full" loading={loading}>
          Claim and map device
        </Button>
      </form>
    </Modal>
  );
}
