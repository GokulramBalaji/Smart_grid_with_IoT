"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { Copy, CheckCircle2 } from "lucide-react";

interface NodeOption {
  id: string;
  name: string;
  device: { id: string } | null;
}

export function AddDeviceModal({
  open,
  onClose,
  onCreated,
  utilityNodeId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** When provided, the device attaches to this node directly and no picker is shown. */
  utilityNodeId?: string;
}) {
  const [form, setForm] = useState({ name: "", deviceIdentifier: "", location: "" });
  const [selectedNodeId, setSelectedNodeId] = useState(utilityNodeId ?? "");
  const [nodeOptions, setNodeOptions] = useState<NodeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    if (utilityNodeId || !open) return;
    fetch("/api/utility-nodes")
      .then((r) => r.json())
      .then((data) => setNodeOptions((data.nodes ?? []).filter((n: NodeOption) => !n.device)));
  }, [open, utilityNodeId]);

  // Follow a fixed `utilityNodeId` prop without an Effect — adjusting state
  // during render, per https://react.dev/learn/you-might-not-need-an-effect
  const [prevUtilityNodeId, setPrevUtilityNodeId] = useState(utilityNodeId);
  if (utilityNodeId !== prevUtilityNodeId) {
    setPrevUtilityNodeId(utilityNodeId);
    setSelectedNodeId(utilityNodeId ?? "");
  }

  const reset = () => {
    setForm({ name: "", deviceIdentifier: "", location: "" });
    setApiKey(null);
    if (!utilityNodeId) setSelectedNodeId("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNodeId) {
      toast.error("Select a utility to attach this device to.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, utilityNodeId: selectedNodeId }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Could not create device.");
      return;
    }

    setApiKey(data.apiKey);
    onCreated();
  };

  const copyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast.success("API key copied to clipboard.");
    }
  };

  if (apiKey) {
    return (
      <Modal open={open} onClose={handleClose} title="Device created">
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-accent-green-soft px-3 py-2.5 text-sm text-accent-green">
            <CheckCircle2 className="size-4 shrink-0" />
            Your device is ready. Copy the API key now — it won&apos;t be shown again.
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-muted px-3 py-2.5">
            <code className="flex-1 overflow-x-auto text-xs text-foreground">{apiKey}</code>
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

  return (
    <Modal open={open} onClose={handleClose} title="Add a device" description="Provision a new ESP32 + PZEM deployment">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!utilityNodeId && (
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">Attach to utility</p>
            {nodeOptions.length === 0 ? (
              <p className="rounded-xl bg-surface-muted px-3 py-2.5 text-sm text-foreground-muted">
                Every utility already has a device. Create a new utility first from the Utilities page.
              </p>
            ) : (
              <Dropdown
                options={nodeOptions.map((n) => ({ label: n.name, value: n.id }))}
                value={selectedNodeId}
                onChange={setSelectedNodeId}
                className="w-full"
              />
            )}
          </div>
        )}
        <Input
          label="Device name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Main Distribution Panel"
          required
        />
        <Input
          label="Device identifier"
          value={form.deviceIdentifier}
          onChange={(e) => setForm({ ...form, deviceIdentifier: e.target.value })}
          placeholder="ESP32-SMARTGRID-002"
          hint="Sent by the ESP32 as `deviceId` in each reading payload"
          required
        />
        <Input
          label="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="Building B - Utility Room"
        />
        <Button type="submit" className="w-full" loading={loading}>
          Create device
        </Button>
      </form>
    </Modal>
  );
}
