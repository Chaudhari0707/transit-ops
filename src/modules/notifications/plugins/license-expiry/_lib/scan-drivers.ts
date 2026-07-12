import { and, eq, isNull, sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth";
import { drivers } from "@/lib/db/schema/fleet";
import type { DriverLicenseCandidate } from "@/modules/notifications/plugins/license-expiry/_types/notifications";
import { todayUtcDate } from "@/modules/drivers/_lib/rules";

export async function listActiveDriversWithLicense(
  todayIso = todayUtcDate(),
): Promise<DriverLicenseCandidate[]> {
  const rows = await getDb()
    .select({
      driverId: drivers.id,
      fullName: drivers.fullName,
      licenseNumber: drivers.licenseNumber,
      licenseExpiryDate: drivers.licenseExpiryDate,
      linkedUserEmail: user.email,
    })
    .from(drivers)
    .leftJoin(user, eq(drivers.userId, user.id))
    .where(and(isNull(drivers.deletedAt), sql`${drivers.licenseExpiryDate} >= ${todayIso}`));

  return rows.map((row) => ({
    driverId: row.driverId,
    fullName: row.fullName,
    licenseNumber: row.licenseNumber,
    licenseExpiryDate: row.licenseExpiryDate,
    linkedUserEmail: row.linkedUserEmail,
  }));
}
