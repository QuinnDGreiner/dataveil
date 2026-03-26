import { useEffect, useState } from "react";
import { getSettings, updateSettings, getApiToken, regenerateApiToken } from "../lib/api";
import CustomRulesEditor, { type CustomRule } from "../components/CustomRulesEditor";
import KeywordsEditor from "../components/KeywordsEditor";
import ThemePicker from "../components/ThemePicker";
import { useTheme } from "../context/ThemeContext";

const ALL_CATEGORIES = [
  { id: "ssn",            label: "Social Security Number" },
  { id: "credit_card",    label: "Credit Card Number" },
  { id: "email",          label: "Email Address" },
  { id: "phone",          label: "Phone Number" },
  { id: "dob",            label: "Date of Birth" },
  { id: "passport",       label: "Passport / ID Number" },
  { id: "ip_address",     label: "IP Address" },
  { id: "street_address", label: "Street Address" },
];

type NotificationStyle = "badge" | "toast" | "sidebar";
type Plan = "free" | "pro" | "team";

const NOTIFICATION_OPTIONS: { id: NotificationStyle; label: string; desc: string }[] = [
  { id: "badge",   label: "Silent",  desc: "Only update the extension badge count. No interruptions." },
  { id: "toast",   label: "Toast",   desc: "A small popup appears briefly after each prompt is scrubbed." },
  { id: "sidebar", label: "Sidebar", desc: "A summary panel slides in after each prompt." },
];

