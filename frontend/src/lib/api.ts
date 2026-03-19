const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

export default API_BASE;

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  // Only set Content-Type automatically if caller didn’t pass FormData
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: options.credentials ?? "include",
  });
}
