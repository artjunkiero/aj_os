import getHeader from "./header";
import getCustomerSection from "./customer";
import getClientProductsTable from "./productsClient";
import getProductionProductsTable from "./productsProduction";
import openPrintDocument from "./printer";
import { escapeHtml, formatMoney } from "./helpers";
import COMPANY from "./company";

const DOCUMENT_TYPES = {
  CLIENT_ORDER: "client-order",
  PRODUCTION: "production",
};

const getProducts = (workOrder = {}) =>
  Array.isArray(workOrder.products) ? workOrder.products : [];

const getDocumentNumber = (workOrder = {}) =>
  workOrder.order_number ||
  workOrder.number ||
  workOrder.id ||
  "ART-JUNKIE";

const getNotesSection = ({
  title = "Observații",
  notes = "",
} = {}) => {
  if (!notes) return "";

  return `
    <section class="section">
      <div class="section-title">
        ${escapeHtml(title)}
      </div>

      <div class="notes">
        ${escapeHtml(notes)}
      </div>
    </section>
  `;
};

const getSignaturesSection = ({
  leftLabel = "Semnătura clientului",
  rightLabel = "Reprezentant ART JUNKIE",
} = {}) => `
  <div class="signatures">
    <div class="signature">
      ${escapeHtml(leftLabel)}
    </div>

    <div class="signature">
      ${escapeHtml(rightLabel)}
    </div>
  </div>
`;

const getFooter = (text = COMPANY.footer) => `
  <div class="footer">
    ${escapeHtml(text)}
  </div>
`;

const getTotalsSection = (workOrder = {}) => {
  const total = Number(workOrder.total_amount || 0);
  const advance = Number(workOrder.advance_paid || 0);
  const remaining = Math.max(total - advance, 0);

  return `
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
  `;
};

const buildClientOrderDocument = ({
  workOrder = {},
  customer = {},
}) => {
  const products = getProducts(workOrder);

  return {
    title: "Bon de comandă",

    fileName: `Bon-comanda-${getDocumentNumber(workOrder)}`,

    content: `
      ${getHeader("Bon de comandă", workOrder)}

      ${getCustomerSection(customer)}

      ${getClientProductsTable(products)}

      ${getTotalsSection(workOrder)}

      ${getNotesSection({
        title: "Observații comandă",
        notes: workOrder.notes,
      })}

      ${getSignaturesSection({
        leftLabel: "Semnătura clientului",
        rightLabel: "Reprezentant ART JUNKIE",
      })}

      ${getFooter()}
    `,
  };
};

const buildProductionDocument = ({
  workOrder = {},
  customer = {},
}) => {
  const products = getProducts(workOrder);

  return {
    title: "Fișă de producție",

    fileName: `Fisa-productie-${getDocumentNumber(workOrder)}`,

    content: `
      ${getHeader("Fișă de producție", workOrder)}

      ${getCustomerSection(customer)}

      ${getProductionProductsTable(products)}

      ${getNotesSection({
        title: "Observații generale pentru producție",
        notes: workOrder.notes,
      })}

      ${getSignaturesSection({
        leftLabel: "Predat în producție",
        rightLabel: "Verificat / Finalizat",
      })}

      ${getFooter(
        "Fișă internă ART JUNKIE — document fără informații financiare"
      )}
    `,
  };
};

const DOCUMENT_BUILDERS = {
  [DOCUMENT_TYPES.CLIENT_ORDER]: buildClientOrderDocument,
  [DOCUMENT_TYPES.PRODUCTION]: buildProductionDocument,
};

const DocumentEngine = {
  render({
    type,
    workOrder = {},
    customer = {},
    autoPrint = true,
  } = {}) {
    const builder = DOCUMENT_BUILDERS[type];

    if (!builder) {
      throw new Error(
        `Tip de document necunoscut: ${String(type || "nedefinit")}`
      );
    }

    const document = builder({
      workOrder,
      customer,
    });

    if (!autoPrint) {
      return document;
    }

    return openPrintDocument(document);
  },

  register(type, builder) {
    if (!type || typeof type !== "string") {
      throw new Error(
        "Tipul documentului trebuie să fie un text valid."
      );
    }

    if (typeof builder !== "function") {
      throw new Error(
        "Generatorul documentului trebuie să fie o funcție."
      );
    }

    DOCUMENT_BUILDERS[type] = builder;
  },

  has(type) {
    return Boolean(DOCUMENT_BUILDERS[type]);
  },

  getSupportedTypes() {
    return Object.keys(DOCUMENT_BUILDERS);
  },
};

export {
  DOCUMENT_TYPES,
  buildClientOrderDocument,
  buildProductionDocument,
};

export default DocumentEngine;
