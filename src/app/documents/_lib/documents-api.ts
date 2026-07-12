import type {
  DocumentEntityTypeUi,
  DocumentRowUi,
  MaintenanceLogOptionUi,
  VehicleOptionUi,
} from "@/app/documents/_types/documents-ui";

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

export async function fetchDocuments(filters?: {
  entityId?: string;
  entityType?: DocumentEntityTypeUi | "";
}): Promise<DocumentRowUi[]> {
  const params = new URLSearchParams();

  if (filters?.entityType) {
    params.set("entityType", filters.entityType);
  }

  if (filters?.entityId?.trim()) {
    params.set("entityId", filters.entityId.trim());
  }

  const query = params.toString();
  const response = await fetch(`/api/documents${query ? `?${query}` : ""}`, {
    credentials: "include",
  });
  const data = await parseJson<{ items: DocumentRowUi[] }>(response);
  return data.items;
}

export async function fetchDocumentVehicles(): Promise<VehicleOptionUi[]> {
  const response = await fetch("/api/documents/vehicles", { credentials: "include" });
  const data = await parseJson<{ items: VehicleOptionUi[] }>(response);
  return data.items;
}

export async function fetchDocumentMaintenanceLogs(): Promise<MaintenanceLogOptionUi[]> {
  const response = await fetch("/api/documents/maintenance-logs", { credentials: "include" });
  const data = await parseJson<{ items: MaintenanceLogOptionUi[] }>(response);
  return data.items;
}

export async function uploadDocument(input: {
  entityId: string;
  entityType: DocumentEntityTypeUi;
  file: File;
}): Promise<DocumentRowUi> {
  const form = new FormData();
  form.set("entityType", input.entityType);
  form.set("entityId", input.entityId);
  form.set("file", input.file);

  const response = await fetch("/api/documents/upload", {
    method: "POST",
    credentials: "include",
    body: form,
  });

  const data = await parseJson<{ document: DocumentRowUi }>(response);
  return data.document;
}

export async function softDeleteDocument(id: string): Promise<void> {
  const response = await fetch(`/api/documents/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  await parseJson(response);
}

export function documentDownloadUrl(id: string): string {
  return `/api/documents/${id}/file`;
}

export function formatBytes(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
    return "—";
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
