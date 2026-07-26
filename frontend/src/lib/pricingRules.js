/**
 * ART JUNKIE - Pricing Rules
 *
 * Toate dimensiunile sunt introduse în MILIMETRI.
 *
 * Reguli:
 * ----------------------------------------------------
 * Produse la mp
 *      minimum facturabil = 0.70 mp / bucată
 *
 * Jaluzele verticale
 *      înălțime minimă = 1500 mm
 *      apoi se aplică și minimul de 0.70 mp
 */

export const DEFAULT_MINIMUM_AREA_MP = 0.70;
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

function toNumber(value) {

    const n = Number.parseFloat(value);

    return Number.isFinite(n)
        ? n
        : 0;

}

function normalize(text) {

    return String(text || "")
        .trim()
        .toLowerCase();

}

/**
 * Returnează regula comercială
 * pentru produsul primit.
 */

export function getPricingRule(product = {}) {

    const productType = normalize(product.product_type);

    const productName = normalize(
        product.product_name ||
        product.name
    );

    const isVerticalBlind =

        productType === "verticala" ||
        productType === "jaluzea_verticala" ||
        productType === "jaluzele_verticale" ||

        productType.includes("vertical") ||

        productName.includes("vertical");

    if (isVerticalBlind) {

        return {
            ...PRICING_RULES.default,
            ...PRICING_RULES.verticala,
        };

    }

    return {

        ...PRICING_RULES.default,
        ...(PRICING_RULES[productType] || {}),

    };

}

/**
 * Returnează dimensiunile produsului.
 * Compatibil și cu comenzile vechi.
 */

export function getProductDimensions(product = {}) {

    if (
        Array.isArray(product.dimensions) &&
        product.dimensions.length
    ) {

        return product.dimensions;

    }

    return [

        {

            width: product.width ?? "",

            height:
                product.height ?? "",

            execution_height:
                product.execution_height ??
                product.height ??
                "",

            material_length:
                product.material_length ??
                product.length ??
                "",

            length:
                product.material_length ??
                product.length ??
                "",

            quantity:
                product.quantity ?? 1,

        },

    ];

}

/**
 * Calculează suprafața
 * pentru o singură poziție.
 */

export function calculateMpDimension(
    product,
    dimension
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
     * Aplicăm înălțimea minimă
     * doar la verticale.
     */

    const calculatedHeightMm =

        rule.minimumHeightMm

            ? Math.max(
                  enteredHeightMm,
                  rule.minimumHeightMm
              )

            : enteredHeightMm;

    /**
     * Suprafața reală.
     */

    const realAreaPerPieceMp =

        (widthMm / 1000) *
        (enteredHeightMm / 1000);

    /**
     * Suprafața după regula
     * înălțimii minime.
     */

    const areaAfterHeightRuleMp =

        (widthMm / 1000) *
        (calculatedHeightMm / 1000);

    /**
     * Aplicăm minimul comercial.
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

            realAreaPerPieceMp *
            quantity,

        billableAreaTotalMp:

            billableAreaPerPieceMp *
            quantity,

        minimumHeightApplied:

            calculatedHeightMm >
            enteredHeightMm,

        minimumAreaApplied:

            billableAreaPerPieceMp >
            areaAfterHeightRuleMp,

    };

}
/**
 * Calculează cantitatea facturabilă
 * în funcție de unitatea produsului.
 *
 * Dimensiunile sunt introduse în mm.
 *
 * Pentru:
 * - mp: returnează suprafața facturabilă;
 * - ml: transformă mm în metri liniari;
 * - buc/set: returnează cantitatea.
 */

export function calculateBillableQuantity(
    product = {}
) {

    const unit =
        product.unit || "buc";

    const dimensions =
        getProductDimensions(product);

    return dimensions.reduce(

        (
            total,
            dimension
        ) => {

            const quantity = Math.max(

                toNumber(
                    dimension.quantity
                ),

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

                    const lengthMm =
                        Math.max(

                            toNumber(

                                dimension.material_length ??
                                dimension.length

                            ),

                            0

                        );

                    const lengthMeters =
                        lengthMm / 1000;

                    return (
                        total +
                        lengthMeters *
                        quantity
                    );

                }

                case "set":

                    return (
                        total +
                        quantity
                    );

                case "buc":

                    return (
                        total +
                        quantity
                    );

                default:

                    return (
                        total +
                        quantity
                    );

            }

        },

        0

    );

}


/**
 * Calculează cantitatea reală,
 * fără aplicarea regulilor comerciale.
 *
 * Utilă pentru afișarea diferenței dintre:
 * - suprafața reală;
 * - suprafața facturabilă.
 */

export function calculateRealQuantity(
    product = {}
) {

    const unit =
        product.unit || "buc";

    const dimensions =
        getProductDimensions(product);

    return dimensions.reduce(

        (
            total,
            dimension
        ) => {

            const quantity = Math.max(

                toNumber(
                    dimension.quantity
                ),

                0

            );

            switch (unit) {

                case "mp": {

                    const widthMm =
                        Math.max(

                            toNumber(
                                dimension.width
                            ),

                            0

                        );

                    const heightMm =
                        Math.max(

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
                        realAreaMp *
                        quantity
                    );

                }

                case "ml": {

                    const lengthMm =
                        Math.max(

                            toNumber(

                                dimension.material_length ??
                                dimension.length

                            ),

                            0

                        );

                    const lengthMeters =
                        lengthMm / 1000;

                    return (
                        total +
                        lengthMeters *
                        quantity
                    );

                }

                case "set":

                    return (
                        total +
                        quantity
                    );

                case "buc":

                    return (
                        total +
                        quantity
                    );

                default:

                    return (
                        total +
                        quantity
                    );

            }

        },

        0

    );

}


/**
 * Calculează diferența dintre
 * cantitatea reală și cantitatea facturabilă.
 */

export function calculatePricingDifference(
    product = {}
) {

    const realQuantity =
        calculateRealQuantity(product);

    const billableQuantity =
        calculateBillableQuantity(product);

    return {

        realQuantity,

        billableQuantity,

        difference:

            Math.max(

                billableQuantity -
                realQuantity,

                0

            ),

        minimumApplied:

            billableQuantity >
            realQuantity,

    };

}


/**
 * Calculează prețul total al produsului.
 *
 * Formula:
 *
 * cantitate facturabilă × preț unitar
 */

export function calculateProductPrice(
    product = {}
) {

    const unitPrice =
        Math.max(

            toNumber(
                product.unit_price
            ),

            0

        );

    const billableQuantity =
        calculateBillableQuantity(
            product
        );

    return (
        billableQuantity *
        unitPrice
    );

}


/**
 * Calculează informațiile complete
 * necesare pentru afișarea prețului.
 */

export function calculateProductPricing(
    product = {}
) {

    const unitPrice =
        Math.max(

            toNumber(
                product.unit_price
            ),

            0

        );

    const realQuantity =
        calculateRealQuantity(
            product
        );

    const billableQuantity =
        calculateBillableQuantity(
            product
        );

    const totalPrice =
        billableQuantity *
        unitPrice;

    return {

        unit:
            product.unit ||
            "buc",

        unitPrice,

        realQuantity,

        billableQuantity,

        difference:

            Math.max(

                billableQuantity -
                realQuantity,

                0

            ),

        minimumApplied:

            billableQuantity >
            realQuantity,

        totalPrice,

    };

}
