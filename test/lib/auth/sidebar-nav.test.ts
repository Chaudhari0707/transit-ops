import { describe, expect, test } from "bun:test";

import {
  canAccessPageModule,
  canCreateTrip,
  canSeeNavItem,
  getSidebarNavIdsForRole,
} from "@/lib/auth/_lib/sidebar-nav";
import type { SidebarNavId } from "@/lib/auth/_types/sidebar-nav";
import { USER_ROLES, type UserRole } from "@/lib/auth/_types/user-role";

function idsFor(role: UserRole): Set<SidebarNavId> {
  return new Set(getSidebarNavIdsForRole(role));
}

describe("sidebar nav RBAC matrix", () => {
  test("dispatcher sees Dashboard, Trips, Fleet — not Analytics/Drivers/Maintenance/Fuel", () => {
    const ids = idsFor("dispatcher");
    expect(ids.has("dashboard")).toBe(true);
    expect(ids.has("trips")).toBe(true);
    expect(ids.has("fleet")).toBe(true);
    expect(ids.has("analytics")).toBe(false);
    expect(ids.has("drivers")).toBe(false);
    expect(ids.has("maintenance")).toBe(false);
    expect(ids.has("fuel_expenses")).toBe(false);
    expect(ids.has("documents")).toBe(false);
    expect(ids.has("help")).toBe(true);
    expect(ids.has("search")).toBe(true);
  });

  test("fleet_manager sees Fleet, Analytics, Drivers, Maintenance — not Trips or Fuel nav", () => {
    const ids = idsFor("fleet_manager");
    expect(ids.has("dashboard")).toBe(true);
    expect(ids.has("fleet")).toBe(true);
    expect(ids.has("analytics")).toBe(true);
    expect(ids.has("drivers")).toBe(true);
    expect(ids.has("maintenance")).toBe(true);
    expect(ids.has("documents")).toBe(true);
    expect(ids.has("trips")).toBe(false);
    expect(ids.has("fuel_expenses")).toBe(false);
  });

  test("safety_officer sees Drivers and Trips view — not Fleet/Analytics/Maintenance/Fuel", () => {
    const ids = idsFor("safety_officer");
    expect(ids.has("dashboard")).toBe(true);
    expect(ids.has("trips")).toBe(true);
    expect(ids.has("drivers")).toBe(true);
    expect(ids.has("fleet")).toBe(false);
    expect(ids.has("analytics")).toBe(false);
    expect(ids.has("maintenance")).toBe(false);
    expect(ids.has("fuel_expenses")).toBe(false);
    expect(ids.has("documents")).toBe(false);
  });

  test("financial_analyst sees Fleet, Analytics, Maintenance, Fuel — not Drivers/Trips", () => {
    const ids = idsFor("financial_analyst");
    expect(ids.has("dashboard")).toBe(true);
    expect(ids.has("fleet")).toBe(true);
    expect(ids.has("analytics")).toBe(true);
    expect(ids.has("maintenance")).toBe(true);
    expect(ids.has("fuel_expenses")).toBe(true);
    expect(ids.has("drivers")).toBe(false);
    expect(ids.has("trips")).toBe(false);
    expect(ids.has("documents")).toBe(false);
  });

  test("canSeeNavItem matches getSidebarNavIdsForRole for every role", () => {
    for (const role of USER_ROLES) {
      for (const id of getSidebarNavIdsForRole(role)) {
        expect(canSeeNavItem(role, id)).toBe(true);
      }
      expect(canSeeNavItem(role, "dashboard")).toBe(true);
    }
  });
});

describe("New Trip CTA", () => {
  test("only dispatcher can create trips", () => {
    expect(canCreateTrip("dispatcher")).toBe(true);
    expect(canCreateTrip("fleet_manager")).toBe(false);
    expect(canCreateTrip("safety_officer")).toBe(false);
    expect(canCreateTrip("financial_analyst")).toBe(false);
  });
});

describe("page module access", () => {
  test("dispatcher cannot open drivers, maintenance, or fuel pages", () => {
    expect(canAccessPageModule("dispatcher", "drivers")).toBe(false);
    expect(canAccessPageModule("dispatcher", "maintenance")).toBe(false);
    expect(canAccessPageModule("dispatcher", "fuel_expenses")).toBe(false);
    expect(canAccessPageModule("dispatcher", "vehicles")).toBe(true);
    expect(canAccessPageModule("dispatcher", "dashboard")).toBe(true);
  });

  test("safety_officer cannot open vehicles page", () => {
    expect(canAccessPageModule("safety_officer", "vehicles")).toBe(false);
    expect(canAccessPageModule("safety_officer", "drivers")).toBe(true);
  });

  test("fleet_manager may access fuel page even when Fuel nav is hidden", () => {
    expect(canSeeNavItem("fleet_manager", "fuel_expenses")).toBe(false);
    expect(canAccessPageModule("fleet_manager", "fuel_expenses")).toBe(true);
  });
});
