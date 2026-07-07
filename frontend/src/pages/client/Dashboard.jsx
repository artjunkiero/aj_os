import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge, WORK_ORDER_STATUS, WARRANTY_STATUS, formatDate } from "@/lib/status";
import { Package, ShieldCheck, LifeBuoy, ArrowRight, Sparkles, Gift } from "lucide-react";

export default function ClientDashboard() {
  const { client } = useAuth();
  const [orders, setOrders] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [service, setService] = useState([]);
  const [referralInfo, setReferralInfo] = useState(null);

  useEffect(() => {
    (async () => {
      const [o, w, s, r] = await Promise.all([
        api.get("/client/orders"), api.get("/client/warranties"),
        api.get("/client/service"), api.get("/client/referral"),
      ]);
      setOrders(o.data || []); setWarranties(w.data || []); setService(s.data || []);
      setReferralInfo(r.data || null);
    })();
  }, []);

  const activeOrder = orders.find(o => !["finalizat", "inchis"].includes(o.status)) || orders[0];

  return (
    <div className="space-y-8 animate-fade-in" data-testid="client-dashboard">
      <div>
        <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1 flex items-center gap-2">
          <Sparkles size={12} className="text-aj-gold" /> Bun venit
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-aj-navy">Salut, {client?.name?.split(" ")[0]}.</h1>
        <p className="text-slate-600 mt-2">Iată situația ta cu ART JUNKIE.</p>
      </div>

      {referralInfo?.eligible && (
        <Link to="/client/recomanda"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-aj-navy to-aj-navy2 text-white p-6 sm:p-8 block hover:shadow-lg transition-shadow group"
          data-testid="referral-card">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-aj-gold/15" />
          <div className="absolute -bottom-16 -left-6 w-44 h-44 rounded-full bg-aj-gold/5" />
          <div className="relative flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-aj-gold text-aj-navy flex items-center justify-center flex-shrink-0">
              <Gift size={26} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.3em] text-aj-gold mb-1">Program VIP</div>
              <div className="text-xl sm:text-2xl font-extrabold leading-tight">
                Recomandă ART JUNKIE unui prieten
              </div>
              <p className="text-white/70 text-sm mt-1">
                Prietenii tăi primesc <b className="text-aj-gold">{referralInfo.discount} discount</b> la prima comandă.
              </p>
            </div>
            <ArrowRight className="text-aj-gold group-hover:translate-x-1 transition-transform hidden sm:block" size={22} />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Comenzi" value={orders.length} icon={Package} />
        <StatCard label="Garanții active" value={warranties.filter(w => w.status === "activa").length} icon={ShieldCheck} />
        <StatCard label="Intervenții deschise" value={service.filter(s => !["rezolvata","respinsa"].includes(s.status)).length} icon={LifeBuoy} />
      </div>

      {activeOrder && (
        <div className="aj-card p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Comandă în derulare</div>
              <h2 className="text-xl font-bold text-aj-navy">{activeOrder.title}</h2>
            </div>
            <Badge map={WORK_ORDER_STATUS} value={activeOrder.status} />
          </div>
          <Timeline currentStatus={activeOrder.status} />
          <div className="mt-4">
            <Link to={`/client/comenzi/${activeOrder.id}`} className="aj-btn-navy inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm" data-testid="link-active-order">
              Vezi detalii <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="aj-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-aj-navy">Ultimele comenzi</h3>
            <Link to="/client/comenzi" className="text-sm text-aj-navy hover:text-aj-gold font-semibold">Vezi tot →</Link>
          </div>
          {orders.length === 0 && <div className="text-sm text-slate-400 py-4">Nicio comandă încă.</div>}
          <div className="divide-y divide-aj-line">
            {orders.slice(0, 4).map(o => (
              <Link key={o.id} to={`/client/comenzi/${o.id}`} className="flex items-center justify-between py-3 group">
                <div>
                  <div className="font-semibold text-aj-navy group-hover:text-aj-gold">{o.title}</div>
                  <div className="text-xs text-slate-500">{formatDate(o.created_at)} · {Number(o.total_amount||0).toLocaleString("ro-RO")} lei</div>
                </div>
                <Badge map={WORK_ORDER_STATUS} value={o.status} />
              </Link>
            ))}
          </div>
        </div>
        <div className="aj-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-aj-navy">Garanții</h3>
            <Link to="/client/garantii" className="text-sm text-aj-navy hover:text-aj-gold font-semibold">Vezi tot →</Link>
          </div>
          {warranties.length === 0 && <div className="text-sm text-slate-400 py-4">Nu ai garanții active.</div>}
          <div className="divide-y divide-aj-line">
            {warranties.slice(0, 4).map(w => (
              <div key={w.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-semibold text-aj-navy">{w.product}</div>
                  <div className="text-xs text-slate-500">Expiră: {formatDate(w.expiry_date)}</div>
                </div>
                <Badge map={WARRANTY_STATUS} value={w.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="aj-card p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-lg bg-aj-navy text-aj-gold flex items-center justify-center"><Icon size={20} /></div>
      <div>
        <div className="text-3xl font-extrabold text-aj-navy leading-none">{value}</div>
        <div className="text-xs text-slate-500 mt-1">{label}</div>
      </div>
    </div>
  );
}

const TIMELINE = [
  { key: "lead", label: "Solicitare primită" },
  { key: "masuratoare_programata", label: "Măsurătoare programată" },
  { key: "masurat", label: "Măsurătoare efectuată" },
  { key: "ofertat", label: "Ofertă trimisă" },
  { key: "acceptat", label: "Comandă confirmată" },
  { key: "in_productie", label: "În producție" },
  { key: "gata_de_montaj", label: "Gata de montaj" },
  { key: "montaj_programat", label: "Montaj programat" },
  { key: "in_montaj", label: "Montaj în desfășurare" },
  { key: "finalizat", label: "Montaj finalizat" },
  { key: "garantie_activa", label: "Garanție activă" },
];

export function Timeline({ currentStatus }) {
  const currentIdx = Math.max(0, TIMELINE.findIndex(s => s.key === currentStatus));
  return (
    <ol className="relative border-l-2 border-aj-gold pl-6 space-y-4 mt-4" data-testid="order-timeline">
      {TIMELINE.map((step, i) => {
        const done = i <= currentIdx;
        return (
          <li key={step.key} className="relative">
            <span className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 ${done ? "bg-aj-gold border-aj-gold" : "bg-white border-aj-line"}`} />
            <div className={`text-sm ${done ? "text-aj-navy font-semibold" : "text-slate-400"}`}>{step.label}</div>
          </li>
        );
      })}
    </ol>
  );
}
