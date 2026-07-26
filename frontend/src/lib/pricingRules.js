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
