import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Badge, WORK_ORDER_STATUS, formatDate } from "@/lib/status";
import { Package, ArrowRight } from "lucide-react";

export default function ClientOrders() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    (async () => { const { data } = await api.get("/client/orders"); setRows(data || []); })();
  }, []);
  return (
    <div className="space-y-4 animate-fade-in" data-testid="client-orders">
      <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight flex items-center gap-2"><Package className="text-aj-gold" /> Comenzile tale</h1>
      {rows.length === 0 && <div className="aj-card p-8 text-center text-slate-400">Nu ai comenzi încă.</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map(o => (
          <Link key={o.id} to={`/client/comenzi/${o.id}`} className="aj-card p-5 hover:border-aj-gold transition-colors" data-testid={`client-order-${o.id}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">{formatDate(o.created_at)}</div>
                <h3 className="font-bold text-aj-navy">{o.title}</h3>
                <div className="text-sm text-slate-500 mt-1">{Number(o.total_amount||0).toLocaleString("ro-RO")} lei</div>
              </div>
              <Badge map={WORK_ORDER_STATUS} value={o.status} />
            </div>
            <div className="mt-3 text-sm text-aj-navy font-semibold flex items-center gap-1">Vezi timeline <ArrowRight size={14} /></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
