import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Badge, REFERRAL_STATUS, formatDateTime } from "@/lib/status";
import { Gift, User, Phone, MessageSquare, ArrowRight } from "lucide-react";

const STATUSES = Object.keys(REFERRAL_STATUS);

export default function AdminReferrals() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");

  const load = async () => {
    const { data } = await api.get("/referrals", { params: status ? { status } : {} });
    setRows(data || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const change = async (id, patch) => {
    try { await api.patch(`/referrals/${id}`, patch); toast.success("Actualizat"); load(); }
    catch { toast.error("Eroare"); }
  };

  const stats = STATUSES.reduce((acc, s) => {
    acc[s] = rows.filter(r => r.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-referrals">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">Growth</div>
          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight flex items-center gap-2">
            <Gift className="text-aj-gold" /> Recomandări
          </h1>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="aj-input w-52" data-testid="referrals-filter">
          <option value="">Toate</option>
          {STATUSES.map(s => <option key={s} value={s}>{REFERRAL_STATUS[s].label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATUSES.map(s => (
          <div key={s} className="aj-card p-4" data-testid={`ref-kpi-${s}`}>
            <div className="text-2xl font-extrabold text-aj-navy">{stats[s] || 0}</div>
            <div className="mt-1"><Badge map={REFERRAL_STATUS} value={s} /></div>
          </div>
        ))}
      </div>

      <div className="aj-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-aj-cream/60">
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Prieten</th>
                <th className="px-4 py-3">Recomandat de</th>
                <th className="px-4 py-3">Interes</th>
                <th className="px-4 py-3">Cod</th>
                <th className="px-4 py-3">Creat</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Nu există recomandări încă.</td></tr>}
              {rows.map(r => (
                <tr key={r.id} className="border-t border-aj-line" data-testid={`referral-row-${r.id}`}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-aj-navy flex items-center gap-1.5"><User size={13} className="text-aj-gold" />{r.friend_name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Phone size={11} />{r.friend_phone}</div>
                    {r.friend_city && <div className="text-xs text-slate-400">{r.friend_city}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-aj-navy font-medium">{r.referrer_name || "-"}</div>
                    <div className="text-xs text-slate-500">{r.referrer_phone || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {r.product_interest || "-"}
                    {r.friend_message && (
                      <div className="mt-1 text-[11px] text-slate-500 italic flex items-start gap-1">
                        <MessageSquare size={10} className="mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{r.friend_message}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.code}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <select value={r.status} onChange={(e) => change(r.id, { status: e.target.value })}
                      className="text-xs border border-aj-line rounded px-2 py-1" data-testid={`referral-status-${r.id}`}>
                      {STATUSES.map(s => <option key={s} value={s}>{REFERRAL_STATUS[s].label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-slate-500 max-w-xl">
        <ArrowRight size={12} className="inline mr-1 text-aj-gold" />
        Discount-ul recomandării se acordă manual după confirmarea admin-ului la crearea ofertei/comenzii.
        Configurează procentul în <b>Setări → Referral</b>.
      </div>
    </div>
  );
}
