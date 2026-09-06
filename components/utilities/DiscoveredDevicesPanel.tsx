"use client";

import { useEffect, useState } from "react";
import { Wifi, Radar } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ClaimDeviceModal } from "./ClaimDeviceModal";
import { relativeTime } from "@/lib/utils";

interface PendingDevice {
  id: string;
  deviceIdentifier: string;
  wifiSsid: string;
  lastAnnouncedAt: string;
}

export function DiscoveredDevicesPanel({ onClaimed }: { onClaimed: () => void }) {
  const [pending, setPending] = useState<PendingDevice[]>([]);
  const [claimTarget, setClaimTarget] = useState<PendingDevice | null>(null);

  const load = () => {
    fetch("/api/devices/pending")
      .then((r) => r.json())
      .then((data) => setPending(data.pending ?? []));
  };

  useEffect(load, []);

  // The claim modal must stay mounted (to show the one-time API key) even
  // after `load()` empties the pending list following a successful claim, so
  // it's rendered unconditionally below rather than inside the early return.
  if (pending.length === 0 && !claimTarget) return null;

  return (
    <>
      {pending.length > 0 && (
        <Card className="border-accent-blue/30 bg-accent-blue-soft p-5">
          <div className="flex items-center gap-2">
            <Radar className="size-4 text-accent-blue" />
            <h3 className="text-sm font-semibold text-foreground">
              {pending.length} device{pending.length === 1 ? "" : "s"} discovered on your network
            </h3>
          </div>
          <p className="mt-1 text-xs text-foreground-muted">
            These ESP32s announced themselves with their Wi-Fi network but aren&apos;t mapped to a utility yet.
          </p>
          <div className="mt-3 space-y-2">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{p.deviceIdentifier}</p>
                  <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
                    <Wifi className="size-3" /> {p.wifiSsid} · seen {relativeTime(p.lastAnnouncedAt)}
                  </p>
                </div>
                <Button size="sm" onClick={() => setClaimTarget(p)} className="shrink-0">
                  Claim &amp; map
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <ClaimDeviceModal
        pendingDevice={claimTarget}
        open={!!claimTarget}
        onClose={() => setClaimTarget(null)}
        onClaimed={() => {
          // Don't clear claimTarget here — the modal still needs to show the
          // one-time API key. It closes itself via onClose when the user
          // clicks "Done".
          load();
          onClaimed();
        }}
      />
    </>
  );
}
