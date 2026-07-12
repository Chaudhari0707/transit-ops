import type {
  DriverFormState,
  DriverUi,
  LicenseCategoryOption,
} from "@/app/drivers/_types/drivers-ui";

type ApiErrorBody = { message?: string };

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T | ApiErrorBody;

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return body as T;
}

export async function fetchDrivers(params?: {
  licenseCompliance?: string;
  search?: string;
  status?: string;
}): Promise<DriverUi[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.licenseCompliance) query.set("licenseCompliance", params.licenseCompliance);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const response = await fetch(`/api/drivers${qs ? `?${qs}` : ""}`, {
    credentials: "include",
  });
  const data = await parseJson<{ items: DriverUi[] }>(response);
  return data.items;
}

export async function fetchLicenseCategories(): Promise<LicenseCategoryOption[]> {
  const response = await fetch("/api/drivers/categories", { credentials: "include" });
  const data = await parseJson<{ items: LicenseCategoryOption[] }>(response);
  return data.items;
}

function formToBody(form: DriverFormState) {
  const score = form.safetyScore.trim() === "" ? 100 : Number(form.safetyScore);
  return {
    fullName: form.fullName.trim(),
    licenseNumber: form.licenseNumber.trim(),
    licenseCategoryId: form.licenseCategoryId,
    licenseExpiryDate: form.licenseExpiryDate,
    contactNumber: form.contactNumber.trim(),
    safetyScore: Number.isFinite(score) ? score : 100,
    status: form.status,
    notes: form.notes.trim() || null,
  };
}

export async function createDriver(form: DriverFormState): Promise<DriverUi> {
  const response = await fetch("/api/drivers", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formToBody(form)),
  });
  const data = await parseJson<{ driver: DriverUi }>(response);
  return data.driver;
}

export async function updateDriver(id: string, form: DriverFormState): Promise<DriverUi> {
  const response = await fetch(`/api/drivers/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formToBody(form)),
  });
  const data = await parseJson<{ driver: DriverUi }>(response);
  return data.driver;
}

export async function deleteDriver(id: string): Promise<void> {
  const response = await fetch(`/api/drivers/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  await parseJson(response);
}

export async function signInUser(email: string, password: string): Promise<void> {
  const response = await fetch("/api/auth/sign-in", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, password }),
  });
  if (!response.ok) {
    throw new Error("Sign-in failed. Use fleet_manager seed credentials.");
  }
}
