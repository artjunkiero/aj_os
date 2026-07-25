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

  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  return date.toLocaleDateString("ro-RO");
};

export const getProductName = (product = {}) => {
  if (product.custom_name) return product.custom_name;
  if (product.product) return product.product;

  return (
    PRODUCT_LABELS[product.product_type] ||
    product.product_type ||
    "Produs"
  );
};

export const getUnit = (product = {}) =>
  UNIT_LABELS[product.unit] || product.unit || "buc.";

export const getMeasuredQuantity = (product = {}) => {
  const quantity = Number(product.quantity || 0);
  const width = Number(product.width || 0);
  const height = Number(product.height || 0);
  const length = Number(product.length || 0);

  if (product.unit === "mp") {
    return (width / 1000) * (height / 1000) * quantity;
  }

  if (product.unit === "ml") {
    return length * quantity;
  }

  return quantity;
};

export const getDimensions = (product = {}) => {
  if (product.unit === "mp") {
    const width = product.width ? `${product.width} mm` : "—";
    const height = product.height ? `${product.height} mm` : "—";

    return `${width} × ${height}`;
  }

  if (product.unit === "ml") {
    return product.length ? `${product.length} ml` : "—";
  }

  const dimensions = [];

  if (product.width) {
    dimensions.push(`L: ${product.width} mm`);
  }

  if (product.height) {
    dimensions.push(`H: ${product.height} mm`);
  }

  return dimensions.length ? dimensions.join(" / ") : "—";
};

export const detailRow = (label, value) => {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === false
  ) {
    return "";
  }

  const displayedValue = value === true ? "Da" : value;

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
    detailRow("Culoare mecanism", product.mechanism_color),
    detailRow("Acționare", product.control_side),
    detailRow("Casetă", product.cassette),
    detailRow("Ghidaje", product.guides),
    detailRow("Motorizare", product.motorized),
    detailRow("Observații", product.notes),
  ]
    .filter(Boolean)
    .join("");

export const getCustomerValue = (customer = {}, ...keys) => {
  for (const key of keys) {
    if (customer?.[key]) return customer[key];
  }

  return "—";
};

export { PRODUCT_LABELS, UNIT_LABELS };
