import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Sparkles } from "lucide-react";

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
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error || "Autentificare eșuată");
      return;
    }
    toast.success("Autentificare reușită");
    if (ADMIN_ROLES.includes(res.user.role) || res.user.role === "super_admin") {
      nav("/admin/dashboard");
    } else {
      nav("/app/azi");
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Brand pane */}
      <div className="hidden lg:flex lg:w-1/2 aj-login-bg text-white p-14 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-aj-gold flex items-center justify-center text-aj-navy font-black">AJ</div>
          <div className="font-bold tracking-tight text-lg">ART JUNKIE OS</div>
        </div>
        <div className="max-w-md">
          <div className="uppercase tracking-[0.3em] text-aj-gold text-xs mb-4">Sistem intern</div>
          <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight aj-gold-underline">
            Perdele, draperii și sisteme motorizate — administrate impecabil.
          </h1>
          <p className="mt-6 text-white/80 text-base leading-relaxed">
            Tot fluxul, într-un singur loc: lead-uri, măsurători, comenzi, producție, montaj, garanții și portal client.
          </p>
        </div>
        <div className="text-white/60 text-xs">© {new Date().getFullYear()} ART JUNKIE · artjunkie.ro</div>
      </div>

      {/* Form pane */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-aj-cream">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-md bg-aj-navy text-aj-gold font-black flex items-center justify-center">AJ</div>
            <div className="font-bold tracking-tight">ART JUNKIE OS</div>
          </div>

          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-aj-navy/70 mb-3">
            <Sparkles size={14} className="text-aj-gold" />
            {variant === "employee" ? "Aplicație echipă" : "Autentificare staff"}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-aj-navy tracking-tight mb-2">
            Bun venit înapoi.
          </h2>
          <p className="text-slate-600 mb-8 text-sm">
            Autentifică-te pentru a accesa {variant === "employee" ? "programul tău de azi" : "consola ART JUNKIE OS"}.
          </p>

          <form onSubmit={submit} className="space-y-4" data-testid="login-form">
            <div>
              <label className="block text-xs font-semibold text-aj-navy uppercase tracking-wide mb-2">Email</label>
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
              <label className="block text-xs font-semibold text-aj-navy uppercase tracking-wide mb-2">Parolă</label>
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
              className="aj-btn-navy w-full py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? "Se autentifică…" : "Autentifică-te"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-aj-line text-sm">
            <Link to="/client/login" className="text-aj-navy hover:text-aj-gold font-semibold" data-testid="link-client-portal">
              Portal client →
            </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
