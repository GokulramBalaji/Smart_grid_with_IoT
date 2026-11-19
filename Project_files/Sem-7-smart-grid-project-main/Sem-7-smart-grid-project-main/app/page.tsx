import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { ThreePhaseSection } from "@/components/landing/ThreePhaseSection";
import { AnalyticsSection, AlertsSection } from "@/components/landing/AnalyticsAlertsSection";
import { TechStack, CTASection } from "@/components/landing/TechStackAndCTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <Features />
        <ThreePhaseSection />
        <AnalyticsSection />
        <AlertsSection />
        <TechStack />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