export default function Settings() {
  const [enabled, setEnabled] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [notifStyle, setNotifStyle] = useState<NotificationStyle>("badge");
  const [incognito, setIncognito] = useState(false);
  const [plan, setPlan] = useState<Plan>("free");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { accent, setAccent } = useTheme();

  // Track which accordion sections are open
  const [open, setOpen] = useState<Record<string, boolean>>({
    protection: true,
    categories: true,
    keywords: false,
    custom_rules: false,
    notifications: false,
    incognito: false,
    theme: false,
    desktop: false,
  });

  const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    getSettings().then((s) => {
      setEnabled(s.enabled ?? true);
      setCategories(s.enabled_categories ?? []);
      setCustomRules(s.custom_rules ?? []);
      setKeywords(s.keywords ?? []);
      setNotifStyle(s.notification_style ?? "badge");
      setIncognito(s.incognito ?? false);
      setPlan(s.plan ?? "free");
      if (s.theme_accent) setAccent(s.theme_accent);
    });
  }, []);

  const toggleCategory = (id: string) =>
    setCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const save = async () => {
    setSaving(true);
    await updateSettings({
      enabled,
      enabled_categories: categories,
      custom_rules: customRules,
      keywords,
      notification_style: notifStyle,
      incognito,
      theme_accent: accent,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white mb-1">Settings</h1>
        <p className="text-[#888] text-sm">Customize your protection preferences</p>
      </div>

      {/* Protection */}
      <Accordion title="Protection" desc="Master on/off switch for all PII scrubbing." open={open.protection} onToggle={() => toggle("protection")}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#888]">Enable Dataveil</span>
          <Toggle checked={enabled} onChange={setEnabled} />
        </div>
      </Accordion>

      {/* PII Categories */}
      <Accordion title="PII Categories" desc="Choose which types of personal data are automatically redacted." open={open.categories} onToggle={() => toggle("categories")}>
        <div className="space-y-3">
          {ALL_CATEGORIES.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between">
              <span className="text-sm text-[#aaa]">{cat.label}</span>
              <Toggle checked={categories.includes(cat.id)} onChange={() => toggleCategory(cat.id)} disabled={!enabled} />
            </div>
          ))}
        </div>
      </Accordion>

      {/* Protected Keywords */}
      <Accordion title="Protected Keywords" desc="Add specific words or phrases to always redact — company names, project codenames, internal IDs." open={open.keywords} onToggle={() => toggle("keywords")}>
        <KeywordsEditor keywords={keywords} onChange={setKeywords} />
      </Accordion>

      {/* Custom Rules */}
      <Accordion title="Custom Rules" desc="Define your own regex patterns for advanced redaction needs." open={open.custom_rules} onToggle={() => toggle("custom_rules")}>
        <CustomRulesEditor rules={customRules} onChange={setCustomRules} />
      </Accordion>

      {/* Notifications */}
      <Accordion title="Notifications" desc="How should the extension alert you when PII is detected?" open={open.notifications} onToggle={() => toggle("notifications")}>
        <div className="space-y-2">
          {NOTIFICATION_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setNotifStyle(opt.id)}
              className={`w-full text-left p-4 rounded-xl border transition ${
                notifStyle === opt.id
                  ? "border-[var(--accent)] bg-[var(--accent-dim)]"
                  : "border-[#242424] bg-[#141414] hover:border-[#333]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${notifStyle === opt.id ? "text-accent" : "text-white"}`}>
                  {opt.label}
                </span>
                {notifStyle === opt.id && <span className="text-accent text-xs">✓</span>}
              </div>
              <p className="text-xs text-[#888] mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>
      </Accordion>

      {/* Incognito */}
      <Accordion title="Incognito Mode" desc="Scrubs your prompts but never logs anything — 100% local." open={open.incognito} onToggle={() => toggle("incognito")}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-[#888]">Enable incognito mode</span>
            {plan === "free" && (
              <div className="text-xs text-[#999] mt-0.5">Pro feature — <a href="/billing" className="underline hover:text-white transition">upgrade to unlock</a></div>
            )}
          </div>
          <Toggle checked={incognito} onChange={setIncognito} disabled={plan === "free"} />
        </div>
      </Accordion>

      {/* Free tier notice */}
      {plan === "free" && (
        <div className="bg-[#111] border border-[#242424] rounded-2xl p-5 mb-3">
          <div className="text-xs text-[#aaa] font-semibold mb-1">Free plan — ChatGPT only</div>
          <p className="text-xs text-[#888]">
            Upgrade to Pro to protect Claude, Gemini, Copilot, Grok, Perplexity, and more.
          </p>
          <a href="/billing" className="inline-block mt-3 text-xs text-white border border-[#2a2a2a] px-3 py-1.5 rounded-lg hover:border-[#444] transition">
            Upgrade to Pro →
          </a>
        </div>
      )}

      {/* Theme */}
      <Accordion title="Theme" desc="Choose an accent color for your dashboard." open={open.theme} onToggle={() => toggle("theme")}>
        <ThemePicker />
      </Accordion>

      {/* Desktop App */}
      <Accordion title="Desktop App" desc="API token for the Dataveil system tray app." open={open.desktop} onToggle={() => toggle("desktop")}>
        <ApiTokenSection />
      </Accordion>

      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-[#eee] transition disabled:opacity-50 mt-2"
      >
        {saved ? "Saved ✓" : saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}

function ApiTokenSection() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    getApiToken().then(setToken).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const copy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regen = async () => {
    if (!confirm("This will invalidate your current token and disconnect any active desktop app. Continue?")) return;
    setRegenerating(true);
    try {
      const t = await regenerateApiToken();
      setToken(t);
      setRevealed(true);
    } catch {}
    setRegenerating(false);
  };

  const masked = token ? `dv_${token.slice(0, 6)}${"•".repeat(28)}` : "";

  return (
    <div>
      <p className="text-xs text-[#888] mb-4 leading-relaxed">
        Use this token to connect the Dataveil desktop tray app. Treat it like a password — it grants read access to your stats and logs.
      </p>
      {loading ? (
        <div className="h-10 bg-[#1a1a1a] rounded-lg animate-pulse" />
      ) : (
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 font-mono text-xs text-[#aaa] truncate select-all">
            {revealed ? token : masked}
          </div>
          <button
            onClick={() => setRevealed((v) => !v)}
            className="px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#444] rounded-lg text-xs transition"
          >
            {revealed ? "Hide" : "Show"}
          </button>
          <button
            onClick={copy}
            className="px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#444] rounded-lg text-xs transition"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
      )}
      <button
        onClick={regen}
        disabled={regenerating || loading}
        className="text-xs text-[#555] hover:text-[#ff3b3b] transition disabled:opacity-30"
      >
        {regenerating ? "Regenerating…" : "Regenerate token →"}
      </button>
    </div>
  );
}

function Accordion({
  title, desc, open, onToggle, children,
}: {
  title: string; desc: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-[#111] border border-[#222] rounded-2xl mb-3 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#111] transition"
      >
        <div>
          <div className="font-semibold text-white text-sm">{title}</div>
          <div className="text-xs text-[#777] mt-0.5">{desc}</div>
        </div>
        <span className={`text-[#888] text-xs ml-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-[#222]">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}

function Toggle({
  checked, onChange, disabled = false,
}: {
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
      } ${checked && !disabled ? "bg-white" : "bg-[#222]"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow transition-transform ${
          checked ? "translate-x-5 bg-black" : "bg-[#666]"
        }`}
      />
    </button>
  );
}
