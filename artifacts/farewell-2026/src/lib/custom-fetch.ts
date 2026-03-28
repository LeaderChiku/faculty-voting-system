export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type AuthTokenGetter =
  | (() => Promise<string | null>)
  | (() => string | null);

const NO_BODY_STATUS = new Set([204, 205, 304]);

// 🔥 BASE URL (FINAL)
let _baseUrl: string | null = null;

export function setBaseUrl(url: string | null): void {
  _baseUrl = url ? url.replace(/\/+$/, "") : null;
}

// 🔐 AUTH TOKEN (optional)
let _authTokenGetter: AuthTokenGetter | null = null;

export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  _authTokenGetter = getter;
}

// ---------------- HELPERS ----------------

function isRequest(input: RequestInfo | URL): input is Request {
  return typeof Request !== "undefined" && input instanceof Request;
}

function isUrl(input: RequestInfo | URL): input is URL {
  return typeof URL !== "undefined" && input instanceof URL;
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (isUrl(input)) return input.toString();
  return input.url;
}

function resolveMethod(
  input: RequestInfo | URL,
  explicitMethod?: string,
): string {
  if (explicitMethod) return explicitMethod.toUpperCase();
  if (isRequest(input)) return input.method.toUpperCase();
  return "GET";
}

// 🔥 APPLY BASE URL FIX
function applyBaseUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (!_baseUrl) return input;

  const url = resolveUrl(input);

  // only relative URLs (/api/...)
  if (!url.startsWith("/")) return input;

  const fullUrl = `${_baseUrl}${url}`;

  if (typeof input === "string") return fullUrl;
  if (isUrl(input)) return new URL(fullUrl);
  return new Request(fullUrl, input as Request);
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>): Headers {
  const headers = new Headers();

  for (const source of sources) {
    if (!source) continue;
    new Headers(source).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
}

function hasNoBody(response: Response, method: string): boolean {
  if (method === "HEAD") return true;
  if (NO_BODY_STATUS.has(response.status)) return true;
  if (response.headers.get("content-length") === "0") return true;
  if (response.body === null) return true;
  return false;
}

async function parseJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// ---------------- ERROR CLASS ----------------

export class ApiError<T = unknown> extends Error {
  readonly status: number;
  readonly data: T | null;

  constructor(response: Response, data: T | null) {
    super(`HTTP ${response.status}`);
    this.status = response.status;
    this.data = data;
  }
}

// ---------------- MAIN FETCH ----------------

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  options: CustomFetchOptions = {},
): Promise<T> {
  // 🔥 APPLY BASE URL
  input = applyBaseUrl(input);

  const { responseType = "auto", headers: headersInit, ...init } = options;

  const method = resolveMethod(input, init.method);

  const headers = mergeHeaders(
    isRequest(input) ? input.headers : undefined,
    headersInit,
  );

  // 🔐 attach token if exists
  if (_authTokenGetter && !headers.has("authorization")) {
    const token = await _authTokenGetter();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  // 🔥 FINAL FETCH
  const response = await fetch(input, {
    ...init,
    method,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {}
    throw new ApiError(response, errorData);
  }

  if (hasNoBody(response, method)) return null as T;

  if (responseType === "text") return (await response.text()) as T;

  return (await parseJsonBody(response)) as T;
}