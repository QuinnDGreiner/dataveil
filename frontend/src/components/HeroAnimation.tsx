import { useEffect, useState } from "react";

const PROMPTS = [
  {
    text: "Help me write an email. My name is Sarah Mitchell, my SSN is 492-38-1029 and I need to update my bank at sarah.mitchell@gmail.com",
    pii: [
      { start: 34, end: 48, label: "NAME" },
      { start: 57, end: 69, label: "SSN" },
      { start: 104, end: 131, label: "EMAIL" },
    ],
  },
  {
    text: "Draft a complaint letter. I'm John Lee at 142 Oak Street, my card ending in 4111 1111 1111 1111 was charged wrongly.",
    pii: [
      { start: 27, end: 35, label: "NAME" },
      { start: 39, end: 55, label: "ADDRESS" },
      { start: 75, end: 95, label: "CARD" },
    ],
  },
  {
    text: "Summarize this for my doctor. DOB: 07/14/1985, patient ID A8234521, phone (555) 867-5309.",
    pii: [
      { start: 35, end: 45, label: "DOB" },
      { start: 58, end: 66, label: "ID" },
      { start: 75, end: 89, label: "PHONE" },
    ],
  },
];

type Phase = "typing" | "detecting" | "redacting" | "done" | "clearing";

export default function HeroAnimation() {
  const [promptIdx, setPromptIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const [typed, setTyped] = useState(0);
  const [redacted, setRedacted] = useState(false);

  const prompt = PROMPTS[promptIdx];

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (typed < prompt.text.length) {
        timeout = setTimeout(() => setTyped((t) => t + 1), 28);
      } else {
        timeout = setTimeout(() => setPhase("detecting"), 600);
      }
    } else if (phase === "detecting") {
      timeout = setTimeout(() => setPhase("redacting"), 800);
    } else if (phase === "redacting") {
      setRedacted(true);
      timeout = setTimeout(() => setPhase("done"), 1000);
    } else if (phase === "done") {
      timeout = setTimeout(() => setPhase("clearing"), 2800);
    } else if (phase === "clearing") {
      setTyped(0);
      setRedacted(false);
      setPromptIdx((i) => (i + 1) % PROMPTS.length);
      setPhase("typing");
    }

    return () => clearTimeout(timeout);
  }, [phase, typed, prompt.text.length]);

  const renderText = () => {
    const visible = prompt.text.slice(0, typed);
    if (phase === "typing" || phase === "detecting") {
      return (
        <>
          <span className="text-[#ccc]">{visible}</span>
          {phase === "typing" && <span className="inline-block w-0.5 h-4 bg-white animate-pulse align-middle ml-0.5" />}
        </>
      );
    }

    const parts: { text: string; type: "normal" | "highlight" | "redacted"; label?: string }[] = [];
    let cursor = 0;
    for (const pii of prompt.pii) {
      if (cursor < pii.start) parts.push({ text: prompt.text.slice(cursor, pii.start), type: "normal" });
      if (redacted) {
        parts.push({ text: `[${pii.label} REDACTED]`, type: "redacted", label: pii.label });
      } else {
        parts.push({ text: prompt.text.slice(pii.start, pii.end), type: "highlight", label: pii.label });
      }
      cursor = pii.end;
    }
    if (cursor < prompt.text.length) parts.push({ text: prompt.text.slice(cursor), type: "normal" });

    return (
      <>
        {parts.map((p, i) => {
          if (p.type === "normal") return <span key={i} className="text-[#ccc]">{p.text}</span>;
          if (p.type === "highlight") return (
            <span key={i} className="bg-[#1a0000] text-[#ff3b3b] rounded px-0.5 transition-all duration-300">{p.text}</span>
          );
          return (
            <span key={i} className="bg-[#1a1a1a] text-[#888] rounded px-1 text-xs font-mono border border-[#333] transition-all duration-500">{p.text}</span>
          );
        })}
      </>
    );
  };

  const detectedCount = phase === "detecting" || phase === "redacting" || phase === "done" ? prompt.pii.length : 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="border border-[#222] rounded-2xl overflow-hidden bg-[#111]">
        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-[#1e1e1e] flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff3b3b]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#333]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#333]" />
          </div>
          <span className="text-[#777] text-xs font-mono flex-1">chatgpt.com</span>
          <div className={`flex items-center gap-1.5 text-xs font-mono transition-opacity duration-300 ${detectedCount > 0 ? "opacity-100" : "opacity-0"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff3b3b]" />
            <span className={`${redacted ? "text-[#888]" : "text-[#ff3b3b]"}`}>
              {redacted ? `${detectedCount} items blocked` : `${detectedCount} detected`}
            </span>
          </div>
        </div>

        {/* Prompt area */}
        <div className="p-5 min-h-[100px] text-sm leading-relaxed font-mono">
          {renderText()}
        </div>

        {/* Status bar */}
        <div className="px-5 py-3 border-t border-[#1e1e1e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#777] text-xs">🛡 Dataveil</span>
            <span className={`text-xs font-mono transition-all duration-300 ${
              phase === "detecting" ? "text-[#ff3b3b]" :
              redacted ? "text-[#888]" : "text-[#555]"
            }`}>
              {phase === "typing" ? "scanning…" :
               phase === "detecting" ? `⚠ ${detectedCount} PII found` :
               redacted ? `✓ cleaned` : ""}
            </span>
          </div>
          <span className="text-[#666] text-xs font-mono">
            {["ChatGPT", "Claude", "Gemini", "Copilot", "Perplexity"][promptIdx % 5]}
          </span>
        </div>
      </div>
    </div>
  );
}
