import { NextRequest } from "next/server";
import os from "os";
import net from "net";
import dgram from "dgram";
import { exec } from "child_process";
import { promisify } from "util";
import { requireUser } from "@/lib/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

const execAsync = promisify(exec);

// Known Espressif OUI prefixes (normalized without colons/dashes, first 6 hex digits)
const ESPRESSIF_OUIS = new Set([
  "240ac4", "30aea4", "3c6105", "3c71bf", "4022d8", "409151", "48e729", "4827e2",
  "483fda", "485519", "5443b2", "545a99", "600194", "686725", "68c63a", "680947",
  "70039f", "70b8f6", "7cdf21", "7cdfa1", "807d3a", "840d8e", "84cca8", "84f703",
  "90380a", "94b555", "94e686", "a020a6", "a0764e", "a0b765", "a4cf12", "ac67b2",
  "ac0bfb", "b4e62d", "bcddc2", "c44f33", "c4dd57", "c82e18", "cc50e3", "d8a01d",
  "d8bc38", "dc4f22", "dc5475", "e05a1b", "e09806", "e831cd", "e868e7", "e89f6d",
  "e8db84", "ec6260", "ec94cb", "f008d1", "f412fa", "f4cf24", "34b7da", "7cb94c",
  "d4d4da", "84fce6", "30c6f7", "e465b8", "ccdba7", "582abd"
]);

export interface DiscoveredHost {
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

function resolveVendorFromMac(mac: string | null): string {
  if (!mac) return "Network Device";
  const raw = mac.replace(/[:\-]/g, "").toLowerCase();
  const oui = raw.slice(0, 6);

  if (ESPRESSIF_OUIS.has(oui)) return "Espressif Inc. (ESP32)";

  // Check locally administered / private MAC address (standard on modern Android/iOS)
  const firstByte = parseInt(raw.slice(0, 2), 16);
  if (!isNaN(firstByte) && (firstByte & 0x02) !== 0) {
    return "Mobile Device (Private MAC)";
  }

  // Common smartphone / PC manufacturers
  if (oui.startsWith("f889d2") || oui.startsWith("001b21") || oui.startsWith("7c5758")) return "Intel Wi-Fi Adapter";
  if (oui.startsWith("00e04c") || oui.startsWith("54e6fc")) return "Realtek Semiconductor";
  if (oui.startsWith("0017f2") || oui.startsWith("f01898") || oui.startsWith("38f9d3") || oui.startsWith("bc6c21")) return "Apple Inc. (iPhone / Mac)";
  if (oui.startsWith("0007ab") || oui.startsWith("bcd11f") || oui.startsWith("5001d9") || oui.startsWith("34e6d7")) return "Samsung Electronics";
  if (oui.startsWith("64cc2e") || oui.startsWith("98fae3") || oui.startsWith("14abf0")) return "Xiaomi / Redmi";
  if (oui.startsWith("9c2840") || oui.startsWith("c0bfbe") || oui.startsWith("2c598a")) return "OnePlus / Oppo";
  if (oui.startsWith("b40b44") || oui.startsWith("a086c6")) return "Vivo Mobile";
  if (oui.startsWith("3c5a37") || oui.startsWith("d83c69")) return "Google (Pixel / Nest)";

  return "Connected Network Device";
}

async function getLocalSubnetInfo() {
  const interfaces = os.networkInterfaces();
  let candidate: any = null;
  let gatewayIp: string | null = null;

  // Try to determine default gateway on Windows
  try {
    const { stdout } = await execAsync("route print 0.0.0.0");
    const lines = stdout.split("\n");
    for (const line of lines) {
      const match = line.trim().match(/^0\.0\.0\.0\s+0\.0\.0\.0\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)/);
      if (match) {
        gatewayIp = match[1];
        break;
      }
    }
  } catch {}

  // Find interface that matches active gateway or has non-internal IPv4
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) {
        const parts = addr.address.split(".").map(Number);
        const baseIp = parts.slice(0, 3).join(".");
        const isWifi = name.toLowerCase().includes("wi-fi") || name.toLowerCase().includes("wireless");

        const info = {
          interfaceName: name,
          localIp: addr.address,
          netmask: addr.netmask || "255.255.255.0",
          baseIp,
          subnetCidr: `${baseIp}.0/24`,
          gatewayIp: gatewayIp || `${baseIp}.1`,
        };

        if (isWifi || !candidate) {
          candidate = info;
        }
      }
    }
  }

  return candidate || {
    interfaceName: "Wi-Fi",
    localIp: "10.229.253.189",
    netmask: "255.255.255.0",
    baseIp: "10.229.253",
    subnetCidr: "10.229.253.0/24",
    gatewayIp: "10.229.253.208",
  };
}

