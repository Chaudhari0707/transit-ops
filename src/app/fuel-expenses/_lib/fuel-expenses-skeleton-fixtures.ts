import type {
  FuelLogUi,
  OperationalSummaryUi,
  OtherExpenseRowUi,
} from "@/app/fuel-expenses/_types/fuel-expenses-ui";

/** Mock summary for boneyard-js CLI capture of `fuel-expenses-content`. */
export const FUEL_EXPENSES_FIXTURE_SUMMARY: OperationalSummaryUi = {
  fuelTotalInr: "185000",
  fuelTotalLiters: "2100",
  maintenanceTotalInr: "42000",
  expensesTotalInr: "15600",
  operationalCostInr: "227000",
  fuelEfficiencyKmPerL: "8.4",
  totalDistanceKm: "17640",
};

/** Mock fuel log rows for skeleton capture. */
export const FUEL_EXPENSES_FIXTURE_LOGS: FuelLogUi[] = [
  {
    id: 201,
    vehicleId: "veh-fixture-1",
    vehicleNameModel: "Force Traveller 3350",
    vehicleRegistration: "MH12AB1234",
    liters: "48.5",
    costInr: "4200",
    loggedAt: "2026-07-08T00:00:00.000Z",
    notes: "Full tank",
  },
  {
    id: 202,
    vehicleId: "veh-fixture-2",
    vehicleNameModel: "Tata Winger",
    vehicleRegistration: "MH14CD5678",
    liters: "36.0",
    costInr: "3100",
    loggedAt: "2026-07-07T00:00:00.000Z",
    notes: null,
  },
  {
    id: 203,
    vehicleId: "veh-fixture-3",
    vehicleNameModel: "Mahindra Bolero",
    vehicleRegistration: "MH12EF9012",
    liters: "42.2",
    costInr: "3650",
    loggedAt: "2026-07-06T00:00:00.000Z",
    notes: "Highway fill",
  },
];

/** Mock other-expense rows for skeleton capture. */
export const FUEL_EXPENSES_FIXTURE_OTHER: OtherExpenseRowUi[] = [
  {
    vehicleId: "veh-fixture-1",
    vehicleNameModel: "Force Traveller 3350",
    vehicleRegistration: "MH12AB1234",
    vehicleStatus: "available",
    tripLabel: "Pune → Nashik",
    tollInr: "480",
    miscInr: "200",
    fineInr: "0",
    maintLinkedInr: "4500",
  },
  {
    vehicleId: "veh-fixture-2",
    vehicleNameModel: "Tata Winger",
    vehicleRegistration: "MH14CD5678",
    vehicleStatus: "on_trip",
    tripLabel: "Mumbai → Pune",
    tollInr: "650",
    miscInr: "150",
    fineInr: "0",
    maintLinkedInr: "12800",
  },
  {
    vehicleId: "veh-fixture-3",
    vehicleNameModel: "Mahindra Bolero",
    vehicleRegistration: "MH12EF9012",
    vehicleStatus: "in_shop",
    tripLabel: null,
    tollInr: "0",
    miscInr: "75",
    fineInr: "0",
    maintLinkedInr: "6200",
  },
];
