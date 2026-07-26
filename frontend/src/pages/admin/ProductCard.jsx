import React, { useMemo } from "react";
import { Trash2 } from "lucide-react";

import ProductDimensions from "./ProductDimensions";

import {
  TextInput,
  TextArea,
  Select,
} from "./_Modal";

const CONTROL_SIDE_OPTIONS = [
  {
    value: "dreapta",
    label: "Dreapta",
  },
  {
    value: "stanga",
    label: "Stânga",
  },
  {
    value: "fara",
    label: "Fără acționare",
  },
];

const PRODUCT_GROUPS = {
  shading: [
    "roleta",
    "daynight",
    "plisse",
    "venetiana",
    "verticala",
    "rulou",
  ],

  textile: [
    "perdea",
    "draperie",
  ],

  insectScreens: [
    "plasa",
  ],

  hardware: [
    "galerie",
  ],
};

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

function SectionTitle({
  children,
  description,
}) {
  return (
    <div className="col-span-full">
      <div className="text-sm font-bold text-aj-navy">
        {children}
      </div>

      {description && (
        <div className="mt-0.5 text-xs text-slate-400">
          {description}
        </div>
      )}
    </div>
  );
}

function getProductPlaceholder(productType) {
  const placeholders = {
    roleta:
      "Ex.: Roletă blackout premium",

    daynight:
      "Ex.: Day & Night Elegance",

    plisse:
      "Ex.: Plisse blackout",

    venetiana:
      "Ex.: Venețiană aluminiu 25 mm",

    verticala:
      "Ex.: Jaluzea verticală office",

    rulou:
      "Ex.: Rulou exterior aluminiu",

    plasa:
      "Ex.: Plasă cu balamale",

    perdea:
      "Ex.: Perdea voal premium",

    draperie:
      "Ex.: Draperie blackout",

    galerie:
      "Ex.: Galerie simplă 25 mm",

    other:
      "Ex.: Produs personalizat",
  };

  return (
    placeholders[productType] ||
    "Ex.: Modelul sau denumirea comercială"
  );
}

function getMaterialPlaceholder(productType) {
  const placeholders = {
    perdea:
      "Ex.: Voal, in, organza",

    draperie:
      "Ex.: Catifea, blackout, dimout",

    plasa:
      "Ex.: Fibră de sticlă gri",

    galerie:
      "Ex.: Aluminiu, oțel, lemn",

    rulou:
      "Ex.: Aluminiu termoizolant",
  };

  return (
    placeholders[productType] ||
    "Ex.: Blackout, screen, poliester"
  );
}

function getCollectionPlaceholder(productType) {
  if (
    PRODUCT_GROUPS.textile.includes(
      productType
    )
  ) {
    return "Ex.: Lunaria";
  }

  if (productType === "plasa") {
    return "Ex.: Profil 25 × 10";
  }

  return "Ex.: Carina";
}

