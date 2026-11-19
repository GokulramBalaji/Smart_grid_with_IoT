// scripts/start-services.js
// Automated unified runner for SmartGrid Monitor:
// 1. Checks and starts PostgreSQL (using embedded PostgreSQL if local service is not running)
// 2. Starts the Next.js development server
// 3. Automatically opens http://localhost:3000 in your default browser

const net = require("net");
const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const PG_PORT = 5432;
const APP_PORT = 3000;
const APP_URL = `http://localhost:${APP_PORT}`;

// Paths to embedded PostgreSQL binaries and data
const PROJECT_ROOT = path.resolve(__dirname, "..");
const LOCAL_EMBEDDED_DIR = path.join(PROJECT_ROOT, ".embedded-pg");
const FALLBACK_SCRATCH = "C:/Users/admin/.gemini/antigravity-ide/brain/de53d0e5-76e4-4317-a82c-5467fdd60070/scratch";

function checkPort(port, host = "127.0.0.1", timeoutMs = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

function cleanStalePostmasterPid(dbDir) {
  const pidPath = path.join(dbDir, "postmaster.pid");
  if (fs.existsSync(pidPath)) {
    try {
      const content = fs.readFileSync(pidPath, "utf8");
      const lines = content.split("\n");
      const pid = parseInt(lines[0].trim(), 10);
      if (!isNaN(pid) && !isPidAlive(pid)) {
        console.log(`[DB] Removing stale postmaster.pid (PID ${pid} is dead)...`);
        fs.unlinkSync(pidPath);
      }
    } catch (e) {
      console.warn("[DB] Could not check postmaster.pid:", e.message);
    }
  }
}

async function startEmbeddedPostgres() {
  console.log("[DB] Initializing embedded PostgreSQL engine...");

  // Search candidate locations for embedded-postgres dist
  const candidates = [
    path.join(LOCAL_EMBEDDED_DIR, "node_modules/embedded-postgres/dist/index.js"),
    path.join(PROJECT_ROOT, "node_modules/embedded-postgres/dist/index.js"),
    path.join(FALLBACK_SCRATCH, "node_modules/embedded-postgres/dist/index.js"),
  ];

  let resolvedEntry = candidates.find((c) => fs.existsSync(c));

  if (!resolvedEntry) {
    throw new Error("Embedded PostgreSQL binary module could not be found.");
  }

  // Determine database data directory
  let dbDir = path.join(LOCAL_EMBEDDED_DIR, "data/db");
  if (!fs.existsSync(dbDir)) {
    dbDir = path.join(FALLBACK_SCRATCH, "data/db");
  }

  cleanStalePostmasterPid(dbDir);

  console.log("[DB] Database storage directory:", dbDir);

  // Dynamic import since embedded-postgres is an ES Module
  const fileUrl = "file:///" + resolvedEntry.replace(/\\/g, "/");
  const mod = await import(fileUrl);
  const EmbeddedPostgres = mod.default || mod;

  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    user: "postgres",
    password: "postgres",
    port: PG_PORT,
    persistent: true,
  });

  try {
    await pg.initialise();
  } catch {
    // Cluster already initialized
  }

  await pg.start();
  console.log(`[DB] PostgreSQL is ACTIVE and listening on port ${PG_PORT}!`);

  try {
    await pg.createDatabase("smartgrid_monitor");
    console.log("[DB] Verified database 'smartgrid_monitor'.");
  } catch {
    // Database already exists
  }

  return pg;
}

function openBrowser(url) {
  console.log(`[BROWSER] Launching default browser at ${url}...`);
  const cmd = process.platform === "win32" ? `start "" "${url}"` : `open "${url}"`;
  exec(cmd, (err) => {
    if (err) console.log(`[BROWSER] Please navigate manually to: ${url}`);
  });
}

async function main() {
  console.log("=================================================");
  console.log("   SmartGrid Monitor - Service Orchestrator      ");
  console.log("=================================================");
  console.log("");

  // Step 1: Ensure PostgreSQL is running
  const isPgRunning = await checkPort(PG_PORT);
  let pgInstance = null;

  if (isPgRunning) {
    console.log(`[DB] Existing PostgreSQL detected on port ${PG_PORT}.`);
  } else {
    try {
      pgInstance = await startEmbeddedPostgres();
    } catch (err) {
      console.error("[DB ERROR] Could not start embedded PostgreSQL:", err.message);
      console.log("[DB HINT] If you have a system PostgreSQL service, please ensure it is running.");
    }
  }

  // Wait for DB port confirmation
  let retries = 15;
  while (retries-- > 0) {
    if (await checkPort(PG_PORT)) break;
    await new Promise((r) => setTimeout(r, 400));
  }

  // Step 2: Start Next.js Development Server
  console.log("");
  console.log(`[APP] Starting Next.js server at ${APP_URL}...`);

  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

  const nextProcess = spawn(npmCmd, ["run", "dev"], {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
    shell: true,
  });

  // Step 3: Open browser once the app is reachable
  (async () => {
    let appReady = false;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 800));
      if (await checkPort(APP_PORT)) {
        appReady = true;
        break;
      }
    }
    if (appReady) {
      await new Promise((r) => setTimeout(r, 500));
      openBrowser(APP_URL);

      // Step 4: Start background LAN poller for ESP32 devices
      try {
        const { startPoller } = require("./esp32-poller");
        startPoller().catch((err) => console.warn("[POLLER WARNING]", err.message));
      } catch (err) {
        console.warn("[POLLER INIT ERROR]", err.message);
      }
    } else {
      openBrowser(APP_URL);
    }
  })();

  const cleanShutdown = async () => {
    console.log("\n[SYSTEM] Gracefully shutting down services...");
    try {
      nextProcess.kill();
    } catch {}
    if (pgInstance) {
      try {
        console.log("[DB] Stopping embedded PostgreSQL...");
        await pgInstance.stop();
      } catch {}
    }
    process.exit(0);
  };

  process.on("SIGINT", cleanShutdown);
  process.on("SIGTERM", cleanShutdown);
}

main().catch((err) => {
  console.error("Fatal launcher error:", err);
  process.exit(1);
});
