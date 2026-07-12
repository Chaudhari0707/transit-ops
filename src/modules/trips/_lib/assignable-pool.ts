import type { DispatchDriver } from "@/modules/trips/_types/dispatch";

export function isVehicleAssignable(status: string): boolean {
  return status === "available";
}

export function isDriverAssignableForPool(driver: DispatchDriver, todayIsoDate: string): boolean {
  if (driver.status !== "available") {
    return false;
  }

  return driver.licenseExpiryDate >= todayIsoDate;
}
