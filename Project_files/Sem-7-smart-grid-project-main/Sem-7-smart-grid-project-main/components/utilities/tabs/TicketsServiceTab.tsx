"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Ticket as TicketIcon, Wrench } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dropdown } from "@/components/ui/Dropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/Loading";
import { NewTicketModal } from "./NewTicketModal";
import { NewServiceRecordModal } from "./NewServiceRecordModal";
import { formatDateTime } from "@/lib/utils";
import type { TicketRecord, ServiceRecordRecord } from "@/types";

const STATUS_OPTIONS = [
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Closed", value: "CLOSED" },
];

const PRIORITY_TONE = { LOW: "neutral", MEDIUM: "blue", HIGH: "amber", URGENT: "red" } as const;
const STATUS_TONE = { OPEN: "red", IN_PROGRESS: "amber", RESOLVED: "green", CLOSED: "neutral" } as const;

export function TicketsServiceTab({ nodeId }: { nodeId: string }) {
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [records, setRecords] = useState<ServiceRecordRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);

  const load = () => {
    Promise.all([
      fetch(`/api/utility-nodes/${nodeId}/tickets`).then((r) => r.json()),
      fetch(`/api/utility-nodes/${nodeId}/service-records`).then((r) => r.json()),
    ])
      .then(([ticketData, recordData]) => {
        setTickets(ticketData.tickets ?? []);
        setRecords(recordData.records ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [nodeId]);

  const updateStatus = async (ticketId: string, status: string) => {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Could not update ticket.");
      return;
    }
    load();
  };

  if (loading) return <LoadingState label="Loading tickets and service records..." />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Tickets & Complaints</CardTitle>
          <Button size="sm" className="gap-1.5" onClick={() => setTicketModalOpen(true)}>
            <Plus className="size-3.5" /> New ticket
          </Button>
        </CardHeader>
        <CardContent className="pt-3">
          {tickets.length === 0 ? (
            <EmptyState icon={TicketIcon} title="No tickets" description="Nothing raised for this utility yet." />
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="rounded-xl border border-border-subtle p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{t.title}</p>
                        <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
                        <Badge tone="neutral">{t.category}</Badge>
                        {t.sourceAlert && <Badge tone="blue">from alert</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-foreground-muted">{t.description}</p>
                      <p className="mt-1 text-xs text-foreground-muted">
                        {formatDateTime(t.createdAt)}
                        {t.createdBy && ` · ${t.createdBy.name}`}
                        {t.assignedTo && ` · assigned to ${t.assignedTo}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={STATUS_TONE[t.status]}>{t.status.replace("_", " ")}</Badge>
                      <Dropdown options={STATUS_OPTIONS} value={t.status} onChange={(v) => updateStatus(t.id, v)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Service History</CardTitle>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setRecordModalOpen(true)}>
            <Plus className="size-3.5" /> Log record
          </Button>
        </CardHeader>
        <CardContent className="pt-3">
          {records.length === 0 ? (
            <EmptyState icon={Wrench} title="No service records" description="Maintenance and service history for this utility will show up here." />
          ) : (
            <div className="space-y-3">
              {records.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-3 rounded-xl border border-border-subtle p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge tone="neutral">{r.type}</Badge>
                      <p className="text-xs text-foreground-muted">{formatDateTime(r.performedAt)}</p>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{r.description}</p>
                    <p className="mt-1 text-xs text-foreground-muted">
                      {r.performedBy}
                      {r.notes && ` · ${r.notes}`}
                    </p>
                  </div>
                  {r.cost !== null && <p className="shrink-0 text-sm font-semibold text-foreground">${r.cost.toFixed(2)}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NewTicketModal nodeId={nodeId} open={ticketModalOpen} onClose={() => setTicketModalOpen(false)} onCreated={load} />
      <NewServiceRecordModal nodeId={nodeId} open={recordModalOpen} onClose={() => setRecordModalOpen(false)} onCreated={load} />
    </div>
  );
}
