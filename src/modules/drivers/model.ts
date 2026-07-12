import { t } from "elysia";

const driverStatus = t.Union([
  t.Literal("available"),
  t.Literal("on_trip"),
  t.Literal("off_duty"),
  t.Literal("suspended"),
]);

const driverItem = t.Object({
  id: t.String({ format: "uuid" }),
  fullName: t.String(),
  licenseNumber: t.String(),
  licenseCategoryId: t.String({ format: "uuid" }),
  licenseCategoryCode: t.String(),
  licenseCategoryName: t.String(),
  licenseExpiryDate: t.String(),
  contactNumber: t.String(),
  safetyScore: t.Number(),
  status: driverStatus,
  notes: t.Union([t.String(), t.Null()]),
  isLicenseExpired: t.Boolean(),
  isLicenseExpiringSoon: t.Boolean(),
  assignedTripCount: t.Number(),
  completedTripCount: t.Number(),
  tripCompletionPct: t.Union([t.Number(), t.Null()]),
});

const writeBody = t.Object({
  fullName: t.String({ minLength: 1, maxLength: 160 }),
  licenseNumber: t.String({ minLength: 1, maxLength: 64 }),
  licenseCategoryId: t.String({ format: "uuid" }),
  licenseExpiryDate: t.String({ minLength: 10, maxLength: 10 }),
  contactNumber: t.String({ minLength: 1, maxLength: 32 }),
  safetyScore: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
  status: t.Optional(
    t.Union([t.Literal("available"), t.Literal("off_duty"), t.Literal("suspended")]),
  ),
  notes: t.Optional(t.Union([t.String(), t.Null()])),
});

export const DriversModel = {
  errorResponse: t.Object({
    message: t.String(),
  }),
  listQuery: t.Object({
    status: t.Optional(driverStatus),
    licenseCompliance: t.Optional(
      t.Union([t.Literal("expired"), t.Literal("expiring_soon"), t.Literal("valid")]),
    ),
    search: t.Optional(t.String()),
  }),
  listResponse: t.Object({
    items: t.Array(driverItem),
  }),
  getResponse: t.Object({
    driver: driverItem,
  }),
  createBody: writeBody,
  updateBody: writeBody,
  idParams: t.Object({
    id: t.String({ format: "uuid" }),
  }),
  mutateResponse: t.Object({
    driver: driverItem,
  }),
  deleteResponse: t.Object({
    id: t.String({ format: "uuid" }),
    deleted: t.Literal(true),
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
} as const;
