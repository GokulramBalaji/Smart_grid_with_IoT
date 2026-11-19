import { AlertTriangle, AlertOctagon, Info } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { AlertSeverityKey, AlertStatusKey } from "@/types";

const SEVERITY_CONFIG: Record<AlertSeverityKey, { tone: "blue" | "amber" | "red"; icon: typeof Info }> = {
  INFO: { tone: "blue", icon: Info },
  WARNING: { tone: "amber", icon: AlertTriangle },
  CRITICAL: { tone: "red", icon: AlertOctagon },
};

export function SeverityBadge({ severity }: { severity: AlertSeverityKey }) {
  const { tone, icon: Icon } = SEVERITY_CONFIG[severity];
  return (
    <Badge tone={tone} className="gap-1">
      <Icon className="size-3" />
      {severity}
    </Badge>
  );
}

const STATUS_TONE: Record<AlertStatusKey, "red" | "amber" | "green"> = {
  ACTIVE: "red",
  ACKNOWLEDGED: "amber",
  RESOLVED: "green",
};

export function StatusBadge({ status }: { status: AlertStatusKey }) {
  return <Badge tone={STATUS_TONE[status]}>{status}</Badge>;
}
