import { QueryClient, QueryFunction } from "@tanstack/react-query";

export interface ApiErrorBody {
  code?: string;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  body?: ApiErrorBody;
  responseText: string;
  retryAfter?: number;

  constructor(options: {
    status: number;
    statusText: string;
    body?: ApiErrorBody;
    responseText: string;
    retryAfter?: number;
  }) {
    const bodyMessage = options.body?.message || options.body?.error || options.responseText || options.statusText;
    super(`${options.status}: ${bodyMessage}`);
    this.name = "ApiRequestError";
    this.status = options.status;
    this.code = options.body?.code;
    this.body = options.body;
    this.responseText = options.responseText;
    this.retryAfter = options.retryAfter;
  }
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;

  const seconds = Number.parseInt(value, 10);
  if (Number.isFinite(seconds) && seconds > 0) {
    return seconds;
  }

  const retryAt = Date.parse(value);
  if (!Number.isNaN(retryAt)) {
    return Math.max(1, Math.ceil((retryAt - Date.now()) / 1000));
  }

  return undefined;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let body: ApiErrorBody | undefined;

    try {
      const parsed = JSON.parse(text) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        body = parsed as ApiErrorBody;
      }
    } catch {
      body = undefined;
    }

    throw new ApiRequestError({
      status: res.status,
      statusText: res.statusText,
      body,
      responseText: text,
      retryAfter: parseRetryAfter(res.headers.get("Retry-After")),
    });
  }
}

export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);

  async function attachToken(forceRefresh = false) {
    try {
      const { FirebaseAuthService } = await import('@/lib/firebase');
      const idToken = await FirebaseAuthService.getIdToken(forceRefresh);
      if (idToken) {
        headers.set('Authorization', `Bearer ${idToken}`);
      }
    } catch {
      // Firebase may be unavailable on unauthenticated/public surfaces.
    }
  }

  async function attachAppCheck(forceRefresh = false) {
    try {
      const { FirebaseAuthService } = await import('@/lib/firebase');
      const appCheckToken = await FirebaseAuthService.getAppCheckToken(forceRefresh);
      if (appCheckToken) {
        headers.set('X-Firebase-AppCheck', appCheckToken);
      }
    } catch {
      // App Check is optional outside configured production surfaces.
    }
  }

  await attachAppCheck(false);
  await attachToken(false);

  const requestInit: RequestInit = {
    ...init,
    headers,
    credentials: init.credentials ?? "include",
  };

  let res = await fetch(url, requestInit);
  if (res.status === 401) {
    await attachAppCheck(true);
    await attachToken(true);
    res = await fetch(url, {
      ...requestInit,
      headers,
    });
  }

  return res;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (data) {
    headers.set("Content-Type", "application/json");
  }

  const res = await apiFetch(url, {
    ...init,
    method,
    headers,
    body: data ? JSON.stringify(data) : init.body,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await apiFetch(queryKey[0] as string);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
