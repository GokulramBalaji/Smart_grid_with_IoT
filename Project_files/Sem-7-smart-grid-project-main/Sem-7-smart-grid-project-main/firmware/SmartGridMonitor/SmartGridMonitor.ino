// SmartGrid Monitor — ESP32 firmware (Parallel UART / Modbus-RTU)
//
// Reads three single-phase PZEM-004T energy sensors (Phase R, Y, B) wired in
// parallel across a single ESP32 Hardware UART bus (Serial2, pins 16 & 17).
// Communicates via standard Modbus-RTU using unique slave addresses:
//   - Phase R: 0x01
//   - Phase Y: 0x02
//   - Phase B: 0x03
//
// Features:
//   - Built-in Web Debugger (http://<device_ip>/) to scan and configure meter
//     addresses one-by-one, run diagnostics, and test live readings.
//   - Native self-provisioning: announces itself over Wi-Fi, waits for an
//     operator to map it onto a utility node in the web UI, then automatically
//     fetches its issued API key — no manual key entry required.
//   - Direct LAN endpoints (/readings, /status) for instant polling from the
//     SmartGrid Monitor dashboard and local network discovery.
//   - Periodic IoT ingestion reports to backend (/api/iot/readings).

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include <WebServer.h>

// =====================================================
// Secrets / Configuration
// =====================================================

#define WIFI_SSID "Wifi"
#define WIFI_PASSWORD "aaaaaaac"

#define DEVICE_IDENTIFIER "ESP32-SMARTGRID"
#define DEVICE_API_SECRET "7f8c9b2a1e3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a"
#define DEVICE_API_KEY "sg_live_smartgrid2026esp32key9876543210abcdef"
#define BACKEND_BASE_URL "http://192.168.1.4:3000"

#define FIRMWARE_VERSION "1.2.0"

// =====================================================
// Hardware UART / PZEM Bus Configuration
// =====================================================
// All three PZEM meters connect in parallel to ESP32 Serial2:
//   ESP32 GPIO16 (RX2) <--- ALL PZEM TX pins (tied together)
//   ESP32 GPIO17 (TX2) ---> ALL PZEM RX pins (tied together)
//   ESP32 5V (VIN)     ---> ALL PZEM 5V pins
//   ESP32 GND          ---> ALL PZEM GND pins (common ground)

HardwareSerial PZEM(2);
WebServer server(80);

#define PZEM_RX 16   // ESP32 RX2  <- PZEM TX
#define PZEM_TX 17   // ESP32 TX2  -> PZEM RX
#define PZEM_BAUD 9600

// Modbus Slave Addresses
#define DEFAULT_ADDR      0xF8   // Factory default / broadcast address
#define ADDRESS_REGISTER  0x0002

#define ADDR_PHASE_R      0x01   // Phase R (Red)
#define ADDR_PHASE_Y      0x02   // Phase Y (Yellow)
#define ADDR_PHASE_B      0x03   // Phase B (Blue)

uint8_t lastAddress = 0x00;
String debugLog = "";

// =====================================================
// Timing Constants
// =====================================================

const unsigned long WIFI_CONNECT_TIMEOUT_MS = 20000;
const unsigned long WIFI_RETRY_DELAY_MS     = 5000;
const unsigned long ANNOUNCE_INTERVAL_MS    = 15000;   // Re-announce interval while unclaimed
const unsigned long FETCH_KEY_INTERVAL_MS   = 10000;   // Poll interval for issued API key
const unsigned long READING_INTERVAL_MS     = 10000;   // Periodic upload interval once operating

// =====================================================
// Persisted State & Device State Machine
// =====================================================

Preferences prefs;
String storedApiKey;
String backendUrl = BACKEND_BASE_URL;

enum DeviceState { STATE_PROVISIONING, STATE_OPERATING };
DeviceState state;

unsigned long lastAnnounce = 0;
unsigned long lastFetchAttempt = 0;
unsigned long lastReading = 0;
bool deviceClaimed = false;

struct PhaseReading {
  bool valid;
  float voltage;      // V
  float current;      // A
  float power;        // W
  float energy;       // kWh (cumulative)
  float frequency;    // Hz
  float pf;           // Power Factor 0.0 - 1.0
};

// Forward Declarations
void connectWiFi();
void runProvisioning();
void runOperating();
bool announceDevice();
String fetchApiKey();
int postJson(const char *path, const String &bearerToken, const String &body, String &responseOut);
PhaseReading readPhase(uint8_t slaveAddr, const char *label);
void writePhase(JsonObject &phases, const char *key, const PhaseReading &r);
void handleHttpReadings();
void handleSetBackend();

// =====================================================
// CRC16 MODBUS
// =====================================================

uint16_t crc16(const uint8_t *data, uint8_t len)
{
  uint16_t crc = 0xFFFF;
  for (uint8_t i = 0; i < len; i++)
  {
    crc ^= data[i];
    for (uint8_t j = 0; j < 8; j++)
    {
      if (crc & 0x0001)
        crc = (crc >> 1) ^ 0xA001;
      else
        crc >>= 1;
    }
  }
  return crc;
}

// =====================================================
// HEX FORMAT HELPERS & DEBUG LOGGING
// =====================================================

String hexByte(uint8_t b)
{
  char buffer[4];
  snprintf(buffer, sizeof(buffer), "%02X", b);
  return String(buffer);
}

