import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { WORK_ORDER_STATUS, formatDate } from "@/lib/status";
import Modal, { Field, TextInput, TextArea, Select } from "./_Modal";
import { Plus, Pencil, XCircle, RotateCcw } from "lucide-react";

const STATUSES = Object.keys(WORK_ORDER_STATUS);

const createEmptyForm = () => ({
  customer_id: "",

  order_number: "",
  order_date: new Date().toISOString().substring(0, 10),
  delivery_date: "",

  title: "",

  total_amount: 0,
  advance_paid: 0,

  status: "lead",

  notes: "",

  products: [
    {
      id: Date.now(),

      room: "",

      product: "",

      description: "",

      width: "",

      height: "",

      quantity: 1,

      material: "",

      color: "",

      unit_price: 0,

      discount: 0,

      total: 0,

      notes: "",
    },
  ],
});
const calculateProductTotal = (product) => {
  const qty = Number(product.quantity || 0);
  const price = Number(product.unit_price || 0);
  const discount = Number(product.discount || 0);

  return qty * price - discount;
};

const calculateOrderTotal = (products) => {
  return products.reduce(
    (sum, p) => sum + calculateProductTotal(p),
    0
  );
};

export default function AdminWorkOrders() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(createEmptyForm());
  const [status, setStatus] = useState("");
  const addProduct = () => {
  setForm((prev) => ({
    ...prev,
    products: [
      ...prev.products,
      {
        id: Date.now(),

        room: "",

        product: "",

        description: "",

        width: "",

        height: "",

        quantity: 1,

        material: "",

        color: "",

        unit_price: 0,

        discount: 0,

        total: 0,

        notes: "",
      },
    ],
  }));
};

const removeProduct = (id) => {
  setForm((prev) => ({
    ...prev,
    products: prev.products.filter((p) => p.id !== id),
  }));
};

