import { moneyToFixed } from "@/modules/fuel-expenses/_lib/rules";
import type { OtherExpenseRow } from "@/modules/fuel-expenses/_types/fuel-expenses";

type VehicleSeed = {
  id: string;
  nameModel: string;
  registrationNumber: string;
  status: OtherExpenseRow["vehicleStatus"];
};

type ExpenseSeed = {
  amountInr: string;
  categoryCode: string;
  tripId: string | null;
  vehicleId: string;
};

type MaintSeed = {
  costInr: string;
  vehicleId: string;
};

/**
 * Pure rollup for Other Expenses board (ADR-045).
 * Toll/misc/fine from expenses; closed maintenance shown as MAINT. (LINKED).
 */
export function rollupOtherExpenseRows(
  vehicleRows: ReadonlyArray<VehicleSeed>,
  expenseRows: ReadonlyArray<ExpenseSeed>,
  maintRows: ReadonlyArray<MaintSeed>,
): OtherExpenseRow[] {
  const byVehicle = new Map<
    string,
    {
      fine: number;
      misc: number;
      toll: number;
      tripIds: Set<string>;
    }
  >();

  for (const row of expenseRows) {
    const bucket = byVehicle.get(row.vehicleId) ?? {
      fine: 0,
      misc: 0,
      toll: 0,
      tripIds: new Set<string>(),
    };
    const amount = Number(row.amountInr) || 0;
    const code = row.categoryCode.toUpperCase();

    if (code === "TOLL") {
      bucket.toll += amount;
    } else if (code === "FINE") {
      bucket.fine += amount;
    } else {
      bucket.misc += amount;
    }

    if (row.tripId) {
      bucket.tripIds.add(row.tripId);
    }

    byVehicle.set(row.vehicleId, bucket);
  }

  const maintByVehicle = new Map<string, number>();

  for (const row of maintRows) {
    const prev = maintByVehicle.get(row.vehicleId) ?? 0;
    maintByVehicle.set(row.vehicleId, prev + (Number(row.costInr) || 0));
  }

  const items: OtherExpenseRow[] = [];

  for (const vehicle of vehicleRows) {
    const expenseBucket = byVehicle.get(vehicle.id);
    const maintLinked = maintByVehicle.get(vehicle.id) ?? 0;
    const toll = expenseBucket?.toll ?? 0;
    const misc = expenseBucket?.misc ?? 0;
    const fine = expenseBucket?.fine ?? 0;

    if (toll + misc + fine + maintLinked <= 0) {
      continue;
    }

    const tripIds = expenseBucket ? [...expenseBucket.tripIds] : [];
    const tripLabel =
      tripIds.length === 0
        ? null
        : tripIds.length === 1
          ? `TR-${tripIds[0]!.slice(0, 4).toUpperCase()}`
          : `${tripIds.length} trips`;

    items.push({
      vehicleId: vehicle.id,
      vehicleRegistration: vehicle.registrationNumber,
      vehicleNameModel: vehicle.nameModel,
      vehicleStatus: vehicle.status,
      tripLabel,
      tollInr: moneyToFixed(toll),
      miscInr: moneyToFixed(misc),
      fineInr: moneyToFixed(fine),
      maintLinkedInr: moneyToFixed(maintLinked),
    });
  }

  return items;
}
