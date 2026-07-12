import { t } from "elysia";

const nullableString = t.Optional(t.Union([t.String(), t.Null()]));
const optionalNonNegativeNumber = t.Optional(t.Number({ minimum: 0 }));

const maintenanceStatus = t.Union([t.Literal("open"), t.Literal("closed")]);
const vehicleStatus = t.Union([
  t.Literal("available"),
  t.Literal("on_trip"),
  t.Literal("in_shop"),
  t.Literal("retired"),
]);

const maintenanceLog = t.Object({
  id: t.Number(),
  vehicleId: t.String({ format: "uuid" }),
  vehicleRegistration: t.String(),
  vehicleNameModel: t.String(),
  vehicleStatus,
  maintenanceTypeId: t.String({ format: "uuid" }),
  maintenanceTypeCode: t.String(),
  maintenanceTypeName: t.String(),
  status: maintenanceStatus,
  description: t.Union([t.String(), t.Null()]),
  vendorName: t.Union([t.String(), t.Null()]),
  costInr: t.String(),
  odometerAtServiceKm: t.Union([t.String(), t.Null()]),
  nextDueOdometerKm: t.Union([t.String(), t.Null()]),
  startedAt: t.String(),
  completedAt: t.Union([t.String(), t.Null()]),
});

const vehicleOption = t.Object({
  id: t.String({ format: "uuid" }),
  registrationNumber: t.String(),
  nameModel: t.String(),
  status: vehicleStatus,
  odometerKm: t.String(),
});

const typeOption = t.Object({
  id: t.String({ format: "uuid" }),
  code: t.String(),
  name: t.String(),
});

export const MaintenanceModel = {
  errorResponse: t.Object({
    message: t.String(),
  }),
  listQuery: t.Object({
    status: t.Optional(maintenanceStatus),
    vehicleId: t.Optional(t.String({ format: "uuid" })),
  }),
  listResponse: t.Object({
    items: t.Array(maintenanceLog),
  }),
  openBody: t.Object({
    vehicleId: t.String({ format: "uuid" }),
    maintenanceTypeId: t.String({ format: "uuid" }),
    costInr: optionalNonNegativeNumber,
    /** Free-text service label when type is Other (code OTHER). */
    customServiceType: t.Optional(t.Union([t.String({ maxLength: 120 }), t.Null()])),
    description: nullableString,
    vendorName: t.Optional(t.Union([t.String({ maxLength: 160 }), t.Null()])),
    odometerAtServiceKm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
    nextDueOdometerKm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  }),
  closeBody: t.Object({
    costInr: optionalNonNegativeNumber,
    description: nullableString,
    vendorName: t.Optional(t.Union([t.String({ maxLength: 160 }), t.Null()])),
    odometerAtServiceKm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
    nextDueOdometerKm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  }),
  idParams: t.Object({
    id: t.String({ pattern: "^[0-9]+$" }),
  }),
  openResponse: t.Object({
    log: maintenanceLog,
  }),
  closeResponse: t.Object({
    log: maintenanceLog,
  }),
  typesResponse: t.Object({
    items: t.Array(typeOption),
  }),
  vehiclesQuery: t.Object({
    forOpen: t.Optional(t.Union([t.Literal("true"), t.Literal("false")])),
  }),
  vehiclesResponse: t.Object({
    items: t.Array(vehicleOption),
  }),
} as const;
