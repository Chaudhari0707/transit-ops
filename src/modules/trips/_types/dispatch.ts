export type DispatchDriver = {
  licenseExpiryDate: string;
  status: "available" | "on_trip" | "off_duty" | "suspended";
};

export type DispatchVehicle = {
  maxLoadCapacityKg: number;
  status: "available" | "on_trip" | "in_shop" | "retired";
};
