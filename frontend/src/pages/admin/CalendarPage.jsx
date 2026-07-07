import React, { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { formatDate } from "@/lib/status";
import { ChevronLeft, ChevronRight, Ruler, Wrench, LifeBuoy } from "lucide-react";

const DAYS = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"];

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function ymd(d) { return d.toISOString().slice(0, 10); }

export default function CalendarPage() {
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const [measurements, setMeasurements] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    (async () => {
      const [m, i, t, c] = await Promise.all([
        api.get("/measurements"), api.get("/installations"),
        api.get("/service-tickets"), api.get("/customers"),
      ]);
      setMeasurements(m.data || []);
      setInstallations(i.data || []);
      setTickets(t.data || []);
      setCustomers(c.data || []);
    })();
  }, []);

  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const shift = (first.getDay() + 6) % 7; // Monday-first
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const arr = [];
    for (let i = 0; i < shift; i++) arr.push(null);
    for (let d = 1; d <= days; d++) arr.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cursor]);

  const custName = (id) => customers.find(c => c.id === id)?.name || "—";

  const eventsForDay = (d) => {
    if (!d) return [];
    const key = ymd(d);
    return [
      ...measurements.filter(x => x.date === key).map(x => ({ id: "m"+x.id, kind: "m", label: custName(x.customer_id), time: x.time })),
      ...installations.filter(x => x.date === key).map(x => ({ id: "i"+x.id, kind: "i", label: custName(x.customer_id), time: x.time })),
      ...tickets.filter(x => (x.created_at||"").slice(0,10) === key).map(x => ({ id: "s"+x.id, kind: "s", label: custName(x.customer_id), time: "" })),
    ];
  };

  const monthLabel = cursor.toLocaleDateString("ro-RO", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-calendar">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">Programări</div>
          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight capitalize">{monthLabel}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(addMonths(cursor, -1))} className="p-2 border border-aj-line rounded-lg hover:bg-white" data-testid="cal-prev"><ChevronLeft size={18} /></button>
          <button onClick={() => setCursor(startOfMonth(new Date()))} className="px-3 py-1.5 border border-aj-line rounded-lg text-sm hover:bg-white" data-testid="cal-today">Azi</button>
          <button onClick={() => setCursor(addMonths(cursor, 1))} className="p-2 border border-aj-line rounded-lg hover:bg-white" data-testid="cal-next"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
        <LegendDot color="bg-sky-100 border-sky-300" icon={Ruler} label="Măsurători" />
        <LegendDot color="bg-violet-100 border-violet-300" icon={Wrench} label="Montaje" />
        <LegendDot color="bg-orange-100 border-orange-300" icon={LifeBuoy} label="Service" />
      </div>

      <div className="aj-card overflow-hidden">
        <div className="grid grid-cols-7 bg-aj-cream/60 border-b border-aj-line">
          {DAYS.map(d => <div key={d} className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const evs = eventsForDay(d);
            const isToday = d && ymd(d) === ymd(new Date());
            return (
              <div key={i} className={`min-h-[110px] p-2 border-b border-r border-aj-line ${!d ? "bg-slate-50/50" : ""}`}>
                {d && (
                  <>
                    <div className={`text-xs font-semibold mb-1.5 flex items-center justify-between ${isToday ? "text-aj-gold" : "text-aj-navy"}`}>
                      <span>{d.getDate()}</span>
                      {isToday && <span className="text-[10px] uppercase tracking-wider">Azi</span>}
                    </div>
                    <div className="space-y-1">
                      {evs.slice(0, 4).map(e => (
                        <div key={e.id} className={`text-[11px] px-2 py-1 rounded truncate border ${
                          e.kind === "m" ? "bg-sky-50 text-sky-800 border-sky-200" :
                          e.kind === "i" ? "bg-violet-50 text-violet-800 border-violet-200" :
                          "bg-orange-50 text-orange-800 border-orange-200"
                        }`}>{e.time && <b className="mr-1">{e.time}</b>}{e.label}</div>
                      ))}
                      {evs.length > 4 && <div className="text-[10px] text-slate-400">+{evs.length - 4}</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-4 h-4 border rounded ${color}`} />
      <Icon size={14} /> <span>{label}</span>
    </div>
  );
}
