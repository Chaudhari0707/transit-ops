const REGISTRATION_PATTERN = /^[A-Z0-9][A-Z0-9\- ]{1,30}[A-Z0-9]$/;

/** Normalize registration for storage + uniqueness comparisons. */
export function normalizeRegistration(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}

export function assertValidRegistration(value: string): string {
  const normalized = normalizeRegistration(value);

  if (normalized.length < 3 || normalized.length > 32) {
    throw new Error("Registration number must be between 3 and 32 characters");
  }

  if (!REGISTRATION_PATTERN.test(normalized)) {
    throw new Error("Registration number format is invalid");
  }

  return normalized;
}
