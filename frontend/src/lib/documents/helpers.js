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
};

const UNIT_LABELS = {
  mp: "m²",
  ml: "ml",
  buc: "buc.",
  set: "set",
};

export const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const formatMoney = (value) =>
  Number(value || 0).toLocaleString("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? escapeHtml(value) : date.toLocaleDateString("ro-RO");
};

export const getProductName = (product = {}) => {
  if (product.custom_name) return product.custom_name;
  if (product.product) return product.product;
  return PRODUCT_LABELS[product.product_type] || product.product_type || "Produs";
};

export const getUnit = (product = {}) =>
  UNIT_LABELS[product.unit] || product.unit || "buc.";

export const getProductDimensionsList = (product = {}) => {
  if (Array.isArray(product.dimensions) && product.dimensions.length > 0) {
    return product.dimensions;
  }
  return [{
    width: product.width,
    height: product.height,
    execution_height: product.execution_height,
    length: product.length,
    material_length: product.material_length,
    quantity: product.quantity || 1,
    notes: product.notes,
  }];
};

const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const dimensionHeight = (dimension = {}) =>
  number(dimension.execution_height) > 0
    ? number(dimension.execution_height)
    : number(dimension.height);

export const getMeasuredQuantity = (product = {}) => {
  return getProductDimensionsList(product).reduce((sum, dimension) => {
    const quantity = Math.max(number(dimension.quantity), 0);
    if (product.unit === "mp") {
      return sum + (number(dimension.width) / 1000) * (dimensionHeight(dimension) / 1000) * quantity;
    }
    if (product.unit === "ml") {
      const lengthMm = number(dimension.material_length) || number(dimension.length);
      return sum + (lengthMm / 1000) * quantity;
    }
    return sum + quantity;
  }, 0);
};

export const formatDimension = (product = {}, dimension = {}, index = 0) => {
  const quantity = Math.max(number(dimension.quantity), 0);
  let measurement = "—";

  if (product.unit === "mp") {
    const width = number(dimension.width);
    const height = dimensionHeight(dimension);
    measurement = `${width || "—"} × ${height || "—"} mm`;
  } else if (product.unit === "ml") {
    const length = number(dimension.material_length) || number(dimension.length);
    measurement = length ? `${length} mm` : "—";
  } else {
    const parts = [];
    if (number(dimension.width)) parts.push(`L: ${number(dimension.width)} mm`);
    if (dimensionHeight(dimension)) parts.push(`H: ${dimensionHeight(dimension)} mm`);
    if (number(dimension.length)) parts.push(`Lg: ${number(dimension.length)} mm`);
    measurement = parts.length ? parts.join(" / ") : "—";
  }

  const note = dimension.notes ? ` — ${dimension.notes}` : "";
  return `${index + 1}. ${measurement} × ${quantity} buc.${note}`;
};

export const getDimensions = (product = {}) =>
  getProductDimensionsList(product)
    .map((dimension, index) => formatDimension(product, dimension, index))
    .join("\n");

export const getDimensionsHtml = (product = {}) =>
  getProductDimensionsList(product)
    .map((dimension, index) => `<div class="dimension-line">${escapeHtml(formatDimension(product, dimension, index))}</div>`)
    .join("");

export const detailRow = (label, value) => {
  if (value === undefined || value === null || value === "" || value === false) return "";
  const displayedValue = value === true ? "Da" : value;
  return `<div class="detail"><span>${escapeHtml(label)}:</span> ${escapeHtml(displayedValue)}</div>`;
};

export const getProductDetails = (product = {}) =>
  [
    detailRow("Colecție", product.collection),
    detailRow("Material", product.material),
    detailRow("Culoare material", product.fabric_color || product.color),
    detailRow("Culoare mecanism", product.mechanism_color),
    detailRow("Acționare", product.control_side),
    detailRow("Casetă", product.cassette),
    detailRow("Ghidaje", product.guides),
    detailRow("Motorizare", product.motorized),
    detailRow("Observații", product.notes),
  ].filter(Boolean).join("");

export const getCustomerValue = (customer = {}, ...keys) => {
  for (const key of keys) if (customer?.[key]) return customer[key];
  return "—";
};

export { PRODUCT_LABELS, UNIT_LABELS };
