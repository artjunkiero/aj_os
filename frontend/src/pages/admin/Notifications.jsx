import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatDateTime } from "@/lib/status";
import { Bell, Check } from "lucide-react";

export default function AdminNotifications() {
  const [rows, setRows] = useState([]);

  const load = async () => {
    const { data } = await api.get("/notifications");
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);

  const markAll = async () => {
    await api.post("/notifications/read-all"); load();
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-notifications">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">Activitate</div>
          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">Notificări</h1>
        </div>
        <button onClick={markAll} className="aj-btn-navy px-4 py-2 rounded-lg flex items-center gap-2 text-sm" data-testid="btn-mark-all">
          <Check size={14} /> Marchează toate ca citite
        </button>
      </div>

      <div className="aj-card divide-y divide-aj-line">
        {rows.length === 0 && <div className="p-8 text-center text-slate-400">Nu ai notificări încă.</div>}
        {rows.map(n => (
          <div key={n.id} className={`p-4 flex items-start gap-3 ${n.read ? "opacity-60" : ""}`} data-testid={`notification-${n.id}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              n.kind === "urgent" ? "bg-red-50 text-red-700" :
              n.kind === "allocation" ? "bg-amber-50 text-amber-700" :
              n.kind === "service" ? "bg-orange-50 text-orange-700" :
              "bg-aj-cream text-aj-navy"
            }`}><Bell size={16} /></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-aj-navy">{n.title || "Notificare"}</div>
              <div className="text-sm text-slate-600 whitespace-pre-line">{n.body}</div>
              <div className="text-xs text-slate-400 mt-1">{formatDateTime(n.created_at)} · {n.channel}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
