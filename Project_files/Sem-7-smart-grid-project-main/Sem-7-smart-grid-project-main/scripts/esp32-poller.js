// scripts/esp32-poller.js
// Continuous LAN background poller for SmartGrid Monitor
// Polls ESP32 at configured IP (e.g. 192.168.1.9) and transmits readings to the local site.

const os = require("os");
const net = require("net");
const { PrismaClient } = require("@prisma/client");

const API_KEY = "sg_live_smartgrid2026esp32key9876543210abcdef";
const BACKEND_URL = "http://localhost:3000/api/iot/readings";
const POLL_INTERVAL_MS = 5000;
const FETCH_TIMEOUT_MS = 7000;

let prisma = null;
try {
  prisma = new PrismaClient();
} catch (e) {
  console.warn("[POLLER] Prisma client could not be initialized, will use default IP fallback.");
}

function getLocalSubnet() {
  const interfaces = os.networkInterfaces();
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) {
        return {
          localIp: addr.address,
          baseIp: addr.address.split(".").slice(0, 3).join("."),
        };
      }
    }
  }
  return { localIp: "127.0.0.1", baseIp: "127.0.0" };
}

async function scanForEsp32(baseIp) {
  const probes = [];
  for (let i = 1; i <= 254; i++) {
    const ip = `${baseIp}.${i}`;
    probes.push(
      new Promise((resolve) => {
        const s = new net.Socket();
        s.setTimeout(250);
        s.once("connect", () => { s.destroy(); resolve(ip); });
        s.once("timeout", () => { s.destroy(); resolve(null); });
        s.once("error", () => { resolve(null); });
        try { s.connect(80, ip); } catch { resolve(null); }
      })
    );
  }
  const openIps = (await Promise.all(probes)).filter(Boolean);
  for (const ip of openIps) {
    try {
      const res = await fetch(`http://${ip}/status`, { signal: AbortSignal.timeout(1200) });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.device === "ESP32-SMARTGRID" || data.firmware)) {
          return ip;
        }
      }
    } catch {}
  }
  return null;
}

async function getTargetDevices() {
  const subnet = getLocalSubnet();
  if (prisma) {
    try {
      const devices = await prisma.device.findMany({
        where: { ipAddress: { not: null } },
        select: { id: true, deviceIdentifier: true, ipAddress: true, name: true },
      });
      if (devices.length > 0) {
        // If device IP is on a dead/stale subnet, auto-discover on the current active subnet
        for (const dev of devices) {
          const devBase = dev.ipAddress.split(".").slice(0, 3).join(".");
          if (devBase !== subnet.baseIp) {
            console.log(`[POLLER] Network changed (${devBase} -> ${subnet.baseIp}). Searching for ESP32...`);
            const newIp = await scanForEsp32(subnet.baseIp);
            if (newIp) {
              console.log(`[POLLER] Discovered ESP32 at new IP: ${newIp}`);
              dev.ipAddress = newIp;
              await prisma.device.update({
                where: { id: dev.id },
                data: { ipAddress: newIp, status: "ONLINE", lastSeenAt: new Date() },
              });
              // Inform ESP32 of host computer's new IP address
              try {
                await fetch(`http://${newIp}/setbackend?url=http://${subnet.localIp}:3000`);
                console.log(`[POLLER] Updated ESP32 backend URL to: http://${subnet.localIp}:3000`);
              } catch {}
            }
          }
        }
        return devices;
      }
    } catch {}
  }
  return [
    {
      id: "cmu0xle7m0003ve04cntc0wz2",
      deviceIdentifier: "ESP32-SMARTGRID",
      ipAddress: "10.229.253.109",
      name: "ESP32 SmartGrid Monitor",
    },
  ];
}

async function pollDevice(device) {
  const ip = device.ipAddress.trim();
  const url = `http://${ip}/readings`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) {
      console.warn(`[POLLER] ESP32 at ${ip} returned HTTP ${res.status}`);
      return;
    }

    const data = await res.json();
    if (!data.phases || !data.phases.R) {
      console.warn(`[POLLER] ESP32 at ${ip} returned malformed payload:`, data);
      return;
    }

    // Forward to SmartGrid Monitor ingestion API
    const postRes = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        deviceId: data.deviceId || device.deviceIdentifier,
        phases: data.phases,
      }),
    });

    if (postRes.ok) {
      const r = data.phases.R;
      const y = data.phases.Y;
      const b = data.phases.B;
      const timeStr = new Date().toLocaleTimeString();
      console.log(
        `[${timeStr}] [POLLER] Ingested readings for ${device.deviceIdentifier} (${ip}) -> R: ${r.voltage}V ${r.power}W | Y: ${y.voltage}V ${y.power}W | B: ${b.voltage}V ${b.power}W`
      );
    } else {
      const errText = await postRes.text();
      console.warn(`[POLLER] Ingest API returned ${postRes.status}: ${errText}`);
    }
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      console.warn(`[POLLER] ESP32 at ${ip} timed out (meter bus busy or Wi-Fi reconnecting).`);
    } else {
      console.warn(`[POLLER] Connection to ${ip} error: ${err.message}`);
    }
  }
}

let isRunning = true;

async function startPoller() {
  console.log("=================================================");
  console.log("   SmartGrid Monitor — Background LAN Poller     ");
  console.log("   Auto-ingesting live PZEM-004T energy data     ");
  console.log("=================================================");

  while (isRunning) {
    const devices = await getTargetDevices();
    for (const dev of devices) {
      await pollDevice(dev);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

if (require.main === module) {
  startPoller().catch(console.error);
}

module.exports = { startPoller };
