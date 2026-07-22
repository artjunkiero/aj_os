import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
} from "lucide-react";

import api from "@/lib/api";
import { toast } from "sonner";
import { Badge, CUSTOMER_STATUS } from "@/lib/status";
import Modal, {
  Field,
  TextInput,
  TextArea,
  Select,
} from "./_Modal";

const STATUS_OPTIONS = [
  { value: "", label: "Toate statusurile" },
  ...Object.entries(CUSTOMER_STATUS).map(([value, status]) => ({
    value,
    label: status.label,
  })),
];

const SOURCES = [
  "showroom",
  "telefon",
  "whatsapp",
  "site",
  "google",
  "facebook",
  "instagram",
  "recomandare",
  "alta",
];

const CLIENT_TYPES = [
  { value: "persoana_fizica", label: "Persoană fizică" },
  { value: "firma", label: "Firmă" },
];

const EMPTY = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  county: "",
  client_type: "persoana_fizica",
  cui: "",
  source: "showroom",
  status: "nou",
  notes: "",
};

export default function AdminCustomers() {
  const nav = useNavigate();

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const params = {};

      if (q.trim()) {
        params.q = q.trim();
      }

      if (status) {
        params.status = status;
      }

      const { data } = await api.get("/customers", { params });
      setRows(data || []);
    } catch (err) {
      console.error("Eroare la încărcarea clienților:", err);
      toast.error("Nu am putut încărca lista de clienți");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 300);

    return () => clearTimeout(timer);
  }, [q, status]);

  const openCreateModal = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setOpen(true);
  };

  const openEditModal = (customer) => {
    setEditing(customer);

    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      city: customer.city || "",
      county: customer.county || "",
      client_type: customer.client_type || "persoana_fizica",
      cui: customer.cui || "",
      source: customer.source || "showroom",
      status: customer.status || "nou",
      notes: customer.notes || "",
    });

    setOpen(true);
  };

  const closeModal = () => {
    if (loading) return;

    setOpen(false);
    setEditing(null);
    setForm({ ...EMPTY });
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Completează numele clientului");
      return;
    }

    if (!form.phone.trim()) {
      toast.error("Completează numărul de telefon");
      return;
    }

    setLoading(true);

    const payload = {
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      county: form.county.trim(),
      cui: form.cui.trim(),
      notes: form.notes.trim(),
    };

    try {
      if (editing) {
        await api.patch(`/customers/${editing.id}`, payload);
        toast.success("Clientul a fost actualizat");
      } else {
        await api.post("/customers", payload);
        toast.success("Clientul a fost adăugat");
      }

      setOpen(false);
      setEditing(null);
      setForm({ ...EMPTY });

      await load();
    } catch (err) {
      console.error("Eroare la salvarea clientului:", err);

      const message =
        err?.response?.data?.detail ||
        (editing
          ? "Nu am putut actualiza clientul"
          : "Nu am putut crea clientul");

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (customer) => {
    const phone = (customer.phone || "").replace(/\D/g, "");

    if (!phone) {
      toast.error("Clientul nu are număr de telefon");
      return;
    }

    window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
  };

  const callCustomer = (customer) => {
    if (!customer.phone) {
      toast.error("Clientul nu are număr de telefon");
      return;
    }

    window.location.href = `tel:${customer.phone}`;
  };

  const openMaps = (customer) => {
    const location = [
      customer.address,
      customer.city,
      customer.county,
    ]
      .filter(Boolean)
      .join(", ");

    if (!location) {
      toast.error("Clientul nu are adresă completată");
      return;
    }

    window.open(
      `https://maps.google.com/?q=${encodeURIComponent(location)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div
      className="space-y-6 animate-fade-in"
      data-testid="page-customers"
    >
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">
            CRM
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-aj-navy">
            Clienți
          </h1>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="aj-btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2"
          data-testid="btn-new-customer"
        >
          <Plus size={16} />
          Client nou
        </button>
      </div>

      <div className="aj-card p-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            data-testid="customer-search"
            className="aj-input pl-9"
            placeholder="Caută după nume, telefon, email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={STATUS_OPTIONS}
          className="sm:w-56"
        />
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
                <th className="px-4 py-3 text-right">Acțiuni</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Niciun client găsit. Apasă „Client nou” pentru a
                    adăuga primul client.
                  </td>
                </tr>
              )}

              {rows.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-t border-aj-line hover:bg-aj-cream/40 cursor-pointer"
                  onClick={() =>
                    nav(`/admin/clienti/${customer.id}`)
                  }
                  data-testid={`customer-row-${customer.id}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-aj-navy">
                      {customer.name}
                    </div>

                    <div className="text-xs text-slate-500">
                      {customer.client_type === "firma"
                        ? `Firmă · CUI ${customer.cui || "-"}`
                        : "Persoană fizică"}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <Phone size={12} />
                      {customer.phone || "-"}
                    </div>

                    <div className="flex items-center gap-1">
                      <Mail size={12} />
                      {customer.email || "-"}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div className="flex items-start gap-1">
                      <MapPin size={12} className="mt-0.5 shrink-0" />

                      <span>
                        {customer.address || "-"}
                        <br />
                        {customer.city || "-"}
                        {customer.county
                          ? `, ${customer.county}`
                          : ""}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-xs capitalize">
                    {customer.source || "-"}
                  </td>

                  <td className="px-4 py-3">
                    <Badge
                      map={CUSTOMER_STATUS}
                      value={customer.status}
                    />
                  </td>

                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        title="WhatsApp"
                        aria-label={`WhatsApp ${customer.name}`}
                        className="p-2 rounded-lg text-slate-600 hover:text-green-700 hover:bg-green-100 transition-colors"
                        onClick={() => openWhatsApp(customer)}
                      >
                        <MessageCircle size={16} />
                      </button>

                      <button
                        type="button"
                        title="Telefon"
                        aria-label={`Apelează ${customer.name}`}
                        className="p-2 rounded-lg text-slate-600 hover:text-aj-navy hover:bg-slate-100 transition-colors"
                        onClick={() => callCustomer(customer)}
                      >
                        <Phone size={16} />
                      </button>

                      <button
                        type="button"
                        title="Google Maps"
                        aria-label={`Deschide adresa pentru ${customer.name}`}
                        className="p-2 rounded-lg text-slate-600 hover:text-aj-navy hover:bg-slate-100 transition-colors"
                        onClick={() => openMaps(customer)}
                      >
                        <MapPin size={16} />
                      </button>

                      <button
                        type="button"
                        title="Editează"
                        aria-label={`Editează ${customer.name}`}
                        className="p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-100 transition-colors"
                        onClick={() => openEditModal(customer)}
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        onClose={closeModal}
        title={editing ? "Editează client" : "Client nou"}
        wide
        testId="modal-customer"
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Field label="Nume complet" wide>
            <TextInput
              data-testid="input-customer-name"
              required
              value={form.name}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  name: e.target.value,
                }))
              }
            />
          </Field>

          <Field label="Telefon">
            <TextInput
              data-testid="input-customer-phone"
              required
              value={form.phone}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  phone: e.target.value,
                }))
              }
              placeholder="+40..."
            />
          </Field>

          <Field label="Email">
            <TextInput
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  email: e.target.value,
                }))
              }
            />
          </Field>

          <Field label="Adresă" wide>
            <TextInput
              value={form.address}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  address: e.target.value,
                }))
              }
            />
          </Field>

          <Field label="Localitate">
            <TextInput
              value={form.city}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  city: e.target.value,
                }))
              }
            />
          </Field>

          <Field label="Județ">
            <TextInput
              value={form.county}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  county: e.target.value,
                }))
              }
            />
          </Field>

          <Field label="Tip client">
            <Select
              options={CLIENT_TYPES}
              value={form.client_type}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  client_type: e.target.value,
                }))
              }
            />
          </Field>

          <Field label="CUI (opțional)">
            <TextInput
              value={form.cui}
              disabled={form.client_type !== "firma"}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  cui: e.target.value,
                }))
              }
            />
          </Field>

          <Field label="Sursă">
            <Select
              options={SOURCES.map((source) => ({
                value: source,
                label: source,
              }))}
              value={form.source}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  source: e.target.value,
                }))
              }
            />
          </Field>

          <Field label="Status">
            <Select
              options={Object.entries(CUSTOMER_STATUS).map(
                ([value, customerStatus]) => ({
                  value,
                  label: customerStatus.label,
                })
              )}
              value={form.status}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  status: e.target.value,
                }))
              }
            />
          </Field>

          <Field label="Observații" wide>
            <TextArea
              value={form.notes}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  notes: e.target.value,
                }))
              }
            />
          </Field>

          <div className="col-span-full flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-aj-line text-sm disabled:opacity-50"
            >
              Anulează
            </button>

            <button
              disabled={loading}
              type="submit"
              className="aj-btn-navy px-4 py-2 rounded-lg text-sm disabled:opacity-60"
              data-testid="btn-save-customer"
            >
              {loading
                ? "Se salvează…"
                : editing
                  ? "Salvează modificările"
                  : "Salvează client"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
