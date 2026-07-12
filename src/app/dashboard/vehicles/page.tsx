import { and, asc, eq, isNull } from "drizzle-orm";

import { VehiclesPageClient } from "@/app/dashboard/vehicles/_components/vehicles-page-client";
import type { VehicleTypeOption } from "@/app/dashboard/vehicles/_types/vehicles-ui";
import { AccessDenied } from "@/components/access-denied";
import { canAccessPageModule } from "@/lib/auth/_lib/sidebar-nav";
import { requirePageSession } from "@/lib/auth/require-page-session";
import { getDb } from "@/lib/db/client";
import { vehicleTypes } from "@/lib/db/schema";
import { canWriteVehicles } from "@/modules/vehicles/_lib/rbac";

async function loadVehicleTypes(): Promise<VehicleTypeOption[]> {
  const rows = await getDb()
    .select({
      id: vehicleTypes.id,
      code: vehicleTypes.code,
      name: vehicleTypes.name,
    })
    .from(vehicleTypes)
    .where(and(eq(vehicleTypes.isActive, true), isNull(vehicleTypes.deletedAt)))
    .orderBy(asc(vehicleTypes.name));

  return rows;
}

export default async function VehiclesPage() {
  // Layout already gates session; re-read for role RBAC.
  const { role } = await requirePageSession("/dashboard/vehicles");

  if (!canAccessPageModule(role, "vehicles")) {
    return (
      <AccessDenied description="The vehicle registry is available to Fleet Managers, Dispatchers, and Financial Analysts only." />
    );
  }

  const types = await loadVehicleTypes();

  return <VehiclesPageClient vehicleTypes={types} canWrite={canWriteVehicles(role)} />;
}
