import React, { useMemo } from "react";
import {
  Plus,
  Trash2,
} from "lucide-react";

import {
  TextInput,
} from "./_Modal";

function createDimension() {
  return {
    id: `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`,

    width: "",
    height: "",
    length: "",
    quantity: 1,
    notes: "",
  };
}

function normalizeDimension(
  dimension = {}
) {
  return {
    id:
      dimension.id ||
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`,

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

function InputLabel({
  children,
}) {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
      {children}
    </label>
  );
}

export default function ProductDimensions({
  product,
  updateProduct,
  disabled = false,
}) {
  const unit =
    product.unit || "buc";

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
     * Compatibilitate temporară cu
     * structura veche din WorkOrders.
     *
     * După introducerea hook-urilor,
     * calculul va folosi direct
     * product.dimensions.
     */
    updateProduct(
      product.id,
      "width",
      firstDimension.width
    );

    updateProduct(
      product.id,
      "height",
      firstDimension.height
    );

    updateProduct(
      product.id,
      "length",
      firstDimension.length
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
        (dimension) =>
          dimension.id ===
          dimensionId
            ? {
                ...dimension,
                [field]: value,
              }
            : dimension
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
              dimension.length
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
            length * quantity;

          accumulator.totalMp +=
            (width / 1000) *
            (height / 1000) *
            quantity;

          return accumulator;
        },
        {
          quantity: 0,
          totalMl: 0,
          totalMp: 0,
        }
      ),
    [
      dimensions,
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-bold text-aj-navy">
            Dimensiuni
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

      <div className="space-y-3">
        {dimensions.map(
          (
            dimension,
            dimensionIndex
          ) => (
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
                      (m)
                    </InputLabel>

                    <TextInput
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="Ex.: 6.50"
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
                    {unit === "set"
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
                    Observație piesă
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
            </div>
          )
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
        </div>

        <div className="text-lg font-extrabold text-aj-navy">
          {totalLabel}
        </div>
      </div>
    </section>
  );
}
