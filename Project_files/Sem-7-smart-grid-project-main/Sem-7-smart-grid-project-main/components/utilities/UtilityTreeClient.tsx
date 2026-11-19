"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronRight, ChevronDown, Plus, Cpu, Trash2, Bell, Network } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/Loading";
import { AddUtilityModal } from "./AddUtilityModal";
import { AddDeviceModal } from "@/components/devices/AddDeviceModal";
import { DiscoveredDevicesPanel } from "./DiscoveredDevicesPanel";
import type { UtilityNodeRecord } from "@/types";

const STATUS_TONE = { online: "green", offline: "red", provisioning: "amber" } as const;

interface TreeNode extends UtilityNodeRecord {
  children: TreeNode[];
}

function buildTree(nodes: UtilityNodeRecord[]): TreeNode[] {
  const byId = new Map<string, TreeNode>(nodes.map((n) => [n.id, { ...n, children: [] }]));
  const roots: TreeNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function UtilityTreeClient() {
  const [nodes, setNodes] = useState<UtilityNodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [addUtilityFor, setAddUtilityFor] = useState<{ id: string | null; name?: string } | null>(null);
  const [addDeviceFor, setAddDeviceFor] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TreeNode | null>(null);

  const load = () => {
    fetch("/api/utility-nodes")
      .then((r) => r.json())
      .then((data) => setNodes(data.nodes ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteNode = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/utility-nodes/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete utility.");
      return;
    }
    toast.success("Utility deleted.");
    setDeleteTarget(null);
    load();
  };

  const tree = buildTree(nodes);

  const renderNode = (node: TreeNode, depth: number) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.id) || depth === 0;

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-3 card-shadow-hover"
          style={{ marginLeft: depth * 28 }}
        >
          <button
            onClick={() => hasChildren && toggle(node.id)}
            className="flex size-6 shrink-0 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-muted disabled:opacity-0"
            disabled={!hasChildren}
          >
            {hasChildren ? isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" /> : null}
          </button>

          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-blue-soft">
            <Network className="size-4 text-accent-blue" />
          </div>

          <Link href={`/dashboard/utilities/${node.id}`} className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground hover:underline">{node.name}</p>
            <p className="text-xs text-foreground-muted">
              {node.device ? `Device: ${node.device.name}` : "No device attached"}
              {node._count.children > 0 && ` · ${node._count.children} sub-utilit${node._count.children === 1 ? "y" : "ies"}`}
            </p>
          </Link>

          {node._count.tickets > 0 && (
            <Badge tone="amber" className="gap-1 shrink-0">
              <Bell className="size-3" /> {node._count.tickets}
            </Badge>
          )}

          {node.device ? (
            <Badge tone={STATUS_TONE[node.device.connectionStatus]} dot className="shrink-0">
              {node.device.connectionStatus}
            </Badge>
          ) : (
            <Button size="sm" variant="outline" className="shrink-0" onClick={() => setAddDeviceFor(node.id)}>
              <Cpu className="size-3.5" /> Attach device
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="shrink-0"
            title="Add sub-utility"
            onClick={() => setAddUtilityFor({ id: node.id, name: node.name })}
          >
            <Plus className="size-4" />
          </Button>
          <button
            onClick={() => setDeleteTarget(node)}
            className="shrink-0 rounded-lg p-2 text-foreground-muted hover:bg-accent-red-soft hover:text-accent-red"
            title="Delete utility"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Utilities</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Map utilities and sub-utilities to ESP32 devices in an unlimited-depth tree
          </p>
        </div>
        <Button onClick={() => setAddUtilityFor({ id: null })} className="gap-1.5">
          <Plus className="size-4" /> Add utility
        </Button>
      </div>

      <DiscoveredDevicesPanel onClaimed={load} />

      {loading ? (
        <LoadingState label="Loading utilities..." />
      ) : tree.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No utilities yet"
          description="Create your first utility, then nest sub-utilities under it and attach an ESP32 device to any node."
          action={<Button onClick={() => setAddUtilityFor({ id: null })}>Add a utility</Button>}
        />
      ) : (
        <div className="space-y-2">{tree.map((node) => renderNode(node, 0))}</div>
      )}

      <AddUtilityModal
        open={!!addUtilityFor}
        onClose={() => setAddUtilityFor(null)}
        onCreated={load}
        parentId={addUtilityFor?.id ?? null}
        parentName={addUtilityFor?.name}
      />

      <AddDeviceModal
        open={!!addDeviceFor}
        onClose={() => setAddDeviceFor(null)}
        onCreated={load}
        utilityNodeId={addDeviceFor ?? undefined}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This permanently removes the utility, its sub-utilities, attached device and all of its history. This cannot be undone."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteNode}>
            Delete permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
}
