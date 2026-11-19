"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";

const CATEGORY_OPTIONS = [
  { label: "Complaint", value: "COMPLAINT" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Inspection", value: "INSPECTION" },
  { label: "Other", value: "OTHER" },
];

const PRIORITY_OPTIONS = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Urgent", value: "URGENT" },
];

export function NewTicketModal({ nodeId, open, onClose, onCreated }: { nodeId: string; open: boolean; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("COMPLAINT");
  const [priority, setPriority] = useState("MEDIUM");
  const [assignedTo, setAssignedTo] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle("");
    setDescription("");
    setCategory("COMPLAINT");
    setPriority("MEDIUM");
    setAssignedTo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/utility-nodes/${nodeId}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category, priority, assignedTo }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not create ticket.");
      return;
    }
    toast.success("Ticket created.");
    reset();
    onClose();
    onCreated();
  };

  return (
    <Modal open={open} onClose={onClose} title="Raise a ticket" description="Complaint, maintenance request or inspection">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">Category</p>
            <Dropdown options={CATEGORY_OPTIONS} value={category} onChange={setCategory} className="w-full" />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">Priority</p>
            <Dropdown options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} className="w-full" />
          </div>
        </div>
        <Input label="Assigned to (optional)" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Facilities — J. Doe" />
        <Button type="submit" className="w-full" loading={loading}>
          Create ticket
        </Button>
      </form>
    </Modal>
  );
}
