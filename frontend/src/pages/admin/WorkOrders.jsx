import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Badge, WORK_ORDER_STATUS, formatDate } from "@/lib/status";
import Modal, { Field, TextInput, TextArea, Select } from "./_Modal";
import { Plus } from "lucide-react";

const STATUSES = Object.keys(WORK_ORDER_STATUS);
const EMPTY = { customer_id: "", title: "", total_amount: 0, advance_paid: 0, status: "lead", notes: "", products: [] };

export default function AdminWorkOrders() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("");

  const load = async () => {
    const [w, c] = await Promise.all([
      api.get("/work-orders", { params: status ? { status } : {} }),
      api.get("/customers"),
    ]);
    setRows(w.data || []);
    setCustomers(c.data || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customer_id) { toast.error("Client obligatoriu"); return; }
    try {
      await api.post("/work-orders", { ...form, total_amount: Number(form.total_amount)||0, advance_paid: Number(form.advance_paid)||0 });
      toast.success("Comandă creată"); setOpen(false); setForm(EMPTY); load();
    } catch { toast.error("Eroare"); }
  };

  const change = async (id, patch) => {
    try { await api.patch(`/work-orders/${id}`, patch); load(); } catch { toast.error("Eroare"); }
  };

  const custName = (id) => customers.find(c => c.id === id)?.name || "-";

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-work-orders">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">Operațional</div>
          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">Lucrări / Comenzi</h1>
        </div>
        <div className="flex gap-3">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}
            options={[{value:"",label:"Toate"}, ...STATUSES.map(s => ({value: s, label: WORK_ORDER_STATUS[s].label}))]}
            className="w-52" />
          <button onClick={() => setOpen(true)} className="aj-btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2" data-testid="btn-new-wo">
            <Plus size={16} /> Comandă nouă
          </button>
        </div>
      </div>

      <div className="aj-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-aj-cream/60"><tr className="text-left text-xs uppercase text-slate-500">
            <th className="px-4 py-3">Titlu</th>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Avans</th>
            <th className="px-4 py-3">Creat</th>
            <th className="px-4 py-3">Status</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Nicio comandă.</td></tr>}
            {rows.map(w => (
              <tr key={w.id} className="border-t border-aj-line" data-testid={`wo-row-${w.id}`}>
                <td className="px-4 py-3 font-semibold text-aj-navy">{w.title}</td>
                <td className="px-4 py-3 text-slate-600">{custName(w.customer_id)}</td>
                <td className="px-4 py-3">{Number(w.total_amount||0).toLocaleString("ro-RO")} lei</td>
                <td className="px-4 py-3">{Number(w.advance_paid||0).toLocaleString("ro-RO")} lei</td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(w.created_at)}</td>
                <td className="px-4 py-3">
                  <select value={w.status} onChange={(e) => change(w.id, {status: e.target.value})}
                    className="text-xs border border-aj-line rounded px-2 py-1" data-testid={`wo-status-${w.id}`}>
                    {STATUSES.map(s => <option key={s} value={s}>{WORK_ORDER_STATUS[s].label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Comandă nouă" wide testId="modal-wo">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Client" wide>
            <Select value={form.customer_id} onChange={(e) => setForm({...form, customer_id: e.target.value})}
              options={[{value:"",label:"—"}, ...customers.map(c => ({value: c.id, label: c.name}))]} />
          </Field>
          <Field label="Titlu" wide><TextInput required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="Comandă #… — descriere" /></Field>
          <Field label="Total (lei)"><TextInput type="number" value={form.total_amount} onChange={(e) => setForm({...form, total_amount: e.target.value})} /></Field>
          <Field label="Avans (lei)"><TextInput type="number" value={form.advance_paid} onChange={(e) => setForm({...form, advance_paid: e.target.value})} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} options={STATUSES.map(s => ({value: s, label: WORK_ORDER_STATUS[s].label}))} /></Field>
          <Field label="Observații" wide><TextArea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></Field>
          <div className="col-span-full flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-aj-line text-sm">Anulează</button>
            <button type="submit" className="aj-btn-navy px-4 py-2 rounded-lg text-sm" data-testid="btn-save-wo">Salvează</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
