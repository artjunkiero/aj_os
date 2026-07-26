import { calculateProductPrice } from "@/lib/pricingRules";

// ======================================================
// ART JUNKIE OS
// Work Order Calculations
// ======================================================

export function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

export function round(value, digits = 2) {
    return Number(toNumber(value).toFixed(digits));
}

export function createEmptyDimension() {
    return {
        id:
            typeof crypto !== "undefined" &&
            crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`,

        width: "",
        height: "",
        length: "",
        quantity: 1
    };
}

// ======================================================
// DIMENSION
// ======================================================

export function calculateDimensionValue(
    dimension,
    unit
) {
    const qty = Math.max(
        toNumber(dimension.quantity),
        1
    );

    switch (unit) {
        case "mp": {
            const w =
                toNumber(dimension.width) /
                1000;

            const h =
                toNumber(dimension.height) /
                1000;

            return w * h * qty;
        }

        case "ml": {
            return (
                (toNumber(
                    dimension.material_length ||
                    dimension.length
                ) / 1000) *
                qty
            );
        }

        case "set":
        case "buc":
        default:
            return qty;
    }
}

// ======================================================

export function calculateProductQuantity(
    product
) {
    if (
        !Array.isArray(product.dimensions) ||
        product.dimensions.length === 0
    ) {
        return Math.max(
            toNumber(product.quantity),
            1
        );
    }

    return product.dimensions.reduce(
        (sum, dim) =>
            sum +
            Math.max(
                toNumber(dim.quantity),
                1
            ),
        0
    );
}

// ======================================================

export function calculateProductArea(
    product
) {
    if (
        !Array.isArray(product.dimensions)
    )
        return 0;

    return product.dimensions.reduce(
        (sum, dim) =>
            sum +
            calculateDimensionValue(
                dim,
                "mp"
            ),
        0
    );
}

// ======================================================

export function calculateProductLength(
    product
) {
    if (
        !Array.isArray(product.dimensions)
    )
        return 0;

    return product.dimensions.reduce(
        (sum, dim) =>
            sum +
            calculateDimensionValue(
                dim,
                "ml"
            ),
        0
    );
}

// ======================================================

export function calculateProductValue(
    product
) {
    return round(
        calculateProductPrice(product)
    );
}

// ======================================================

export function calculateSubtotal(
    products = []
) {
    return round(
        products.reduce(
            (sum, product) =>
                sum +
                calculateProductValue(
                    product
                ),
            0
        )
    );
}

// ======================================================

export function calculateTotals(
    products = []
) {
    let totalProducts =
        products.length;

    let totalDimensions = 0;

    let totalPieces = 0;

    let totalArea = 0;

    let totalLength = 0;

    products.forEach((product) => {
        if (
            Array.isArray(
                product.dimensions
            ) &&
            product.dimensions.length
        ) {
            totalDimensions +=
                product.dimensions.length;
        } else {
            totalDimensions++;
        }

        totalPieces +=
            calculateProductQuantity(
                product
            );

        totalArea +=
            calculateProductArea(
                product
            );

        totalLength +=
            calculateProductLength(
                product
            );
    });

    return {
        totalProducts,
        totalDimensions,
        totalPieces,
        totalArea: round(
            totalArea,
            3
        ),
        totalLength: round(
            totalLength,
            2
        )
    };
}

// ======================================================

export function calculateFinancialSummary({
    products = [],

    discountMode = "percent",

    discountValue = 0,

    vatEnabled = true,

    vatRate = 21
}) {
    const subtotal =
        calculateSubtotal(products);

    let discountAmount = 0;

    if (discountMode === "percent") {
        discountAmount =
            subtotal *
            (toNumber(discountValue) /
                100);
    } else {
        discountAmount =
            toNumber(discountValue);
    }

    discountAmount = Math.min(
        subtotal,
        discountAmount
    );

    const taxableBase =
        subtotal - discountAmount;

    const vatAmount =
        vatEnabled
            ? taxableBase *
              (toNumber(vatRate) / 100)
            : 0;

    const grandTotal =
        taxableBase + vatAmount;

    return {
        ...calculateTotals(products),

        subtotal: round(subtotal),

        discountAmount:
            round(discountAmount),

        taxableBase:
            round(taxableBase),

        vatAmount:
            round(vatAmount),

        grandTotal:
            round(grandTotal)
    };
}
