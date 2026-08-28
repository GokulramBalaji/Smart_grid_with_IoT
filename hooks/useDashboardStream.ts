"use client";

import { useEffect, useRef, useState } from "react";
import type { DashboardSummary } from "@/types";

interface UseDashboardStreamResult {
  summary: DashboardSummary | null;
  connected: boolean;
  loading: boolean;
}

/**
 * Subscribes to the SSE dashboard stream for live updates, with a one-time
 * REST fetch for the initial paint so the UI isn't blank while the stream
 * connects. Falls back to nothing fancy — EventSource reconnects
 * automatically on drop.
 */
export function useDashboardStream(deviceId?: string): UseDashboardStreamResult {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/dashboard${deviceId ? `?deviceId=${deviceId}` : ""}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const url = `/api/stream/dashboard${deviceId ? `?deviceId=${deviceId}` : ""}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("open", () => setConnected(true));
    es.addEventListener("error", () => setConnected(false));
    es.addEventListener("dashboard", (event) => {
      setConnected(true);
      setLoading(false);
      setSummary(JSON.parse((event as MessageEvent).data));
    });
    es.addEventListener("heartbeat", () => setConnected(true));

    return () => {
      cancelled = true;
      es.close();
    };
  }, [deviceId]);

  return { summary, connected, loading };
}
