import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Badge, INSTALLATION_STATUS, formatDate } from "@/lib/status";
import Modal, { Field, TextInput, TextArea, Select } from "./_Modal";
import { Plus } from "lucide-react";

const STATUSES = Object.keys(INSTALLATION_STATUS);

const EMPTY = {
  customer_id: "", work_order_id: "", address: "", date: "", time: "",
  assigned_to: "", products: [], status: "nou", notes: "",
};

const PRODUCT_OPTIONS = ["perdele", "draperii", "rolete", "jaluzele", "plise", "rulouri exterioare", "plase insecte"];

export default function AdminInstallations() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [installers, setInstallers] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("");

  const load = async () => {
    const [i, c, u, w] = await Promise.all([
      api.get("/installations", { params: status ? { status } : {} }),
      api.get("/customers"),
      api.get("/users"),
      api.get("/work-orders"),
    ]);
    setRows(i.data || []);
    setCustomers(c.data || []);
    setInstallers((u.data || []).filter(x => x.role === "installer"));
    setWorkOrders(w.data || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customer_id || !form.date) { toast.error("Client + Dată obligatorii"); return; }
    try {
      await api.post("/installations", form);
      toast.success("Montaj creat"); setOpen(false); setForm(EMPTY); load();
    } catch { toast.error("Eroare"); }
  };

  const change = async (id, patch) => {
    try { await api.patch(`/installations/${id}`, patch); load(); }
    catch { toast.error("Eroare"); }
  };

  const custName = (id) => customers.find(c => c.id === id)?.name || "-";
  const empName = (id) => installers.find(e => e.id === id)?.name || "Nealocat";

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-installations">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">Teren</div>
          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">Montaje</h1>
        </div>
        <div className="flex gap-3">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}
            options={[{value:"",label:"Toate"}, ...STATUSES.map(s => ({value: s, label: INSTALLATION_STATUS[s].label}))]}
            className="w-48" />
          <button onClick={() => setOpen(true)} className="aj-btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2" data-testid="btn-new-installation">
            <Plus size={16} /> Programează
          </button>
        </div>
      </div>

      <div className="aj-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-aj-cream/60"><tr className="text-left text-xs uppercase text-slate-500">
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Adresă</th>
            <th className="px-4 py-3">Dată / Oră</th>
            <th className="px-4 py-3">Montator</th>
            <th className="px-4 py-3">Produse</th>
            <th className="px-4 py-3">Status</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Fără montaje.</td></tr>}
            {rows.map(i => (
              <tr key={i.id} className="border-t border-aj-line" data-testid={`installation-row-${i.id}`}>
                <td className="px-4 py-3 font-semibold text-aj-navy">{custName(i.customer_id)}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{i.address || "-"}</td>
                <td className="px-4 py-3 text-xs"><div>{formatDate(i.date)}</div><div className="text-slate-500">{i.time}</div></td>
                <td className="px-4 py-3">
                  <select value={i.assigned_to || ""} onChange={(e) => change(i.id, { assigned_to: e.target.value })}
                    className="text-xs border border-aj-line rounded px-2 py-1 max-w-[140px]">
                    <option value="">— nealocat —</option>
                    {installers.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{(i.products || []).join(", ") || "-"}</td>
                <td className="px-4 py-3">
                  <select value={i.status} onChange={(e) => change(i.id, { status: e.target.value })}
                    className="text-xs border border-aj-line rounded px-2 py-1">
                    {STATUSES.map(s => <option key={s} value={s}>{INSTALLATION_STATUS[s].label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Montaj nou" wide testId="modal-installation">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Client" wide>
            <Select value={form.customer_id} onChange={(e) => {
              const c = customers.find(x => x.id === e.target.value);
              setForm({...form, customer_id: e.target.value, address: c?.address || ""});
            }} options={[{value:"",label:"— alege —"}, ...customers.map(c => ({value: c.id, label: `${c.name} · ${c.phone}`}))]} />
          </Field>
          <Field label="Comandă" wide>
            <Select value={form.work_order_id} onChange={(e) => setForm({...form, work_order_id: e.target.value})}
              options={[{value:"",label:"—"}, ...workOrders.filter(w => !form.customer_id || w.customer_id === form.customer_id).map(w => ({value: w.id, label: w.title}))]} />
          </Field>
          <Field label="Adresă" wide><TextInput value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} /></Field>
          <Field label="Dată"><TextInput type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} required /></Field>
          <Field label="Oră"><TextInput type="time" value={form.time} onChange={(e) => setForm({...form, time: e.target.value})} /></Field>
          <Field label="Montator">
            <Select value={form.assigned_to} onChange={(e) => setForm({...form, assigned_to: e.target.value})}
              options={[{value:"",label:"— nealocat —"}, ...installers.map(e => ({value: e.id, label: e.name}))]} />
          </Field>
          <Field label="Produse" wide>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_OPTIONS.map(p => {
                const on = form.products.includes(p);
                return (
                  <button type="button" key={p}
                    onClick={() => setForm({...form, products: on ? form.products.filter(x=>x!==p) : [...form.products, p]})}
                    className={`px-3 py-1.5 text-xs rounded-full border ${on ? "bg-aj-navy text-white border-aj-navy" : "border-aj-line text-slate-600"}`}
                  >{p}</button>
                );
              })}
            </div>
          </Field>
          <Field label="Observații montaj" wide><TextArea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></Field>
          <div className="col-span-full flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-aj-line text-sm">Anulează</button>
            <button type="submit" className="aj-btn-navy px-4 py-2 rounded-lg text-sm" data-testid="btn-save-installation">Salvează</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
