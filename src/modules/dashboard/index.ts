import { Elysia } from "elysia";

import { errorMessage, resolveErrorCode } from "@/lib/api/errors";
import { DashboardModel } from "@/modules/dashboard/model";
import { DashboardService } from "@/modules/dashboard/service";

const errorResponses = {
  400: DashboardModel.errorResponse,
  401: DashboardModel.errorResponse,
  403: DashboardModel.errorResponse,
  404: DashboardModel.errorResponse,
  409: DashboardModel.errorResponse,
  429: DashboardModel.errorResponse,
} as const;

export const dashboardModule = new Elysia({ name: "dashboard", prefix: "/dashboard" })
  .get(
    "/kpis",
    async ({ request, status }) => {
      try {
        return await DashboardService.getKpis(request.headers);
      } catch (error) {
        const message = errorMessage(error, "Unable to load dashboard KPIs");
        return status(resolveErrorCode(message), { message });
      }
    },
    {
      response: {
        200: DashboardModel.kpisResponse,
        ...errorResponses,
      },
    },
  )
  .get(
    "/recent-trips",
    async ({ request, query, status }) => {
      try {
        return await DashboardService.listRecentTrips(request.headers, {
          vehicleTypeId: query.vehicleTypeId,
          status: query.status,
          limit: query.limit,
        });
      } catch (error) {
        const message = errorMessage(error, "Unable to load recent trips");
        return status(resolveErrorCode(message), { message });
      }
    },
    {
      query: DashboardModel.recentTripsQuery,
      response: {
        200: DashboardModel.recentTripsResponse,
        ...errorResponses,
      },
    },
  );
