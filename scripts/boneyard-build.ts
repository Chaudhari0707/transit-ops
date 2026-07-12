/**
 * Authenticated boneyard capture following boneyard-js docs.
 *
 * Docs (single-page / specific page mode):
 *   bunx --bun boneyard-js build http://127.0.0.1:3000/trips
 *
 * Passing a URL with a non-root path enables single-page mode:
 * - no link crawl
 * - no filesystem route scan
 * - no config.routes expansion
 * The given page URL(s) ARE the queue.
 *
 * Full capture (every skeleton route, correct role per page):
 *   bun run boneyard:build
 *
 * Only missing/failed sections (recommended):
 *   bun run boneyard:build -- --routes /trips
 *   bun run boneyard:build -- --only trips-live-board
 *
 * Partial runs omit --force so boneyard merges existing *.bones.json into
 * registry (see bone-merge.js / #81). Full runs use --force.
 *
 * Requires: `bun run dev`, seeded demo users.
 */
import { Glob } from "bun";

const BASE_URL = (Bun.env.BONEYARD_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const ROOT = import.meta.dir.replace(/\/scripts$/, "");
const OUT_DIR = `${ROOT}/src/bones`;
const LOGIN_ROLE_HEADER = "x-transitops-role";

/** Route → role that can mount the Skeleton on that page. */
const ROUTE_ROLE: Record<string, "dispatcher" | "fleet_manager"> = {
  "/analytics": "fleet_manager",
  "/dashboard": "fleet_manager",
  "/dashboard/vehicles": "fleet_manager",
  "/documents": "fleet_manager",
  "/drivers": "fleet_manager",
  "/fuel-expenses": "fleet_manager",
  "/maintenance": "fleet_manager",
  "/trips": "dispatcher",
};

/** Skeleton name → route that mounts it. */
const SKELETON_ROUTE: Record<string, string> = {
  "analytics-report": "/analytics",
  "dashboard-recent-trips": "/dashboard",
  "documents-table": "/documents",
  "drivers-list": "/drivers",
  "fuel-expenses-content": "/fuel-expenses",
  "maintenance-list": "/maintenance",
  "trips-live-board": "/trips",
  "vehicles-table": "/dashboard/vehicles",
};

const ALL_ROUTES = Object.keys(ROUTE_ROLE);

type CaptureJob = {
  role: "dispatcher" | "fleet_manager";
  routes: string[];
};

function parseArgs(argv: string[]): { force: boolean; routes: string[] } {
  let routesFilter: string[] | null = null;
  let force = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--force") {
      force = true;
      continue;
    }
    if (arg === "--routes" || arg === "--route") {
      const value = argv[i + 1];
      if (!value) throw new Error(`${arg} requires a value (e.g. /trips)`);
      routesFilter = value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => (part.startsWith("/") ? part : `/${part}`));
      i += 1;
      continue;
    }
    if (arg === "--only") {
      const value = argv[i + 1];
      if (!value) throw new Error("--only requires skeleton name(s), e.g. trips-live-board");
      routesFilter = value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((name) => {
          const route = SKELETON_ROUTE[name];
          if (!route) {
            throw new Error(
              `Unknown skeleton "${name}". Known: ${Object.keys(SKELETON_ROUTE).join(", ")}`,
            );
          }
          return route;
        });
      i += 1;
    }
  }

  const isPartial = routesFilter !== null;
  return {
    // Full runs force by default. Partial runs keep existing bones unless
    // `--force` is passed (needed after snapshotConfig / layout changes).
    force: isPartial ? force : force || true,
    routes: routesFilter ?? ALL_ROUTES,
  };
}

function groupByRole(routes: string[]): CaptureJob[] {
  const byRole = new Map<"dispatcher" | "fleet_manager", string[]>();

  for (const route of routes) {
    const role = ROUTE_ROLE[route];
    if (!role) {
      throw new Error(`No role mapping for route ${route}. Known: ${ALL_ROUTES.join(", ")}`);
    }
    const list = byRole.get(role) ?? [];
    list.push(route);
    byRole.set(role, list);
  }

  return [...byRole.entries()].map(([role, roleRoutes]) => ({
    role,
    routes: roleRoutes,
  }));
}

