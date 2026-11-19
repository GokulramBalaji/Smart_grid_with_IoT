import { NextRequest } from "next/server";
import { resolveRequestDevice } from "@/lib/session";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { buildReportSummary, resolveReportRange, type ReportPeriod } from "@/lib/analytics/report";

const VALID_PERIODS: ReportPeriod[] = ["daily", "weekly", "monthly", "custom"];

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const deviceId = params.get("deviceId");
    const period = (params.get("period") ?? "daily") as ReportPeriod;
    const from = params.get("from");
    const to = params.get("to");

    if (!VALID_PERIODS.includes(period)) {
      return apiError(`Invalid period. Expected one of: ${VALID_PERIODS.join(", ")}`, 400);
    }
    if (period === "custom" && (!from || !to)) {
      return apiError("Custom reports require both `from` and `to` query parameters.", 400);
    }

    const { device } = await resolveRequestDevice(deviceId);
    if (!device) return apiSuccess({ device: null });

    const range = resolveReportRange(period, from, to);
    const summary = await buildReportSummary(device.id, device.name, range);

    return apiSuccess(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
