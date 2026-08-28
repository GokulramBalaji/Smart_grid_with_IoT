import { LineChart, TrendingUp, CalendarClock, ShieldAlert, BellRing, CheckCircle2 } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

export function AnalyticsSection() {
  return (
    <section id="analytics" className="px-6 py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Analytics & Forecasting"
            title="Understand consumption, not just readings"
            align="left"
            description="Hourly-to-yearly rollups, today-vs-yesterday comparisons, and a transparent linear-trend forecast that's always clearly labeled as an estimate."
          />
          <ul className="mt-6 space-y-4">
            {[
              { icon: LineChart, text: "Interactive power charts with 1h to 30-day ranges" },
              { icon: TrendingUp, text: "Today vs yesterday, week vs week, month vs month" },
              { icon: CalendarClock, text: "Explainable tomorrow / weekly / monthly forecasts" },
            ].map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-blue-soft">
                  <item.icon className="size-4 text-accent-blue" />
                </div>
                <span className="text-sm text-foreground-muted">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface p-6 card-shadow">
          <p className="text-xs font-medium text-foreground-muted">This Week vs Last Week</p>
          <div className="mt-4 space-y-3">
            {[
              { label: "This week", value: 286, max: 320, color: "bg-accent-blue" },
              { label: "Last week", value: 254, max: 320, color: "bg-foreground-muted/40" },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-xs text-foreground-muted">
                  <span>{row.label}</span>
                  <span className="font-medium text-foreground">{row.value} kWh</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={`h-full rounded-full ${row.color}`}
                    style={{ width: `${(row.value / row.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-accent-green-soft px-3 py-2 text-xs font-medium text-accent-green">
            +12.6% vs last week — Estimated Forecast: 312 kWh next week
          </div>
        </div>
      </div>
    </section>
  );
}

export function AlertsSection() {
  return (
    <section className="bg-surface-muted/50 px-6 py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div className="order-2 space-y-3 lg:order-1">
          {[
            { icon: ShieldAlert, tone: "text-accent-red bg-accent-red-soft", label: "Critical", text: "Phase B voltage exceeds 250V threshold" },
            { icon: BellRing, tone: "text-accent-amber bg-accent-amber-soft", label: "Warning", text: "Load imbalance at 14.2%, above 10% limit" },
            { icon: CheckCircle2, tone: "text-accent-green bg-accent-green-soft", label: "Resolved", text: "Communication restored with ESP32-001" },
          ].map((a) => (
            <div key={a.text} className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-surface p-4 card-shadow">
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${a.tone}`}>
                <a.icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground-muted">{a.label}</p>
                <p className="truncate text-sm text-foreground">{a.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="order-1 lg:order-2">
          <SectionHeading
            eyebrow="Alerting"
            title="Catch problems before they cost you"
            align="left"
            description="Eight alert types — from high/low voltage to communication failure — each with configurable thresholds and Info/Warning/Critical severity."
          />
        </div>
      </div>
    </section>
  );
}
