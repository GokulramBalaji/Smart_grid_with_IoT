import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PHASE_KEYS, PHASE_LABELS, type PhaseKey, type PhaseElectricalData } from "@/types";
import { powerFactorStatus } from "@/lib/calculations/electrical";
import { formatNumber } from "@/lib/utils";

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

export function PhaseCards({ phases }: { phases: Record<PhaseKey, PhaseElectricalData> }) {
  return (
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
                <Metric label="Voltage" value={formatNumber(p.voltage, 1)} unit="V" />
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
  );
}
