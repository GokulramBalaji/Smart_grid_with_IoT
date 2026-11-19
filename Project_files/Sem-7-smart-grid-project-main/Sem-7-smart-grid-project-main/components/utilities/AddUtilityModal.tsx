"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function AddUtilityModal({
  open,
  onClose,
  onCreated,
  parentId,
  parentName,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  parentId: string | null;
  parentName?: string;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setName("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/utility-nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Could not create utility.");
      return;
    }

    toast.success(parentId ? "Sub-utility created." : "Utility created.");
    handleClose();
    onCreated();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={parentId ? "Add sub-utility" : "Add utility"}
      description={parentId ? `Nested under ${parentName ?? "the selected utility"}` : "A new top-level utility"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={parentId ? "Building A — HVAC Feeder" : "Campus Main Utility"}
          required
        />
        <Button type="submit" className="w-full" loading={loading}>
          Create
        </Button>
      </form>
    </Modal>
  );
}
