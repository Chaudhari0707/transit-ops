import type { ApiErrorCode, ApiErrorStatus } from "@/lib/api/_types/errors";

/** Map service error messages to HTTP status codes (api-standards). */

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallback;
}

export function resolveErrorCode(message: string): ApiErrorStatus {
  const normalized = message.trim().toLowerCase();

  if (normalized === "unauthorized") {
    return "401";
  }

  if (normalized === "forbidden") {
    return "403";
  }

  if (normalized.endsWith("not found")) {
    return "404";
  }

  if (
    normalized === "conflict" ||
    normalized.startsWith("conflict") ||
    normalized.includes("already has an open")
  ) {
    return "409";
  }

  if (normalized === "too many requests" || normalized.includes("too many requests")) {
    return "429";
  }

  return "400";
}

export function resolveErrorCodeNumber(message: string): ApiErrorCode {
  return Number(resolveErrorCode(message)) as ApiErrorCode;
}

export function resolveErrorCodeFor<T extends ApiErrorCode>(
  message: string,
  allowed: readonly T[],
): T {
  const resolved = resolveErrorCodeNumber(message);

  if ((allowed as readonly number[]).includes(resolved)) {
    return resolved as T;
  }

  return (allowed[0] ?? 400) as T;
}
