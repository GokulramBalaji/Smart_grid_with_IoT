import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PHASE_KEYS, PHASE_LABELS, type DashboardSummary } from "@/types";
import { powerFactorRecommendation } from "@/lib/calculations/electrical";
import { formatNumber } from "@/lib/utils";

const IMBALANCE_TONE = { normal: "green", warning: "amber", critical: "red" } as const;
const PF_TONE = { excellent: "green", good: "blue", warning: "amber", poor: "red" } as const;

export function AnalysisSection({ summary }: { summary: DashboardSummary }) {
  const recommendation = powerFactorRecommendation(summary.powerFactor.avg);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Voltage Analysis</CardTitle>
          <Badge tone={IMBALANCE_TONE[summary.voltage.status]}>{summary.voltage.status}</Badge>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Avg" value={`${formatNumber(summary.voltage.avg, 1)} V`} />
            <Stat label="Min" value={`${formatNumber(summary.voltage.min, 1)} V`} />
            <Stat label="Max" value={`${formatNumber(summary.voltage.max, 1)} V`} />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2.5">
            <span className="text-xs text-foreground-muted">Voltage Imbalance</span>
            <span className="text-sm font-semibold text-foreground">{summary.voltage.imbalancePercent}%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Current Analysis</CardTitle>
          <Badge tone={IMBALANCE_TONE[summary.current.status]}>{summary.current.status}</Badge>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Average" value={`${formatNumber(summary.current.avg, 2)} A`} />
            <Stat label="Maximum" value={`${formatNumber(summary.current.max, 2)} A`} />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2.5">
            <span className="text-xs text-foreground-muted">Load Imbalance</span>
            <span className="text-sm font-semibold text-foreground">{summary.current.imbalancePercent}%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Power Factor Analysis</CardTitle>
          <Badge tone={PF_TONE[summary.powerFactor.status]}>{summary.powerFactor.status}</Badge>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            {PHASE_KEYS.map((k) => (
              <Stat key={k} label={PHASE_LABELS[k]} value={formatNumber(summary.powerFactor.perPhase[k], 2)} />
            ))}
          </div>
          {recommendation && (
            <p className="mt-4 rounded-xl bg-accent-amber-soft px-3 py-2.5 text-xs leading-relaxed text-accent-amber">
              {recommendation}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-subtle py-2.5">
      <p className="text-[11px] text-foreground-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
