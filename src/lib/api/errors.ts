export function errorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallbackMessage;
}

export function resolveErrorCode(message: string): 400 | 401 | 403 | 404 | 409 | 429 {
  if (message === "Unauthorized") {
    return 401;
  }

  if (message === "Forbidden") {
    return 403;
  }

  if (message.endsWith("not found")) {
    return 404;
  }

  if (message === "Conflict") {
    return 409;
  }

  if (message === "Too many requests") {
    return 429;
  }

  return 400;
}

export function resolveErrorCodeFor<T extends 400 | 401 | 403 | 404 | 409 | 429>(
  message: string,
  allowed: readonly T[],
): T {
  const resolved = resolveErrorCode(message);

  if ((allowed as readonly number[]).includes(resolved)) {
    return resolved as T;
  }

  return (allowed[0] ?? 400) as T;
}
