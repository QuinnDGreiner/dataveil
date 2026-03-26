import { useEffect, useRef, useState } from "react";

interface Props {
  enabledCategories: string[];
  totalCategories: number;
  recentActivity: number;
  servicesProtected: number;
}

function calcScore(enabled: number, total: number, activity: number, services: number): number {
  const categoryScore = total > 0 ? (enabled / total) * 40 : 0;
  const activityScore = Math.min(activity / 10, 1) * 30;
  const serviceScore = Math.min(services / 3, 1) * 30;
  return Math.round(categoryScore + activityScore + serviceScore);
}

function grade(score: number): { letter: string; color: string } {
  if (score >= 90) return { letter: "A", color: "#ffffff" };
  if (score >= 75) return { letter: "B", color: "#cccccc" };
  if (score >= 60) return { letter: "C", color: "#888888" };
  if (score >= 40) return { letter: "D", color: "#ff3b3b" };
  return { letter: "F", color: "#ff3b3b" };
}

export default function PrivacyScore({ enabledCategories, totalCategories, recentActivity, servicesProtected }: Props) {
  const target = calcScore(enabledCategories.length, totalCategories, recentActivity, servicesProtected);
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number>();
  const startRef = useRef<number>();

  useEffect(() => {
    startRef.current = undefined;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / 1000, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current!);
  }, [target]);

  const { letter, color } = grade(displayed);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = (displayed / 100) * circumference;

  return (
    <div className="bg-[#111] border border-[#222] rounded-2xl p-6 flex items-center gap-6">
      <div className="relative flex-shrink-0">
        <svg width="128" height="128" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#222" strokeWidth="8" />
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            transform="rotate(-90 64 64)"
            style={{ transition: "stroke 0.3s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold" style={{ color }}>{letter}</span>
          <span className="text-xs text-[#777] font-mono">{displayed}</span>
        </div>
      </div>

      <div className="flex-1">
        <div className="text-sm font-semibold text-white mb-1">Privacy Score</div>
        <div className="text-xs text-[#888] mb-4">Based on your current protection settings</div>
        <div className="space-y-2">
          <ScoreRow label="Categories active" value={enabledCategories.length} max={totalCategories} pts={40} />
          <ScoreRow label="Recent activity" value={Math.min(recentActivity, 10)} max={10} pts={30} />
          <ScoreRow label="Services covered" value={Math.min(servicesProtected, 3)} max={3} pts={30} />
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, value, max, pts }: { label: string; value: number; max: number; pts: number }) {
  const pct = max > 0 ? value / max : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-[#888] mb-1">
        <span>{label}</span>
        <span className="font-mono text-[#aaa]">{Math.round(pct * pts)}/{pts}pts</span>
      </div>
      <div className="h-1 bg-[#222] rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-all duration-700"
          style={{ width: `${pct * 100}%`, opacity: 0.5 + pct * 0.5 }}
        />
      </div>
    </div>
  );
}
