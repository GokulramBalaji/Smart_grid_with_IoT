// SmartGrid Monitor — ESP32 firmware
//
// Reads three single-phase PZEM-004T v3.0 sensors (Phase R, Y, B) and
// reports them to a SmartGrid Monitor backend. Handles its own provisioning:
// a freshly-flashed board with no stored API key announces itself over
// Wi-Fi, waits for an operator to map it onto a utility node in the web UI,
// then automatically fetches the API key it was issued — no manual key
// entry required. See ../README.md for wiring, libraries and setup.
//
// Wiring (see ../README.md for the full diagram and safety notes):
//   Phase R PZEM  <-> ESP32 Serial2 (hardware UART), pins 16 (RX) / 17 (TX)
//   Phase Y PZEM  <-> ESP32 Serial1 (hardware UART), pins 18 (RX) / 19 (TX)
//   Phase B PZEM  <-> ESP32 SoftwareSerial,           pins 25 (RX) / 26 (TX)
//
// Required libraries (Arduino IDE Library Manager):
//   - ArduinoJson (Benoit Blanchon)     v7.x
//   - PZEM004Tv30 (Jakub Mandula)       latest
//   - EspSoftwareSerial (Peter Lerup)   latest

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>
#include <SoftwareSerial.h>

#include "secrets.h"

#define FIRMWARE_VERSION "1.0.0"

// ---------------- Sensor wiring ----------------
#define PZEM_R_SERIAL Serial2
#define PZEM_R_RX_PIN 16
#define PZEM_R_TX_PIN 17

#define PZEM_Y_SERIAL Serial1
#define PZEM_Y_RX_PIN 18
#define PZEM_Y_TX_PIN 19

#define PZEM_B_RX_PIN 25
#define PZEM_B_TX_PIN 26

PZEM004Tv30 pzemR(PZEM_R_SERIAL, PZEM_R_RX_PIN, PZEM_R_TX_PIN);
PZEM004Tv30 pzemY(PZEM_Y_SERIAL, PZEM_Y_RX_PIN, PZEM_Y_TX_PIN);
SoftwareSerial pzemBSerial;
PZEM004Tv30 pzemB(pzemBSerial);

// ---------------- Timing ----------------
const unsigned long WIFI_CONNECT_TIMEOUT_MS = 20000;
const unsigned long WIFI_RETRY_DELAY_MS = 5000;
const unsigned long ANNOUNCE_INTERVAL_MS = 15000;   // how often to re-announce while unclaimed
const unsigned long FETCH_KEY_INTERVAL_MS = 10000;  // how often to poll for the issued key
const unsigned long READING_INTERVAL_MS = 10000;    // how often to upload a reading once operating

// ---------------- Persisted state ----------------
Preferences prefs;
String storedApiKey;

enum DeviceState { STATE_PROVISIONING, STATE_OPERATING };
DeviceState state;

unsigned long lastAnnounce = 0;
unsigned long lastFetchAttempt = 0;
unsigned long lastReading = 0;
bool deviceClaimed = false;  // has an operator claimed us yet, per the last announce/fetch?

struct PhaseReading {
  bool valid;
  float voltage, current, power, energy, frequency, pf;
};

// ---------------- Setup / loop ----------------

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println("SmartGrid Monitor ESP32 firmware starting...");
  Serial.printf("Device identifier: %s   Firmware: %s\n", DEVICE_IDENTIFIER, FIRMWARE_VERSION);

  pzemBSerial.begin(9600, SWSERIAL_8N1, PZEM_B_RX_PIN, PZEM_B_TX_PIN);

  prefs.begin("smartgrid", false);
  storedApiKey = prefs.getString("apiKey", "");

  connectWiFi();

  if (storedApiKey.length() > 0) {
    Serial.println("Found a stored API key — going straight to normal operation.");
    state = STATE_OPERATING;
  } else {
    Serial.println("No API key stored yet — starting provisioning (announce + claim + fetch-key).");
    state = STATE_PROVISIONING;
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    return;
  }

  if (state == STATE_PROVISIONING) {
    runProvisioning();
  } else {
    runOperating();
  }
}

// ---------------- Wi-Fi ----------------

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("Connecting to Wi-Fi \"%s\"...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < WIFI_CONNECT_TIMEOUT_MS) {
    delay(250);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("Wi-Fi connected. IP: %s   SSID: %s\n",
                   WiFi.localIP().toString().c_str(), WiFi.SSID().c_str());
  } else {
    Serial.println("Wi-Fi connect failed — will retry.");
    delay(WIFI_RETRY_DELAY_MS);
  }
}

// ---------------- Provisioning (announce -> claim -> fetch-key) ----------------

void runProvisioning() {
  unsigned long now = millis();

  if (!deviceClaimed) {
    if (lastAnnounce != 0 && now - lastAnnounce < ANNOUNCE_INTERVAL_MS) return;
    lastAnnounce = now;
    deviceClaimed = announceDevice();
    return;
  }

  if (lastFetchAttempt != 0 && now - lastFetchAttempt < FETCH_KEY_INTERVAL_MS) return;
  lastFetchAttempt = now;

  String key = fetchApiKey();
  if (key.length() > 0) {
    storedApiKey = key;
    prefs.putString("apiKey", storedApiKey);
    Serial.println("Received API key from the server — switching to normal operation.");
    state = STATE_OPERATING;
  }
}

