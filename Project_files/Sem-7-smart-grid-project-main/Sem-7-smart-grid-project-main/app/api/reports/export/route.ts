import { NextRequest } from "next/server";
import { resolveRequestDevice } from "@/lib/session";
import { buildReportSummary, resolveReportRange, type ReportPeriod } from "@/lib/analytics/report";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const deviceId = params.get("deviceId");
  const period = (params.get("period") ?? "daily") as ReportPeriod;
  const from = params.get("from");
  const to = params.get("to");

  const { device } = await resolveRequestDevice(deviceId);
  if (!device) return new Response("No device found.", { status: 404 });

  const range = resolveReportRange(period, from, to);
  const summary = await buildReportSummary(device.id, device.name, range);

  const rows = [
    ["Metric", "Value"],
    ["Device", summary.deviceName],
    ["Period", summary.period],
    ["From", summary.from],
    ["To", summary.to],
    ["Total Energy (kWh)", summary.totalEnergy],
    ["Phase R Energy (kWh)", summary.phaseEnergy.R],
    ["Phase Y Energy (kWh)", summary.phaseEnergy.Y],
    ["Phase B Energy (kWh)", summary.phaseEnergy.B],
    ["Max Voltage (V)", summary.maxVoltage],
    ["Min Voltage (V)", summary.minVoltage],
    ["Max Current (A)", summary.maxCurrent],
    ["Peak Power (W)", summary.peakPower],
    ["Average Power Factor", summary.avgPowerFactor],
    ["Load Imbalance (%)", summary.loadImbalancePercent],
    ["Total Alerts", summary.alertCount],
    ["Critical Alerts", summary.criticalAlertCount],
  ];

  const csv = rows.map((r) => r.join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="smartgrid-report-${period}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
