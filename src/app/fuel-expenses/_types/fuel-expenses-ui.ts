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
  fuelTotalInr: string;
  maintenanceTotalInr: string;
  operationalCostInr: string;
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

export type VehicleOption = {
  id: string;
  nameModel: string;
  registrationNumber: string;
  status: "available" | "in_shop" | "on_trip" | "retired";
};
