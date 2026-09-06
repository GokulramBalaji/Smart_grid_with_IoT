"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Plus, Trash2 } from "lucide-react";
import type { TariffPlanRecord, TariffType, TouRateRecord, SlabRateRecord } from "@/types";

const TYPE_TABS: { value: TariffType; label: string }[] = [
  { value: "FLAT", label: "Flat Rate" },
  { value: "TIME_OF_USE", label: "Time-of-Use" },
  { value: "SLAB", label: "Slab" },
];

export function TariffSettingsForm({
  nodeId,
  existing,
  onSaved,
}: {
  nodeId: string;
  existing: TariffPlanRecord | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? "Standard Tariff");
  const [type, setType] = useState<TariffType>(existing?.type ?? "FLAT");
  const [currency, setCurrency] = useState(existing?.currency ?? "USD");
  const [flatRate, setFlatRate] = useState(existing?.flatRate ?? 0.15);
  const [fixedChargeMonthly, setFixedChargeMonthly] = useState(existing?.fixedChargeMonthly ?? 0);
  const [demandChargePerKva, setDemandChargePerKva] = useState(existing?.demandChargePerKva ?? 0);
  const [touRates, setTouRates] = useState<TouRateRecord[]>(
    existing?.touRates ?? [{ label: "Peak", startHour: 17, endHour: 22, rate: 0.25 }]
  );
  const [slabRates, setSlabRates] = useState<SlabRateRecord[]>(
    existing?.slabRates ?? [{ uptoKwh: 100, rate: 0.1 }, { uptoKwh: null, rate: 0.18 }]
  );
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/utility-nodes/${nodeId}/tariff`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type,
        currency,
        flatRate: type === "FLAT" ? flatRate : null,
        touRates: type === "TIME_OF_USE" ? touRates : null,
        slabRates: type === "SLAB" ? slabRates : null,
        fixedChargeMonthly,
        demandChargePerKva,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not save tariff.");
      return;
    }
    toast.success("Tariff plan saved.");
    onSaved();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Tariff Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-3">
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Plan name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
            <div>
              <p className="mb-1.5 text-sm font-medium text-foreground">Type</p>
              <Tabs tabs={TYPE_TABS} value={type} onChange={(v) => setType(v as TariffType)} />
            </div>
          </div>

          {type === "FLAT" && (
            <Input
              label="Rate per kWh"
              type="number"
              step="0.001"
              value={flatRate}
              onChange={(e) => setFlatRate(Number(e.target.value))}
            />
          )}

          {type === "TIME_OF_USE" && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Rate windows (hour of day, 0-24)</p>
              {touRates.map((rate, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-end gap-2">
                  <Input
                    label={i === 0 ? "Label" : undefined}
                    value={rate.label}
                    onChange={(e) => {
                      const next = [...touRates];
                      next[i] = { ...next[i], label: e.target.value };
                      setTouRates(next);
                    }}
                  />
                  <Input
                    label={i === 0 ? "Start hour" : undefined}
                    type="number"
                    value={rate.startHour}
                    onChange={(e) => {
                      const next = [...touRates];
                      next[i] = { ...next[i], startHour: Number(e.target.value) };
                      setTouRates(next);
                    }}
                  />
                  <Input
                    label={i === 0 ? "End hour" : undefined}
                    type="number"
                    value={rate.endHour}
                    onChange={(e) => {
                      const next = [...touRates];
                      next[i] = { ...next[i], endHour: Number(e.target.value) };
                      setTouRates(next);
                    }}
                  />
                  <Input
                    label={i === 0 ? "Rate/kWh" : undefined}
                    type="number"
                    step="0.001"
                    value={rate.rate}
                    onChange={(e) => {
                      const next = [...touRates];
                      next[i] = { ...next[i], rate: Number(e.target.value) };
                      setTouRates(next);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setTouRates(touRates.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setTouRates([...touRates, { label: "New window", startHour: 0, endHour: 24, rate: 0.15 }])}
              >
                <Plus className="size-3.5" /> Add window
              </Button>
            </div>
          )}

          {type === "SLAB" && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Progressive slabs (ascending)</p>
              {slabRates.map((slab, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                  <Input
                    label={i === 0 ? "Up to kWh (blank = unbounded)" : undefined}
                    type="number"
                    value={slab.uptoKwh ?? ""}
                    onChange={(e) => {
                      const next = [...slabRates];
                      next[i] = { ...next[i], uptoKwh: e.target.value === "" ? null : Number(e.target.value) };
                      setSlabRates(next);
                    }}
                  />
                  <Input
                    label={i === 0 ? "Rate/kWh" : undefined}
                    type="number"
                    step="0.001"
                    value={slab.rate}
                    onChange={(e) => {
                      const next = [...slabRates];
                      next[i] = { ...next[i], rate: Number(e.target.value) };
                      setSlabRates(next);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSlabRates(slabRates.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setSlabRates([...slabRates, { uptoKwh: null, rate: 0.15 }])}
              >
                <Plus className="size-3.5" /> Add slab
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Fixed monthly charge"
              type="number"
              step="0.01"
              value={fixedChargeMonthly}
              onChange={(e) => setFixedChargeMonthly(Number(e.target.value))}
            />
            <Input
              label="Demand charge per kVA"
              type="number"
              step="0.01"
              value={demandChargePerKva}
              onChange={(e) => setDemandChargePerKva(Number(e.target.value))}
            />
          </div>

          <Button type="submit" loading={saving}>
            Save tariff
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
