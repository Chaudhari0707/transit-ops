import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";

import { requireSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { expenses, fuelLogs, maintenanceLogs, revenueLogs, trips, vehicles } from "@/lib/db/schema";
import {
  assertAnalyticsReadRole,
  buildAnalyticsCsv,
  buildDemoMonthlyRevenueSeries,
  buildMonthlyRevenueSeriesFromLogs,
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
  VehicleRoiRow,
} from "@/modules/analytics/_types/analytics";

const ROI_FORMULA = "ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost";

export abstract class AnalyticsService {
  static async getReport(headers: Headers): Promise<AnalyticsReport> {
    const actor = await requireSessionUser(headers);
    assertAnalyticsReadRole(actor.role);

    const db = getDb();

    const vehicleRows = await db
      .select({
        acquisitionCostInr: vehicles.acquisitionCostInr,
        id: vehicles.id,
        nameModel: vehicles.nameModel,
        registrationNumber: vehicles.registrationNumber,
        status: vehicles.status,
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

    const [expenseAgg] = await db
      .select({
        total: sql<string>`coalesce(sum(${expenses.amountInr}), 0)`,
      })
      .from(expenses);

    const [distanceAgg] = await db
      .select({
        totalDistance: sql<string>`coalesce(sum(${trips.actualDistanceKm}), 0)`,
      })
      .from(trips)
      .where(and(eq(trips.status, "completed"), isNull(trips.deletedAt)));

    const tripStatusRows = await db
      .select({
        count: sql<number>`count(*)::int`,
        status: trips.status,
      })
      .from(trips)
      .where(isNull(trips.deletedAt))
      .groupBy(trips.status);

    const revenueRows = await db
      .select({
        amountInr: revenueLogs.amountInr,
        earnedOn: revenueLogs.earnedOn,
        vehicleId: revenueLogs.vehicleId,
      })
      .from(revenueLogs)
      .innerJoin(trips, eq(revenueLogs.tripId, trips.id))
      .where(isNull(trips.deletedAt));

    const [revenueAgg] = await db
      .select({
        total: sql<string>`coalesce(sum(${revenueLogs.amountInr}), 0)`,
      })
      .from(revenueLogs)
      .innerJoin(trips, eq(revenueLogs.tripId, trips.id))
      .where(isNull(trips.deletedAt));

    const fuelByVehicle = await db
      .select({
        totalCost: sql<string>`coalesce(sum(${fuelLogs.costInr}), 0)`,
        vehicleId: fuelLogs.vehicleId,
      })
      .from(fuelLogs)
      .groupBy(fuelLogs.vehicleId);

    const maintByVehicle = await db
      .select({
        totalCost: sql<string>`coalesce(sum(${maintenanceLogs.costInr}), 0)`,
        vehicleId: maintenanceLogs.vehicleId,
      })
      .from(maintenanceLogs)
      .groupBy(maintenanceLogs.vehicleId);

    const fuelCostMap = new Map(
      fuelByVehicle.map((row) => [row.vehicleId, Number(row.totalCost) || 0]),
    );
    const maintCostMap = new Map(
      maintByVehicle.map((row) => [row.vehicleId, Number(row.totalCost) || 0]),
    );
    const revenueByVehicle = new Map<string, number>();

    for (const row of revenueRows) {
      const amount = Number(row.amountInr) || 0;
      revenueByVehicle.set(row.vehicleId, (revenueByVehicle.get(row.vehicleId) ?? 0) + amount);
    }

    let available = 0;
    let onTrip = 0;
    let inShop = 0;
    let retired = 0;
    let totalAcquisition = 0;

    const costliestCandidates: CostliestVehicle[] = [];
    const vehicleRoiTable: VehicleRoiRow[] = [];

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
      const vehicleRevenue = revenueByVehicle.get(vehicle.id) ?? 0;
      const vehicleRoi = computeVehicleRoiPercent({
        acquisitionCostInr: acquisition,
        fuelCostInr: fuelCost,
        maintenanceCostInr: maintCost,
        revenueInr: vehicleRevenue,
      });

      if (opCost > 0 || vehicleRevenue > 0) {
        vehicleRoiTable.push({
          acquisitionCostInr: moneyToFixed(acquisition),
          fuelCostInr: moneyToFixed(fuelCost),
          maintenanceCostInr: moneyToFixed(maintCost),
          netInr: moneyToFixed(vehicleRevenue - opCost),
          operationalCostInr: moneyToFixed(opCost),
          revenueInr: moneyToFixed(vehicleRevenue),
          roiPercent: vehicleRoi === null ? null : percentToFixed(vehicleRoi),
          vehicleId: vehicle.id,
          vehicleNameModel: vehicle.nameModel,
          vehicleRegistration: vehicle.registrationNumber,
        });
      }

      if (opCost > 0) {
        costliestCandidates.push({
          acquisitionCostInr: moneyToFixed(acquisition),
          fuelCostInr: moneyToFixed(fuelCost),
          maintenanceCostInr: moneyToFixed(maintCost),
          operationalCostInr: moneyToFixed(opCost),
          vehicleId: vehicle.id,
          vehicleNameModel: vehicle.nameModel,
          vehicleRegistration: vehicle.registrationNumber,
        });
      }
    }

    costliestCandidates.sort((a, b) => Number(b.operationalCostInr) - Number(a.operationalCostInr));
    vehicleRoiTable.sort((a, b) => {
      const aRoi = a.roiPercent === null ? Number.NEGATIVE_INFINITY : Number(a.roiPercent);
      const bRoi = b.roiPercent === null ? Number.NEGATIVE_INFINITY : Number(b.roiPercent);
      return bRoi - aRoi;
    });

    const costliestVehicles = costliestCandidates.slice(0, 5);

    const fuelTotal = Number(fuelAgg?.totalCost ?? 0);
    const fuelLiters = Number(fuelAgg?.totalLiters ?? 0);
    const maintenanceTotal = Number(maintAgg?.totalCost ?? 0);
    const expensesTotal = Number(expenseAgg?.total ?? 0);
    const totalDistance = Number(distanceAgg?.totalDistance ?? 0);
    const totalRevenue = Number(revenueAgg?.total ?? 0);
    const operationalCost = computeOperationalCostInr(fuelTotal, maintenanceTotal);
    const utilization = computeFleetUtilizationPercent({ available, inShop, onTrip });
    const efficiency = computeFuelEfficiencyKmPerL(totalDistance, fuelLiters);
    const revenueForRoi = totalRevenue > 0 ? totalRevenue : STATIC_DEMO_MONTHLY_REVENUE_INR;
    const roi = computeVehicleRoiPercent({
      acquisitionCostInr: totalAcquisition,
      fuelCostInr: fuelTotal,
      maintenanceCostInr: maintenanceTotal,
      revenueInr: revenueForRoi,
    });

    const monthlyRevenue =
      revenueRows.length > 0
        ? buildMonthlyRevenueSeriesFromLogs(revenueRows)
        : buildDemoMonthlyRevenueSeries(STATIC_DEMO_MONTHLY_REVENUE_INR);

    let draft = 0;
    let dispatched = 0;
    let completed = 0;
    let cancelled = 0;

    for (const row of tripStatusRows) {
      const count = Number(row.count) || 0;
      if (row.status === "draft") draft = count;
      else if (row.status === "dispatched") dispatched = count;
      else if (row.status === "completed") completed = count;
      else if (row.status === "cancelled") cancelled = count;
    }

    const summary: AnalyticsSummary = {
      expensesTotalInr: moneyToFixed(expensesTotal),
      fleetUtilizationPercent: percentToFixed(utilization),
      fuelEfficiencyKmPerL: efficiencyToFixed(efficiency),
      fuelTotalInr: moneyToFixed(fuelTotal),
      fuelTotalLiters: moneyToFixed(fuelLiters),
      maintenanceTotalInr: moneyToFixed(maintenanceTotal),
      monthlyRevenueInr: moneyToFixed(
        totalRevenue > 0 ? totalRevenue : STATIC_DEMO_MONTHLY_REVENUE_INR,
      ),
      netMarginInr: moneyToFixed(revenueForRoi - operationalCost),
      operationalCostInr: moneyToFixed(operationalCost),
      roiFormula: ROI_FORMULA,
      totalAcquisitionCostInr: moneyToFixed(totalAcquisition),
      totalDistanceKm: moneyToFixed(totalDistance),
      vehicleCounts: { available, inShop, onTrip, retired },
      vehicleRoiPercent: roi === null ? null : percentToFixed(roi),
    };

    return {
      costBreakdown: {
        expensesTotalInr: moneyToFixed(expensesTotal),
        fuelTotalInr: moneyToFixed(fuelTotal),
        maintenanceTotalInr: moneyToFixed(maintenanceTotal),
        operationalCostInr: moneyToFixed(operationalCost),
      },
      costliestVehicles,
      monthlyRevenue,
      summary,
      tripCounts: {
        cancelled,
        completed,
        dispatched,
        draft,
        total: draft + dispatched + completed + cancelled,
      },
      vehicleRoiTable,
    };
  }

  static async getSummary(headers: Headers): Promise<AnalyticsSummary> {
    const report = await this.getReport(headers);
    return report.summary;
  }

  static async exportCsv(headers: Headers): Promise<{ csv: string; filename: string }> {
    const report = await this.getReport(headers);
    const csv = buildAnalyticsCsv({
      costliest: report.costliestVehicles,
      fleetUtilizationPercent: report.summary.fleetUtilizationPercent,
      fuelEfficiencyKmPerL: report.summary.fuelEfficiencyKmPerL,
      operationalCostInr: report.summary.operationalCostInr,
      vehicleRoiPercent: report.summary.vehicleRoiPercent,
    });

    const day = new Date().toISOString().slice(0, 10);
    return {
      csv,
      filename: `transitops-analytics-${day}.csv`,
    };
  }
}
