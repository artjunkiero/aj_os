import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Badge, MEASUREMENT_STATUS, INSTALLATION_STATUS, WORK_ORDER_STATUS, formatDate } from "@/lib/status";
import {
  Ruler, Wrench, AlertTriangle, UserPlus, FileText, Factory, Truck, ShieldCheck, LifeBuoy, Users
} from "lucide-react";

const KPIS = [
  { key: "measurements_today", label: "Măsurători azi", icon: Ruler, tint: "text-sky-700 bg-sky-50 border-sky-100" },
  { key: "installations_today", label: "Montaje azi", icon: Wrench, tint: "text-violet-700 bg-violet-50 border-violet-100" },
  { key: "late_works", label: "Lucrări întârziate", icon: AlertTriangle, tint: "text-red-700 bg-red-50 border-red-100" },
  { key: "unassigned", label: "Nealocate", icon: FileText, tint: "text-amber-800 bg-amber-50 border-amber-100" },
  { key: "new_leads", label: "Lead-uri noi", icon: UserPlus, tint: "text-emerald-700 bg-emerald-50 border-emerald-100" },
  { key: "offers_to_make", label: "Oferte de făcut", icon: FileText, tint: "text-yellow-800 bg-yellow-50 border-yellow-100" },
  { key: "in_production", label: "În producție", icon: Factory, tint: "text-fuchsia-700 bg-fuchsia-50 border-fuchsia-100" },
  { key: "ready_to_install", label: "Gata de montaj", icon: Truck, tint: "text-teal-700 bg-teal-50 border-teal-100" },
  { key: "active_warranties", label: "Garanții active", icon: ShieldCheck, tint: "text-lime-700 bg-lime-50 border-lime-100" },
  { key: "open_tickets", label: "Service deschise", icon: LifeBuoy, tint: "text-orange-700 bg-orange-50 border-orange-100" },
  { key: "total_customers", label: "Clienți totali", icon: Users, tint: "text-slate-700 bg-slate-50 border-slate-100" },
];

export default function AdminDashboard() {
  const nav = useNavigate();
  const [stats, setStats] = useState({});
  const [measurements, setMeasurements] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, m, i, w, n] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/measurements"),
          api.get("/installations"),
          api.get("/work-orders"),
          api.get("/notifications"),
        ]);
        setStats(s.data || {});
        setMeasurements((m.data || []).slice(0, 6));
        setInstallations((i.data || []).slice(0, 6));
        setWorkOrders((w.data || []).slice(0, 6));
        setNotifications((n.data || []).slice(0, 5));
      } catch (e) {
        // guard rendered via loading
      }
    })();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in" data-testid="admin-dashboard">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">Panou principal</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-aj-navy">
            Vizibilitate totală. <span className="text-aj-gold">Decizii rapide.</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
        {KPIS.map((k) => (
          <div
            key={k.key}
            className={`aj-card p-4 flex items-start gap-3 hover:-translate-y-0.5 transition-transform`}
            data-testid={`kpi-${k.key}`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${k.tint}`}>
              <k.icon size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-extrabold text-aj-navy leading-none">{stats[k.key] ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="aj-card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-aj-navy">Măsurători apropiate</h3>
              <p className="text-xs text-slate-500">Ultimele programări</p>
            </div>
            <button className="text-sm text-aj-navy hover:text-aj-gold font-semibold" onClick={() => nav("/admin/masuratori")} data-testid="link-measurements">
              Vezi tot →
            </button>
          </div>
          <div className="divide-y divide-aj-line">
            {measurements.length === 0 && <div className="py-6 text-sm text-slate-400 text-center">Nicio măsurătoare programată.</div>}
            {measurements.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-aj-navy truncate">{m.address || "-"}</div>
                  <div className="text-xs text-slate-500">{formatDate(m.date)} · {m.time}</div>
                </div>
                <Badge map={MEASUREMENT_STATUS} value={m.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="aj-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-aj-navy">Notificări recente</h3>
              <p className="text-xs text-slate-500">Activitate internă</p>
            </div>
          </div>
          <div className="divide-y divide-aj-line">
            {notifications.length === 0 && <div className="py-6 text-sm text-slate-400 text-center">Nicio notificare.</div>}
            {notifications.map((n) => (
              <div key={n.id} className="py-3">
                <div className="font-semibold text-aj-navy text-sm">{n.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{n.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="aj-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-aj-navy">Montaje recente</h3>
            <button className="text-sm text-aj-navy hover:text-aj-gold font-semibold" onClick={() => nav("/admin/montaj")} data-testid="link-installations">Vezi tot →</button>
          </div>
          <div className="divide-y divide-aj-line">
            {installations.length === 0 && <div className="py-6 text-sm text-slate-400 text-center">Fără montaje.</div>}
            {installations.map((i) => (
              <div key={i.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-aj-navy truncate">{i.address || "-"}</div>
                  <div className="text-xs text-slate-500">{formatDate(i.date)} · {i.time}</div>
                </div>
                <Badge map={INSTALLATION_STATUS} value={i.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="aj-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-aj-navy">Lucrări în lucru</h3>
            <button className="text-sm text-aj-navy hover:text-aj-gold font-semibold" onClick={() => nav("/admin/lucrari")} data-testid="link-work-orders">Vezi tot →</button>
          </div>
          <div className="divide-y divide-aj-line">
            {workOrders.length === 0 && <div className="py-6 text-sm text-slate-400 text-center">Nicio lucrare.</div>}
            {workOrders.map((w) => (
              <div key={w.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-aj-navy truncate">{w.title || "Comandă"}</div>
                  <div className="text-xs text-slate-500">{Number(w.total_amount || 0).toLocaleString("ro-RO")} lei</div>
                </div>
                <Badge map={WORK_ORDER_STATUS} value={w.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
