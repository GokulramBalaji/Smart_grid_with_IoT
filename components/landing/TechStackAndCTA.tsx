import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "./SectionHeading";

const stack = [
  { name: "Next.js 16", role: "Full-stack React framework" },
  { name: "TypeScript", role: "End-to-end type safety" },
  { name: "PostgreSQL", role: "Relational data storage" },
  { name: "Prisma ORM", role: "Type-safe database access" },
  { name: "Tailwind CSS", role: "Apple-inspired design system" },
  { name: "Recharts", role: "Interactive data visualization" },
  { name: "Auth.js", role: "Secure credential authentication" },
  { name: "ESP32 + PZEM", role: "Three-phase IoT hardware" },
];

export function TechStack() {
  return (
    <section id="stack" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Technology" title="A modern, production-grade stack" />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stack.map((s) => (
            <div key={s.name} className="rounded-2xl border border-border-subtle bg-surface p-5">
              <p className="text-sm font-semibold text-foreground">{s.name}</p>
              <p className="mt-1 text-xs text-foreground-muted">{s.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-5xl rounded-3xl bg-foreground px-8 py-16 text-center sm:px-16">
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Ready to monitor your grid?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/70">
          Spin up SmartGrid Monitor with realistic demo data in seconds — no hardware required to
          explore the full platform.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register">
            <Button size="lg" variant="secondary" className="gap-2 bg-white text-foreground hover:bg-white/90">
              Create free account <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
