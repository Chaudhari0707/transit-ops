import type { PageModuleId, SidebarNavId } from "@/lib/auth/_types/sidebar-nav";
import type { UserRole } from "@/lib/auth/_types/user-role";

/** Stable nav keys used by the app shell sidebar (data-only; icons live in UI). */
export const SIDEBAR_NAV_IDS = [
  "dashboard",
  "trips",
  "fleet",
  "drivers",
  "analytics",
  "maintenance",
  "fuel_expenses",
  "documents",
  "help",
  "search",
] as const satisfies readonly SidebarNavId[];

/**
 * RBAC nav visibility — docs/architecture/05-rbac-matrix.md ("Hide nav for modules with —").
 * Secondary Help/Search: visible for all roles.
 */
const NAV_VISIBLE_ROLES: Record<SidebarNavId, readonly UserRole[]> = {
  dashboard: ["fleet_manager", "dispatcher", "safety_officer", "financial_analyst"],
  trips: ["dispatcher", "safety_officer"],
  fleet: ["fleet_manager", "dispatcher", "financial_analyst"],
  drivers: ["fleet_manager", "safety_officer"],
  analytics: ["fleet_manager", "financial_analyst"],
  maintenance: ["fleet_manager", "financial_analyst"],
  fuel_expenses: ["financial_analyst"],
  documents: ["fleet_manager"],
  help: ["fleet_manager", "dispatcher", "safety_officer", "financial_analyst"],
  search: ["fleet_manager", "dispatcher", "safety_officer", "financial_analyst"],
};

export function canSeeNavItem(role: UserRole, itemId: SidebarNavId): boolean {
  return NAV_VISIBLE_ROLES[itemId].includes(role);
}

export function getSidebarNavIdsForRole(role: UserRole): SidebarNavId[] {
  return SIDEBAR_NAV_IDS.filter((id) => canSeeNavItem(role, id));
}

/** Trip write role — New Trip CTA in NavMain. */
export function canCreateTrip(role: UserRole): boolean {
  return role === "dispatcher";
}

const PAGE_ACCESS_ROLES: Record<PageModuleId, readonly UserRole[]> = {
  dashboard: ["fleet_manager", "dispatcher", "safety_officer", "financial_analyst"],
  drivers: ["fleet_manager", "safety_officer"],
  vehicles: ["fleet_manager", "dispatcher", "financial_analyst"],
  maintenance: ["fleet_manager", "financial_analyst"],
  // Existing fuel rules allow fleet_manager for demo/bootstrap + FA.
  fuel_expenses: ["financial_analyst", "fleet_manager"],
};

export function canAccessPageModule(role: UserRole, moduleId: PageModuleId): boolean {
  return PAGE_ACCESS_ROLES[moduleId].includes(role);
}
