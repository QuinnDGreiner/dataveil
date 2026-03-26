const API_BASE = "https://api.dataveil.com";

function getToken(): string {
  return localStorage.getItem("dv_api_token") || "";
}

function headers(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export interface Stats {
  blocked_today: number;
  prompts_scanned: number;
}

export interface LogEntry {
  id: string;
  service: string;
  redaction_count: number;
  created_at: string;
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/stats`, { headers: headers() });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function fetchRecentLogs(limit = 3): Promise<LogEntry[]> {
  const res = await fetch(`${API_BASE}/logs?limit=${limit}`, { headers: headers() });
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return data.logs ?? [];
}
