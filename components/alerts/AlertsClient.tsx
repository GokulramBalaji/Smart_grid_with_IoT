"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Bell, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/Loading";
import { Card } from "@/components/ui/Card";
import { SeverityBadge, StatusBadge } from "./AlertBadges";
import { ALERT_TYPE_LABELS, PHASE_LABELS, type AlertRecord } from "@/types";
import { formatDateTime } from "@/lib/utils";

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Acknowledged", value: "ACKNOWLEDGED" },
  { label: "Resolved", value: "RESOLVED" },
];

const SEVERITY_OPTIONS = [
  { label: "All severities", value: "" },
  { label: "Critical", value: "CRITICAL" },
  { label: "Warning", value: "WARNING" },
  { label: "Info", value: "INFO" },
];

export function AlertsClient() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [activeCounts, setActiveCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (severity) params.set("severity", severity);
    params.set("page", String(page));

    fetch(`/api/alerts?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setAlerts(data.alerts ?? []);
        setActiveCounts(data.activeCounts ?? {});
        setTotalPages(data.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [search, status, severity, page]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  const updateStatus = async (id: string, newStatus: "ACKNOWLEDGED" | "RESOLVED") => {
    const res = await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      toast.error("Could not update alert.");
      return;
    }
    toast.success(newStatus === "ACKNOWLEDGED" ? "Alert acknowledged." : "Alert resolved.");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Alert Center</h1>
          <p className="mt-1 text-sm text-foreground-muted">Threshold breaches and system events across your devices</p>
        </div>
        <div className="flex gap-2">
          <Card className="px-4 py-2 text-center">
            <p className="text-lg font-semibold text-accent-red">{activeCounts.CRITICAL ?? 0}</p>
            <p className="text-[11px] text-foreground-muted">Critical</p>
          </Card>
          <Card className="px-4 py-2 text-center">
            <p className="text-lg font-semibold text-accent-amber">{activeCounts.WARNING ?? 0}</p>
            <p className="text-[11px] text-foreground-muted">Warning</p>
          </Card>
          <Card className="px-4 py-2 text-center">
            <p className="text-lg font-semibold text-accent-blue">{activeCounts.INFO ?? 0}</p>
            <p className="text-[11px] text-foreground-muted">Info</p>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search alerts..."
            icon={<Search className="size-4" />}
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <Dropdown
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => {
            setPage(1);
            setStatus(v);
          }}
        />
        <Dropdown
          options={SEVERITY_OPTIONS}
          value={severity}
          onChange={(v) => {
            setPage(1);
            setSeverity(v);
          }}
        />
      </div>

      {loading ? (
        <LoadingState label="Loading alerts..." />
      ) : alerts.length === 0 ? (
        <EmptyState icon={Bell} title="No alerts found" description="Nothing matches your current filters." />
      ) : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Severity</Th>
                <Th>Type</Th>
                <Th>Device</Th>
                <Th>Phase</Th>
                <Th>Message</Th>
                <Th>Timestamp</Th>
                <Th>Status</Th>
                <Th className="sticky right-0 bg-surface-muted/60"></Th>
              </tr>
            </Thead>
            <tbody>
              {alerts.map((a) => (
                <Tr key={a.id}>
                  <Td>
                    <SeverityBadge severity={a.severity} />
                  </Td>
                  <Td>{ALERT_TYPE_LABELS[a.type]}</Td>
                  <Td>{a.device.name}</Td>
                  <Td>{a.phase ? PHASE_LABELS[a.phase] : "—"}</Td>
                  <Td className="max-w-[200px] truncate text-foreground-muted" title={a.message}>
                    {a.message}
                  </Td>
                  <Td className="whitespace-nowrap text-foreground-muted">{formatDateTime(a.timestamp)}</Td>
                  <Td>
                    <StatusBadge status={a.status} />
                  </Td>
                  <Td className="sticky right-0 whitespace-nowrap bg-surface">
                    {a.status === "ACTIVE" && (
                      <Button
                        size="sm"
                        variant="outline"
                        title="Acknowledge"
                        onClick={() => updateStatus(a.id, "ACKNOWLEDGED")}
                      >
                        <Check className="size-3.5" /> Ack
                      </Button>
                    )}
                    {a.status === "ACKNOWLEDGED" && (
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(a.id, "RESOLVED")}>
                        Resolve
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          <div className="flex items-center justify-between">
            <p className="text-xs text-foreground-muted">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
