"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import {
  Copy,
  CheckCircle2,
  Radar,
  Wifi,
  Cpu,
  RefreshCw,
  Search,
  ArrowRight,
  Globe,
  Zap,
} from "lucide-react";

interface NodeOption {
  id: string;
  name: string;
  device: { id: string } | null;
}

interface DiscoveredDevice {
  ip: string;
  mac: string | null;
  vendor: string;
  deviceType?: "ESP32" | "GATEWAY" | "HOST" | "MOBILE" | "DEVICE";
  isEsp32: boolean;
  hostname: string | null;
  responseTimeMs: number;
  openPorts: number[];
  endpointsFound: string[];
  deviceIdentifier?: string;
  previewReadings?: any;
  status: "ONLINE" | "UNREACHABLE";
}

const TABS = [
  { value: "scan", label: "Scan Local Network" },
  { value: "manual", label: "Manual Entry" },
];

export function AddDeviceModal({
  open,
  onClose,
  onCreated,
  utilityNodeId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** When provided, the device attaches to this node directly and no picker is shown. */
  utilityNodeId?: string;
}) {
  const [activeTab, setActiveTab] = useState<string>("scan");

  // Manual & Mapping form state
  const [form, setForm] = useState({
    name: "",
    deviceIdentifier: "",
    location: "",
    ipAddress: "",
  });
  const [selectedNodeId, setSelectedNodeId] = useState(utilityNodeId ?? "");
  const [newUtilityName, setNewUtilityName] = useState("Main Distribution Grid");
  const [nodeOptions, setNodeOptions] = useState<NodeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Network scanning state
  const [scanning, setScanning] = useState(false);
  const [subnetInfo, setSubnetInfo] = useState<any>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [customIp, setCustomIp] = useState("");
  const [selectedDiscovered, setSelectedDiscovered] = useState<DiscoveredDevice | null>(null);

  // Follow a fixed `utilityNodeId` prop without an Effect
  const [prevUtilityNodeId, setPrevUtilityNodeId] = useState(utilityNodeId);
  if (utilityNodeId !== prevUtilityNodeId) {
    setPrevUtilityNodeId(utilityNodeId);
    setSelectedNodeId(utilityNodeId ?? "");
  }

  const runNetworkScan = async (specificIp?: string) => {
    setScanning(true);
    try {
      const url = specificIp ? `/api/network/scan?ip=${encodeURIComponent(specificIp)}` : "/api/network/scan";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setSubnetInfo(data.subnet);
        const list = data.devices ?? [];

        // If no devices found on scan, add the simulated test endpoint so the user can test immediately
        if (list.length === 0 && !specificIp) {
          list.push({
            ip: "127.0.0.1:3000/api/mock-esp32",
            mac: "24:0a:c4:12:34:56",
            vendor: "Espressif Inc. (ESP32 Simulator)",
            isEsp32: true,
            hostname: "SmartGrid-Simulator-Node",
            responseTimeMs: 8,
            openPorts: [80],
            endpointsFound: ["/readings", "/status"],
            deviceIdentifier: "ESP32-SMARTGRID-DEMO",
            status: "ONLINE",
          });
        }

        setDiscoveredDevices(list);
        if (list.length > 0) {
          toast.success(`Scan complete: found ${list.length} network host${list.length === 1 ? "" : "s"}.`);
        } else {
          toast.info("No active devices found. You can enter an IP manually below.");
        }
      } else {
        toast.error(data.error ?? "Failed to scan network.");
      }
    } catch {
      toast.error("Network scan request failed.");
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetch("/api/utility-nodes")
      .then((r) => r.json())
      .then((data) => setNodeOptions((data.nodes ?? []).filter((n: NodeOption) => !n.device)));

    // Auto-scan local network on opening if scan tab is active
    if (activeTab === "scan" && discoveredDevices.length === 0 && !scanning) {
      setTimeout(() => runNetworkScan(), 0);
    }
  }, [open, activeTab]);

  const selectDeviceForMapping = (d: DiscoveredDevice) => {
    setSelectedDiscovered(d);
    const suggestedId = d.deviceIdentifier || `ESP32-${d.ip.replace(/[^0-9]/g, "-").replace(/^-+|-+$/g, "")}`;
    const suggestedName = d.isEsp32 ? `ESP32 Energy Monitor (${d.ip})` : `Device (${d.ip})`;

    setForm({
      name: suggestedName,
      deviceIdentifier: suggestedId,
      location: "",
      ipAddress: d.ip,
    });
  };

  const reset = () => {
    setForm({ name: "", deviceIdentifier: "", location: "", ipAddress: "" });
    setApiKey(null);
    setSelectedDiscovered(null);
    if (!utilityNodeId) setSelectedNodeId("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    setLoading(true);
    let targetNodeId = selectedNodeId;

    // If no utility node is selected, create one automatically
    if (!targetNodeId) {
      const utilRes = await fetch("/api/utility-nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUtilityName.trim() || form.name || "Main Campus Utility" }),
      });
      const utilData = await utilRes.json();
      if (!utilRes.ok) {
        setLoading(false);
        toast.error(utilData.error ?? "Failed to create utility node.");
        return;
      }
      targetNodeId = utilData.node.id;
    }

    const res = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, utilityNodeId: targetNodeId }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Could not create device.");
      return;
    }

    setApiKey(data.apiKey);

    // If an IP address was mapped, trigger an initial test poll right away
    if (form.ipAddress) {
      fetch(`/api/devices/${data.device.id}/poll`, { method: "POST" })
        .then((r) => r.json())
        .then((pollRes) => {
          if (pollRes.success) {
            toast.success(`Successfully connected to ESP32 at ${form.ipAddress} and ingested initial readings!`);
          }
        })
        .catch(() => {});
    }

    onCreated();
  };

  const copyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast.success("API key copied to clipboard.");
    }
  };

  if (apiKey) {
    return (
      <Modal open={open} onClose={handleClose} title="ESP32 Device Mapped">
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-accent-green-soft px-3.5 py-3 text-sm text-accent-green">
            <CheckCircle2 className="size-5 shrink-0" />
            <div>
              <p className="font-semibold">Device successfully created and mapped!</p>
              {form.ipAddress && (
                <p className="mt-0.5 text-xs text-foreground-muted">
                  Mapped IP: <code className="font-mono text-foreground">{form.ipAddress}</code>
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface-muted p-3.5 space-y-2">
            <p className="text-xs text-foreground-muted">
              API key issued for direct push telemetry (copy now — it will not be shown again):
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 py-2">
              <code className="flex-1 overflow-x-auto text-xs text-foreground">{apiKey}</code>
              <button onClick={copyKey} className="shrink-0 rounded-lg p-1.5 hover:bg-surface-muted transition-colors">
                <Copy className="size-4 text-foreground-muted" />
              </button>
            </div>
          </div>

          <Button className="w-full" onClick={handleClose}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add & Map ESP32 Device"
      description="Scan your local network to discover ESP32 sensors or configure manually"
      className="max-w-xl"
    >
      <div className="space-y-4">
        <Tabs tabs={TABS} value={activeTab} onChange={(v) => { setActiveTab(v); setSelectedDiscovered(null); }} className="w-full" />

        {activeTab === "scan" && !selectedDiscovered && (
          <div className="space-y-4">
            {/* Subnet Header & Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-muted p-3.5">
              <div>
                <p className="text-xs font-medium text-foreground-muted">Local Network Subnet</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <Globe className="size-3.5 text-accent-blue" />
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {subnetInfo?.subnetCidr ?? "Scanning subnet..."}
                  </span>
                  {subnetInfo?.interfaceName && (
                    <Badge tone="neutral" className="text-[10px]">
                      {subnetInfo.interfaceName}
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => runNetworkScan()}
                disabled={scanning}
                className="gap-1.5"
              >
                <Radar className={`size-3.5 ${scanning ? "animate-spin" : ""}`} />
                {scanning ? "Scanning LAN..." : "Scan Network"}
              </Button>
            </div>

            {/* Custom IP probe */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Or probe specific IP (e.g. 192.168.1.45)..."
                value={customIp}
                onChange={(e) => setCustomIp(e.target.value)}
                className="text-xs"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => customIp.trim() && runNetworkScan(customIp.trim())}
                disabled={scanning || !customIp.trim()}
                className="shrink-0"
              >
                <Search className="size-3.5" /> Probe
              </Button>
            </div>

            {/* Discovered devices list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-foreground-muted">
                <span>Discovered Hosts ({discoveredDevices.length})</span>
                {scanning && <span className="animate-pulse text-accent-blue font-medium">Probing ports &amp; ARP...</span>}
              </div>

              {discoveredDevices.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-subtle p-6 text-center">
                  <Radar className={`mx-auto size-8 text-foreground-muted/50 ${scanning ? "animate-spin" : ""}`} />
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {scanning ? "Scanning local subnet for ESP32 and IoT devices..." : "No devices discovered yet"}
                  </p>
                  <p className="mt-1 text-xs text-foreground-muted">
                    Ensure your ESP32 is powered on and connected to the same Wi-Fi router.
                  </p>
                  {!scanning && (
                    <Button size="sm" variant="secondary" onClick={() => runNetworkScan()} className="mt-3">
                      Start Network Scan
                    </Button>
                  )}
                </div>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {discoveredDevices.map((d) => (
                    <div
                      key={d.ip}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                        d.isEsp32
                          ? "border-accent-green/40 bg-accent-green-soft/30 hover:border-accent-green"
                          : "border-border-subtle bg-surface hover:border-border"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-foreground">{d.ip}</span>
                          {d.isEsp32 ? (
                            <Badge tone="green" dot className="text-[10px]">
                              ESP32 PZEM
                            </Badge>
                          ) : d.deviceType === "GATEWAY" ? (
                            <Badge tone="blue" className="text-[10px]">
                              Hotspot Gateway
                            </Badge>
                          ) : d.deviceType === "HOST" ? (
                            <Badge tone="purple" className="text-[10px]">
                              This Server
                            </Badge>
                          ) : d.deviceType === "MOBILE" ? (
                            <Badge tone="amber" className="text-[10px]">
                              Smartphone
                            </Badge>
                          ) : (
                            <Badge tone="neutral" className="text-[10px]">
                              Network Host
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-foreground-muted">
                          {d.hostname ? `${d.hostname} · ` : ""}{d.vendor} {d.mac ? `· ${d.mac}` : ""} {d.responseTimeMs ? `(${d.responseTimeMs}ms)` : ""}
                        </p>
                        {d.previewReadings?.R && (
                          <p className="mt-0.5 text-[11px] text-accent-green font-mono flex items-center gap-1">
                            <Zap className="size-3" /> Live: R: {d.previewReadings.R.voltage}V · Y: {d.previewReadings.Y.voltage}V · B: {d.previewReadings.B.voltage}V
                          </p>
                        )}
                        {d.endpointsFound.length > 0 && !d.previewReadings?.R && (
                          <p className="mt-0.5 text-[11px] text-accent-blue flex items-center gap-1 font-mono">
                            <Zap className="size-3" /> Endpoints: {d.endpointsFound.join(", ")}
                          </p>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => selectDeviceForMapping(d)}
                        className="gap-1.5 shrink-0"
                      >
                        Select &amp; Map <ArrowRight className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected IP Mapping Form or Manual Form */}
        {(activeTab === "manual" || selectedDiscovered) && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedDiscovered && (
              <div className="flex items-center justify-between rounded-xl bg-accent-blue-soft px-3.5 py-2.5 text-xs text-accent-blue">
                <span className="flex items-center gap-1.5 font-medium">
                  <Wifi className="size-3.5" /> Selected IP: <code className="font-mono font-bold">{selectedDiscovered.ip}</code>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDiscovered(null)}
                  className="font-medium underline hover:text-foreground"
                >
                  Change IP
                </button>
              </div>
            )}

            {!utilityNodeId && (
              <div>
                <p className="mb-1.5 text-sm font-medium text-foreground">Attach to utility</p>
                {nodeOptions.length === 0 ? (
                  <div className="rounded-xl border border-accent-blue/30 bg-accent-blue-soft/30 p-3 space-y-2">
                    <p className="text-xs text-foreground-muted">
                      No open utility nodes found. A new utility node will be created automatically:
                    </p>
                    <Input
                      placeholder="e.g. Main Distribution Grid"
                      value={newUtilityName}
                      onChange={(e) => setNewUtilityName(e.target.value)}
                      className="text-xs bg-surface"
                    />
                  </div>
                ) : (
                  <Dropdown
                    options={nodeOptions.map((n) => ({ label: n.name, value: n.id }))}
                    value={selectedNodeId}
                    onChange={setSelectedNodeId}
                    className="w-full"
                  />
                )}
              </div>
            )}

            <Input
              label="Device name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Main Distribution Panel"
              required
            />

            <Input
              label="Device identifier"
              value={form.deviceIdentifier}
              onChange={(e) => setForm({ ...form, deviceIdentifier: e.target.value })}
              placeholder="ESP32-SMARTGRID-002"
              hint="Unique ID used to associate readings and telemetry"
              required
            />

            <Input
              label="Device IP Address"
              value={form.ipAddress}
              onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
              placeholder="192.168.1.45"
              hint="Used by the platform to poll live readings directly from your ESP32"
            />

            <Input
              label="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Building A - Distribution Board"
            />

            <Button type="submit" className="w-full gap-2" loading={loading}>
              <Zap className="size-4" />
              {form.ipAddress ? "Map ESP32 & Connect" : "Create Device"}
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
}
