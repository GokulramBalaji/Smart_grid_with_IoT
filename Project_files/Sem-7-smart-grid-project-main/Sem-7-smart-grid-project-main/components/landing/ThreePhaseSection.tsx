import { SectionHeading } from "./SectionHeading";

const phases = [
  { key: "R", name: "Phase R", sensor: "PZEM 1", color: "bg-phase-r", desc: "Primary distribution leg" },
  { key: "Y", name: "Phase Y", sensor: "PZEM 2", color: "bg-phase-y", desc: "Secondary distribution leg" },
  { key: "B", name: "Phase B", sensor: "PZEM 3", color: "bg-phase-b", desc: "Tertiary distribution leg" },
];

export function ThreePhaseSection() {
  return (
    <section id="phases" className="bg-surface-muted/50 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Hardware"
          title="Built around your ESP32 + 3× PZEM rig"
          description="One microcontroller, three energy-monitoring sensors — one per electrical phase — streaming synchronized readings over Wi-Fi."
        />

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {phases.map((p) => (
            <div key={p.key} className="rounded-2xl border border-border-subtle bg-surface p-6 card-shadow">
              <div className="flex items-center justify-between">
                <span className={`flex size-10 items-center justify-center rounded-xl text-sm font-semibold text-white ${p.color}`}>
                  {p.key}
                </span>
                <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground-muted">
                  {p.sensor}
                </span>
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-foreground">{p.name}</h3>
              <p className="mt-1 text-sm text-foreground-muted">{p.desc}</p>
              <dl className="mt-4 grid grid-cols-2 gap-y-2 text-xs">
                {["Voltage", "Current", "Active Power", "Power Factor", "Frequency", "Energy"].map((m) => (
                  <div key={m} className="flex items-center gap-1.5 text-foreground-muted">
                    <span className="size-1 rounded-full bg-foreground-muted/50" />
                    {m}
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
