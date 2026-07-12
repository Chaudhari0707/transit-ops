/** Numeric codes for modules that use Elysia `status(number, body)`. */
export type ApiErrorCode = 400 | 401 | 403 | 404 | 409 | 429;

/** String codes match Elysia's `status()` SelectiveStatus typing. */
export type ApiErrorStatus = "400" | "401" | "403" | "404" | "409" | "429";
