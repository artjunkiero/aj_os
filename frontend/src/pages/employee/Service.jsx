import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Badge, SERVICE_STATUS, formatDate } from "@/lib/status";
import { LifeBuoy, ArrowRight } from "lucide-react";

export default function EmployeeService() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    (async () => {
      const { data } = await api.get("/service-tickets", { params: { mine: true }});
      setRows(data || []);
    })();
  }, []);

  return (
    <div className="space-y-4 animate-fade-in" data-testid="employee-service">
      <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2"><LifeBuoy className="text-aj-gold" size={22} /> Intervenții</h1>
      {rows.length === 0 && <div className="aj-card p-6 text-sm text-white/60">Nu ai intervenții alocate.</div>}
      <div className="space-y-3">
        {rows.map(t => (
          <Link key={t.id} to={`/app/lucrare/service/${t.id}`} className="aj-card p-4 block" data-testid={`emp-s-${t.id}`}>
            <div className="font-semibold">{t.problem || "Intervenție"}</div>
            <div className="text-xs text-white/70 mt-1">{formatDate(t.created_at)} · prioritate {t.priority}</div>
            <div className="mt-2 flex items-center justify-between">
              <Badge map={SERVICE_STATUS} value={t.status} />
              <ArrowRight size={18} className="text-aj-gold" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
