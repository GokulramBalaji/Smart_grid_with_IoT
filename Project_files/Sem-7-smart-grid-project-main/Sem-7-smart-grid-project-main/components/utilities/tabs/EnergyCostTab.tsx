"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Settings2, Cpu } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { TariffSettingsForm } from "./TariffSettingsForm";
import { formatEnergy } from "@/lib/utils";
import type { TariffPlanRecord } from "@/types";

const PERIOD_TABS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

interface CostData {
  device: { id: string; name: string } | null;
  tariff: { name: string; type: string; currency: string } | null;
  period: string;
  totalKwh: number;
  hourlyKwh: number[];
  peakKva: number;
  breakdown: {
    energyCharge: number;
    demandCharge: number;
    fixedCharge: number;
    totalCost: number;
    currency: string;
    effectiveRatePerKwh: number;
  };
}

export function EnergyCostTab({
  nodeId,
  hasDevice,
  hasTariff,
  onTariffSaved,
}: {
  nodeId: string;
  hasDevice: boolean;
  hasTariff: boolean;
  onTariffSaved: () => void;
}) {
  const [period, setPeriod] = useState("monthly");
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(hasDevice);
  const [showSettings, setShowSettings] = useState(!hasTariff);
  const [existingTariff, setExistingTariff] = useState<TariffPlanRecord | null>(null);

  useEffect(() => {
    if (!hasDevice) return;
    fetch(`/api/utility-nodes/${nodeId}/cost?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [nodeId, period, hasDevice]);

  useEffect(() => {
    fetch(`/api/utility-nodes/${nodeId}/tariff`)
      .then((r) => r.json())
      .then((d) => setExistingTariff(d.tariff));
  }, [nodeId]);

  if (!hasDevice) {
    return <EmptyState icon={Cpu} title="No device attached" description="Attach a device to see energy consumption and cost." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Tabs tabs={PERIOD_TABS} value={period} onChange={setPeriod} />
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowSettings((s) => !s)}>
          <Settings2 className="size-3.5" /> {showSettings ? "Hide" : "Edit"} tariff
        </Button>
      </div>

      {showSettings && (
        <TariffSettingsForm
          nodeId={nodeId}
          existing={existingTariff}
          onSaved={() => {
            setShowSettings(false);
            onTariffSaved();
            fetch(`/api/utility-nodes/${nodeId}/cost?period=${period}`)
              .then((r) => r.json())
              .then(setData);
            fetch(`/api/utility-nodes/${nodeId}/tariff`)
              .then((r) => r.json())
              .then((d) => setExistingTariff(d.tariff));
          }}
        />
      )}

      {loading ? (
        <LoadingState label="Loading cost breakdown..." />
      ) : !data?.tariff ? (
        <EmptyState
          icon={Settings2}
          title="No tariff configured"
          description="Set up a tariff plan above to see energy cost breakdowns."
        />
      ) : (
        <>
          <Card className="p-5">
            <p className="text-xs font-medium text-foreground-muted">
              {data.period} · {data.tariff.name} ({data.tariff.type.replace("_", "-").toLowerCase()})
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {data.breakdown.currency} {data.breakdown.totalCost.toFixed(2)}
            </p>
            <p className="text-sm text-foreground-muted">
              {formatEnergy(data.totalKwh)} consumed · effective rate {data.breakdown.effectiveRatePerKwh.toFixed(4)}{" "}
              {data.breakdown.currency}/kWh
            </p>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-xs font-medium text-foreground-muted">Energy Charge</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {data.breakdown.currency} {data.breakdown.energyCharge.toFixed(2)}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-medium text-foreground-muted">Demand Charge</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {data.breakdown.currency} {data.breakdown.demandCharge.toFixed(2)}
              </p>
              <p className="mt-0.5 text-xs text-foreground-muted">Peak {data.peakKva} kVA</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-medium text-foreground-muted">Fixed Charge</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {data.breakdown.currency} {data.breakdown.fixedCharge.toFixed(2)}
              </p>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Hourly Consumption</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.hourlyKwh.map((energy, hour) => ({ hour, energy }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} width={44} />
                    <Tooltip formatter={(v) => `${v} kWh`} contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)", fontSize: 12 }} />
                    <Bar dataKey="energy" name="Energy (kWh)" fill="var(--accent-blue)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
