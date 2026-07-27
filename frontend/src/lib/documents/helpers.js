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
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/*
 * Ordinea corectă pentru înălțime:
 *
 * 1. dimension.height
 * 2. product.height
 * 3. dimension.execution_height
 * 4. product.execution_height
 *
 * execution_height este doar rezervă pentru structuri vechi
 * sau produse speciale. Nu trebuie să înlocuiască o valoare
 * validă din height.
 */
const getDimensionHeight = (
  product = {},
  dimension = {}
) => {
  const dimensionHeight = toNumber(
    dimension.height
  );

  if (dimensionHeight > 0) {
    return dimensionHeight;
  }

  const productHeight = toNumber(
    product.height
  );

  if (productHeight > 0) {
    return productHeight;
  }

  const dimensionExecutionHeight = toNumber(
    dimension.execution_height
  );

  if (dimensionExecutionHeight > 0) {
    return dimensionExecutionHeight;
  }

  return toNumber(
    product.execution_height
  );
};

const getDimensionQuantity = (
  product = {},
  dimension = {}
) => {
  const dimensionQuantity = toNumber(
    dimension.quantity
  );

  if (dimensionQuantity > 0) {
    return dimensionQuantity;
  }

  const productQuantity = toNumber(
    product.quantity
  );

  return productQuantity > 0
    ? productQuantity
    : 1;
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

  const date = new Date(
    `${value}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  return date.toLocaleDateString("ro-RO");
};

export const getProductName = (
  product = {}
) => {
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

export const getUnit = (
  product = {}
) =>
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
      execution_height:
        product.execution_height,
      length: product.length,
      material_length:
        product.material_length,
      quantity:
        product.quantity || 1,
      notes: product.notes,
    },
  ];
};

/*
 * Cantitatea reală este calculată exclusiv
 * în pricingRules.js.
 */
export const getMeasuredQuantity = (
  product = {}
) =>
  calculateRealQuantity(product);

export const formatDimension = (
  product = {},
  dimension = {},
  index = 0
) => {
  const quantity =
    getDimensionQuantity(
      product,
      dimension
    );

  let measurement = "—";

  if (product.unit === "mp") {
    const width =
      toNumber(dimension.width) ||
      toNumber(product.width);

    const height =
      getDimensionHeight(
        product,
        dimension
      );

    measurement = `${
      width || "—"
    } × ${height || "—"} mm`;
  } else if (product.unit === "ml") {
    const length =
      toNumber(
        dimension.material_length
      ) ||
      toNumber(dimension.length) ||
      toNumber(
        product.material_length
      ) ||
      toNumber(product.length);

    measurement = length
      ? `${length} mm`
      : "—";
  } else {
    const parts = [];

    const width =
      toNumber(dimension.width) ||
      toNumber(product.width);

    const height =
      getDimensionHeight(
        product,
        dimension
      );

    const length =
      toNumber(dimension.length) ||
      toNumber(product.length);

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

export const getDimensions = (
  product = {}
) =>
  getProductDimensionsList(product)
    .map((dimension, index) =>
      formatDimension(
        product,
        dimension,
        index
      )
    )
    .join("\n");

export const getDimensionsHtml = (
  product = {}
) =>
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

export const detailRow = (
  label,
  value
) => {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === false
  ) {
    return "";
  }

  const displayedValue =
    value === true
      ? "Da"
      : value;

  return `
    <div class="detail">
      <span>
        ${escapeHtml(label)}:
      </span>
      ${escapeHtml(displayedValue)}
    </div>
  `;
};

export const getProductDetails = (
  product = {}
) =>
  [
    detailRow(
      "Colecție",
      product.collection
    ),
    detailRow(
      "Material",
      product.material
    ),
    detailRow(
      "Culoare material",
      product.fabric_color ||
        product.color
    ),
    detailRow(
      "Culoare mecanism",
      product.mechanism_color
    ),
    detailRow(
      "Acționare",
      product.control_side
    ),
    detailRow(
      "Casetă",
      product.cassette
    ),
    detailRow(
      "Ghidaje",
      product.guides
    ),
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
