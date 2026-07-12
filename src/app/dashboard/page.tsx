import { headers } from "next/headers";
import { and, asc, eq, isNull } from "drizzle-orm";

import { DashboardPageClient } from "@/app/dashboard/_components/dashboard-page-client";
import type {
  DashboardKpisView,
  RecentTripView,
  VehicleTypeOption,
} from "@/app/dashboard/_types/dashboard-ui";
import { requirePageSession } from "@/lib/auth/require-page-session";
import { getDb } from "@/lib/db/client";
import { vehicleTypes } from "@/lib/db/schema";
import { RECENT_TRIPS_DEFAULT_LIMIT } from "@/modules/dashboard/_lib/trip-display";
import { DashboardService } from "@/modules/dashboard/service";

const EMPTY_KPIS: DashboardKpisView = {
  activeTrips: 0,
  activeVehicles: 0,
  availableVehicles: 0,
  driversOnDuty: 0,
  fleetUtilizationPercent: 0,
  pendingTrips: 0,
  vehiclesInMaintenance: 0,
  vehicleStatus: {
    available: 0,
    in_shop: 0,
    on_trip: 0,
    retired: 0,
  },
};

async function loadVehicleTypes(): Promise<VehicleTypeOption[]> {
  return getDb()
    .select({
      id: vehicleTypes.id,
      code: vehicleTypes.code,
      name: vehicleTypes.name,
    })
    .from(vehicleTypes)
    .where(and(eq(vehicleTypes.isActive, true), isNull(vehicleTypes.deletedAt)))
    .orderBy(asc(vehicleTypes.name));
}

export default async function DashboardPage() {
  // Layout already gates the shell; re-check so page data never loads unauthenticated.
  await requirePageSession("/dashboard");
  const requestHeaders = await headers();

  let initialKpis: DashboardKpisView = EMPTY_KPIS;
  let initialTrips: RecentTripView[] = [];
  let types: VehicleTypeOption[] = [];

  try {
    const [kpis, tripsResult, vehicleTypeRows] = await Promise.all([
      DashboardService.getKpis(requestHeaders),
      DashboardService.listRecentTrips(requestHeaders, { limit: RECENT_TRIPS_DEFAULT_LIMIT }),
      loadVehicleTypes(),
    ]);

    initialKpis = kpis;
    initialTrips = tripsResult.trips;
    types = vehicleTypeRows;
  } catch {
    types = await loadVehicleTypes().catch(() => []);
  }

  return (
    <DashboardPageClient
      initialKpis={initialKpis}
      initialTrips={initialTrips}
      vehicleTypes={types}
    />
  );
}
