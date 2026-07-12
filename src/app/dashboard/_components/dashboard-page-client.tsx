"use client";

import { startTransition, useEffect, useState } from "react";
import { toast } from "sonner";

import { DashboardFilters } from "@/app/dashboard/_components/dashboard-filters";
import { KpiCards } from "@/app/dashboard/_components/kpi-cards";
import { RecentTripsTable } from "@/app/dashboard/_components/recent-trips-table";
import { VehicleStatusChart } from "@/app/dashboard/_components/vehicle-status-chart";
import { fetchRecentTrips } from "@/app/dashboard/_lib/dashboard-api";
import type {
  DashboardPageClientProps,
  RecentTripView,
  TripStatusFilter,
} from "@/app/dashboard/_types/dashboard-ui";

export function DashboardPageClient({
  initialKpis,
  initialTrips,
  vehicleTypes,
}: DashboardPageClientProps) {
  const [vehicleTypeId, setVehicleTypeId] = useState("all");
  const [status, setStatus] = useState<TripStatusFilter>("all");
  const [trips, setTrips] = useState<RecentTripView[]>(initialTrips);
  const [tripsLoading, setTripsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // SSR already loaded unfiltered trips — only re-fetch when filters change.
    if (vehicleTypeId === "all" && status === "all") {
      setTrips(initialTrips);
      return;
    }

    async function loadTrips() {
      setTripsLoading(true);

      try {
        const next = await fetchRecentTrips({ vehicleTypeId, status });

        if (!cancelled) {
          setTrips(next);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Unable to load recent trips");
        }
      } finally {
        if (!cancelled) {
          setTripsLoading(false);
        }
      }
    }

    startTransition(() => {
      void loadTrips();
    });

    return () => {
      cancelled = true;
    };
  }, [vehicleTypeId, status, initialTrips]);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <KpiCards kpis={initialKpis} />

        <div className="flex flex-col gap-4 px-4 lg:px-6">
          <DashboardFilters
            vehicleTypeId={vehicleTypeId}
            status={status}
            vehicleTypes={vehicleTypes}
            onVehicleTypeChange={setVehicleTypeId}
            onStatusChange={setStatus}
          />

          <div className="grid items-start gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <RecentTripsTable trips={trips} loading={tripsLoading} />
            </div>
            <div className="lg:col-span-2">
              <VehicleStatusChart vehicleStatus={initialKpis.vehicleStatus} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
