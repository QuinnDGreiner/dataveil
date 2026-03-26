import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateSettings } from "../lib/api";

const TOTAL_STEPS = 4;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState("");
  const [installed, setInstalled] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const finish = async () => {
    if (keywords.length > 0) {
      await updateSettings({ keywords }).catch(() => {});
    }
    localStorage.setItem("dv_onboarded", "1");
    navigate("/dashboard", { replace: true });
  };

  const addKeyword = () => {
    const v = kwInput.trim();
    if (!v || keywords.includes(v) || keywords.length >= 50) return;
    setKeywords((k) => [...k, v]);
    setKwInput("");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
      {/* Progress dots */}
      <div className="flex gap-2 mb-12">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i + 1 === step ? "w-6 h-2 bg-white" : i + 1 < step ? "w-2 h-2 bg-[#555]" : "w-2 h-2 bg-[#222]"
            }`}
          />
        ))}
      </div>

      <div className="w-full max-w-md">
        {step === 1 && <StepWelcome onNext={next} />}
        {step === 2 && <StepInstall installed={installed} setInstalled={setInstalled} onNext={next} onBack={back} />}
        {step === 3 && (
          <StepKeywords
            keywords={keywords}
            kwInput={kwInput}
            setKwInput={setKwInput}
            addKeyword={addKeyword}
            removeKeyword={(kw) => setKeywords((k) => k.filter((x) => x !== kw))}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 4 && <StepDone keywords={keywords} onFinish={finish} onBack={back} />}
      </div>
    </div>
  );
}

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="text-6xl mb-6">🛡</div>
      <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Welcome to Dataveil</h1>
      <p className="text-[#888] text-base leading-relaxed mb-10 max-w-sm mx-auto">
        Dataveil automatically strips your personal data from AI prompts before they leave your device. Your SSNs, emails, credit cards — gone before ChatGPT, Claude, or Gemini ever sees them.
      </p>
      <div className="grid grid-cols-3 gap-3 mb-10">
        {[
          { icon: "🔒", label: "100% local", desc: "Nothing leaves your device unprotected" },
          { icon: "⚡", label: "Instant", desc: "Scrubs in milliseconds — no delay" },
          { icon: "🎛", label: "Customizable", desc: "Your rules, your keywords" },
        ].map((f) => (
          <div key={f.label} className="bg-[#111] border border-[#222] rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">{f.icon}</div>
            <div className="text-xs font-semibold text-white mb-1">{f.label}</div>
            <div className="text-xs text-[#666]">{f.desc}</div>
          </div>
        ))}
      </div>
      <button onClick={onNext} className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#eee] transition">
        Let's get started →
      </button>
    </div>
  );
}

function StepInstall({
  installed, setInstalled, onNext, onBack,
}: {
  installed: boolean | null;
  setInstalled: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <button onClick={onBack} className="text-xs text-[#555] hover:text-white transition mb-8">← Back</button>
      <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Install the extension</h2>
      <p className="text-[#888] text-sm mb-8 leading-relaxed">
        The browser extension is what actually protects your prompts. It runs entirely in your browser — no data passes through our servers.
      </p>

      <div className="bg-[#111] border border-[#222] rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🛡</div>
          <div>
            <div className="font-semibold text-white text-sm">Dataveil for Chrome</div>
            <div className="text-xs text-[#777] mt-0.5">Also works in Edge, Brave, and other Chromium browsers</div>
          </div>
        </div>
        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-white text-black font-semibold py-2.5 rounded-xl text-sm hover:bg-[#eee] transition mb-3"
        >
          Add to Chrome — Free
        </a>
        <p className="text-xs text-[#555] text-center">Opens Chrome Web Store in a new tab</p>
      </div>

      <div className="mb-8">
        {installed === null ? (
          <button
            onClick={() => setInstalled(true)}
            className="w-full py-2.5 rounded-xl border border-[#2a2a2a] text-sm text-[#aaa] hover:border-[#444] hover:text-white transition"
          >
            ✓ I've installed it
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-[#0d1a0d] border border-[#1a3a1a] rounded-xl p-4">
            <span className="text-green-400 text-lg">✓</span>
            <div>
              <div className="text-sm font-semibold text-white">Extension installed</div>
              <div className="text-xs text-[#777] mt-0.5">You're protected on Chrome, Edge, and Brave</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={onNext} className="flex-1 bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#eee] transition">
          {installed ? "Next →" : "Skip for now →"}
        </button>
      </div>
    </div>
  );
}

function StepKeywords({
  keywords, kwInput, setKwInput, addKeyword, removeKeyword, onNext, onBack,
}: {
  keywords: string[];
  kwInput: string;
  setKwInput: (v: string) => void;
  addKeyword: () => void;
  removeKeyword: (kw: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <button onClick={onBack} className="text-xs text-[#555] hover:text-white transition mb-8">← Back</button>
      <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Protect your keywords</h2>
      <p className="text-[#888] text-sm mb-8 leading-relaxed">
        Add words or phrases you never want sent to an AI — your company name, project codenames, internal IDs. These are redacted automatically alongside SSNs and emails.
      </p>

      <div className="bg-[#111] border border-[#222] rounded-2xl p-5 mb-6">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={kwInput}
            onChange={(e) => setKwInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKeyword()}
            placeholder="e.g. Acme Corp, Project Apollo, EMP-ID"
            className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#444] transition placeholder-[#444] font-mono"
          />
          <button
            onClick={addKeyword}
            disabled={!kwInput.trim()}
            className="px-4 py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-[#eee] transition disabled:opacity-30"
          >
            Add
          </button>
        </div>

        {keywords.length === 0 ? (
          <p className="text-sm text-[#444]">No keywords yet — you can always add them later in Settings.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <span key={kw} className="inline-flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#ccc] text-xs font-mono rounded-lg px-3 py-1.5">
                {kw}
                <button onClick={() => removeKeyword(kw)} className="text-[#555] hover:text-[#ff3b3b] transition">✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={onNext} className="flex-1 bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#eee] transition">
          {keywords.length > 0 ? "Next →" : "Skip for now →"}
        </button>
      </div>
    </div>
  );
}

function StepDone({ keywords, onFinish, onBack }: { keywords: string[]; onFinish: () => void; onBack: () => void }) {
  return (
    <div className="text-center">
      <button onClick={onBack} className="text-xs text-[#555] hover:text-white transition mb-8 block">← Back</button>
      <div className="text-5xl mb-6">✓</div>
      <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">You're protected.</h2>
      <p className="text-[#888] text-sm mb-8 leading-relaxed max-w-sm mx-auto">
        Dataveil is active. Your personal data will be scrubbed from every AI prompt before it leaves your device.
      </p>

      <div className="bg-[#111] border border-[#222] rounded-2xl p-5 mb-8 text-left space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-[#555]">✓</span>
          <span className="text-sm text-[#aaa]">8 PII categories enabled (SSN, email, phone, and more)</span>
        </div>
        {keywords.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[#555]">✓</span>
            <span className="text-sm text-[#aaa]">{keywords.length} custom keyword{keywords.length !== 1 ? "s" : ""} added</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <span className="text-[#555]">✓</span>
          <span className="text-sm text-[#aaa]">Dashboard ready — track everything from Settings</span>
        </div>
      </div>

      <button onClick={onFinish} className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#eee] transition">
        Go to Dashboard →
      </button>
    </div>
  );
}
