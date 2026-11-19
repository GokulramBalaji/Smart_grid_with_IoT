"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Cpu, Network } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/Loading";
import { AddDeviceModal } from "@/components/devices/AddDeviceModal";
import { OverviewTab } from "./tabs/OverviewTab";
import { LoadingProfileTab } from "./tabs/LoadingProfileTab";
import { EnergyCostTab } from "./tabs/EnergyCostTab";
import { PowerQualityTab } from "./tabs/PowerQualityTab";
import { EfficiencyTab } from "./tabs/EfficiencyTab";
import { MatlabExportTab } from "./tabs/MatlabExportTab";
import { TicketsServiceTab } from "./tabs/TicketsServiceTab";
import type { UtilityNodeDeviceSummary } from "@/types";

const STATUS_TONE = { online: "green", offline: "red", provisioning: "amber" } as const;

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "loading", label: "Loading Profile" },
  { value: "cost", label: "Energy & Cost" },
  { value: "quality", label: "Power Quality" },
  { value: "efficiency", label: "Efficiency & Policy" },
  { value: "matlab", label: "MATLAB Export" },
  { value: "tickets", label: "Tickets & Service" },
];

interface NodeDetail {
  node: { id: string; name: string; parentId: string | null; contractDemandKva: number | null };
  device: UtilityNodeDeviceSummary | null;
  children: { id: string; name: string; device: UtilityNodeDeviceSummary | null }[];
  tariffPlan: { id: string } | null;
  openTicketCount: number;
}

export function UtilityDetailClient({ nodeId }: { nodeId: string }) {
  const [detail, setDetail] = useState<NodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);

  const load = () => {
    fetch(`/api/utility-nodes/${nodeId}`)
      .then((r) => r.json())
      .then((data) => {
        setDetail(data);
        setLoading(false);
      });
  };

  useEffect(load, [nodeId]);

  if (loading || !detail) return <LoadingState label="Loading utility..." />;

  const { node, device, children, tariffPlan, openTicketCount } = detail;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/utilities" className="flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to utilities
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-accent-blue-soft">
            <Network className="size-5 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{node.name}</h1>
            <p className="mt-0.5 text-sm text-foreground-muted">
              {device ? device.name : "No device attached"}
              {openTicketCount > 0 && ` · ${openTicketCount} open ticket${openTicketCount === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {device ? (
            <Badge tone={STATUS_TONE[device.connectionStatus]} dot>
              {device.connectionStatus}
            </Badge>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setAddDeviceOpen(true)} className="gap-1.5">
              <Cpu className="size-3.5" /> Attach device
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      {tab === "overview" && (
        <OverviewTab node={node} device={device} subNodes={children} tariffPlan={tariffPlan} />
      )}
      {tab === "loading" && <LoadingProfileTab nodeId={nodeId} hasDevice={!!device} />}
      {tab === "cost" && <EnergyCostTab nodeId={nodeId} hasDevice={!!device} hasTariff={!!tariffPlan} onTariffSaved={load} />}
      {tab === "quality" && <PowerQualityTab nodeId={nodeId} hasDevice={!!device} />}
      {tab === "efficiency" && <EfficiencyTab nodeId={nodeId} hasDevice={!!device} />}
      {tab === "matlab" && <MatlabExportTab nodeId={nodeId} nodeName={node.name} hasDevice={!!device} />}
      {tab === "tickets" && <TicketsServiceTab nodeId={nodeId} />}

      <AddDeviceModal open={addDeviceOpen} onClose={() => setAddDeviceOpen(false)} onCreated={load} utilityNodeId={nodeId} />
    </div>
  );
}
