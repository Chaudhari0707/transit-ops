import { t } from "elysia";

export const LocationsModel = {
  errorResponse: t.Object({
    message: t.String(),
  }),
  location: t.Object({
    id: t.String({ format: "uuid" }),
    code: t.String(),
    name: t.String(),
    isActive: t.Boolean(),
    createdAt: t.String(),
    updatedAt: t.String(),
  }),
  listResponse: t.Object({
    locations: t.Array(
      t.Object({
        id: t.String({ format: "uuid" }),
        code: t.String(),
        name: t.String(),
        isActive: t.Boolean(),
        createdAt: t.String(),
        updatedAt: t.String(),
      }),
    ),
  }),
  createBody: t.Object({
    code: t.String({ minLength: 2, maxLength: 32 }),
    name: t.String({ minLength: 2, maxLength: 160 }),
  }),
  createResponse: t.Object({
    location: t.Object({
      id: t.String({ format: "uuid" }),
      code: t.String(),
      name: t.String(),
      isActive: t.Boolean(),
      createdAt: t.String(),
      updatedAt: t.String(),
    }),
  }),
} as const;
