import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { MEASUREMENT_STATUS, formatDate } from "@/lib/status";
import Modal, { Field, TextInput, TextArea, Select } from "./_Modal";
import EmployeeMultiSelect from "@/components/EmployeeMultiSelect";
import { Pencil, Plus } from "lucide-react";

const STATUSES = Object.keys(MEASUREMENT_STATUS);
const PRIORITY = ["normala", "urgenta", "foarte_urgenta"];

const createEmptyForm = () => ({
  customer_id: "",
  address: "",
  date: "",
  time: "",
  assigned_user_ids: [],
  products: [],
  status: "noua",
  priority: "normala",
  customer_notes: "",
  internal_notes: "",
});

const PRODUCT_OPTIONS = [
  "perdele",
  "draperii",
  "rolete textile",
  "rolete Day&Night",
  "jaluzele verticale",
  "jaluzele venețiene",
  "plise",
  "rulouri exterioare",
  "plase insecte",
  "sisteme motorizate",
];

const getAssignedIds = (record) => {
  if (Array.isArray(record?.assigned_user_ids)) {
    return record.assigned_user_ids.filter(Boolean);
  }

  return record?.assigned_to ? [record.assigned_to] : [];
};

export default function AdminMeasurements() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(createEmptyForm());
  const [status, setStatus] = useState("");

  const load = async () => {
    try {
      const [m, c, u] = await Promise.all([
        api.get("/measurements", { params: status ? { status } : {} }),
        api.get("/customers"),
        api.get("/users"),
      ]);

      setRows(m.data || []);
      setCustomers(c.data || []);
      setEmployees(
        (u.data || []).filter(
          (employee) => employee.role === "technician" && employee.active !== false
        )
      );
    } catch (error) {
      console.error("Eroare la încărcarea măsurătorilor:", error);
      toast.error(error?.response?.data?.detail || "Nu am putut încărca măsurătorile");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const openNew = () => {
    setEditing(null);
    setForm(createEmptyForm());
    setOpen(true);
  };

  const openEdit = (measurement) => {
    setEditing(measurement);
    setForm({
      customer_id: measurement.customer_id || "",
      address: measurement.address || "",
      date: measurement.date || "",
      time: measurement.time || "",
      assigned_user_ids: getAssignedIds(measurement),
      products: Array.isArray(measurement.products) ? measurement.products : [],
      status: measurement.status || "noua",
      priority: measurement.priority || "normala",
      customer_notes: measurement.customer_notes || "",
      internal_notes: measurement.internal_notes || "",
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setForm(createEmptyForm());
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

    try {
      if (editing) {
        await api.patch(`/measurements/${editing.id}`, payload);
        toast.success("Măsurătoarea a fost modificată");
      } else {
        await api.post("/measurements", payload);
        toast.success("Măsurătoare adăugată");
      }

      closeModal();
      await load();
    } catch (error) {
      console.error("Eroare la salvarea măsurătorii:", error);
      toast.error(error?.response?.data?.detail || "Nu am putut salva măsurătoarea");
    }
  };

  const changeStatus = async (id, newStatus) => {
    try {
      await api.patch(`/measurements/${id}`, { status: newStatus });
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Nu am putut schimba statusul");
    }
  };

  const changeAssignees = async (id, assignedUserIds) => {
    try {
      await api.patch(`/measurements/${id}`, {
        assigned_user_ids: assignedUserIds,
        assigned_to: assignedUserIds[0] || "",
      });
      toast.success("Alocarea a fost actualizată");
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Nu am putut actualiza alocarea");
    }
  };

  const custName = (id) => customers.find((customer) => customer.id === id)?.name || "-";

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-measurements">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">
            Teren
          </div>
          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">
            Măsurători
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
                label: MEASUREMENT_STATUS[item].label,
              })),
            ]}
            className="w-48"
          />

          <button
            type="button"
            onClick={openNew}
            className="aj-btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2"
            data-testid="btn-new-measurement"
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
                    Nicio măsurătoare.
                  </td>
                </tr>
              )}

              {rows.map((measurement) => (
                <tr
                  key={measurement.id}
                  className="border-t border-aj-line"
                  data-testid={`measurement-row-${measurement.id}`}
                >
                  <td className="px-4 py-3 font-semibold text-aj-navy">
                    {custName(measurement.customer_id)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {measurement.address || "-"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div>{formatDate(measurement.date)}</div>
                    <div className="text-slate-500">{measurement.time}</div>
                  </td>
                  <td className="px-4 py-3">
                    <EmployeeMultiSelect
                      compact
                      employees={employees}
                      value={getAssignedIds(measurement)}
                      onChange={(ids) => changeAssignees(measurement.id, ids)}
                      testId={`assign-${measurement.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {(measurement.products || []).join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={measurement.status}
                      onChange={(event) => changeStatus(measurement.id, event.target.value)}
                      className="text-xs border border-aj-line rounded px-2 py-1"
                      data-testid={`status-${measurement.id}`}
                    >
                      {STATUSES.map((item) => (
                        <option key={item} value={item}>
                          {MEASUREMENT_STATUS[item].label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(measurement)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-aj-line text-xs font-semibold text-aj-navy hover:border-aj-gold hover:text-aj-gold"
                      data-testid={`edit-measurement-${measurement.id}`}
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
        title={editing ? "Modifică măsurătoarea" : "Măsurătoare nouă"}
        wide
        testId="modal-measurement"
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
                  address: customer ? customer.address || "" : "",
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

          <Field label="Tehnicieni" wide>
            <EmployeeMultiSelect
              employees={employees}
              value={form.assigned_user_ids}
              onChange={(ids) => setForm({ ...form, assigned_user_ids: ids })}
              testId="measurement-technicians"
            />
          </Field>

          <Field label="Prioritate">
            <Select
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: event.target.value })}
              options={PRIORITY.map((item) => ({ value: item, label: item }))}
            />
          </Field>

          <Field label="Status">
            <Select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
              options={STATUSES.map((item) => ({
                value: item,
                label: MEASUREMENT_STATUS[item].label,
              }))}
            />
          </Field>

          <Field label="Produse (bifează)" wide>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_OPTIONS.map((product) => {
                const checked = form.products.includes(product);

                return (
                  <button
                    type="button"
                    key={product}
                    onClick={() =>
                      setForm({
                        ...form,
                        products: checked
                          ? form.products.filter((item) => item !== product)
                          : [...form.products, product],
                      })
                    }
                    className={`px-3 py-1.5 text-xs rounded-full border ${
                      checked
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

          <Field label="Observații client" wide>
            <TextArea
              value={form.customer_notes}
              onChange={(event) =>
                setForm({ ...form, customer_notes: event.target.value })
              }
            />
          </Field>

          <Field label="Observații interne" wide>
            <TextArea
              value={form.internal_notes}
              onChange={(event) =>
                setForm({ ...form, internal_notes: event.target.value })
              }
            />
          </Field>

          <div className="col-span-full flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg border border-aj-line text-sm"
            >
              Anulează
            </button>
            <button
              type="submit"
              className="aj-btn-navy px-4 py-2 rounded-lg text-sm"
              data-testid="btn-save-measurement"
            >
              {editing ? "Salvează modificările" : "Salvează"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
