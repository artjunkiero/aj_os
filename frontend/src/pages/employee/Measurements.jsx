import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Badge, MEASUREMENT_STATUS, formatDate } from "@/lib/status";
import { ArrowRight, Ruler } from "lucide-react";

export default function EmployeeMeasurements() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/measurements", { params: { mine: true }});
      setRows(data || []);
    })();
  }, []);

  return (
    <div className="space-y-4 animate-fade-in" data-testid="employee-measurements">
      <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2"><Ruler className="text-aj-gold" size={22} /> Măsurătorile mele</h1>
      {rows.length === 0 && <div className="aj-card p-6 text-sm text-white/60">Nu ai măsurători alocate.</div>}
      <div className="space-y-3">
        {rows.map(m => (
          <Link key={m.id} to={`/app/lucrare/masuratori/${m.id}`} className="aj-card p-4 flex items-center gap-3 hover:border-aj-gold block" data-testid={`emp-m-${m.id}`}>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{m.address || "-"}</div>
              <div className="text-xs text-white/70">{formatDate(m.date)} · {m.time}</div>
              <div className="mt-2"><Badge map={MEASUREMENT_STATUS} value={m.status} /></div>
            </div>
            <ArrowRight size={18} className="text-aj-gold" />
          </Link>
        ))}
      </div>
    </div>
  );
}
