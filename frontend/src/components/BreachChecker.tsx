import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Breach {
  Name: string;
  BreachDate: string;
  DataClasses: string[];
}

export default function BreachChecker() {
  const [breaches, setBreaches] = useState<Breach[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setLoading(false); return; }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/security/breach-check`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setBreaches(data.breaches ?? []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  if (loading) return (
    <div className="bg-[#111] border border-[#222] rounded-2xl p-4 animate-pulse flex items-center gap-3">
      <div className="h-3 bg-[#222] rounded w-1/4" />
      <div className="h-3 bg-[#1a1a1a] rounded w-1/3" />
    </div>
  );

  if (error || breaches === null) return null;

  if (breaches.length === 0) return (
    <div className="bg-[#111] border border-[#222] rounded-2xl p-4 flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center flex-shrink-0">
        <span className="text-[#aaa] text-xs">✓</span>
      </div>
      <div>
        <span className="text-sm font-semibold text-white">No known breaches</span>
        <span className="text-sm text-[#666] ml-2">— your email wasn't found in any major data breaches.</span>
      </div>
    </div>
  );

  return (
    <div className="bg-[#111] border border-[#ff3b3b44] rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[#ff3b3b] text-lg">⚠</span>
        <div>
          <div className="text-sm font-semibold text-white">
            Your email was found in {breaches.length} breach{breaches.length !== 1 ? "es" : ""}
          </div>
          <div className="text-xs text-[#888] mt-0.5">This is why protecting your PII with AI tools matters.</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {breaches.slice(0, 6).map((b) => (
          <div key={b.Name} className="bg-[#1a0000] border border-[#ff3b3b22] rounded-lg px-3 py-1.5">
            <div className="text-xs font-semibold text-[#ff3b3b99]">{b.Name}</div>
            <div className="text-xs text-[#666]">{b.BreachDate?.slice(0, 4)}</div>
          </div>
        ))}
        {breaches.length > 6 && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 flex items-center">
            <span className="text-xs text-[#888]">+{breaches.length - 6} more</span>
          </div>
        )}
      </div>
    </div>
  );
}
