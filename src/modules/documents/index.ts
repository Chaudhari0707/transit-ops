import { Elysia, t } from "elysia";

import { errorMessage, resolveErrorCodeNumber } from "@/lib/api/errors";
import { DocumentsModel } from "@/modules/documents/model";
import { DocumentsService } from "@/modules/documents/service";

function errorBody(message: string) {
  return { message };
}

const idParams = t.Object({
  id: t.String({ format: "uuid" }),
});

export const documentsModule = new Elysia({
  name: "documents",
  prefix: "/documents",
})
  .get(
    "/",
    async ({ request, query, status }) => {
      try {
        return await DocumentsService.list(request.headers, {
          entityType: query.entityType,
          entityId: query.entityId,
        });
      } catch (error) {
        const message = errorMessage(error, "Unable to list documents.");
        const code = resolveErrorCodeNumber(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      query: DocumentsModel.listQuery,
      response: {
        200: DocumentsModel.listResponse,
        400: DocumentsModel.errorResponse,
        401: DocumentsModel.errorResponse,
        403: DocumentsModel.errorResponse,
      },
    },
  )
  .get(
    "/vehicles",
    async ({ request, status }) => {
      try {
        return await DocumentsService.listVehicles(request.headers);
      } catch (error) {
        const message = errorMessage(error, "Unable to list vehicles.");
        const code = resolveErrorCodeNumber(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      response: {
        200: DocumentsModel.vehiclesResponse,
        400: DocumentsModel.errorResponse,
        401: DocumentsModel.errorResponse,
        403: DocumentsModel.errorResponse,
      },
    },
  )
  .get(
    "/maintenance-logs",
    async ({ request, status }) => {
      try {
        return await DocumentsService.listMaintenanceLogs(request.headers);
      } catch (error) {
        const message = errorMessage(error, "Unable to list maintenance logs.");
        const code = resolveErrorCodeNumber(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      response: {
        200: DocumentsModel.maintenanceLogsResponse,
        400: DocumentsModel.errorResponse,
        401: DocumentsModel.errorResponse,
        403: DocumentsModel.errorResponse,
      },
    },
  )
  .post(
    "/upload",
    async ({ request, body, status }) => {
      try {
        return await DocumentsService.upload(request.headers, {
          entityType: body.entityType,
          entityId: body.entityId,
          file: body.file,
        });
      } catch (error) {
        const message = errorMessage(error, "Unable to upload document.");
        const code = resolveErrorCodeNumber(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        if (code === 404) return status(404, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      body: DocumentsModel.uploadBody,
      response: {
        200: DocumentsModel.uploadResponse,
        400: DocumentsModel.errorResponse,
        401: DocumentsModel.errorResponse,
        403: DocumentsModel.errorResponse,
        404: DocumentsModel.errorResponse,
      },
    },
  )
  .delete(
    "/:id",
    async ({ request, params, status }) => {
      try {
        return await DocumentsService.softDelete(request.headers, params.id);
      } catch (error) {
        const message = errorMessage(error, "Unable to delete document.");
        const code = resolveErrorCodeNumber(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        if (code === 404) return status(404, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      params: idParams,
      response: {
        200: DocumentsModel.deleteResponse,
        400: DocumentsModel.errorResponse,
        401: DocumentsModel.errorResponse,
        403: DocumentsModel.errorResponse,
        404: DocumentsModel.errorResponse,
      },
    },
  )
  .get(
    "/:id/file",
    async ({ request, params, status, set }) => {
      try {
        const result = await DocumentsService.getFile(request.headers, params.id);
        set.headers["content-type"] = result.mimeType;
        set.headers["content-disposition"] =
          `inline; filename="${result.fileName.replace(/"/g, "")}"`;
        return result.file;
      } catch (error) {
        const message = errorMessage(error, "Unable to download document.");
        const code = resolveErrorCodeNumber(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        if (code === 404) return status(404, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      params: idParams,
      response: {
        400: DocumentsModel.errorResponse,
        401: DocumentsModel.errorResponse,
        403: DocumentsModel.errorResponse,
        404: DocumentsModel.errorResponse,
      },
    },
  );
