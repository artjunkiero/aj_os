import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Phone } from "lucide-react";

export default function ClientLogin() {
  const nav = useNavigate();
  const { clientRequestOtp, clientVerifyOtp } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("phone");
  const [demoCode, setDemoCode] = useState("");
  const [loading, setLoading] = useState(false);

  const request = async (e) => {
    e.preventDefault();
    setLoading(true);
    const r = await clientRequestOtp(phone.trim());
    setLoading(false);
    if (!r.ok) { toast.error(r.error); return; }
    setDemoCode(r.data?.demo_code || "");
    setStep("code");
    toast.success("Cod trimis");
  };

  const verify = async (e) => {
    e.preventDefault();
    setLoading(true);
    const r = await clientVerifyOtp(phone.trim(), code.trim());
    setLoading(false);
    if (!r.ok) { toast.error(r.error); return; }
    toast.success("Autentificat");
    nav("/client");
  };

  return (
    <div className="min-h-screen flex bg-aj-cream" data-testid="client-login">
      <div className="hidden lg:block lg:w-1/2 relative">
        <img alt="" src="https://images.unsplash.com/photo-1628428988968-5549dd02dde2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBpbnRlcmlvciUyMGN1cnRhaW5zfGVufDB8fHx8MTc4MzQxOTI5Nnww&ixlib=rb-4.1.0&q=85" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-aj-navy/80 via-aj-navy/30 to-transparent" />
        <div className="absolute inset-0 p-14 flex flex-col justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-aj-gold flex items-center justify-center text-aj-navy font-black">AJ</div>
            <div className="font-bold tracking-tight">ART JUNKIE</div>
          </div>
          <div className="max-w-md">
            <div className="uppercase tracking-[0.3em] text-aj-gold text-xs mb-4">Portal client</div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight aj-gold-underline">
              Comenzile tale, la un tap distanță.
            </h1>
            <p className="mt-6 text-white/85 text-base leading-relaxed">
              Urmărește statusul, programările, garanțiile și solicită service oricând.
            </p>
          </div>
          <div className="text-white/60 text-xs">artjunkie.ro</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-md bg-aj-navy text-aj-gold font-black flex items-center justify-center">AJ</div>
            <div className="font-bold tracking-tight text-aj-navy">ART JUNKIE</div>
          </div>

          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/70 mb-3">Portal client</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-aj-navy tracking-tight mb-2">
            {step === "phone" ? "Intră cu numărul tău de telefon." : "Introdu codul primit."}
          </h2>
          <p className="text-slate-600 mb-8 text-sm">
            {step === "phone"
              ? "Îți vom trimite un cod pe WhatsApp / SMS."
              : `Am trimis un cod la ${phone}.`}
          </p>

          {step === "phone" && (
            <form onSubmit={request} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-aj-navy uppercase tracking-wide mb-2">Telefon</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input data-testid="client-phone" type="tel" className="aj-input pl-9" placeholder="+40..."
                    value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
              </div>
              <button disabled={loading} type="submit" data-testid="client-request-otp"
                className="aj-btn-navy w-full py-3 rounded-lg flex items-center justify-center gap-2">
                {loading ? "Trimit…" : "Trimite codul"} {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={verify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-aj-navy uppercase tracking-wide mb-2">Cod OTP</label>
                <input data-testid="client-otp" inputMode="numeric" className="aj-input text-2xl text-center tracking-[0.6em] font-bold"
                  maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required />
                {demoCode && <p className="mt-2 text-xs text-slate-500">Demo cod: <span className="font-mono font-semibold">{demoCode}</span></p>}
              </div>
              <button disabled={loading} type="submit" data-testid="client-verify-otp"
                className="aj-btn-gold w-full py-3 rounded-lg flex items-center justify-center gap-2">
                {loading ? "Verific…" : "Intră în portal"} {!loading && <ArrowRight size={18} />}
              </button>
              <button type="button" onClick={() => setStep("phone")} className="w-full text-sm text-slate-500 hover:text-aj-navy">
                Schimbă numărul
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-aj-line text-sm">
            <Link to="/admin/login" className="text-aj-navy hover:text-aj-gold font-semibold" data-testid="link-staff">
              Ești angajat? → Autentificare staff
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
