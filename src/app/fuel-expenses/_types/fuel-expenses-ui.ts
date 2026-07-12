export type ExpenseCategoryOption = {
  code: string;
  id: string;
  name: string;
};

export type ExpenseFormState = {
  amountInr: string;
  description: string;
  expenseCategoryId: string;
  incurredOn: string;
  tripId: string;
  vehicleId: string;
};

export type FuelExpensesPageClientProps = {
  canWrite: boolean;
};

export type FuelFormState = {
  costInr: string;
  liters: string;
  loggedAt: string;
  notes: string;
  tripId: string;
  vehicleId: string;
};

export type FuelLogUi = {
  costInr: string;
  id: number;
  liters: string;
  loggedAt: string;
  notes: string | null;
  vehicleId: string;
  vehicleNameModel: string;
  vehicleRegistration: string;
};

export type OperationalSummaryUi = {
  expensesTotalInr: string;
  fuelEfficiencyKmPerL: string | null;
  fuelTotalInr: string;
  fuelTotalLiters: string;
  maintenanceTotalInr: string;
  operationalCostInr: string;
  totalDistanceKm: string;
};

export type OtherExpenseRowUi = {
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

export type TripOption = {
  destinationName: string;
  driverName: string;
  id: string;
  label: string;
  status: "dispatched" | "completed";
  tripDate: string;
  vehicleId: string;
  vehicleNameModel: string;
  vehicleRegistration: string;
};

export type VehicleOption = {
  id: string;
  nameModel: string;
  registrationNumber: string;
  status: "available" | "in_shop" | "on_trip" | "retired";
};
