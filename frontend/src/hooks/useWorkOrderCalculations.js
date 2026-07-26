import { useMemo } from "react";

import {
    calculateFinancialSummary,
} from "@/utils/workOrderCalculations";

/**
 * ART JUNKIE OS
 * Hook unic pentru toate calculele financiare
 */

export default function useWorkOrderCalculations({
    products = [],

    discountMode = "fixed",

    discountValue = 0,

    vatEnabled = false,

    vatRate = 21,
}) {
    const summary = useMemo(() => {
        return calculateFinancialSummary({
            products,
            discountMode,
            discountValue,
            vatEnabled,
            vatRate,
        });
    }, [
        products,
        discountMode,
        discountValue,
        vatEnabled,
        vatRate,
    ]);

    return summary;
}
