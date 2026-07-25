const COMPANY = {
  name: "ART JUNKIE SRL",
  subtitle: "Soluții premium pentru decorarea ferestrelor",
  address: "Calea Chișinăului 29, Iași",
  phone: "0737 334 097",
  email: "office@artjunkie.ro",
  website: "www.artjunkie.ro",

  // Le completăm ulterior:
  cui: "",
  regCom: "",
};

const PRODUCT_LABELS = {
  roleta: "Roletă textilă",
  daynight: "Day & Night",
  plisse: "Jaluzea Plisse",
  venetiana: "Jaluzea venețiană",
  verticala: "Jaluzea verticală",
  rulou: "Rulou exterior",
  plasa: "Plasă insecte",
  draperie: "Draperie",
  perdea: "Perdea",
  galerie: "Galerie",
  custom: "Alt produs",
};

const UNIT_LABELS = {
  mp: "m²",
  ml: "ml",
  buc: "buc.",
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  return date.toLocaleDateString("ro-RO");
};

const getProductName = (product) => {
  if (product.custom_name) return product.custom_name;
  if (product.product) return product.product;

  return (
    PRODUCT_LABELS[product.product_type] ||
    product.product_type ||
    "Produs"
  );
};

const getUnit = (product) =>
  UNIT_LABELS[product.unit] || product.unit || "buc.";

const getMeasuredQuantity = (product) => {
  const quantity = Number(product.quantity || 0);
  const width = Number(product.width || 0);
  const height = Number(product.height || 0);
  const length = Number(product.length || 0);

  if (product.unit === "mp") {
    return (width / 1000) * (height / 1000) * quantity;
  }

  if (product.unit === "ml") {
    return length * quantity;
  }

  return quantity;
};

const getDimensions = (product) => {
  if (product.unit === "mp") {
    const width = product.width ? `${product.width} mm` : "—";
    const height = product.height ? `${product.height} mm` : "—";

    return `${width} × ${height}`;
  }

  if (product.unit === "ml") {
    return product.length ? `${product.length} ml` : "—";
  }

  const dimensions = [];

  if (product.width) dimensions.push(`L: ${product.width} mm`);
  if (product.height) dimensions.push(`H: ${product.height} mm`);

  return dimensions.length ? dimensions.join(" / ") : "—";
};

const detailRow = (label, value) => {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === false
  ) {
    return "";
  }

  const displayedValue = value === true ? "Da" : value;

  return `
    <div class="detail">
      <span>${escapeHtml(label)}:</span>
      ${escapeHtml(displayedValue)}
    </div>
  `;
};

const getProductDetails = (product) =>
  [
    detailRow("Colecție", product.collection),
    detailRow("Material", product.material),
    detailRow(
      "Culoare material",
      product.fabric_color || product.color
    ),
    detailRow("Culoare mecanism", product.mechanism_color),
    detailRow("Acționare", product.control_side),
    detailRow("Casetă", product.cassette),
    detailRow("Ghidaje", product.guides),
    detailRow("Motorizare", product.motorized),
    detailRow("Observații", product.notes),
  ]
    .filter(Boolean)
    .join("");

const getCustomerValue = (customer, ...keys) => {
  for (const key of keys) {
    if (customer?.[key]) return customer[key];
  }

  return "—";
};

