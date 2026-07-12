import type {
  VehicleListItem,
  VehicleStatus,
} from "@/app/dashboard/vehicles/_types/vehicles-ui";
import { parseApiError } from "@/app/dashboard/vehicles/_lib/vehicle-helpers";

type ListResponse = { items: VehicleListItem[] };
type ErrorBody = { message?: string };

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchVehicles(filters: {
  vehicleTypeId?: string;
  status?: VehicleStatus | "all";
}): Promise<VehicleListItem[]> {
  const params = new URLSearchParams();

  if (filters.vehicleTypeId && filters.vehicleTypeId !== "all") {
    params.set("vehicleTypeId", filters.vehicleTypeId);
  }

  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }

  const query = params.toString();
  const response = await fetch(`/api/vehicles${query ? `?${query}` : ""}`, {
    credentials: "include",
    headers: { Origin: window.location.origin },
  });
  const body = await readJson(response);

  if (!response.ok) {
    throw new Error(parseApiError(body, "Unable to load vehicles"));
  }

  return (body as ListResponse).items;
}

export async function createVehicle(payload: Record<string, unknown>): Promise<VehicleListItem> {
  const response = await fetch("/api/vehicles", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Origin: window.location.origin,
    },
    body: JSON.stringify(payload),
  });
  const body = await readJson(response);

  if (!response.ok) {
    throw new Error(parseApiError(body as ErrorBody, "Unable to create vehicle"));
  }

  return body as VehicleListItem;
}

export async function updateVehicle(
  id: string,
  payload: Record<string, unknown>,
): Promise<VehicleListItem> {
  const response = await fetch(`/api/vehicles/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Origin: window.location.origin,
    },
    body: JSON.stringify(payload),
  });
  const body = await readJson(response);

  if (!response.ok) {
    throw new Error(parseApiError(body as ErrorBody, "Unable to update vehicle"));
  }

  return body as VehicleListItem;
}

export async function retireVehicle(id: string): Promise<VehicleListItem> {
  return updateVehicle(id, { status: "retired" });
}

export async function softDeleteVehicle(id: string): Promise<void> {
  const response = await fetch(`/api/vehicles/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: { Origin: window.location.origin },
  });
  const body = await readJson(response);

  if (!response.ok) {
    throw new Error(parseApiError(body as ErrorBody, "Unable to delete vehicle"));
  }
}
