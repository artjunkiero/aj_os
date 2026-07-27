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
      /*
       * Motorul centralizat reprezintă singura sursă de adevăr:
       *
       * - dimensiuni introduse în mm;
       * - conversie mm² → m²;
       * - minimum 0,70 mp / piesă;
       * - minimum 1500 mm înălțime pentru verticale;
       * - cantitate facturabilă;
       * - totalul produsului.
       */
      const pricing = calculateProductPricing(product);

      const measuredQuantity =
        pricing.billableQuantity;

      const unitPrice =
        pricing.unitPrice;

      const discount = Math.max(
        Number(product.discount || 0),
        0
      );

      /*
       * Nu mai utilizăm product.total deoarece acesta poate proveni
       * dintr-un calcul vechi sau poate fi rămas nesincronizat.
       */
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
            ${formatMoney(unitPrice)} lei
          </td>

          <td class="number">
            ${
              discount > 0
                ? `${formatMoney(discount)} lei`
                : "—"
            }
          </td>

          <td class="number">
            <strong>
              ${formatMoney(total)} lei
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

      <table>
        <thead>
          <tr>
            <th style="width:35px;">
              Poz.
            </th>

            <th>
              Produs și specificații
            </th>

            <th style="width:120px;">
              Dimensiuni
            </th>

            <th style="width:80px;">
              Cant.
            </th>

            <th style="width:90px;">
              Preț unitar
            </th>

            <th style="width:80px;">
              Discount
            </th>

            <th style="width:90px;">
              Total
            </th>
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
