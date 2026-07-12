import { t } from "elysia";

const entityType = t.Union([t.Literal("vehicle"), t.Literal("maintenance_log")]);

const documentItem = t.Object({
  createdAt: t.String(),
  entityId: t.String(),
  entityLabel: t.Union([t.String(), t.Null()]),
  entityType,
  fileName: t.String(),
  id: t.String({ format: "uuid" }),
  mimeType: t.String(),
  sizeBytes: t.Number(),
  storagePath: t.String(),
  uploadedByUserId: t.String(),
});

export const DocumentsModel = {
  deleteResponse: t.Object({
    id: t.String({ format: "uuid" }),
    softDeleted: t.Literal(true),
  }),
  errorResponse: t.Object({
    message: t.String(),
  }),
  listQuery: t.Object({
    entityId: t.Optional(t.String()),
    entityType: t.Optional(entityType),
  }),
  listResponse: t.Object({
    items: t.Array(documentItem),
  }),
  maintenanceLogsResponse: t.Object({
    items: t.Array(
      t.Object({
        id: t.String(),
        label: t.String(),
        vehicleRegistration: t.String(),
      }),
    ),
  }),
  uploadBody: t.Object({
    entityId: t.String({ minLength: 1 }),
    entityType,
    file: t.File({ maxSize: "10m" }),
  }),
  uploadResponse: t.Object({
    document: documentItem,
  }),
  vehiclesResponse: t.Object({
    items: t.Array(
      t.Object({
        id: t.String({ format: "uuid" }),
        nameModel: t.String(),
        registrationNumber: t.String(),
        status: t.String(),
      }),
    ),
  }),
} as const;
