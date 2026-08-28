import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HeroPreview, ActivityBadge } from "./HeroPreview";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-24 sm:pt-28">
      <div className="mx-auto max-w-4xl text-center">
        <div className="flex justify-center">
          <ActivityBadge />
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
          Intelligent Three-Phase
          <br />
          Energy Monitoring
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-foreground-muted">
          SmartGrid Monitor turns your ESP32 and PZEM sensor array into a real-time analytics
          platform — track voltage, current, power and energy across all three phases, catch
          imbalances before they cause damage, and forecast consumption with confidence.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Get started free <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              View live demo
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-16">
        <HeroPreview />
      </div>
    </section>
  );
}