String hexFrame(const uint8_t *data, uint8_t len)
{
  String result = "";
  for (uint8_t i = 0; i < len; i++)
  {
    if (i > 0) result += " ";
    result += hexByte(data[i]);
  }
  return result;
}

void logLine(const String &message)
{
  Serial.println(message);
  if (debugLog.length() > 8000) {
    debugLog = debugLog.substring(debugLog.length() - 4000);
  }
  debugLog += message;
  debugLog += "<br>";
}

// =====================================================
// UART BUFFER MANAGEMENT & RAW FRAME I/O
// =====================================================

void clearBuffer()
{
  while (PZEM.available()) PZEM.read();
}

uint8_t receiveFrame(uint8_t *buffer, uint8_t maxLength, unsigned long timeoutMs = 350)
{
  uint8_t count = 0;
  unsigned long start = millis();
  unsigned long lastByteTime = 0;

  while (millis() - start < timeoutMs)
  {
    while (PZEM.available())
    {
      if (count < maxLength) buffer[count++] = PZEM.read();
      else PZEM.read();
      lastByteTime = millis();
    }
    // Modbus-RTU frame completion:
    // If bytes have arrived and line has been silent for > 20ms (t3.5 is ~4ms at 9600 baud),
    // the frame is complete — no need to block for the full timeout.
    if (count > 0 && (millis() - lastByteTime > 20))
    {
      break;
    }
    delay(1);
  }
  return count;
}

uint8_t sendFrame(const uint8_t *tx, uint8_t txLen, uint8_t *rx, uint8_t maxRxLen, bool verbose = true)
{
  clearBuffer();
  if (verbose) logLine("TX: " + hexFrame(tx, txLen));

  PZEM.write(tx, txLen);
  PZEM.flush();

  uint8_t received = receiveFrame(rx, maxRxLen, 350);

  if (verbose) {
    if (received == 0)
      logLine("RX: NO RESPONSE");
    else
      logLine("RX (" + String(received) + " bytes): " + hexFrame(rx, received));
  }

  return received;
}

bool checkCRC(const uint8_t *frame, uint8_t length, bool verbose = true)
{
  if (length < 3) return false;

  uint16_t receivedCRC = frame[length - 2] | ((uint16_t)frame[length - 1] << 8);
  uint16_t calculatedCRC = crc16(frame, length - 2);

  if (verbose) {
    logLine("Received CRC: 0x" + hexByte(receivedCRC & 0xFF) + " " + hexByte(receivedCRC >> 8));
    logLine("Calculated CRC: 0x" + hexByte(calculatedCRC & 0xFF) + " " + hexByte(calculatedCRC >> 8));
  }

  return receivedCRC == calculatedCRC;
}

void showModbusError(const uint8_t *rx, uint8_t length)
{
  if (length < 5) return;

  if (rx[1] == 0x84 || rx[1] == 0x86 || rx[1] == 0x83)
  {
    logLine("MODBUS ERROR RESPONSE");
    logLine("Exception code: 0x" + hexByte(rx[2]));

    switch (rx[2])
    {
      case 0x01: logLine("Illegal function"); break;
      case 0x02: logLine("Illegal register address"); break;
      case 0x03: logLine("Illegal data value"); break;
      case 0x04: logLine("Slave error"); break;
      default:   logLine("Unknown exception"); break;
    }
  }
}

// =====================================================
// LOW-LEVEL MODBUS REGISTER ACCESS
// =====================================================

bool readAddress(uint8_t slaveAddr, uint8_t &actualAddr)
{
  uint8_t tx[8];
  tx[0] = slaveAddr;
  tx[1] = 0x03;
  tx[2] = 0x00;
  tx[3] = 0x02;
  tx[4] = 0x00;
  tx[5] = 0x01;

  uint16_t crc = crc16(tx, 6);
  tx[6] = crc & 0xFF;
  tx[7] = crc >> 8;

  uint8_t rx[32];
  uint8_t received = sendFrame(tx, 8, rx, sizeof(rx));

  if (received == 0) return false;

  if (received < 7)
  {
    logLine("ERROR: Response too short");
    return false;
  }

  if (rx[0] != slaveAddr)
  {
    logLine("ERROR: Address mismatch");
    return false;
  }

  if (rx[1] != 0x03)
  {
    showModbusError(rx, received);
    return false;
  }

  if (rx[2] != 0x02)
  {
    logLine("ERROR: Invalid byte count");
    return false;
  }

  if (!checkCRC(rx, received))
  {
    logLine("ERROR: CRC FAILURE");
    return false;
  }

  actualAddr = rx[4];
  logLine("REGISTER 0x0002 = 0x" + hexByte(actualAddr));
  return true;
}

bool readVoltage(uint8_t slaveAddr, float &voltage)
{
  uint8_t tx[8];
  tx[0] = slaveAddr;
  tx[1] = 0x04;
  tx[2] = 0x00;
  tx[3] = 0x00;
  tx[4] = 0x00;
  tx[5] = 0x01;

  uint16_t crc = crc16(tx, 6);
  tx[6] = crc & 0xFF;
  tx[7] = crc >> 8;

  uint8_t rx[32];
  uint8_t received = sendFrame(tx, 8, rx, sizeof(rx));

  if (received == 0) return false;

  if (received >= 5 && (rx[1] == 0x84))
  {
    showModbusError(rx, received);
    return false;
  }

  if (received < 7 || rx[0] != slaveAddr || rx[1] != 0x04)
  {
    logLine("ERROR: Unexpected voltage response");
    return false;
  }

  if (!checkCRC(rx, received))
  {
    logLine("ERROR: CRC FAILURE");
    return false;
  }

  uint16_t raw = ((uint16_t)rx[3] << 8) | rx[4];
  voltage = raw / 10.0f;
  return true;
}

