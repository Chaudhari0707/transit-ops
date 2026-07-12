import type {
  MaintenanceFormState,
  MaintenanceLogUi,
  MaintenanceTypeOption,
  MaintenanceVehicleOption,
} from "@/app/maintenance/_types/maintenance-ui";

type ApiErrorBody = {
  message?: string;
};

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

export async function fetchMaintenanceLogs(): Promise<MaintenanceLogUi[]> {
  const response = await fetch("/api/maintenance", { credentials: "include" });
  const data = await parseJson<{ items: MaintenanceLogUi[] }>(response);
  return data.items;
}

export async function fetchMaintenanceTypes(): Promise<MaintenanceTypeOption[]> {
  const response = await fetch("/api/maintenance/types", { credentials: "include" });
  const data = await parseJson<{ items: MaintenanceTypeOption[] }>(response);
  return data.items;
}

export async function fetchOpenableVehicles(): Promise<MaintenanceVehicleOption[]> {
  const response = await fetch("/api/maintenance/vehicles?forOpen=true", {
    credentials: "include",
  });
  const data = await parseJson<{ items: MaintenanceVehicleOption[] }>(response);
  return data.items;
}

export async function openMaintenanceLog(form: MaintenanceFormState): Promise<MaintenanceLogUi> {
  const cost = form.costInr.trim() === "" ? 0 : Number(form.costInr);

  const response = await fetch("/api/maintenance", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicleId: form.vehicleId,
      maintenanceTypeId: form.maintenanceTypeId,
      costInr: Number.isFinite(cost) ? cost : 0,
      customServiceType: form.customServiceType.trim() || null,
      description: form.description.trim() || null,
      vendorName: form.vendorName.trim() || null,
    }),
  });

  const data = await parseJson<{ log: MaintenanceLogUi }>(response);
  return data.log;
}

export async function closeMaintenanceLog(id: number): Promise<MaintenanceLogUi> {
  const response = await fetch(`/api/maintenance/${id}/close`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const data = await parseJson<{ log: MaintenanceLogUi }>(response);
  return data.log;
}

export async function signInFleetManager(email: string, password: string): Promise<void> {
  const response = await fetch("/api/auth/sign-in", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, password }),
  });

  if (!response.ok) {
    throw new Error("Sign-in failed. Use fleet_manager credentials from seed.");
  }
}
