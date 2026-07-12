/** Map service error messages to HTTP status codes (api-standards). */

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

/** String codes match Elysia's `status()` SelectiveStatus typing. */
export type ApiErrorStatus = "400" | "401" | "403" | "404" | "409" | "429";

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

  if (normalized === "conflict" || normalized.startsWith("conflict:")) {
    return "409";
  }

  if (normalized === "too many requests") {
    return "429";
  }

  return "400";
}
