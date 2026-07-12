import type {
  DashboardKpisView,
  RecentTripView,
  TripStatusFilter,
} from "@/app/dashboard/_types/dashboard-ui";
import { RECENT_TRIPS_DEFAULT_LIMIT } from "@/modules/dashboard/_lib/trip-display";

type ErrorBody = { message?: string };

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function parseApiError(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as ErrorBody).message;

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

export async function fetchDashboardKpis(): Promise<DashboardKpisView> {
  const response = await fetch("/api/dashboard/kpis", {
    credentials: "include",
    headers: { Origin: window.location.origin },
  });
  const body = await readJson(response);

  if (!response.ok) {
    throw new Error(parseApiError(body, "Unable to load dashboard KPIs"));
  }

  return body as DashboardKpisView;
}

export async function fetchRecentTrips(filters: {
  status: TripStatusFilter;
  vehicleTypeId: string;
}): Promise<RecentTripView[]> {
  const params = new URLSearchParams();

  if (filters.vehicleTypeId && filters.vehicleTypeId !== "all") {
    params.set("vehicleTypeId", filters.vehicleTypeId);
  }

  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }

  params.set("limit", String(RECENT_TRIPS_DEFAULT_LIMIT));

  const query = params.toString();
  const response = await fetch(`/api/dashboard/recent-trips?${query}`, {
    credentials: "include",
    headers: { Origin: window.location.origin },
  });
  const body = await readJson(response);

  if (!response.ok) {
    throw new Error(parseApiError(body, "Unable to load recent trips"));
  }

  return (body as { trips: RecentTripView[] }).trips;
}
