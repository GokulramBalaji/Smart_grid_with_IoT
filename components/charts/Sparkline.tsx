"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

export function Sparkline({ id, data, color = "var(--accent-blue)" }: { id: string; data: number[]; color?: string }) {
  const points = data.map((v, i) => ({ i, v }));
  const gradientId = `spark-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <div className="h-10 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} fill={`url(#${gradientId})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
