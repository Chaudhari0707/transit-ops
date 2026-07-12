import { Elysia } from "elysia";

import { authModule, locationsModule, tripsModule } from "@/modules";

export const app = new Elysia({ prefix: "/api" })
  .use(authModule)
  .use(locationsModule)
  .use(tripsModule);

export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const PATCH = app.handle;
export const DELETE = app.handle;
