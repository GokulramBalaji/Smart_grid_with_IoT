import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PHASE_KEYS, PHASE_LABELS, type DashboardSummary } from "@/types";
import {
  calculateLineToLineVoltages,
  calculateThreePhaseEquivalentVoltage,
  powerFactorRecommendation,
} from "@/lib/calculations/electrical";
import { formatNumber } from "@/lib/utils";
import { Gauge, Info } from "lucide-react";

const IMBALANCE_TONE = { normal: "green", warning: "amber", critical: "red" } as const;
const PF_TONE = { excellent: "green", good: "blue", warning: "amber", poor: "red" } as const;

export function AnalysisSection({ summary }: { summary: DashboardSummary }) {
  const recommendation = powerFactorRecommendation(summary.powerFactor.avg);

  const vR = summary.phases.R.voltage;
  const vY = summary.phases.Y.voltage;
  const vB = summary.phases.B.voltage;

  const threePhaseEq =
    summary.voltage.threePhaseEquivalent || calculateThreePhaseEquivalentVoltage(vR, vY, vB);
  const lineToLine =
    summary.voltage.lineToLine || calculateLineToLineVoltages(vR, vY, vB);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* 3-Phase & Single-Phase Voltage Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle>Voltage Analysis</CardTitle>
          </div>
          <Badge tone={IMBALANCE_TONE[summary.voltage.status]}>{summary.voltage.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          {/* Highlighted 3-Phase Synthesized Equivalent */}
          <div className="rounded-xl border border-accent-blue/20 bg-accent-blue/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-accent-blue">
                3-Phase Line Voltage [V<sub>3φ</sub>]
              </span>
              <span className="text-[11px] text-foreground-muted">(rV+yV+bV)/√3</span>
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {formatNumber(threePhaseEq, 1)}{" "}
              <span className="text-xs font-normal text-foreground-muted">V (Line-to-Line)</span>
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-foreground-muted">
              <span>Estimated L-L:</span>
              <span>
                RY: {formatNumber(lineToLine.RY, 0)}V · YB: {formatNumber(lineToLine.YB, 0)}V · BR:{" "}
                {formatNumber(lineToLine.BR, 0)}V
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Phase Avg" value={`${formatNumber(summary.voltage.avg, 1)} V`} />
            <Stat label="Min Phase" value={`${formatNumber(summary.voltage.min, 1)} V`} />
            <Stat label="Max Phase" value={`${formatNumber(summary.voltage.max, 1)} V`} />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2">
            <span className="text-xs text-foreground-muted">Voltage Imbalance</span>
            <span className="text-sm font-semibold text-foreground">{summary.voltage.imbalancePercent}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Current Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Current Analysis</CardTitle>
          <Badge tone={IMBALANCE_TONE[summary.current.status]}>{summary.current.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="rounded-xl border border-border-subtle bg-surface-muted p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted">Total Phase Current</span>
              <span className="text-xs text-foreground-muted">I_R + I_Y + I_B</span>
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {formatNumber(summary.totals.totalCurrent, 2)}{" "}
              <span className="text-xs font-normal text-foreground-muted">A (Sum)</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Average Phase" value={`${formatNumber(summary.current.avg, 2)} A`} />
            <Stat label="Peak Phase" value={`${formatNumber(summary.current.max, 2)} A`} />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2">
            <span className="text-xs text-foreground-muted">Load Imbalance</span>
            <span className="text-sm font-semibold text-foreground">{summary.current.imbalancePercent}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Power Factor Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Power Factor Analysis</CardTitle>
          <Badge tone={PF_TONE[summary.powerFactor.status]}>{summary.powerFactor.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            {PHASE_KEYS.map((k) => (
              <Stat key={k} label={PHASE_LABELS[k]} value={formatNumber(summary.powerFactor.perPhase[k], 2)} />
            ))}
          </div>

          <div className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2">
            <span className="text-xs text-foreground-muted">System Avg Power Factor</span>
            <span className="text-sm font-semibold text-foreground">
              {formatNumber(summary.powerFactor.avg, 3)}
            </span>
          </div>

          {recommendation && (
            <p className="rounded-xl bg-accent-amber-soft px-3 py-2.5 text-xs leading-relaxed text-accent-amber">
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
