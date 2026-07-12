import { Elysia } from "elysia";

import { errorMessage, resolveErrorCodeNumber } from "@/lib/api/errors";
import { AnalyticsModel } from "@/modules/analytics/model";
import { AnalyticsService } from "@/modules/analytics/service";

function errorBody(message: string) {
  return { message };
}

export const analyticsModule = new Elysia({
  name: "analytics",
  prefix: "/analytics",
})
  .get(
    "/report",
    async ({ request, status }) => {
      try {
        return await AnalyticsService.getReport(request.headers);
      } catch (error) {
        const message = errorMessage(error, "Unable to load analytics report.");
        const code = resolveErrorCodeNumber(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      response: {
        200: AnalyticsModel.reportResponse,
        400: AnalyticsModel.errorResponse,
        401: AnalyticsModel.errorResponse,
        403: AnalyticsModel.errorResponse,
      },
    },
  )
  .get(
    "/summary",
    async ({ request, status }) => {
      try {
        return await AnalyticsService.getSummary(request.headers);
      } catch (error) {
        const message = errorMessage(error, "Unable to load analytics summary.");
        const code = resolveErrorCodeNumber(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      response: {
        200: AnalyticsModel.summaryResponse,
        400: AnalyticsModel.errorResponse,
        401: AnalyticsModel.errorResponse,
        403: AnalyticsModel.errorResponse,
      },
    },
  )
  .get(
    "/export",
    async ({ request, status }) => {
      try {
        return await AnalyticsService.exportCsv(request.headers);
      } catch (error) {
        const message = errorMessage(error, "Unable to export analytics.");
        const code = resolveErrorCodeNumber(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      response: {
        200: AnalyticsModel.exportResponse,
        400: AnalyticsModel.errorResponse,
        401: AnalyticsModel.errorResponse,
        403: AnalyticsModel.errorResponse,
      },
    },
  );
