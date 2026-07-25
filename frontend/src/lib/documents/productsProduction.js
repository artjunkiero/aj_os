import {
  escapeHtml,
  getDimensions,
  getProductDetails,
  getProductName,
} from "./helpers";

const getProductionProductsTable = (products = []) => {
  const rows = products
    .map(
      (product, index) => `
        <tr>
          <td class="center">
            ${index + 1}
          </td>

          <td>
            <div class="product-name">
              ${escapeHtml(getProductName(product))}
            </div>
          </td>

          <td>
            ${escapeHtml(product.room || "—")}
          </td>

          <td>
            ${escapeHtml(getDimensions(product))}
          </td>

          <td class="number">
            ${escapeHtml(product.quantity || 0)}
          </td>

          <td>
            <div class="details">
              ${getProductDetails(product) || "—"}
            </div>
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <section class="section">
      <div class="section-title">
        Produse pentru producție
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 38px;">
              Poz.
            </th>

            <th style="width: 120px;">
              Produs
            </th>

            <th style="width: 90px;">
              Cameră
            </th>

            <th style="width: 115px;">
              Dimensiuni
            </th>

            <th style="width: 60px;">
              Buc.
            </th>

            <th>
              Specificații tehnice și observații
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

export default getProductionProductsTable;
