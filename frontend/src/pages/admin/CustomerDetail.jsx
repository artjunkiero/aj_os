import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import {
  Badge, CUSTOMER_STATUS, LEAD_STATUS, MEASUREMENT_STATUS,
  INSTALLATION_STATUS, WORK_ORDER_STATUS, WARRANTY_STATUS, SERVICE_STATUS,
  REFERRAL_STATUS, formatDate,
} from "@/lib/status";
import { ArrowLeft, Phone, Mail, MapPin, Building2, Gift } from "lucide-react";

const TABS = [
  { key: "overview", label: "Prezentare" },
  { key: "leads", label: "Lead-uri" },
  { key: "measurements", label: "Măsurători" },
  { key: "installations", label: "Montaje" },
  { key: "work_orders", label: "Comenzi" },
  { key: "warranties", label: "Garanții" },
  { key: "service_tickets", label: "Service" },
  { key: "referrals", label: "Recomandări" },
];

export default function CustomerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    (async () => {
      try { const r = await api.get(`/customers/${id}`); setData(r.data); }
      catch { setData(null); }
    })();
  }, [id]);

  if (!data) return <div className="text-slate-400 text-sm">Se încarcă clientul…</div>;
  const c = data.customer;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-customer-detail">
      <button onClick={() => nav("/admin/clienti")} className="text-sm text-aj-navy hover:text-aj-gold flex items-center gap-1" data-testid="back-customers">
        <ArrowLeft size={14} /> Înapoi la clienți
      </button>

      <div className="aj-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              {c.client_type === "firma" ? <Building2 size={12} /> : null}
              <span className="capitalize">{c.client_type.replace("_", " ")}</span>
              {c.cui && <span>· CUI {c.cui}</span>}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-aj-navy">{c.name}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1"><Phone size={14} /> {c.phone || "-"}</span>
              <span className="flex items-center gap-1"><Mail size={14} /> {c.email || "-"}</span>
              <span className="flex items-center gap-1"><MapPin size={14} /> {c.address}{c.city ? `, ${c.city}` : ""}</span>
            </div>
          </div>
          <div className="text-right space-y-2">
            <Badge map={CUSTOMER_STATUS} value={c.status} />
            <div className="text-xs text-slate-500 capitalize">Sursă: {c.source}</div>
            {c.referral_code && (
              <div className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                <Gift size={11} className="text-aj-gold" /> Cod ref: <span className="font-mono font-semibold text-aj-navy">{c.referral_code}</span>
              </div>
            )}
          </div>
        </div>
        {c.notes && <p className="mt-4 pt-4 border-t border-aj-line text-sm text-slate-600">{c.notes}</p>}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-aj-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-t-lg ${
              tab === t.key ? "text-aj-navy border-b-2 border-aj-gold -mb-px" : "text-slate-500 hover:text-aj-navy"
            }`}
            data-testid={`tab-${t.key}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Lead-uri" value={data.leads?.length || 0} />
          <StatCard label="Măsurători" value={data.measurements?.length || 0} />
          <StatCard label="Comenzi" value={data.work_orders?.length || 0} />
          <StatCard label="Montaje" value={data.installations?.length || 0} />
          <StatCard label="Garanții" value={data.warranties?.length || 0} />
          <StatCard label="Intervenții service" value={data.service_tickets?.length || 0} />
          <StatCard label="Recomandări făcute" value={data.referrals?.length || 0} />
        </div>
      )}

      {tab === "leads" && <ListTable rows={data.leads} map={LEAD_STATUS} cols={[
        { key: "product_interest", label: "Interes" },
        { key: "budget", label: "Buget (lei)" },
        { key: "created_at", label: "Creat", fmt: formatDate },
      ]} />}
      {tab === "measurements" && <ListTable rows={data.measurements} map={MEASUREMENT_STATUS} cols={[
        { key: "date", label: "Dată" }, { key: "time", label: "Ora" }, { key: "address", label: "Adresă" }
      ]} />}
      {tab === "installations" && <ListTable rows={data.installations} map={INSTALLATION_STATUS} cols={[
        { key: "date", label: "Dată" }, { key: "time", label: "Ora" }, { key: "address", label: "Adresă" }
      ]} />}
      {tab === "work_orders" && <ListTable rows={data.work_orders} map={WORK_ORDER_STATUS} cols={[
        { key: "title", label: "Titlu" }, { key: "total_amount", label: "Total" },
        { key: "advance_paid", label: "Avans" },
      ]} />}
      {tab === "warranties" && <ListTable rows={data.warranties} map={WARRANTY_STATUS} cols={[
        { key: "product", label: "Produs" }, { key: "installation_date", label: "Montaj" }, { key: "expiry_date", label: "Expiră" },
      ]} />}
      {tab === "service_tickets" && <ListTable rows={data.service_tickets} map={SERVICE_STATUS} cols={[
        { key: "problem", label: "Problemă" }, { key: "priority", label: "Prioritate" }, { key: "created_at", label: "Creat", fmt: formatDate },
      ]} />}
      {tab === "referrals" && <ListTable rows={data.referrals} map={REFERRAL_STATUS} cols={[
        { key: "friend_name", label: "Prieten recomandat" },
        { key: "friend_phone", label: "Telefon" },
        { key: "product_interest", label: "Interes" },
        { key: "created_at", label: "Creat", fmt: formatDate },
      ]} />}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="aj-card p-5">
      <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <div className="text-3xl font-extrabold text-aj-navy">{value}</div>
    </div>
  );
}

function ListTable({ rows = [], cols = [], map }) {
  if (!rows.length) return <div className="aj-card p-8 text-center text-sm text-slate-400">Nimic aici încă.</div>;
  return (
    <div className="aj-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-aj-cream/60"><tr className="text-left text-xs uppercase text-slate-500">
          {cols.map((c) => <th key={c.key} className="px-4 py-3">{c.label}</th>)}
          <th className="px-4 py-3">Status</th>
        </tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-aj-line">
              {cols.map((c) => <td key={c.key} className="px-4 py-3 text-slate-700">{c.fmt ? c.fmt(r[c.key]) : (r[c.key] ?? "-")}</td>)}
              <td className="px-4 py-3"><Badge map={map} value={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
