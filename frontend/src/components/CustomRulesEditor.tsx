import { useState } from "react";

export interface CustomRule {
  id: string;
  label: string;
  pattern: string;
  placeholder: string;
}

interface Props {
  rules: CustomRule[];
  onChange: (rules: CustomRule[]) => void;
}

export default function CustomRulesEditor({ rules, onChange }: Props) {
  const [label, setLabel] = useState("");
  const [pattern, setPattern] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [error, setError] = useState("");

  const add = () => {
    setError("");
    if (!label.trim() || !pattern.trim()) {
      setError("Name and pattern are required.");
      return;
    }
    try {
      new RegExp(pattern);
    } catch {
      setError("Invalid regex pattern.");
      return;
    }
    const newRule: CustomRule = {
      id: crypto.randomUUID(),
      label: label.trim(),
      pattern: pattern.trim(),
      placeholder: placeholder.trim() || `[${label.trim().toUpperCase()} REDACTED]`,
    };
    onChange([...rules, newRule]);
    setLabel("");
    setPattern("");
    setPlaceholder("");
  };

  const remove = (id: string) => onChange(rules.filter((r) => r.id !== id));

  const inputClass = "w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#444] transition font-mono placeholder-[#444]";

  return (
    <div>
      {rules.length > 0 && (
        <div className="space-y-2 mb-4">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between bg-[#0d0d0d] border border-[#222] rounded-lg px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-white">{r.label}</div>
                <div className="text-xs text-[#888] font-mono mt-0.5">{r.pattern}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#666] font-mono">{r.placeholder}</span>
                <button
                  onClick={() => remove(r.id)}
                  className="text-[#555] hover:text-[#ff3b3b] transition text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#0d0d0d] border border-[#222] rounded-xl p-4">
        <div className="text-xs text-[#777] uppercase tracking-widest mb-3">Add custom rule</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-xs text-[#888] block mb-1">Name</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Employee ID" className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-[#888] block mb-1">Regex pattern</label>
            <input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder={`e.g. EMP-\\d{6}`} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-[#888] block mb-1">Replacement (optional)</label>
            <input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} placeholder="e.g. [EMPLOYEE ID]" className={inputClass} />
          </div>
        </div>
        {error && <p className="text-xs text-[#ff3b3b] mb-3">{error}</p>}
        <button
          onClick={add}
          className="text-sm font-semibold text-black bg-white hover:bg-[#eee] px-4 py-2 rounded-lg transition"
        >
          + Add rule
        </button>
      </div>
    </div>
  );
}
