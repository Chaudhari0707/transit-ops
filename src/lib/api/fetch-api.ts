export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ErrorPayload = {
  message?: string;
};

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as ErrorPayload;

  if (!response.ok) {
    throw new ApiError(response.status, payload.message ?? `Request failed (${response.status})`);
  }

  return payload as T;
}
