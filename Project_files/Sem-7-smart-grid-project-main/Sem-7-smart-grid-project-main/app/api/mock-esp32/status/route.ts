import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    device: "ESP32-SMARTGRID-PZEM",
    id: "ESP32-SMARTGRID-DEMO",
    firmware: "1.4.2",
    status: "ONLINE",
    wifi: {
      ssid: "SmartGrid-Lab-Wifi",
      rssi: -58,
      ip: "127.0.0.1",
    },
    pzem: {
      phaseR: "OK",
      phaseY: "OK",
      phaseB: "OK",
    },
  });
}
