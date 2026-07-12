export type TripRow = {
  cargoKg: number;
  distanceKm: number;
  driver: string;
  id: string;
  route: string;
  status: "draft" | "dispatched" | "completed" | "cancelled";
  vehicle: string;
};
