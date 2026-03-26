import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getLogs(page = 1, service?: string) {
  const headers = await authHeaders();
  const params = new URLSearchParams({ page: String(page), page_size: "20" });
  if (service) params.set("service", service);
  const res = await fetch(`${API_BASE}/logs?${params}`, { headers });
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}

export async function getSettings() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/settings`, { headers });
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export async function updateSettings(body: object) {
  const headers = { ...(await authHeaders()), "Content-Type": "application/json" };
  const res = await fetch(`${API_BASE}/settings`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}

export async function getApiToken(): Promise<string> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/settings/api-token`, { headers });
  if (!res.ok) throw new Error("Failed to fetch API token");
  const data = await res.json();
  return data.api_token;
}

export async function regenerateApiToken(): Promise<string> {
  const headers = { ...(await authHeaders()), "Content-Type": "application/json" };
  const res = await fetch(`${API_BASE}/settings/api-token/regenerate`, { method: "POST", headers });
  if (!res.ok) throw new Error("Failed to regenerate API token");
  const data = await res.json();
  return data.api_token;
}

export async function createCheckout(plan: string) {
  const headers = { ...(await authHeaders()), "Content-Type": "application/json" };
  const res = await fetch(`${API_BASE}/billing/checkout?plan=${plan}`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error("Failed to create checkout");
  return res.json();
}
