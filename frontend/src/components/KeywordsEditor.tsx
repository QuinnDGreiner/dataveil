import { useState } from "react";

const MAX_KEYWORDS = 50;
const MAX_KEYWORD_LENGTH = 40;

interface Props {
  keywords: string[];
  onChange: (keywords: string[]) => void;
}

export default function KeywordsEditor({ keywords, onChange }: Props) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const add = () => {
    const value = input.trim();
    if (!value) return;
    if (value.length > MAX_KEYWORD_LENGTH) {
      setError(`Max ${MAX_KEYWORD_LENGTH} characters per keyword.`);
      return;
    }
    if (keywords.length >= MAX_KEYWORDS) {
      setError(`Max ${MAX_KEYWORDS} keywords allowed.`);
      return;
    }
    if (keywords.some((k) => k.toLowerCase() === value.toLowerCase())) {
      setError("That keyword is already added.");
      return;
    }
    onChange([...keywords, value]);
    setInput("");
    setError("");
  };

  const remove = (kw: string) => onChange(keywords.filter((k) => k !== kw));

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="e.g. Acme Corp, Project Falcon"
          maxLength={MAX_KEYWORD_LENGTH}
          className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#444] transition placeholder-[#444] font-mono"
        />
        <button
          onClick={add}
          disabled={!input.trim() || keywords.length >= MAX_KEYWORDS}
          className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaa] hover:text-white hover:border-[#444] rounded-lg text-sm font-semibold transition disabled:opacity-30"
        >
          Add
        </button>
      </div>

      {error && <p className="text-[#ff3b3b] text-xs mb-3">{error}</p>}

      {keywords.length === 0 ? (
        <p className="text-sm text-[#555]">No keywords added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#ccc] text-xs font-mono rounded-lg px-3 py-1.5"
            >
              {kw}
              <button
                onClick={() => remove(kw)}
                className="text-[#666] hover:text-[#ff3b3b] transition leading-none"
                aria-label={`Remove ${kw}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-[#444] mt-3">{keywords.length}/{MAX_KEYWORDS} keywords</p>
    </div>
  );
}
