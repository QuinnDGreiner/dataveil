import { useNavigate } from "react-router-dom";
import LiveScanner from "../components/LiveScanner";
import HeroAnimation from "../components/HeroAnimation";
import AnimatedCounter from "../components/AnimatedCounter";

const AI_SERVICES = ["ChatGPT", "Claude", "Gemini", "Copilot", "Grok", "Perplexity", "Llama", "Mistral"];

const STATS = [
  { value: 4200000000, suffix: "+", label: "Records exposed in AI data incidents" },
  { value: 68, suffix: "%", label: "Of users share PII with AI without realizing" },
  { value: 12, suffix: "s", label: "Average time before a leaked SSN is misused" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "You type a prompt", desc: "Write a message to any AI — ChatGPT, Claude, Gemini, Copilot, or any other model." },
  { step: "02", title: "Dataveil intercepts", desc: "Before the prompt leaves your device, our extension scans for names, SSNs, emails, cards, and more." },
  { step: "03", title: "Clean prompt sent", desc: "Only the scrubbed version reaches the AI. Same answer — zero personal data exposed." },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur border-b border-[#222]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡</span>
            <span className="font-bold text-sm tracking-tight text-white">Dataveil</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#how" className="text-sm text-[#999] hover:text-white transition">How it works</a>
            <a href="#pricing" className="text-sm text-[#999] hover:text-white transition">Pricing</a>
            <button onClick={() => navigate("/login")} className="text-sm text-white border border-[#333] hover:border-[#666] px-4 py-2 rounded-lg transition">
              Sign in
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#161616] border border-[#2a2a2a] rounded-full px-4 py-1.5 text-sm text-[#aaa] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
              Every AI model. Every prompt. Protected.
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tighter leading-none mb-6 text-white">
              Your AI prompts<br />
              <span className="text-[#555]">shouldn't expose</span><br />
              your identity.
            </h1>
            <p className="text-[#999] text-base max-w-md mb-8 leading-relaxed">
              Dataveil silently strips your personal data before it leaves your device — across every AI tool you use. Same answers. Zero exposure.
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {AI_SERVICES.map((s) => (
                <span key={s} className="text-sm text-[#777] border border-[#2a2a2a] rounded-full px-3 py-1">{s}</span>
              ))}
              <span className="text-sm text-[#555] border border-[#222] rounded-full px-3 py-1">+ more</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#" className="flex items-center justify-center gap-2 bg-white text-black font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[#eee] transition">
                Add to Chrome — Free
              </a>
              <a href="#demo" className="flex items-center justify-center text-sm text-[#aaa] hover:text-white border border-[#333] hover:border-[#555] px-6 py-3 rounded-xl transition">
                See it live ↓
              </a>
            </div>
          </div>

          <div>
            <HeroAnimation />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-[#1e1e1e]">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-12 text-center">
          {STATS.map((s, i) => (
            <div key={i}>
              <div className="text-4xl font-extrabold text-white mb-2">
                <AnimatedCounter target={s.value} duration={1800} suffix={s.suffix} />
              </div>
              <div className="text-sm text-[#777] leading-relaxed max-w-[160px] mx-auto">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Demo */}
      <section id="demo" className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold mb-3 text-white">Try it right now</h2>
          <p className="text-[#888] text-sm">No signup needed. Type anything — see your data get caught before it could reach any AI.</p>
        </div>
        <LiveScanner />
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6 border-t border-[#1e1e1e]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">How it works</h2>
          <p className="text-center text-[#777] text-sm mb-16">Works across every major AI model. No configuration needed.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="bg-[#111] border border-[#222] rounded-2xl p-6">
                <div className="text-[#2a2a2a] text-4xl font-black mb-4 font-mono">{step.step}</div>
                <h3 className="font-semibold text-white mb-2 text-sm">{step.title}</h3>
                <p className="text-[#888] text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 border-t border-[#1e1e1e]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">Pricing</h2>
          <p className="text-center text-[#777] text-sm mb-16">Start free. Upgrade when you need more.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                name: "Free",
                price: "$0",
                desc: "Personal use",
                bullets: ["ChatGPT protection", "Core PII categories", "7-day history"],
                note: "ChatGPT only",
                cta: "Add to Chrome",
                highlight: false,
              },
              {
                name: "Pro",
                price: "$9",
                per: "/mo",
                desc: "All AI models covered",
                bullets: ["All AI models", "Custom keywords + rules", "Unlimited history + incognito"],
                note: null,
                cta: "Get Pro",
                highlight: true,
              },
              {
                name: "Team",
                price: "$29",
                per: "/mo",
                desc: "For small teams",
                bullets: ["Everything in Pro", "Up to 10 seats", "Admin dashboard + exports"],
                note: null,
                cta: "Get Team",
                highlight: false,
              },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-6 flex flex-col border ${plan.highlight ? "bg-white text-black border-white" : "bg-[#111] text-white border-[#222]"}`}>
                <div className={`font-bold text-xs uppercase tracking-widest mb-1 ${plan.highlight ? "opacity-40" : "text-[#666]"}`}>{plan.name}</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  {plan.per && <span className={`text-sm mb-1 ${plan.highlight ? "opacity-40" : "text-[#666]"}`}>{plan.per}</span>}
                </div>
                <div className={`text-sm mb-1 ${plan.highlight ? "text-black/50" : "text-[#888]"}`}>{plan.desc}</div>
                {plan.note && <div className="text-xs text-[#999] mb-4 font-mono">{plan.note}</div>}
                {!plan.note && <div className="mb-4" />}
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.bullets.map((b) => (
                    <li key={b} className={`flex items-start gap-2 text-sm ${plan.highlight ? "text-black" : "text-[#aaa]"}`}>
                      <span className={`mt-0.5 ${plan.highlight ? "text-black/40" : "text-[#555]"}`}>–</span> {b}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate("/login")} className={`w-full py-2.5 rounded-xl font-semibold text-sm transition ${plan.highlight ? "bg-black text-white hover:bg-[#111]" : "bg-[#1a1a1a] text-white hover:bg-[#222] border border-[#333]"}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-[#1e1e1e] text-center">
        <h2 className="text-4xl font-extrabold mb-4 text-white">Your data. Your rules.</h2>
        <p className="text-[#888] mb-8 max-w-sm mx-auto text-sm">Works with every AI model. Installs in 30 seconds. Free to start.</p>
        <a href="#" className="inline-flex items-center gap-2 bg-white text-black font-semibold text-sm px-8 py-3 rounded-xl hover:bg-[#eee] transition">
          Add to Chrome — Free
        </a>
      </section>

      <footer className="border-t border-[#1e1e1e] py-8 px-6 text-center text-sm text-[#555]">
        © 2026 Dataveil. Your prompts never touch our servers.
      </footer>
    </div>
  );
}
