import Link from "next/link";
import { Cpu, Gauge, Network } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardOverviewLive } from "./DashboardOverviewLive";
import type { UtilityNodeDeviceSummary, TariffPlanRecord } from "@/types";

const STATUS_TONE = { online: "green", offline: "red", provisioning: "amber" } as const;

interface OverviewTabProps {
  node: { id: string; contractDemandKva: number | null };
  device: UtilityNodeDeviceSummary | null;
  subNodes: { id: string; name: string; device: UtilityNodeDeviceSummary | null }[];
  tariffPlan: Pick<TariffPlanRecord, "id"> | null;
}

export function OverviewTab({ node, device, subNodes, tariffPlan }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Contract Demand</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {node.contractDemandKva ? `${node.contractDemandKva} kVA` : "Not set"}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Tariff Plan</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{tariffPlan ? "Configured" : "Not set"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Sub-utilities</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{subNodes.length}</p>
        </Card>
      </div>

      {device ? (
        <DashboardOverviewLive deviceId={device.id} />
      ) : (
        <EmptyState
          icon={Cpu}
          title="No device attached"
          description="Attach an ESP32 + 3xPZEM device to this utility to see live readings here."
        />
      )}

      {subNodes.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Sub-utilities</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subNodes.map((child) => (
              <Link key={child.id} href={`/dashboard/utilities/${child.id}`}>
                <Card hover className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-accent-blue-soft">
                      <Network className="size-4 text-accent-blue" />
                    </div>
                    {child.device ? (
                      <Badge tone={STATUS_TONE[child.device.connectionStatus]} dot>
                        {child.device.connectionStatus}
                      </Badge>
                    ) : (
                      <Badge tone="neutral">No device</Badge>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">{child.name}</p>
                  {child.device && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground-muted">
                      <Gauge className="size-3" /> {child.device.name}
                    </p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
