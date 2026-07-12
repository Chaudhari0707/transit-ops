import { t } from "elysia";

const tripLocation = t.Object({
  id: t.String({ format: "uuid" }),
  code: t.String(),
  name: t.String(),
});

const trip = t.Object({
  id: t.String({ format: "uuid" }),
  status: t.Union([
    t.Literal("draft"),
    t.Literal("dispatched"),
    t.Literal("completed"),
    t.Literal("cancelled"),
  ]),
  sourceLocation: tripLocation,
  destinationLocation: tripLocation,
  vehicleId: t.String({ format: "uuid" }),
  driverId: t.String({ format: "uuid" }),
  cargoWeightKg: t.String(),
  plannedDistanceKm: t.String(),
  startOdometerKm: t.Union([t.String(), t.Null()]),
  endOdometerKm: t.Union([t.String(), t.Null()]),
  actualDistanceKm: t.Union([t.String(), t.Null()]),
  fuelConsumedLiters: t.Union([t.String(), t.Null()]),
  fuelCostInr: t.Union([t.String(), t.Null()]),
  dispatchedAt: t.Union([t.String(), t.Null()]),
  completedAt: t.Union([t.String(), t.Null()]),
  cancelledAt: t.Union([t.String(), t.Null()]),
  cancelReason: t.Union([t.String(), t.Null()]),
  createdByUserId: t.String(),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export const TripsModel = {
  errorResponse: t.Object({
    message: t.String(),
  }),
  trip,
  listQuery: t.Object({
    status: t.Optional(
      t.Union([
        t.Literal("draft"),
        t.Literal("dispatched"),
        t.Literal("completed"),
        t.Literal("cancelled"),
      ]),
    ),
  }),
  listResponse: t.Object({
    trips: t.Array(trip),
  }),
  tripResponse: t.Object({
    trip,
  }),
  createBody: t.Object({
    sourceLocationId: t.String({ format: "uuid" }),
    destinationLocationId: t.String({ format: "uuid" }),
    vehicleId: t.String({ format: "uuid" }),
    driverId: t.String({ format: "uuid" }),
    cargoWeightKg: t.Number({ minimum: 0.01 }),
    plannedDistanceKm: t.Number({ minimum: 0.01 }),
  }),
  updateBody: t.Object({
    sourceLocationId: t.String({ format: "uuid" }),
    destinationLocationId: t.String({ format: "uuid" }),
    vehicleId: t.String({ format: "uuid" }),
    driverId: t.String({ format: "uuid" }),
    cargoWeightKg: t.Number({ minimum: 0.01 }),
    plannedDistanceKm: t.Number({ minimum: 0.01 }),
  }),
  cancelBody: t.Object({
    cancelReason: t.Optional(t.String({ maxLength: 500 })),
  }),
  completeBody: t.Object({
    endOdometerKm: t.Number({ minimum: 0 }),
    fuelLiters: t.Number({ minimum: 0.001 }),
    fuelCostInr: t.Number({ minimum: 0 }),
    expenses: t.Array(
      t.Object({
        expenseCategoryId: t.String({ format: "uuid" }),
        amountInr: t.Number({ minimum: 0.01 }),
        incurredOn: t.String({ format: "date" }),
        description: t.Optional(t.String({ maxLength: 500 })),
      }),
      { minItems: 1 },
    ),
  }),
  idParams: t.Object({
    id: t.String({ format: "uuid" }),
  }),
  assignableVehicle: t.Object({
    id: t.String({ format: "uuid" }),
    registrationNumber: t.String(),
    nameModel: t.String(),
    maxLoadCapacityKg: t.String(),
    odometerKm: t.String(),
    status: t.Literal("available"),
  }),
  assignableDriver: t.Object({
    id: t.String({ format: "uuid" }),
    fullName: t.String(),
    licenseNumber: t.String(),
    licenseExpiryDate: t.String({ format: "date" }),
    contactNumber: t.String(),
    safetyScore: t.Number(),
    status: t.Literal("available"),
  }),
  assignableVehiclesResponse: t.Object({
    vehicles: t.Array(
      t.Object({
        id: t.String({ format: "uuid" }),
        registrationNumber: t.String(),
        nameModel: t.String(),
        maxLoadCapacityKg: t.String(),
        odometerKm: t.String(),
        status: t.Literal("available"),
      }),
    ),
  }),
  assignableDriversResponse: t.Object({
    drivers: t.Array(
      t.Object({
        id: t.String({ format: "uuid" }),
        fullName: t.String(),
        licenseNumber: t.String(),
        licenseExpiryDate: t.String({ format: "date" }),
        contactNumber: t.String(),
        safetyScore: t.Number(),
        status: t.Literal("available"),
      }),
    ),
  }),
} as const;
