"use client";

import { useDashboardStream } from "@/hooks/useDashboardStream";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { PhaseCards } from "@/components/dashboard/PhaseCards";
import { CardSkeleton } from "@/components/ui/Loading";

export function DashboardOverviewLive({ deviceId }: { deviceId: string }) {
  const { summary, loading } = useDashboardStream(deviceId);

  if (loading || !summary?.device) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SummaryCards summary={summary} deviceId={deviceId} />
      <PhaseCards phases={summary.phases} />
    </div>
  );
}
