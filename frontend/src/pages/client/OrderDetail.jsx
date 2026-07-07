import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Badge, WORK_ORDER_STATUS, INSTALLATION_STATUS, MEASUREMENT_STATUS, WARRANTY_STATUS, formatDate } from "@/lib/status";
import { Timeline } from "./Dashboard";
import { ArrowLeft, ShieldCheck, Ruler, Wrench } from "lucide-react";

export default function ClientOrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get(`/client/orders/${id}`); setData(data); }
      catch { setData(null); }
    })();
  }, [id]);

  if (!data) return <div className="text-slate-400 text-sm">Se încarcă comanda…</div>;
  const { work_order: wo, measurement, installation, warranty } = data;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="client-order-detail">
      <button onClick={() => nav(-1)} className="text-sm text-aj-navy hover:text-aj-gold flex items-center gap-1"><ArrowLeft size={14} /> Înapoi</button>

      <div className="aj-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">{formatDate(wo.created_at)}</div>
            <h1 className="text-2xl font-extrabold text-aj-navy">{wo.title}</h1>
            <div className="text-slate-600 text-sm mt-1">Total: {Number(wo.total_amount||0).toLocaleString("ro-RO")} lei · Avans: {Number(wo.advance_paid||0).toLocaleString("ro-RO")} lei</div>
          </div>
          <Badge map={WORK_ORDER_STATUS} value={wo.status} />
        </div>
        <Timeline currentStatus={wo.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {measurement && (
          <div className="aj-card p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 mb-2"><Ruler size={14} className="text-aj-gold" /> Măsurătoare</div>
            <div className="text-sm text-aj-navy font-semibold">{formatDate(measurement.date)} · {measurement.time}</div>
            <div className="text-xs text-slate-500 mt-1">{measurement.address}</div>
            <div className="mt-3"><Badge map={MEASUREMENT_STATUS} value={measurement.status} /></div>
          </div>
        )}
        {installation && (
          <div className="aj-card p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 mb-2"><Wrench size={14} className="text-aj-gold" /> Montaj</div>
            <div className="text-sm text-aj-navy font-semibold">{formatDate(installation.date)} · {installation.time}</div>
            <div className="text-xs text-slate-500 mt-1">{installation.address}</div>
            <div className="mt-3"><Badge map={INSTALLATION_STATUS} value={installation.status} /></div>
          </div>
        )}
        {warranty && (
          <div className="aj-card p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 mb-2"><ShieldCheck size={14} className="text-aj-gold" /> Garanție</div>
            <div className="text-sm text-aj-navy font-semibold">Expiră: {formatDate(warranty.expiry_date)}</div>
            <div className="text-xs text-slate-500 mt-1">Durată: {warranty.duration_months} luni</div>
            <div className="mt-3"><Badge map={WARRANTY_STATUS} value={warranty.status} /></div>
          </div>
        )}
      </div>

      {(wo.products || []).length > 0 && (
        <div className="aj-card p-6">
          <h3 className="font-bold text-aj-navy mb-3">Produse comandate</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-500"><tr className="text-left">
                <th className="py-2 pr-4">Produs</th>
                <th className="py-2 pr-4">Cameră</th>
                <th className="py-2 pr-4">Dimensiuni</th>
                <th className="py-2 pr-4">Material</th>
                <th className="py-2 pr-4">Culoare</th>
                <th className="py-2 pr-4">Cant.</th>
              </tr></thead>
              <tbody>
                {wo.products.map((p, i) => (
                  <tr key={i} className="border-t border-aj-line">
                    <td className="py-2 pr-4 font-semibold text-aj-navy">{p.name}</td>
                    <td className="py-2 pr-4">{p.room}</td>
                    <td className="py-2 pr-4">{p.dimensions}</td>
                    <td className="py-2 pr-4">{p.material}</td>
                    <td className="py-2 pr-4">{p.color}</td>
                    <td className="py-2 pr-4">{p.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
