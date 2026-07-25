import React from "react";
import { Trash2 } from "lucide-react";
import {
  TextInput,
  TextArea,
  Select,
} from "./_Modal";

function InputLabel({ children }) {
  return (
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {children}
    </label>
  );
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
  const selectedType = productTypes.find(
    (item) => item.value === product.product_type
  );

  const selectedUnit = unitOptions.find(
    (item) => item.value === (product.unit || "buc")
  );

  return (
    <div
      id={`product-card-${product.id}`}
      data-product-id={product.id}
      className="border border-aj-line rounded-xl p-4 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Poziția {productIndex + 1}
          </div>

          <div className="font-bold text-aj-navy">
            {selectedType?.label || "Produs necompletat"}
          </div>
        </div>

        <button
          type="button"
          onClick={() => removeProduct(product.id)}
          className="inline-flex items-center gap-1.5 text-red-600 text-sm font-medium"
        >
          <Trash2 size={15} />
          Șterge
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <InputLabel>Tip produs</InputLabel>

          <Select
            value={product.product_type}
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

        {product.product_type === "other" && (
          <div>
            <InputLabel>Denumire produs</InputLabel>

            <TextInput
              placeholder="Ex.: Lambriu decorativ"
              value={product.custom_product_name}
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
          <InputLabel>Camera / încăperea</InputLabel>

          <TextInput
            placeholder="Ex.: Living, Dormitor"
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
          <InputLabel>Model / denumire</InputLabel>

          <TextInput
            placeholder="Ex.: Blackout Premium"
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

        <div>
          <InputLabel>Colecție</InputLabel>

          <TextInput
            placeholder="Ex.: Carina"
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

        {product.unit === "mp" && (
          <>
            <div>
              <InputLabel>Lățime (mm)</InputLabel>

              <TextInput
                type="number"
                min="0"
                step="1"
                placeholder="Ex.: 1200"
                value={product.width}
                onChange={(event) =>
                  updateProduct(
                    product.id,
                    "width",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <InputLabel>Înălțime (mm)</InputLabel>

              <TextInput
                type="number"
                min="0"
                step="1"
                placeholder="Ex.: 1800"
                value={product.height}
                onChange={(event) =>
                  updateProduct(
                    product.id,
                    "height",
                    event.target.value
                  )
                }
              />
            </div>
          </>
        )}

        {product.unit === "ml" && (
          <div>
            <InputLabel>Lungime (m)</InputLabel>

            <TextInput
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex.: 6.5"
              value={product.length}
              onChange={(event) =>
                updateProduct(
                  product.id,
                  "length",
                  event.target.value
                )
              }
            />
          </div>
        )}

        <div>
          <InputLabel>Cantitate</InputLabel>

          <TextInput
            type="number"
            min="1"
            step="1"
            placeholder="Număr bucăți"
            value={product.quantity}
            onChange={(event) =>
              updateProduct(
                product.id,
                "quantity",
                event.target.value
              )
            }
          />
        </div>

        <div>
          <InputLabel>Material</InputLabel>

          <TextInput
            placeholder="Ex.: Blackout, Voal"
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
          <InputLabel>Culoare material</InputLabel>

          <TextInput
            placeholder="Ex.: Crem, Cod 102"
            value={product.fabric_color}
            onChange={(event) =>
              updateProduct(
                product.id,
                "fabric_color",
                event.target.value
              )
            }
          />
        </div>

        <div>
          <InputLabel>Culoare mecanism</InputLabel>

          <TextInput
            placeholder="Ex.: Alb, Antracit"
            value={product.mechanism_color}
            onChange={(event) =>
              updateProduct(
                product.id,
                "mechanism_color",
                event.target.value
              )
            }
          />
        </div>

        <div>
          <InputLabel>Parte acționare</InputLabel>

          <Select
            value={product.control_side}
            onChange={(event) =>
              updateProduct(
                product.id,
                "control_side",
                event.target.value
              )
            }
            options={[
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
            ]}
          />
        </div>

        <div>
          <InputLabel>
            {selectedUnit?.priceLabel || "Lei"}
          </InputLabel>

          <TextInput
            type="number"
            min="0"
            step="0.01"
            placeholder={selectedUnit?.priceLabel || "Lei"}
            value={product.unit_price}
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
          <InputLabel>Total poziție</InputLabel>

          <TextInput
            disabled
            value={formatMoney(product.total)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        <label className="flex items-center gap-2 rounded-lg border border-aj-line p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(product.cassette)}
            onChange={(event) =>
              updateProduct(
                product.id,
                "cassette",
                event.target.checked
              )
            }
          />

          <span className="text-sm font-medium">
            Casetă
          </span>
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-aj-line p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(product.guides)}
            onChange={(event) =>
              updateProduct(
                product.id,
                "guides",
                event.target.checked
              )
            }
          />

          <span className="text-sm font-medium">
            Ghidaje
          </span>
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-aj-line p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(product.motorized)}
            onChange={(event) =>
              updateProduct(
                product.id,
                "motorized",
                event.target.checked
              )
            }
          />

          <span className="text-sm font-medium">
            Motorizare
          </span>
        </label>
      </div>

      <div className="mt-4">
        <InputLabel>
          Detalii și observații pentru produs
        </InputLabel>

        <TextArea
          placeholder="Ex.: particularități de execuție, montaj, material, culoare sau acționare..."
          value={product.notes}
          onChange={(event) =>
            updateProduct(
              product.id,
              "notes",
              event.target.value
            )
          }
        />
      </div>
    </div>
  );
}
