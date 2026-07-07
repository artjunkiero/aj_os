import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { CheckCircle2, Gift, Sparkles } from "lucide-react";

const PRODUCTS = [
  "Perdele + Draperii", "Rolete textile", "Rolete Day&Night",
  "Jaluzele verticale", "Jaluzele venețiene", "Plise",
  "Rulouri exterioare", "Plase insecte", "Sisteme motorizate", "Nu sunt sigur"
];

export default function Refer() {
  const { code } = useParams();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    friend_name: "", friend_phone: "", friend_city: "",
    product_interest: "", friend_message: "",
  });

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get(`/refer/${code}`); setInfo(data); }
      catch (e) { setError(formatApiError(e.response?.data?.detail, "Cod invalid.")); }
    })();
  }, [code]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.friend_name.trim() || !form.friend_phone.trim()) {
      toast.error("Numele și telefonul sunt obligatorii");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/refer/${code}`, form);
      setSent(true);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail, "Nu am putut trimite."));
    } finally { setLoading(false); }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-aj-cream flex items-center justify-center p-6" data-testid="refer-error">
        <div className="aj-card p-10 text-center max-w-md">
          <div className="text-aj-navy font-extrabold text-xl mb-2">Cod invalid</div>
          <p className="text-slate-500 text-sm">{error}</p>
          <a href="https://artjunkie.ro" className="mt-6 inline-block aj-btn-navy px-4 py-2 rounded-lg text-sm">Vizitează artjunkie.ro</a>
        </div>
      </div>
    );
  }

  if (!info) return <div className="min-h-screen flex items-center justify-center text-slate-400">Se încarcă…</div>;

  if (sent) {
    return (
      <div className="min-h-screen bg-aj-cream flex items-center justify-center p-6" data-testid="refer-success">
        <div className="aj-card p-10 text-center max-w-md">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-aj-navy mb-2">Îți mulțumim!</h1>
          <p className="text-slate-600 text-sm">
            Am transmis solicitarea ta către ART JUNKIE. Un consilier te va contacta în cel mai scurt timp
            pentru a discuta detaliile și <b className="text-aj-navy">discountul tău de {info.discount}</b>.
          </p>
          <a href="https://artjunkie.ro" className="mt-6 inline-block aj-btn-navy px-4 py-2 rounded-lg text-sm">Descoperă produsele</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-aj-cream" data-testid="refer-page">
      {/* Header */}
      <header className="bg-aj-navy text-white">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-aj-gold text-aj-navy font-black flex items-center justify-center">AJ</div>
          <div>
            <div className="font-extrabold tracking-tight leading-none">ART JUNKIE</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-aj-gold mt-1">Recomandare</div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-aj-gold/10 text-aj-navy text-xs uppercase tracking-widest font-semibold mb-4">
            <Gift size={13} className="text-aj-gold" /> Ai fost recomandat
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-aj-navy tracking-tight leading-tight">
            <span className="text-aj-gold">{info.referrer_name}</span> îți recomandă<br className="hidden sm:block" />
            {info.company_name}.
          </h1>
          <p className="mt-4 text-slate-600 max-w-xl mx-auto">
            Completează formularul de mai jos și beneficiezi de <b className="text-aj-navy">{info.discount} discount</b> la
            prima comandă de perdele, draperii, rolete sau sisteme motorizate.
          </p>
        </div>

        <form onSubmit={submit} className="aj-card p-6 md:p-8 space-y-5" data-testid="refer-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-aj-navy uppercase tracking-wide mb-1.5">Nume complet</label>
              <input required data-testid="refer-name" className="aj-input"
                value={form.friend_name} onChange={(e) => setForm({...form, friend_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-aj-navy uppercase tracking-wide mb-1.5">Telefon</label>
              <input required data-testid="refer-phone" className="aj-input" type="tel" placeholder="+40..."
                value={form.friend_phone} onChange={(e) => setForm({...form, friend_phone: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-aj-navy uppercase tracking-wide mb-1.5">Localitate</label>
              <input data-testid="refer-city" className="aj-input"
                value={form.friend_city} onChange={(e) => setForm({...form, friend_city: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-aj-navy uppercase tracking-wide mb-1.5">Produs dorit</label>
              <select data-testid="refer-product" className="aj-input"
                value={form.product_interest} onChange={(e) => setForm({...form, product_interest: e.target.value})}>
                <option value="">— alege —</option>
                {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-aj-navy uppercase tracking-wide mb-1.5">Mesaj (opțional)</label>
            <textarea data-testid="refer-message" rows={3} className="aj-input"
              placeholder="Detalii despre spațiu, dimensiuni aproximative, culori preferate…"
              value={form.friend_message} onChange={(e) => setForm({...form, friend_message: e.target.value})} />
          </div>

          <div className="pt-3 border-t border-aj-line flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <p className="text-xs text-slate-500">
              <Sparkles size={12} className="inline text-aj-gold mr-1" />
              Confidențialitate: datele tale sunt folosite doar pentru a te contacta despre această cerere.
            </p>
            <button type="submit" disabled={loading}
              className="aj-btn-gold px-6 py-3 rounded-lg text-sm font-bold disabled:opacity-70" data-testid="refer-submit">
              {loading ? "Trimit…" : `Trimite și primesc ${info.discount} discount`}
            </button>
          </div>
        </form>
      </main>

      <footer className="text-center text-xs text-slate-400 py-8">
        © {new Date().getFullYear()} ART JUNKIE · artjunkie.ro
      </footer>
    </div>
  );
}
