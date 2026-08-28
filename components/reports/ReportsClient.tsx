"use client";

import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/Loading";
import { formatEnergy, formatDateTime } from "@/lib/utils";
import { PHASE_LABELS, type PhaseKey } from "@/types";

const PERIOD_TABS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
];

interface ReportSummary {
  deviceName: string;
  period: string;
  from: string;
  to: string;
  totalEnergy: number;
  phaseEnergy: Record<PhaseKey, number>;
  maxVoltage: number;
  minVoltage: number;
  maxCurrent: number;
  peakPower: number;
  avgPowerFactor: number;
  alertCount: number;
  criticalAlertCount: number;
  loadImbalancePercent: number;
}

export function ReportsClient({ deviceId }: { deviceId: string }) {
  const [period, setPeriod] = useState("daily");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (period === "custom" && (!from || !to)) return;
    const params = new URLSearchParams({ deviceId, period });
    if (period === "custom") {
      params.set("from", new Date(from).toISOString());
      params.set("to", new Date(to).toISOString());
    }
    fetch(`/api/reports?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setReport(data);
        setLoading(false);
      });
  }, [deviceId, period, from, to]);

  const exportParams = new URLSearchParams({ deviceId, period });
  if (period === "custom" && from && to) {
    exportParams.set("from", new Date(from).toISOString());
    exportParams.set("to", new Date(to).toISOString());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Reports</h1>
          <p className="mt-1 text-sm text-foreground-muted">Generate and export energy reports</p>
        </div>
        {report && (
          <a href={`/api/reports/export?${exportParams}`}>
            <Button variant="outline" className="gap-1.5">
              <Download className="size-4" /> Export CSV
            </Button>
          </a>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Tabs tabs={PERIOD_TABS} value={period} onChange={setPeriod} />
        {period === "custom" && (
          <div className="flex gap-3">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        )}
      </div>

      {period === "custom" && (!from || !to) ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-foreground-muted">
          <FileText className="size-8 text-foreground-muted/60" />
          Select a start and end date to generate a custom report.
        </div>
      ) : loading || !report ? (
        <LoadingState label="Generating report..." />
      ) : (
        <>
          <Card className="p-5">
            <p className="text-xs font-medium text-foreground-muted">
              {report.period} · {formatDateTime(report.from)} — {formatDateTime(report.to)}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatEnergy(report.totalEnergy)}</p>
            <p className="text-sm text-foreground-muted">Total energy consumed for {report.deviceName}</p>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Max Voltage" value={`${report.maxVoltage} V`} />
            <StatCard label="Min Voltage" value={`${report.minVoltage} V`} />
            <StatCard label="Max Current" value={`${report.maxCurrent} A`} />
            <StatCard label="Peak Power" value={`${report.peakPower} W`} />
            <StatCard label="Avg Power Factor" value={report.avgPowerFactor.toFixed(2)} />
            <StatCard label="Load Imbalance" value={`${report.loadImbalancePercent}%`} />
            <StatCard label="Total Alerts" value={String(report.alertCount)} />
            <StatCard label="Critical Alerts" value={String(report.criticalAlertCount)} />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Phase-wise Energy</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-3">
              {(Object.keys(report.phaseEnergy) as PhaseKey[]).map((k) => (
                <div key={k} className="rounded-xl border border-border-subtle p-4 text-center">
                  <p className="text-xs text-foreground-muted">{PHASE_LABELS[k]}</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{formatEnergy(report.phaseEnergy[k])}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-foreground-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </Card>
  );
}
