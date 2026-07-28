import {
  escapeHtml,
  getDimensionsHtml,
  getProductDimensionsList,
  getProductDetails,
  getProductName,
} from "./helpers";

const getProductionProductsTable = (products = []) => {
  const rows = products
    .map((product, index) => {
      const dimensions = getProductDimensionsList(product);

      const totalQuantity = dimensions.reduce(
        (sum, dimension) =>
          sum + Number(dimension?.quantity || 0),
        0
      );

      return `
        <tr>
          <td class="center production-position">
            ${index + 1}
          </td>

          <td class="production-product">
            <div class="product-name">
              ${escapeHtml(getProductName(product))}
            </div>
          </td>

          <td class="production-room">
            ${escapeHtml(product?.room || "—")}
          </td>

          <td class="production-dimensions">
            ${getDimensionsHtml(product)}
          </td>

          <td class="center production-quantity">
            ${escapeHtml(totalQuantity)}
          </td>

          <td class="production-details">
            <div class="details">
              ${getProductDetails(product) || "—"}
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="section production-products">
      <div class="section-title">
        Produse pentru producție
      </div>

      <table class="production-table">
        <colgroup>
          <col class="production-col-position" />
          <col class="production-col-product" />
          <col class="production-col-room" />
          <col class="production-col-dimensions" />
          <col class="production-col-quantity" />
          <col class="production-col-details" />
        </colgroup>

        <thead>
          <tr>
            <th class="center">
              Poz.
            </th>

            <th>
              Produs
            </th>

            <th>
              Cameră
            </th>

            <th>
              Dimensiuni
            </th>

            <th class="center">
              Buc.
            </th>

            <th>
              Specificații tehnice și observații
            </th>
          </tr>
        </thead>

        <tbody>
          ${
            rows ||
            `
              <tr>
                <td colspan="6" class="center">
                  Nu există produse pentru producție.
                </td>
              </tr>
            `
          }
        </tbody>
      </table>
    </section>
  `;
};

export default getProductionProductsTable;