export default function ProductCard({
  product,
  productIndex,
  productTypes,
  unitOptions,
  updateProduct,
  removeProduct,
  formatMoney,
}) {
  const selectedType = useMemo(
    () =>
      productTypes.find(
        (item) =>
          item.value ===
          product.product_type
      ),
    [
      product.product_type,
      productTypes,
    ]
  );

  const allowedUnitOptions = useMemo(
    () => {
      const allowedUnits =
        selectedType?.allowedUnits?.length
          ? selectedType.allowedUnits
          : unitOptions.map(
              (item) => item.value
            );

      return unitOptions.filter(
        (item) =>
          allowedUnits.includes(
            item.value
          )
      );
    },
    [
      selectedType,
      unitOptions,
    ]
  );

  const selectedUnit = useMemo(
    () =>
      unitOptions.find(
        (item) =>
          item.value ===
          (product.unit || "buc")
      ),
    [
      product.unit,
      unitOptions,
    ]
  );

  const isShadingProduct =
    PRODUCT_GROUPS.shading.includes(
      product.product_type
    );

  const isTextileProduct =
    PRODUCT_GROUPS.textile.includes(
      product.product_type
    );

  const isInsectScreen =
    PRODUCT_GROUPS.insectScreens.includes(
      product.product_type
    );

  const isHardwareProduct =
    PRODUCT_GROUPS.hardware.includes(
      product.product_type
    );

  const hasSelectedProductType =
    Boolean(product.product_type);

  const showMaterialFields =
    hasSelectedProductType &&
    product.product_type !== "other";

  const showMechanismFields =
    isShadingProduct ||
    isInsectScreen;

  const showControlSide =
    isShadingProduct &&
    product.product_type !== "rulou";

  return (
    <article
      id={`product-card-${product.id}`}
      data-product-id={product.id}
      className="overflow-hidden rounded-2xl border border-aj-line bg-white shadow-sm"
    >
      <header className="flex flex-col gap-3 border-b border-aj-line bg-aj-cream/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-aj-navy/50">
            Poziția {productIndex + 1}
          </div>

          <div className="mt-1 truncate text-lg font-extrabold text-aj-navy">
            {selectedType?.label ||
              "Produs necompletat"}
          </div>

          {product.room && (
            <div className="mt-0.5 truncate text-xs text-slate-500">
              {product.room}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            removeProduct(product.id)
          }
          className="inline-flex items-center justify-center gap-1.5 self-start rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 sm:self-auto"
          aria-label={`Șterge poziția ${
            productIndex + 1
          }`}
        >
          <Trash2 size={15} />

          Șterge
        </button>
      </header>

      <div className="space-y-6 p-4">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SectionTitle description="Alege categoria și identifică poziția din comandă.">
            Informații de bază
          </SectionTitle>

          <div>
            <InputLabel>
              Tip produs
            </InputLabel>

            <Select
              value={
                product.product_type
              }
              onChange={(event) =>
                updateProduct(
                  product.id,
                  "product_type",
                  event.target.value
                )
              }
              options={productTypes}
            />
          </div>

          {product.product_type ===
            "other" && (
            <div>
              <InputLabel>
                Denumire produs
              </InputLabel>

              <TextInput
                placeholder="Ex.: Panou decorativ personalizat"
                value={
                  product.custom_product_name
                }
                onChange={(event) =>
                  updateProduct(
                    product.id,
                    "custom_product_name",
                    event.target.value
                  )
                }
              />
            </div>
          )}

          <div>
            <InputLabel>
              Camera / încăperea
            </InputLabel>

            <TextInput
              placeholder="Ex.: Living, Dormitor, Bucătărie"
              value={product.room}
              onChange={(event) =>
                updateProduct(
                  product.id,
                  "room",
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <InputLabel>
              Model / denumire
            </InputLabel>

            <TextInput
              placeholder={getProductPlaceholder(
                product.product_type
              )}
              value={product.product}
              onChange={(event) =>
                updateProduct(
                  product.id,
                  "product",
                  event.target.value
                )
              }
            />
          </div>

          {hasSelectedProductType && (
            <div>
              <InputLabel>
                Unitate de calcul
              </InputLabel>

              <Select
                value={
                  product.unit || "buc"
                }
                onChange={(event) =>
                  updateProduct(
                    product.id,
                    "unit",
                    event.target.value
                  )
                }
                options={
                  allowedUnitOptions
                }
              />
            </div>
          )}
        </section>

        {hasSelectedProductType && (
          <section className="border-t border-aj-line pt-5">
            <ProductDimensions
              product={product}
              updateProduct={
                updateProduct
              }
            />
          </section>
        )}

        {showMaterialFields && (
          <section className="grid grid-cols-1 gap-4 border-t border-aj-line pt-5 md:grid-cols-2 lg:grid-cols-4">
            <SectionTitle
              description={
                isTextileProduct
                  ? "Datele materialului textil ales de client."
                  : isInsectScreen
                    ? "Datele profilului și ale plasei."
                    : isHardwareProduct
                      ? "Finisajul și materialul sistemului."
                      : "Datele materialului și ale mecanismului."
              }
            >
              Configurația produsului
            </SectionTitle>

            <div>
              <InputLabel>
                Material
              </InputLabel>

              <TextInput
                placeholder={getMaterialPlaceholder(
                  product.product_type
                )}
                value={product.material}
                onChange={(event) =>
                  updateProduct(
                    product.id,
                    "material",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <InputLabel>
                {isInsectScreen
                  ? "Profil / colecție"
                  : "Colecție"}
              </InputLabel>

              <TextInput
                placeholder={getCollectionPlaceholder(
                  product.product_type
                )}
                value={product.collection}
                onChange={(event) =>
                  updateProduct(
                    product.id,
                    "collection",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <InputLabel>
                {isHardwareProduct
                  ? "Culoare / finisaj"
                  : isInsectScreen
                    ? "Culoare plasă"
                    : "Culoare material"}
              </InputLabel>

              <TextInput
                placeholder={
                  isHardwareProduct
                    ? "Ex.: Negru mat, Auriu"
                    : isInsectScreen
                      ? "Ex.: Gri, Negru"
                      : "Ex.: Crem, Cod 102"
                }
                value={
                  product.fabric_color
                }
                onChange={(event) =>
                  updateProduct(
                    product.id,
                    "fabric_color",
                    event.target.value
                  )
                }
              />
            </div>

            {showMechanismFields && (
              <div>
                <InputLabel>
                  {isInsectScreen
                    ? "Culoare profil"
                    : "Culoare mecanism"}
                </InputLabel>

                <TextInput
                  placeholder={
                    isInsectScreen
                      ? "Ex.: Alb, Maro, Antracit"
                      : "Ex.: Alb, Negru, Antracit"
                  }
                  value={
                    product.mechanism_color
                  }
                  onChange={(event) =>
                    updateProduct(
                      product.id,
                      "mechanism_color",
                      event.target.value
                    )
                  }
                />
              </div>
            )}

            {showControlSide && (
              <div>
                <InputLabel>
                  Parte acționare
                </InputLabel>

                <Select
                  value={
                    product.control_side ||
                    "dreapta"
                  }
                  onChange={(event) =>
                    updateProduct(
                      product.id,
                      "control_side",
                      event.target.value
                    )
                  }
                  options={
                    CONTROL_SIDE_OPTIONS
                  }
                />
              </div>
            )}
          </section>
        )}

        {hasSelectedProductType && (
          <section className="grid grid-cols-1 gap-4 border-t border-aj-line pt-5 md:grid-cols-2 lg:grid-cols-4">
            <SectionTitle description="Prețul se aplică unității de calcul selectate.">
              Preț
            </SectionTitle>

            <div>
              <InputLabel>
                {selectedUnit?.priceLabel ||
                  "Preț unitar"}
              </InputLabel>

              <TextInput
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder={
                  selectedUnit?.priceLabel ||
                  "Ex.: 150"
                }
                value={
                  product.unit_price
                }
                onChange={(event) =>
                  updateProduct(
                    product.id,
                    "unit_price",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <InputLabel>
                Total poziție
              </InputLabel>

              <div className="flex h-11 items-center rounded-lg border border-aj-line bg-aj-cream/50 px-3 text-base font-extrabold text-aj-navy">
                {formatMoney(
                  product.total
                )}
              </div>
            </div>
          </section>
        )}

        <section className="border-t border-aj-line pt-5">
          <InputLabel optional>
            Detalii și observații pentru produs
          </InputLabel>

          <TextArea
            placeholder="Ex.: particularități de execuție, montaj, amplasare, material sau culoare..."
            value={product.notes}
            onChange={(event) =>
              updateProduct(
                product.id,
                "notes",
                event.target.value
              )
            }
          />
        </section>
      </div>
    </article>
  );
}
