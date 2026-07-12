export function formatInr(value: string | number, fractionDigits = 0): string {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: fractionDigits,
    style: "currency",
  }).format(amount);
}
