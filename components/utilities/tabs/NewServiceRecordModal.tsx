"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";

const TYPE_OPTIONS = [
  { label: "Routine", value: "ROUTINE" },
  { label: "Repair", value: "REPAIR" },
  { label: "Inspection", value: "INSPECTION" },
  { label: "Calibration", value: "CALIBRATION" },
  { label: "Other", value: "OTHER" },
];

export function NewServiceRecordModal({
  nodeId,
  open,
  onClose,
  onCreated,
}: {
  nodeId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [type, setType] = useState("ROUTINE");
  const [description, setDescription] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setType("ROUTINE");
    setDescription("");
    setPerformedBy("");
    setCost("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/utility-nodes/${nodeId}/service-records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, description, performedBy, cost: cost ? Number(cost) : null, notes }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not log service record.");
      return;
    }
    toast.success("Service record logged.");
    reset();
    onClose();
    onCreated();
  };

  return (
    <Modal open={open} onClose={onClose} title="Log a service record" description="Maintenance / service history entry">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">Type</p>
          <Dropdown options={TYPE_OPTIONS} value={type} onChange={setType} className="w-full" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-[15px] text-foreground outline-none focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/10"
          />
        </div>
        <Input label="Performed by" value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} required />
        <Input label="Cost (optional)" type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
        <Input label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button type="submit" className="w-full" loading={loading}>
          Log record
        </Button>
      </form>
    </Modal>
  );
}