bool setAddress(uint8_t newAddr)
{
  if (newAddr < 0x01 || newAddr > 0xF7)
  {
    logLine("ERROR: Address must be 0x01 to 0xF7");
    return false;
  }

  uint8_t tx[8];
  tx[0] = DEFAULT_ADDR;
  tx[1] = 0x06;
  tx[2] = 0x00;
  tx[3] = 0x02;
  tx[4] = 0x00;
  tx[5] = newAddr;

  uint16_t crc = crc16(tx, 6);
  tx[6] = crc & 0xFF;
  tx[7] = crc >> 8;

  uint8_t rx[32];
  uint8_t received = sendFrame(tx, 8, rx, sizeof(rx));

  if (received == 0)
  {
    logLine("ERROR: NO RESPONSE TO ADDRESS WRITE");
    logLine("Reminder: only ONE PZEM may be physically connected while setting an address.");
    return false;
  }

  if (received >= 5 && rx[1] == 0x86)
  {
    showModbusError(rx, received);
    return false;
  }

  if (received != 8)
  {
    logLine("ERROR: Expected 8-byte write response");
    return false;
  }

  if (rx[0] != DEFAULT_ADDR || rx[1] != 0x06)
  {
    logLine("ERROR: Invalid write response header");
    return false;
  }

  if (!checkCRC(rx, received))
  {
    logLine("ERROR: WRITE RESPONSE CRC FAILURE");
    return false;
  }

  bool same = true;
  for (uint8_t i = 0; i < 8; i++)
  {
    if (rx[i] != tx[i]) same = false;
  }

  if (!same)
  {
    logLine("ERROR: Response does not echo command");
    return false;
  }

  logLine("ADDRESS WRITE ACCEPTED");
  return true;
}

String phaseLabel(uint8_t addr)
{
  switch (addr)
  {
    case ADDR_PHASE_R: return "R (Red)";
    case ADDR_PHASE_Y: return "Y (Yellow)";
    case ADDR_PHASE_B: return "B (Blue)";
    default:           return "Unknown";
  }
}

void processSet(uint8_t newAddr)
{
  debugLog = "";

  logLine("================================");
  logLine("SETTING PZEM ADDRESS FOR PHASE " + phaseLabel(newAddr));
  logLine("================================");
  logLine("Target address: 0x" + hexByte(newAddr) + " (" + phaseLabel(newAddr) + ")");
  logLine("Using general address: 0xF8");
  logLine("Make sure ONLY this one PZEM is physically connected right now!");

  if (!setAddress(newAddr))
  {
    logLine("ADDRESS WRITE FAILED");
    return;
  }

  logLine("Waiting for meter to save...");
  delay(700);

  uint8_t actual;
  logLine("VERIFYING NEW ADDRESS...");

  if (readAddress(newAddr, actual))
  {
    lastAddress = actual;
    if (actual == newAddr)
    {
      logLine("ADDRESS VERIFIED SUCCESSFULLY");
      logLine("Current address: 0x" + hexByte(actual));
    }
    else
    {
      logLine("ADDRESS MISMATCH");
    }
  }
  else
  {
    logLine("READ-BACK FAILED");
    logLine("The meter may have changed address, but verification failed.");
  }
}

void scanAddresses()
{
  debugLog = "";

  logLine("================================");
  logLine("PZEM ADDRESS SCAN (single unit only!)");
  logLine("================================");

  uint8_t addresses[] = { DEFAULT_ADDR, ADDR_PHASE_R, ADDR_PHASE_Y, ADDR_PHASE_B };
  bool found = false;

  for (uint8_t i = 0; i < 4; i++)
  {
    uint8_t addr = addresses[i];
    logLine("");
    logLine("Trying address 0x" + hexByte(addr));

    uint8_t actual;
    if (readAddress(addr, actual))
    {
      found = true;
      lastAddress = actual;
      logLine("PZEM FOUND");
      logLine("Current address: 0x" + hexByte(actual));
    }
    else
    {
      logLine("No valid response from 0x" + hexByte(addr));
    }
    delay(100);
  }

  if (!found) logLine("NO PZEM FOUND");
}

// =====================================================
// FULL PHASE MEASUREMENTS (10 REGISTERS VIA MODBUS 0x04)
// =====================================================

