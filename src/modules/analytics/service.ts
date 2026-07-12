import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";

import { requireSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { fuelLogs, maintenanceLogs, trips, vehicles } from "@/lib/db/schema";
import {
  assertAnalyticsReadRole,
  buildAnalyticsCsv,
  buildDemoMonthlyRevenueSeries,
  computeFleetUtilizationPercent,
  computeFuelEfficiencyKmPerL,
  computeOperationalCostInr,
  computeVehicleRoiPercent,
  efficiencyToFixed,
  moneyToFixed,
  percentToFixed,
  STATIC_DEMO_MONTHLY_REVENUE_INR,
} from "@/modules/analytics/_lib/rules";
import type {
  AnalyticsReport,
  AnalyticsSummary,
  CostliestVehicle,
} from "@/modules/analytics/_types/analytics";

const ROI_FORMULA = "ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost";

export abstract class AnalyticsService {
  static async getReport(headers: Headers): Promise<AnalyticsReport> {
    const actor = await requireSessionUser(headers);
    assertAnalyticsReadRole(actor.role);

    const db = getDb();

    const vehicleRows = await db
      .select({
        id: vehicles.id,
        registrationNumber: vehicles.registrationNumber,
        nameModel: vehicles.nameModel,
        status: vehicles.status,
        acquisitionCostInr: vehicles.acquisitionCostInr,
      })
      .from(vehicles)
      .where(isNull(vehicles.deletedAt));

    const [fuelAgg] = await db
      .select({
        totalCost: sql<string>`coalesce(sum(${fuelLogs.costInr}), 0)`,
        totalLiters: sql<string>`coalesce(sum(${fuelLogs.liters}), 0)`,
      })
      .from(fuelLogs);

    const [maintAgg] = await db
      .select({
        totalCost: sql<string>`coalesce(sum(${maintenanceLogs.costInr}), 0)`,
      })
      .from(maintenanceLogs);

    const [distanceAgg] = await db
      .select({
        totalDistance: sql<string>`coalesce(sum(${trips.actualDistanceKm}), 0)`,
      })
      .from(trips)
      .where(and(eq(trips.status, "completed"), isNull(trips.deletedAt)));

    const fuelByVehicle = await db
      .select({
        vehicleId: fuelLogs.vehicleId,
        totalCost: sql<string>`coalesce(sum(${fuelLogs.costInr}), 0)`,
      })
      .from(fuelLogs)
      .groupBy(fuelLogs.vehicleId);

    const maintByVehicle = await db
      .select({
        vehicleId: maintenanceLogs.vehicleId,
        totalCost: sql<string>`coalesce(sum(${maintenanceLogs.costInr}), 0)`,
      })
      .from(maintenanceLogs)
      .groupBy(maintenanceLogs.vehicleId);

    const fuelCostMap = new Map(
      fuelByVehicle.map((row) => [row.vehicleId, Number(row.totalCost) || 0]),
    );
    const maintCostMap = new Map(
      maintByVehicle.map((row) => [row.vehicleId, Number(row.totalCost) || 0]),
    );

    let available = 0;
    let onTrip = 0;
    let inShop = 0;
    let retired = 0;
    let totalAcquisition = 0;

    const costliestCandidates: CostliestVehicle[] = [];

    for (const vehicle of vehicleRows) {
      if (vehicle.status === "available") available += 1;
      else if (vehicle.status === "on_trip") onTrip += 1;
      else if (vehicle.status === "in_shop") inShop += 1;
      else if (vehicle.status === "retired") retired += 1;

      const acquisition = Number(vehicle.acquisitionCostInr) || 0;
      if (vehicle.status !== "retired") {
        totalAcquisition += acquisition;
      }

      const fuelCost = fuelCostMap.get(vehicle.id) ?? 0;
      const maintCost = maintCostMap.get(vehicle.id) ?? 0;
      const opCost = computeOperationalCostInr(fuelCost, maintCost);

      if (opCost > 0) {
        costliestCandidates.push({
          vehicleId: vehicle.id,
          vehicleRegistration: vehicle.registrationNumber,
          vehicleNameModel: vehicle.nameModel,
          fuelCostInr: moneyToFixed(fuelCost),
          maintenanceCostInr: moneyToFixed(maintCost),
          operationalCostInr: moneyToFixed(opCost),
          acquisitionCostInr: moneyToFixed(acquisition),
        });
      }
    }

    costliestCandidates.sort((a, b) => Number(b.operationalCostInr) - Number(a.operationalCostInr));
    const costliestVehicles = costliestCandidates.slice(0, 5);

    const fuelTotal = Number(fuelAgg?.totalCost ?? 0);
    const fuelLiters = Number(fuelAgg?.totalLiters ?? 0);
    const maintenanceTotal = Number(maintAgg?.totalCost ?? 0);
    const totalDistance = Number(distanceAgg?.totalDistance ?? 0);
    const operationalCost = computeOperationalCostInr(fuelTotal, maintenanceTotal);
    const utilization = computeFleetUtilizationPercent({ available, onTrip, inShop });
    const efficiency = computeFuelEfficiencyKmPerL(totalDistance, fuelLiters);
    const roi = computeVehicleRoiPercent({
      revenueInr: STATIC_DEMO_MONTHLY_REVENUE_INR,
      fuelCostInr: fuelTotal,
      maintenanceCostInr: maintenanceTotal,
      acquisitionCostInr: totalAcquisition,
    });

    const summary: AnalyticsSummary = {
      fleetUtilizationPercent: percentToFixed(utilization),
      fuelEfficiencyKmPerL: efficiencyToFixed(efficiency),
      fuelTotalInr: moneyToFixed(fuelTotal),
      fuelTotalLiters: moneyToFixed(fuelLiters),
      maintenanceTotalInr: moneyToFixed(maintenanceTotal),
      monthlyRevenueInr: moneyToFixed(STATIC_DEMO_MONTHLY_REVENUE_INR),
      operationalCostInr: moneyToFixed(operationalCost),
      roiFormula: ROI_FORMULA,
      totalAcquisitionCostInr: moneyToFixed(totalAcquisition),
      totalDistanceKm: moneyToFixed(totalDistance),
      vehicleCounts: { available, inShop, onTrip, retired },
      vehicleRoiPercent: roi === null ? null : percentToFixed(roi),
    };

    return {
      costliestVehicles,
      monthlyRevenue: buildDemoMonthlyRevenueSeries(STATIC_DEMO_MONTHLY_REVENUE_INR),
      summary,
    };
  }

  static async getSummary(headers: Headers): Promise<AnalyticsSummary> {
    const report = await this.getReport(headers);
    return report.summary;
  }

  static async exportCsv(headers: Headers): Promise<{ csv: string; filename: string }> {
    const report = await this.getReport(headers);
    const csv = buildAnalyticsCsv({
      fuelEfficiencyKmPerL: report.summary.fuelEfficiencyKmPerL,
      fleetUtilizationPercent: report.summary.fleetUtilizationPercent,
      operationalCostInr: report.summary.operationalCostInr,
      vehicleRoiPercent: report.summary.vehicleRoiPercent,
      costliest: report.costliestVehicles,
    });

    const day = new Date().toISOString().slice(0, 10);
    return {
      csv,
      filename: `transitops-analytics-${day}.csv`,
    };
  }
}
