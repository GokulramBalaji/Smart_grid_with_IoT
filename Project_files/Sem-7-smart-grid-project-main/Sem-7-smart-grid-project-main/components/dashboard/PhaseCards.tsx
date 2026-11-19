import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PHASE_KEYS, PHASE_LABELS, type PhaseKey, type PhaseElectricalData, type DashboardSummary } from "@/types";
import {
  calculateLineToLineVoltages,
  calculateThreePhaseEquivalentVoltage,
  powerFactorStatus,
} from "@/lib/calculations/electrical";
import { formatNumber } from "@/lib/utils";
import { Info, Zap, Gauge } from "lucide-react";

const PHASE_DOT: Record<PhaseKey, string> = {
  R: "bg-phase-r",
  Y: "bg-phase-y",
  B: "bg-phase-b",
};

const PF_TONE = {
  excellent: "green",
  good: "blue",
  warning: "amber",
  poor: "red",
} as const;

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <p className="text-[11px] text-foreground-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">
        {value} <span className="text-xs font-normal text-foreground-muted">{unit}</span>
      </p>
    </div>
  );
}

export function PhaseCards({
  phases,
  summary,
}: {
  phases: Record<PhaseKey, PhaseElectricalData>;
  summary?: DashboardSummary;
}) {
  const vR = phases.R?.voltage ?? 0;
  const vY = phases.Y?.voltage ?? 0;
  const vB = phases.B?.voltage ?? 0;

  const threePhaseEqVoltage =
    summary?.voltage?.threePhaseEquivalent ?? calculateThreePhaseEquivalentVoltage(vR, vY, vB);
  const lineToLine =
    summary?.voltage?.lineToLine ?? calculateLineToLineVoltages(vR, vY, vB);

  // Status relative to 400V nominal
  const v3pDeviation = Math.abs(threePhaseEqVoltage - 400);
  const v3pTone = v3pDeviation <= 10 ? "green" : v3pDeviation <= 25 ? "amber" : "red";
  const v3pStatus = v3pDeviation <= 10 ? "Optimal (400V Ref)" : v3pDeviation <= 25 ? "Acceptable" : "Deviated";

  return (
    <div className="space-y-4">
      {/* 3-Phase Synthesized System Banner */}
      <div className="rounded-2xl border border-border-subtle bg-gradient-to-r from-surface to-surface-muted p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
              <Gauge className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">
                  3-Phase Synthesized Line Voltage
                </h4>
                <Badge tone={v3pTone}>{v3pStatus}</Badge>
              </div>
              <p className="text-xs text-foreground-muted">
                Calculated from single-phase voltages:{" "}
                <code className="rounded bg-surface px-1 py-0.5 font-mono text-[11px] font-semibold text-foreground">
                  (rV + yV + bV) / √3
                </code>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-6">
            <div>
              <p className="text-[11px] text-foreground-muted">V_3phi Equivalent</p>
              <p className="text-xl font-bold tracking-tight text-foreground">
                {formatNumber(threePhaseEqVoltage, 1)}{" "}
                <span className="text-xs font-normal text-foreground-muted">V (Line-to-Line)</span>
              </p>
            </div>

            <div className="hidden border-l border-border-subtle pl-4 sm:block">
              <p className="text-[11px] text-foreground-muted">Line-to-Line Estimates</p>
              <p className="text-xs font-medium text-foreground">
                V<sub>RY</sub>: {formatNumber(lineToLine.RY, 1)}V · V<sub>YB</sub>:{" "}
                {formatNumber(lineToLine.YB, 1)}V · V<sub>BR</sub>: {formatNumber(lineToLine.BR, 1)}V
              </p>
            </div>

            <div className="hidden border-l border-border-subtle pl-4 lg:block">
              <p className="text-[11px] text-foreground-muted">Phase Sum</p>
              <p className="text-xs font-medium text-foreground">
                ({formatNumber(vR, 1)} + {formatNumber(vY, 1)} + {formatNumber(vB, 1)}) ={" "}
                {formatNumber(vR + vY + vB, 1)} V
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Individual Phase Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PHASE_KEYS.map((key) => {
          const p = phases[key];
          const pfStatus = powerFactorStatus(p.powerFactor);
          return (
            <Card key={key} hover>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${PHASE_DOT[key]}`} />
                    <h3 className="text-[15px] font-semibold text-foreground">{PHASE_LABELS[key]}</h3>
                  </div>
                  <Badge tone={PF_TONE[pfStatus]}>{pfStatus}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-y-4">
                  <Metric label="Voltage (Single Phase)" value={formatNumber(p.voltage, 1)} unit="V" />
                  <Metric label="Current" value={formatNumber(p.current, 2)} unit="A" />
                  <Metric label="Active Power" value={formatNumber(p.activePower, 0)} unit="W" />
                  <Metric label="Apparent Power" value={formatNumber(p.apparentPower, 0)} unit="VA" />
                  <Metric label="Reactive Power" value={formatNumber(p.reactivePower, 0)} unit="VAR" />
                  <Metric label="Power Factor" value={formatNumber(p.powerFactor, 2)} unit="" />
                  <Metric label="Frequency" value={formatNumber(p.frequency, 2)} unit="Hz" />
                  <Metric label="Energy" value={formatNumber(p.energy, 1)} unit="kWh" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
