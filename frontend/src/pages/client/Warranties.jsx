import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Badge, WARRANTY_STATUS, formatDate } from "@/lib/status";
import { ShieldCheck } from "lucide-react";

export default function ClientWarranties() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    (async () => { const { data } = await api.get("/client/warranties"); setRows(data || []); })();
  }, []);
  return (
    <div className="space-y-4 animate-fade-in" data-testid="client-warranties">
      <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight flex items-center gap-2"><ShieldCheck className="text-aj-gold" /> Garanțiile tale</h1>
      {rows.length === 0 && <div className="aj-card p-8 text-center text-slate-400">Nu ai încă garanții active.</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map(w => (
          <div key={w.id} className="aj-card p-5" data-testid={`client-warranty-${w.id}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-bold text-aj-navy">{w.product}</h3>
              <Badge map={WARRANTY_STATUS} value={w.status} />
            </div>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-slate-500">Data montaj</dt><dd className="text-aj-navy">{formatDate(w.installation_date)}</dd>
              <dt className="text-slate-500">Durată</dt><dd className="text-aj-navy">{w.duration_months} luni</dd>
              <dt className="text-slate-500">Expiră</dt><dd className="text-aj-navy font-semibold">{formatDate(w.expiry_date)}</dd>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
