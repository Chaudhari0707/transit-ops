export type CreateExpenseInput = {
  amountInr: number | string;
  description?: string | null;
  expenseCategoryId: string;
  incurredOn: string;
  tripId?: string | null;
  vehicleId: string;
};

export type CreateFuelLogInput = {
  costInr: number | string;
  liters: number | string;
  loggedAt: string;
  notes?: string | null;
  tripId?: string | null;
  vehicleId: string;
};

export type ExpenseListItem = {
  amountInr: string;
  categoryCode: string;
  categoryId: string;
  categoryName: string;
  description: string | null;
  id: number;
  incurredOn: string;
  tripId: string | null;
  vehicleId: string;
  vehicleNameModel: string;
  vehicleRegistration: string;
};

export type FuelLogListItem = {
  costInr: string;
  id: number;
  liters: string;
  loggedAt: string;
  notes: string | null;
  tripId: string | null;
  vehicleId: string;
  vehicleNameModel: string;
  vehicleRegistration: string;
};

export type OperationalSummary = {
  expensesTotalInr: string;
  fuelEfficiencyKmPerL: string | null;
  fuelTotalInr: string;
  fuelTotalLiters: string;
  maintenanceTotalInr: string;
  operationalCostInr: string;
  totalDistanceKm: string;
};

/** Other-expenses row: toll/misc + closed maintenance linked (not stored as expense). */
export type OtherExpenseRow = {
  fineInr: string;
  maintLinkedInr: string;
  miscInr: string;
  tollInr: string;
  tripLabel: string | null;
  vehicleId: string;
  vehicleNameModel: string;
  vehicleRegistration: string;
  vehicleStatus: "available" | "in_shop" | "on_trip" | "retired";
};
