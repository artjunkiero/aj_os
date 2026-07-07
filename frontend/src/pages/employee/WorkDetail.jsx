import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { Badge, MEASUREMENT_STATUS, INSTALLATION_STATUS, SERVICE_STATUS, formatDate } from "@/lib/status";
import { ArrowLeft, Phone, MapPin, Camera, CheckCircle2, AlertTriangle, Route, PlayCircle } from "lucide-react";

const ENDPOINT = {
  masuratori: "measurements",
  montaje: "installations",
  service: "service-tickets",
};
const STATUS_MAP = {
  masuratori: MEASUREMENT_STATUS,
  montaje: INSTALLATION_STATUS,
  service: SERVICE_STATUS,
};

const ACTIONS_M = [
  { status: "in_drum", label: "În drum", icon: Route, tone: "bg-orange-500" },
  { status: "ajuns", label: "Am ajuns", icon: MapPin, tone: "bg-pink-500" },
  { status: "masurata", label: "Măsurat", icon: CheckCircle2, tone: "bg-emerald-500" },
  { status: "problema", label: "Problemă", icon: AlertTriangle, tone: "bg-red-500" },
];
const ACTIONS_I = [
  { status: "in_drum", label: "În drum", icon: Route, tone: "bg-orange-500" },
  { status: "ajuns", label: "Am ajuns", icon: MapPin, tone: "bg-pink-500" },
  { status: "in_montaj", label: "În montaj", icon: PlayCircle, tone: "bg-violet-500" },
  { status: "finalizat", label: "Finalizat", icon: CheckCircle2, tone: "bg-emerald-500" },
  { status: "problema", label: "Problemă", icon: AlertTriangle, tone: "bg-red-500" },
];
const ACTIONS_S = [
  { status: "in_lucru", label: "În lucru", icon: PlayCircle, tone: "bg-violet-500" },
  { status: "rezolvata", label: "Rezolvată", icon: CheckCircle2, tone: "bg-emerald-500" },
  { status: "respinsa", label: "Respinsă", icon: AlertTriangle, tone: "bg-red-500" },
];

export default function EmployeeWorkDetail() {
  const { kind, id } = useParams();
  const nav = useNavigate();
  const [item, setItem] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [note, setNote] = useState("");

  const endpoint = ENDPOINT[kind];
  const statusMap = STATUS_MAP[kind];
  const actions = kind === "masuratori" ? ACTIONS_M : kind === "montaje" ? ACTIONS_I : ACTIONS_S;

  const load = async () => {
    if (!endpoint) return;
    const { data } = await api.get(`/${endpoint}`);
    const it = (data || []).find(x => x.id === id);
    if (!it) { setItem(null); return; }
    setItem(it);
    if (it.customer_id) {
      try { const r = await api.get(`/customers/${it.customer_id}`); setCustomer(r.data.customer); } catch { setCustomer(null); }
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, kind]);

  const setStatus = async (status) => {
    try {
      await api.patch(`/${endpoint}/${id}`, { status });
      toast.success(`Status: ${statusMap[status]?.label || status}`);
      load();
    } catch { toast.error("Eroare la actualizare"); }
  };

  const saveNote = async () => {
    if (!note.trim()) return;
    const field = kind === "masuratori" ? "internal_notes" : "notes";
    const current = item[field] || "";
    const merged = current ? `${current}\n${note.trim()}` : note.trim();
    try {
      await api.patch(`/${endpoint}/${id}`, { [field]: merged });
      toast.success("Observație salvată"); setNote(""); load();
    } catch { toast.error("Eroare"); }
  };

  if (!item) return <div className="text-white/70 p-6" data-testid="wd-loading">Se încarcă lucrarea…</div>;

  return (
    <div className="space-y-5 animate-fade-in" data-testid="employee-work-detail">
      <button onClick={() => nav(-1)} className="text-white/70 hover:text-aj-gold text-sm flex items-center gap-1" data-testid="wd-back">
        <ArrowLeft size={14} /> Înapoi
      </button>

      <div className="aj-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-aj-gold mb-1">{kind}</div>
            <h1 className="text-xl font-extrabold">{customer?.name || "Client"}</h1>
            <div className="text-xs text-white/70 mt-1">{formatDate(item.date)} · {item.time}</div>
          </div>
          <Badge map={statusMap} value={item.status} />
        </div>
        {item.address && (
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.address)}`}
             target="_blank" rel="noreferrer"
             className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-aj-gold" data-testid="wd-maps">
            <MapPin size={18} className="text-aj-gold" />
            <span className="text-sm flex-1 truncate">{item.address}</span>
          </a>
        )}
        {customer?.phone && (
          <a href={`tel:${customer.phone}`} className="mt-2 flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-aj-gold" data-testid="wd-call">
            <Phone size={18} className="text-aj-gold" />
            <span className="text-sm">{customer.phone}</span>
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3" data-testid="wd-actions">
        {actions.map(a => (
          <button key={a.status} onClick={() => setStatus(a.status)}
            className={`${a.tone} text-white rounded-xl p-4 flex flex-col items-center gap-2 font-bold text-sm hover:opacity-90 h-24`}
            data-testid={`wd-action-${a.status}`}
          >
            <a.icon size={22} />
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      <div className="aj-card p-4">
        <div className="text-xs uppercase tracking-widest text-aj-gold mb-2">Adaugă observație</div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/40"
          rows={3} placeholder="Scrie o observație…" data-testid="wd-note-input" />
        <div className="flex justify-end mt-2">
          <button onClick={saveNote} className="aj-btn-gold px-4 py-2 rounded-lg text-sm" data-testid="wd-note-save">Salvează</button>
        </div>
      </div>

      {(item.internal_notes || item.notes) && (
        <div className="aj-card p-4">
          <div className="text-xs uppercase tracking-widest text-aj-gold mb-2">Note</div>
          <p className="text-sm whitespace-pre-line text-white/80">{item.internal_notes || item.notes}</p>
        </div>
      )}

      {(item.products || []).length > 0 && (
        <div className="aj-card p-4">
          <div className="text-xs uppercase tracking-widest text-aj-gold mb-2">Produse</div>
          <div className="flex flex-wrap gap-2">
            {item.products.map(p => <span key={p} className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-xs">{p}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
