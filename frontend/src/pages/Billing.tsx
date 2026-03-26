import { createCheckout } from "../lib/api";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    features: [
      "ChatGPT protection",
      "5 PII categories",
      "7-day audit log",
      "Basic consent controls",
    ],
    cta: "Current plan",
    disabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9/mo",
    features: [
      "All AI services",
      "12+ PII categories",
      "Unlimited audit log",
      "Advanced per-service controls",
      "Export reports",
    ],
    cta: "Upgrade to Pro",
    highlight: true,
    disabled: false,
  },
  {
    id: "team",
    name: "Team",
    price: "$29/mo",
    features: [
      "Everything in Pro",
      "Up to 10 seats",
      "Admin dashboard",
      "Compliance reports",
      "Priority support",
    ],
    cta: "Upgrade to Team",
    disabled: false,
  },
];

export default function Billing() {
  const upgrade = async (plan: string) => {
    const { url } = await createCheckout(plan);
    window.location.href = url;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">Plans & Billing</h1>
      <p className="text-slate-400 mb-8">
        Upgrade to protect more services and unlock full audit history.
      </p>

      <div className="grid grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl p-6 flex flex-col ${
              plan.highlight
                ? "bg-emerald-900/40 border-2 border-emerald-500"
                : "bg-slate-800 border border-slate-700"
            }`}
          >
            {plan.highlight && (
              <div className="text-xs font-bold text-emerald-400 uppercase mb-3">
                Most Popular
              </div>
            )}
            <div className="text-xl font-bold text-white">{plan.name}</div>
            <div className="text-3xl font-extrabold text-white mt-1 mb-4">{plan.price}</div>
            <ul className="space-y-2 flex-1 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="text-emerald-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => !plan.disabled && upgrade(plan.id)}
              disabled={plan.disabled}
              className={`w-full py-2 rounded-lg font-semibold text-sm transition ${
                plan.disabled
                  ? "bg-slate-700 text-slate-400 cursor-default"
                  : plan.highlight
                  ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-white"
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
