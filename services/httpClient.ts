export interface ServiceError extends Error {
  status?: number;
  details?: unknown;
}

export const createServiceError = (
  message: string,
  status?: number,
  details?: unknown
): ServiceError => {
  const error = new Error(message) as ServiceError;
  error.status = status;
  error.details = details;
  return error;
};

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  options: RequestOptions = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const response = await fetch(input, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw createServiceError(
      payload?.error || payload?.message || "Request failed",
      response.status,
      payload
    );
  }

  return payload as T;
}
