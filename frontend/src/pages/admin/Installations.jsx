import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { INSTALLATION_STATUS, formatDate } from "@/lib/status";
import Modal, { Field, TextInput, TextArea, Select } from "./_Modal";
import EmployeeMultiSelect from "@/components/EmployeeMultiSelect";
import { Pencil, Plus } from "lucide-react";

const STATUSES = Object.keys(INSTALLATION_STATUS);

const createEmptyForm = () => ({
  customer_id: "",
  work_order_id: "",
  address: "",
  date: "",
  time: "",
  assigned_user_ids: [],
  products: [],
  status: "nou",
  notes: "",
});

const PRODUCT_OPTIONS = [
  "perdele",
  "draperii",
  "rolete",
  "jaluzele",
  "plise",
  "rulouri exterioare",
  "plase insecte",
];

const getAssignedIds = (record) => {
  if (Array.isArray(record?.assigned_user_ids)) {
    return record.assigned_user_ids.filter(Boolean);
  }

  return record?.assigned_to ? [record.assigned_to] : [];
};

const installationToForm = (installation) => ({
  customer_id: installation?.customer_id || "",
  work_order_id: installation?.work_order_id || "",
  address: installation?.address || "",
  date: installation?.date || "",
  time: installation?.time || "",
  assigned_user_ids: getAssignedIds(installation),
  products: Array.isArray(installation?.products) ? installation.products : [],
  status: installation?.status || "nou",
  notes: installation?.notes || "",
});

