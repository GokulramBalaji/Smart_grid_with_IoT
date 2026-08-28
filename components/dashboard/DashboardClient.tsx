"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useDashboardStream } from "@/hooks/useDashboardStream";
import { useDemoMode } from "@/hooks/useDemoMode";
import { StatusPill } from "./StatusPill";
import { SummaryCards } from "./SummaryCards";
import { PhaseCards } from "./PhaseCards";
import { PowerChart } from "./PowerChart";
import { AnalysisSection } from "./AnalysisSection";
import { Switch } from "@/components/ui/Switch";
import { CardSkeleton } from "@/components/ui/Loading";
import { relativeTime } from "@/lib/utils";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export function DashboardClient({ deviceId, userName }: { deviceId: string; userName: string }) {
  const { summary, loading } = useDashboardStream(deviceId);
  const demo = useDemoMode(deviceId, summary?.device?.demoMode ?? false);
  const greetingText = useMemo(() => greeting(), []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-foreground-muted">
            {greetingText}, {userName}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">SmartGrid Monitor</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-2">
            <Sparkles className="size-4 text-accent-blue" />
            <span className="text-xs font-medium text-foreground">Demo Mode</span>
            <Switch checked={demo.enabled} onChange={demo.toggle} disabled={demo.toggling} />
          </div>
          {summary?.device && <StatusPill status={summary.device.status} />}
        </div>
      </div>

      {summary?.device?.lastSeenAt && (
        <p className="-mt-4 text-xs text-foreground-muted">
          Last reading {relativeTime(summary.timestamp)} · Device last seen {relativeTime(summary.device.lastSeenAt)}
        </p>
      )}

      {loading || !summary?.device ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <SummaryCards summary={summary} deviceId={deviceId} />
          <PhaseCards phases={summary.phases} />
          <PowerChart deviceId={deviceId} />
          <AnalysisSection summary={summary} />
        </>
      )}
    </div>
  );
}