bool announceDevice() {
  JsonDocument doc;
  doc["deviceIdentifier"] = DEVICE_IDENTIFIER;
  doc["wifiSsid"] = WiFi.SSID();
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  String body;
  serializeJson(doc, body);

  String response;
  int code = postJson("/api/devices/announce", DEVICE_API_SECRET, body, response);
  if (code != 200) {
    Serial.printf("announce failed, HTTP %d: %s\n", code, response.c_str());
    return false;
  }

  JsonDocument resp;
  deserializeJson(resp, response);
  bool claimed = resp["claimed"] | false;
  Serial.println(claimed
                      ? "Announced — already claimed, fetching our API key..."
                      : "Announced — waiting for an operator to claim us in the web UI (Utilities > Discovered Devices)...");
  return claimed;
}

String fetchApiKey() {
  JsonDocument doc;
  doc["deviceIdentifier"] = DEVICE_IDENTIFIER;
  String body;
  serializeJson(doc, body);

  String response;
  int code = postJson("/api/devices/fetch-key", DEVICE_API_SECRET, body, response);
  if (code != 200) {
    Serial.printf("fetch-key failed, HTTP %d: %s\n", code, response.c_str());
    return "";
  }

  JsonDocument resp;
  deserializeJson(resp, response);
  if (resp["apiKey"].isNull()) {
    Serial.println("Claimed, but the key isn't ready to hand off yet — retrying shortly.");
    return "";
  }
  return String((const char *)resp["apiKey"]);
}

// ---------------- Normal operation (read sensors, upload) ----------------

void runOperating() {
  unsigned long now = millis();
  if (lastReading != 0 && now - lastReading < READING_INTERVAL_MS) return;
  lastReading = now;

  PhaseReading r = readPhase(pzemR, "R");
  PhaseReading y = readPhase(pzemY, "Y");
  PhaseReading b = readPhase(pzemB, "B");

  if (!r.valid || !y.valid || !b.valid) {
    Serial.println("One or more PZEM sensors returned no data this cycle (NaN) — check wiring. Skipping upload.");
    return;
  }

  JsonDocument doc;
  doc["deviceId"] = DEVICE_IDENTIFIER;
  JsonObject phases = doc["phases"].to<JsonObject>();
  writePhase(phases, "R", r);
  writePhase(phases, "Y", y);
  writePhase(phases, "B", b);

  String body;
  serializeJson(doc, body);

  String response;
  int code = postJson("/api/iot/readings", storedApiKey, body, response);

  if (code == 401) {
    // Our key was rotated (or somehow invalidated) server-side. Drop it and
    // go straight back to the fetch-key step — we already know we're
    // claimed, so there's no need to re-announce first.
    Serial.println("API key rejected (401) — clearing it and re-fetching a fresh one.");
    storedApiKey = "";
    prefs.remove("apiKey");
    deviceClaimed = true;
    lastFetchAttempt = 0;
    state = STATE_PROVISIONING;
    return;
  }

  if (code != 200 && code != 201) {
    Serial.printf("Reading upload failed, HTTP %d: %s\n", code, response.c_str());
    return;
  }

  Serial.printf("Uploaded reading OK (HTTP %d): %s\n", code, response.c_str());
}

PhaseReading readPhase(PZEM004Tv30 &pzem, const char *label) {
  PhaseReading out;
  out.voltage = pzem.voltage();
  out.current = pzem.current();
  out.power = pzem.power();
  out.energy = pzem.energy();
  out.frequency = pzem.frequency();
  out.pf = pzem.pf();
  out.valid = !isnan(out.voltage) && !isnan(out.current) && !isnan(out.power) &&
              !isnan(out.energy) && !isnan(out.frequency) && !isnan(out.pf);
  if (!out.valid) {
    Serial.printf("Phase %s: PZEM read failed (NaN) — check that its wiring/power is intact.\n", label);
  }
  return out;
}

void writePhase(JsonObject &phases, const char *key, const PhaseReading &r) {
  JsonObject o = phases[key].to<JsonObject>();
  o["voltage"] = r.voltage;
  o["current"] = r.current;
  o["power"] = r.power;
  o["energy"] = r.energy;       // cumulative kWh counter — server derives the delta itself
  o["frequency"] = r.frequency;
  o["powerFactor"] = r.pf;
}

// ---------------- HTTP helper ----------------

// POSTs `body` (JSON) to BACKEND_BASE_URL + path with `Authorization: Bearer
// <bearerToken>`. Returns the HTTP status code (or a negative HTTPClient
// error code on a connection failure) and fills `responseOut` with the
// response body (or the error string on failure).
int postJson(const char *path, const String &bearerToken, const String &body, String &responseOut) {
  HTTPClient http;
  String url = String(BACKEND_BASE_URL) + path;
  bool isHttps = url.startsWith("https://");

  WiFiClientSecure secureClient;
  bool began;
  if (isHttps) {
    // Getting started quickly: skip server certificate validation. For a
    // real production deployment, replace this with secureClient.setCACert(...)
    // pinned to your backend's root CA instead of setInsecure().
    secureClient.setInsecure();
    began = http.begin(secureClient, url);
  } else {
    began = http.begin(url);
  }

  if (!began) {
    responseOut = "http.begin() failed — check BACKEND_BASE_URL in secrets.h";
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
