export type DriverFormState = {
  contactNumber: string;
  fullName: string;
  licenseCategoryId: string;
  licenseExpiryDate: string;
  licenseNumber: string;
  notes: string;
  safetyScore: string;
  status: "available" | "off_duty" | "suspended";
};

export type DriverUi = {
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
  status: "available" | "off_duty" | "on_trip" | "suspended";
  tripCompletionPct: number | null;
};

export type LicenseCategoryOption = {
  code: string;
  id: string;
  name: string;
};
