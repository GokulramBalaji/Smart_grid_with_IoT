import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError("Validation failed", 422, error.flatten());
  }
  if (error instanceof Error) {
    const status = (error as { status?: number }).status;
    if (status) return apiError(error.message, status);
    console.error(error);
    return apiError(error.message, 500);
  }
  console.error(error);
  return apiError("Unexpected server error", 500);
}
