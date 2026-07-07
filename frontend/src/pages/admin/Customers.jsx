import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { Badge, CUSTOMER_STATUS } from "@/lib/status";
import Modal, { Field, TextInput, TextArea, Select } from "./_Modal";
import { Plus, Search, Phone, Mail, MapPin } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "Toate statusurile" },
  ...Object.entries(CUSTOMER_STATUS).map(([v, s]) => ({ value: v, label: s.label })),
];

const SOURCES = [
  "showroom", "telefon", "whatsapp", "site", "google", "facebook", "instagram", "recomandare", "alta"
];

const CLIENT_TYPES = [
  { value: "persoana_fizica", label: "Persoană fizică" },
  { value: "firma", label: "Firmă" },
];

const EMPTY = {
  name: "", phone: "", email: "", address: "", city: "", county: "",
  client_type: "persoana_fizica", cui: "", source: "showroom", status: "nou", notes: "",
};

export default function AdminCustomers() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const params = {};
    if (q) params.q = q;
    if (status) params.status = status;
    const { data } = await api.get("/customers", { params });
    setRows(data || []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/customers", form);
      toast.success("Client adăugat");
      setOpen(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      toast.error("Nu am putut crea clientul");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-customers">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">CRM</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-aj-navy">Clienți</h1>
        </div>
        <button onClick={() => setOpen(true)} className="aj-btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2" data-testid="btn-new-customer">
          <Plus size={16} /> Client nou
        </button>
      </div>

      <div className="aj-card p-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            data-testid="customer-search"
            className="aj-input pl-9"
            placeholder="Caută după nume, telefon, email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} className="sm:w-56" />
        <button onClick={load} className="aj-btn-navy px-4 py-2.5 rounded-lg" data-testid="btn-filter-customers">Filtrează</button>
      </div>

      <div className="aj-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-aj-cream/60">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Nume</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Adresă</th>
                <th className="px-4 py-3">Sursă</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Niciun client încă. Apasă „Client nou” pentru a începe.</td></tr>
              )}
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-aj-line hover:bg-aj-cream/40 cursor-pointer"
                  onClick={() => nav(`/admin/clienti/${c.id}`)}
                  data-testid={`customer-row-${c.id}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-aj-navy">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.client_type === "firma" ? `Firmă · CUI ${c.cui || "-"}` : "Persoană fizică"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1"><Phone size={12} /> {c.phone || "-"}</div>
                    <div className="flex items-center gap-1"><Mail size={12} /> {c.email || "-"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div className="flex items-start gap-1"><MapPin size={12} className="mt-0.5" /> <span>{c.address}<br/>{c.city}{c.county ? ", " + c.county : ""}</span></div>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize">{c.source}</td>
                  <td className="px-4 py-3"><Badge map={CUSTOMER_STATUS} value={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Client nou" wide testId="modal-customer">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nume complet" wide><TextInput data-testid="input-customer-name" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></Field>
          <Field label="Telefon"><TextInput data-testid="input-customer-phone" required value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="+40..." /></Field>
          <Field label="Email"><TextInput type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></Field>
          <Field label="Adresă" wide><TextInput value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} /></Field>
          <Field label="Localitate"><TextInput value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} /></Field>
          <Field label="Județ"><TextInput value={form.county} onChange={(e) => setForm({...form, county: e.target.value})} /></Field>
          <Field label="Tip client"><Select options={CLIENT_TYPES} value={form.client_type} onChange={(e) => setForm({...form, client_type: e.target.value})} /></Field>
          <Field label="CUI (opțional)"><TextInput value={form.cui} onChange={(e) => setForm({...form, cui: e.target.value})} /></Field>
          <Field label="Sursă"><Select options={SOURCES.map(s => ({value: s, label: s}))} value={form.source} onChange={(e) => setForm({...form, source: e.target.value})} /></Field>
          <Field label="Status"><Select options={Object.entries(CUSTOMER_STATUS).map(([v,s]) => ({value: v, label: s.label}))} value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} /></Field>
          <Field label="Observații" wide><TextArea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></Field>
          <div className="col-span-full flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-aj-line text-sm">Anulează</button>
            <button disabled={loading} type="submit" className="aj-btn-navy px-4 py-2 rounded-lg text-sm" data-testid="btn-save-customer">{loading ? "Se salvează…" : "Salvează client"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
