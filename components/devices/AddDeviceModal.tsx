"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Copy, CheckCircle2 } from "lucide-react";

export function AddDeviceModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", deviceIdentifier: "", location: "" });
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  const reset = () => {
    setForm({ name: "", deviceIdentifier: "", location: "" });
    setApiKey(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
