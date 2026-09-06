# SmartGrid Monitor — ESP32 Firmware

Arduino sketch for an ESP32 wired to three single-phase **PZEM-004T v3.0** energy
meters (one per phase — R, Y, B). It self-provisions onto your SmartGrid Monitor
account with no manual API key entry, then reports readings on a fixed interval.
See the main [README.md](../README.md#esp32-integration) for the backend side of
this contract.

---

## ⚠️ Safety first — this touches mains voltage

A PZEM-004T module has **two separate measurement paths**, and only one of them is
low-voltage:

- **Voltage input (L / N screw terminals):** wired directly across the **live mains
  voltage** you're measuring (230V/110V AC). This is genuinely dangerous.
- **Current input:** a clip-on **split-core current transformer (CT)** that clamps
  around the live wire — it does not touch the conductor directly, but the wire it
  clamps is still live.
- **TTL/UART header (5V, RX, TX, GND):** the only side that talks to the ESP32.

Rules that matter:

1. **Disconnect mains power at the breaker before wiring anything to the L/N
   terminals or routing a CT around a conductor.** Never work on a live panel.
2. If you are not already comfortable and qualified to work inside a live
   electrical panel or distribution board, **have a qualified electrician do the
   mains-side wiring.** The ESP32/PZEM/UART side is a normal low-voltage hobbyist
   project; the mains side is not.
3. Each PZEM-004T module is only rated for one AC line — don't share a single
   module's voltage input across two different phases, and don't exceed its CT's
   rated current (commonly 100A).
4. Double-check local electrical code before installing this on a real
   distribution board.

None of the firmware or wiring below changes that — it only covers the low-voltage
ESP32 ↔ PZEM UART side safely.

---

## Wiring

Each PZEM-004T gets its **own dedicated UART bus** to the ESP32 (rather than sharing
one bus with per-device Modbus addresses), so there's no address-configuration step
— every module stays at its factory-default Modbus address.

```
                          ┌─────────────────────────────┐
   PZEM-004T (Phase R)    │                             │
   5V / RX / TX / GND ────┼──── GPIO17 (TX2) / GPIO16 (RX2)   [Serial2, hardware UART]
                          │                             │
   PZEM-004T (Phase Y)    │          ESP32 DevKit       │
   5V / RX / TX / GND ────┼──── GPIO19 (TX1) / GPIO18 (RX1)   [Serial1, hardware UART]
                          │                             │
   PZEM-004T (Phase B)    │                             │
   5V / RX / TX / GND ────┼──── GPIO26 (TX)  / GPIO25 (RX)    [SoftwareSerial]
                          └─────────────────────────────┘
```

| PZEM pin | Phase R  | Phase Y  | Phase B  | Notes |
|----------|----------|----------|----------|-------|
| 5V       | ESP32 5V (VIN) | ESP32 5V (VIN) | ESP32 5V (VIN) | Powers the PZEM's logic side |
| GND      | ESP32 GND | ESP32 GND | ESP32 GND | **Common ground across all three modules and the ESP32 — required** |
| TX (PZEM out) | GPIO16 | GPIO18 | GPIO25 | PZEM transmits, ESP32 receives |
| RX (PZEM in)  | GPIO17 | GPIO19 | GPIO26 | ESP32 transmits, PZEM receives |

**Logic-level note:** the PZEM-004T's UART header is commonly documented as 5V
logic while the ESP32's GPIOs are 3.3V-only and not officially 5V-tolerant. Many
hobbyists connect them directly and report it working, but the safer approach —
especially for the PZEM→ESP32 (TX→RX) direction — is a simple resistor voltage
divider or a bidirectional logic-level shifter on each of the six data lines above.
If in doubt, add the level shifter; it's a couple of dollars in parts and protects
your board.

Power the ESP32 itself from USB or a separate 5V supply as usual — don't try to
derive it from the PZEM's isolated mains-side circuitry.

---

## Required libraries

Install these via Arduino IDE → **Tools → Manage Libraries…** (or the matching
PlatformIO `lib_deps` entries):

| Library | Author | Notes |
|---|---|---|
| ArduinoJson | Benoit Blanchon | v7.x — the sketch uses the v7 `JsonDocument` API |
| PZEM004Tv30 | Jakub Mandula | Search "PZEM004Tv30" or "PZEM-004T-v30" |
| EspSoftwareSerial | Peter Lerup | Provides `SoftwareSerial` on ESP32, used for Phase B |

Board support: install the **esp32 by Espressif Systems** board package (Boards
Manager), and select your specific dev board under Tools → Board.

Library APIs occasionally change between versions — if `PZEM004Tv30(serial, rx,
tx)` doesn't compile against the version you installed, check that library's
`examples/` folder for its current ESP32 constructor signature and adjust the three
`PZEM004Tv30 pzemX(...)` lines in `SmartGridMonitor.ino` accordingly; everything
else in the sketch is independent of that detail.

---

## Setup

1. Copy `secrets.h.example` to `secrets.h` in this same folder and fill in:
   - `WIFI_SSID` / `WIFI_PASSWORD`
   - `DEVICE_IDENTIFIER` — unique per physical ESP32 (e.g. `ESP32-SMARTGRID-004`)
   - `BACKEND_BASE_URL` — your server's address, no trailing slash (e.g.
     `http://192.168.1.50:3000` for a LAN dev server, or your real HTTPS domain in
     production)
   - `DEVICE_API_SECRET` — copy the exact value from the server's `.env`
     (`DEVICE_API_SECRET=`)

   `secrets.h` is gitignored — it never gets committed.

2. Open `SmartGridMonitor.ino` in Arduino IDE, select your ESP32 board + port, and
   upload.

3. Open the Serial Monitor at 115200 baud. You should see it connect to Wi-Fi and
   start announcing itself:

   ```
   Wi-Fi connected. IP: 192.168.1.87   SSID: Building-C-Chiller
   Announced — waiting for an operator to claim us in the web UI (Utilities > Discovered Devices)...
   ```

4. In the SmartGrid Monitor web app, go to **Utilities** — the device appears under
   **Discovered Devices** within ~15 seconds. Click **Claim & map**, choose whether
   it becomes a new utility/sub-utility or attaches to an existing one, and submit.

5. Within ~10 seconds the ESP32 automatically fetches its real API key and switches
   to normal operation — no need to touch the device again:

   ```
   Announced — already claimed, fetching our API key...
   Received API key from the server — switching to normal operation.
   Uploaded reading OK (HTTP 201): {"ok":true,"readingsCreated":3,"alertsCreated":0}
   ```

6. From then on it uploads one combined three-phase reading every 10 seconds
   (`READING_INTERVAL_MS` in the sketch). If the device's API key is ever rotated
   from the web UI (Devices → Regenerate key), the firmware detects the resulting
   `401`, clears its stored key, and automatically fetches the new one the same
   way — no reflashing needed.

To re-provision a device from scratch (e.g. to move it to a different utility),
erase its flash (Arduino IDE → Tools → Erase Flash: "All Flash Contents", or
`esptool.py erase_flash`) so its stored API key is wiped, then power-cycle it —
it will announce itself again as a new discovered device.
