"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { LoadingState } from "@/components/ui/Loading";
import { RANGE_LABELS, type ChartRange } from "@/lib/analytics/bucket";
import { formatDateTime, formatTime } from "@/lib/utils";

const RANGE_TABS = (Object.keys(RANGE_LABELS) as ChartRange[]).map((r) => ({ value: r, label: r }));

interface PowerPoint {
  timestamp: string;
  R: number;
  Y: number;
  B: number;
  total: number;
}

export function PowerChart({ deviceId }: { deviceId: string }) {
  const [range, setRange] = useState<ChartRange>("24h");
  const [points, setPoints] = useState<PowerPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/readings/history?deviceId=${deviceId}&range=${range}`)
      .then((r) => r.json())
      .then((data) => {
        setPoints(data.points ?? []);
        setLoading(false);
      });
  }, [deviceId, range]);

  const isLongRange = range === "7d" || range === "30d";

  return (
    <Card>
      <CardHeader className="flex-wrap gap-3 pb-4">
        <div>
          <CardTitle>Real-Time Energy Chart</CardTitle>
          <p className="mt-1 text-sm text-foreground-muted">Total and per-phase active power over time</p>
        </div>
        <Tabs tabs={RANGE_TABS} value={range} onChange={(v) => setRange(v as ChartRange)} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingState label="Loading chart data..." />
        ) : points.length === 0 ? (
          <div className="flex h-72 items-center justify-center text-sm text-foreground-muted">
            No readings in this range yet.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(v) => (isLongRange ? formatDateTime(v) : formatTime(v))}
                  tick={{ fontSize: 11, fill: "var(--foreground-muted)" }}
                  minTickGap={40}
                  axisLine={{ stroke: "var(--border-subtle)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--foreground-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  labelFormatter={(v) => formatDateTime(v as string)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border-subtle)",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="total" name="Total" stroke="var(--foreground)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="R" name="Phase R" stroke="var(--phase-r)" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Y" name="Phase Y" stroke="var(--phase-y)" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="B" name="Phase B" stroke="var(--phase-b)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
