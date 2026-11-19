"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Clock,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Maximize2,
  ChevronRight,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/Loading";
import type { AIPredictionResult, AIRiskLevel } from "@/types";
import { formatNumber } from "@/lib/utils";

const RISK_TONE: Record<AIRiskLevel, "green" | "blue" | "amber" | "red"> = {
  LOW: "green",
  MODERATE: "blue",
  ELEVATED: "amber",
  CRITICAL: "red",
};

export function AIPredictionPanel({
  deviceId,
  onOpenExpandChart,
  aiData: initialAiData,
}: {
  deviceId: string;
  onOpenExpandChart?: (metric: "ai_forecast" | "voltage") => void;
  aiData?: AIPredictionResult | null;
}) {
  const [data, setData] = useState<AIPredictionResult | null>(initialAiData ?? null);
  const [loading, setLoading] = useState(!initialAiData);

  useEffect(() => {
    let cancelled = false;

    const fetchAI = () => {
      fetch(`/api/ai/predict?deviceId=${deviceId}`)
        .then((r) => r.json())
        .then((res) => {
          if (!cancelled && res?.classification) {
            setData(res);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    fetchAI();
    const timer = setInterval(fetchAI, 12000); // refresh AI predictions periodically
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [deviceId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingState label="Computing AI Grid Health Classification & Predictive Trajectory..." />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { classification, healthScore, riskLevel, earlyWarnings, suggestions, metrics } = data;

  return (
    <div className="space-y-4">
      {/* Top Banner: AI Classification & Health Meter */}
      <Card className="overflow-hidden border-border-subtle bg-gradient-to-br from-surface via-surface to-accent-blue/5">
        <CardHeader className="flex-wrap items-start justify-between gap-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue shadow-sm">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>AI Predictive Grid Intelligence & Early Warning</CardTitle>
                <Badge tone={RISK_TONE[riskLevel]}>{riskLevel} RISK</Badge>
              </div>
              <p className="mt-0.5 text-xs text-foreground-muted">
                Preemptive anomaly detection & classification based on IEEE 519 / EN 50160 power quality standards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Health Score Meter */}
            <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface px-4 py-2 shadow-sm">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-foreground-muted">Grid Health</p>
                <p
                  className={`text-xl font-extrabold ${
                    healthScore >= 85
                      ? "text-accent-green"
                      : healthScore >= 70
                        ? "text-accent-amber"
                        : "text-accent-red"
                  }`}
                >
                  {healthScore}/100
                </p>
              </div>
              <div className="h-9 w-1.5 rounded-full bg-surface-muted overflow-hidden">
                <div
                  className={`w-full rounded-full transition-all duration-500 ${
                    healthScore >= 85
                      ? "bg-accent-green"
                      : healthScore >= 70
                        ? "bg-accent-amber"
                        : "bg-accent-red"
                  }`}
                  style={{ height: `${healthScore}%` }}
                />
              </div>
            </div>

            {onOpenExpandChart && (
              <button
                type="button"
                onClick={() => onOpenExpandChart("ai_forecast")}
                className="flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted transition-colors shadow-sm"
                title="Inspect AI trajectory in large modal"
              >
                <Maximize2 className="size-3.5 text-accent-blue" />
                <span className="hidden sm:inline">Inspect Forecast</span>
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {/* Active Classification Box */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex size-2 rounded-full bg-accent-blue animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foreground-muted">State Classification:</span>
                  <span className="text-sm font-bold text-foreground">{classification.label}</span>
                  <span className="rounded-md bg-accent-blue/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent-blue">
                    {classification.confidencePercent}% Confidence
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-foreground-muted leading-relaxed">
                  {classification.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-muted border-t sm:border-t-0 sm:border-l border-border-subtle pt-2 sm:pt-0 sm:pl-4">
              <div>
                <span className="text-[11px] block text-foreground-muted">Synthesized V_3φ</span>
                <span className="font-semibold text-foreground">
                  {formatNumber(metrics.threePhaseVoltage, 1)} V
                </span>
              </div>
              <div>
                <span className="text-[11px] block text-foreground-muted">V Imbalance</span>
                <span className="font-semibold text-foreground">
                  {formatNumber(metrics.voltageImbalance, 1)}%
                </span>
              </div>
              <div>
                <span className="text-[11px] block text-foreground-muted">Avg PF</span>
                <span className="font-semibold text-foreground">
                  {formatNumber(metrics.powerFactorAvg, 2)}
                </span>
              </div>
              <div>
                <span className="text-[11px] block text-foreground-muted">Drift Rate</span>
                <span
                  className={`font-semibold flex items-center gap-0.5 ${
                    metrics.voltageDriftPerMin < -0.2
                      ? "text-accent-red"
                      : metrics.voltageDriftPerMin > 0.2
                        ? "text-accent-amber"
                        : "text-foreground"
                  }`}
                >
                  {metrics.voltageDriftPerMin < 0 ? (
                    <TrendingDown className="size-3" />
                  ) : (
                    <TrendingUp className="size-3" />
                  )}
                  {formatNumber(metrics.voltageDriftPerMin, 2)} V/min
                </span>
              </div>
            </div>
          </div>

          {/* Grid Layout for Early Warnings & Actionable Suggestions */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Preemptive Early Warnings (Before actual problem arises) */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-accent-amber" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Impending Warnings & Forecasted Anomalies
                </h3>
              </div>

              <div className="space-y-2">
                {earlyWarnings.map((w) => (
                  <div
                    key={w.id}
                    className={`rounded-xl border p-3 transition-all ${
                      w.severity === "critical"
                        ? "border-accent-red/30 bg-accent-red/5"
                        : w.severity === "warning"
                          ? "border-accent-amber/30 bg-accent-amber/5"
                          : "border-border-subtle bg-surface"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {w.severity === "critical" ? (
                          <span className="size-2 rounded-full bg-accent-red animate-ping" />
                        ) : w.severity === "warning" ? (
                          <span className="size-2 rounded-full bg-accent-amber" />
                        ) : (
                          <CheckCircle2 className="size-3.5 text-accent-green" />
                        )}
                        <h4 className="text-xs font-semibold text-foreground">{w.title}</h4>
                      </div>

                      {w.timeToBreachMinutes !== null ? (
                        <span className="flex items-center gap-1 rounded-full bg-accent-amber/15 px-2 py-0.5 text-[10px] font-bold text-accent-amber">
                          <Clock className="size-3" />
                          Breach in ~{w.timeToBreachMinutes} min
                        </span>
                      ) : (
                        <Badge tone={w.severity === "critical" ? "red" : w.severity === "warning" ? "amber" : "green"}>
                          {w.severity.toUpperCase()}
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1.5 text-xs text-foreground-muted leading-relaxed">{w.message}</p>

                    <div className="mt-2 flex items-center justify-between border-t border-border-subtle/60 pt-2 text-[11px] text-foreground-muted">
                      <span>
                        Parameter: <strong className="text-foreground">{w.parameter}</strong>
                      </span>
                      <span>
                        Limit: <strong className="text-foreground">{w.thresholdValue} {w.unit}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prescriptive Engineering Suggestions (Remediation) */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="size-4 text-accent-blue" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Actionable AI Engineering Suggestions
                </h3>
              </div>

              <div className="space-y-2">
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-border-subtle bg-surface p-3 transition-all hover:border-accent-blue/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="flex size-5 items-center justify-center rounded-md bg-accent-blue/10 text-accent-blue text-[11px] font-bold">
                          AI
                        </span>
                        <h4 className="text-xs font-semibold text-foreground">{s.title}</h4>
                      </div>
                      <Badge
                        tone={
                          s.priority === "urgent"
                            ? "red"
                            : s.priority === "high"
                              ? "amber"
                              : s.priority === "medium"
                                ? "blue"
                                : "neutral"
                        }
                      >
                        {s.priority.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="mt-2 rounded-lg bg-surface-muted p-2 text-[11px] leading-relaxed text-foreground">
                      <strong className="text-accent-blue">Recommended Action: </strong>
                      {s.action}
                    </div>

                    <p className="mt-2 text-[11px] text-foreground-muted leading-relaxed">
                      <strong>Expected Impact: </strong>
                      {s.expectedImpact}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
