import { t } from "elysia";

const vehicleStatus = t.Union([
  t.Literal("available"),
  t.Literal("on_trip"),
  t.Literal("in_shop"),
  t.Literal("retired"),
]);

const fuelLog = t.Object({
  id: t.Number(),
  vehicleId: t.String({ format: "uuid" }),
  vehicleRegistration: t.String(),
  vehicleNameModel: t.String(),
  tripId: t.Union([t.String({ format: "uuid" }), t.Null()]),
  liters: t.String(),
  costInr: t.String(),
  loggedAt: t.String(),
  notes: t.Union([t.String(), t.Null()]),
});

const expenseItem = t.Object({
  id: t.Number(),
  vehicleId: t.String({ format: "uuid" }),
  vehicleRegistration: t.String(),
  vehicleNameModel: t.String(),
  categoryId: t.String({ format: "uuid" }),
  categoryCode: t.String(),
  categoryName: t.String(),
  tripId: t.Union([t.String({ format: "uuid" }), t.Null()]),
  amountInr: t.String(),
  incurredOn: t.String(),
  description: t.Union([t.String(), t.Null()]),
});

const otherExpenseRow = t.Object({
  vehicleId: t.String({ format: "uuid" }),
  vehicleRegistration: t.String(),
  vehicleNameModel: t.String(),
  vehicleStatus,
  tripLabel: t.Union([t.String(), t.Null()]),
  tollInr: t.String(),
  miscInr: t.String(),
  fineInr: t.String(),
  maintLinkedInr: t.String(),
});

export const FuelExpensesModel = {
  errorResponse: t.Object({
    message: t.String(),
  }),
  fuelListResponse: t.Object({
    items: t.Array(fuelLog),
  }),
  fuelCreateBody: t.Object({
    vehicleId: t.String({ format: "uuid" }),
    tripId: t.Optional(t.Union([t.String({ format: "uuid" }), t.Null()])),
    liters: t.Number({ minimum: 0.001 }),
    costInr: t.Number({ minimum: 0 }),
    loggedAt: t.String({ minLength: 10, maxLength: 10 }),
    notes: t.Optional(t.Union([t.String(), t.Null()])),
  }),
  fuelCreateResponse: t.Object({
    log: fuelLog,
  }),
  expenseListResponse: t.Object({
    items: t.Array(expenseItem),
  }),
  expenseCreateBody: t.Object({
    vehicleId: t.String({ format: "uuid" }),
    expenseCategoryId: t.String({ format: "uuid" }),
    tripId: t.Optional(t.Union([t.String({ format: "uuid" }), t.Null()])),
    amountInr: t.Number({ minimum: 0.01 }),
    incurredOn: t.String({ minLength: 10, maxLength: 10 }),
    description: t.Optional(t.Union([t.String(), t.Null()])),
  }),
  expenseCreateResponse: t.Object({
    expense: expenseItem,
  }),
  otherExpensesResponse: t.Object({
    items: t.Array(otherExpenseRow),
  }),
  summaryResponse: t.Object({
    expensesTotalInr: t.String(),
    fuelEfficiencyKmPerL: t.Union([t.String(), t.Null()]),
    fuelTotalInr: t.String(),
    fuelTotalLiters: t.String(),
    maintenanceTotalInr: t.String(),
    operationalCostInr: t.String(),
    totalDistanceKm: t.String(),
  }),
  categoriesResponse: t.Object({
    items: t.Array(
      t.Object({
        id: t.String({ format: "uuid" }),
        code: t.String(),
        name: t.String(),
      }),
    ),
  }),
  vehiclesResponse: t.Object({
    items: t.Array(
      t.Object({
        id: t.String({ format: "uuid" }),
        registrationNumber: t.String(),
        nameModel: t.String(),
        status: vehicleStatus,
      }),
    ),
  }),
  tripOptionsResponse: t.Object({
    items: t.Array(
      t.Object({
        id: t.String({ format: "uuid" }),
        vehicleId: t.String({ format: "uuid" }),
        vehicleRegistration: t.String(),
        vehicleNameModel: t.String(),
        destinationName: t.String(),
        driverName: t.String(),
        tripDate: t.String(),
        status: t.Union([t.Literal("dispatched"), t.Literal("completed")]),
        label: t.String(),
      }),
    ),
  }),
} as const;
