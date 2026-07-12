import { t } from "elysia";

const vehicleStatusCounts = t.Object({
  available: t.Number({ minimum: 0 }),
  in_shop: t.Number({ minimum: 0 }),
  on_trip: t.Number({ minimum: 0 }),
  retired: t.Number({ minimum: 0 }),
});

const tripStatus = t.Union([
  t.Literal("cancelled"),
  t.Literal("completed"),
  t.Literal("dispatched"),
  t.Literal("draft"),
]);

const recentTrip = t.Object({
  driverName: t.String(),
  etaLabel: t.String(),
  id: t.String({ format: "uuid" }),
  status: tripStatus,
  tripCode: t.String(),
  vehicleName: t.String(),
});

export const DashboardModel = {
  errorResponse: t.Object({
    message: t.String(),
  }),
  kpisResponse: t.Object({
    activeTrips: t.Number({ minimum: 0 }),
    activeVehicles: t.Number({ minimum: 0 }),
    availableVehicles: t.Number({ minimum: 0 }),
    driversOnDuty: t.Number({ minimum: 0 }),
    fleetUtilizationPercent: t.Number({ minimum: 0, maximum: 100 }),
    pendingTrips: t.Number({ minimum: 0 }),
    vehiclesInMaintenance: t.Number({ minimum: 0 }),
    vehicleStatus: vehicleStatusCounts,
  }),
  recentTrip,
  recentTripsQuery: t.Object({
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
    status: t.Optional(tripStatus),
    vehicleTypeId: t.Optional(t.String({ format: "uuid" })),
  }),
  recentTripsResponse: t.Object({
    trips: t.Array(recentTrip),
  }),
} as const;