PhaseReading readPhase(uint8_t slaveAddr, const char *label)
{
  PhaseReading out;
  out.valid = false;
  out.voltage = 0.0f;
  out.current = 0.0f;
  out.power = 0.0f;
  out.energy = 0.0f;
  out.frequency = 0.0f;
  out.pf = 0.0f;

  // Modbus Command 0x04: Read 10 Input Registers starting from 0x0000
  uint8_t tx[8];
  tx[0] = slaveAddr;
  tx[1] = 0x04;
  tx[2] = 0x00;
  tx[3] = 0x00;
  tx[4] = 0x00;
  tx[5] = 0x0A;  // 10 registers = 20 data bytes

  uint16_t crc = crc16(tx, 6);
  tx[6] = crc & 0xFF;
  tx[7] = crc >> 8;

  uint8_t rx[32];
  uint8_t received = sendFrame(tx, 8, rx, sizeof(rx), false);

  if (received == 0)
  {
    Serial.printf("Phase %s (0x%02X): NO RESPONSE\n", label, slaveAddr);
    return out;
  }

  if (received >= 5 && rx[1] == 0x84)
  {
    showModbusError(rx, received);
    return out;
  }

  if (received < 25)
  {
    Serial.printf("Phase %s (0x%02X): Short response (%d bytes, expected 25)\n", label, slaveAddr, received);
    return out;
  }

  if (rx[0] != slaveAddr || rx[1] != 0x04 || rx[2] != 0x14)
  {
    Serial.printf("Phase %s (0x%02X): Invalid header (0x%02X 0x%02X 0x%02X)\n", label, slaveAddr, rx[0], rx[1], rx[2]);
    return out;
  }

  if (!checkCRC(rx, 25, false))
  {
    Serial.printf("Phase %s (0x%02X): CRC check failed\n", label, slaveAddr);
    return out;
  }

  // Register 0x0000: Voltage (0.1V resolution)
  uint16_t rawVoltage = ((uint16_t)rx[3] << 8) | rx[4];
  out.voltage = rawVoltage / 10.0f;

  // Registers 0x0001 (L) & 0x0002 (H): Current (0.001A resolution)
  uint32_t rawCurrent = ((uint32_t)rx[7] << 24) | ((uint32_t)rx[8] << 16) | ((uint32_t)rx[5] << 8) | (uint32_t)rx[6];
  out.current = rawCurrent / 1000.0f;

  // Registers 0x0003 (L) & 0x0004 (H): Power (0.1W resolution)
  uint32_t rawPower = ((uint32_t)rx[11] << 24) | ((uint32_t)rx[12] << 16) | ((uint32_t)rx[9] << 8) | (uint32_t)rx[10];
  out.power = rawPower / 10.0f;

  // Registers 0x0005 (L) & 0x0006 (H): Energy (1Wh resolution -> convert to kWh)
  uint32_t rawEnergy = ((uint32_t)rx[15] << 24) | ((uint32_t)rx[16] << 16) | ((uint32_t)rx[13] << 8) | (uint32_t)rx[14];
  out.energy = rawEnergy / 1000.0f;

  // Register 0x0007: Frequency (0.1Hz resolution)
  uint16_t rawFreq = ((uint16_t)rx[17] << 8) | rx[18];
  out.frequency = rawFreq / 10.0f;

  // Register 0x0008: Power Factor (0.01 resolution)
  uint16_t rawPF = ((uint16_t)rx[19] << 8) | rx[20];
  out.pf = rawPF / 100.0f;

  out.valid = !isnan(out.voltage) && !isnan(out.current) && !isnan(out.power) &&
              !isnan(out.energy) && !isnan(out.frequency) && !isnan(out.pf);

  return out;
}

void writePhase(JsonObject &phases, const char *key, const PhaseReading &r)
{
  JsonObject o = phases[key].to<JsonObject>();
  o["voltage"]     = r.voltage;
  o["current"]     = r.current;
  o["power"]       = r.power;
  o["energy"]      = r.energy;       // cumulative kWh
  o["frequency"]   = r.frequency;
  o["powerFactor"] = r.pf;
}

// =====================================================
// WEB DIAGNOSTIC & POLLING HELPERS
// =====================================================

void pollAll()
{
  debugLog = "";

  logLine("================================");
  logLine("POLLING R / Y / B PHASES (Parallel Bus)");
  logLine("================================");

  uint8_t addrs[]  = { ADDR_PHASE_R, ADDR_PHASE_Y, ADDR_PHASE_B };
  const char* lbls[] = { "R", "Y", "B" };

  for (uint8_t i = 0; i < 3; i++)
  {
    logLine("");
    logLine("--- Phase " + phaseLabel(addrs[i]) + " [addr 0x" + hexByte(addrs[i]) + "] ---");

    PhaseReading pr = readPhase(addrs[i], lbls[i]);
    if (pr.valid)
    {
      logLine("  Voltage:      " + String(pr.voltage, 1) + " V");
      logLine("  Current:      " + String(pr.current, 3) + " A");
      logLine("  Power:        " + String(pr.power, 1) + " W");
      logLine("  Energy:       " + String(pr.energy, 3) + " kWh");
      logLine("  Frequency:    " + String(pr.frequency, 1) + " Hz");
      logLine("  Power Factor: " + String(pr.pf, 2));
    }
    else
    {
      logLine("  No response / error from this phase");
    }
    delay(100);
  }
}

