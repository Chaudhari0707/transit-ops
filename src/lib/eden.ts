import { edenTreaty } from "@elysiajs/eden";

import type { app } from "@/app/api/[[...slugs]]/route";

export const api = edenTreaty<typeof app>("http://localhost:3000").api;
