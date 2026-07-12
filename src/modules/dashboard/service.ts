import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";

import type { SessionUser } from "@/lib/api/_types/session";
import { requireAnyRole, requireUser } from "@/lib/api/session";
import { USER_ROLES } from "@/lib/auth/_types/user-role";
import { getDb } from "@/lib/db/client";
import { drivers, trips, vehicles } from "@/lib/db/schema";
import { formatTripEtaLabel } from "@/modules/dashboard/_lib/eta";
import {
  buildDashboardKpis,
  emptyTripStatusCounts,
  emptyVehicleStatusCounts,
} from "@/modules/dashboard/_lib/kpi-rules";
import { clampRecentTripsLimit, formatTripCode } from "@/modules/dashboard/_lib/trip-display";
import type {
  DashboardKpis,
  RecentTripRow,
  RecentTripsFilters,
  TripStatus,
  TripStatusCounts,
  VehicleStatus,
  VehicleStatusCounts,
} from "@/modules/dashboard/_types/dashboard";

/** ADR-031: all authenticated roles can read dashboard KPIs. */
const DASHBOARD_READ_ROLES = USER_ROLES;

async function requireDashboardReader(headers: Headers): Promise<SessionUser> {
  const actor = await requireUser(headers);
  requireAnyRole(actor, DASHBOARD_READ_ROLES);
  return actor;
}

function parseCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export abstract class DashboardService {
  static async getKpis(headers: Headers): Promise<DashboardKpis> {
    await requireDashboardReader(headers);
    const db = getDb();

    const vehicleRows = await db
      .select({
        status: vehicles.status,
        count: sql<number>`count(*)::int`,
      })
      .from(vehicles)
      .where(isNull(vehicles.deletedAt))
      .groupBy(vehicles.status);

    const vehicleCounts: VehicleStatusCounts = emptyVehicleStatusCounts();

    for (const row of vehicleRows) {
      const status = row.status as VehicleStatus;

      if (status in vehicleCounts) {
        vehicleCounts[status] = parseCount(row.count);
      }
    }

    const tripRows = await db
      .select({
        status: trips.status,
        count: sql<number>`count(*)::int`,
      })
      .from(trips)
      .where(isNull(trips.deletedAt))
      .groupBy(trips.status);

    const tripCounts: TripStatusCounts = emptyTripStatusCounts();

    for (const row of tripRows) {
      const status = row.status as TripStatus;

      if (status in tripCounts) {
        tripCounts[status] = parseCount(row.count);
      }
    }

    const [driverOnDutyRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(drivers)
      .where(and(isNull(drivers.deletedAt), eq(drivers.status, "on_trip")));

    return buildDashboardKpis({
      driversOnDuty: parseCount(driverOnDutyRow?.count),
      tripCounts,
      vehicleCounts,
    });
  }

  static async listRecentTrips(
    headers: Headers,
    filters: RecentTripsFilters,
  ): Promise<{ trips: RecentTripRow[] }> {
    await requireDashboardReader(headers);

    const limit = clampRecentTripsLimit(filters.limit);
    const conditions = [
      isNull(trips.deletedAt),
      isNull(vehicles.deletedAt),
      isNull(drivers.deletedAt),
    ];

    if (filters.status) {
      conditions.push(eq(trips.status, filters.status));
    }

    if (filters.vehicleTypeId) {
      conditions.push(eq(vehicles.vehicleTypeId, filters.vehicleTypeId));
    }

    const rows = await getDb()
      .select({
        driverName: drivers.fullName,
        id: trips.id,
        plannedDistanceKm: trips.plannedDistanceKm,
        status: trips.status,
        vehicleName: vehicles.nameModel,
      })
      .from(trips)
      .innerJoin(vehicles, eq(trips.vehicleId, vehicles.id))
      .innerJoin(drivers, eq(trips.driverId, drivers.id))
      .where(and(...conditions))
      .orderBy(desc(trips.createdAt))
      .limit(limit);

    return {
      trips: rows.map((row) => {
        const status = row.status as TripStatus;
        const planned = Number(row.plannedDistanceKm);

        return {
          driverName: row.driverName,
          etaLabel: formatTripEtaLabel(status, planned),
          id: row.id,
          status,
          tripCode: formatTripCode(row.id),
          vehicleName: row.vehicleName,
        };
      }),
    };
  }
}
