import { Elysia } from "elysia";

import { authModule, driversModule, fuelExpensesModule, maintenanceModule } from "@/modules";

export const app = new Elysia({ prefix: "/api" })
  .use(authModule)
  .use(driversModule)
  .use(maintenanceModule)
  .use(fuelExpensesModule);

export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const PATCH = app.handle;
export const DELETE = app.handle;
