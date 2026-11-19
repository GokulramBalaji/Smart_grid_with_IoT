"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Database, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/Loading";
import { formatDateTime } from "@/lib/utils";
import { PHASE_LABELS, type PhaseKey } from "@/types";

const PHASE_OPTIONS = [
  { label: "All phases", value: "" },
  { label: "Phase R", value: "R" },
  { label: "Phase Y", value: "Y" },
  { label: "Phase B", value: "B" },
];

interface ReadingRow {
  id: string;
  timestamp: string;
  phase: PhaseKey;
  voltage: number;
  current: number;
  activePower: number;
  apparentPower: number;
  reactivePower: number;
  powerFactor: number;
  frequency: number;
  energy: number;
  device: { name: string };
}

function SortHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
}: {
  label: string;
  field: string;
  sortField: string;
  sortDir: string;
  onSort: (field: string) => void;
}) {
  const active = sortField === field;
  return (
    <button onClick={() => onSort(field)} className="flex items-center gap-1 hover:text-foreground">
      {label}
      {active && (sortDir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />)}
    </button>
  );
}

export function HistoricalDataClient() {
  const [readings, setReadings] = useState<ReadingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortField, setSortField] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (phase) params.set("phase", phase);
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to).toISOString());
    params.set("sortField", sortField);
    params.set("sortDir", sortDir);
    return params;
  }, [search, phase, from, to, sortField, sortDir]);

  const load = useCallback(() => {
    setLoading(true);
    const params = buildParams();
    params.set("page", String(page));
    fetch(`/api/readings?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setReadings(data.readings ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [buildParams, page]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const exportUrl = `/api/readings/export?${buildParams()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Historical Data</h1>
          <p className="mt-1 text-sm text-foreground-muted">{total.toLocaleString()} readings across all devices</p>
        </div>
        <a href={exportUrl}>
          <Button variant="outline" className="gap-1.5">
            <Download className="size-4" /> Export CSV
          </Button>
        </a>
      </div>

      <Card className="flex flex-wrap items-end gap-3 p-4">
        <div className="w-full max-w-xs">
          <Input
            label="Search device"
            icon={<Search className="size-4" />}
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Device name..."
          />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">Phase</p>
          <Dropdown
            options={PHASE_OPTIONS}
            value={phase}
            onChange={(v) => {
              setPage(1);
              setPhase(v);
            }}
          />
        </div>
        <Input
          label="From"
          type="datetime-local"
          value={from}
          onChange={(e) => {
            setPage(1);
            setFrom(e.target.value);
          }}
        />
        <Input
          label="To"
          type="datetime-local"
          value={to}
          onChange={(e) => {
            setPage(1);
            setTo(e.target.value);
          }}
        />
      </Card>

      {loading ? (
        <LoadingState label="Loading readings..." />
      ) : readings.length === 0 ? (
        <EmptyState icon={Database} title="No readings found" description="Try adjusting your filters." />
      ) : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>
                  <SortHeader label="Timestamp" field="timestamp" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </Th>
                <Th>Device</Th>
                <Th>Phase</Th>
                <Th>
                  <SortHeader label="Voltage" field="voltage" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </Th>
                <Th>
                  <SortHeader label="Current" field="current" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </Th>
                <Th>
                  <SortHeader label="Active Power" field="activePower" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </Th>
                <Th>Apparent Power</Th>
                <Th>Reactive Power</Th>
                <Th>
                  <SortHeader label="Power Factor" field="powerFactor" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </Th>
                <Th>Frequency</Th>
                <Th>
                  <SortHeader label="Energy" field="energy" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </Th>
              </tr>
            </Thead>
            <tbody>
              {readings.map((r) => (
                <Tr key={r.id}>
                  <Td className="whitespace-nowrap">{formatDateTime(r.timestamp)}</Td>
                  <Td className="whitespace-nowrap">{r.device.name}</Td>
                  <Td>{PHASE_LABELS[r.phase]}</Td>
                  <Td>{r.voltage.toFixed(1)} V</Td>
                  <Td>{r.current.toFixed(2)} A</Td>
                  <Td>{r.activePower.toFixed(0)} W</Td>
                  <Td>{r.apparentPower.toFixed(0)} VA</Td>
                  <Td>{r.reactivePower.toFixed(0)} VAR</Td>
                  <Td>{r.powerFactor.toFixed(2)}</Td>
                  <Td>{r.frequency.toFixed(2)} Hz</Td>
                  <Td>{r.energy.toFixed(2)} kWh</Td>
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