async function signIn(email: string, password: string, role: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE_URL,
      [LOGIN_ROLE_HEADER]: role,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Sign-in failed for ${email} (${response.status}): ${body}`);
  }

  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : (() => {
          const single = response.headers.get("set-cookie");
          return single ? [single] : [];
        })();

  for (const header of setCookies) {
    const nameValue = header.split(";", 1)[0] ?? "";
    const eq = nameValue.indexOf("=");
    if (eq < 0) continue;
    const name = nameValue.slice(0, eq).trim();
    const value = decodeURIComponent(nameValue.slice(eq + 1).trim());
    if (name === "better-auth.session_token" && value) {
      return value;
    }
  }

  throw new Error(`No better-auth.session_token cookie for ${email}`);
}

/**
 * Docs single-page mode: pass page URL(s) with non-root path.
 * Example: http://127.0.0.1:3000/trips
 * Does NOT pass bare origin — that triggers full crawl.
 */
async function runSinglePageBuild(
  sessionToken: string,
  routes: string[],
  force: boolean,
): Promise<void> {
  const pageUrls = routes.map((route) => `${BASE_URL}${route}`);

  const args = [
    "bunx",
    "--bun",
    "boneyard-js",
    "build",
    ...pageUrls,
    "--wait",
    "8000",
    "--breakpoints",
    "375,640,768,1024,1280",
    "--out",
    "./src/bones",
    // Auth via CLI cookie (docs: --cookie "session=abc")
    "--cookie",
    `better-auth.session_token=${sessionToken}`,
  ];

  // --force rebuilds hashes but ALSO skips mergePreservingExisting — only use on full runs.
  if (force) {
    args.push("--force");
  }

  console.log(`  $ boneyard-js build ${pageUrls.join(" ")} …`);

  const proc = Bun.spawn(args, {
    cwd: ROOT,
    env: {
      ...Bun.env,
      // Still set for boneyard.config.json auth.cookies env[…] if present
      BONEYARD_SESSION_TOKEN: sessionToken,
    },
    stdout: "inherit",
    stderr: "inherit",
  });

  const code = await proc.exited;
  if (code !== 0) {
    throw new Error(`boneyard-js build exited with ${code}`);
  }
}

function toImportId(fileName: string): string {
  return `_${fileName.replace(/\.bones\.json$/, "").replace(/-/g, "_")}`;
}

function toSkeletonName(fileName: string): string {
  return fileName.replace(/\.bones\.json$/, "");
}

/** Safety net if CLI registry dropped a name — re-register every *.bones.json on disk. */
async function writeMergedRegistry(): Promise<void> {
  const files: string[] = [];
  for await (const path of new Glob("*.bones.json").scan({ cwd: OUT_DIR, onlyFiles: true })) {
    files.push(path);
  }
  files.sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    throw new Error("No .bones.json files found under src/bones");
  }

  const imports = files.map((file) => `import ${toImportId(file)} from "./${file}";`).join("\n");

  const source = `"use client";
// Auto-generated by scripts/boneyard-build.ts — do not edit by hand
import { registerBones } from "boneyard-js";
import { configureBoneyard } from "boneyard-js/react";

import { polishTableBones } from "@/lib/boneyard/polish-table-bones";
import { BONEYARD_RUNTIME } from "@/lib/boneyard/runtime-style";

${imports}

// Boneyard shimmer only (never CSS animate-pulse). Colors track theme muted.
configureBoneyard({
  animate: BONEYARD_RUNTIME.animate,
  color: BONEYARD_RUNTIME.color,
  darkColor: BONEYARD_RUNTIME.darkColor,
  darkShimmerColor: BONEYARD_RUNTIME.darkShimmerColor,
  select: BONEYARD_RUNTIME.select,
  shimmerAngle: BONEYARD_RUNTIME.shimmerAngle,
  shimmerColor: BONEYARD_RUNTIME.shimmerColor,
  speed: BONEYARD_RUNTIME.speed,
  transition: BONEYARD_RUNTIME.transition,
});

const TABLE_SKELETONS = new Set([
  "dashboard-recent-trips",
  "documents-table",
  "drivers-list",
  "fuel-expenses-content",
  "maintenance-list",
  "vehicles-table",
]);

function maybePolish<T>(name: string, data: T): T {
  return TABLE_SKELETONS.has(name) ? polishTableBones(data) : data;
}

registerBones({
${files
  .map((file) => {
    const name = toSkeletonName(file);
    const id = toImportId(file);
    return `  "${name}": maybePolish("${name}", ${id}),`;
  })
  .join("\n")}
});
`;

  await Bun.write(`${OUT_DIR}/registry.ts`, source);
  console.log(`\nRegistry has ${files.length} skeleton(s):`);
  for (const file of files) {
    console.log(`  • ${toSkeletonName(file)}`);
  }
}

async function main(): Promise<void> {
  const { force, routes } = parseArgs(Bun.argv.slice(2));
  const jobs = groupByRole(routes);
  const isPartial = routes.length < ALL_ROUTES.length;

  const health = await fetch(BASE_URL).catch(() => null);
  if (!health) {
    throw new Error(`Dev server not reachable at ${BASE_URL}. Run \`bun run dev\` first.`);
  }

  const password = Bun.env.AUTH_ADMIN_PASSWORD ?? "password";
  const adminEmail = Bun.env.AUTH_ADMIN_EMAIL ?? "admin@example.com";
  const dispatcherEmail = Bun.env.AUTH_DISPATCHER_EMAIL ?? "dispatcher@example.com";

  console.log(
    isPartial
      ? `→ Single-page capture only: ${routes.join(", ")}`
      : `→ Full capture: ${routes.join(", ")}`,
  );

  for (const job of jobs) {
    const email = job.role === "dispatcher" ? dispatcherEmail : adminEmail;
    console.log(`\n→ ${job.routes.join(", ")} as ${job.role}…`);
    const token = await signIn(email, password, job.role);
    // One CLI invocation per role with only those page URLs (single-page mode).
    await runSinglePageBuild(token, job.routes, force);
  }

  await writeMergedRegistry();
  console.log("\n💀 boneyard build complete.");
}

await main();
