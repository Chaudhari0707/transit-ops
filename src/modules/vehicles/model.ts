import { t } from "elysia";

const vehicleStatus = t.Union([
  t.Literal("available"),
  t.Literal("on_trip"),
  t.Literal("in_shop"),
  t.Literal("retired"),
]);

const vehicleRecord = t.Object({
  id: t.String({ format: "uuid" }),
  registrationNumber: t.String({ minLength: 3, maxLength: 32 }),
  nameModel: t.String({ minLength: 1, maxLength: 160 }),
  vehicleTypeId: t.String({ format: "uuid" }),
  maxLoadCapacityKg: t.Number({ exclusiveMinimum: 0 }),
  odometerKm: t.Number({ minimum: 0 }),
  acquisitionCostInr: t.Number({ minimum: 0 }),
  status: vehicleStatus,
  notes: t.Union([t.String(), t.Null()]),
  createdByUserId: t.Union([t.String(), t.Null()]),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export const VehiclesModel = {
  errorResponse: t.Object({
    message: t.String(),
  }),
  listQuery: t.Object({
    vehicleTypeId: t.Optional(t.String({ format: "uuid" })),
    status: t.Optional(vehicleStatus),
  }),
  idParams: t.Object({
    id: t.String({ format: "uuid" }),
  }),
  createBody: t.Object({
    registrationNumber: t.String({ minLength: 3, maxLength: 32 }),
    nameModel: t.String({ minLength: 1, maxLength: 160 }),
    vehicleTypeId: t.String({ format: "uuid" }),
    maxLoadCapacityKg: t.Number({ exclusiveMinimum: 0 }),
    odometerKm: t.Optional(t.Number({ minimum: 0 })),
    acquisitionCostInr: t.Number({ minimum: 0 }),
    notes: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
  }),
  updateBody: t.Object({
    registrationNumber: t.Optional(t.String({ minLength: 3, maxLength: 32 })),
    nameModel: t.Optional(t.String({ minLength: 1, maxLength: 160 })),
    vehicleTypeId: t.Optional(t.String({ format: "uuid" })),
    maxLoadCapacityKg: t.Optional(t.Number({ exclusiveMinimum: 0 })),
    odometerKm: t.Optional(t.Number({ minimum: 0 })),
    acquisitionCostInr: t.Optional(t.Number({ minimum: 0 })),
    status: t.Optional(vehicleStatus),
    notes: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
  }),
  vehicleResponse: vehicleRecord,
  listResponse: t.Object({
    items: t.Array(vehicleRecord),
  }),
  deleteResponse: t.Object({
    id: t.String({ format: "uuid" }),
    deleted: t.Literal(true),
  }),
} as const;
