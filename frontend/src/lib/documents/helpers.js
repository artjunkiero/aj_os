import { calculateRealQuantity } from "../pricingRules";

const PRODUCT_LABELS = {
  roleta: "Roletă textilă",
  daynight: "Day & Night",
  plisse: "Jaluzea Plisse",
  venetiana: "Jaluzea venețiană",
  verticala: "Jaluzea verticală",
  rulou: "Rulou exterior",
  plasa: "Plasă insecte",
  draperie: "Draperie",
  perdea: "Perdea",
  galerie: "Galerie",
  custom: "Alt produs",
  other: "Alt produs",
};

const UNIT_LABELS = {
  mp: "m²",
  ml: "ml",
  buc: "buc.",
  set: "set",
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getDimensionHeight = (dimension = {}) => {
  const executionHeight = toNumber(
    dimension.execution_height
  );

  if (executionHeight > 0) {
    return executionHeight;
  }

  return toNumber(dimension.height);
};

export const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const formatMoney = (value) =>
  toNumber(value).toLocaleString("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  return date.toLocaleDateString("ro-RO");
};

export const getProductName = (product = {}) => {
  if (product.custom_product_name) {
    return product.custom_product_name;
  }

  if (product.custom_name) {
    return product.custom_name;
  }

  if (product.product) {
    return product.product;
  }

  return (
    PRODUCT_LABELS[product.product_type] ||
    product.product_type ||
    "Produs"
  );
};

export const getUnit = (product = {}) =>
  UNIT_LABELS[product.unit] ||
  product.unit ||
  "buc.";

export const getProductDimensionsList = (
  product = {}
) => {
  if (
    Array.isArray(product.dimensions) &&
    product.dimensions.length > 0
  ) {
    return product.dimensions;
  }

  return [
    {
      width: product.width,
      height: product.height,
      execution_height: product.execution_height,
      length: product.length,
      material_length: product.material_length,
      quantity: product.quantity || 1,
      notes: product.notes,
    },
  ];
};

/*
 * Cantitatea reală este calculată exclusiv în pricingRules.js.
 *
 * Astfel, toate zonele aplicației folosesc aceeași logică:
 * - dimensiuni în milimetri;
 * - conversie mm → m și mm² → m²;
 * - calcul pe m², ml, bucăți sau seturi;
 * - aceeași structură de dimensiuni.
 *
 * Atenție:
 * calculateRealQuantity calculează cantitatea reală.
 * Pentru cantitatea facturabilă se folosește
 * calculateBillableQuantity în fișierele de preț/documente.
 */
export const getMeasuredQuantity = (product = {}) =>
  calculateRealQuantity(product);

export const formatDimension = (
  product = {},
  dimension = {},
  index = 0
) => {
  const quantity = Math.max(
    toNumber(dimension.quantity),
    0
  );

  let measurement = "—";

  if (product.unit === "mp") {
    const width = toNumber(dimension.width);
    const height = getDimensionHeight(dimension);

    measurement = `${
      width || "—"
    } × ${height || "—"} mm`;
  } else if (product.unit === "ml") {
    const length =
      toNumber(dimension.material_length) ||
      toNumber(dimension.length);

    measurement = length
      ? `${length} mm`
      : "—";
  } else {
    const parts = [];

    const width = toNumber(dimension.width);
    const height = getDimensionHeight(dimension);
    const length = toNumber(dimension.length);

    if (width > 0) {
      parts.push(`L: ${width} mm`);
    }

    if (height > 0) {
      parts.push(`H: ${height} mm`);
    }

    if (length > 0) {
      parts.push(`Lg: ${length} mm`);
    }

    measurement = parts.length
      ? parts.join(" / ")
      : "—";
  }

  const note = dimension.notes
    ? ` — ${dimension.notes}`
    : "";

  return `${index + 1}. ${measurement} × ${quantity} buc.${note}`;
};

export const getDimensions = (product = {}) =>
  getProductDimensionsList(product)
    .map((dimension, index) =>
      formatDimension(product, dimension, index)
    )
    .join("\n");

export const getDimensionsHtml = (product = {}) =>
  getProductDimensionsList(product)
    .map(
      (dimension, index) => `
        <div class="dimension-line">
          ${escapeHtml(
            formatDimension(
              product,
              dimension,
              index
            )
          )}
        </div>
      `
    )
    .join("");

export const detailRow = (label, value) => {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === false
  ) {
    return "";
  }

  const displayedValue =
    value === true ? "Da" : value;

  return `
    <div class="detail">
      <span>${escapeHtml(label)}:</span>
      ${escapeHtml(displayedValue)}
    </div>
  `;
};

export const getProductDetails = (product = {}) =>
  [
    detailRow("Colecție", product.collection),
    detailRow("Material", product.material),
    detailRow(
      "Culoare material",
      product.fabric_color || product.color
    ),
    detailRow(
      "Culoare mecanism",
      product.mechanism_color
    ),
    detailRow(
      "Acționare",
      product.control_side
    ),
    detailRow("Casetă", product.cassette),
    detailRow("Ghidaje", product.guides),
    detailRow(
      "Motorizare",
      product.motorized
    ),
    detailRow(
      "Observații",
      product.notes
    ),
  ]
    .filter(Boolean)
    .join("");

export const getCustomerValue = (
  customer = {},
  ...keys
) => {
  for (const key of keys) {
    if (
      customer?.[key] !== undefined &&
      customer?.[key] !== null &&
      customer?.[key] !== ""
    ) {
      return customer[key];
    }
  }

  return "—";
};

export {
  PRODUCT_LABELS,
  UNIT_LABELS,
};
