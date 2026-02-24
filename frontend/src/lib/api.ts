const _rawBase = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
export const API_BASE = _rawBase.endsWith("/api") ? _rawBase : `${_rawBase.replace(/\/$/, "")}/api`;

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  /** Override the default 15 s abort timeout (ms). */
  timeout?: number;
}

const getToken = () => localStorage.getItem("accessToken");

// In-flight GET deduplication: same URL → share one fetch promise
const _inflight = new Map<string, Promise<unknown>>();

export const api = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  const { method = "GET", body, headers = {}, timeout = 15_000 } = options;
  const token = getToken();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const doFetch = (tok?: string) =>
    fetch(`${API_BASE}${endpoint}`, {
      method,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

  // Deduplicate concurrent identical GET requests so the network is hit once
  const dedupeKey = method === "GET" ? `${endpoint}::${token ?? "anon"}` : null;
  if (dedupeKey && _inflight.has(dedupeKey)) {
    clearTimeout(timer);
    return _inflight.get(dedupeKey) as Promise<T>;
  }

  const exec = async (): Promise<T> => {
    try {
      const res = await doFetch(token ?? undefined);

      if (res.status === 401) {
        // Try refresh
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            localStorage.setItem("accessToken", data.accessToken);
            const retryRes = await doFetch(data.accessToken);
            if (!retryRes.ok) {
              const err = await retryRes.json();
              throw new Error(err.message || "Request failed");
            }
            return retryRes.json();
          } else {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
          }
        }
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Request failed");
      }
      return res.json();
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        throw new Error("The server is taking too long to respond. Please try again.");
      }
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        throw new Error("Unable to reach the server. Check your connection and try again.");
      }
      throw err;
    } finally {
      clearTimeout(timer);
      if (dedupeKey) _inflight.delete(dedupeKey);
    }
  };

  const promise = exec() as Promise<unknown>;
  if (dedupeKey) _inflight.set(dedupeKey, promise);
  return promise as Promise<T>;
};


export const uploadFile = async <T = unknown>(endpoint: string, file: File, fieldName = "file"): Promise<T> => {
  const token = getToken();
  const formData = new FormData();
  formData.append(fieldName, file);
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Upload failed");
  }
  return res.json() as Promise<T>;
};

// Multipart form-data POST — for submissions with text fields + optional file
export const apiFormData = async <T = unknown>(endpoint: string, formData: FormData): Promise<T> => {
  const token = getToken();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }
  return res.json() as Promise<T>;
};
