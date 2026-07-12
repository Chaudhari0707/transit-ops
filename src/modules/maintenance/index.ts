import { Elysia } from "elysia";

import { errorMessage, resolveErrorCode } from "@/modules/auth/_lib/session";
import { MaintenanceModel } from "@/modules/maintenance/model";
import { MaintenanceService } from "@/modules/maintenance/service";

function errorBody(message: string) {
  return { message };
}

export const maintenanceModule = new Elysia({
  name: "maintenance",
  prefix: "/maintenance",
})
  .get(
    "/",
    async ({ request, query, status }) => {
      try {
        return await MaintenanceService.list(request.headers, {
          status: query.status,
          vehicleId: query.vehicleId,
        });
      } catch (error) {
        const message = errorMessage(error, "Unable to list maintenance logs.");
        const code = resolveErrorCode(message);

        if (code === 401) {
          return status(401, errorBody(message));
        }

        if (code === 403) {
          return status(403, errorBody(message));
        }

        return status(400, errorBody(message));
      }
    },
    {
      query: MaintenanceModel.listQuery,
      response: {
        200: MaintenanceModel.listResponse,
        400: MaintenanceModel.errorResponse,
        401: MaintenanceModel.errorResponse,
        403: MaintenanceModel.errorResponse,
      },
    },
  )
  .get(
    "/types",
    async ({ request, status }) => {
      try {
        return await MaintenanceService.listTypes(request.headers);
      } catch (error) {
        const message = errorMessage(error, "Unable to list maintenance types.");
        const code = resolveErrorCode(message);

        if (code === 401) {
          return status(401, errorBody(message));
        }

        if (code === 403) {
          return status(403, errorBody(message));
        }

        return status(400, errorBody(message));
      }
    },
    {
      response: {
        200: MaintenanceModel.typesResponse,
        400: MaintenanceModel.errorResponse,
        401: MaintenanceModel.errorResponse,
        403: MaintenanceModel.errorResponse,
      },
    },
  )
  .get(
    "/vehicles",
    async ({ request, query, status }) => {
      try {
        return await MaintenanceService.listVehicles(request.headers, query.forOpen === "true");
      } catch (error) {
        const message = errorMessage(error, "Unable to list vehicles.");
        const code = resolveErrorCode(message);

        if (code === 401) {
          return status(401, errorBody(message));
        }

        if (code === 403) {
          return status(403, errorBody(message));
        }

        return status(400, errorBody(message));
      }
    },
    {
      query: MaintenanceModel.vehiclesQuery,
      response: {
        200: MaintenanceModel.vehiclesResponse,
        400: MaintenanceModel.errorResponse,
        401: MaintenanceModel.errorResponse,
        403: MaintenanceModel.errorResponse,
      },
    },
  )
  .post(
    "/",
    async ({ request, body, status }) => {
      try {
        return await MaintenanceService.open(request.headers, body);
      } catch (error) {
        const message = errorMessage(error, "Unable to open maintenance.");
        const code = resolveErrorCode(message);

        if (code === 401) {
          return status(401, errorBody(message));
        }

        if (code === 403) {
          return status(403, errorBody(message));
        }

        if (code === 404) {
          return status(404, errorBody(message));
        }

        if (code === 409) {
          return status(409, errorBody(message));
        }

        return status(400, errorBody(message));
      }
    },
    {
      body: MaintenanceModel.openBody,
      response: {
        200: MaintenanceModel.openResponse,
        400: MaintenanceModel.errorResponse,
        401: MaintenanceModel.errorResponse,
        403: MaintenanceModel.errorResponse,
        404: MaintenanceModel.errorResponse,
        409: MaintenanceModel.errorResponse,
      },
    },
  )
  .post(
    "/:id/close",
    async ({ request, params, body, status }) => {
      try {
        return await MaintenanceService.close(request.headers, params.id, body);
      } catch (error) {
        const message = errorMessage(error, "Unable to close maintenance.");
        const code = resolveErrorCode(message);

        if (code === 401) {
          return status(401, errorBody(message));
        }

        if (code === 403) {
          return status(403, errorBody(message));
        }

        if (code === 404) {
          return status(404, errorBody(message));
        }

        return status(400, errorBody(message));
      }
    },
    {
      params: MaintenanceModel.idParams,
      body: MaintenanceModel.closeBody,
      response: {
        200: MaintenanceModel.closeResponse,
        400: MaintenanceModel.errorResponse,
        401: MaintenanceModel.errorResponse,
        403: MaintenanceModel.errorResponse,
        404: MaintenanceModel.errorResponse,
      },
    },
  );
