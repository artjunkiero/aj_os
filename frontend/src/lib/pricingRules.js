    /**
     * ART JUNKIE OS — reguli centralizate de calcul.
     * Toate dimensiunile liniare sunt stocate în milimetri.
     */

    export const DEFAULT_MINIMUM_AREA_MP = 0.7;
    export const VERTICAL_MINIMUM_HEIGHT_MM = 1500;
    export const TEXTILE_ROLLER_WIDTH_ADDITION_MM = 40;

    export const PRICING_RULES = {
      default: {
        minimumAreaMp: DEFAULT_MINIMUM_AREA_MP,
        widthAdditionMm: 0,
      },

      verticala: {
        minimumAreaMp: DEFAULT_MINIMUM_AREA_MP,
        minimumHeightMm: VERTICAL_MINIMUM_HEIGHT_MM,
        widthAdditionMm: 0,
      },

      roleta_textila: {
        minimumAreaMp: DEFAULT_MINIMUM_AREA_MP,
        widthAdditionMm:
          TEXTILE_ROLLER_WIDTH_ADDITION_MM,
      },

      day_night: {
        minimumAreaMp: DEFAULT_MINIMUM_AREA_MP,
        widthAdditionMm:
          TEXTILE_ROLLER_WIDTH_ADDITION_MM,
      },
    };

    const toNumber = (value) => {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const firstPositiveValue = (...values) => {
      for (const value of values) {
        const parsed = toNumber(value);

        if (parsed > 0) {
          return parsed;
        }
      }

      return 0;
    };

    const normalize = (value) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

    const includesAny = (
      value,
      searchTerms
    ) =>
      searchTerms.some((searchTerm) =>
        value.includes(searchTerm)
      );

    export function getPricingRule(product = {}) {
      const productType = normalize(
        product.product_type
      );

      const productName = normalize(
        product.product_name ||
          product.custom_product_name ||
          product.custom_name ||
          product.name ||
          product.product
      );

      const searchableProduct = [
        productType,
        productName,
      ]
        .filter(Boolean)
        .join("_");

      const isVerticalBlind =
        productType === "verticala" ||
        productType ===
          "jaluzea_verticala" ||
        productType ===
          "jaluzele_verticale" ||
        searchableProduct.includes(
          "vertical"
        );

      const isDayNightRoller =
        includesAny(
          searchableProduct,
          [
            "day_night",
            "day_and_night",
            "daynight",
            "zi_noapte",
            "zebra",
            "roleta_zebra",
            "rolete_zebra",
          ]
        );

      const isTextileRoller =
        !isDayNightRoller &&
        includesAny(
          searchableProduct,
          [
            "roleta_textila",
            "rolete_textile",
            "roleta_simpla",
            "rolete_simple",
            "roleta_simpla_textila",
            "rolete_simple_textile",
            "roleta_interioara",
            "rolete_interioare",
          ]
        );

      if (isVerticalBlind) {
        return {
          ...PRICING_RULES.default,
          ...PRICING_RULES.verticala,
        };
      }

      if (isDayNightRoller) {
        return {
          ...PRICING_RULES.default,
          ...PRICING_RULES.day_night,
        };
      }

      if (isTextileRoller) {
        return {
          ...PRICING_RULES.default,
          ...PRICING_RULES.roleta_textila,
        };
      }

      return {
        ...PRICING_RULES.default,
        ...(PRICING_RULES[
          productType
        ] || {}),
      };
    }

    export function getProductDimensions(product = {}) {
      if (
        Array.isArray(
          product.dimensions
        ) &&
        product.dimensions.length > 0
      ) {
        return product.dimensions;
      }

      return [
        {
          width: product.width ?? "",
          height: product.height ?? "",
          execution_height:
            product.execution_height ?? "",
          material_length:
            product.material_length ?? "",
          length:
            product.length ??
            product.material_length ??
            "",
          quantity:
            product.quantity ?? 1,
          notes:
            product.notes ?? "",
        },
      ];
    }

    export function calculateMpDimension(
      product = {},
      dimension = {}
    ) {
      const rule =
        getPricingRule(product);

      const enteredWidthMm = Math.max(
        firstPositiveValue(
          dimension.width,
          product.width
        ),
        0
      );

      const widthAdditionMm =
        enteredWidthMm > 0
          ? Math.max(
              toNumber(
                rule.widthAdditionMm
              ),
              0
            )
          : 0;

      const calculatedWidthMm =
        enteredWidthMm +
        widthAdditionMm;

      /**
       * Pentru produsele calculate în mp, înălțimea principală
       * este `height`.
       *
       * `execution_height` este doar o rezervă pentru structuri
       * vechi sau produse speciale.
       *
       * Ordinea este importantă:
       * - height = 2000
       * - execution_height = 1
       *
       * Trebuie ales 2000, nu 1.
       */
      const enteredHeightMm = Math.max(
        firstPositiveValue(
          dimension.height,
          product.height,
          dimension.execution_height,
          product.execution_height
        ),
        0
      );

      const calculatedHeightMm =
        rule.minimumHeightMm
          ? Math.max(
              enteredHeightMm,
              rule.minimumHeightMm
            )
          : enteredHeightMm;

      /**
       * Suprafața reală păstrează dimensiunea introdusă de utilizator.
       * Suprafața facturabilă folosește lățimea de calcul, inclusiv
       * adaosul tehnologic de 40 mm pentru rolete textile.
       */
      const realAreaPerPieceMp =
        (enteredWidthMm *
          enteredHeightMm) /
        1_000_000;

      const areaAfterRulesMp =
        (calculatedWidthMm *
          calculatedHeightMm) /
        1_000_000;

      const billableAreaPerPieceMp =
        Math.max(
          areaAfterRulesMp,
          rule.minimumAreaMp || 0
        );

      const quantity = Math.max(
        firstPositiveValue(
          dimension.quantity,
          product.quantity
        ),
        0
      );

      return {
        /**
         * `widthMm` rămâne lățimea introdusă pentru compatibilitate
         * cu componentele existente.
         */
        widthMm: enteredWidthMm,
        enteredWidthMm,
        calculatedWidthMm,
        widthAdditionMm,

        enteredHeightMm,
        calculatedHeightMm,
        quantity,

        realAreaPerPieceMp,
        areaAfterHeightRuleMp:
          areaAfterRulesMp,
        areaAfterRulesMp,
        billableAreaPerPieceMp,

        realAreaTotalMp:
          realAreaPerPieceMp *
          quantity,

        billableAreaTotalMp:
          billableAreaPerPieceMp *
          quantity,

        widthAdditionApplied:
          widthAdditionMm > 0,

        minimumHeightApplied:
          calculatedHeightMm >
          enteredHeightMm,

        minimumAreaApplied:
          billableAreaPerPieceMp >
          areaAfterRulesMp,
      };
    }

    export function calculateRealQuantity(
      product = {}
    ) {
      const unit =
        product.unit || "buc";

      return getProductDimensions(
        product
      ).reduce(
        (total, dimension) => {
          const quantity = Math.max(
            firstPositiveValue(
              dimension.quantity,
              product.quantity
            ),
            0
          );

          if (unit === "mp") {
            const pricing =
              calculateMpDimension(
                product,
                dimension
              );

            return (
              total +
              pricing.realAreaTotalMp
            );
          }

          if (unit === "ml") {
            const lengthMm = Math.max(
              firstPositiveValue(
                dimension.material_length,
                dimension.length,
                product.material_length,
                product.length
              ),
              0
            );

            return (
              total +
              (lengthMm / 1000) *
                quantity
            );
          }

          return total + quantity;
        },
        0
      );
    }

    export function calculateBillableQuantity(
      product = {}
    ) {
      const unit =
        product.unit || "buc";

      return getProductDimensions(
        product
      ).reduce(
        (total, dimension) => {
          const quantity = Math.max(
            firstPositiveValue(
              dimension.quantity,
              product.quantity
            ),
            0
          );

          if (unit === "mp") {
            const pricing =
              calculateMpDimension(
                product,
                dimension
              );

            return (
              total +
              pricing.billableAreaTotalMp
            );
          }

          if (unit === "ml") {
            const lengthMm = Math.max(
              firstPositiveValue(
                dimension.material_length,
                dimension.length,
                product.material_length,
                product.length
              ),
              0
            );

            return (
              total +
              (lengthMm / 1000) *
                quantity
            );
          }

          return total + quantity;
        },
        0
      );
    }

    export function calculateProductPrice(
      product = {}
    ) {
      const unitPrice = Math.max(
        toNumber(product.unit_price),
        0
      );

      return (
        calculateBillableQuantity(
          product
        ) * unitPrice
      );
    }

    export function calculateProductPricing(
      product = {}
    ) {
      const unitPrice = Math.max(
        toNumber(product.unit_price),
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

      return {
        unit:
          product.unit || "buc",
        unitPrice,
        realQuantity,
        billableQuantity,

        difference: Math.max(
          billableQuantity -
            realQuantity,
          0
        ),

        minimumApplied:
          billableQuantity >
          realQuantity,

        totalPrice:
          billableQuantity *
          unitPrice,
      };
    }
