import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Pencil,
  Plus,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import {
  generateClientOrderDocument,
  generateProductionSheetDocument,
} from "@/lib/workOrderDocuments";
import {
  WORK_ORDER_STATUS,
  formatDate,
} from "@/lib/status";

import useWorkOrderCalculations from "@/hooks/useWorkOrderCalculations";
import {
  calculateProductValue,
  createEmptyDimension,
  round,
  toNumber,
} from "@/utils/workOrderCalculations";

import Modal, {
  Field,
  Select,
  TextArea,
  TextInput,
} from "./_Modal";
import FinancialSummary from "./FinancialSummary";
import ProductCard from "./ProductCard";

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
    allowedUnits: ["buc", "ml", "set"],
  },
  {
    value: "other",
    label: "Alte produse",
    defaultUnit: "buc",
    allowedUnits: ["mp", "ml", "buc", "set"],
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
  {
    value: "set",
    label: "Set",
    priceLabel: "Lei/set",
  },
];

const getProductTypeConfig = (productType) =>
  PRODUCT_TYPES.find(
    (item) => item.value === productType
  ) || PRODUCT_TYPES[0];

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

  /*
   * Câmpurile vechi sunt păstrate pentru
   * compatibilitatea cu comenzile existente.
   */
  width: "",
  height: "",
  length: "",
  quantity: 1,

  /*
   * Noua structură folosită de ProductDimensions.
   */
  dimensions: [
    {
      ...createEmptyDimension(),
      quantity: 1,
    },
  ],

  room: "",

  material: "",
  fabric_color: "",
  mechanism_color: "",

  control_side: "dreapta",

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
   * Păstrat pentru compatibilitatea
   * cu modelul existent din backend.
   */
  title: "",

  discount_mode: "fixed",
  discount_value: 0,

  vat_enabled: false,
  vat_rate: 21,

  advance_paid: 0,

  status: "lead",
  notes: "",

  products: [createEmptyProduct()],
});

const normalizeDimension = (
  dimension,
  index = 0
) => ({
  ...createEmptyDimension(),
  ...dimension,

  id:
    dimension?.id ||
    `${createId()}-${index}`,

  width:
    dimension?.width ??
    "",

  height:
    dimension?.height ??
    "",

  length:
    dimension?.length ??
    "",

  quantity:
    dimension?.quantity === "" ||
    dimension?.quantity === undefined ||
    dimension?.quantity === null
      ? 1
      : dimension.quantity,
});

const getLegacyDimension = (product) => ({
  ...createEmptyDimension(),

  width:
    product?.width ??
    "",

  height:
    product?.height ??
    "",

  length:
    product?.length ??
    "",

  quantity:
    product?.quantity === "" ||
    product?.quantity === undefined ||
    product?.quantity === null
      ? 1
      : product.quantity,
});

