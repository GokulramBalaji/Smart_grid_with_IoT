# SmartGrid Monitor — ESP32 Firmware

Arduino sketch for an ESP32 wired to three single-phase **PZEM-004T** energy
meters (one per phase — R, Y, B) connected in **parallel** across a single
Hardware UART bus. It self-provisions onto your SmartGrid Monitor account with
no manual API key entry, reports readings on a fixed interval, and includes a
built-in web console for address assignment and diagnostics.
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

## Wiring (Parallel UART Bus)

All three PZEM-004T modules connect in **parallel** to the ESP32's hardware **Serial2** bus (GPIO16 & GPIO17). Each meter is addressed individually using standard Modbus-RTU:

- **Phase R (Red):** Modbus Slave Address `0x01`
- **Phase Y (Yellow):** Modbus Slave Address `0x02`
- **Phase B (Blue):** Modbus Slave Address `0x03`

```
                          ┌─────────────────────────────┐
   PZEM #1 (Phase R 0x01) │                             │
   PZEM #2 (Phase Y 0x02) ┼──── GPIO16 (RX2) <── TX     │  [Serial2, hardware UART]
   PZEM #3 (Phase B 0x03) ┼──── GPIO17 (TX2) ──> RX     │
   (All 3 wired in ||)    ┼──── ESP32 5V (VIN)          │
                          ┼──── ESP32 GND (common)      │
                          └─────────────────────────────┘
```

| PZEM Pin | ESP32 Connection | Notes |
|---|---|---|
| **5V** | ESP32 5V (VIN) | Powers the optocoupler / logic side of all PZEMs |
| **GND** | ESP32 GND | **Common ground across all modules and the ESP32 — required** |
| **TX** | GPIO16 (RX2) | All PZEM TX lines tied in parallel to ESP32 RX2 |
| **RX** | GPIO17 (TX2) | All PZEM RX lines tied in parallel to ESP32 TX2 |

**Logic-level note:** The PZEM-004T UART header is 5V logic while ESP32 GPIOs are 3.3V-only. Connecting them directly is common in hobby projects, but adding a bidirectional 3.3V ↔ 5V logic level shifter or resistor voltage divider on the PZEM TX → ESP32 RX line provides optimal electrical protection.

Power the ESP32 from USB or a regulated 5V power supply — do not attempt to derive DC power from the PZEM's high-voltage side.

---

## Setting Slave Addresses (Initial One-Time Setup)

By factory default, all PZEM modules share the same broadcast address (`0xF8`). If multiple default modules are connected in parallel simultaneously, their serial replies collide.

### Address Setup Procedure (via the built-in Web Debugger):
1. **Flash `SmartGridMonitor.ino`** to the ESP32.
2. Open Serial Monitor (115200 baud) and note the ESP32's IP address (or open `http://<device_ip>/` in your browser).
3. Connect **ONLY PZEM #1** (Phase R) to GPIO16/17:
   - Click **SCAN (Single unit connected)** to confirm communication.
   - Click **SET AS PHASE R (0x01)**. Wait for confirmation.
4. Disconnect PZEM #1, connect **ONLY PZEM #2** (Phase Y):
   - Click **SET AS PHASE Y (0x02)**. Wait for confirmation.
5. Disconnect PZEM #2, connect **ONLY PZEM #3** (Phase B):
   - Click **SET AS PHASE B (0x03)**. Wait for confirmation.
6. **Now wire all three PZEMs in parallel** (all TX to GPIO16, all RX to GPIO17, all 5V to VIN, all GND to GND).
7. On the web page, click **POLL ALL (R / Y / B Parallel)** or **FULL DIAGNOSTIC** to confirm that each phase answers independently without collisions!

---

## Required Libraries

Install this library via Arduino IDE → **Tools → Manage Libraries…**:

| Library | Author | Version | Notes |
|---|---|---|---|
| **ArduinoJson** | Benoit Blanchon | **v7.x** | Used for JSON serialization/deserialization |

*Note: External PZEM or SoftwareSerial libraries are no longer needed! The sketch includes a native, non-blocking Modbus-RTU engine directly in code.*

**Board support:** Install the **esp32 by Espressif Systems** package in Arduino Boards Manager and select your ESP32 board under Tools → Board.

---

## Setup & Normal Operation

1. Open `SmartGridMonitor.ino` in Arduino IDE and set:
   - `WIFI_SSID` / `WIFI_PASSWORD` (e.g. your home/office Wi-Fi)
   - `DEVICE_IDENTIFIER` — e.g. `"ESP32-SMARTGRID"`
   - `DEVICE_API_KEY` — pre-configured device key (e.g. `"sg_live_smartgrid2026esp32key9876543210abcdef"`)
   - `BACKEND_BASE_URL` — your host computer IP & port (e.g. `http://192.168.1.4:3000`)

2. Upload to your ESP32 and open Serial Monitor at **115200 baud**.
3. Once connected to Wi-Fi, the ESP32 logs:
   ```
   Wi-Fi Status: CONNECTED. IP: http://192.168.1.9
   API key active — entering normal operating & transmitting mode.
   Target backend site: http://192.168.1.4:3000
   ```
4. The ESP32 continuously polls the 3 PZEM modules in parallel and uploads readings every 10 seconds:
   ```
   [IOT] Transmitting readings (R:233.5V, Y:233.3V, B:233.4V) to http://192.168.1.4:3000...
   [IOT] Transmission SUCCESS (HTTP 201): {"ok":true,"readingsCreated":3,"alertsCreated":0}
   ```
5. **Dual Ingestion (Push + Pull):**
   - **Direct Push:** The ESP32 autonomously posts live data to `/api/iot/readings`.
   - **Auto LAN Pull:** The SmartGrid runner (`start_smartgrid.bat`) also continuously polls `http://<device_ip>/readings` in the background every 5 seconds.
   - You can also change the target site URL anytime without re-flashing by visiting `http://<device_ip>/` in your browser.

