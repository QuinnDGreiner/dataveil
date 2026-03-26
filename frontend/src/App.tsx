import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { ThemeProvider } from "./context/ThemeContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import Onboarding from "./pages/Onboarding";

function AuthGuard({ children, skipOnboarding }: { children: React.ReactNode; skipOnboarding?: boolean }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && !skipOnboarding && !localStorage.getItem("dv_onboarded")) {
      navigate("/onboarding", { replace: true });
    }
  }, [session, skipOnboarding, navigate]);

  if (session === undefined) return null;
  if (!session) return <LoginPage />;
  if (!skipOnboarding && !localStorage.getItem("dv_onboarded")) return null;
  return <>{children}</>;
}

function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setMessage("");
    if (!email || !password) { setError("Email and password are required."); return; }
    if (mode === "signup" && password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    if (mode === "signin") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) setError(err.message);
      else setMessage("Account created! Check your email to confirm, then sign in.");
    }
    setLoading(false);
  };

  const inputClass = "w-full bg-[#111] border border-[#222] text-white rounded-xl px-4 py-3 text-sm mb-3 outline-none focus:border-[#444] transition placeholder-[#333] font-mono";

  const pwStrength = (() => {
    if (!password || mode !== "signup") return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const pwColors = ["#ff3b3b", "#ff3b3b", "#ff9500", "#ffcc00", "#ffffff", "#ffffff"];
  const pwLabels = ["", "Weak", "Weak", "Fair", "Strong", "Strong"];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">🛡</span>
          <h1 className="text-xl font-bold text-white mt-4 mb-1">Dataveil</h1>
          <p className="text-[#444] text-sm">{mode === "signin" ? "Sign in to your dashboard" : "Create your account"}</p>
        </div>
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
          {message ? (
            <div className="text-center">
              <div className="text-2xl mb-3">✉</div>
              <p className="text-white text-sm font-semibold mb-1">{message}</p>
              <button onClick={() => { setMessage(""); setMode("signin"); }} className="text-xs text-[#555] hover:text-white mt-3 transition">← Back to sign in</button>
            </div>
          ) : (
            <>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputClass} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={inputClass} />
              {mode === "signup" && password && (
                <div className="mb-3 -mt-1">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ background: i <= pwStrength ? pwColors[pwStrength] : "#1a1a1a" }} />
                    ))}
                  </div>
                  {pwStrength > 0 && <div className="text-xs font-mono" style={{ color: pwColors[pwStrength] }}>{pwLabels[pwStrength]}</div>}
                </div>
              )}
              {mode === "signup" && (
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" className={inputClass} />
              )}
              <input type="text" onKeyDown={(e) => e.key === "Enter" && submit()} className="hidden" readOnly />
              {error && <p className="text-[#ff3b3b] text-xs mb-3">{error}</p>}
              <button onClick={submit} disabled={loading} className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#eee] transition disabled:opacity-50">
                {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </>
          )}
        </div>
        <p className="text-center text-xs text-[#333] mt-4">
          {mode === "signin" ? (
            <>No account?{" "}<button onClick={() => { setMode("signup"); setError(""); }} className="text-[#666] hover:text-white transition">Sign up</button></>
          ) : (
            <>Have an account?{" "}<button onClick={() => { setMode("signin"); setError(""); }} className="text-[#666] hover:text-white transition">Sign in</button></>
          )}
        </p>
        <p className="text-center text-xs text-[#222] mt-2">
          <a href="/" className="hover:text-[#555] transition">← Back to home</a>
        </p>
      </div>
    </div>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition ${
      isActive ? "bg-[#1a1a1a] text-white border border-[#333]" : "text-[#888] hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <nav className="sticky top-0 z-40 bg-[#0d0d0d]/90 backdrop-blur border-b border-[#1a1a1a] px-6 py-4 flex items-center gap-3">
        <a href="/" className="text-base mr-3">🛡</a>
        <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
        <NavLink to="/settings" className={navClass}>Settings</NavLink>
        <NavLink to="/billing" className={navClass}>Billing</NavLink>
        <button
          onClick={() => supabase.auth.signOut()}
          className="ml-auto text-xs text-[#666] hover:text-white transition"
        >
          Sign out
        </button>
      </nav>
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/onboarding"
            element={<AuthGuard skipOnboarding><Onboarding /></AuthGuard>}
          />
          <Route
            path="/dashboard"
            element={<AuthGuard><AppLayout><Dashboard /></AppLayout></AuthGuard>}
          />
          <Route
            path="/settings"
            element={<AuthGuard><AppLayout><Settings /></AppLayout></AuthGuard>}
          />
          <Route
            path="/billing"
            element={<AuthGuard><AppLayout><Billing /></AppLayout></AuthGuard>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
