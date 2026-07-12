import { edenTreaty } from "@elysiajs/eden";

import type { app } from "@/app/api/[[...slugs]]/route";

function getApiOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return Bun.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3001";
}

export const api = edenTreaty<typeof app>(getApiOrigin(), {
  $fetch: {
    credentials: "include",
  },
}).api;