export default function AdminInstallations() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(createEmptyForm());
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [i, c, u, w] = await Promise.all([
        api.get("/installations", { params: status ? { status } : {} }),
        api.get("/customers"),
        api.get("/users"),
        api.get("/work-orders"),
      ]);

      setRows(i.data || []);
      setCustomers(c.data || []);
      setTechnicians(
        (u.data || []).filter(
          (employee) => employee.role === "technician" && employee.active !== false
        )
      );
      setWorkOrders(w.data || []);
    } catch (error) {
      console.error("Eroare la încărcarea montajelor:", error);
      toast.error(error?.response?.data?.detail || "Nu am putut încărca montajele");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setForm(createEmptyForm());
  };

  const openNew = () => {
    setEditing(null);
    setForm(createEmptyForm());
    setOpen(true);
  };

  const openEdit = (installation) => {
    setEditing(installation);
    setForm(installationToForm(installation));
    setOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.customer_id || !form.date) {
      toast.error("Client + Dată obligatorii");
      return;
    }

    const payload = {
      ...form,
      assigned_to: form.assigned_user_ids[0] || "",
    };

    setSaving(true);

    try {
      if (editing?.id) {
        await api.patch(`/installations/${editing.id}`, payload);
        toast.success("Montaj actualizat");
      } else {
        await api.post("/installations", payload);
        toast.success("Montaj creat");
      }

      closeModal();
      await load();
    } catch (error) {
      console.error("Eroare la salvarea montajului:", error);
      toast.error(error?.response?.data?.detail || "Nu am putut salva montajul");
    } finally {
      setSaving(false);
    }
  };

  const change = async (id, patch) => {
    try {
      await api.patch(`/installations/${id}`, patch);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Nu am putut actualiza montajul");
    }
  };

  const changeAssignees = async (id, assignedUserIds) => {
    await change(id, {
      assigned_user_ids: assignedUserIds,
      assigned_to: assignedUserIds[0] || "",
    });
    toast.success("Alocarea a fost actualizată");
  };

  const custName = (id) => customers.find((customer) => customer.id === id)?.name || "-";

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-installations">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">
            Teren
          </div>
          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">
            Montaje
          </h1>
        </div>

        <div className="flex gap-3">
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={[
              { value: "", label: "Toate" },
              ...STATUSES.map((item) => ({
                value: item,
                label: INSTALLATION_STATUS[item].label,
              })),
            ]}
            className="w-48"
          />

          <button
            type="button"
            onClick={openNew}
            className="aj-btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2"
            data-testid="btn-new-installation"
          >
            <Plus size={16} /> Programează
          </button>
        </div>
      </div>

      <div className="aj-card overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-aj-cream/60">
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Adresă</th>
                <th className="px-4 py-3">Dată / Oră</th>
                <th className="px-4 py-3">Tehnicieni</th>
                <th className="px-4 py-3">Produse</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Acțiuni</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Fără montaje.
                  </td>
                </tr>
              )}

              {rows.map((installation) => (
                <tr
                  key={installation.id}
                  className="border-t border-aj-line"
                  data-testid={`installation-row-${installation.id}`}
                >
                  <td className="px-4 py-3 font-semibold text-aj-navy">
                    {custName(installation.customer_id)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {installation.address || "-"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div>{formatDate(installation.date)}</div>
                    <div className="text-slate-500">{installation.time}</div>
                  </td>
                  <td className="px-4 py-3">
                    <EmployeeMultiSelect
                      compact
                      employees={technicians}
                      value={getAssignedIds(installation)}
                      onChange={(ids) => changeAssignees(installation.id, ids)}
                      testId={`assign-installation-${installation.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {(installation.products || []).join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={installation.status}
                      onChange={(event) =>
                        change(installation.id, { status: event.target.value })
                      }
                      className="text-xs border border-aj-line rounded px-2 py-1"
                    >
                      {STATUSES.map((item) => (
                        <option key={item} value={item}>
                          {INSTALLATION_STATUS[item].label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(installation)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-aj-line text-xs font-semibold text-aj-navy hover:bg-aj-cream/60"
                      data-testid={`edit-installation-${installation.id}`}
                    >
                      <Pencil size={14} /> Modifică
                    </button>
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
        title={editing ? "Editează montaj" : "Montaj nou"}
        wide
        testId="modal-installation"
      >
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Client" wide>
            <Select
              value={form.customer_id}
              onChange={(event) => {
                const customer = customers.find((item) => item.id === event.target.value);
                setForm({
                  ...form,
                  customer_id: event.target.value,
                  work_order_id: "",
                  address: customer?.address || "",
                });
              }}
              options={[
                { value: "", label: "— alege —" },
                ...customers.map((customer) => ({
                  value: customer.id,
                  label: `${customer.name} · ${customer.phone}`,
                })),
              ]}
            />
          </Field>

          <Field label="Comandă" wide>
            <Select
              value={form.work_order_id}
              onChange={(event) => setForm({ ...form, work_order_id: event.target.value })}
              options={[
                { value: "", label: "—" },
                ...workOrders
                  .filter(
                    (order) => !form.customer_id || order.customer_id === form.customer_id
                  )
                  .map((order) => ({ value: order.id, label: order.title })),
              ]}
            />
          </Field>

          <Field label="Adresă" wide>
            <TextInput
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
          </Field>

          <Field label="Dată">
            <TextInput
              type="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
              required
            />
          </Field>

          <Field label="Oră">
            <TextInput
              type="time"
              value={form.time}
              onChange={(event) => setForm({ ...form, time: event.target.value })}
            />
          </Field>

          <Field label="Status">
            <Select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
              options={STATUSES.map((item) => ({
                value: item,
                label: INSTALLATION_STATUS[item].label,
              }))}
            />
          </Field>

          <Field label="Tehnicieni" wide>
            <EmployeeMultiSelect
              employees={technicians}
              value={form.assigned_user_ids}
              onChange={(ids) => setForm({ ...form, assigned_user_ids: ids })}
              testId="installation-technicians"
            />
          </Field>

          <Field label="Produse" wide>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_OPTIONS.map((product) => {
                const selected = form.products.includes(product);

                return (
                  <button
                    type="button"
                    key={product}
                    onClick={() =>
                      setForm({
                        ...form,
                        products: selected
                          ? form.products.filter((item) => item !== product)
                          : [...form.products, product],
                      })
                    }
                    className={`px-3 py-1.5 text-xs rounded-full border ${
                      selected
                        ? "bg-aj-navy text-white border-aj-navy"
                        : "border-aj-line text-slate-600"
                    }`}
                  >
                    {product}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Observații montaj" wide>
            <TextArea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </Field>

          <div className="col-span-full flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg border border-aj-line text-sm"
              disabled={saving}
            >
              Anulează
            </button>
            <button
              type="submit"
              className="aj-btn-navy px-4 py-2 rounded-lg text-sm disabled:opacity-60"
              data-testid="btn-save-installation"
              disabled={saving}
            >
              {saving ? "Se salvează..." : editing ? "Actualizează" : "Salvează"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
