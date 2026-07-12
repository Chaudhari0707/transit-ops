import { headers } from "next/headers";
import { and, asc, eq, isNull } from "drizzle-orm";

import { DashboardPageClient } from "@/app/dashboard/_components/dashboard-page-client";
import type {
  DashboardKpisView,
  RecentTripView,
  VehicleTypeOption,
} from "@/app/dashboard/_types/dashboard-ui";
import { isUserRole } from "@/lib/auth/_types/user-role";
import { auth } from "@/lib/auth/better-auth";
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
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const role = session?.user && "role" in session.user ? session.user.role : null;

  if (!session?.user || !isUserRole(role)) {
    return (
      <div className="px-4 py-10 lg:px-6">
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          Sign in to view the operations dashboard.
        </div>
      </div>
    );
  }

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
