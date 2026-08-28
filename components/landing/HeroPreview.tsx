"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Zap, TrendingUp, Activity } from "lucide-react";

const sparkData = Array.from({ length: 24 }, (_, i) => ({
  x: i,
  v: 3200 + Math.sin(i / 2.2) * 700 + Math.random() * 200,
}));

const phaseRows = [
  { label: "Phase R", value: "230.5 V", load: 72, color: "bg-phase-r" },
  { label: "Phase Y", value: "228.7 V", load: 58, color: "bg-phase-y" },
  { label: "Phase B", value: "232.1 V", load: 81, color: "bg-phase-b" },
];

export function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
      className="relative mx-auto w-full max-w-3xl"
    >
      <div className="rounded-3xl border border-border-subtle bg-surface p-2 card-shadow">
        <div className="rounded-2xl bg-surface-muted/60 p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground-muted">Total Active Power</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold tracking-tight text-foreground">3.42</span>
                <span className="text-sm font-medium text-foreground-muted">kW</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-green-soft px-3 py-1 text-xs font-medium text-accent-green">
              <span className="size-1.5 rounded-full bg-accent-green" />
              System Online
            </span>
          </div>

          <div className="mt-4 h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="var(--accent-blue)"
                  strokeWidth={2}
                  fill="url(#heroFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {phaseRows.map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="rounded-xl border border-border-subtle bg-surface p-3.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <span className={`size-1.5 rounded-full ${row.color}`} />
                    {row.label}
                  </span>
                  <span className="text-foreground-muted">{row.value}</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.load}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                    className={`h-full rounded-full ${row.color}`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="absolute -left-4 -top-4 hidden items-center gap-2 rounded-2xl border border-border-subtle bg-surface px-4 py-3 card-shadow sm:flex"
      >
        <div className="flex size-8 items-center justify-center rounded-lg bg-accent-blue-soft">
          <Zap className="size-4 text-accent-blue" />
        </div>
        <div>
          <p className="text-[11px] text-foreground-muted">Energy Today</p>
          <p className="text-sm font-semibold text-foreground">42.8 kWh</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.75 }}
        className="absolute -bottom-4 -right-4 hidden items-center gap-2 rounded-2xl border border-border-subtle bg-surface px-4 py-3 card-shadow sm:flex"
      >
        <div className="flex size-8 items-center justify-center rounded-lg bg-accent-green-soft">
          <TrendingUp className="size-4 text-accent-green" />
        </div>
        <div>
          <p className="text-[11px] text-foreground-muted">Power Factor</p>
          <p className="text-sm font-semibold text-foreground">0.94 Excellent</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ActivityBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 py-1 text-xs font-medium text-foreground-muted">
      <Activity className="size-3.5" />
      Real-time IoT telemetry
    </div>
  );
}
