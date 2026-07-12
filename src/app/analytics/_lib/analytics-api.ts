import type { AnalyticsReportUi } from "@/app/analytics/_types/analytics-ui";

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

export async function fetchAnalyticsReport(): Promise<AnalyticsReportUi> {
  const response = await fetch("/api/analytics/report", { credentials: "include" });
  return parseJson<AnalyticsReportUi>(response);
}

export async function exportAnalyticsCsv(): Promise<{ csv: string; filename: string }> {
  const response = await fetch("/api/analytics/export", { credentials: "include" });
  return parseJson<{ csv: string; filename: string }>(response);
}

export function downloadCsvFile(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