const getBaseStyles = () => `
  * {
    box-sizing: border-box;
  }

  @page {
    size: A4;
    margin: 12mm;
  }

  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #15243a;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    line-height: 1.45;
  }

  .document {
    width: 100%;
    margin: 0 auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #b99652;
    padding-bottom: 14px;
    margin-bottom: 18px;
  }

  .brand-name {
    font-size: 25px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: #13233a;
  }

  .brand-subtitle {
    margin-top: 6px;
    color: #8e6e33;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.7px;
  }

  .company-info {
    margin-top: 10px;
    color: #526071;
    line-height: 1.55;
  }

  .document-title {
    text-align: right;
  }

  .document-title h1 {
    margin: 0;
    color: #13233a;
    font-size: 19px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .document-number {
    margin-top: 7px;
    font-weight: 700;
    color: #b28a43;
  }

  .section {
    margin-top: 16px;
    page-break-inside: avoid;
  }

  .section-title {
    margin-bottom: 8px;
    padding: 7px 10px;
    background: #13233a;
    color: white;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 1px solid #d9dee5;
  }

  .info-item {
    min-height: 42px;
    padding: 8px 10px;
    border-bottom: 1px solid #d9dee5;
  }

  .info-item:nth-child(odd) {
    border-right: 1px solid #d9dee5;
  }

  .info-item strong {
    display: block;
    margin-bottom: 2px;
    color: #697587;
    font-size: 9px;
    text-transform: uppercase;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead {
    display: table-header-group;
  }

  tr {
    page-break-inside: avoid;
  }

  th {
    padding: 8px 6px;
    background: #edf0f4;
    border: 1px solid #d3d9e1;
    color: #13233a;
    font-size: 9px;
    text-align: left;
    text-transform: uppercase;
  }

  td {
    padding: 8px 6px;
    border: 1px solid #d9dee5;
    vertical-align: top;
  }

  .number {
    text-align: right;
    white-space: nowrap;
  }

  .center {
    text-align: center;
  }

  .product-name {
    font-weight: 700;
    color: #13233a;
  }

  .product-room {
    margin-top: 3px;
    color: #8e6e33;
    font-weight: 600;
  }

  .details {
    margin-top: 5px;
    color: #526071;
    font-size: 9px;
  }

  .detail {
    margin-top: 2px;
  }

  .detail span {
    font-weight: 700;
  }

  .totals {
    width: 310px;
    margin: 16px 0 0 auto;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 10px;
    border-bottom: 1px solid #d9dee5;
  }

  .total-row.grand-total {
    padding-top: 9px;
    padding-bottom: 9px;
    background: #13233a;
    color: white;
    font-size: 13px;
    font-weight: 700;
  }

  .total-row.remaining {
    color: #8e6e33;
    font-size: 12px;
    font-weight: 700;
  }

  .notes {
    min-height: 65px;
    padding: 10px;
    border: 1px solid #d9dee5;
    white-space: pre-wrap;
  }

  .signatures {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 70px;
    margin-top: 55px;
    page-break-inside: avoid;
  }

  .signature {
    padding-top: 8px;
    border-top: 1px solid #697587;
    text-align: center;
    color: #526071;
  }

  .footer {
    margin-top: 30px;
    padding-top: 8px;
    border-top: 1px solid #d9dee5;
    color: #7a8593;
    font-size: 8px;
    text-align: center;
  }

  @media print {
    body {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    .no-print {
      display: none !important;
    }
  }
`;

const getHeader = (title, workOrder) => `
  <header class="header">
    <div>
      <div class="brand-name">${escapeHtml(COMPANY.name)}</div>

      <div class="brand-subtitle">
        ${escapeHtml(COMPANY.subtitle)}
      </div>

      <div class="company-info">
        ${escapeHtml(COMPANY.address)}<br>
        Telefon: ${escapeHtml(COMPANY.phone)}<br>
        ${escapeHtml(COMPANY.email)} · ${escapeHtml(COMPANY.website)}
        ${
          COMPANY.cui
            ? `<br>CUI: ${escapeHtml(COMPANY.cui)}`
            : ""
        }
        ${
          COMPANY.regCom
            ? ` · Reg. Com.: ${escapeHtml(COMPANY.regCom)}`
            : ""
        }
      </div>
    </div>

    <div class="document-title">
      <h1>${escapeHtml(title)}</h1>

      <div class="document-number">
        Nr. ${escapeHtml(
          workOrder.order_number ||
            workOrder.number ||
            workOrder.id ||
            "—"
        )}
      </div>

      <div style="margin-top: 8px;">
        Data: ${formatDate(
          workOrder.order_date || workOrder.created_at
        )}
      </div>

      <div>
        Termen livrare: ${formatDate(workOrder.delivery_date)}
      </div>
    </div>
  </header>
`;

const getCustomerSection = (customer) => `
  <section class="section">
    <div class="section-title">Date client</div>

    <div class="info-grid">
      <div class="info-item">
        <strong>Client</strong>
        ${escapeHtml(getCustomerValue(customer, "name", "full_name"))}
      </div>

      <div class="info-item">
        <strong>Telefon</strong>
        ${escapeHtml(getCustomerValue(customer, "phone", "telephone"))}
      </div>

      <div class="info-item">
        <strong>E-mail</strong>
        ${escapeHtml(getCustomerValue(customer, "email"))}
      </div>

      <div class="info-item">
        <strong>Adresă</strong>
        ${escapeHtml(
          getCustomerValue(
            customer,
            "installation_address",
            "address",
            "billing_address"
          )
        )}
      </div>
    </div>
  </section>
`;

