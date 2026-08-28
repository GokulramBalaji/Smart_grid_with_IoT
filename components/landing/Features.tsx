import { Activity, ShieldAlert, BarChart3, Cpu, Gauge, Scale } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const features = [
  {
    icon: Activity,
    title: "Real-time monitoring",
    description:
      "Live telemetry from your ESP32 streams straight to the dashboard — voltage, current, power and frequency update continuously with no manual refresh.",
  },
  {
    icon: Scale,
    title: "Three-phase awareness",
    description:
      "Purpose-built for R/Y/B phase deployments. See per-phase detail side by side and catch load imbalance the moment it appears.",
  },
  {
    icon: BarChart3,
    title: "Deep analytics",
    description:
      "Hourly, daily, weekly and monthly consumption trends with period-over-period comparisons and an explainable forecasting model.",
  },
  {
    icon: ShieldAlert,
    title: "Smart alerting",
    description:
      "Configurable thresholds for voltage, current, imbalance and power factor automatically raise alerts, from informational to critical.",
  },
  {
    icon: Gauge,
    title: "Load balancing insights",
    description:
      "Instantly see which phase is carrying the most load and get concrete recommendations for redistributing connected circuits.",
  },
  {
    icon: Cpu,
    title: "Multi-device ready",
    description:
      "Provision additional ESP32 + PZEM deployments with per-device API keys, status tracking, and independent configuration.",
  },
];

export function Features() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Platform"
          title="Everything a grid operator needs"
          description="From ingestion to insight, SmartGrid Monitor covers the full lifecycle of your energy data."
        />
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border-subtle bg-surface p-6 card-shadow-hover"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent-blue-soft">
                <f.icon className="size-5 text-accent-blue" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
