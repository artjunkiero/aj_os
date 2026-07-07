import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Badge, WARRANTY_STATUS, formatDate } from "@/lib/status";
import Modal, { Field, TextInput, TextArea, Select } from "./_Modal";
import { Plus, ShieldCheck } from "lucide-react";

const STATUSES = Object.keys(WARRANTY_STATUS);
const EMPTY = { customer_id: "", work_order_id: "", product: "", installation_date: "", duration_months: 24, status: "activa", notes: "" };

export default function AdminWarranties() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    const [w, c, wo] = await Promise.all([api.get("/warranties"), api.get("/customers"), api.get("/work-orders")]);
    setRows(w.data || []); setCustomers(c.data || []); setWorkOrders(wo.data || []);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customer_id) { toast.error("Client obligatoriu"); return; }
    try {
      await api.post("/warranties", {...form, duration_months: Number(form.duration_months)||24});
      toast.success("Garanție adăugată"); setOpen(false); setForm(EMPTY); load();
    } catch { toast.error("Eroare"); }
  };

  const change = async (id, patch) => {
    try { await api.patch(`/warranties/${id}`, patch); load(); } catch { toast.error("Eroare"); }
  };

  const custName = (id) => customers.find(c => c.id === id)?.name || "-";

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-warranties">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">Post-vânzare</div>
          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">Garanții</h1>
        </div>
        <button onClick={() => setOpen(true)} className="aj-btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2" data-testid="btn-new-warranty">
          <Plus size={16} /> Garanție nouă
        </button>
      </div>

      <div className="aj-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-aj-cream/60"><tr className="text-left text-xs uppercase text-slate-500">
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Produs</th>
            <th className="px-4 py-3">Montaj</th>
            <th className="px-4 py-3">Durată</th>
            <th className="px-4 py-3">Expiră</th>
            <th className="px-4 py-3">Status</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Nicio garanție.</td></tr>}
            {rows.map(w => (
              <tr key={w.id} className="border-t border-aj-line" data-testid={`warranty-${w.id}`}>
                <td className="px-4 py-3 font-semibold text-aj-navy flex items-center gap-2"><ShieldCheck size={14} className="text-aj-gold" />{custName(w.customer_id)}</td>
                <td className="px-4 py-3">{w.product}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(w.installation_date)}</td>
                <td className="px-4 py-3">{w.duration_months} luni</td>
                <td className="px-4 py-3 text-xs">{formatDate(w.expiry_date)}</td>
                <td className="px-4 py-3">
                  <select value={w.status} onChange={(e) => change(w.id, {status: e.target.value})}
                    className="text-xs border border-aj-line rounded px-2 py-1">
                    {STATUSES.map(s => <option key={s} value={s}>{WARRANTY_STATUS[s].label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Garanție nouă" wide testId="modal-warranty">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Client" wide><Select value={form.customer_id} onChange={(e) => setForm({...form, customer_id: e.target.value})}
            options={[{value:"",label:"—"}, ...customers.map(c => ({value: c.id, label: c.name}))]} /></Field>
          <Field label="Comandă"><Select value={form.work_order_id} onChange={(e) => setForm({...form, work_order_id: e.target.value})}
            options={[{value:"",label:"—"}, ...workOrders.filter(w => !form.customer_id || w.customer_id === form.customer_id).map(w => ({value: w.id, label: w.title}))]} /></Field>
          <Field label="Produs"><TextInput value={form.product} onChange={(e) => setForm({...form, product: e.target.value})} /></Field>
          <Field label="Data montajului"><TextInput type="date" value={form.installation_date} onChange={(e) => setForm({...form, installation_date: e.target.value})} /></Field>
          <Field label="Durată (luni)"><TextInput type="number" value={form.duration_months} onChange={(e) => setForm({...form, duration_months: e.target.value})} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} options={STATUSES.map(s => ({value:s,label: WARRANTY_STATUS[s].label}))} /></Field>
          <Field label="Observații" wide><TextArea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></Field>
          <div className="col-span-full flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-aj-line text-sm">Anulează</button>
            <button type="submit" className="aj-btn-navy px-4 py-2 rounded-lg text-sm" data-testid="btn-save-warranty">Salvează</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
