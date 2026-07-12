import { DashboardFilters } from "@/app/dashboard/_components/dashboard-filters";
import { FleetOverview } from "@/app/dashboard/_components/fleet-overview";
import { RecentTripsTable } from "@/app/dashboard/_components/recent-trips-table";
import { demoTrips } from "@/app/dashboard/_lib/demo-trips";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";

export default function DashboardPage() {
  const trips = demoTrips;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <DashboardFilters />
        <SectionCards />
        <div className="grid gap-4 px-4 lg:grid-cols-2 lg:px-6">
          <ChartAreaInteractive />
          <FleetOverview />
        </div>
        <div className="px-4 lg:px-6">
          <RecentTripsTable trips={trips} />
        </div>
      </div>
    </div>
  );
}
