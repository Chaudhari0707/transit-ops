import "@/lib/runtime/bun-env-polyfill";

import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/better-auth";

export const { GET, POST } = toNextJsHandler(auth);
