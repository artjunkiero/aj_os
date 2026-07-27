import {
  escapeHtml,
  getDimensionsHtml,
  getProductDimensionsList,
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
            ${getDimensionsHtml(product)}
          </td>

          <td class="center">
            ${escapeHtml(
              getProductDimensionsList(product).reduce(
                (sum, dimension) =>
                  sum + Number(dimension.quantity || 0),
                0
              )
            )}
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
    <section class="section production-products">
      <div class="section-title">
        Produse pentru producție
      </div>

      <table class="production-table">
        <thead>
          <tr>
            <th style="width: 6%;">
              Poz.
            </th>

            <th style="width: 14%;">
              Produs
            </th>

            <th style="width: 11%;">
              Cameră
            </th>

            <th style="width: 17%;">
              Dimensiuni
            </th>

            <th style="width: 7%;">
              Buc.
            </th>

            <th style="width: 45%;">
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
