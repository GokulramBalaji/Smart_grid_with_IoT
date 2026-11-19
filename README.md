# Smart Grid with IoT - Energy Monitoring & Telemetry Platform

An IoT-enabled three-phase smart grid monitoring, energy metering, and power quality analytics platform utilizing the **ESP32 microcontroller**, **PZEM-004T v3.0 power sensor**, and a modern web supervisory dashboard.

---

## 📁 Repository Structure

```
Smart_grid_with_IoT/
├── 3D fils/                             # 3D printable CAD models for sensor & ESP32 enclosures
├── esp32.pdf                            # Technical datasheet & pinout for ESP32
├── pzem 004-t.pdf                       # PZEM-004T v3.0 Modbus RTU communication protocol manual
├── index.html                           # Standalone browser monitor dashboard
├── intex.html                           # Secondary visual interface
├── Screenshot 2026-08-29 093343.png      # Hardware setup and prototype capture
│
└── Project_files/                       # Complete project development source code
    ├── Sem-7-smart-grid-project-main/   # Full-stack Smart Grid Analytics Platform
    │   ├── Sem-7-smart-grid-project-main/  # Next.js 15 + Prisma + PostgreSQL/SQLite + Firmware
    │   ├── reviwe 2 html/                  # React + Vite interactive presentation cockpit
    │   └── Smart_grid_with_IoT-main/       # Hardware design files & assets
    └── esp32-smart-energy-meter-main/   # Standalone Arduino sketch for ESP32 energy meter
```

---

## ⚡ Core Capabilities

- **High-Precision Multi-Parameter Sensing:** Real-time acquisition of Voltage, Current, Active Power, Frequency, and Power Factor via UART Modbus RTU.
- **Power Quality Analysis:** Calculation of Total Harmonic Distortion (THD), reactive power, phasor balance, and power triangles.
- **Supervisory Dashboard:** Next.js full-stack platform with real-time WebSocket telemetry, historical analytics, and automated fault alert generation.
- **Hardware Enclosures:** Modular 3D-printable enclosures engineered for secure installation and DIN rail mounting.

---

## 🛠️ Tech Stack

- **Hardware & Microcontrollers:** ESP32 (38-pin DevKit V1), PZEM-004T v3.0 AC energy sensor
- **Embedded Software:** C / C++ (Arduino IDE & PlatformIO)
- **Web Platform:** TypeScript, React, Next.js, Prisma ORM, Tailwind CSS, WebSockets
