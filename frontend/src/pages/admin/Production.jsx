import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Badge, PRODUCTION_STATUS, formatDate } from "@/lib/status";
import Modal, { Field, TextInput, TextArea, Select } from "./_Modal";
import { Plus, Factory } from "lucide-react";

const STATUSES = Object.keys(PRODUCTION_STATUS);
const EMPTY = { work_order_id: "", customer_id: "", product: "perdele", room: "", dimensions: "", material: "", color: "", quantity: 1, status: "nou", deadline: "", notes: "" };
const PRODUCTS = ["perdele","draperii","rolete textile","rolete Day&Night","jaluzele verticale","jaluzele venețiene","plise","rulouri exterioare","plase insecte","sisteme motorizate"];

export default function AdminProduction() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    const [p, c, w] = await Promise.all([api.get("/production"), api.get("/customers"), api.get("/work-orders")]);
    setRows(p.data || []); setCustomers(c.data || []); setWorkOrders(w.data || []);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customer_id) { toast.error("Client obligatoriu"); return; }
    try {
      await api.post("/production", {...form, quantity: Number(form.quantity)||1});
      toast.success("Adăugat în producție"); setOpen(false); setForm(EMPTY); load();
    } catch { toast.error("Eroare"); }
  };

  const change = async (id, patch) => {
    try { await api.patch(`/production/${id}`, patch); load(); } catch { toast.error("Eroare"); }
  };

  const custName = (id) => customers.find(c => c.id === id)?.name || "-";

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-production">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">Atelier</div>
          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">Producție</h1>
        </div>
        <button onClick={() => setOpen(true)} className="aj-btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2" data-testid="btn-new-production">
          <Plus size={16} /> Fișă producție
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.length === 0 && <div className="aj-card p-8 text-center text-slate-400 col-span-full">Nicio fișă în producție.</div>}
        {rows.map(p => (
          <div key={p.id} className="aj-card p-4" data-testid={`production-card-${p.id}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold text-aj-navy">{custName(p.customer_id)}</div>
                <div className="text-xs text-slate-500">{p.product} · {p.room || "-"}</div>
              </div>
              <Badge map={PRODUCTION_STATUS} value={p.status} />
            </div>
            <dl className="grid grid-cols-2 gap-y-1 text-xs text-slate-600 mt-3 pt-3 border-t border-aj-line">
              <dt className="text-slate-400">Dimensiuni</dt><dd>{p.dimensions || "-"}</dd>
              <dt className="text-slate-400">Material</dt><dd>{p.material || "-"}</dd>
              <dt className="text-slate-400">Culoare</dt><dd>{p.color || "-"}</dd>
              <dt className="text-slate-400">Cantitate</dt><dd>{p.quantity}</dd>
              <dt className="text-slate-400">Termen</dt><dd>{formatDate(p.deadline)}</dd>
            </dl>
            <select value={p.status} onChange={(e) => change(p.id, {status: e.target.value})}
              className="mt-3 w-full text-xs border border-aj-line rounded px-2 py-1.5" data-testid={`production-status-${p.id}`}>
              {STATUSES.map(s => <option key={s} value={s}>{PRODUCTION_STATUS[s].label}</option>)}
            </select>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Fișă producție nouă" wide testId="modal-production">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Client" wide>
            <Select value={form.customer_id} onChange={(e) => setForm({...form, customer_id: e.target.value})}
              options={[{value:"",label:"—"}, ...customers.map(c => ({value:c.id, label:c.name}))]} />
          </Field>
          <Field label="Comandă asociată" wide>
            <Select value={form.work_order_id} onChange={(e) => setForm({...form, work_order_id: e.target.value})}
              options={[{value:"",label:"—"}, ...workOrders.filter(w => !form.customer_id || w.customer_id === form.customer_id).map(w => ({value:w.id, label:w.title}))]} />
          </Field>
          <Field label="Produs"><Select value={form.product} onChange={(e) => setForm({...form, product: e.target.value})} options={PRODUCTS.map(p => ({value:p,label:p}))} /></Field>
          <Field label="Cameră"><TextInput value={form.room} onChange={(e) => setForm({...form, room: e.target.value})} /></Field>
          <Field label="Dimensiuni"><TextInput value={form.dimensions} onChange={(e) => setForm({...form, dimensions: e.target.value})} placeholder="LxH cm" /></Field>
          <Field label="Cantitate"><TextInput type="number" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} /></Field>
          <Field label="Material"><TextInput value={form.material} onChange={(e) => setForm({...form, material: e.target.value})} /></Field>
          <Field label="Culoare"><TextInput value={form.color} onChange={(e) => setForm({...form, color: e.target.value})} /></Field>
          <Field label="Termen estimat"><TextInput type="date" value={form.deadline} onChange={(e) => setForm({...form, deadline: e.target.value})} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} options={STATUSES.map(s => ({value:s, label: PRODUCTION_STATUS[s].label}))} /></Field>
          <Field label="Observații" wide><TextArea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></Field>
          <div className="col-span-full flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-aj-line text-sm">Anulează</button>
            <button type="submit" className="aj-btn-navy px-4 py-2 rounded-lg text-sm" data-testid="btn-save-production">Salvează</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