void fullDiagnostic()
{
  debugLog = "";

  logLine("========================================");
  logLine("FULL DIAGNOSTIC — R / Y / B ON SHARED BUS");
  logLine("========================================");

  uint8_t addrs[]  = { ADDR_PHASE_R, ADDR_PHASE_Y, ADDR_PHASE_B };
  const char* lbls[] = { "R", "Y", "B" };
  bool allOk = true;

  for (uint8_t i = 0; i < 3; i++)
  {
    logLine("");
    logLine("############################################");
    logLine("PHASE " + phaseLabel(addrs[i]) + " -- expected address 0x" + hexByte(addrs[i]));
    logLine("############################################");

    logLine("");
    logLine("[1] Checking stored address register...");
    uint8_t actual;
    bool addrOk = readAddress(addrs[i], actual);

    if (addrOk && actual == addrs[i])
    {
      logLine("    -> Address OK (0x" + hexByte(actual) + ")");
    }
    else if (addrOk && actual != addrs[i])
    {
      logLine("    -> MISMATCH: unit replied but register says 0x" + hexByte(actual));
      allOk = false;
    }
    else
    {
      logLine("    -> FAILED: no valid reply for this address");
      logLine("    -> Check: Is unit wired? Is address configured? Is RX/TX swapped?");
      allOk = false;
    }

    delay(120);

    logLine("");
    logLine("[2] Checking full live readings...");
    PhaseReading pr = readPhase(addrs[i], lbls[i]);
    if (pr.valid)
    {
      logLine("    -> Voltage OK: " + String(pr.voltage, 1) + " V");
      logLine("    -> Current:    " + String(pr.current, 3) + " A");
      logLine("    -> Power:      " + String(pr.power, 1) + " W");
      logLine("    -> Energy:     " + String(pr.energy, 3) + " kWh");
      logLine("    -> Frequency:  " + String(pr.frequency, 1) + " Hz");
      logLine("    -> PF:         " + String(pr.pf, 2));
    }
    else
    {
      logLine("    -> FAILED: cannot read full register set");
      allOk = false;
    }

    delay(120);
  }

  logLine("");
  logLine("========================================");
  if (allOk)
    logLine("RESULT: ALL THREE PHASES OK");
  else
    logLine("RESULT: ONE OR MORE PHASES FAILED (see above)");
  logLine("========================================");
}

// =====================================================
// WEB INTERFACE & ENDPOINTS
// =====================================================