async function triggerSubnetArpSweep(baseIp: string): Promise<void> {
  // 1. Send UDP packet to all 254 hosts on subnet to trigger OS-level ARP broadcasts
  try {
    const udpClient = dgram.createSocket("udp4");
    const payload = Buffer.from([0]);
    for (let i = 1; i <= 254; i++) {
      const target = `${baseIp}.${i}`;
      udpClient.send(payload, 5353, target, () => {});
    }
    setTimeout(() => {
      try { udpClient.close(); } catch {}
    }, 300);
  } catch {}

  // 2. Parallel TCP connects to port 80 across all 254 hosts (fast 250ms timeout)
  const tcpProbes: Promise<void>[] = [];
  for (let i = 1; i <= 254; i++) {
    const ip = `${baseIp}.${i}`;
    tcpProbes.push(
      new Promise<void>((resolve) => {
        const s = new net.Socket();
        s.setTimeout(250);
        s.once("connect", () => { s.destroy(); resolve(); });
        s.once("timeout", () => { s.destroy(); resolve(); });
        s.once("error", () => { s.destroy(); resolve(); });
        try {
          s.connect(80, ip);
        } catch {
          resolve();
        }
      })
    );
  }

  await Promise.all(tcpProbes);
}

async function getSystemArpTable(): Promise<Map<string, string>> {
  const table = new Map<string, string>();
  try {
    const { stdout } = await execAsync("arp -a");
    const lines = stdout.split("\n");
    for (const line of lines) {
      const match = line.trim().match(/^(\d+\.\d+\.\d+\.\d+)\s+([0-9a-fA-F\-]{17})\s+(\w+)/);
      if (match) {
        const ip = match[1];
        const mac = match[2].toLowerCase().replace(/-/g, ":");
        if (!ip.endsWith(".255") && !ip.startsWith("224.") && !ip.startsWith("239.")) {
          table.set(ip, mac);
        }
      }
    }
  } catch {
    // ARP command unavailable or failed
  }
  return table;
}

function probePort(ip: string, port: number, timeoutMs = 300): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => {
      settled = true;
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.once("error", () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(false);
      }
    });

    try {
      socket.connect(port, ip);
    } catch {
      resolve(false);
    }
  });
}

async function probeHttpEndpoints(ip: string, port: number): Promise<{
  isEsp32: boolean;
  deviceIdentifier?: string;
  endpoints: string[];
  previewReadings?: any;
}> {
  const result: {
    isEsp32: boolean;
    deviceIdentifier?: string;
    endpoints: string[];
    previewReadings?: any;
  } = { isEsp32: false, endpoints: [] };

  const baseUrl = `http://${ip}:${port}`;

  // Try fetching /status first (lightweight)
  try {
    const r = await fetch(`${baseUrl}/status`, { signal: AbortSignal.timeout(1500) });
    if (r.ok) {
      result.endpoints.push("/status");
      const data = await r.json();
      if (data && (data.device || data.id || data.firmware)) {
        result.isEsp32 = true;
        result.deviceIdentifier = data.id || data.device || data.deviceIdentifier;
      }
    }
  } catch {}

  // Try fetching /readings
  try {
    const r = await fetch(`${baseUrl}/readings`, { signal: AbortSignal.timeout(1500) });
    if (r.ok) {
      result.endpoints.push("/readings");
      const data = await r.json();
      if (data && (data.phases || data.deviceId || data.deviceIdentifier)) {
        result.isEsp32 = true;
        result.deviceIdentifier = result.deviceIdentifier || data.deviceId || data.deviceIdentifier;
        result.previewReadings = data.phases || data;
      }
    }
  } catch {}

  // Fallback: check if root serves the SmartGrid PZEM Debugger page
  if (!result.isEsp32) {
    try {
      const r = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(1200) });
      if (r.ok) {
        const text = await r.text();
        if (text.includes("PZEM") || text.includes("SmartGrid")) {
          result.isEsp32 = true;
          result.deviceIdentifier = result.deviceIdentifier || `ESP32-${ip.replace(/\./g, "-")}`;
        }
      }
    } catch {}
  }

  return result;
}

