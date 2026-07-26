import React, {
  useMemo,
  useState,
} from "react";
import {
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  TextInput,
} from "./_Modal";

import {
  calculateMpDimension,
} from "@/lib/pricingRules";

const DEFAULT_HEADING_TYPES = [
  "Wave",
  "Creion",
  "Flamandă",
  "Pliuri duble",
  "Pliuri triple",
  "Ocheți",
  "Bride",
  "Rejansă universală",
  "Rejansă transparentă",
  "Rejansă opacă",
];

const ORIENTATION_OPTIONS = [
  {
    value: "",
    label: "Nespecificată",
  },
  {
    value: "normal",
    label: "Normală",
  },
  {
    value: "rotated",
    label: "Material rotit",
  },
  {
    value: "railroaded",
    label: "Pe lățime / railroaded",
  },
];

function createId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function createDimension() {
  return {
    id: createId(),

    width: "",
    height: "",
    length: "",
    quantity: 1,
    notes: "",

    execution_height: "",
    track_length: "",
    heading_type: "",
    heading_ratio: "",
    material_length: "",
    orientation: "",
    top_hem: "",
    bottom_hem: "",
    workshop_notes: "",
  };
}

function normalizeDimension(
  dimension = {}
) {
  return {
    id:
      dimension.id ||
      createId(),

    width:
      dimension.width ?? "",

    height:
      dimension.height ?? "",

    length:
      dimension.length ?? "",

    quantity:
      dimension.quantity ?? 1,

    notes:
      dimension.notes ?? "",

    execution_height:
      dimension.execution_height ??
      dimension.executionHeight ??
      dimension.height ??
      "",

    track_length:
      dimension.track_length ??
      dimension.trackLength ??
      "",

    heading_type:
      dimension.heading_type ??
      dimension.headingType ??
      "",

    heading_ratio:
      dimension.heading_ratio ??
      dimension.headingRatio ??
      "",

    material_length:
      dimension.material_length ??
      dimension.materialLength ??
      dimension.length ??
      "",

    orientation:
      dimension.orientation ??
      "",

    top_hem:
      dimension.top_hem ??
      dimension.topHem ??
      "",

    bottom_hem:
      dimension.bottom_hem ??
      dimension.bottomHem ??
      "",

    workshop_notes:
      dimension.workshop_notes ??
      dimension.workshopNotes ??
      "",
  };
}

function toNumber(value) {
  const parsedValue =
    Number.parseFloat(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : 0;
}

function formatNumber(
  value,
  maximumFractionDigits = 2
) {
  return new Intl.NumberFormat(
    "ro-RO",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits,
    }
  ).format(value || 0);
}

function getInitialDimensions(
  product
) {
  if (
    Array.isArray(
      product.dimensions
    ) &&
    product.dimensions.length > 0
  ) {
    return product.dimensions.map(
      normalizeDimension
    );
  }

  const hasLegacyDimensions =
    product.width ||
    product.height ||
    product.length ||
    product.quantity;

  if (hasLegacyDimensions) {
    return [
      normalizeDimension({
        width: product.width,
        height: product.height,
        length: product.length,
        quantity:
          product.quantity || 1,
      }),
    ];
  }

  return [
    createDimension(),
  ];
}

function isCurtainProduct(
  product
) {
  const productType =
    String(
      product.product_type || ""
    ).toLowerCase();

  return (
    productType === "perdea" ||
    productType === "draperie"
  );
}

function calculateCurtainMaterial(
  dimension
) {
  const trackLength =
    toNumber(
      dimension.track_length
    );

  const headingRatio =
    toNumber(
      dimension.heading_ratio
    );

  if (
    trackLength <= 0 ||
    headingRatio <= 0
  ) {
    return 0;
  }

  return (
    trackLength *
    headingRatio
  );
}

function InputLabel({
  children,
  optional = false,
}) {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
      {children}

      {optional && (
        <span className="ml-1 font-normal text-slate-400">
          (opțional)
        </span>
      )}
    </label>
  );
}

function FieldHint({
  children,
}) {
  return (
    <div className="mt-1 text-[11px] leading-4 text-slate-400">
      {children}
    </div>
  );
}

function NativeSelect({
  value,
  onChange,
  disabled,
  children,
}) {
  return (
    <select
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled}
      className="h-10 w-full rounded-lg border border-aj-line bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-aj-gold focus:ring-2 focus:ring-aj-gold/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    >
      {children}
    </select>
  );
}

