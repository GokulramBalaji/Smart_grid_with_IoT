"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const TICK_INTERVAL_MS = 5000;

export function useDemoMode(deviceId: string | undefined, initialEnabled: boolean) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [toggling, setToggling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Follow `initialEnabled` (e.g. a value arriving over SSE) without an Effect —
  // adjusting state during render, per https://react.dev/learn/you-might-not-need-an-effect
  const [prevInitialEnabled, setPrevInitialEnabled] = useState(initialEnabled);
  if (initialEnabled !== prevInitialEnabled) {
    setPrevInitialEnabled(initialEnabled);
    setEnabled(initialEnabled);
  }

  useEffect(() => {
    if (!deviceId || !enabled) return;

    const tick = () => {
      fetch("/api/demo/tick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      }).catch(() => {});
    };

    tick();
    intervalRef.current = setInterval(tick, TICK_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [deviceId, enabled]);

  const toggle = async (next: boolean) => {
    if (!deviceId) return;
    setToggling(true);
    const res = await fetch("/api/demo/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, enabled: next }),
    });
    setToggling(false);

    if (!res.ok) {
      toast.error("Could not update demo mode.");
      return;
    }
    setEnabled(next);
    toast.success(next ? "Demo mode enabled — simulating live readings." : "Demo mode disabled.");
  };

  return { enabled, toggling, toggle };
}
