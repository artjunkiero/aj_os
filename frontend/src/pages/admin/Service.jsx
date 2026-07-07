import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Badge, SERVICE_STATUS, formatDate } from "@/lib/status";
import Modal, { Field, TextInput, TextArea, Select } from "./_Modal";
import { Plus, LifeBuoy } from "lucide-react";

const STATUSES = Object.keys(SERVICE_STATUS);
const PRIORITY = ["normala","urgenta","foarte_urgenta"];
const EMPTY = { customer_id: "", warranty_id: "", work_order_id: "", problem: "", assigned_to: "", status: "noua", priority: "normala", notes: "" };

export default function AdminService() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    const [t, c, u, w] = await Promise.all([api.get("/service-tickets"), api.get("/customers"), api.get("/users"), api.get("/warranties")]);
    setRows(t.data || []); setCustomers(c.data || []); setUsers((u.data || []).filter(x => ["service","installer","measurement"].includes(x.role))); setWarranties(w.data || []);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customer_id || !form.problem) { toast.error("Client și problemă obligatorii"); return; }
    try { await api.post("/service-tickets", form); toast.success("Intervenție creată"); setOpen(false); setForm(EMPTY); load(); }
    catch { toast.error("Eroare"); }
  };

  const change = async (id, patch) => {
    try { await api.patch(`/service-tickets/${id}`, patch); load(); } catch { toast.error("Eroare"); }
  };

  const custName = (id) => customers.find(c => c.id === id)?.name || "-";

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-service">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">Post-vânzare</div>
          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">Service / Intervenții</h1>
        </div>
        <button onClick={() => setOpen(true)} className="aj-btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2" data-testid="btn-new-ticket">
          <Plus size={16} /> Intervenție nouă
        </button>
      </div>

      <div className="aj-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-aj-cream/60"><tr className="text-left text-xs uppercase text-slate-500">
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Problemă</th>
            <th className="px-4 py-3">Alocat</th>
            <th className="px-4 py-3">Prioritate</th>
            <th className="px-4 py-3">Creat</th>
            <th className="px-4 py-3">Status</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Nicio intervenție.</td></tr>}
            {rows.map(t => (
              <tr key={t.id} className="border-t border-aj-line" data-testid={`ticket-${t.id}`}>
                <td className="px-4 py-3 font-semibold text-aj-navy flex items-center gap-2"><LifeBuoy size={14} className="text-aj-gold" />{custName(t.customer_id)}</td>
                <td className="px-4 py-3 text-slate-600">{t.problem}</td>
                <td className="px-4 py-3">
                  <select value={t.assigned_to || ""} onChange={(e) => change(t.id, {assigned_to: e.target.value})}
                    className="text-xs border border-aj-line rounded px-2 py-1">
                    <option value="">— nealocat —</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs capitalize">{t.priority}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(t.created_at)}</td>
                <td className="px-4 py-3">
                  <select value={t.status} onChange={(e) => change(t.id, {status: e.target.value})}
                    className="text-xs border border-aj-line rounded px-2 py-1">
                    {STATUSES.map(s => <option key={s} value={s}>{SERVICE_STATUS[s].label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Intervenție service" wide testId="modal-ticket">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Client" wide><Select value={form.customer_id} onChange={(e) => setForm({...form, customer_id: e.target.value})}
            options={[{value:"",label:"—"}, ...customers.map(c => ({value: c.id, label: c.name}))]} /></Field>
          <Field label="Garanție"><Select value={form.warranty_id} onChange={(e) => setForm({...form, warranty_id: e.target.value})}
            options={[{value:"",label:"—"}, ...warranties.filter(w => !form.customer_id || w.customer_id === form.customer_id).map(w => ({value: w.id, label: w.product}))]} /></Field>
          <Field label="Prioritate"><Select value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})} options={PRIORITY.map(p => ({value: p, label: p}))} /></Field>
          <Field label="Problemă" wide><TextArea value={form.problem} onChange={(e) => setForm({...form, problem: e.target.value})} required /></Field>
          <Field label="Alocat"><Select value={form.assigned_to} onChange={(e) => setForm({...form, assigned_to: e.target.value})}
            options={[{value:"",label:"—"}, ...users.map(u => ({value: u.id, label: u.name}))]} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} options={STATUSES.map(s => ({value: s, label: SERVICE_STATUS[s].label}))} /></Field>
          <div className="col-span-full flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-aj-line text-sm">Anulează</button>
            <button type="submit" className="aj-btn-navy px-4 py-2 rounded-lg text-sm" data-testid="btn-save-ticket">Salvează</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
