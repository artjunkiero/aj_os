import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge, MEASUREMENT_STATUS, INSTALLATION_STATUS, formatDate } from "@/lib/status";
import { Ruler, Wrench, ArrowRight } from "lucide-react";

export default function EmployeeToday() {
  const { user } = useAuth();
  const [ms, setMs] = useState([]);
  const [ins, setIns] = useState([]);
  const today = new Date().toISOString().slice(0,10);

  useEffect(() => {
    (async () => {
      const [m, i] = await Promise.all([
        api.get("/measurements", { params: { mine: true }}),
        api.get("/installations", { params: { mine: true }}),
      ]);
      setMs(m.data || []);
      setIns(i.data || []);
    })();
  }, []);

  const todayMs = ms.filter(x => x.date === today);
  const todayIns = ins.filter(x => x.date === today);
  const upcomingMs = ms.filter(x => x.date > today).slice(0, 5);
  const upcomingIns = ins.filter(x => x.date > today).slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="employee-today">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-aj-gold mb-1">Programul tău</div>
        <h1 className="text-2xl font-extrabold tracking-tight">Salut, {user?.name?.split(" ")[0]}.</h1>
        <p className="text-white/70 text-sm mt-1">Ai <b className="text-aj-gold">{todayMs.length + todayIns.length}</b> lucrări azi.</p>
      </div>

      <Section title="Măsurători azi" icon={Ruler} items={todayMs} kind="masuratori" map={MEASUREMENT_STATUS} />
      <Section title="Montaje azi" icon={Wrench} items={todayIns} kind="montaje" map={INSTALLATION_STATUS} />
      <Section title="Măsurători viitoare" icon={Ruler} items={upcomingMs} kind="masuratori" map={MEASUREMENT_STATUS} />
      <Section title="Montaje viitoare" icon={Wrench} items={upcomingIns} kind="montaje" map={INSTALLATION_STATUS} />
    </div>
  );
}

function Section({ title, icon: Icon, items, kind, map }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-aj-gold" />
        <h2 className="font-bold uppercase tracking-widest text-xs">{title}</h2>
      </div>
      {items.length === 0 && <div className="aj-card p-4 text-sm text-white/60">Nimic aici.</div>}
      <div className="space-y-3">
        {items.map(it => (
          <Link key={it.id} to={`/app/lucrare/${kind}/${it.id}`}
            className="aj-card p-4 flex items-center gap-3 hover:border-aj-gold transition-colors block" data-testid={`emp-item-${it.id}`}>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white truncate">{it.address || "Adresă necunoscută"}</div>
              <div className="text-xs text-white/70 mt-0.5">{formatDate(it.date)} · {it.time}</div>
              <div className="mt-2"><Badge map={map} value={it.status} /></div>
            </div>
            <ArrowRight size={18} className="text-aj-gold" />
          </Link>
        ))}
      </div>
    </div>
  );
}
