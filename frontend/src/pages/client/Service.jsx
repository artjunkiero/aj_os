import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Badge, SERVICE_STATUS, formatDate } from "@/lib/status";
import { LifeBuoy, Plus } from "lucide-react";

export default function ClientService() {
  const [rows, setRows] = useState([]);
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await api.get("/client/service"); setRows(data || []);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!problem.trim()) return;
    setLoading(true);
    try {
      await api.post("/client/service", { problem: problem.trim() });
      toast.success("Cerere trimisă. Vă contactăm curând.");
      setProblem(""); load();
    } catch { toast.error("Eroare"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="client-service">
      <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight flex items-center gap-2"><LifeBuoy className="text-aj-gold" /> Service</h1>

      <div className="aj-card p-6">
        <h3 className="font-bold text-aj-navy mb-3">Solicită o intervenție</h3>
        <form onSubmit={submit} className="space-y-3">
          <textarea data-testid="client-service-problem" required value={problem} onChange={(e) => setProblem(e.target.value)}
            className="aj-input min-h-[100px]" placeholder="Descrie problema semnalată…" />
          <button type="submit" disabled={loading} className="aj-btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2" data-testid="client-service-submit">
            <Plus size={14} /> {loading ? "Trimit…" : "Trimite cererea"}
          </button>
        </form>
      </div>

      <div>
        <h3 className="font-bold text-aj-navy mb-3">Solicitările tale</h3>
        {rows.length === 0 && <div className="aj-card p-8 text-center text-slate-400">Nu ai solicitări încă.</div>}
        <div className="space-y-3">
          {rows.map(t => (
            <div key={t.id} className="aj-card p-4 flex items-start justify-between gap-3" data-testid={`client-ticket-${t.id}`}>
              <div>
                <div className="text-xs text-slate-500 mb-1">{formatDate(t.created_at)}</div>
                <div className="font-semibold text-aj-navy">{t.problem}</div>
              </div>
              <Badge map={SERVICE_STATUS} value={t.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
