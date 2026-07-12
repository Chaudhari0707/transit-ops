import { Elysia } from "elysia";

import { errorMessage, resolveErrorCode } from "@/modules/auth/_lib/session";
import { FuelExpensesModel } from "@/modules/fuel-expenses/model";
import { FuelExpensesService } from "@/modules/fuel-expenses/service";

function errorBody(message: string) {
  return { message };
}

export const fuelExpensesModule = new Elysia({
  name: "fuel-expenses",
  prefix: "/fuel-expenses",
})
  .get(
    "/fuel-logs",
    async ({ request, status }) => {
      try {
        return await FuelExpensesService.listFuelLogs(request.headers);
      } catch (error) {
        const message = errorMessage(error, "Unable to list fuel logs.");
        const code = resolveErrorCode(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      response: {
        200: FuelExpensesModel.fuelListResponse,
        400: FuelExpensesModel.errorResponse,
        401: FuelExpensesModel.errorResponse,
        403: FuelExpensesModel.errorResponse,
      },
    },
  )
  .post(
    "/fuel-logs",
    async ({ request, body, status }) => {
      try {
        return await FuelExpensesService.createFuelLog(request.headers, body);
      } catch (error) {
        const message = errorMessage(error, "Unable to create fuel log.");
        const code = resolveErrorCode(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        if (code === 404) return status(404, errorBody(message));
        if (code === 409) return status(409, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      body: FuelExpensesModel.fuelCreateBody,
      response: {
        200: FuelExpensesModel.fuelCreateResponse,
        400: FuelExpensesModel.errorResponse,
        401: FuelExpensesModel.errorResponse,
        403: FuelExpensesModel.errorResponse,
        404: FuelExpensesModel.errorResponse,
        409: FuelExpensesModel.errorResponse,
      },
    },
  )
  .get(
    "/expenses",
    async ({ request, status }) => {
      try {
        return await FuelExpensesService.listExpenses(request.headers);
      } catch (error) {
        const message = errorMessage(error, "Unable to list expenses.");
        const code = resolveErrorCode(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      response: {
        200: FuelExpensesModel.expenseListResponse,
        400: FuelExpensesModel.errorResponse,
        401: FuelExpensesModel.errorResponse,
        403: FuelExpensesModel.errorResponse,
      },
    },
  )
  .post(
    "/expenses",
    async ({ request, body, status }) => {
      try {
        return await FuelExpensesService.createExpense(request.headers, body);
      } catch (error) {
        const message = errorMessage(error, "Unable to create expense.");
        const code = resolveErrorCode(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        if (code === 404) return status(404, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      body: FuelExpensesModel.expenseCreateBody,
      response: {
        200: FuelExpensesModel.expenseCreateResponse,
        400: FuelExpensesModel.errorResponse,
        401: FuelExpensesModel.errorResponse,
        403: FuelExpensesModel.errorResponse,
        404: FuelExpensesModel.errorResponse,
      },
    },
  )
  .get(
    "/other-expenses",
    async ({ request, status }) => {
      try {
        return await FuelExpensesService.listOtherExpenseRows(request.headers);
      } catch (error) {
        const message = errorMessage(error, "Unable to list other expenses.");
        const code = resolveErrorCode(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      response: {
        200: FuelExpensesModel.otherExpensesResponse,
        400: FuelExpensesModel.errorResponse,
        401: FuelExpensesModel.errorResponse,
        403: FuelExpensesModel.errorResponse,
      },
    },
  )
  .get(
    "/summary",
    async ({ request, status }) => {
      try {
        return await FuelExpensesService.getSummary(request.headers);
      } catch (error) {
        const message = errorMessage(error, "Unable to load cost summary.");
        const code = resolveErrorCode(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      response: {
        200: FuelExpensesModel.summaryResponse,
        400: FuelExpensesModel.errorResponse,
        401: FuelExpensesModel.errorResponse,
        403: FuelExpensesModel.errorResponse,
      },
    },
  )
  .get(
    "/categories",
    async ({ request, status }) => {
      try {
        return await FuelExpensesService.listCategories(request.headers);
      } catch (error) {
        const message = errorMessage(error, "Unable to list categories.");
        const code = resolveErrorCode(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      response: {
        200: FuelExpensesModel.categoriesResponse,
        400: FuelExpensesModel.errorResponse,
        401: FuelExpensesModel.errorResponse,
        403: FuelExpensesModel.errorResponse,
      },
    },
  )
  .get(
    "/vehicles",
    async ({ request, status }) => {
      try {
        return await FuelExpensesService.listVehicles(request.headers);
      } catch (error) {
        const message = errorMessage(error, "Unable to list vehicles.");
        const code = resolveErrorCode(message);
        if (code === 401) return status(401, errorBody(message));
        if (code === 403) return status(403, errorBody(message));
        return status(400, errorBody(message));
      }
    },
    {
      response: {
        200: FuelExpensesModel.vehiclesResponse,
        400: FuelExpensesModel.errorResponse,
        401: FuelExpensesModel.errorResponse,
        403: FuelExpensesModel.errorResponse,
      },
    },
  );
