"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Cpu, MapPin, Wifi } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/Loading";
import { AddDeviceModal } from "./AddDeviceModal";
import { relativeTime } from "@/lib/utils";
import type { DeviceConnectionStatus } from "@/types";

interface DeviceListItem {
  id: string;
  name: string;
  deviceIdentifier: string;
  location: string | null;
  lastSeenAt: string | null;
  connectionStatus: DeviceConnectionStatus;
  demoMode: boolean;
  _count: { readings: number; alerts: number };
}

const STATUS_TONE = { online: "green", offline: "red", provisioning: "amber" } as const;

export function DevicesClient() {
  const [devices, setDevices] = useState<DeviceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = () => {
    fetch("/api/devices")
      .then((r) => r.json())
      .then((data) => {
        setDevices(data.devices ?? []);
        setLoading(false);
      });
  };

  useEffect(load, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Devices</h1>
          <p className="mt-1 text-sm text-foreground-muted">Manage your ESP32 + PZEM deployments</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-1.5">
          <Plus className="size-4" /> Add device
        </Button>
      </div>

      {loading ? (
        <LoadingState label="Loading devices..." />
      ) : devices.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="No devices yet"
          description="Add your first ESP32 + PZEM device to start receiving readings."
          action={<Button onClick={() => setModalOpen(true)}>Add a device</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((d) => (
            <Link key={d.id} href={`/dashboard/devices/${d.id}`}>
              <Card hover className="h-full p-5">
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-accent-blue-soft">
                    <Cpu className="size-5 text-accent-blue" />
                  </div>
                  <Badge tone={STATUS_TONE[d.connectionStatus]} dot>
                    {d.connectionStatus}
                  </Badge>
                </div>
                <h3 className="mt-3 text-[15px] font-semibold text-foreground">{d.name}</h3>
                <p className="text-xs text-foreground-muted">{d.deviceIdentifier}</p>

                {d.location && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground-muted">
                    <MapPin className="size-3.5" /> {d.location}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3 text-xs text-foreground-muted">
                  <span className="flex items-center gap-1.5">
                    <Wifi className="size-3.5" /> {relativeTime(d.lastSeenAt)}
                  </span>
                  <span>{d._count.readings.toLocaleString()} readings</span>
                </div>
                {d.demoMode && (
                  <Badge tone="blue" className="mt-3">
                    Demo Mode
                  </Badge>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      <AddDeviceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          load();
        }}
      />
    </div>
  );
}
