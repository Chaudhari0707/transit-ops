import { Elysia } from "elysia";

export const app = new Elysia({ prefix: "/api" }).get("/health", () => ({ ok: true }));

export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const PATCH = app.handle;
export const DELETE = app.handle;
