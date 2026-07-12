/** Shared user-facing auth/permission messages (API + UI). */

export const UNAUTHORIZED_MESSAGE = "Your session has expired or you are not signed in." as const;

export const FORBIDDEN_MESSAGE = "You do not have permission to perform this action." as const;

/** Toast copy when a client request indicates an expired session. */
export const SESSION_EXPIRED_TOAST = "Your session has expired. Please sign in again." as const;

export function isUnauthorizedErrorMessage(message: string): boolean {
  const lower = message.trim().toLowerCase();
  return (
    lower === "unauthorized" ||
    lower.includes("session has expired") ||
    lower.includes("not signed in") ||
    lower.includes("request failed (401)")
  );
}

export function isForbiddenErrorMessage(message: string): boolean {
  const lower = message.trim().toLowerCase();
  return (
    lower === "forbidden" ||
    lower.includes("do not have permission") ||
    lower.includes("request failed (403)")
  );
}

/** Map raw API/service messages to stable toast copy. */
export function toUserFacingApiError(message: string): string {
  if (isUnauthorizedErrorMessage(message)) {
    return UNAUTHORIZED_MESSAGE;
  }
  if (isForbiddenErrorMessage(message)) {
    return FORBIDDEN_MESSAGE;
  }
  return message;
}
