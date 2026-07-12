const LOCATION_CODE_PATTERN = /^[A-Z0-9_]+$/;

export function normalizeLocationCode(code: string): string {
  return code.trim().toUpperCase();
}

export function normalizeLocationName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function isValidLocationCode(code: string): boolean {
  return code.length >= 2 && code.length <= 32 && LOCATION_CODE_PATTERN.test(code);
}

export function isValidLocationName(name: string): boolean {
  return name.length >= 2 && name.length <= 160;
}
