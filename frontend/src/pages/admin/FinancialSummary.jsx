import React from "react";
import {
  Calculator,
  Layers3,
  Package,
  Ruler,
  Shapes,
  WalletCards,
} from "lucide-react";

function toNumber(value) {
  const parsedValue =
    Number.parseFloat(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : 0;
}

function formatDecimal(
  value,
  maximumFractionDigits = 2
) {
  return new Intl.NumberFormat(
    "ro-RO",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits,
    }
  ).format(toNumber(value));
}

function defaultFormatMoney(value) {
  return new Intl.NumberFormat(
    "ro-RO",
    {
      style: "currency",
      currency: "RON",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(toNumber(value));
}

function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
}) {
  return (
    <div className="rounded-xl border border-aj-line bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-aj-cream/70 text-aj-navy">
          <Icon size={16} />
        </span>

        <span className="text-xs font-semibold">
          {label}
        </span>
      </div>

      <div className="mt-2 text-lg font-extrabold text-aj-navy">
        {value}

        {suffix && (
          <span className="ml-1 text-xs font-semibold text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  formatter,
  muted = false,
  negative = false,
}) {
  const hasValue =
    toNumber(value) > 0;

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span
        className={
          muted
            ? "text-sm font-medium text-slate-400"
            : "text-sm font-semibold text-slate-600"
        }
      >
        {label}
      </span>

      <span
        className={
          negative && hasValue
            ? "text-sm font-bold text-red-600"
            : muted
              ? "text-sm font-semibold text-slate-400"
              : "text-sm font-bold text-aj-navy"
        }
      >
        {negative && hasValue
          ? `- ${formatter(value)}`
          : formatter(value)}
      </span>
    </div>
  );
}

function SummaryInput({
  label,
  value,
  onChange,
  suffix,
  disabled = false,
  min = 0,
  max,
  step = "0.01",
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>

      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          inputMode="decimal"
          value={value ?? ""}
          disabled={disabled}
          onChange={(event) =>
            onChange?.(
              event.target.value
            )
          }
          className="h-11 w-full rounded-lg border border-aj-line bg-white px-3 pr-12 text-sm font-semibold text-aj-navy outline-none transition focus:border-aj-gold focus:ring-2 focus:ring-aj-gold/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />

        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

export default function FinancialSummary({
  summary = {},
  discountMode = "percent",
  discountValue = 0,
  vatEnabled = true,
  vatRate = 21,
  onDiscountModeChange,
  onDiscountValueChange,
  onVatEnabledChange,
  onVatRateChange,
  formatMoney = defaultFormatMoney,
  readOnly = false,
  className = "",
}) {
  const {
    totalProducts = 0,
    totalDimensions = 0,
    totalPieces = 0,
    totalArea = 0,
    totalLength = 0,
    subtotal = 0,
    discountAmount = 0,
    taxableBase =
      toNumber(subtotal) -
      toNumber(discountAmount),
    vatAmount = 0,
    grandTotal = 0,
  } = summary;

  return (
    <aside
      className={`overflow-hidden rounded-2xl border border-aj-line bg-white shadow-sm ${className}`}
    >
      <header className="border-b border-aj-line bg-aj-cream/35 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-aj-navy text-white">
            <Calculator size={19} />
          </span>

          <div>
            <h2 className="text-base font-extrabold text-aj-navy">
              Rezumat financiar
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              Valorile lucrării sunt
              calculate automat.
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-5 p-5">
        <section>
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-aj-navy/45">
            Cantități
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={Package}
              label="Produse"
              value={formatDecimal(
                totalProducts,
                0
              )}
            />

            <MetricCard
              icon={Layers3}
              label="Dimensiuni"
              value={formatDecimal(
                totalDimensions,
                0
              )}
            />

            <MetricCard
              icon={Shapes}
              label="Bucăți / seturi"
              value={formatDecimal(
                totalPieces,
                0
              )}
            />

            <MetricCard
              icon={Ruler}
              label="Suprafață"
              value={formatDecimal(
                totalArea,
                3
              )}
              suffix="mp"
            />
          </div>

          {toNumber(
            totalLength
          ) > 0 && (
            <div className="mt-3 rounded-xl border border-aj-line bg-aj-cream/25 px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-slate-500">
                  Lungime totală
                </span>

                <span className="text-sm font-extrabold text-aj-navy">
                  {formatDecimal(
                    totalLength,
                    2
                  )}{" "}
                  ml
                </span>
              </div>
            </div>
          )}
        </section>

        {!readOnly && (
          <section className="border-t border-aj-line pt-5">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-aj-navy/45">
              Ajustări
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-1.5 text-xs font-semibold text-slate-600">
                  Tip discount
                </div>

                <div className="grid grid-cols-2 rounded-lg border border-aj-line bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() =>
                      onDiscountModeChange?.(
                        "percent"
                      )
                    }
                    className={`rounded-md px-3 py-2 text-xs font-bold transition ${
                      discountMode ===
                      "percent"
                        ? "bg-aj-navy text-white shadow-sm"
                        : "text-slate-500 hover:text-aj-navy"
                    }`}
                  >
                    Procent
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onDiscountModeChange?.(
                        "fixed"
                      )
                    }
                    className={`rounded-md px-3 py-2 text-xs font-bold transition ${
                      discountMode ===
                      "fixed"
                        ? "bg-aj-navy text-white shadow-sm"
                        : "text-slate-500 hover:text-aj-navy"
                    }`}
                  >
                    Valoare
                  </button>
                </div>
              </div>

              <SummaryInput
                label={
                  discountMode ===
                  "fixed"
                    ? "Discount în lei"
                    : "Discount procentual"
                }
                value={discountValue}
                onChange={
                  onDiscountValueChange
                }
                suffix={
                  discountMode ===
                  "fixed"
                    ? "lei"
                    : "%"
                }
                min={0}
                max={
                  discountMode ===
                  "percent"
                    ? 100
                    : undefined
                }
              />

              <div className="rounded-xl border border-aj-line bg-slate-50/70 p-3">
                <label className="flex cursor-pointer items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-aj-navy">
                      Aplică TVA
                    </div>

                    <div className="mt-0.5 text-xs text-slate-400">
                      TVA se calculează
                      după aplicarea
                      discountului.
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={Boolean(
                      vatEnabled
                    )}
                    onChange={(
                      event
                    ) =>
                      onVatEnabledChange?.(
                        event.target
                          .checked
                      )
                    }
                    className="h-5 w-5 rounded border-aj-line text-aj-navy focus:ring-aj-gold"
                  />
                </label>

                {vatEnabled && (
                  <div className="mt-3">
                    <SummaryInput
                      label="Cotă TVA"
                      value={vatRate}
                      onChange={
                        onVatRateChange
                      }
                      suffix="%"
                      min={0}
                      max={100}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="border-t border-aj-line pt-4">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-aj-navy/45">
            Valoarea lucrării
          </div>

          <div className="divide-y divide-aj-line">
            <MoneyRow
              label="Subtotal produse"
              value={subtotal}
              formatter={
                formatMoney
              }
            />

            <MoneyRow
              label="Discount"
              value={
                discountAmount
              }
              formatter={
                formatMoney
              }
              negative
              muted={
                toNumber(
                  discountAmount
                ) <= 0
              }
            />

            <MoneyRow
              label="Bază după discount"
              value={
                taxableBase
              }
              formatter={
                formatMoney
              }
            />

            <MoneyRow
              label={
                vatEnabled
                  ? `TVA ${formatDecimal(
                      vatRate,
                      2
                    )}%`
                  : "TVA"
              }
              value={vatAmount}
              formatter={
                formatMoney
              }
              muted={!vatEnabled}
            />
          </div>
        </section>

        <section className="rounded-2xl bg-aj-navy p-5 text-white shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
                Total de plată
              </div>

              <div className="mt-1 text-2xl font-black">
                {formatMoney(
                  grandTotal
                )}
              </div>
            </div>

            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
              <WalletCards
                size={21}
              />
            </span>
          </div>
        </section>
      </div>
    </aside>
  );
}
