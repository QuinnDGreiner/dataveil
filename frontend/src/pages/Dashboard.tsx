import { useEffect, useState } from "react";
import { getLogs } from "../lib/api";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import AnimatedCounter from "../components/AnimatedCounter";
import PrivacyScore from "../components/PrivacyScore";
import BreachChecker from "../components/BreachChecker";
import ActivityHeatmap from "../components/ActivityHeatmap";
import { getSettings } from "../lib/api";

interface LogEntry {
  id: string;
  timestamp: string;
  service: string;
  total_redactions: number;
  categories: { id: string; count: number }[];
}

const ALL_CATEGORIES = ["ssn","credit_card","email","phone","dob","passport","ip_address","street_address"];

function SkeletonRow() {
  return (
    <tr className="border-b border-[#1a1a1a]">
      {[1,2,3].map(i => (
        <td key={i} className="px-5 py-4">
          <div className="h-3 bg-[#1a1a1a] rounded animate-pulse" style={{ width: `${40 + i * 18}%` }} />
        </td>
      ))}
    </tr>
  );
}

function LogRow({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr
        className="border-b border-[#1a1a1a] hover:bg-[#161616] transition cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-5 py-4 text-[#888] font-mono text-xs">{format(new Date(log.timestamp), "MMM d, HH:mm")}</td>
        <td className="px-5 py-4">
          <span className="text-xs font-semibold text-[#ccc] bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-1 rounded-md">{log.service}</span>
        </td>
        <td className="px-5 py-4 font-bold text-accent font-mono text-sm">-{log.total_redactions}</td>
        <td className="px-5 py-4 text-[#555] text-xs text-right">
          <span className={`transition-transform inline-block ${expanded ? "rotate-180" : ""}`}>▾</span>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-[#1a1a1a] bg-[#111]">
          <td colSpan={4} className="px-5 py-3">
            <div className="flex flex-wrap gap-1.5">
              {log.categories.length > 0 ? log.categories.map((c) => (
                <span key={c.id} className="text-xs font-mono text-[#aaa] bg-[#0d0d0d] border border-[#222] px-2 py-1 rounded">
                  {c.id} ×{c.count}
                </span>
              )) : <span className="text-xs text-[#666]">No categories</span>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function Dashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [enabledCategories, setEnabledCategories] = useState<string[]>(ALL_CATEGORIES);

  useEffect(() => {
    getSettings().then((s) => setEnabledCategories(s.enabled_categories ?? ALL_CATEGORIES)).catch(() => {});
    getLogs(1).then((d) => setAllLogs(d.items)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    getLogs(page)
      .then((data) => { setLogs(data.items); setTotal(data.total); })
      .finally(() => setLoading(false));
  }, [page]);

  const totalRedactions = logs.reduce((s, l) => s + l.total_redactions, 0);
  const servicesUsed = new Set(logs.map((l) => l.service)).size;
  const recentLogs = logs.filter((l) => Date.now() - new Date(l.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000);

  const chartData = Object.entries(
    logs.reduce<Record<string, number>>((acc, l) => {
      acc[l.service] = (acc[l.service] ?? 0) + l.total_redactions;
      return acc;
    }, {})
  ).map(([service, count]) => ({ service, count })).sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Privacy Dashboard</h1>
        <p className="text-[#888] text-sm">Your AI data protection summary</p>
      </div>

      {/* Breach checker */}
      <div className="mb-4">
        <BreachChecker />
      </div>

      {/* Privacy score + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <PrivacyScore
            enabledCategories={enabledCategories}
            totalCategories={ALL_CATEGORIES.length}
            recentActivity={recentLogs.length}
            servicesProtected={servicesUsed}
          />
        </div>
        <div className="flex flex-col gap-4">
          {[
            { label: "PII blocked", value: totalRedactions, color: "text-accent" },
            { label: "Prompts scanned", value: logs.length, color: "text-white" },
          ].map((s) => (
            <div key={s.label} className="bg-[#111] border border-[#222] rounded-2xl p-5 flex-1">
              <div className={`text-4xl font-extrabold mb-1.5 ${s.color}`}>
                <AnimatedCounter target={s.value} />
              </div>
              <div className="text-sm text-[#777] uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="mb-6">
        <ActivityHeatmap logs={allLogs} />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-[#111] border border-[#222] rounded-2xl p-5 mb-6">
          <div className="text-sm text-[#888] uppercase tracking-widest mb-5">Redactions by AI service</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData} barSize={26}>
              <XAxis dataKey="service" tick={{ fill: "#777", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip cursor={{ fill: "#1a1a1a" }} contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#aaa" }} itemStyle={{ color: "#fff" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.service} fill={entry.count === maxCount ? "var(--accent)" : "#222"} stroke={entry.count === maxCount ? "var(--accent)" : "#2a2a2a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Audit log */}
      <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e1e1e] flex justify-between items-center">
          <div className="text-sm font-semibold text-white">Audit Log</div>
          <span className="text-xs text-[#666]">{total} entries</span>
        </div>

        {logs.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4 opacity-20">🛡</div>
            <p className="text-[#888] text-sm">No activity yet.</p>
            <p className="text-[#666] text-xs mt-1">Install the browser extension to start protecting your AI prompts.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#666] text-xs uppercase tracking-widest border-b border-[#1e1e1e]">
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Blocked</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : logs.map((log) => <LogRow key={log.id} log={log} />)
              }
            </tbody>
          </table>
        )}

        {total > 20 && (
          <div className="px-5 py-4 flex gap-2 justify-end border-t border-[#1e1e1e]">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-xs text-[#aaa] disabled:opacity-30 hover:border-[#444] transition">← Prev</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total} className="px-4 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-xs text-[#aaa] disabled:opacity-30 hover:border-[#444] transition">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
