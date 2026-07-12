import { Elysia } from "elysia";

import { errorMessage, resolveErrorCode } from "@/modules/auth/_lib/session";
import { DriversModel } from "@/modules/drivers/model";
import { DriversService } from "@/modules/drivers/service";

function errorBody(message: string) {
  return { message };
}

export const driversModule = new Elysia({
  name: "drivers",
  prefix: "/drivers",
})
  .get(
    "/",
    async ({ request, query, status }) => {
      try {
        return await DriversService.list(request.headers, {
          status: query.status,
          licenseCompliance: query.licenseCompliance,
          search: query.search,
        });
      } catch (error) {
        const message = errorMessage(error, "Unable to list drivers.");
        const code = resolveErrorCode(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      query: DriversModel.listQuery,
      response: {
        200: DriversModel.listResponse,
        400: DriversModel.errorResponse,
        401: DriversModel.errorResponse,
        403: DriversModel.errorResponse,
      },
    },
  )
  .get(
    "/categories",
    async ({ request, status }) => {
      try {
        return await DriversService.listLicenseCategories(request.headers);
      } catch (error) {
        const message = errorMessage(error, "Unable to list license categories.");
        const code = resolveErrorCode(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      response: {
        200: DriversModel.categoriesResponse,
        400: DriversModel.errorResponse,
        401: DriversModel.errorResponse,
        403: DriversModel.errorResponse,
      },
    },
  )
  .get(
    "/:id",
    async ({ request, params, status }) => {
      try {
        return await DriversService.get(request.headers, params.id);
      } catch (error) {
        const message = errorMessage(error, "Unable to get driver.");
        const code = resolveErrorCode(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        if (code === 404) return status(404, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      params: DriversModel.idParams,
      response: {
        200: DriversModel.getResponse,
        400: DriversModel.errorResponse,
        401: DriversModel.errorResponse,
        403: DriversModel.errorResponse,
        404: DriversModel.errorResponse,
      },
    },
  )
  .post(
    "/",
    async ({ request, body, status }) => {
      try {
        return await DriversService.create(request.headers, body);
      } catch (error) {
        const message = errorMessage(error, "Unable to create driver.");
        const code = resolveErrorCode(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        if (code === 404) return status(404, errorBody(message));
        if (code === 409) return status(409, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      body: DriversModel.createBody,
      response: {
        200: DriversModel.mutateResponse,
        400: DriversModel.errorResponse,
        401: DriversModel.errorResponse,
        403: DriversModel.errorResponse,
        404: DriversModel.errorResponse,
        409: DriversModel.errorResponse,
      },
    },
  )
  .put(
    "/:id",
    async ({ request, params, body, status }) => {
      try {
        return await DriversService.update(request.headers, params.id, body);
      } catch (error) {
        const message = errorMessage(error, "Unable to update driver.");
        const code = resolveErrorCode(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        if (code === 404) return status(404, errorBody(message));
        if (code === 409) return status(409, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      params: DriversModel.idParams,
      body: DriversModel.updateBody,
      response: {
        200: DriversModel.mutateResponse,
        400: DriversModel.errorResponse,
        401: DriversModel.errorResponse,
        403: DriversModel.errorResponse,
        404: DriversModel.errorResponse,
        409: DriversModel.errorResponse,
      },
    },
  )
  .delete(
    "/:id",
    async ({ request, params, status }) => {
      try {
        return await DriversService.softDelete(request.headers, params.id);
      } catch (error) {
        const message = errorMessage(error, "Unable to delete driver.");
        const code = resolveErrorCode(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        if (code === 404) return status(404, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      params: DriversModel.idParams,
      response: {
        200: DriversModel.deleteResponse,
        400: DriversModel.errorResponse,
        401: DriversModel.errorResponse,
        403: DriversModel.errorResponse,
        404: DriversModel.errorResponse,
      },
    },
  );
