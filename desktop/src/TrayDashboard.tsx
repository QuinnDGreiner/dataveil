import { useEffect, useRef, useState } from "react";
import { open } from "@tauri-apps/api/shell";
import { sendNotification } from "@tauri-apps/api/notification";
import { fetchStats, fetchRecentLogs, type Stats, type LogEntry } from "./api";

const POLL_INTERVAL_MS = 90_000;
const DASHBOARD_URL = "https://app.dataveil.com/dashboard";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function TrayDashboard() {
  const [token, setToken] = useState(() => localStorage.getItem("dv_api_token") || "");
  const [tokenInput, setTokenInput] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const prevBlockedRef = useRef<number | null>(null);

  const authed = !!token;

  const load = async () => {
    try {
      const [s, l] = await Promise.all([fetchStats(), fetchRecentLogs(3)]);

      // Fire native notification if new redactions since last poll
      if (prevBlockedRef.current !== null && s.blocked_today > prevBlockedRef.current) {
        const diff = s.blocked_today - prevBlockedRef.current;
        try {
          sendNotification({
            title: "Dataveil",
            body: `Blocked ${diff} item${diff !== 1 ? "s" : ""} in your last prompt`,
          });
        } catch { /* notifications may be denied */ }
      }
      prevBlockedRef.current = s.blocked_today;

      setStats(s);
      setLogs(l);
      setLastSynced(new Date());
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Connection error");
    }
  };

  useEffect(() => {
    if (!authed) return;
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [authed]);

  if (!authed) {
    return (
      <div style={{ padding: "24px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 22 }}>🛡</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Dataveil</span>
        </div>
        <p style={{ color: "#888", fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
          Enter your API token to connect. Find it in Settings → API Token.
        </p>
        <input
          type="password"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && tokenInput.trim()) {
              localStorage.setItem("dv_api_token", tokenInput.trim());
              setToken(tokenInput.trim());
            }
          }}
          placeholder="Paste API token…"
          style={{
            width: "100%", background: "#111", border: "1px solid #2a2a2a",
            color: "#fff", borderRadius: 8, padding: "9px 12px",
            fontSize: 12, fontFamily: "monospace", outline: "none",
            marginBottom: 10,
          }}
        />
        <button
          onClick={() => {
            if (!tokenInput.trim()) return;
            localStorage.setItem("dv_api_token", tokenInput.trim());
            setToken(tokenInput.trim());
          }}
          style={{
            width: "100%", background: "#fff", color: "#000",
            border: "none", borderRadius: 8, padding: "9px 0",
            fontWeight: 600, fontSize: 12, cursor: "pointer",
          }}
        >
          Connect
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #111", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🛡</span>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Dataveil</span>
        </div>
        <div style={{ fontSize: 10, color: "#444" }}>
          {lastSynced ? `Synced ${timeAgo(lastSynced.toISOString())}` : "Connecting…"}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "14px 14px 6px" }}>
        <StatCard num={stats?.blocked_today ?? "–"} label="Blocked today" danger />
        <StatCard num={stats?.prompts_scanned ?? "–"} label="Prompts scanned" />
      </div>

      {/* Recent logs */}
      <div style={{ flex: 1, padding: "6px 12px 12px", overflow: "hidden" }}>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", padding: "8px 4px 6px" }}>
          Recent
        </div>
        {error && (
          <div style={{ color: "#ff3b3b", fontSize: 11, padding: "8px 4px" }}>{error}</div>
        )}
        {!error && logs.length === 0 && (
          <div style={{ color: "#555", fontSize: 11, textAlign: "center", padding: 16 }}>No activity yet</div>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 10px", borderRadius: 8, background: "#0a0a0a",
              border: "1px solid #0f0f0f", marginBottom: 4,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#ccc" }}>{log.service}</div>
              <div style={{ fontSize: 9, color: "#555", marginTop: 2, fontFamily: "monospace" }}>
                {timeAgo(log.created_at)}
              </div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#ff3b3b", fontFamily: "monospace" }}>
              -{log.redaction_count}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid #0f0f0f", display: "flex", gap: 6 }}>
        <button
          onClick={() => {
            localStorage.removeItem("dv_api_token");
            setToken("");
            setStats(null);
            setLogs([]);
          }}
          style={{
            flex: 1, padding: "8px 0", border: "1px solid #2a2a2a",
            borderRadius: 8, background: "#1a1a1a", color: "#aaa",
            fontSize: 11, fontWeight: 600, cursor: "pointer",
          }}
        >
          Sign out
        </button>
        <button
          onClick={() => open(DASHBOARD_URL)}
          style={{
            flex: 2, padding: "8px 0", border: "none",
            borderRadius: 8, background: "#fff", color: "#000",
            fontSize: 11, fontWeight: 600, cursor: "pointer",
          }}
        >
          Dashboard →
        </button>
      </div>
    </div>
  );
}

function StatCard({ num, label, danger }: { num: number | string; label: string; danger?: boolean }) {
  return (
    <div style={{
      background: "#111", border: "1px solid #1e1e1e", borderRadius: 12,
      padding: "14px", textAlign: "center",
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: danger ? "#ff3b3b" : "#fff", fontVariantNumeric: "tabular-nums" }}>
        {num}
      </div>
      <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>
        {label}
      </div>
    </div>
  );
}
