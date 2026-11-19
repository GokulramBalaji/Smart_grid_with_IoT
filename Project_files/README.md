# Smart Grid with IoT - Embedded Energy Monitoring System

An end-to-end IoT-enabled Smart Grid monitoring and energy metering platform powered by the **ESP32 microcontroller**, **PZEM-004T v3.0 power sensor**, and a modern supervisory telemetry system.

---

## 📁 Repository Contents

```
Project_files/
├── Sem-7-smart-grid-project-main/
│   ├── Sem-7-smart-grid-project-main/  # Full-stack Smart Grid Analytics Platform
│   │   ├── app/                         # Next.js 15 App Router (Dashboard, Analytics, Alerts)
│   │   ├── components/                  # Real-time charts, phasor diagrams, electrical gauges
│   │   ├── firmware/                    # ESP32 C++ firmware for energy monitoring
│   │   ├── lib/                         # Power calculations, AI forecasting & anomaly detection
│   │   ├── prisma/                      # Database schema and migrations
│   │   └── scripts/                     # Background polling & service runners
│   │
│   ├── reviwe 2 html/                   # Interactive Presentation & Defense Cockpit (React + Vite)
│   │   ├── src/components/              # 3-phase waveform canvas, power triangles, viva defense
│   │   └── dist/                        # Pre-compiled static presentation assets
│   │
│   └── Smart_grid_with_IoT-main/        # Hardware Models & Documentation
│       ├── 3D fils/                     # 3D printable enclosure files (.stl, .scad)
│       ├── esp32.pdf                    # ESP32 pinout & specifications
│       └── pzem 004-t.pdf               # PZEM-004T v3.0 communication protocol & manual
│
└── esp32-smart-energy-meter-main/       # Standalone ESP32 Energy Meter
    └── esp32_smart_energy_meter/
        └── esp32_smart_energy_meter.ino # Arduino sketch for PZEM-004T sensor reading
```

---

## ⚡ Key Features

- **High-Precision Energy Sensing:** Measures Voltage (V), Current (A), Active Power (W), Cumulative Energy (kWh), Frequency (Hz), and Power Factor (PF) via UART Modbus RTU using PZEM-004T v3.0.
- **Real-Time Telemetry & Dashboards:** Next.js supervisory interface with WebSocket updates for real-time electrical analytics.
- **Power Quality Analysis:** Real-time computation of THD (Total Harmonic Distortion), reactive power, phasor diagrams, and power triangles.
- **Enclosures & Hardware:** Custom 3D printable modular casing for DIN rail / wall mount installation.

---

## 🚀 Quick Start

### Standalone Energy Meter (Arduino IDE)
1. Open `esp32-smart-energy-meter-main/esp32_smart_energy_meter/esp32_smart_energy_meter.ino`.
2. Connect ESP32 via USB and PZEM-004T via UART (RX: GPIO 16, TX: GPIO 17).
3. Select **ESP32 Dev Module** in Arduino IDE and click **Upload**.

### Supervisory Web Platform
```cmd
cd Sem-7-smart-grid-project-main\Sem-7-smart-grid-project-main
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.
