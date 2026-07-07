import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Field, TextInput, TextArea } from "./_Modal";
import { Save } from "lucide-react";

export default function AdminSettings() {
  const [s, setS] = useState(null);

  const load = async () => {
    const { data } = await api.get("/settings");
    setS(data);
  };
  useEffect(() => { load(); }, []);

  if (!s) return <div className="text-slate-400 text-sm">Se încarcă setările…</div>;

  const save = async () => {
    try { await api.put("/settings", s); toast.success("Setări salvate"); load(); }
    catch { toast.error("Eroare la salvare"); }
  };

  const setT = (k, v) => setS({...s, templates: {...s.templates, [k]: v}});

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl" data-testid="page-settings">
      <div>
        <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">Configurare</div>
        <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">Setări</h1>
      </div>

      <div className="aj-card p-6 space-y-4">
        <h3 className="text-lg font-bold text-aj-navy border-b border-aj-line pb-3 mb-3">Date firmă</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nume firmă"><TextInput value={s.company_name || ""} onChange={(e) => setS({...s, company_name: e.target.value})} /></Field>
          <Field label="Telefon firmă"><TextInput value={s.company_phone || ""} onChange={(e) => setS({...s, company_phone: e.target.value})} /></Field>
          <Field label="Email firmă"><TextInput value={s.company_email || ""} onChange={(e) => setS({...s, company_email: e.target.value})} /></Field>
          <Field label="WhatsApp firmă"><TextInput value={s.whatsapp_number || ""} onChange={(e) => setS({...s, whatsapp_number: e.target.value})} /></Field>
          <Field label="Adresă showroom" wide><TextInput value={s.company_address || ""} onChange={(e) => setS({...s, company_address: e.target.value})} /></Field>
          <Field label="Program lucru" wide><TextInput value={s.working_hours || ""} onChange={(e) => setS({...s, working_hours: e.target.value})} /></Field>
          <Field label="Durată implicită garanție (luni)"><TextInput type="number" value={s.default_warranty_months || 24} onChange={(e) => setS({...s, default_warranty_months: Number(e.target.value)})} /></Field>
          <Field label="Link Google Review"><TextInput value={s.google_review_link || ""} onChange={(e) => setS({...s, google_review_link: e.target.value})} /></Field>
        </div>
      </div>

      <div className="aj-card p-6 space-y-4">
        <h3 className="text-lg font-bold text-aj-navy border-b border-aj-line pb-3 mb-3">Template-uri mesaje</h3>
        <p className="text-xs text-slate-500 mb-4">Variabile disponibile: <span className="font-mono">{"{clientName}, {clientPhone}, {address}, {date}, {time}, {products}"}</span></p>
        {Object.entries(s.templates || {}).map(([k, v]) => (
          <Field label={k.replaceAll("_"," ")} key={k} wide>
            <TextArea rows={3} value={v} onChange={(e) => setT(k, e.target.value)} data-testid={`template-${k}`} />
          </Field>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={save} className="aj-btn-gold px-6 py-3 rounded-lg flex items-center gap-2" data-testid="btn-save-settings">
          <Save size={16} /> Salvează setările
        </button>
      </div>
    </div>
  );
}
