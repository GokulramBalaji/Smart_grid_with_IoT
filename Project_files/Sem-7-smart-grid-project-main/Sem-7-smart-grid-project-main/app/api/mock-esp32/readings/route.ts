import { NextResponse } from "next/server";

export async function GET() {
  const baseV = 230 + (Math.random() * 4 - 2);
  const baseI = 4.0 + (Math.random() * 1.5 - 0.75);

  return NextResponse.json({
    device: "ESP32-SMARTGRID-PZEM",
    deviceId: "ESP32-SMARTGRID-001",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    phases: {
      R: {
        voltage: Number((baseV + (Math.random() * 2 - 1)).toFixed(1)),
        current: Number((baseI + 0.3).toFixed(2)),
        power: Number(((baseV + 0.5) * (baseI + 0.3) * 0.98).toFixed(1)),
        energy: Number((12.45 + (process.uptime() * 0.001)).toFixed(3)),
        frequency: 50.0,
        powerFactor: 0.98,
      },
      Y: {
        voltage: Number((baseV - 1.2 + (Math.random() * 2 - 1)).toFixed(1)),
        current: Number((baseI - 0.2).toFixed(2)),
        power: Number(((baseV - 1.2) * (baseI - 0.2) * 0.96).toFixed(1)),
        energy: Number((11.12 + (process.uptime() * 0.001)).toFixed(3)),
        frequency: 50.0,
        powerFactor: 0.96,
      },
      B: {
        voltage: Number((baseV + 0.8 + (Math.random() * 2 - 1)).toFixed(1)),
        current: Number((baseI + 0.1).toFixed(2)),
        power: Number(((baseV + 0.8) * (baseI + 0.1) * 0.99).toFixed(1)),
        energy: Number((11.89 + (process.uptime() * 0.001)).toFixed(3)),
        frequency: 50.0,
        powerFactor: 0.99,
      },
    },
  });
}
