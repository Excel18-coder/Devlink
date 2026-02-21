const _rawBase = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const API_BASE = _rawBase.endsWith("/api") ? _rawBase : `${_rawBase.replace(/\/$/, "")}/api`;

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

const getToken = () => localStorage.getItem("accessToken");

export const api = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  const { method = "GET", body, headers = {} } = options;
  const token = getToken();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (res.status === 401) {
    // Try refresh
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem("accessToken", data.accessToken);
        // Retry original request
        const retryRes = await fetch(`${API_BASE}${endpoint}`, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.accessToken}`,
            ...headers
          },
          body: body ? JSON.stringify(body) : undefined
        });
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
