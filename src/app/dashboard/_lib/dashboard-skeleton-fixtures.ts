import type { RecentTripView } from "@/app/dashboard/_types/dashboard-ui";

export const FIXTURE_TRIPS: RecentTripView[] = [
  {
    driverName: "Ravi Patel",
    etaLabel: "2h 15m",
    id: "a1b2c3d4-0001-4000-8000-000000000001",
    status: "dispatched",
    tripCode: "TR-A1B2",
    vehicleName: "GJ-01-AB-1234",
  },
  {
    driverName: "Amit Shah",
    etaLabel: "—",
    id: "a1b2c3d4-0002-4000-8000-000000000002",
    status: "draft",
    tripCode: "TR-A1B3",
    vehicleName: "GJ-05-CD-5678",
  },
  {
    driverName: "Suresh Mehta",
    etaLabel: "Arrived",
    id: "a1b2c3d4-0003-4000-8000-000000000003",
    status: "completed",
    tripCode: "TR-A1B4",
    vehicleName: "GJ-18-EF-9012",
  },
  {
    driverName: "Kiran Desai",
    etaLabel: "—",
    id: "a1b2c3d4-0004-4000-8000-000000000004",
    status: "cancelled",
    tripCode: "TR-A1B5",
    vehicleName: "GJ-27-GH-3456",
  },
];
