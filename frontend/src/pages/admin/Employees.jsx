import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { ROLE_LABELS } from "@/lib/status";
import Modal, { Field, TextInput, Select } from "./_Modal";
import { Plus, User } from "lucide-react";

const ROLES_OPT = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin / Showroom" },
  { value: "sales", label: "Consilier vânzări" },
  { value: "measurement", label: "Măsurători" },
  { value: "installer", label: "Montator" },
  { value: "service", label: "Service" },
];

const EMPTY = { email: "", name: "", phone: "", role: "measurement", password: "", active: true };

export default function AdminEmployees() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    const { data } = await api.get("/users");
    setRows((data || []).filter(u => u.role !== "client"));
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.password || form.password.length < 6) { toast.error("Parolă minim 6 caractere"); return; }
    try {
      await api.post("/users", form);
      toast.success("Angajat creat"); setOpen(false); setForm(EMPTY); load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Eroare");
    }
  };

  const toggle = async (u) => {
    try { await api.patch(`/users/${u.id}`, { active: !u.active }); load(); }
    catch { toast.error("Eroare"); }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-employees">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">Echipă</div>
          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">Angajați</h1>
        </div>
        <button onClick={() => setOpen(true)} className="aj-btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2" data-testid="btn-new-employee">
          <Plus size={16} /> Angajat nou
        </button>
      </div>

      <div className="aj-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-aj-cream/60"><tr className="text-left text-xs uppercase text-slate-500">
            <th className="px-4 py-3">Nume</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Telefon</th>
            <th className="px-4 py-3">Rol</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>
            {rows.map(u => (
              <tr key={u.id} className="border-t border-aj-line" data-testid={`employee-${u.id}`}>
                <td className="px-4 py-3 font-semibold text-aj-navy flex items-center gap-2"><User size={14} className="text-aj-gold"/>{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 text-slate-600">{u.phone || "-"}</td>
                <td className="px-4 py-3">{ROLE_LABELS[u.role] || u.role}</td>
                <td className="px-4 py-3">
                  <span className={`aj-badge ${u.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                    {u.active ? "Activ" : "Inactiv"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggle(u)} className="text-xs text-aj-navy hover:text-aj-gold font-semibold" data-testid={`toggle-${u.id}`}>
                    {u.active ? "Dezactivează" : "Activează"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Angajat nou" testId="modal-employee">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nume" wide><TextInput required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></Field>
          <Field label="Email"><TextInput type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></Field>
          <Field label="Telefon"><TextInput value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></Field>
          <Field label="Rol"><Select value={form.role} options={ROLES_OPT} onChange={(e) => setForm({...form, role: e.target.value})} /></Field>
          <Field label="Parolă"><TextInput type="password" required value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} /></Field>
          <div className="col-span-full flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-aj-line text-sm">Anulează</button>
            <button type="submit" className="aj-btn-navy px-4 py-2 rounded-lg text-sm" data-testid="btn-save-employee">Salvează</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