const updateProduct = (id, field, value) => {
  const products = form.products.map((product) => {
    if (product.id !== id) return product;

    const updated = {
      ...product,
      [field]: value,
    };

    updated.total = calculateProductTotal(updated);

    return updated;
  });

  setForm({
    ...form,
    products,
    total_amount: calculateOrderTotal(products),
  });
};

  const load = async () => {
    try {
      const [w, c] = await Promise.all([
        api.get("/work-orders", { params: status ? { status } : {} }),
        api.get("/customers"),
      ]);

      setRows(w.data || []);
      setCustomers(c.data || []);
    } catch (error) {
      console.error("Eroare la încărcarea lucrărilor:", error);
      toast.error(
        error?.response?.data?.detail ||
          "Nu am putut încărca lucrările"
      );
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const closeModal = () => {
    if (saving) return;

    setOpen(false);
    setEditing(null);
    setForm(createEmptyForm());
  };

  const openCreateModal = () => {
    setEditing(null);
    setForm(createEmptyForm());
    setOpen(true);
  };

  const openEditModal = (workOrder) => {
    setEditing(workOrder);

    setForm({
      customer_id: workOrder.customer_id || "",
      title: workOrder.title || "",
      total_amount: workOrder.total_amount ?? 0,
      advance_paid: workOrder.advance_paid ?? 0,
      status: workOrder.status || "lead",
      notes: workOrder.notes || "",
      products: Array.isArray(workOrder.products)
        ? workOrder.products
        : [],
    });

    setOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.customer_id) {
      toast.error("Client obligatoriu");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Titlul lucrării este obligatoriu");
      return;
    }

    const payload = {
      ...form,
      title: form.title.trim(),
      total_amount: Number(form.total_amount) || 0,
      advance_paid: Number(form.advance_paid) || 0,
    };

    try {
      setSaving(true);

      if (editing?.id) {
        await api.patch(`/work-orders/${editing.id}`, payload);
        toast.success("Lucrarea a fost actualizată");
      } else {
        await api.post("/work-orders", payload);
        toast.success("Comandă creată");
      }

      setOpen(false);
      setEditing(null);
      setForm(createEmptyForm());
      await load();
      window.dispatchEvent(new Event("dashboard:refresh"));
    } catch (error) {
      console.error("Eroare la salvarea lucrării:", error);
      toast.error(
        error?.response?.data?.detail ||
          "Nu am putut salva lucrarea"
      );
    } finally {
      setSaving(false);
    }
  };

  const change = async (id, patch) => {
    try {
      await api.patch(`/work-orders/${id}`, patch);
      await load();
      window.dispatchEvent(new Event("dashboard:refresh"));
    } catch (error) {
      console.error("Eroare la actualizarea lucrării:", error);
      toast.error(
        error?.response?.data?.detail ||
          "Nu am putut actualiza lucrarea"
      );
    }
  };

  const cancelWorkOrder = async (workOrder) => {
    const confirmed = window.confirm(
      `Sigur dorești să anulezi comanda „${workOrder.title || "Comandă"}”?`
    );

    if (!confirmed) return;

    try {
      await api.patch(`/work-orders/${workOrder.id}`, {
        status: "anulat",
      });

      toast.success("Comanda a fost anulată");
      await load();
      window.dispatchEvent(new Event("dashboard:refresh"));
      window.dispatchEvent(new Event("calendar:refresh"));
    } catch (error) {
      console.error("Eroare la anularea comenzii:", error);
      toast.error(
        error?.response?.data?.detail ||
          "Nu am putut anula comanda"
      );
    }
  };

  const reactivateWorkOrder = async (workOrder) => {
    const confirmed = window.confirm(
      `Sigur dorești să reactivezi comanda „${workOrder.title || "Comandă"}”?`
    );

    if (!confirmed) return;

    try {
      await api.patch(`/work-orders/${workOrder.id}`, {
        status: "lead",
      });

      toast.success("Comanda a fost reactivată");
      await load();
      window.dispatchEvent(new Event("dashboard:refresh"));
    } catch (error) {
      console.error("Eroare la reactivarea comenzii:", error);
      toast.error(
        error?.response?.data?.detail ||
          "Nu am putut reactiva comanda"
      );
    }
  };

  const custName = (id) =>
    customers.find((customer) => customer.id === id)?.name || "-";

  return (
    <div
      className="space-y-6 animate-fade-in"
      data-testid="page-work-orders"
    >
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">
            Operațional
          </div>

          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">
            Lucrări / Comenzi
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
                label: WORK_ORDER_STATUS[item].label,
              })),
            ]}
            className="w-52"
          />

          <button
            type="button"
            onClick={openCreateModal}
            className="aj-btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2"
            data-testid="btn-new-wo"
          >
            <Plus size={16} /> Comandă nouă
          </button>
        </div>
      </div>

      <div className="aj-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-aj-cream/60">
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Titlu</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Avans</th>
                <th className="px-4 py-3">Rest</th>
                <th className="px-4 py-3">Creat</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Acțiuni</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Nicio comandă.
                  </td>
                </tr>
              )}

              {rows.map((workOrder) => {
                const total = Number(workOrder.total_amount || 0);
                const advance = Number(workOrder.advance_paid || 0);
                const remaining = Math.max(total - advance, 0);
                const isCancelled = workOrder.status === "anulat";

                return (
                  <tr
                    key={workOrder.id}
                    className={`border-t border-aj-line ${
                      isCancelled ? "bg-slate-50 opacity-70" : ""
                    }`}
                    data-testid={`wo-row-${workOrder.id}`}
                  >
                    <td
                      className={`px-4 py-3 font-semibold text-aj-navy ${
                        isCancelled ? "line-through text-slate-500" : ""
                      }`}
                    >
                      {workOrder.title}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {custName(workOrder.customer_id)}
                    </td>

                    <td className="px-4 py-3">
                      {total.toLocaleString("ro-RO")} lei
                    </td>

                    <td className="px-4 py-3">
                      {advance.toLocaleString("ro-RO")} lei
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {remaining.toLocaleString("ro-RO")} lei
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(workOrder.created_at)}
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={workOrder.status}
                        onChange={(event) =>
                          change(workOrder.id, {
                            status: event.target.value,
                          })
                        }
                        className="text-xs border border-aj-line rounded px-2 py-1"
                        data-testid={`wo-status-${workOrder.id}`}
                      >
                        {STATUSES.map((item) => (
                          <option key={item} value={item}>
                            {WORK_ORDER_STATUS[item].label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(workOrder)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-aj-line text-xs font-semibold text-aj-navy hover:bg-aj-cream transition"
                          data-testid={`btn-edit-wo-${workOrder.id}`}
                        >
                          <Pencil size={14} />
                          Modifică
                        </button>

                        {isCancelled ? (
                          <button
                            type="button"
                            onClick={() => reactivateWorkOrder(workOrder)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                            data-testid={`btn-reactivate-wo-${workOrder.id}`}
                          >
                            <RotateCcw size={14} />
                            Reactivează
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => cancelWorkOrder(workOrder)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                            data-testid={`btn-cancel-wo-${workOrder.id}`}
                          >
                            <XCircle size={14} />
                            Anulează
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        onClose={closeModal}
        title={editing ? "Editează lucrarea" : "Comandă nouă"}
        wide
        testId="modal-wo"
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Field label="Client" wide>
            <Select
              value={form.customer_id}
              onChange={(event) =>
                setForm({
                  ...form,
                  customer_id: event.target.value,
                })
              }
              options={[
                { value: "", label: "— alege clientul —" },
                ...customers.map((customer) => ({
                  value: customer.id,
                  label: customer.name,
                })),
              ]}
            />
          </Field>

<>
    <Field label="Număr comandă">
        <TextInput
            value={form.order_number}
            onChange={(e) =>
                setForm({
                    ...form,
                    order_number: e.target.value,
                })
            }
        />
    </Field>

    <Field label="Data">
        <TextInput
            type="date"
            value={form.order_date}
            onChange={(e) =>
                setForm({
                    ...form,
                    order_date: e.target.value,
                })
            }
        />
    </Field>

    <Field label="Termen livrare">
        <TextInput
            type="date"
            value={form.delivery_date}
            onChange={(e) =>
                setForm({
                    ...form,
                    delivery_date: e.target.value,
                })
            }
        />
    </Field>

    <Field label="Denumire comandă" wide>
        <TextInput
            value={form.title}
            onChange={(e) =>
                setForm({
                    ...form,
                    title: e.target.value,
                })
            }
        />
    </Field>

    <div className="col-span-full border-t pt-5 mt-2">

        <div className="flex items-center justify-between mb-4">

            <h3 className="font-bold text-lg">
                Produse comandate
            </h3>

            <button
                type="button"
                onClick={addProduct}
                className="aj-btn-gold px-3 py-2 rounded-lg"
            >
                + Adaugă produs
            </button>

        </div>

        {form.products.map((product) => (

            <div
                key={product.id}
                className="border rounded-xl p-4 mb-4 bg-white"
            >

                <div className="grid grid-cols-4 gap-3">

                    <TextInput
                        placeholder="Produs"
                        value={product.product}
                        onChange={(e)=>
                            updateProduct(product.id,"product",e.target.value)
                        }
                    />

                    <TextInput
                        placeholder="Camera"
                        value={product.room}
                        onChange={(e)=>
                            updateProduct(product.id,"room",e.target.value)
                        }
                    />

                    <TextInput
                        placeholder="Lățime"
                        value={product.width}
                        onChange={(e)=>
                            updateProduct(product.id,"width",e.target.value)
                        }
                    />

                    <TextInput
                        placeholder="Înălțime"
                        value={product.height}
                        onChange={(e)=>
                            updateProduct(product.id,"height",e.target.value)
                        }
                    />

                    <TextInput
                        placeholder="Cantitate"
                        type="number"
                        value={product.quantity}
                        onChange={(e)=>
                            updateProduct(product.id,"quantity",e.target.value)
                        }
                    />

                    <TextInput
                        placeholder="Preț"
                        type="number"
                        value={product.unit_price}
                        onChange={(e)=>
                            updateProduct(product.id,"unit_price",e.target.value)
                        }
                    />

                    <TextInput
                        placeholder="Discount"
                        type="number"
                        value={product.discount}
                        onChange={(e)=>
                            updateProduct(product.id,"discount",e.target.value)
                        }
                    />

                    <TextInput
                        disabled
                        value={product.total}
                    />

                </div>

                <div className="mt-3">

                    <TextArea
                        placeholder="Observații produs"
                        value={product.notes}
                        onChange={(e)=>
                            updateProduct(product.id,"notes",e.target.value)
                        }
                    />

                </div>

                <div className="flex justify-end mt-3">

                    <button
                        type="button"
                        onClick={() => removeProduct(product.id)}
                        className="text-red-600 text-sm"
                    >
                        Șterge produs
                    </button>

                </div>

            </div>

        ))}

    </div>

    <Field label="Avans">
        <TextInput
            type="number"
            value={form.advance_paid}
            onChange={(e)=>
                setForm({
                    ...form,
                    advance_paid:e.target.value,
                })
            }
        />
    </Field>

    <Field label="Rest de plată">

        <TextInput
            disabled
            value={Math.max(
                Number(form.total_amount)-Number(form.advance_paid),
                0
            )}

        />

    </Field>
</>

          <Field label="Observații" wide>
            <TextArea
              value={form.notes}
              onChange={(event) =>
                setForm({
                  ...form,
                  notes: event.target.value,
                })
              }
            />
          </Field>

          <div className="col-span-full flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-aj-line text-sm disabled:opacity-50"
            >
              Anulează
            </button>

            <button
              type="submit"
              disabled={saving}
              className="aj-btn-navy px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              data-testid="btn-save-wo"
            >
              {saving
                ? "Se salvează..."
                : editing
                  ? "Actualizează"
                  : "Salvează"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
