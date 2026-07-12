export function assertPositiveCapacity(kg: number): void {
  if (!Number.isFinite(kg) || kg <= 0) {
    throw new Error("Max load capacity must be greater than 0");
  }
}

export function assertNonNegativeOdometer(km: number): void {
  if (!Number.isFinite(km) || km < 0) {
    throw new Error("Odometer must be greater than or equal to 0");
  }
}

export function assertNonNegativeCost(amount: number): void {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Acquisition cost must be greater than or equal to 0");
  }
}

export function toNumericString(value: number, scale: number): string {
  return value.toFixed(scale);
}

export function parseNumericString(value: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error("Invalid numeric value");
  }

  return parsed;
}