String makePage()
{
  String page = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SmartGrid Monitor - PZEM Debugger</title>
<style>
body { background:#111; color:white; font-family:Arial,sans-serif; padding:15px; margin:0; }
.container { max-width:720px; margin:auto; }
.card { background:#1e1e1e; border-radius:12px; padding:18px; margin-bottom:14px; border: 1px solid #333; }
button { width:100%; padding:14px; margin:6px 0; border:0; border-radius:8px; font-size:16px; font-weight:600; cursor:pointer; }
.scan { background:#2196F3; color:white; }
.poll { background:#00BCD4; color:white; }
.addrR { background:#E53935; color:white; }
.addrY { background:#FBC02D; color:#111; }
.addrB { background:#1E88E5; color:white; }
.diag { background:#455A64; color:white; }
#current { background:#0a0a0a; padding:16px; border-radius:8px; text-align:center; font-size:20px; border:1px solid #333; }
#debug { background:#0a0a0a; padding:14px; border-radius:8px; line-height:1.6; word-break:break-word; font-family:monospace; font-size:13px; max-height:400px; overflow-y:auto; border:1px solid #333; }
.warn { background:#2b1d00; border:1px solid #FF9800; padding:12px; border-radius:8px; margin-bottom:14px; font-size:13px; line-height:1.5; }
.links { font-size: 13px; color: #888; text-align: center; margin-top: 10px; }
.links a { color: #64B5F6; text-decoration: none; margin: 0 8px; }
</style>
</head>
<body>
<div class="container">

<div class="card">
<h2 style="margin:0 0 6px 0;">SmartGrid Monitor ESP32</h2>
<div style="color:#aaa; font-size:14px;">Parallel UART (GPIO16/17) &bull; Modbus R(01) / Y(02) / B(03)</div>
<div class="links">
  <a href="/readings" target="_blank">[Raw JSON Readings]</a>
  <a href="/status" target="_blank">[Device Status]</a>
</div>
</div>

<div class="warn">
<b>Address Configuration Step:</b> When setting an address, connect <b>ONLY THAT ONE PZEM</b> to the ESP32 UART lines. Once meter #1 is set to 01, meter #2 to 02, and meter #3 to 03, wire all three in parallel (shared RX/TX/GND) and press <b>POLL R / Y / B</b> or <b>FULL DIAGNOSTIC</b>.
</div>

<div class="card">
<div id="current">Current Address: UNKNOWN</div>
</div>

<div class="card">
<button class="scan" onclick="scan()">SCAN (Single unit connected)</button>
<button class="addrR" onclick="setAddr(1)">SET AS PHASE R (0x01)</button>
<button class="addrY" onclick="setAddr(2)">SET AS PHASE Y (0x02)</button>
<button class="addrB" onclick="setAddr(3)">SET AS PHASE B (0x03)</button>
<button class="poll" onclick="pollAll()">POLL ALL (R / Y / B Parallel)</button>
<button class="diag" onclick="fullDiag()">FULL DIAGNOSTIC (R / Y / B)</button>
</div>

<div class="card" style="font-size:14px; line-height:1.8;">
  <div style="font-weight:bold; color:#4CAF50; margin-bottom:6px;">&#x25CF; Direct Transmission: ACTIVE</div>
  <div><b>Site Backend:</b> <span id="siteUrl">%BACKEND_URL%</span></div>
  <div style="margin-top:10px; display:flex; gap:8px;">
    <input id="newBackend" type="text" placeholder="http://192.168.1.4:3000" value="%BACKEND_URL%" style="flex:1; padding:8px 10px; border-radius:6px; border:1px solid #444; background:#000; color:#fff; font-size:13px;">
    <button onclick="changeBackend()" style="width:auto; padding:8px 14px; font-size:13px; margin:0; background:#2e7d32; color:#fff;">Update URL</button>
  </div>
</div>

<div class="card">
<h3 style="margin:0 0 10px 0;">Live Output</h3>
<div id="debug">Ready...</div>
</div>

</div>

<script>
function changeBackend() {
  var u = document.getElementById("newBackend").value;
  if (!u) return;
  fetch("/setbackend?url=" + encodeURIComponent(u)).then(r => r.text()).then(msg => {
    alert(msg);
    document.getElementById("siteUrl").innerText = u;
  }).catch(e => alert("Error: " + e));
}

function scan() {
  document.getElementById("debug").innerHTML = "Scanning...";
  fetch("/scan").then(r => r.text()).then(data => {
    document.getElementById("debug").innerHTML = data;
    updateCurrent();
  }).catch(err => { document.getElementById("debug").innerHTML = "HTTP ERROR: " + err; });
}

function setAddr(addr) {
  var phase = addr == 1 ? "R" : (addr == 2 ? "Y" : "B");
  document.getElementById("debug").innerHTML = "Setting phase " + phase + " (address 0" + addr + ")...";
  fetch("/set?addr=" + addr).then(r => r.text()).then(data => {
    document.getElementById("debug").innerHTML = data;
    updateCurrent();
  }).catch(err => { document.getElementById("debug").innerHTML = "HTTP ERROR: " + err; });
}

function pollAll() {
  document.getElementById("debug").innerHTML = "Polling all 3 phases...";
  fetch("/poll").then(r => r.text()).then(data => {
    document.getElementById("debug").innerHTML = data;
  }).catch(err => { document.getElementById("debug").innerHTML = "HTTP ERROR: " + err; });
}

function fullDiag() {
  document.getElementById("debug").innerHTML = "Running full diagnostic...";
  fetch("/diagnostic").then(r => r.text()).then(data => {
    document.getElementById("debug").innerHTML = data;
  }).catch(err => { document.getElementById("debug").innerHTML = "HTTP ERROR: " + err; });
}

function updateCurrent() {
  fetch("/current").then(r => r.text()).then(data => {
    document.getElementById("current").innerHTML = "Current Address: <b>" + data + "</b>";
  });
}
</script>
</body>
</html>
)rawliteral";

  page.replace("%BACKEND_URL%", backendUrl);
  return page;
}

void handleRoot()
{
  String accept = server.header("Accept");
  if (accept.indexOf("application/json") >= 0 && accept.indexOf("text/html") == -1)
  {
    server.send(200, "application/json", "{\"device\":\"ESP32-SMARTGRID\",\"id\":\"" + String(DEVICE_IDENTIFIER) + "\",\"version\":\"" + String(FIRMWARE_VERSION) + "\"}");
  }
  else
  {
    server.send(200, "text/html", makePage());
  }
}

void handleScan()
{
  scanAddresses();
  server.send(200, "text/html", debugLog);
}

void handleSet()
{
  if (!server.hasArg("addr"))
  {
    server.send(400, "text/plain", "Address missing");
    return;
  }

  int address = server.arg("addr").toInt();
  if (address < 1 || address > 247)
  {
    server.send(400, "text/plain", "Invalid address");
    return;
  }

  processSet((uint8_t)address);
  server.send(200, "text/html", debugLog);
}

void handlePoll()
{
  pollAll();
  server.send(200, "text/html", debugLog);
}

void handleDiagnostic()
{
  fullDiagnostic();
  server.send(200, "text/html", debugLog);
}

void handleCurrent()
{
  if (lastAddress == 0)
    server.send(200, "text/plain", "UNKNOWN");
  else
    server.send(200, "text/plain", "0x" + hexByte(lastAddress));
}

void handleStatus()
{
  JsonDocument doc;
  doc["device"]   = DEVICE_IDENTIFIER;
  doc["id"]       = DEVICE_IDENTIFIER;
  doc["ip"]       = WiFi.localIP().toString();
  doc["rssi"]     = WiFi.RSSI();
  doc["firmware"] = FIRMWARE_VERSION;
  doc["backend"]  = backendUrl;
  doc["state"]    = state == STATE_OPERATING ? "OPERATING" : "PROVISIONING";
  doc["hasKey"]   = storedApiKey.length() > 0;

  String body;
  serializeJson(doc, body);
  server.send(200, "application/json", body);
}

void handleSetBackend()
{
  if (server.hasArg("url"))
  {
    String newUrl = server.arg("url");
    newUrl.trim();
    if (newUrl.endsWith("/")) newUrl.remove(newUrl.length() - 1);
    if (newUrl.length() > 7)
    {
      backendUrl = newUrl;
      prefs.putString("backendUrl", backendUrl);
      server.send(200, "text/plain", "Backend URL updated to: " + backendUrl);
      Serial.println("[CONFIG] Backend URL updated to: " + backendUrl);
      return;
    }
  }
  server.send(400, "text/plain", "Missing or invalid url parameter");
}

void handleHttpReadings()
{
  PhaseReading r = readPhase(ADDR_PHASE_R, "R");
  delay(30);
  PhaseReading y = readPhase(ADDR_PHASE_Y, "Y");
  delay(30);
  PhaseReading b = readPhase(ADDR_PHASE_B, "B");

  // Fallbacks if disconnected so consumers don't fail validation
  if (!r.valid) { r.voltage = 0.0f; r.current = 0.0f; r.power = 0.0f; r.energy = 0.0f; r.frequency = 50.0f; r.pf = 1.0f; }
  if (!y.valid) { y.voltage = 0.0f; y.current = 0.0f; y.power = 0.0f; y.energy = 0.0f; y.frequency = 50.0f; y.pf = 1.0f; }
  if (!b.valid) { b.voltage = 0.0f; b.current = 0.0f; b.power = 0.0f; b.energy = 0.0f; b.frequency = 50.0f; b.pf = 1.0f; }

  if (r.frequency < 40.0f || r.frequency > 70.0f) r.frequency = 50.0f;
  if (y.frequency < 40.0f || y.frequency > 70.0f) y.frequency = 50.0f;
  if (b.frequency < 40.0f || b.frequency > 70.0f) b.frequency = 50.0f;

  JsonDocument doc;
  doc["deviceId"] = DEVICE_IDENTIFIER;
  doc["firmware"] = FIRMWARE_VERSION;
  doc["uptime"]   = millis();

  JsonObject phases = doc["phases"].to<JsonObject>();
  writePhase(phases, "R", r);
  writePhase(phases, "Y", y);
  writePhase(phases, "B", b);

  String body;
  serializeJson(doc, body);

  server.send(200, "application/json", body);
}

// =====================================================
// WI-FI CONNECTION
// =====================================================

void connectWiFi()
{
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("Connecting to Wi-Fi \"%s\"...\n", WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < WIFI_CONNECT_TIMEOUT_MS)
  {
    delay(250);
    Serial.print(".");
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println("======================================");
    Serial.println("Wi-Fi Status: CONNECTED");
    Serial.print("SSID: ");
    Serial.println(WiFi.SSID());
    Serial.print("Device IP: http://");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength (RSSI): ");
    Serial.println(WiFi.RSSI());
    Serial.println("======================================");
  }
  else
  {
    Serial.println("======================================");
    Serial.println("Wi-Fi Status: NOT CONNECTED (check credentials)");
    Serial.println("======================================");
    delay(WIFI_RETRY_DELAY_MS);
  }
}

// =====================================================
// PROVISIONING (ANNOUNCE -> CLAIM -> FETCH-KEY)
// =====================================================

void runProvisioning()
{
  unsigned long now = millis();

  if (!deviceClaimed)
  {
    if (lastAnnounce != 0 && now - lastAnnounce < ANNOUNCE_INTERVAL_MS) return;
    lastAnnounce = now;
    deviceClaimed = announceDevice();
    return;
  }

  if (lastFetchAttempt != 0 && now - lastFetchAttempt < FETCH_KEY_INTERVAL_MS) return;
  lastFetchAttempt = now;

  String key = fetchApiKey();
  if (key.length() > 0)
  {
    storedApiKey = key;
    prefs.putString("apiKey", storedApiKey);
    Serial.println("Received API key from server — switching to normal operation.");
    state = STATE_OPERATING;
  }
}

bool announceDevice()
{
  JsonDocument doc;
  doc["deviceIdentifier"] = DEVICE_IDENTIFIER;
  doc["wifiSsid"] = WiFi.SSID();
  doc["firmwareVersion"] = FIRMWARE_VERSION;

  String body;
  serializeJson(doc, body);

  String response;
  int code = postJson("/api/devices/announce", DEVICE_API_SECRET, body, response);

  if (code != 200)
  {
    Serial.printf("announce failed, HTTP %d: %s\n", code, response.c_str());
    return false;
  }

  JsonDocument resp;
  deserializeJson(resp, response);

  bool claimed = resp["claimed"] | false;
  Serial.println(claimed
                 ? "Announced — already claimed, fetching our API key..."
                 : "Announced — waiting for operator to claim in web UI (Utilities > Discovered Devices)...");

  return claimed;
}

String fetchApiKey()
{
  JsonDocument doc;
  doc["deviceIdentifier"] = DEVICE_IDENTIFIER;

  String body;
  serializeJson(doc, body);

  String response;
  int code = postJson("/api/devices/fetch-key", DEVICE_API_SECRET, body, response);

  if (code != 200)
  {
    Serial.printf("fetch-key failed, HTTP %d: %s\n", code, response.c_str());
    return "";
  }

  JsonDocument resp;
  deserializeJson(resp, response);

  if (resp["apiKey"].isNull())
  {
    Serial.println("Claimed, but the key isn't ready yet — retrying shortly.");
    return "";
  }

  return String((const char *)resp["apiKey"]);
}

// =====================================================
// NORMAL OPERATION (READ SENSORS & UPLOAD)
// =====================================================

void runOperating()
{
  unsigned long now = millis();
  if (lastReading != 0 && now - lastReading < READING_INTERVAL_MS) return;
  lastReading = now;

  // Poll R, Y, B sequentially on the parallel UART bus
  PhaseReading r = readPhase(ADDR_PHASE_R, "R");
  delay(30);
  PhaseReading y = readPhase(ADDR_PHASE_Y, "Y");
  delay(30);
  PhaseReading b = readPhase(ADDR_PHASE_B, "B");

  // Retry if any phase failed to respond on shared bus
  if (!r.valid) { delay(50); r = readPhase(ADDR_PHASE_R, "R"); }
  if (!y.valid) { delay(50); y = readPhase(ADDR_PHASE_Y, "Y"); }
  if (!b.valid) { delay(50); b = readPhase(ADDR_PHASE_B, "B"); }

  // Fallback defaults for missing / unmetered phases so backend validation passes
  if (!r.valid) { r.voltage = 0.0f; r.current = 0.0f; r.power = 0.0f; r.energy = 0.0f; r.frequency = 50.0f; r.pf = 1.0f; }
  if (!y.valid) { y.voltage = 0.0f; y.current = 0.0f; y.power = 0.0f; y.energy = 0.0f; y.frequency = 50.0f; y.pf = 1.0f; }
  if (!b.valid) { b.voltage = 0.0f; b.current = 0.0f; b.power = 0.0f; b.energy = 0.0f; b.frequency = 50.0f; b.pf = 1.0f; }

  // Ensure frequency is within valid bounds (40-70Hz)
  if (r.frequency < 40.0f || r.frequency > 70.0f) r.frequency = 50.0f;
  if (y.frequency < 40.0f || y.frequency > 70.0f) y.frequency = 50.0f;
  if (b.frequency < 40.0f || b.frequency > 70.0f) b.frequency = 50.0f;

  // Ensure power factor is within valid bounds (0.0-1.0)
  if (r.pf < 0.0f || r.pf > 1.0f) r.pf = 1.0f;
  if (y.pf < 0.0f || y.pf > 1.0f) y.pf = 1.0f;
  if (b.pf < 0.0f || b.pf > 1.0f) b.pf = 1.0f;

  JsonDocument doc;
  doc["deviceId"] = DEVICE_IDENTIFIER;

  JsonObject phases = doc["phases"].to<JsonObject>();
  writePhase(phases, "R", r);
  writePhase(phases, "Y", y);
  writePhase(phases, "B", b);

  String body;
  serializeJson(doc, body);

  String response;
  Serial.printf("[IOT] Transmitting readings (R:%.1fV, Y:%.1fV, B:%.1fV) to %s...\n",
                r.voltage, y.voltage, b.voltage, backendUrl.c_str());
  int code = postJson("/api/iot/readings", storedApiKey, body, response);

  if (code == 200 || code == 201)
  {
    Serial.printf("[IOT] Transmission SUCCESS (HTTP %d): %s\n", code, response.c_str());
  }
  else if (code == 401)
  {
    Serial.println("[IOT ERROR] API key rejected (401). Resetting to pre-configured key.");
    storedApiKey = DEVICE_API_KEY;
    prefs.putString("apiKey", storedApiKey);
  }
  else
  {
    Serial.printf("[IOT ERROR] Upload failed, HTTP %d: %s\n", code, response.c_str());
  }
}

// =====================================================
// HTTP POST HELPER
// =====================================================

int postJson(const char *path, const String &bearerToken, const String &body, String &responseOut)
{
  HTTPClient http;
  String url = backendUrl + path;
  bool isHttps = url.startsWith("https://");

  WiFiClientSecure secureClient;
  WiFiClient regularClient;
  bool began;

  if (isHttps)
  {
    secureClient.setInsecure();
    began = http.begin(secureClient, url);
  }
  else
  {
    began = http.begin(regularClient, url);
  }

  if (!began)
  {
    responseOut = "http.begin() failed — check backendUrl in sketch";
    return -1;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + bearerToken);
  http.setTimeout(8000);

  int code = http.POST(body);
  responseOut = code > 0 ? http.getString() : http.errorToString(code);
  http.end();

  return code;
}

// =====================================================
// SETUP & LOOP
// =====================================================

void setup()
{
  Serial.begin(115200);
  delay(200);

  Serial.println();
  Serial.println("==============================================");
  Serial.println("SmartGrid Monitor ESP32 Firmware Starting...");
  Serial.printf("Device ID: %s   Firmware: %s\n", DEVICE_IDENTIFIER, FIRMWARE_VERSION);
  Serial.println("==============================================");

  // Initialize HardwareSerial2 for parallel PZEM bus
  PZEM.begin(PZEM_BAUD, SERIAL_8N1, PZEM_RX, PZEM_TX);

  // Persistent storage for API Key and Backend URL
  prefs.begin("smartgrid", false);
  storedApiKey = prefs.getString("apiKey", "");
  backendUrl = prefs.getString("backendUrl", BACKEND_BASE_URL);

  // Always enforce pre-configured key if defined
  if (String(DEVICE_API_KEY).length() > 0)
  {
    storedApiKey = DEVICE_API_KEY;
    prefs.putString("apiKey", storedApiKey);
    Serial.println("Using configured device API key.");
  }

  connectWiFi();

  if (storedApiKey.length() > 0)
  {
    Serial.println("API key active — entering normal operating & transmitting mode.");
    Serial.printf("Target backend site: %s\n", backendUrl.c_str());
    state = STATE_OPERATING;
  }
  else
  {
    Serial.println("No API key stored — entering self-provisioning mode.");
    state = STATE_PROVISIONING;
  }

  // Web Server Routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/readings", HTTP_GET, handleHttpReadings);
  server.on("/scan", HTTP_GET, handleScan);
  server.on("/set", HTTP_GET, handleSet);
  server.on("/setbackend", HTTP_GET, handleSetBackend);
  server.on("/poll", HTTP_GET, handlePoll);
  server.on("/diagnostic", HTTP_GET, handleDiagnostic);
  server.on("/current", HTTP_GET, handleCurrent);

  server.begin();
  Serial.println("Local HTTP WebServer started on port 80.");
}

void loop()
{
  server.handleClient();

  if (WiFi.status() != WL_CONNECTED)
  {
    connectWiFi();
    return;
  }

  if (state == STATE_PROVISIONING)
  {
    runProvisioning();
  }
  else
  {
    runOperating();
  }
}