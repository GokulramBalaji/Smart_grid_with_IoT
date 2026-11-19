"use client";

import { useMemo, useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useDashboardStream } from "@/hooks/useDashboardStream";
import { useDemoMode } from "@/hooks/useDemoMode";
import { StatusPill } from "./StatusPill";
import { SummaryCards } from "./SummaryCards";
import { PhaseCards } from "./PhaseCards";
import { PowerChart } from "./PowerChart";
import { AnalysisSection } from "./AnalysisSection";
import { AIPredictionPanel } from "./AIPredictionPanel";
import { Switch } from "@/components/ui/Switch";
import { CardSkeleton } from "@/components/ui/Loading";
import { relativeTime } from "@/lib/utils";
import type { AIPredictionResult } from "@/types";
import { ExpandedChartModal } from "@/components/charts/ExpandedChartModal";
import type { ChartRange, GridDataPoint } from "@/lib/analytics/bucket";

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

  // Shared state for AI and expanded chart modal
  const [aiData, setAiData] = useState<AIPredictionResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMetric, setModalMetric] = useState<"voltage" | "power" | "current" | "ai_forecast">("voltage");
  const [modalRange, setModalRange] = useState<ChartRange>("24h");
  const [chartPoints, setChartPoints] = useState<GridDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Fetch AI prediction data periodically
  useEffect(() => {
    if (!deviceId) return;
    let cancelled = false;

    const loadAI = () => {
      fetch(`/api/ai/predict?deviceId=${deviceId}`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled && d?.classification) {
            setAiData(d);
          }
        })
        .catch(() => {});
    };

    loadAI();
    const interval = setInterval(loadAI, 12000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [deviceId, summary?.timestamp]);

  // Load points for the expanded modal if requested
  const openModalWithMetric = (metric: "voltage" | "power" | "current" | "ai_forecast") => {
    setModalMetric(metric);
    setModalOpen(true);
    setChartLoading(true);
    fetch(`/api/readings/history?deviceId=${deviceId}&range=${modalRange}`)
      .then((r) => r.json())
      .then((d) => {
        setChartPoints(d.points ?? []);
        setChartLoading(false);
      })
      .catch(() => setChartLoading(false));
  };

  const handleModalRangeChange = (newRange: ChartRange) => {
    setModalRange(newRange);
    setChartLoading(true);
    fetch(`/api/readings/history?deviceId=${deviceId}&range=${newRange}`)
      .then((r) => r.json())
      .then((d) => {
        setChartPoints(d.points ?? []);
        setChartLoading(false);
      })
      .catch(() => setChartLoading(false));
  };

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

          {/* AI Predictive Intelligence & Early Warning Panel */}
          <AIPredictionPanel
            deviceId={deviceId}
            aiData={aiData}
            onOpenExpandChart={(metric) => openModalWithMetric(metric)}
          />

          {/* 3-Phase Synthesized & Individual Phase Cards */}
          <PhaseCards phases={summary.phases} summary={summary} />

          {/* Real-time Interactive Telemetry Chart (Click to expand) */}
          <PowerChart deviceId={deviceId} aiData={aiData} />

          {/* Detailed Analysis Section (3-Phase & 1-Phase Voltages, Current, PF) */}
          <AnalysisSection summary={summary} />
        </>
      )}

      {/* Standalone / Cross-component Expanded Chart Modal */}
      {modalOpen && (
        <ExpandedChartModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          points={chartPoints}
          loading={chartLoading}
          range={modalRange}
          onRangeChange={handleModalRangeChange}
          aiData={aiData}
          initialMetric={modalMetric}
        />
      )}
    </div>
  );
}
