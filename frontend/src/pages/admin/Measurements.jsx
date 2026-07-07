import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Badge, MEASUREMENT_STATUS, formatDate } from "@/lib/status";
import Modal, { Field, TextInput, TextArea, Select } from "./_Modal";
import { Plus } from "lucide-react";

const STATUSES = Object.keys(MEASUREMENT_STATUS);
const PRIORITY = ["normala", "urgenta", "foarte_urgenta"];

const EMPTY = {
  customer_id: "", address: "", date: "", time: "", assigned_to: "",
  products: [], status: "noua", priority: "normala",
  customer_notes: "", internal_notes: "",
};

const PRODUCT_OPTIONS = ["perdele", "draperii", "rolete textile", "rolete Day&Night", "jaluzele verticale", "jaluzele venețiene", "plise", "rulouri exterioare", "plase insecte", "sisteme motorizate"];

export default function AdminMeasurements() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("");

  const load = async () => {
    const [m, c, u] = await Promise.all([
      api.get("/measurements", { params: status ? { status } : {} }),
      api.get("/customers"),
      api.get("/users"),
    ]);
    setRows(m.data || []);
    setCustomers(c.data || []);
    setEmployees((u.data || []).filter(x => x.role === "measurement" || x.role === "installer"));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customer_id || !form.date) { toast.error("Client + Dată obligatorii"); return; }
    try {
      await api.post("/measurements", form);
      toast.success("Măsurătoare adăugată"); setOpen(false); setForm(EMPTY); load();
    } catch { toast.error("Eroare"); }
  };

  const changeStatus = async (id, newStatus) => {
    try { await api.patch(`/measurements/${id}`, { status: newStatus }); load(); }
    catch { toast.error("Eroare"); }
  };

  const changeAssignee = async (id, assigned_to) => {
    try { await api.patch(`/measurements/${id}`, { assigned_to }); toast.success("Alocat"); load(); }
    catch { toast.error("Eroare"); }
  };

  const custName = (id) => customers.find(c => c.id === id)?.name || "-";
  const empName = (id) => employees.find(e => e.id === id)?.name || "Nealocat";

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-measurements">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">Teren</div>
          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">Măsurători</h1>
        </div>
        <div className="flex gap-3">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}
            options={[{value: "", label: "Toate"}, ...STATUSES.map(s => ({value: s, label: MEASUREMENT_STATUS[s].label}))]}
            className="w-48" />
          <button onClick={() => setOpen(true)} className="aj-btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2" data-testid="btn-new-measurement">
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
            <th className="px-4 py-3">Angajat</th>
            <th className="px-4 py-3">Produse</th>
            <th className="px-4 py-3">Status</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Nicio măsurătoare.</td></tr>}
            {rows.map(m => (
              <tr key={m.id} className="border-t border-aj-line" data-testid={`measurement-row-${m.id}`}>
                <td className="px-4 py-3 font-semibold text-aj-navy">{custName(m.customer_id)}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{m.address || "-"}</td>
                <td className="px-4 py-3 text-xs"><div>{formatDate(m.date)}</div><div className="text-slate-500">{m.time}</div></td>
                <td className="px-4 py-3">
                  <select value={m.assigned_to || ""} onChange={(e) => changeAssignee(m.id, e.target.value)}
                    className="text-xs border border-aj-line rounded px-2 py-1 max-w-[140px]" data-testid={`assign-${m.id}`}>
                    <option value="">— nealocat —</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{(m.products || []).join(", ") || "-"}</td>
                <td className="px-4 py-3">
                  <select value={m.status} onChange={(e) => changeStatus(m.id, e.target.value)}
                    className="text-xs border border-aj-line rounded px-2 py-1" data-testid={`status-${m.id}`}>
                    {STATUSES.map(s => <option key={s} value={s}>{MEASUREMENT_STATUS[s].label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Măsurătoare nouă" wide testId="modal-measurement">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Client" wide>
            <Select value={form.customer_id} onChange={(e) => {
              const c = customers.find(x => x.id === e.target.value);
              setForm({...form, customer_id: e.target.value, address: c ? c.address || "" : ""});
            }} options={[{value: "", label: "— alege —"}, ...customers.map(c => ({value: c.id, label: `${c.name} · ${c.phone}`}))]} />
          </Field>
          <Field label="Adresă" wide><TextInput value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} /></Field>
          <Field label="Dată"><TextInput type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} required /></Field>
          <Field label="Oră"><TextInput type="time" value={form.time} onChange={(e) => setForm({...form, time: e.target.value})} /></Field>
          <Field label="Angajat">
            <Select value={form.assigned_to} onChange={(e) => setForm({...form, assigned_to: e.target.value})}
              options={[{value: "", label: "— nealocat —"}, ...employees.map(e => ({value: e.id, label: e.name}))]} />
          </Field>
          <Field label="Prioritate"><Select value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})} options={PRIORITY.map(s => ({value: s, label: s}))} /></Field>
          <Field label="Produse (bifează)" wide>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_OPTIONS.map(p => {
                const checked = form.products.includes(p);
                return (
                  <button type="button" key={p}
                    onClick={() => setForm({...form, products: checked ? form.products.filter(x=>x!==p) : [...form.products, p]})}
                    className={`px-3 py-1.5 text-xs rounded-full border ${checked ? "bg-aj-navy text-white border-aj-navy" : "border-aj-line text-slate-600"}`}
                  >{p}</button>
                );
              })}
            </div>
          </Field>
          <Field label="Observații client" wide><TextArea value={form.customer_notes} onChange={(e) => setForm({...form, customer_notes: e.target.value})} /></Field>
          <div className="col-span-full flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-aj-line text-sm">Anulează</button>
            <button type="submit" className="aj-btn-navy px-4 py-2 rounded-lg text-sm" data-testid="btn-save-measurement">Salvează</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
