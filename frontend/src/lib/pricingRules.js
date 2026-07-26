/**
 * ART JUNKIE OS — reguli centralizate de calcul.
 * Toate dimensiunile liniare sunt stocate în milimetri.
 */

export const DEFAULT_MINIMUM_AREA_MP = 0.7;
export const VERTICAL_MINIMUM_HEIGHT_MM = 1500;

export const PRICING_RULES = {
  default: {
    minimumAreaMp: DEFAULT_MINIMUM_AREA_MP,
  },
  verticala: {
    minimumAreaMp: DEFAULT_MINIMUM_AREA_MP,
    minimumHeightMm: VERTICAL_MINIMUM_HEIGHT_MM,
  },
};

const toNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const firstPositiveValue = (...values) => {
  for (const value of values) {
    const parsed = toNumber(value);
    if (parsed > 0) return parsed;
  }
  return 0;
};

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export function getPricingRule(product = {}) {
  const productType = normalize(product.product_type);
  const productName = normalize(
    product.product_name || product.custom_name || product.name || product.product
  );

  const isVerticalBlind =
    productType === "verticala" ||
    productType === "jaluzea_verticala" ||
    productType === "jaluzele_verticale" ||
    productType.includes("vertical") ||
    productName.includes("vertical");

  return {
    ...PRICING_RULES.default,
    ...(isVerticalBlind ? PRICING_RULES.verticala : PRICING_RULES[productType] || {}),
  };
}

export function getProductDimensions(product = {}) {
  if (Array.isArray(product.dimensions) && product.dimensions.length > 0) {
    return product.dimensions;
  }

  return [
    {
      width: product.width ?? "",
      height: product.height ?? "",
      execution_height: product.execution_height ?? "",
      material_length: product.material_length ?? "",
      length: product.length ?? product.material_length ?? "",
      quantity: product.quantity ?? 1,
      notes: product.notes ?? "",
    },
  ];
}

export function calculateMpDimension(product = {}, dimension = {}) {
  const rule = getPricingRule(product);
  const widthMm = Math.max(toNumber(dimension.width), 0);

  // execution_height este folosit numai dacă are efectiv o valoare pozitivă.
  // Altfel se folosește height. Aceasta repară cazul "" ?? height.
  const enteredHeightMm = Math.max(
    firstPositiveValue(dimension.execution_height, dimension.height),
    0
  );

  const calculatedHeightMm = rule.minimumHeightMm
    ? Math.max(enteredHeightMm, rule.minimumHeightMm)
    : enteredHeightMm;

  const realAreaPerPieceMp = (widthMm * enteredHeightMm) / 1_000_000;
  const areaAfterHeightRuleMp = (widthMm * calculatedHeightMm) / 1_000_000;
  const billableAreaPerPieceMp = Math.max(
    areaAfterHeightRuleMp,
    rule.minimumAreaMp || 0
  );
  const quantity = Math.max(toNumber(dimension.quantity), 0);

  return {
    widthMm,
    enteredHeightMm,
    calculatedHeightMm,
    quantity,
    realAreaPerPieceMp,
    areaAfterHeightRuleMp,
    billableAreaPerPieceMp,
    realAreaTotalMp: realAreaPerPieceMp * quantity,
    billableAreaTotalMp: billableAreaPerPieceMp * quantity,
    minimumHeightApplied: calculatedHeightMm > enteredHeightMm,
    minimumAreaApplied: billableAreaPerPieceMp > areaAfterHeightRuleMp,
  };
}

export function calculateRealQuantity(product = {}) {
  const unit = product.unit || "buc";

  return getProductDimensions(product).reduce((total, dimension) => {
    const quantity = Math.max(toNumber(dimension.quantity), 0);

    if (unit === "mp") {
      return total + calculateMpDimension(product, dimension).realAreaTotalMp;
    }

    if (unit === "ml") {
      const lengthMm = Math.max(
        firstPositiveValue(dimension.material_length, dimension.length),
        0
      );
      return total + (lengthMm / 1000) * quantity;
    }

    return total + quantity;
  }, 0);
}

export function calculateBillableQuantity(product = {}) {
  const unit = product.unit || "buc";

  return getProductDimensions(product).reduce((total, dimension) => {
    const quantity = Math.max(toNumber(dimension.quantity), 0);

    if (unit === "mp") {
      return total + calculateMpDimension(product, dimension).billableAreaTotalMp;
    }

    if (unit === "ml") {
      const lengthMm = Math.max(
        firstPositiveValue(dimension.material_length, dimension.length),
        0
      );
      return total + (lengthMm / 1000) * quantity;
    }

    return total + quantity;
  }, 0);
}

export function calculateProductPrice(product = {}) {
  const unitPrice = Math.max(toNumber(product.unit_price), 0);
  return calculateBillableQuantity(product) * unitPrice;
}

export function calculateProductPricing(product = {}) {
  const unitPrice = Math.max(toNumber(product.unit_price), 0);
  const realQuantity = calculateRealQuantity(product);
  const billableQuantity = calculateBillableQuantity(product);

  return {
    unit: product.unit || "buc",
    unitPrice,
    realQuantity,
    billableQuantity,
    difference: Math.max(billableQuantity - realQuantity, 0),
    minimumApplied: billableQuantity > realQuantity,
    totalPrice: billableQuantity * unitPrice,
  };
}
