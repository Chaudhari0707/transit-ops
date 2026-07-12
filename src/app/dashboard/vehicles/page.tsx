import { and, asc, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";

import { VehiclesPageClient } from "@/app/dashboard/vehicles/_components/vehicles-page-client";
import type { VehicleTypeOption } from "@/app/dashboard/vehicles/_types/vehicles-ui";
import { auth } from "@/lib/auth/better-auth";
import type { UserRole } from "@/lib/auth/_types/roles";
import { getDb } from "@/lib/db/client";
import { vehicleTypes } from "@/lib/db/schema";
import {
  assertCanViewVehicles,
  canWriteVehicles,
} from "@/modules/vehicles/_lib/rbac";

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

function isUserRole(value: unknown): value is UserRole {
  return (
    value === "fleet_manager" ||
    value === "dispatcher" ||
    value === "safety_officer" ||
    value === "financial_analyst"
  );
}

export default async function VehiclesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user && "role" in session.user ? session.user.role : null;

  if (!session?.user || !isUserRole(role)) {
    return (
      <div className="px-4 py-10 lg:px-6">
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          Sign in as Fleet Manager, Dispatcher, or Financial Analyst to view the vehicle registry.
        </div>
      </div>
    );
  }

  try {
    assertCanViewVehicles(role);
  } catch {
    return (
      <div className="px-4 py-10 lg:px-6">
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          Your role does not have access to the vehicle registry.
        </div>
      </div>
    );
  }

  const types = await loadVehicleTypes();

  return <VehiclesPageClient vehicleTypes={types} canWrite={canWriteVehicles(role)} />;
}
