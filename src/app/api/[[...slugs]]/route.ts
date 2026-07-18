import "@/lib/runtime/bun-env-polyfill";

import { Elysia } from "elysia";

import {
  analyticsModule,
  dashboardModule,
  documentsModule,
  driversModule,
  fuelExpensesModule,
  locationsModule,
  maintenanceModule,
  tripsModule,
  vehiclesModule,
} from "@/modules";

/**
 * Domain API surface. Sign-in/session is owned by monish Better Auth at `/api/auth/*`.
 */
export const app = new Elysia({ prefix: "/api" })
  .get("/health", () => ({ ok: true }))
  .use(vehiclesModule)
  .use(driversModule)
  .use(locationsModule)
  .use(tripsModule)
  .use(maintenanceModule)
  .use(fuelExpensesModule)
  .use(dashboardModule)
  .use(analyticsModule)
  .use(documentsModule);

export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const PATCH = app.handle;
export const DELETE = app.handle;
