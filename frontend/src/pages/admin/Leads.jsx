import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Badge, LEAD_STATUS, formatDate } from "@/lib/status";
import Modal, { Field, TextInput, TextArea, Select } from "./_Modal";
import { Plus, ArrowRight } from "lucide-react";

const STATUSES = Object.keys(LEAD_STATUS);
const URGENCY = ["normala", "urgent", "foarte_urgent"];
const SOURCES = ["showroom", "telefon", "whatsapp", "site", "google", "facebook", "instagram", "recomandare", "alta"];

const EMPTY = {
  customer_id: "", source: "showroom", product_interest: "", budget: 0,
  urgency: "normala", status: "nou", notes: "",
};

export default function AdminLeads() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    const [l, c] = await Promise.all([api.get("/leads"), api.get("/customers")]);
    setRows(l.data || []);
    setCustomers(c.data || []);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customer_id) { toast.error("Selectează un client"); return; }
    try {
      await api.post("/leads", { ...form, budget: Number(form.budget) || 0 });
      toast.success("Lead adăugat"); setOpen(false); setForm(EMPTY); load();
    } catch { toast.error("Eroare"); }
  };

  const setStatus = async (id, status) => {
    try { await api.patch(`/leads/${id}`, { status }); load(); } catch { toast.error("Eroare"); }
  };

  const custName = (id) => customers.find(c => c.id === id)?.name || "-";

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-leads">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">Vânzări</div>
          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">Lead-uri</h1>
        </div>
        <button onClick={() => setOpen(true)} className="aj-btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2" data-testid="btn-new-lead">
          <Plus size={16} /> Lead nou
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        {STATUSES.map((s) => {
          const items = rows.filter(r => r.status === s);
          return (
            <div key={s} className="aj-card p-3 flex flex-col min-h-[220px]" data-testid={`lead-column-${s}`}>
              <div className="flex items-center justify-between mb-3">
                <Badge map={LEAD_STATUS} value={s} />
                <span className="text-xs font-bold text-slate-400">{items.length}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto">
                {items.length === 0 && <div className="text-xs text-slate-400 py-4 text-center">Niciun lead</div>}
                {items.map(l => (
                  <div key={l.id} className="border border-aj-line rounded-lg p-3 bg-white hover:border-aj-gold transition-colors" data-testid={`lead-card-${l.id}`}>
                    <div className="font-semibold text-aj-navy text-sm">{custName(l.customer_id)}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{l.product_interest || "Interes nespecificat"}</div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{Number(l.budget || 0).toLocaleString("ro-RO")} lei</span>
                      <span>{formatDate(l.created_at)}</span>
                    </div>
                    <select
                      onChange={(e) => setStatus(l.id, e.target.value)}
                      value={l.status}
                      className="mt-2 w-full text-xs border border-aj-line rounded px-2 py-1"
                      data-testid={`lead-status-${l.id}`}
                    >
                      {STATUSES.map(x => <option key={x} value={x}>{LEAD_STATUS[x].label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Lead nou" wide testId="modal-lead">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Client" wide>
            <Select value={form.customer_id} onChange={(e) => setForm({...form, customer_id: e.target.value})}
              options={[{value: "", label: "— alege client —"}, ...customers.map(c => ({value: c.id, label: `${c.name} · ${c.phone}`}))]}
            />
          </Field>
          <Field label="Sursă"><Select value={form.source} onChange={(e) => setForm({...form, source: e.target.value})} options={SOURCES.map(s => ({value: s, label: s}))} /></Field>
          <Field label="Urgență"><Select value={form.urgency} onChange={(e) => setForm({...form, urgency: e.target.value})} options={URGENCY.map(s => ({value: s, label: s}))} /></Field>
          <Field label="Produs de interes" wide><TextInput value={form.product_interest} onChange={(e) => setForm({...form, product_interest: e.target.value})} placeholder="perdele, draperii, rolete..." /></Field>
          <Field label="Buget estimativ (lei)"><TextInput type="number" value={form.budget} onChange={(e) => setForm({...form, budget: e.target.value})} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} options={STATUSES.map(s => ({value: s, label: LEAD_STATUS[s].label}))} /></Field>
          <Field label="Observații" wide><TextArea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></Field>
          <div className="col-span-full flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-aj-line text-sm">Anulează</button>
            <button type="submit" className="aj-btn-navy px-4 py-2 rounded-lg text-sm" data-testid="btn-save-lead">Salvează</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
