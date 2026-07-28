import {
  escapeHtml,
  formatMoney,
  getDimensionsHtml,
  getProductDetails,
  getProductName,
  getUnit,
} from "./helpers";

import { calculateProductPricing } from "../pricingRules";

const formatQuantity = (value) =>
  Number(value || 0).toLocaleString("ro-RO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

const getClientProductsTable = (products = []) => {
  const rows = products
    .map((product, index) => {
      const pricing = calculateProductPricing(product);

      const measuredQuantity = pricing.billableQuantity;
      const unitPrice = pricing.unitPrice;

      const discount = Math.max(
        Number(product.discount || 0),
        0
      );

      const total = Math.max(
        pricing.totalPrice - discount,
        0
      );

      return `
        <tr>
          <td class="center">
            ${index + 1}
          </td>

          <td>
            <div class="product-name">
              ${escapeHtml(getProductName(product))}
            </div>

            ${
              product.room
                ? `
                  <div class="product-room">
                    ${escapeHtml(product.room)}
                  </div>
                `
                : ""
            }

            <div class="details">
              ${getProductDetails(product)}
            </div>
          </td>

          <td>
            ${getDimensionsHtml(product)}
          </td>

          <td class="number">
            ${formatQuantity(measuredQuantity)}
            ${escapeHtml(getUnit(product))}
          </td>

          <td class="number">
            ${formatMoney(unitPrice)}
            <span class="currency">lei</span>
          </td>

          <td class="number">
            ${
              discount > 0
                ? `
                  ${formatMoney(discount)}
                  <span class="currency">lei</span>
                `
                : "—"
            }
          </td>

          <td class="number">
            <strong>
              ${formatMoney(total)}
              <span class="currency">lei</span>
            </strong>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="section">
      <div class="section-title">
        Produse comandate
      </div>

      <table class="client-table">
        <colgroup>
          <col class="col-position" />
          <col class="col-product" />
          <col class="col-dimensions" />
          <col class="col-quantity" />
          <col class="col-unit-price" />
          <col class="col-discount" />
          <col class="col-total" />
        </colgroup>

        <thead>
          <tr>
            <th>Poz.</th>
            <th>Produs și specificații</th>
            <th>Dimensiuni</th>
            <th>Cant.</th>
            <th>Preț unitar</th>
            <th>Discount</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
};

export default getClientProductsTable;
