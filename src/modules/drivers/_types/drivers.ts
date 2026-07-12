export type DriverListItem = {
  assignedTripCount: number;
  completedTripCount: number;
  contactNumber: string;
  fullName: string;
  id: string;
  isLicenseExpired: boolean;
  isLicenseExpiringSoon: boolean;
  licenseCategoryCode: string;
  licenseCategoryId: string;
  licenseCategoryName: string;
  licenseExpiryDate: string;
  licenseNumber: string;
  notes: string | null;
  safetyScore: number;
  status: DriverStatus;
  /** ADR-049: derived only; null when no assigned trips. */
  tripCompletionPct: number | null;
};

export type DriverStatus = "available" | "off_duty" | "on_trip" | "suspended";

export type DriverWriteInput = {
  /** Internal/seed only — never from public client for create. */
  allowOnTripCreate?: boolean;
  contactNumber: string;
  fullName: string;
  licenseCategoryId: string;
  licenseExpiryDate: string;
  licenseNumber: string;
  notes?: string | null;
  safetyScore?: number | string;
  status?: DriverStatus;
};
