import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { LEAD_STATUS, WORK_ORDER_STATUS, MEASUREMENT_STATUS, INSTALLATION_STATUS } from "@/lib/status";

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    (async () => {
      const [r, u] = await Promise.all([api.get("/reports/summary"), api.get("/users")]);
      setData(r.data); setUsers(u.data || []);
    })();
  }, []);

  if (!data) return <div className="text-slate-400 text-sm">Se încarcă rapoartele…</div>;

  const userName = (id) => id ? (users.find(u => u.id === id)?.name || "—") : "Nealocat";

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-reports">
      <div>
        <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">Insight-uri</div>
        <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">Rapoarte</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportCard title="Lead-uri pe status" rows={data.leads_by_status} labelMap={LEAD_STATUS} />
        <ReportCard title="Comenzi pe status" rows={data.orders_by_status} labelMap={WORK_ORDER_STATUS} />
        <ReportCard title="Măsurători pe status" rows={data.measurements_by_status} labelMap={MEASUREMENT_STATUS} />
        <ReportCard title="Montaje pe status" rows={data.installations_by_status} labelMap={INSTALLATION_STATUS} />
        <ReportCard title="Surse clienți" rows={data.customer_sources} labelMap={null} />
        <div className="aj-card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">Performanță angajați (montaje finalizate)</div>
          {(data.employee_performance || []).length === 0 && <div className="text-sm text-slate-400">Fără date.</div>}
          {(data.employee_performance || []).map(r => (
            <div key={r._id || "none"} className="flex items-center justify-between py-2 border-t border-aj-line text-sm">
              <span className="text-aj-navy font-semibold">{userName(r._id)}</span>
              <span className="text-aj-gold font-bold">{r.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportCard({ title, rows = [], labelMap }) {
  const max = Math.max(1, ...rows.map(r => r.count || 0));
  return (
    <div className="aj-card p-5">
      <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">{title}</div>
      {rows.length === 0 && <div className="text-sm text-slate-400">Fără date.</div>}
      <div className="space-y-2">
        {rows.map(r => {
          const label = (labelMap && labelMap[r._id]?.label) || r._id || "—";
          const pct = Math.round((r.count / max) * 100);
          return (
            <div key={r._id || "none"}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-aj-navy">{label}</span>
                <span className="text-aj-gold font-bold">{r.count}</span>
              </div>
              <div className="h-2 rounded-full bg-aj-cream overflow-hidden">
                <div className="h-full bg-aj-navy" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
