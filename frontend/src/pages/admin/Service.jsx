import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { SERVICE_STATUS, formatDate } from "@/lib/status";
import Modal, { Field, TextArea, Select } from "./_Modal";
import EmployeeMultiSelect from "@/components/EmployeeMultiSelect";
import { Plus, LifeBuoy } from "lucide-react";

const STATUSES = Object.keys(SERVICE_STATUS);
const PRIORITY = ["normala", "urgenta", "foarte_urgenta"];

const createEmptyForm = () => ({
  customer_id: "",
  warranty_id: "",
  work_order_id: "",
  problem: "",
  assigned_user_ids: [],
  status: "noua",
  priority: "normala",
  notes: "",
});

const getAssignedIds = (record) => {
  if (Array.isArray(record?.assigned_user_ids)) {
    return record.assigned_user_ids.filter(Boolean);
  }

  return record?.assigned_to ? [record.assigned_to] : [];
};

export default function AdminService() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(createEmptyForm());

  const load = async () => {
    try {
      const [t, c, u, w] = await Promise.all([
        api.get("/service-tickets"),
        api.get("/customers"),
        api.get("/users"),
        api.get("/warranties"),
      ]);

      setRows(t.data || []);
      setCustomers(c.data || []);
      setTechnicians(
        (u.data || []).filter(
          (employee) => employee.role === "technician" && employee.active !== false
        )
      );
      setWarranties(w.data || []);
    } catch (error) {
      console.error("Eroare la încărcarea intervențiilor:", error);
      toast.error(error?.response?.data?.detail || "Nu am putut încărca intervențiile");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();

    if (!form.customer_id || !form.problem) {
      toast.error("Client și problemă obligatorii");
      return;
    }

    try {
      await api.post("/service-tickets", {
        ...form,
        assigned_to: form.assigned_user_ids[0] || "",
      });

      toast.success("Intervenție creată");
      setOpen(false);
      setForm(createEmptyForm());
      await load();
    } catch (error) {
      console.error("Eroare la salvarea intervenției:", error);
      toast.error(error?.response?.data?.detail || "Nu am putut salva intervenția");
    }
  };

  const change = async (id, patch) => {
    try {
      await api.patch(`/service-tickets/${id}`, patch);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Nu am putut actualiza intervenția");
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
    <div className="space-y-6 animate-fade-in" data-testid="page-service">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">
            Post-vânzare
          </div>
          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">
            Service / Intervenții
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="aj-btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2"
          data-testid="btn-new-ticket"
        >
          <Plus size={16} /> Intervenție nouă
        </button>
      </div>

      <div className="aj-card overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-aj-cream/60">
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Problemă</th>
                <th className="px-4 py-3">Tehnicieni</th>
                <th className="px-4 py-3">Prioritate</th>
                <th className="px-4 py-3">Creat</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Nicio intervenție.
                  </td>
                </tr>
              )}

              {rows.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-t border-aj-line"
                  data-testid={`ticket-${ticket.id}`}
                >
                  <td className="px-4 py-3 font-semibold text-aj-navy">
                    <div className="flex items-center gap-2">
                      <LifeBuoy size={14} className="text-aj-gold" />
                      {custName(ticket.customer_id)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{ticket.problem}</td>
                  <td className="px-4 py-3">
                    <EmployeeMultiSelect
                      compact
                      employees={technicians}
                      value={getAssignedIds(ticket)}
                      onChange={(ids) => changeAssignees(ticket.id, ids)}
                      testId={`assign-ticket-${ticket.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs capitalize">{ticket.priority}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDate(ticket.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={ticket.status}
                      onChange={(event) => change(ticket.id, { status: event.target.value })}
                      className="text-xs border border-aj-line rounded px-2 py-1"
                    >
                      {STATUSES.map((item) => (
                        <option key={item} value={item}>
                          {SERVICE_STATUS[item].label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Intervenție service"
        wide
        testId="modal-ticket"
      >
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Client" wide>
            <Select
              value={form.customer_id}
              onChange={(event) =>
                setForm({
                  ...form,
                  customer_id: event.target.value,
                  warranty_id: "",
                })
              }
              options={[
                { value: "", label: "—" },
                ...customers.map((customer) => ({
                  value: customer.id,
                  label: customer.name,
                })),
              ]}
            />
          </Field>

          <Field label="Garanție">
            <Select
              value={form.warranty_id}
              onChange={(event) => setForm({ ...form, warranty_id: event.target.value })}
              options={[
                { value: "", label: "—" },
                ...warranties
                  .filter(
                    (warranty) =>
                      !form.customer_id || warranty.customer_id === form.customer_id
                  )
                  .map((warranty) => ({
                    value: warranty.id,
                    label: warranty.product,
                  })),
              ]}
            />
          </Field>

          <Field label="Prioritate">
            <Select
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: event.target.value })}
              options={PRIORITY.map((item) => ({ value: item, label: item }))}
            />
          </Field>

          <Field label="Tehnicieni" wide>
            <EmployeeMultiSelect
              employees={technicians}
              value={form.assigned_user_ids}
              onChange={(ids) => setForm({ ...form, assigned_user_ids: ids })}
              testId="service-technicians"
            />
          </Field>

          <Field label="Problemă" wide>
            <TextArea
              value={form.problem}
              onChange={(event) => setForm({ ...form, problem: event.target.value })}
              required
            />
          </Field>

          <Field label="Status">
            <Select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
              options={STATUSES.map((item) => ({
                value: item,
                label: SERVICE_STATUS[item].label,
              }))}
            />
          </Field>

          <div className="col-span-full flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg border border-aj-line text-sm"
            >
              Anulează
            </button>
            <button
              type="submit"
              className="aj-btn-navy px-4 py-2 rounded-lg text-sm"
              data-testid="btn-save-ticket"
            >
              Salvează
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