const normalizeProduct = (
  product,
  index
) => {
  const savedDimensions =
    Array.isArray(product?.dimensions) &&
    product.dimensions.length > 0
      ? product.dimensions.map(
          normalizeDimension
        )
      : [getLegacyDimension(product)];

  const normalized = {
    ...createEmptyProduct(index + 1),
    ...product,

    id: product?.id || createId(),
    position: index + 1,
    dimensions: savedDimensions,
  };

  normalized.total =
    calculateProductValue(normalized);

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

const formatMoney = (value) =>
  `${toNumber(value).toLocaleString(
    "ro-RO",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )} lei`;

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

  const newProductIdRef = useRef(null);

  const financialSummary =
    useWorkOrderCalculations({
      products: form.products,

      discountMode:
        form.discount_mode,

      discountValue:
        form.discount_value,

      vatEnabled:
        form.vat_enabled,

      vatRate:
        form.vat_rate,
    });

  const remainingAmount = Math.max(
    toNumber(
      financialSummary.grandTotal
    ) -
      toNumber(form.advance_paid),
    0
  );

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

  useEffect(() => {
    const productId =
      newProductIdRef.current;

    if (!open || !productId) {
      return;
    }

    const frameId =
      window.requestAnimationFrame(
        () => {
          const productElement =
            document.getElementById(
              `product-card-${productId}`
            );

          productElement?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          const firstInput =
            productElement?.querySelector(
              "select, input, textarea"
            );

          firstInput?.focus?.();

          newProductIdRef.current =
            null;
        }
      );

    return () =>
      window.cancelAnimationFrame(
        frameId
      );
  }, [form.products.length, open]);

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
  }, [rows, customers, search]);

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

    const savedDiscountMode =
      workOrder.discount_mode ||
      "fixed";

    const savedDiscountValue =
      workOrder.discount_value !==
        undefined &&
      workOrder.discount_value !== null
        ? workOrder.discount_value
        : workOrder.order_discount || 0;

    const savedVatEnabled =
      workOrder.vat_enabled !==
        undefined &&
      workOrder.vat_enabled !== null
        ? Boolean(
            workOrder.vat_enabled
          )
        : false;

    const savedVatRate =
      workOrder.vat_rate !==
        undefined &&
      workOrder.vat_rate !== null
        ? workOrder.vat_rate
        : 21;

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

      discount_mode:
        savedDiscountMode,

      discount_value:
        savedDiscountValue,

      vat_enabled:
        savedVatEnabled,

      vat_rate:
        savedVatRate,

      advance_paid:
        toNumber(
          workOrder.advance_paid
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
    const newProduct =
      createEmptyProduct(
        form.products.length + 1
      );

    newProductIdRef.current =
      newProduct.id;

    setForm((previous) => ({
      ...previous,

      products: [
        ...previous.products,

        {
          ...newProduct,
          position:
            previous.products.length +
            1,
        },
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
              product.id !==
              productId
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
      };
    });
  };

  const updateProduct = (
    productId,
    field,
    value
  ) => {
    setForm((previous) => {
      const products =
        previous.products.map(
          (product) => {
            if (
              product.id !== productId
            ) {
              return product;
            }

            let updatedProduct = {
              ...product,
              [field]: value,
            };

            if (
              field === "product_type"
            ) {
              const productConfig =
                getProductTypeConfig(
                  value
                );

              updatedProduct = {
                ...updatedProduct,

                unit:
                  productConfig.defaultUnit,

                custom_product_name:
                  value === "other"
                    ? updatedProduct.custom_product_name
                    : "",
              };
            }

            if (
              field === "dimensions"
            ) {
              const dimensions =
                Array.isArray(value) &&
                value.length > 0
                  ? value.map(
                      normalizeDimension
                    )
                  : [
                      {
                        ...createEmptyDimension(),
                        quantity: 1,
                      },
                    ];

              updatedProduct = {
                ...updatedProduct,
                dimensions,
              };
            }

            updatedProduct.total =
              calculateProductValue(
                updatedProduct
              );

            return updatedProduct;
          }
        );

      return {
        ...previous,
        products,
      };
    });
  };

  const validateProducts = () => {
    const invalidProduct =
      form.products.find(
        (product) =>
          !product.product_type
      );

    if (invalidProduct) {
      toast.error(
        `Alege tipul produsului pentru poziția ${
          invalidProduct.position || 1
        }`
      );

      return false;
    }

    for (
      let productIndex = 0;
      productIndex <
      form.products.length;
      productIndex += 1
    ) {
      const product =
        form.products[
          productIndex
        ];

      if (
        !Array.isArray(
          product.dimensions
        ) ||
        product.dimensions.length === 0
      ) {
        toast.error(
          `Adaugă cel puțin o dimensiune pentru poziția ${
            product.position ||
            productIndex + 1
          }`
        );

        return false;
      }

      for (
        let dimensionIndex = 0;
        dimensionIndex <
        product.dimensions.length;
        dimensionIndex += 1
      ) {
        const dimension =
          product.dimensions[
            dimensionIndex
          ];

        if (
          toNumber(
            dimension.quantity
          ) <= 0
        ) {
          toast.error(
            `Cantitatea trebuie să fie mai mare decât zero la poziția ${
              product.position ||
              productIndex + 1
            }, dimensiunea ${
              dimensionIndex + 1
            }`
          );

          return false;
        }

        if (
          product.unit === "mp" &&
          (toNumber(
            dimension.width
          ) <= 0 ||
            toNumber(
              dimension.height
            ) <= 0)
        ) {
          toast.error(
            `Completează lățimea și înălțimea la poziția ${
              product.position ||
              productIndex + 1
            }, dimensiunea ${
              dimensionIndex + 1
            }`
          );

          return false;
        }

        if (
          product.unit === "ml" &&
          toNumber(
            dimension.length
          ) <= 0
        ) {
          toast.error(
            `Completează lungimea la poziția ${
              product.position ||
              productIndex + 1
            }, dimensiunea ${
              dimensionIndex + 1
            }`
          );

          return false;
        }
      }
    }

    return true;
  };

  const prepareProductPayload = (
    product,
    index
  ) => {
    const dimensions =
      Array.isArray(
        product.dimensions
      ) &&
      product.dimensions.length > 0
        ? product.dimensions.map(
            (dimension) => ({
              ...dimension,

              width:
                dimension.width === ""
                  ? ""
                  : toNumber(
                      dimension.width
                    ),

              height:
                dimension.height === ""
                  ? ""
                  : toNumber(
                      dimension.height
                    ),

              length:
                dimension.length === ""
                  ? ""
                  : toNumber(
                      dimension.length
                    ),

              quantity:
                toNumber(
                  dimension.quantity
                ),
            })
          )
        : [
            getLegacyDimension(
              product
            ),
          ];

    const firstDimension =
      dimensions[0] || {};

    const totalQuantity =
      dimensions.reduce(
        (sum, dimension) =>
          sum +
          toNumber(
            dimension.quantity
          ),
        0
      );

    return {
      ...product,

      position: index + 1,

      dimensions,

      /*
       * Compatibilitate cu documentele
       * și modelele vechi.
       */
      width:
        firstDimension.width ?? "",

      height:
        firstDimension.height ?? "",

      length:
        firstDimension.length ?? "",

      quantity: totalQuantity,

      unit_price:
        toNumber(
          product.unit_price
        ),

      total: round(
        calculateProductValue(
          product
        )
      ),
    };
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

    if (!validateProducts()) {
      return;
    }

    const preparedProducts =
      form.products.map(
        prepareProductPayload
      );

    const payload = {
      customer_id:
        form.customer_id,

      order_number:
        form.order_number || "",

      order_date:
        form.order_date,

      delivery_date:
        form.delivery_date || "",

      title:
        form.title ||
        (form.order_number
          ? `Comanda ${form.order_number}`
          : "Comandă ART JUNKIE"),

      status:
        form.status,

      notes:
        form.notes || "",

      products:
        preparedProducts,

      discount_mode:
        form.discount_mode,

      discount_value:
        toNumber(
          form.discount_value
        ),

      /*
       * order_discount rămâne suma
       * efectivă a reducerii pentru
       * compatibilitatea cu backend-ul.
       */
      order_discount:
        toNumber(
          financialSummary.discountAmount
        ),

      vat_enabled:
        Boolean(
          form.vat_enabled
        ),

      vat_rate:
        toNumber(form.vat_rate),

      vat_amount:
        toNumber(
          financialSummary.vatAmount
        ),

      subtotal_amount:
        toNumber(
          financialSummary.subtotal
        ),

      total_amount:
        toNumber(
          financialSummary.grandTotal
        ),

      advance_paid:
        toNumber(
          form.advance_paid
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

      window.dispatchEvent(
        new Event(
          "calendar:refresh"
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

      window.dispatchEvent(
        new Event(
          "calendar:refresh"
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

        window.dispatchEvent(
          new Event(
            "calendar:refresh"
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

  const printClientOrder = (
    workOrder
  ) => {
    const customer =
      customers.find(
        (item) =>
          item.id ===
          workOrder.customer_id
      );

    generateClientOrderDocument(
      workOrder,
      customer
    );
  };

  const printProductionSheet = (
    workOrder
  ) => {
    const customer =
      customers.find(
        (item) =>
          item.id ===
          workOrder.customer_id
      );

    generateProductionSheetDocument(
      workOrder,
      customer
    );
  };

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
                  const total =
                    toNumber(
                      workOrder.total_amount
                    );

                  const advance =
                    toNumber(
                      workOrder.advance_paid
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
                          ) => {
                            if (
                              Array.isArray(
                                product.dimensions
                              ) &&
                              product.dimensions
                                .length > 0
                            ) {
                              return (
                                sum +
                                product.dimensions.reduce(
                                  (
                                    dimensionSum,
                                    dimension
                                  ) =>
                                    dimensionSum +
                                    toNumber(
                                      dimension.quantity
                                    ),
                                  0
                                )
                              );
                            }

                            return (
                              sum +
                              toNumber(
                                product.quantity
                              )
                            );
                          },
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
                          <details className="relative">
                            <summary className="list-none cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-aj-line text-xs font-semibold text-aj-navy hover:bg-aj-cream transition">
                              📄 Documente
                            </summary>

                            <div className="absolute right-0 mt-2 w-60 rounded-lg border border-aj-line bg-white shadow-xl z-50">
                              <button
                                type="button"
                                onClick={() =>
                                  printClientOrder(
                                    workOrder
                                  )
                                }
                                className="block w-full text-left px-4 py-2 hover:bg-aj-cream"
                              >
                                📄 Bon comandă
                                client
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  printProductionSheet(
                                    workOrder
                                  )
                                }
                                className="block w-full text-left px-4 py-2 hover:bg-aj-cream"
                              >
                                🏭 Fișă
                                producție
                              </button>
                            </div>
                          </details>

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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
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
          <Field label="Client" wide>
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
                  fiecare produs și toate
                  dimensiunile acestuia.
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
                  <ProductCard
                    key={product.id}
                    product={product}
                    productIndex={
                      productIndex
                    }
                    productTypes={
                      PRODUCT_TYPES
                    }
                    unitOptions={
                      UNIT_OPTIONS
                    }
                    updateProduct={
                      updateProduct
                    }
                    removeProduct={
                      removeProduct
                    }
                    formatMoney={
                      formatMoney
                    }
                  />
                )
              )}
            </div>
          </div>

          <div className="col-span-full border-t border-aj-line pt-5 mt-2">
            <FinancialSummary
              summary={
                financialSummary
              }
              discountMode={
                form.discount_mode
              }
              discountValue={
                form.discount_value
              }
              vatEnabled={
                form.vat_enabled
              }
              vatRate={
                form.vat_rate
              }
              onDiscountModeChange={(
                value
              ) =>
                setForm(
                  (previous) => ({
                    ...previous,
                    discount_mode:
                      value,
                  })
                )
              }
              onDiscountValueChange={(
                value
              ) =>
                setForm(
                  (previous) => ({
                    ...previous,
                    discount_value:
                      value,
                  })
                )
              }
              onVatEnabledChange={(
                value
              ) =>
                setForm(
                  (previous) => ({
                    ...previous,
                    vat_enabled:
                      Boolean(value),
                  })
                )
              }
              onVatRateChange={(
                value
              ) =>
                setForm(
                  (previous) => ({
                    ...previous,
                    vat_rate: value,
                  })
                )
              }
              formatMoney={
                formatMoney
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <InputLabel>
                  Avans încasat (lei)
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
