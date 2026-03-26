import { useState } from "react";
import { format, subDays, startOfDay } from "date-fns";

interface DayData {
  date: Date;
  prompts: number;
  redactions: number;
}

interface Props {
  logs: { timestamp: string; total_redactions: number }[];
}

export default function ActivityHeatmap({ logs }: Props) {
  const [tooltip, setTooltip] = useState<{ day: DayData; x: number; y: number } | null>(null);

  // Build a map of date → counts
  const today = startOfDay(new Date());
  const days: DayData[] = Array.from({ length: 91 }, (_, i) => {
    const date = startOfDay(subDays(today, 90 - i));
    const dayLogs = logs.filter((l) => {
      const d = startOfDay(new Date(l.timestamp));
      return d.getTime() === date.getTime();
    });
    return {
      date,
      prompts: dayLogs.length,
      redactions: dayLogs.reduce((s, l) => s + l.total_redactions, 0),
    };
  });

  // Split into 13 weeks × 7 days
  const weeks: DayData[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const maxPrompts = Math.max(...days.map((d) => d.prompts), 1);

  const cellColor = (prompts: number) => {
    if (prompts === 0) return "#0f0f0f";
    const intensity = Math.min(prompts / maxPrompts, 1);
    const value = Math.round(40 + intensity * 215);
    return `rgb(${value},${value},${value})`;
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 relative">
      <div className="text-xs text-[#444] uppercase tracking-widest mb-4">Activity — last 13 weeks</div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                className="w-3 h-3 rounded-sm cursor-pointer transition-all duration-150 hover:ring-1 hover:ring-white/20"
                style={{ background: cellColor(day.prompts) }}
                onMouseEnter={(e) => {
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  const parent = (e.target as HTMLElement).closest(".relative")!.getBoundingClientRect();
                  setTooltip({ day, x: rect.left - parent.left, y: rect.top - parent.top });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[#333] text-xs">Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <div key={v} className="w-3 h-3 rounded-sm" style={{ background: cellColor(v * maxPrompts) }} />
        ))}
        <span className="text-[#333] text-xs">More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-10 bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs pointer-events-none"
          style={{ left: tooltip.x + 16, top: tooltip.y - 8 }}
        >
          <div className="text-white font-semibold">{format(tooltip.day.date, "MMM d, yyyy")}</div>
          <div className="text-[#666] mt-0.5">
            {tooltip.day.prompts} prompt{tooltip.day.prompts !== 1 ? "s" : ""} · {tooltip.day.redactions} redactions
          </div>
        </div>
      )}
    </div>
  );
}
