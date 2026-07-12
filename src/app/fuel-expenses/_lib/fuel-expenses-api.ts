import type {
  ExpenseCategoryOption,
  ExpenseFormState,
  FuelFormState,
  FuelLogUi,
  OperationalSummaryUi,
  OtherExpenseRowUi,
  TripOption,
  VehicleOption,
} from "@/app/fuel-expenses/_types/fuel-expenses-ui";

type ApiErrorBody = { message?: string };

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T | ApiErrorBody;

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return body as T;
}

export async function fetchFuelLogs(): Promise<FuelLogUi[]> {
  const response = await fetch("/api/fuel-expenses/fuel-logs", { credentials: "include" });
  const data = await parseJson<{ items: FuelLogUi[] }>(response);
  return data.items;
}

export async function fetchOtherExpenses(): Promise<OtherExpenseRowUi[]> {
  const response = await fetch("/api/fuel-expenses/other-expenses", { credentials: "include" });
  const data = await parseJson<{ items: OtherExpenseRowUi[] }>(response);
  return data.items;
}

export async function fetchSummary(): Promise<OperationalSummaryUi> {
  const response = await fetch("/api/fuel-expenses/summary", { credentials: "include" });
  return parseJson<OperationalSummaryUi>(response);
}

export async function fetchCategories(): Promise<ExpenseCategoryOption[]> {
  const response = await fetch("/api/fuel-expenses/categories", { credentials: "include" });
  const data = await parseJson<{ items: ExpenseCategoryOption[] }>(response);
  return data.items;
}

export async function fetchVehicles(): Promise<VehicleOption[]> {
  const response = await fetch("/api/fuel-expenses/vehicles", { credentials: "include" });
  const data = await parseJson<{ items: VehicleOption[] }>(response);
  return data.items;
}

export async function fetchTripOptions(): Promise<TripOption[]> {
  const response = await fetch("/api/fuel-expenses/trips", { credentials: "include" });
  const data = await parseJson<{ items: TripOption[] }>(response);
  return data.items;
}

export async function createFuelLog(form: FuelFormState): Promise<void> {
  const response = await fetch("/api/fuel-expenses/fuel-logs", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicleId: form.vehicleId,
      tripId: form.tripId.trim() || null,
      liters: Number(form.liters),
      costInr: Number(form.costInr),
      loggedAt: form.loggedAt,
      notes: form.notes.trim() || null,
    }),
  });
  await parseJson(response);
}

export async function createExpense(form: ExpenseFormState): Promise<void> {
  const response = await fetch("/api/fuel-expenses/expenses", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicleId: form.vehicleId,
      expenseCategoryId: form.expenseCategoryId,
      tripId: form.tripId.trim() || null,
      amountInr: Number(form.amountInr),
      incurredOn: form.incurredOn,
      description: form.description.trim() || null,
    }),
  });
  await parseJson(response);
}
