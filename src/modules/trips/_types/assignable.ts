export type AssignableDriverRecord = {
  contactNumber: string;
  fullName: string;
  id: string;
  licenseExpiryDate: string;
  licenseNumber: string;
  safetyScore: number;
  status: "available";
};

export type AssignableVehicleRecord = {
  id: string;
  maxLoadCapacityKg: string;
  nameModel: string;
  odometerKm: string;
  registrationNumber: string;
  status: "available";
};