const getClientProductsTable = (products) => {
  const rows = products
    .map((product, index) => {
      const measuredQuantity = getMeasuredQuantity(product);
      const unitPrice = Number(product.unit_price || 0);
      const discount = Number(product.discount || 0);
      const total = Number(
        product.total ??
          measuredQuantity * unitPrice - discount
      );

      return `
        <tr>
          <td class="center">${index + 1}</td>

          <td>
            <div class="product-name">
              ${escapeHtml(getProductName(product))}
            </div>

            ${
              product.room
                ? `<div class="product-room">${escapeHtml(
                    product.room
                  )}</div>`
                : ""
            }

            <div class="details">
              ${getProductDetails(product)}
            </div>
          </td>

          <td>${escapeHtml(getDimensions(product))}</td>

          <td class="number">
            ${measuredQuantity.toLocaleString("ro-RO", {
              maximumFractionDigits: 3,
            })}
            ${escapeHtml(getUnit(product))}
          </td>

          <td class="number">${formatMoney(unitPrice)} lei</td>

          <td class="number">
            ${discount ? `${formatMoney(discount)} lei` : "—"}
          </td>

          <td class="number">
            <strong>${formatMoney(total)} lei</strong>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="section">
      <div class="section-title">Produse comandate</div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px;">Poz.</th>
            <th>Produs și specificații</th>
            <th style="width: 110px;">Dimensiuni</th>
            <th style="width: 75px;">Cantitate</th>
            <th style="width: 85px;">Preț unitar</th>
            <th style="width: 70px;">Discount</th>
            <th style="width: 85px;">Total</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
};

const getProductionProductsTable = (products) => {
  const rows = products
    .map(
      (product, index) => `
        <tr>
          <td class="center">${index + 1}</td>

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
      <div class="section-title">Produse pentru producție</div>

      <table>
        <thead>
          <tr>
            <th style="width: 38px;">Poz.</th>
            <th style="width: 120px;">Produs</th>
            <th style="width: 90px;">Cameră</th>
            <th style="width: 115px;">Dimensiuni</th>
            <th style="width: 60px;">Buc.</th>
            <th>Specificații tehnice și observații</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
};

const openPrintDocument = ({
  title,
  fileName,
  content,
}) => {
  const printWindow = window.open("", "_blank", "width=1100,height=800");

  if (!printWindow) {
    throw new Error(
      "Browserul a blocat fereastra pentru document. Permite ferestrele pop-up pentru acest site."
    );
  }

  printWindow.document.open();

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >

        <title>${escapeHtml(fileName)}</title>

        <style>
          ${getBaseStyles()}
        </style>
      </head>

      <body>
        <main class="document">
          ${content}
        </main>

        <script>
          window.addEventListener("load", function () {
            document.title = ${JSON.stringify(fileName)};

            setTimeout(function () {
              window.print();
            }, 300);
          });
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};

export const generateClientOrderDocument = (
  workOrder,
  customer
) => {
  const products = Array.isArray(workOrder.products)
    ? workOrder.products
    : [];

  const total = Number(workOrder.total_amount || 0);
  const advance = Number(workOrder.advance_paid || 0);
  const remaining = Math.max(total - advance, 0);

  const content = `
    ${getHeader("Bon de comandă", workOrder)}

    ${getCustomerSection(customer)}

    ${getClientProductsTable(products)}

    <div class="totals">
      <div class="total-row grand-total">
        <span>Total comandă</span>
        <span>${formatMoney(total)} lei</span>
      </div>

      <div class="total-row">
        <span>Avans achitat</span>
        <span>${formatMoney(advance)} lei</span>
      </div>

      <div class="total-row remaining">
        <span>Rest de plată</span>
        <span>${formatMoney(remaining)} lei</span>
      </div>
    </div>

    ${
      workOrder.notes
        ? `
          <section class="section">
            <div class="section-title">Observații comandă</div>

            <div class="notes">
              ${escapeHtml(workOrder.notes)}
            </div>
          </section>
        `
        : ""
    }

    <div class="signatures">
      <div class="signature">
        Semnătura clientului
      </div>

      <div class="signature">
        Reprezentant ART JUNKIE
      </div>
    </div>

    <div class="footer">
      Document generat din ART JUNKIE OS
    </div>
  `;

  openPrintDocument({
    title: "Bon de comandă",
    fileName: `Bon-comanda-${
      workOrder.order_number || workOrder.id || "ART-JUNKIE"
    }`,
    content,
  });
};

export const generateProductionSheetDocument = (
  workOrder,
  customer
) => {
  const products = Array.isArray(workOrder.products)
    ? workOrder.products
    : [];

  const content = `
    ${getHeader("Fișă de producție", workOrder)}

    ${getCustomerSection(customer)}

    ${getProductionProductsTable(products)}

    ${
      workOrder.notes
        ? `
          <section class="section">
            <div class="section-title">
              Observații generale pentru producție
            </div>

            <div class="notes">
              ${escapeHtml(workOrder.notes)}
            </div>
          </section>
        `
        : ""
    }

    <div class="signatures">
      <div class="signature">
        Predat în producție
      </div>

      <div class="signature">
        Verificat / Finalizat
      </div>
    </div>

    <div class="footer">
      Fișă internă ART JUNKIE — document fără informații financiare
    </div>
  `;

  openPrintDocument({
    title: "Fișă de producție",
    fileName: `Fisa-productie-${
      workOrder.order_number || workOrder.id || "ART-JUNKIE"
    }`,
    content,
  });
};
