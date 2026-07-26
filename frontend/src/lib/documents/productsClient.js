import {
  escapeHtml,
  formatMoney,
  getDimensionsHtml,
  getProductDetails,
  getProductName,
  getUnit,
} from "./helpers";
import { calculateBillableQuantity } from "../pricingRules";

const getClientProductsTable = (products = []) => {
  const rows = products
    .map((product, index) => {
      const measuredQuantity = calculateBillableQuantity(product);

      const unitPrice = Number(product.unit_price || 0);

      const discount = Number(product.discount || 0);

      const total = Number(
        product.total ??
          measuredQuantity * unitPrice - discount
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
    ? `<div class="product-room">
${escapeHtml(product.room)}
</div>`
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

${measuredQuantity.toLocaleString("ro-RO", {
  maximumFractionDigits: 3,
})}

${escapeHtml(getUnit(product))}

</td>

<td class="number">
${formatMoney(unitPrice)} lei
</td>

<td class="number">
${discount ? `${formatMoney(discount)} lei` : "—"}
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
