import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

const ADMIN_ROLES = ["super_admin", "admin", "sales"];

export default function LoginPage({ variant = "admin" }) {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login(email.trim(), password);

      if (!res.ok) {
        toast.error(res.error || "Autentificare eșuată");
        return;
      }

      toast.success("Autentificare reușită");

      if (ADMIN_ROLES.includes(res.user.role)) {
        nav("/admin/dashboard");
      } else {
        nav("/app/azi");
      }
    } catch (error) {
      toast.error("A apărut o eroare. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex bg-aj-cream"
      data-testid="login-page"
    >
      {/* Panou branding desktop */}
      <div className="relative hidden lg:flex lg:w-[52%] overflow-hidden bg-[#071525] text-white p-14 xl:p-20 flex-col justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(204,166,92,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(204,166,92,0.08),transparent_32%)]" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-aj-gold/40 to-transparent" />

        <div className="relative z-10">
          <img
            src="/logo-artjunkie.png"
            alt="ART JUNKIE"
            className="w-full max-w-[360px] h-auto object-contain"
          />
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 uppercase tracking-[0.32em] text-aj-gold text-xs font-semibold mb-5">
            <Sparkles size={14} />
            Sistem intern ART JUNKIE
          </div>

          <h1 className="text-4xl xl:text-6xl font-extrabold leading-[1.05] tracking-tight">
            Toată activitatea firmei,
            <span className="block text-aj-gold mt-2">
              într-un singur loc.
            </span>
          </h1>

          <p className="mt-7 text-white/72 text-base xl:text-lg leading-relaxed max-w-lg">
            Clienți, măsurători, montaje, producție, garanții, service și
            portal client — organizate într-o platformă creată pentru
            echipa ART JUNKIE.
          </p>

          <div className="mt-8 flex items-center gap-3 text-sm text-white/65">
            <ShieldCheck size={18} className="text-aj-gold" />
            Acces securizat pentru personal autorizat
          </div>
        </div>

        <div className="relative z-10 text-white/45 text-xs tracking-wide">
          © {new Date().getFullYear()} ART JUNKIE · artjunkie.ro
        </div>
      </div>

      {/* Panou formular */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 xl:p-16 bg-aj-cream">
        <div className="w-full max-w-md">
          {/* Logo mobil */}
          <div className="lg:hidden mb-10">
            <div className="rounded-2xl bg-[#071525] p-5 shadow-xl">
              <img
                src="/logo-artjunkie.png"
                alt="ART JUNKIE"
                className="w-full max-w-[280px] mx-auto h-auto object-contain"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-aj-navy/65 mb-4">
            <Sparkles size={14} className="text-aj-gold" />
            {variant === "employee"
              ? "Aplicație echipă"
              : "Autentificare staff"}
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-aj-navy tracking-tight mb-3">
            Bun venit înapoi
          </h2>

          <p className="text-slate-600 mb-8 text-sm leading-relaxed">
            Autentifică-te pentru a accesa{" "}
            {variant === "employee"
              ? "programul și lucrările tale."
              : "platforma ART JUNKIE OS."}
          </p>

          <form
            onSubmit={submit}
            className="space-y-5"
            data-testid="login-form"
          >
            <div>
              <label className="block text-xs font-semibold text-aj-navy uppercase tracking-wide mb-2">
                Email
              </label>

              <input
                data-testid="login-email"
                type="email"
                autoComplete="email"
                className="aj-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nume@artjunkie.ro"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-aj-navy uppercase tracking-wide mb-2">
                Parolă
              </label>

              <input
                data-testid="login-password"
                type="password"
                autoComplete="current-password"
                className="aj-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              className="aj-btn-navy w-full py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-aj-navy/10 transition-all hover:-translate-y-0.5"
            >
              {loading ? "Se autentifică…" : "Autentifică-te"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-aj-line text-sm flex items-center justify-between gap-4">
            <Link
              to="/client/login"
              className="text-aj-navy hover:text-aj-gold font-semibold transition-colors"
              data-testid="link-client-portal"
            >
              Urmărește comanda →
            </Link>

            <span className="text-xs text-slate-400">
              ART JUNKIE OS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
