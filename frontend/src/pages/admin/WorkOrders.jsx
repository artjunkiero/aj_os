import {
  generateClientOrderDocument,
  generateProductionSheetDocument,
} from "@/lib/workOrderDocuments";
import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { WORK_ORDER_STATUS, formatDate } from "@/lib/status";
import Modal, {
  Field,
  TextInput,
  TextArea,
  Select,
} from "./_Modal";
import {
  Plus,
  Pencil,
  XCircle,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";

const STATUSES = Object.keys(WORK_ORDER_STATUS);

const PRODUCT_TYPES = [
  {
    value: "",
    label: "— Alege tipul produsului —",
    defaultUnit: "buc",
    allowedUnits: ["buc"],
  },
  {
    value: "roleta",
    label: "Roletă textilă",
    defaultUnit: "mp",
    allowedUnits: ["mp"],
  },
  {
    value: "daynight",
    label: "Day & Night",
    defaultUnit: "mp",
    allowedUnits: ["mp"],
  },
  {
    value: "plisse",
    label: "Jaluzea plisse",
    defaultUnit: "mp",
    allowedUnits: ["mp", "buc"],
  },
  {
    value: "venetiana",
    label: "Jaluzea venețiană",
    defaultUnit: "mp",
    allowedUnits: ["mp"],
  },
  {
    value: "verticala",
    label: "Jaluzea verticală",
    defaultUnit: "mp",
    allowedUnits: ["mp"],
  },
  {
    value: "rulou",
    label: "Rulou exterior",
    defaultUnit: "buc",
    allowedUnits: ["buc"],
  },
  {
    value: "plasa",
    label: "Plasă insecte",
    defaultUnit: "buc",
    allowedUnits: ["buc"],
  },
  {
    value: "draperie",
    label: "Draperie",
    defaultUnit: "ml",
    allowedUnits: ["ml"],
  },
  {
    value: "perdea",
    label: "Perdea",
    defaultUnit: "ml",
    allowedUnits: ["ml"],
  },
  {
    value: "galerie",
    label: "Galerie",
    defaultUnit: "buc",
    allowedUnits: ["buc"],
  },
  {
    value: "other",
    label: "Alte produse",
    defaultUnit: "buc",
    allowedUnits: ["mp", "ml", "buc"],
  },
];

const UNIT_OPTIONS = [
  {
    value: "mp",
    label: "Metru pătrat (mp)",
    priceLabel: "Lei/mp",
  },
  {
    value: "ml",
    label: "Metru liniar (ml)",
    priceLabel: "Lei/ml",
  },
  {
    value: "buc",
    label: "Bucată",
    priceLabel: "Lei/buc",
  },
];

const getProductTypeConfig = (productType) =>
  PRODUCT_TYPES.find((item) => item.value === productType) ||
  PRODUCT_TYPES[0];

const createId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
};

const createEmptyProduct = (position = 1) => ({
  id: createId(),
  position,

  product_type: "",
custom_product_name: "",
product: "",
collection: "",

unit: "buc",
length: "",

  room: "",

  width: "",
  height: "",
  quantity: 1,

  material: "",
  fabric_color: "",
  mechanism_color: "",

  control_side: "dreapta",
  cassette: false,
  guides: false,
  motorized: false,

  unit_price: 0,
  total: 0,

  notes: "",
});

const createEmptyForm = () => ({
  customer_id: "",

  order_number: "",
  order_date: new Date()
    .toISOString()
    .substring(0, 10),
  delivery_date: "",

  /*
   * Păstrat temporar pentru compatibilitate
   * cu backend-ul actual.
   * Nu este afișat în formular.
   */
  title: "",

  subtotal_amount: 0,
  order_discount: 0,
  total_amount: 0,
  advance_paid: 0,

  status: "lead",

  notes: "",

  products: [createEmptyProduct()],
});