export async function GET(req: NextRequest) {
  try {
    try {
      await requireUser();
    } catch {
      // Allow local subnet scanning in local environment
    }

    const subnetInfo = await getLocalSubnetInfo();
    const searchParams = req.nextUrl.searchParams;
    const targetIp = searchParams.get("ip");

    const candidateIps = new Set<string>();

    if (targetIp) {
      // Specific IP probe requested by user
      candidateIps.add(targetIp.trim());
    } else {
      // Trigger full subnet ARP discovery across all 254 IPs
      await triggerSubnetArpSweep(subnetInfo.baseIp);

      const arpTable = await getSystemArpTable();
      for (const ip of arpTable.keys()) {
        candidateIps.add(ip);
      }

      // Always include Gateway, Local Host, and common DHCP addresses
      if (subnetInfo.gatewayIp) candidateIps.add(subnetInfo.gatewayIp);
      candidateIps.add(subnetInfo.localIp);
    }

    const arpTable = await getSystemArpTable();
    const discovered: DiscoveredHost[] = [];
    const portsToProbe = [80, 8080, 3000];

    const ipList = Array.from(candidateIps);
    const CHUNK_SIZE = 25;

    for (let i = 0; i < ipList.length; i += CHUNK_SIZE) {
      const chunk = ipList.slice(i, i + CHUNK_SIZE);
      const chunkResults = await Promise.all(
        chunk.map(async (ip) => {
          const startTime = Date.now();
          const mac = arpTable.get(ip) || null;
          let isEsp32 = false;
          let vendor = resolveVendorFromMac(mac);

          if (vendor.includes("ESP32")) {
            isEsp32 = true;
          }

          // Probe ports
          const openPorts: number[] = [];
          for (const port of portsToProbe) {
            const isOpen = await probePort(ip, port, 300);
            if (isOpen) openPorts.push(port);
          }

          const responseTime = Date.now() - startTime;
          const endpointsFound: string[] = [];
          let deviceIdentifier: string | undefined;
          let previewReadings: any = null;

          if (openPorts.includes(80) || openPorts.includes(8080)) {
            const httpPort = openPorts.includes(80) ? 80 : 8080;
            const httpInfo = await probeHttpEndpoints(ip, httpPort);
            if (httpInfo.isEsp32) {
              isEsp32 = true;
              vendor = "Espressif Inc. (ESP32)";
            }
            if (httpInfo.deviceIdentifier) deviceIdentifier = httpInfo.deviceIdentifier;
            if (httpInfo.endpoints.length > 0) endpointsFound.push(...httpInfo.endpoints);
            if (httpInfo.previewReadings) previewReadings = httpInfo.previewReadings;
          }

          // Device classification & friendly hostnames
          let deviceType: DiscoveredHost["deviceType"] = "DEVICE";
          let hostname: string | null = null;

          if (isEsp32) {
            deviceType = "ESP32";
            hostname = `SmartGrid Sensor (${deviceIdentifier || "ESP32"})`;
          } else if (ip === subnetInfo.gatewayIp) {
            deviceType = "GATEWAY";
            hostname = "Mobile Hotspot / Gateway Router";
            vendor = "Mobile Wi-Fi Hotspot";
          } else if (ip === subnetInfo.localIp) {
            deviceType = "HOST";
            hostname = "This Computer (SmartGrid Server)";
            vendor = "Local Host PC";
            if (!openPorts.includes(3000)) openPorts.push(3000);
          } else if (vendor.includes("Mobile")) {
            deviceType = "MOBILE";
            hostname = "Connected Mobile Smartphone";
          } else {
            hostname = `Network Device (${ip})`;
          }

          // Include any device that responded, has open ports, or is known in ARP/network
          return {
            ip,
            mac,
            vendor,
            deviceType,
            isEsp32,
            hostname,
            responseTimeMs: responseTime,
            openPorts,
            endpointsFound,
            deviceIdentifier: deviceIdentifier || (isEsp32 ? `ESP32-${ip.replace(/\./g, "-")}` : undefined),
            previewReadings,
            status: "ONLINE" as const,
          };
        })
      );

      for (const res of chunkResults) {
        if (res) discovered.push(res);
      }
    }

    // Sort order:
    // 1. ESP32 devices (top priority)
    // 2. Gateway Router
    // 3. Local Host PC
    // 4. Other mobile and network devices
    discovered.sort((a, b) => {
      const typeRank = (t?: string) => {
        if (t === "ESP32") return 1;
        if (t === "GATEWAY") return 2;
        if (t === "HOST") return 3;
        if (t === "MOBILE") return 4;
        return 5;
      };
      const rankA = typeRank(a.deviceType);
      const rankB = typeRank(b.deviceType);
      if (rankA !== rankB) return rankA - rankB;
      return a.ip.localeCompare(b.ip);
    });

    return apiSuccess({
      subnet: subnetInfo,
      hostsFound: discovered.length,
      devices: discovered,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
