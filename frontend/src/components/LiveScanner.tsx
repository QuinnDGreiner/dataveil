import { useState, useEffect, useRef } from "react";

const PII_PATTERNS = [
  { id: "ssn",         label: "SSN",          pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { id: "email",       label: "Email",         pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g },
  { id: "phone",       label: "Phone",         pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },
  { id: "credit_card", label: "Credit Card",   pattern: /\b(?:\d[ -]?){13,16}\b/g },
  { id: "dob",         label: "Date of Birth", pattern: /\b(?:0?[1-9]|1[0-2])[\/\-](?:0?[1-9]|[12]\d|3[01])[\/\-](?:19|20)\d{2}\b/g },
  { id: "ip",          label: "IP Address",    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
];

interface DetectedItem {
  label: string;
  value: string;
  start: number;
  end: number;
}

function detectPII(text: string): DetectedItem[] {
  const items: DetectedItem[] = [];
  for (const p of PII_PATTERNS) {
    p.pattern.lastIndex = 0;
    let m;
    while ((m = p.pattern.exec(text)) !== null) {
      items.push({ label: p.label, value: m[0], start: m.index, end: m.index + m[0].length });
    }
    p.pattern.lastIndex = 0;
  }
  return items.sort((a, b) => a.start - b.start);
}

const PLACEHOLDER_PROMPTS = [
  "Hi, I'm Sarah Johnson. My SSN is 492-38-1029 and I need help with my taxes.",
  "Can you send the report to mike.chen@company.com? His DOB is 07/14/1985.",
  "My card number is 4111 1111 1111 1111, expiry 09/27, CVV 382.",
  "Call me at (555) 867-5309 or reach me at john.doe@gmail.com",
  "The server IP is 192.168.10.42 — please don't share this externally.",
];

export default function LiveScanner() {
  const [text, setText] = useState("");
  const [detected, setDetected] = useState<DetectedItem[]>([]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const t = setInterval(() => {
      if (!text) setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_PROMPTS.length);
    }, 3000);
    return () => clearInterval(t);
  }, [text]);

  const handleChange = (val: string) => {
    setText(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDetected(detectPII(val));
    }, 200);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="border border-[#222] rounded-2xl overflow-hidden bg-[#111]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff3b3b]" />
            <span className="w-3 h-3 rounded-full bg-[#333]" />
            <span className="w-3 h-3 rounded-full bg-[#333]" />
          </div>
          <span className="text-sm text-[#888] font-mono">ai-prompt-scanner — live demo</span>
        </div>

        {/* Input */}
        <div className="p-5">
          <div className="text-xs text-[#777] mb-2 font-mono uppercase tracking-widest">
            Your prompt
          </div>
          <textarea
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={PLACEHOLDER_PROMPTS[placeholderIdx]}
            rows={4}
            className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-white resize-none outline-none focus:border-[#444] transition font-mono placeholder-[#444]"
          />
        </div>

        {/* Detection Results */}
        {detected.length > 0 && (
          <div className="px-5 pb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#ff3b3b] text-xs font-bold uppercase tracking-widest">
                ⚠ {detected.length} {detected.length === 1 ? "item" : "items"} detected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {detected.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-[#1a0000] border border-[#ff3b3b33] rounded-lg px-3 py-2"
                >
                  <span className="text-[#ff3b3b] text-xs font-bold">{d.label}</span>
                  <span className="text-[#888] text-xs font-mono line-through">{d.value}</span>
                  <span className="text-[#555] text-xs">→</span>
                  <span className="text-[#aaa] text-xs font-mono">[REDACTED]</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Redacted output */}
        {text && (
          <div className="px-5 pb-5">
            <div className="border-t border-[#1e1e1e] pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-[#777] font-mono uppercase tracking-widest">
                  {detected.length > 0 ? "What AI receives" : "What AI receives (no PII found)"}
                </div>
                {detected.length === 0 && text && (
                  <span className="text-xs text-[#888] font-mono">✓ Clean</span>
                )}
              </div>
              <div className="bg-[#0d0d0d] border border-[#222] rounded-lg px-4 py-3 text-sm font-mono leading-relaxed">
                {detected.length === 0 ? (
                  <span className="text-[#aaa]">{text || "…"}</span>
                ) : (
                  <RedactedDisplay text={text} detected={detected} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!text && (
          <div className="px-5 pb-5 text-center">
            <p className="text-sm text-[#555] font-mono">
              ↑ type anything above — emails, SSNs, phone numbers, credit cards…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RedactedDisplay({ text, detected }: { text: string; detected: DetectedItem[] }) {
  const parts: { text: string; redacted: boolean; label?: string }[] = [];
  let cursor = 0;
  for (const d of detected) {
    if (cursor < d.start) parts.push({ text: text.slice(cursor, d.start), redacted: false });
    parts.push({ text: d.value, redacted: true, label: d.label });
    cursor = d.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), redacted: false });

  return (
    <>
      {parts.map((p, i) =>
        p.redacted ? (
          <span
            key={i}
            className="inline-block bg-[#1a0000] border border-[#ff3b3b22] text-[#ff3b3b88] rounded px-1 mx-0.5 text-xs"
          >
            [{p.label} REDACTED]
          </span>
        ) : (
          <span key={i} className="text-[#aaa]">{p.text}</span>
        )
      )}
    </>
  );
}