const calculateProductTotal = (product) => {
  const quantity = Number(product.quantity || 0);
  const price = Number(product.unit_price || 0);

  switch (product.unit) {
    case "mp": {
      const width = Number(product.width || 0) / 1000;
      const height = Number(product.height || 0) / 1000;

      return width * height * quantity * price;
    }

    case "ml": {
      const length = Number(product.length || 0);

      return length * quantity * price;
    }

    case "buc":
    default:
      return quantity * price;
  }
};
const calculateMeasuredQuantity = (product) => {
  const quantity = Number(product.quantity || 0);

  switch (product.unit) {
    case "mp":
      return (
        (Number(product.width || 0) / 1000) *
        (Number(product.height || 0) / 1000) *
        quantity
      );

    case "ml":
      return Number(product.length || 0) * quantity;

    case "buc":
    default:
      return quantity;
  }
};

const calculateSubtotal = (products = []) =>
  products.reduce(
    (sum, product) =>
      sum + calculateProductTotal(product),
    0
  );

const calculateOrderTotal = (
  products = [],
  discount = 0
) =>
  Math.max(
    calculateSubtotal(products) -
      Number(discount || 0),
    0
  );

const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString(
    "ro-RO",
    {
      maximumFractionDigits: 2,
    }
  )} lei`;

const normalizeProduct = (
  product,
  index
) => {
  const normalized = {
    ...createEmptyProduct(index + 1),
    ...product,

    id: product?.id || createId(),
    position: index + 1,
  };

  normalized.total =
    calculateProductTotal(normalized);

  return normalized;
};

const getOrderNumber = (workOrder) => {
  if (workOrder?.order_number) {
    return workOrder.order_number;
  }

  const year = workOrder?.created_at
    ? new Date(
        workOrder.created_at
      ).getFullYear()
    : new Date().getFullYear();

  const suffix = String(
    workOrder?.id || ""
  )
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase();

  return suffix
    ? `AJ-${year}-${suffix}`
    : "—";
};

function InputLabel({ children }) {
  return (
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {children}
    </label>
  );
}

export default function AdminWorkOrders() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] =
    useState([]);

  const [open, setOpen] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] = useState(
    createEmptyForm()
  );

  const [status, setStatus] =
    useState("");

  const [search, setSearch] =
    useState("");

  const load = async () => {
    try {
      const [
        ordersResponse,
        customersResponse,
      ] = await Promise.all([
        api.get("/work-orders", {
          params: status
            ? {
                status,
              }
            : {},
        }),

        api.get("/customers"),
      ]);

      setRows(
        ordersResponse.data || []
      );

      setCustomers(
        customersResponse.data || []
      );
    } catch (error) {
      console.error(
        "Eroare la încărcarea comenzilor:",
        error
      );

      toast.error(
        error?.response?.data?.detail ||
          "Nu am putut încărca comenzile"
      );
    }
  };

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const customerName = (customerId) =>
    customers.find(
      (customer) =>
        customer.id === customerId
    )?.name || "-";

  const customerPhone = (customerId) =>
    customers.find(
      (customer) =>
        customer.id === customerId
    )?.phone || "";

  const filteredRows = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter(
      (workOrder) => {
        const number =
          getOrderNumber(
            workOrder
          ).toLowerCase();

        const client =
          customerName(
            workOrder.customer_id
          ).toLowerCase();

        const phone =
          customerPhone(
            workOrder.customer_id
          ).toLowerCase();

        return (
          number.includes(query) ||
          client.includes(query) ||
          phone.includes(query)
        );
      }
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    rows,
    customers,
    search,
  ]);

  const closeModal = () => {
    if (saving) {
      return;
    }

    setOpen(false);
    setEditing(null);
    setForm(createEmptyForm());
  };

  const openCreateModal = () => {
    setEditing(null);
    setForm(createEmptyForm());
    setOpen(true);
  };

  const openEditModal = (
    workOrder
  ) => {
    const products =
      Array.isArray(
        workOrder.products
      ) &&
      workOrder.products.length > 0
        ? workOrder.products.map(
            normalizeProduct
          )
        : [createEmptyProduct()];

    const subtotal =
      calculateSubtotal(products);

    const discount = Number(
      workOrder.order_discount || 0
    );

    setEditing(workOrder);

    setForm({
      customer_id:
        workOrder.customer_id || "",

      order_number:
        workOrder.order_number || "",

      order_date:
        workOrder.order_date ||
        workOrder.created_at?.substring?.(
          0,
          10
        ) ||
        new Date()
          .toISOString()
          .substring(0, 10),

      delivery_date:
        workOrder.delivery_date || "",

      title:
        workOrder.title || "",

      subtotal_amount: subtotal,

      order_discount: discount,

      total_amount:
        workOrder.total_amount !==
          undefined &&
        workOrder.total_amount !== null
          ? Number(
              workOrder.total_amount
            )
          : calculateOrderTotal(
              products,
              discount
            ),

      advance_paid: Number(
        workOrder.advance_paid || 0
      ),

      status:
        workOrder.status || "lead",

      notes:
        workOrder.notes || "",

      products,
    });

    setOpen(true);
  };

  const addProduct = () => {
    setForm((previous) => ({
      ...previous,

      products: [
        ...previous.products,

        createEmptyProduct(
          previous.products.length + 1
        ),
      ],
    }));
  };

  const removeProduct = (
    productId
  ) => {
    setForm((previous) => {
      if (
        previous.products.length === 1
      ) {
        toast.error(
          "Comanda trebuie să conțină cel puțin un produs"
        );

        return previous;
      }

      const products =
        previous.products
          .filter(
            (product) =>
              product.id !== productId
          )
          .map(
            (product, index) => ({
              ...product,
              position: index + 1,
            })
          );

      return {
        ...previous,

        products,

        subtotal_amount:
          calculateSubtotal(products),

        total_amount:
          calculateOrderTotal(
            products,
            previous.order_discount
          ),
      };
    });
  };

  const updateProduct = (
  productId,
  field,
  value
) => {
  setForm((previous) => {
    const products = previous.products.map(
      (product) => {
        if (product.id !== productId) {
          return product;
        }

        let updatedProduct = {
          ...product,
          [field]: value,
        };

        if (field === "product_type") {
          const productConfig =
            getProductTypeConfig(value);

          updatedProduct = {
            ...updatedProduct,
            unit: productConfig.defaultUnit,
            custom_product_name:
              value === "other"
                ? updatedProduct.custom_product_name
                : "",
          };

          if (
            productConfig.defaultUnit !== "mp"
          ) {
            updatedProduct.width = "";
            updatedProduct.height = "";
          }

          if (
            productConfig.defaultUnit !== "ml"
          ) {
            updatedProduct.length = "";
          }
        }

        if (field === "unit") {
          if (value !== "mp") {
            updatedProduct.width = "";
            updatedProduct.height = "";
          }

          if (value !== "ml") {
            updatedProduct.length = "";
          }
        }


            updatedProduct.total =
              calculateProductTotal(
                updatedProduct
              );

            return updatedProduct;
          }
        );

      return {
        ...previous,

        products,

        subtotal_amount:
          calculateSubtotal(products),

        total_amount:
          calculateOrderTotal(
            products,
            previous.order_discount
          ),
      };
    });
  };

  const updateOrderDiscount = (
    value
  ) => {
    setForm((previous) => ({
      ...previous,

      order_discount: value,

      total_amount:
        calculateOrderTotal(
          previous.products,
          value
        ),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.customer_id) {
      toast.error(
        "Selectează clientul"
      );

      return;
    }

    if (!form.order_date) {
      toast.error(
        "Data comenzii este obligatorie"
      );

      return;
    }

    if (!form.products.length) {
      toast.error(
        "Adaugă cel puțin un produs"
      );

      return;
    }

    const invalidProduct =
      form.products.find(
        (product) =>
          !product.product_type ||
          Number(
            product.quantity || 0
          ) <= 0
      );

    if (invalidProduct) {
      toast.error(
        `Completează tipul produsului și cantitatea pentru poziția ${
          invalidProduct.position || 1
        }`
      );

      return;
    }

    const payload = {
      ...form,

      /*
       * Compatibilitate temporară cu
       * modelul vechi din backend.
       */
      title:
        form.title ||
        (form.order_number
          ? `Comanda ${form.order_number}`
          : "Comandă ART JUNKIE"),

      subtotal_amount:
        Number(
          form.subtotal_amount
        ) || 0,

      order_discount:
        Number(
          form.order_discount
        ) || 0,

      total_amount:
        Number(
          form.total_amount
        ) || 0,

      advance_paid:
        Number(
          form.advance_paid
        ) || 0,

      products: form.products.map(
        (product, index) => ({
          ...product,

          position: index + 1,

          quantity:
            Number(
              product.quantity
            ) || 0,

          width:
            product.width === ""
              ? ""
              : Number(
                  product.width
                ) || 0,

          height:
            product.height === ""
              ? ""
              : Number(
                  product.height
                ) || 0,

          unit_price:
            Number(
              product.unit_price
            ) || 0,

          total:
            calculateProductTotal(
              product
            ),
        })
      ),
    };

    try {
      setSaving(true);

      if (editing?.id) {
        await api.patch(
          `/work-orders/${editing.id}`,
          payload
        );

        toast.success(
          "Comanda a fost actualizată"
        );
      } else {
        await api.post(
          "/work-orders",
          payload
        );

        toast.success(
          "Comanda a fost creată"
        );
      }

      setOpen(false);
      setEditing(null);
      setForm(createEmptyForm());

      await load();

      window.dispatchEvent(
        new Event(
          "dashboard:refresh"
        )
      );
    } catch (error) {
      console.error(
        "Eroare la salvarea comenzii:",
        error
      );

      toast.error(
        error?.response?.data?.detail ||
          "Nu am putut salva comanda"
      );
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (
    id,
    nextStatus
  ) => {
    try {
      await api.patch(
        `/work-orders/${id}`,
        {
          status: nextStatus,
        }
      );

      await load();

      window.dispatchEvent(
        new Event(
          "dashboard:refresh"
        )
      );
    } catch (error) {
      console.error(
        "Eroare la actualizarea comenzii:",
        error
      );

      toast.error(
        error?.response?.data?.detail ||
          "Nu am putut actualiza comanda"
      );
    }
  };

  const cancelWorkOrder = async (
    workOrder
  ) => {
    const confirmed =
      window.confirm(
        `Sigur dorești să anulezi comanda ${getOrderNumber(
          workOrder
        )}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await api.patch(
        `/work-orders/${workOrder.id}`,
        {
          status: "anulat",
        }
      );

      toast.success(
        "Comanda a fost anulată"
      );

      await load();

      window.dispatchEvent(
        new Event(
          "dashboard:refresh"
        )
      );

      window.dispatchEvent(
        new Event(
          "calendar:refresh"
        )
      );
    } catch (error) {
      console.error(
        "Eroare la anularea comenzii:",
        error
      );

      toast.error(
        error?.response?.data?.detail ||
          "Nu am putut anula comanda"
      );
    }
  };

  const reactivateWorkOrder =
    async (workOrder) => {
      const confirmed =
        window.confirm(
          `Sigur dorești să reactivezi comanda ${getOrderNumber(
            workOrder
          )}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.patch(
          `/work-orders/${workOrder.id}`,
          {
            status: "lead",
          }
        );

        toast.success(
          "Comanda a fost reactivată"
        );

        await load();

        window.dispatchEvent(
          new Event(
            "dashboard:refresh"
          )
        );
      } catch (error) {
        console.error(
          "Eroare la reactivarea comenzii:",
          error
        );

        toast.error(
          error?.response?.data
            ?.detail ||
            "Nu am putut reactiva comanda"
        );
      }
    };

  const remainingAmount =
    Math.max(
      Number(
        form.total_amount || 0
      ) -
        Number(
          form.advance_paid || 0
        ),
      0
    );

  return (
    <div
      className="space-y-6 animate-fade-in"
      data-testid="page-work-orders"
    >
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">
            Operațional
          </div>

          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">
            Comenzi
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Administrarea comenzilor,
            produselor și încasărilor.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="aj-btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2"
          data-testid="btn-new-wo"
        >
          <Plus size={16} />

          Comandă nouă
        </button>
      </div>

      <div className="aj-card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Caută după număr comandă, client sau telefon..."
              className="w-full h-11 rounded-lg border border-aj-line bg-white pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-aj-gold/30"
            />
          </div>

          <Select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
            options={[
              {
                value: "",
                label:
                  "Toate statusurile",
              },

              ...STATUSES.map(
                (item) => ({
                  value: item,

                  label:
                    WORK_ORDER_STATUS[
                      item
                    ].label,
                })
              ),
            ]}
            className="w-full lg:w-56"
          />
        </div>
      </div>

      <div className="aj-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-aj-cream/60">
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">
                  Nr. comandă
                </th>

                <th className="px-4 py-3">
                  Client
                </th>

                <th className="px-4 py-3">
                  Produse
                </th>

                <th className="px-4 py-3">
                  Total
                </th>

                <th className="px-4 py-3">
                  Avans
                </th>

                <th className="px-4 py-3">
                  Rest
                </th>

                <th className="px-4 py-3">
                  Livrare
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-4 py-3 text-right">
                  Acțiuni
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length ===
                0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    {search
                      ? "Nu am găsit comenzi pentru această căutare."
                      : "Nu există comenzi."}
                  </td>
                </tr>
              )}

              {filteredRows.map(
                (workOrder) => {
                  const total = Number(
                    workOrder.total_amount ||
                      0
                  );

                  const advance =
                    Number(
                      workOrder.advance_paid ||
                        0
                    );

                  const remaining =
                    Math.max(
                      total - advance,
                      0
                    );

                  const isCancelled =
                    workOrder.status ===
                    "anulat";

                  const productsCount =
                    Array.isArray(
                      workOrder.products
                    )
                      ? workOrder.products.reduce(
                          (
                            sum,
                            product
                          ) =>
                            sum +
                            Number(
                              product.quantity ||
                                0
                            ),
                          0
                        )
                      : 0;

                  return (
                    <tr
                      key={
                        workOrder.id
                      }
                      className={`border-t border-aj-line ${
                        isCancelled
                          ? "bg-slate-50 opacity-70"
                          : ""
                      }`}
                      data-testid={`wo-row-${workOrder.id}`}
                    >
                      <td className="px-4 py-3">
                        <div
                          className={`font-bold text-aj-navy ${
                            isCancelled
                              ? "line-through text-slate-500"
                              : ""
                          }`}
                        >
                          {getOrderNumber(
                            workOrder
                          )}
                        </div>

                        <div className="text-xs text-slate-400 mt-0.5">
                          {formatDate(
                            workOrder.created_at
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {customerName(
                            workOrder.customer_id
                          )}
                        </div>

                        {customerPhone(
                          workOrder.customer_id
                        ) && (
                          <div className="text-xs text-slate-400">
                            {customerPhone(
                              workOrder.customer_id
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {productsCount ||
                          "—"}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {formatMoney(
                          total
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {formatMoney(
                          advance
                        )}
                      </td>

                      <td className="px-4 py-3 font-semibold">
                        {formatMoney(
                          remaining
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {workOrder.delivery_date
                          ? formatDate(
                              workOrder.delivery_date
                            )
                          : "—"}
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={
                            workOrder.status
                          }
                          onChange={(
                            event
                          ) =>
                            changeStatus(
                              workOrder.id,
                              event.target
                                .value
                            )
                          }
                          className="text-xs border border-aj-line rounded px-2 py-1.5 bg-white"
                          data-testid={`wo-status-${workOrder.id}`}
                        >
                          {STATUSES.map(
                            (item) => (
                              <option
                                key={
                                  item
                                }
                                value={
                                  item
                                }
                              >
                                {
                                  WORK_ORDER_STATUS[
                                    item
                                  ].label
                                }
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                workOrder
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-aj-line text-xs font-semibold text-aj-navy hover:bg-aj-cream transition"
                          >
                            <Pencil
                              size={14}
                            />

                            Modifică
                          </button>

                          {isCancelled ? (
                            <button
                              type="button"
                              onClick={() =>
                                reactivateWorkOrder(
                                  workOrder
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700"
                            >
                              <RotateCcw
                                size={14}
                              />

                              Reactivează
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                cancelWorkOrder(
                                  workOrder
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700"
                            >
                              <XCircle
                                size={14}
                              />

                              Anulează
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        onClose={closeModal}
        title={
          editing
            ? "Editează comanda"
            : "Comandă nouă"
        }
        wide
        testId="modal-wo"
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Field
            label="Client"
            wide
          >
            <Select
              value={
                form.customer_id
              }
              onChange={(event) =>
                setForm(
                  (previous) => ({
                    ...previous,

                    customer_id:
                      event.target
                        .value,
                  })
                )
              }
              options={[
                {
                  value: "",

                  label:
                    "— Alege clientul —",
                },

                ...customers.map(
                  (customer) => ({
                    value:
                      customer.id,

                    label:
                      customer.name,
                  })
                ),
              ]}
            />
          </Field>

          <Field label="Număr comandă">
            <TextInput
              value={
                form.order_number ||
                (editing
                  ? getOrderNumber(
                      editing
                    )
                  : "Se generează automat la salvare")
              }
              disabled
            />
          </Field>

          <Field label="Data comenzii">
            <TextInput
              type="date"
              value={
                form.order_date
              }
              onChange={(event) =>
                setForm(
                  (previous) => ({
                    ...previous,

                    order_date:
                      event.target
                        .value,
                  })
                )
              }
            />
          </Field>

          <Field label="Termen de livrare">
            <TextInput
              type="date"
              value={
                form.delivery_date
              }
              onChange={(event) =>
                setForm(
                  (previous) => ({
                    ...previous,

                    delivery_date:
                      event.target
                        .value,
                  })
                )
              }
            />
          </Field>

          <Field label="Status comandă">
            <Select
              value={form.status}
              onChange={(event) =>
                setForm(
                  (previous) => ({
                    ...previous,

                    status:
                      event.target
                        .value,
                  })
                )
              }
              options={STATUSES.map(
                (item) => ({
                  value: item,

                  label:
                    WORK_ORDER_STATUS[
                      item
                    ].label,
                })
              )}
            />
          </Field>

          <div className="col-span-full border-t border-aj-line pt-5 mt-2">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-lg text-aj-navy">
                  Produse comandate
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Completează separat
                  fiecare produs sau
                  poziție din comandă.
                </p>
              </div>

              <button
                type="button"
                onClick={addProduct}
                className="aj-btn-gold px-3 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={15} />

                Adaugă produs
              </button>
            </div>

            <div className="space-y-4">
              {form.products.map(
                (
                  product,
                  productIndex
                ) => (
                  <div
                    key={product.id}
                    className="border border-aj-line rounded-xl p-4 bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-slate-400">
                          Poziția{" "}
                          {productIndex +
                            1}
                        </div>

                        <div className="font-bold text-aj-navy">
                          {PRODUCT_TYPES.find(
                            (item) =>
                              item.value ===
                              product.product_type
                          )?.label ||
                            "Produs necompletat"}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeProduct(
                            product.id
                          )
                        }
                        className="inline-flex items-center gap-1.5 text-red-600 text-sm font-medium"
                      >
                        <Trash2
                          size={15}
                        />

                        Șterge
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <InputLabel>
                          Tip produs
                        </InputLabel>

                        <Select
                          value={
                            product.product_type
                          }
                          onChange={(
                            event
                          ) =>
                            updateProduct(
                              product.id,
                              "product_type",
                              event.target
                                .value
                            )
                          }
                          options={
                            PRODUCT_TYPES
                          }
                        />
                      </div>
{product.product_type === "other" && (
  <div>
    <InputLabel>
      Denumire produs
    </InputLabel>

    <TextInput
      placeholder="Ex.: Lambriu decorativ"
      value={
        product.custom_product_name
      }
      onChange={(event) =>
        updateProduct(
          product.id,
          "custom_product_name",
          event.target.value
        )
      }
    />
  </div>
)}
                      <div>
                        <InputLabel>
                          Camera /
                          încăperea
                        </InputLabel>

                        <TextInput
                          placeholder="Ex.: Living, Dormitor"
                          value={
                            product.room
                          }
                          onChange={(
                            event
                          ) =>
                            updateProduct(
                              product.id,
                              "room",
                              event.target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <InputLabel>
                          Model / denumire
                        </InputLabel>

                        <TextInput
                          placeholder="Ex.: Blackout Premium"
                          value={
                            product.product
                          }
                          onChange={(
                            event
                          ) =>
                            updateProduct(
                              product.id,
                              "product",
                              event.target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <InputLabel>
                          Colecție
                        </InputLabel>

                        <TextInput
                          placeholder="Ex.: Carina"
                          value={
                            product.collection
                          }
                          onChange={(
                            event
                          ) =>
                            updateProduct(
                              product.id,
                              "collection",
                              event.target
                                .value
                            )
                          }
                        />
                      </div>

{product.unit === "mp" && (
  <>
    <div>
      <InputLabel>
        Lățime (mm)
      </InputLabel>

      <TextInput
        type="number"
        min="0"
        step="1"
        placeholder="Ex.: 1200"
        value={product.width}
        onChange={(event) =>
          updateProduct(
            product.id,
            "width",
            event.target.value
          )
        }
      />
    </div>

    <div>
      <InputLabel>
        Înălțime (mm)
      </InputLabel>

      <TextInput
        type="number"
        min="0"
        step="1"
        placeholder="Ex.: 1800"
        value={product.height}
        onChange={(event) =>
          updateProduct(
            product.id,
            "height",
            event.target.value
          )
        }
      />
    </div>
  </>
)}
{product.unit === "ml" && (
  <div>
    <InputLabel>
      Lungime (m)
    </InputLabel>

    <TextInput
      type="number"
      min="0"
      step="0.01"
      placeholder="Ex.: 6.5"
      value={product.length}
      onChange={(event) =>
        updateProduct(
          product.id,
          "length",
          event.target.value
        )
      }
    />
  </div>
)}
                      <div>
<InputLabel>
  Cantitate
</InputLabel>

                        <TextInput
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Număr bucăți"
                          value={
                            product.quantity
                          }
                          onChange={(
                            event
                          ) =>
                            updateProduct(
                              product.id,
                              "quantity",
                              event.target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <InputLabel>
                          Material
                        </InputLabel>

                        <TextInput
                          placeholder="Ex.: Blackout, Voal"
                          value={
                            product.material
                          }
                          onChange={(
                            event
                          ) =>
                            updateProduct(
                              product.id,
                              "material",
                              event.target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <InputLabel>
                          Culoare material
                        </InputLabel>

                        <TextInput
                          placeholder="Ex.: Crem, Cod 102"
                          value={
                            product.fabric_color
                          }
                          onChange={(
                            event
                          ) =>
                            updateProduct(
                              product.id,
                              "fabric_color",
                              event.target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <InputLabel>
                          Culoare mecanism
                        </InputLabel>

                        <TextInput
                          placeholder="Ex.: Alb, Antracit"
                          value={
                            product.mechanism_color
                          }
                          onChange={(
                            event
                          ) =>
                            updateProduct(
                              product.id,
                              "mechanism_color",
                              event.target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <InputLabel>
                          Parte acționare
                        </InputLabel>

                        <Select
                          value={
                            product.control_side
                          }
                          onChange={(
                            event
                          ) =>
                            updateProduct(
                              product.id,
                              "control_side",
                              event.target
                                .value
                            )
                          }
                          options={[
                            {
                              value:
                                "dreapta",

                              label:
                                "Dreapta",
                            },

                            {
                              value:
                                "stanga",

                              label:
                                "Stânga",
                            },

                            {
                              value:
                                "fara",

                              label:
                                "Fără acționare",
                            },
                          ]}
                        />
                      </div>

                      <div>
<InputLabel>
  {UNIT_OPTIONS.find(
    (item) =>
      item.value === (product.unit || "buc")
  )?.priceLabel || "Lei"}
</InputLabel>

                        <TextInput
                          type="number"
                          min="0"
                          step="0.01"
placeholder={
  UNIT_OPTIONS.find(
    (item) =>
      item.value === (product.unit || "buc")
  )?.priceLabel || "Lei"
}
                          value={
                            product.unit_price
                          }
                          onChange={(
                            event
                          ) =>
                            updateProduct(
                              product.id,
                              "unit_price",
                              event.target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <InputLabel>
                          Total poziție
                        </InputLabel>

                        <TextInput
                          disabled
                          value={formatMoney(
                            product.total
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                      <label className="flex items-center gap-2 rounded-lg border border-aj-line p-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(
                            product.cassette
                          )}
                          onChange={(
                            event
                          ) =>
                            updateProduct(
                              product.id,
                              "cassette",
                              event.target
                                .checked
                            )
                          }
                        />

                        <span className="text-sm font-medium">
                          Casetă
                        </span>
                      </label>

                      <label className="flex items-center gap-2 rounded-lg border border-aj-line p-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(
                            product.guides
                          )}
                          onChange={(
                            event
                          ) =>
                            updateProduct(
                              product.id,
                              "guides",
                              event.target
                                .checked
                            )
                          }
                        />

                        <span className="text-sm font-medium">
                          Ghidaje
                        </span>
                      </label>

                      <label className="flex items-center gap-2 rounded-lg border border-aj-line p-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(
                            product.motorized
                          )}
                          onChange={(
                            event
                          ) =>
                            updateProduct(
                              product.id,
                              "motorized",
                              event.target
                                .checked
                            )
                          }
                        />

                        <span className="text-sm font-medium">
                          Motorizare
                        </span>
                      </label>
                    </div>

                    <div className="mt-4">
                      <InputLabel>
                        Detalii și
                        observații pentru
                        produs
                      </InputLabel>

                      <TextArea
                        placeholder="Ex.: particularități de execuție, montaj, material, culoare sau acționare..."
                        value={
                          product.notes
                        }
                        onChange={(
                          event
                        ) =>
                          updateProduct(
                            product.id,
                            "notes",
                            event.target
                              .value
                          )
                        }
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="col-span-full border-t border-aj-line pt-5 mt-2">
            <h3 className="font-bold text-lg text-aj-navy mb-1">
              Situație financiară
            </h3>

            <p className="text-xs text-slate-500 mb-4">
              Discountul se aplică
              întregii comenzi, nu
              fiecărui produs separat.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <InputLabel>
                  Subtotal produse
                </InputLabel>

                <TextInput
                  disabled
                  value={formatMoney(
                    form.subtotal_amount
                  )}
                />
              </div>

              <div>
                <InputLabel>
                  Discount comandă
                  (lei)
                </InputLabel>

                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Reducerea totală"
                  value={
                    form.order_discount
                  }
                  onChange={(event) =>
                    updateOrderDiscount(
                      event.target.value
                    )
                  }
                />
              </div>

              <div>
                <InputLabel>
                  Total comandă
                </InputLabel>

                <TextInput
                  disabled
                  value={formatMoney(
                    form.total_amount
                  )}
                />
              </div>

              <div>
                <InputLabel>
                  Avans încasat
                  (lei)
                </InputLabel>

                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Suma achitată"
                  value={
                    form.advance_paid
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,

                        advance_paid:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </div>

              <div>
                <InputLabel>
                  Rest de plată
                </InputLabel>

                <TextInput
                  disabled
                  value={formatMoney(
                    remainingAmount
                  )}
                />
              </div>
            </div>
          </div>

          <Field
            label="Observații generale comandă"
            wide
          >
            <TextArea
              placeholder="Ex.: informații pentru producție, livrare, montaj sau client..."
              value={form.notes}
              onChange={(event) =>
                setForm(
                  (previous) => ({
                    ...previous,

                    notes:
                      event.target
                        .value,
                  })
                )
              }
            />
          </Field>

          <div className="col-span-full flex justify-end gap-2 pt-2">
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
                  ? "Actualizează comanda"
                  : "Salvează comanda"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
