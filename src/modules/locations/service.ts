import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";

import type { SessionUser } from "@/lib/api/_types/session";
import { requireAnyRole } from "@/lib/api/session";
import { getDb } from "@/lib/db/client";
import { locations } from "@/lib/db/schema";
import {
  isValidLocationCode,
  isValidLocationName,
  normalizeLocationCode,
  normalizeLocationName,
} from "@/modules/locations/_lib/normalize-location";
import type { LocationRecord } from "@/modules/locations/_types/location";

const LOCATION_READ_ROLES = [
  "fleet_manager",
  "dispatcher",
  "safety_officer",
  "financial_analyst",
] as const;

const LOCATION_WRITE_ROLES = ["fleet_manager"] as const;

function toLocationRecord(row: typeof locations.$inferSelect): LocationRecord {
  return {
    code: row.code,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    isActive: row.isActive,
    name: row.name,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export abstract class LocationsService {
  static async list(actor: SessionUser) {
    requireAnyRole(actor, LOCATION_READ_ROLES);

    const rows = await getDb()
      .select()
      .from(locations)
      .where(and(eq(locations.isActive, true), sql`${locations.deletedAt} is null`))
      .orderBy(asc(locations.name));

    return {
      locations: rows.map(toLocationRecord),
    };
  }

  static async create(
    actor: SessionUser,
    input: {
      code: string;
      name: string;
    },
  ) {
    requireAnyRole(actor, LOCATION_WRITE_ROLES);

    const code = normalizeLocationCode(input.code);
    const name = normalizeLocationName(input.name);

    if (!isValidLocationCode(code)) {
      throw new Error("Location code must be 2-32 uppercase letters, numbers, or underscores");
    }

    if (!isValidLocationName(name)) {
      throw new Error("Location name must be between 2 and 160 characters");
    }

    const [existing] = await getDb()
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.code, code), sql`${locations.deletedAt} is null`))
      .limit(1);

    if (existing) {
      throw new Error("Conflict");
    }

    const [created] = await getDb()
      .insert(locations)
      .values({
        code,
        name,
        isActive: true,
      })
      .returning();

    if (!created) {
      throw new Error("Unable to create location");
    }

    return {
      location: toLocationRecord(created),
    };
  }
}