export default function ProductDimensions({
  product,
  updateProduct,
  disabled = false,
}) {
  const unit =
    product.unit || "buc";

  const curtainProduct =
    isCurtainProduct(
      product
    );

  const [
    newHeadingType,
    setNewHeadingType,
  ] = useState("");

  const dimensions = useMemo(
    () =>
      getInitialDimensions(
        product
      ),
    [
      product.dimensions,
      product.width,
      product.height,
      product.length,
      product.quantity,
    ]
  );

  const headingTypes = useMemo(
    () => {
      const customHeadingTypes =
        Array.isArray(
          product.heading_catalog
        )
          ? product.heading_catalog
          : [];

      return Array.from(
        new Set([
          ...DEFAULT_HEADING_TYPES,
          ...customHeadingTypes.filter(
            Boolean
          ),
        ])
      );
    },
    [
      product.heading_catalog,
    ]
  );

  const saveDimensions = (
    nextDimensions
  ) => {
    const normalizedDimensions =
      nextDimensions.map(
        normalizeDimension
      );

    const firstDimension =
      normalizedDimensions[0] ||
      createDimension();

    updateProduct(
      product.id,
      "dimensions",
      normalizedDimensions
    );

    /*
     * Compatibilitate cu structura veche
     * din WorkOrders.
     *
     * Câmpurile principale păstrează
     * valorile primei poziții.
     */
    updateProduct(
      product.id,
      "width",
      firstDimension.width
    );

    updateProduct(
      product.id,
      "height",
      curtainProduct
        ? firstDimension.execution_height
        : firstDimension.height
    );

    updateProduct(
      product.id,
      "length",
      curtainProduct
        ? firstDimension.material_length
        : firstDimension.length
    );

    updateProduct(
      product.id,
      "quantity",
      firstDimension.quantity || 1
    );
  };

  const updateDimension = (
    dimensionId,
    field,
    value
  ) => {
    const nextDimensions =
      dimensions.map(
        (dimension) => {
          if (
            dimension.id !==
            dimensionId
          ) {
            return dimension;
          }

          const updatedDimension = {
            ...dimension,
            [field]: value,
          };

          if (
            curtainProduct &&
            (
              field ===
                "track_length" ||
              field ===
                "heading_ratio"
            )
          ) {
            const calculatedMaterial =
              calculateCurtainMaterial(
                updatedDimension
              );

            if (
              calculatedMaterial > 0
            ) {
              const roundedMaterial =
                Math.round(
                  calculatedMaterial *
                    1000
                ) / 1000;

              updatedDimension.material_length =
                String(
                  roundedMaterial
                );

              updatedDimension.length =
                String(
                  roundedMaterial
                );
            }
          }

          if (
            curtainProduct &&
            field ===
              "material_length"
          ) {
            updatedDimension.length =
              value;
          }

          if (
            curtainProduct &&
            field ===
              "execution_height"
          ) {
            updatedDimension.height =
              value;
          }

          return updatedDimension;
        }
      );

    saveDimensions(
      nextDimensions
    );
  };

  const addDimension = () => {
    saveDimensions([
      ...dimensions,
      createDimension(),
    ]);
  };

  const removeDimension = (
    dimensionId
  ) => {
    if (
      dimensions.length === 1
    ) {
      saveDimensions([
        createDimension(),
      ]);

      return;
    }

    saveDimensions(
      dimensions.filter(
        (dimension) =>
          dimension.id !==
          dimensionId
      )
    );
  };

  const addHeadingType = () => {
    const normalizedHeadingType =
      newHeadingType.trim();

    if (
      !normalizedHeadingType
    ) {
      return;
    }

    const currentCatalog =
      Array.isArray(
        product.heading_catalog
      )
        ? product.heading_catalog
        : [];

    const nextCatalog =
      Array.from(
        new Set([
          ...currentCatalog,
          normalizedHeadingType,
        ])
      );

    updateProduct(
      product.id,
      "heading_catalog",
      nextCatalog
    );

    setNewHeadingType("");
  };

  const totals = useMemo(
    () =>
      dimensions.reduce(
        (
          accumulator,
          dimension
        ) => {
          const width =
            toNumber(
              dimension.width
            );

          const height =
            toNumber(
              dimension.height
            );

          const length =
            toNumber(
              curtainProduct
                ? dimension
                    .material_length
                : dimension.length
            );

          const quantity =
            Math.max(
              toNumber(
                dimension.quantity
              ),
              0
            );

          accumulator.quantity +=
            quantity;

          accumulator.totalMl +=
            (length / 1000) *
            quantity;

          accumulator.totalMp +=
            (width / 1000) *
            (height / 1000) *
            quantity;

          if (
            curtainProduct
          ) {
            accumulator
              .calculatedCurtainMl +=
              calculateCurtainMaterial(
                dimension
              ) *
              quantity;
          }

          return accumulator;
        },
        {
          quantity: 0,
          totalMl: 0,
          totalMp: 0,
          calculatedCurtainMl: 0,
        }
      ),
    [
      dimensions,
      curtainProduct,
    ]
  );

  const totalLabel =
    useMemo(() => {
      switch (unit) {
        case "mp":
          return `${formatNumber(
            totals.totalMp,
            3
          )} mp`;

        case "ml":
          return `${formatNumber(
            totals.totalMl,
            2
          )} ml`;

        case "set":
          return `${formatNumber(
            totals.quantity,
            0
          )} seturi`;

        default:
          return `${formatNumber(
            totals.quantity,
            0
          )} buc.`;
      }
    }, [
      totals,
      unit,
    ]);

  return (
    <section className="space-y-4">
      <datalist
        id={`heading-types-${product.id}`}
      >
        {headingTypes.map(
          (headingType) => (
            <option
              key={headingType}
              value={headingType}
            />
          )
        )}
      </datalist>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-bold text-aj-navy">
            {curtainProduct
              ? "Dimensiuni și confecționare"
              : "Dimensiuni"}
          </div>

          <div className="mt-0.5 text-xs text-slate-400">
            Adaugă fiecare piesă
            sau grup de piese cu
            aceeași dimensiune.
          </div>
        </div>

        <button
          type="button"
          onClick={addDimension}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-aj-navy px-3 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={15} />

          Adaugă dimensiune
        </button>
      </div>

      {curtainProduct && (
        <div className="rounded-xl border border-aj-line bg-aj-cream/30 p-4">
          <div className="mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-aj-navy/70">
              Catalog tipuri de
              rejansă
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Poți selecta un tip
              existent sau poți
              scrie și adăuga orice
              denumire nouă.
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <TextInput
              placeholder="Ex.: Rejansă Wave 80 mm"
              value={
                newHeadingType
              }
              disabled={disabled}
              onChange={(
                event
              ) =>
                setNewHeadingType(
                  event.target.value
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  event.preventDefault();
                  addHeadingType();
                }
              }}
            />

            <button
              type="button"
              onClick={
                addHeadingType
              }
              disabled={
                disabled ||
                !newHeadingType.trim()
              }
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-aj-navy bg-white px-4 text-xs font-bold text-aj-navy transition hover:bg-aj-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} />

              Adaugă în listă
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {dimensions.map(
          (
            dimension,
            dimensionIndex
          ) => {
            const calculatedMaterial =
              curtainProduct
                ? calculateCurtainMaterial(
                    dimension
                  )
                : 0;

            const calculatedPositionTotal =
              calculatedMaterial *
              Math.max(
                toNumber(
                  dimension.quantity
                ),
                0
              );

            const mpPricing =
              !curtainProduct &&
              unit === "mp"
                ? calculateMpDimension(
                    product,
                    dimension
                  )
                : null;

            return (
              <div
                key={
                  dimension.id
                }
                className="rounded-xl border border-aj-line bg-slate-50/50 p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-aj-navy/60">
                    Dimensiunea{" "}
                    {dimensionIndex +
                      1}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeDimension(
                        dimension.id
                      )
                    }
                    disabled={
                      disabled
                    }
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Șterge dimensiunea ${
                      dimensionIndex +
                      1
                    }`}
                  >
                    <Trash2
                      size={14}
                    />

                    Șterge
                  </button>
                </div>

                {curtainProduct ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <InputLabel>
                          Înălțime
                          execuție (mm)
                        </InputLabel>

                        <TextInput
                          type="number"
                          min="0"
                          step="1"
                          inputMode="decimal"
                          placeholder="Ex.: 2650"
                          value={
                            dimension
                              .execution_height
                          }
                          disabled={
                            disabled
                          }
                          onChange={(
                            event
                          ) =>
                            updateDimension(
                              dimension.id,
                              "execution_height",
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <InputLabel>
                          Lungime șină
                          (mm)
                        </InputLabel>

                        <TextInput
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="Ex.: 3200"
                          value={
                            dimension
                              .track_length
                          }
                          disabled={
                            disabled
                          }
                          onChange={(
                            event
                          ) =>
                            updateDimension(
                              dimension.id,
                              "track_length",
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <InputLabel>
                          Cantitate
                        </InputLabel>

                        <TextInput
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          placeholder="Ex.: 1"
                          value={
                            dimension.quantity
                          }
                          disabled={
                            disabled
                          }
                          onChange={(
                            event
                          ) =>
                            updateDimension(
                              dimension.id,
                              "quantity",
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <InputLabel>
                          Observație
                          piesă
                        </InputLabel>

                        <TextInput
                          placeholder="Ex.: Living, geam stânga"
                          value={
                            dimension.notes
                          }
                          disabled={
                            disabled
                          }
                          onChange={(
                            event
                          ) =>
                            updateDimension(
                              dimension.id,
                              "notes",
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-aj-line bg-white p-3">
                      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-aj-navy/70">
                        Rejansă și consum
                        material
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <InputLabel>
                            Tip rejansă
                          </InputLabel>

                          <input
                            type="text"
                            list={`heading-types-${product.id}`}
                            placeholder="Selectează sau scrie..."
                            value={
                              dimension
                                .heading_type
                            }
                            disabled={
                              disabled
                            }
                            onChange={(
                              event
                            ) =>
                              updateDimension(
                                dimension.id,
                                "heading_type",
                                event
                                  .target
                                  .value
                              )
                            }
                            className="h-10 w-full rounded-lg border border-aj-line bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-aj-gold focus:ring-2 focus:ring-aj-gold/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          />

                          <FieldHint>
                            Selectează din
                            listă sau scrie
                            orice tip nou.
                          </FieldHint>
                        </div>

                        <div>
                          <InputLabel>
                            Coeficient
                            rejansă
                          </InputLabel>

                          <TextInput
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="Ex.: 2.50"
                            value={
                              dimension
                                .heading_ratio
                            }
                            disabled={
                              disabled
                            }
                            onChange={(
                              event
                            ) =>
                              updateDimension(
                                dimension.id,
                                "heading_ratio",
                                event
                                  .target
                                  .value
                              )
                            }
                          />

                          <FieldHint>
                            Este complet
                            editabil pentru
                            fiecare poziție.
                          </FieldHint>
                        </div>

                        <div>
                          <InputLabel>
                            Consum material
                            (mm)
                          </InputLabel>

                          <TextInput
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="Ex.: 8000"
                            value={
                              dimension
                                .material_length
                            }
                            disabled={
                              disabled
                            }
                            onChange={(
                              event
                            ) =>
                              updateDimension(
                                dimension.id,
                                "material_length",
                                event
                                  .target
                                  .value
                              )
                            }
                          />

                          <FieldHint>
                            Se calculează
                            automat, dar îl
                            poți modifica.
                          </FieldHint>
                        </div>

                        <div className="rounded-lg border border-aj-line bg-aj-cream/40 px-3 py-2">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Calcul poziție
                          </div>

                          <div className="mt-1 text-lg font-extrabold text-aj-navy">
                            {formatNumber(
                              calculatedPositionTotal /
                                1000,
                              2
                            )}{" "}
                            ml
                          </div>

                          <div className="mt-1 text-[11px] leading-4 text-slate-400">
                            șină (mm) ×
                            coeficient ×
                            cantitate
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <InputLabel
                          optional
                        >
                          Orientare
                          material
                        </InputLabel>

                        <NativeSelect
                          value={
                            dimension.orientation
                          }
                          disabled={
                            disabled
                          }
                          onChange={(
                            event
                          ) =>
                            updateDimension(
                              dimension.id,
                              "orientation",
                              event
                                .target
                                .value
                            )
                          }
                        >
                          {ORIENTATION_OPTIONS.map(
                            (
                              option
                            ) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {
                                  option.label
                                }
                              </option>
                            )
                          )}
                        </NativeSelect>
                      </div>

                      <div>
                        <InputLabel
                          optional
                        >
                          Tiv sus
                        </InputLabel>

                        <TextInput
                          placeholder="Ex.: 2 cm"
                          value={
                            dimension.top_hem
                          }
                          disabled={
                            disabled
                          }
                          onChange={(
                            event
                          ) =>
                            updateDimension(
                              dimension.id,
                              "top_hem",
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <InputLabel
                          optional
                        >
                          Tiv jos
                        </InputLabel>

                        <TextInput
                          placeholder="Ex.: 10 cm"
                          value={
                            dimension
                              .bottom_hem
                          }
                          disabled={
                            disabled
                          }
                          onChange={(
                            event
                          ) =>
                            updateDimension(
                              dimension.id,
                              "bottom_hem",
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <InputLabel
                          optional
                        >
                          Observații
                          atelier
                        </InputLabel>

                        <TextInput
                          placeholder="Ex.: Îmbinare pe lateral"
                          value={
                            dimension
                              .workshop_notes
                          }
                          disabled={
                            disabled
                          }
                          onChange={(
                            event
                          ) =>
                            updateDimension(
                              dimension.id,
                              "workshop_notes",
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {unit ===
                      "mp" && (
                      <>
                        <div>
                          <InputLabel>
                            Lățime
                            (mm)
                          </InputLabel>

                          <TextInput
                            type="number"
                            min="0"
                            step="1"
                            inputMode="decimal"
                            placeholder="Ex.: 1200"
                            value={
                              dimension.width
                            }
                            disabled={
                              disabled
                            }
                            onChange={(
                              event
                            ) =>
                              updateDimension(
                                dimension.id,
                                "width",
                                event
                                  .target
                                  .value
                              )
                            }
                          />
                        </div>

                        <div>
                          <InputLabel>
                            Înălțime
                            (mm)
                          </InputLabel>

                          <TextInput
                            type="number"
                            min="0"
                            step="1"
                            inputMode="decimal"
                            placeholder="Ex.: 1800"
                            value={
                              dimension.height
                            }
                            disabled={
                              disabled
                            }
                            onChange={(
                              event
                            ) =>
                              updateDimension(
                                dimension.id,
                                "height",
                                event
                                  .target
                                  .value
                              )
                            }
                          />
                        </div>
                      </>
                    )}

                    {unit ===
                      "ml" && (
                      <div>
                        <InputLabel>
                          Lungime
                          (mm)
                        </InputLabel>

                        <TextInput
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="Ex.: 6500"
                          value={
                            dimension.length
                          }
                          disabled={
                            disabled
                          }
                          onChange={(
                            event
                          ) =>
                              updateDimension(
                                dimension.id,
                                "length",
                                event
                                  .target
                                  .value
                              )
                          }
                        />
                      </div>
                    )}

                    <div>
                      <InputLabel>
                        {unit ===
                        "set"
                          ? "Număr seturi"
                          : "Cantitate"}
                      </InputLabel>

                      <TextInput
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        placeholder="Ex.: 1"
                        value={
                          dimension.quantity
                        }
                        disabled={
                          disabled
                        }
                        onChange={(
                          event
                        ) =>
                          updateDimension(
                            dimension.id,
                            "quantity",
                            event
                              .target
                              .value
                          )
                        }
                      />
                    </div>

                    <div>
                      <InputLabel>
                        Observație
                        piesă
                      </InputLabel>

                      <TextInput
                        placeholder="Ex.: Geam stânga"
                        value={
                          dimension.notes
                        }
                        disabled={
                          disabled
                        }
                        onChange={(
                          event
                        ) =>
                          updateDimension(
                            dimension.id,
                            "notes",
                            event
                              .target
                              .value
                          )
                        }
                      />
                    </div>
                  </div>
                )}

                {mpPricing && (
                  <div className="mt-3 rounded-lg border border-aj-line bg-white px-3 py-2">
                    <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-slate-500">
                        Suprafață reală:{" "}
                        <strong className="text-aj-navy">
                          {formatNumber(
                            mpPricing.realAreaTotalMp,
                            3
                          )}{" "}
                          mp
                        </strong>
                      </span>

                      <span className="text-slate-500">
                        Suprafață facturabilă:{" "}
                        <strong className="text-aj-navy">
                          {formatNumber(
                            mpPricing.billableAreaTotalMp,
                            3
                          )}{" "}
                          mp
                        </strong>
                      </span>
                    </div>

                    {(mpPricing.minimumAreaApplied ||
                      mpPricing.minimumHeightApplied) && (
                      <div className="mt-2 space-y-1 text-[11px] font-semibold text-amber-700">
                        {mpPricing.minimumHeightApplied && (
                          <div>
                            S-a aplicat înălțimea minimă de calcul de 1500 mm.
                          </div>
                        )}

                        {mpPricing.minimumAreaApplied && (
                          <div>
                            S-a aplicat suprafața minimă de calcul de 0,70 mp/bucată.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-aj-line bg-aj-cream/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500">
            Total dimensiuni
          </div>

          <div className="text-xs text-slate-400">
            {dimensions.length}{" "}
            {dimensions.length === 1
              ? "poziție"
              : "poziții"}{" "}
            de dimensiune
          </div>

          {curtainProduct &&
            totals
              .calculatedCurtainMl >
              0 && (
              <div className="mt-1 text-xs text-slate-500">
                Consum calculat
                după șină și
                coeficient:{" "}
                <span className="font-bold text-aj-navy">
                  {formatNumber(
                    totals
                      .calculatedCurtainMl /
                      1000,
                    2
                  )}{" "}
                  ml
                </span>
              </div>
            )}
        </div>

        <div className="text-lg font-extrabold text-aj-navy">
          {totalLabel}
        </div>
      </div>
    </section>
  );
}
