/**
 * ART JUNKIE – Reguli de calcul al prețului
 *
 * Reguli:
 * 1. Pentru toate produsele calculate la mp:
 *    minimum facturabil = 0,70 mp pentru fiecare bucată.
 *
 * 2. Pentru jaluzelele verticale:
 *    înălțimea minimă de calcul = 1500 mm.
 *
 * 3. La jaluzelele verticale se aplică și minimumul
 *    general de 0,70 mp pentru fiecare bucată.
 */

export const DEFAULT_MINIMUM_AREA_MP = 0.7;
export const VERTICAL_MINIMUM_HEIGHT_MM = 1500;

/**
 * Reguli configurabile pe tip de produs.
 *
 * Valoarea din product.product_type trebuie să fie:
 * "verticala" pentru jaluzelele verticale.
 */
export const PRICING_RULES = {
  default: {
    minimumAreaMp: DEFAULT_MINIMUM_AREA_MP,
  },

  verticala: {
    minimumAreaMp: DEFAULT_MINIMUM_AREA_MP,
    minimumHeightMm: VERTICAL_MINIMUM_HEIGHT_MM,
  },
};

/**
 * Transformă o valoare în număr.
 * Dacă valoarea nu este validă, întoarce 0.
 */
function toNumber(value) {
  const parsedValue = Number.parseFloat(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : 0;
}

/**
 * Normalizează tipul produsului.
 */
function normalizeProductType(productType) {
  return String(productType || "")
    .trim()
    .toLowerCase();
}

/**
 * Returnează regula de calcul pentru produsul primit.
 */
export function getPricingRule(product = {}) {
  const productType = normalizeProductType(
    product.product_type
  );

  return {
    ...PRICING_RULES.default,
    ...(PRICING_RULES[productType] || {}),
  };
}

/**
 * Returnează lista de dimensiuni a produsului.
 *
 * Păstrează compatibilitatea și cu comenzile vechi,
 * unde dimensiunile erau salvate direct în produs.
 */
export function getProductDimensions(product = {}) {
  if (
    Array.isArray(product.dimensions) &&
    product.dimensions.length > 0
  ) {
    return product.dimensions;
  }

  return [
    {
      width: product.width ?? "",
      height: product.height ?? "",
      execution_height:
        product.execution_height ??
        product.height ??
        "",

      length:
        product.material_length ??
        product.length ??
        "",

      material_length:
        product.material_length ??
        product.length ??
        "",

      quantity: product.quantity ?? 1,
      notes: "",
    },
  ];
}

/**
 * Calculează suprafața reală și suprafața facturabilă
 * pentru o singură poziție de dimensiune.
 */
export function calculateMpDimension(
  product = {},
  dimension = {}
) {
  const rule = getPricingRule(product);

  const widthMm = Math.max(
    toNumber(dimension.width),
    0
  );

  const enteredHeightMm = Math.max(
    toNumber(
      dimension.execution_height ??
        dimension.height
    ),
    0
  );

  /**
   * Pentru verticale:
   * orice înălțime sub 1500 mm se calculează la 1500 mm.
   */
  const calculatedHeightMm =
    rule.minimumHeightMm
      ? Math.max(
          enteredHeightMm,
          rule.minimumHeightMm
        )
      : enteredHeightMm;

  /**
   * Suprafața reală, pe baza dimensiunilor introduse.
   */
  const realAreaPerPieceMp =
    (widthMm / 1000) *
    (enteredHeightMm / 1000);

  /**
   * Suprafața după aplicarea înălțimii minime.
   */
  const areaAfterHeightRuleMp =
    (widthMm / 1000) *
    (calculatedHeightMm / 1000);

  /**
   * Aplicarea minimului general de 0,70 mp / bucată.
   */
  const billableAreaPerPieceMp =
    Math.max(
      areaAfterHeightRuleMp,
      rule.minimumAreaMp || 0
    );

  const quantity = Math.max(
    toNumber(dimension.quantity),
    0
  );

  return {
    widthMm,
    enteredHeightMm,
    calculatedHeightMm,
    quantity,

    realAreaPerPieceMp,
    areaAfterHeightRuleMp,
    billableAreaPerPieceMp,

    realAreaTotalMp:
      realAreaPerPieceMp * quantity,

    billableAreaTotalMp:
      billableAreaPerPieceMp * quantity,

    minimumHeightApplied:
      calculatedHeightMm >
      enteredHeightMm,

    minimumAreaApplied:
      billableAreaPerPieceMp >
      areaAfterHeightRuleMp,
  };
}

/**
 * Calculează cantitatea facturabilă a produsului,
 * în funcție de unitatea selectată.
 *
 * Returnează:
 * - mp pentru produse la mp;
 * - ml pentru produse la ml;
 * - cantitatea pentru buc sau set.
 */
export function calculateBillableQuantity(
  product = {}
) {
  const unit = product.unit || "buc";

  const dimensions =
    getProductDimensions(product);

  return dimensions.reduce(
    (total, dimension) => {
      const quantity = Math.max(
        toNumber(dimension.quantity),
        0
      );

      switch (unit) {
        case "mp": {
          const result =
            calculateMpDimension(
              product,
              dimension
            );

          return (
            total +
            result.billableAreaTotalMp
          );
        }

        case "ml": {
          const length = Math.max(
            toNumber(
              dimension.material_length ??
                dimension.length
            ),
            0
          );

          return (
            total +
            length * quantity
          );
        }

        case "set":
        case "buc":
        default:
          return total + quantity;
      }
    },
    0
  );
}

/**
 * Calculează cantitatea reală.
 *
 * Această funcție este utilă pentru afișarea diferenței dintre:
 * - suprafața reală;
 * - suprafața facturabilă.
 */
export function calculateRealQuantity(
  product = {}
) {
  const unit = product.unit || "buc";

  const dimensions =
    getProductDimensions(product);

  return dimensions.reduce(
    (total, dimension) => {
      const quantity = Math.max(
        toNumber(dimension.quantity),
        0
      );

      switch (unit) {
        case "mp": {
          const widthMm = Math.max(
            toNumber(dimension.width),
            0
          );

          const heightMm = Math.max(
            toNumber(
              dimension.execution_height ??
                dimension.height
            ),
            0
          );

          const realAreaMp =
            (widthMm / 1000) *
            (heightMm / 1000);

          return (
            total +
            realAreaMp * quantity
          );
        }

        case "ml": {
          const length = Math.max(
            toNumber(
              dimension.material_length ??
                dimension.length
            ),
            0
          );

          return (
            total +
            length * quantity
          );
        }

        case "set":
        case "buc":
        default:
          return total + quantity;
      }
    },
    0
  );
}

/**
 * Calculează prețul total al produsului.
 *
 * Formula:
 * cantitate facturabilă × preț unitar
 */
export function calculateProductPrice(
  product = {}
) {
  const unitPrice = Math.max(
    toNumber(product.unit_price),
    0
  );

  const billableQuantity =
    calculateBillableQuantity(product);

  return (
    billableQuantity *
    unitPrice
  );
}
