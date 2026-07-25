import getHeader from "../header";
import getCustomerSection from "../customer";
import getClientProductsTable from "../productsClient";

import {
  getNotesSection,
  getTotalsSection,
  getSignaturesSection,
  getFooter,
} from "../sections";

const getProducts = (workOrder = {}) =>
  Array.isArray(workOrder.products)
    ? workOrder.products
    : [];

const getDocumentNumber = (workOrder = {}) =>
  workOrder.order_number ||
  workOrder.number ||
  workOrder.id ||
  "ART-JUNKIE";

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

export default buildClientOrderDocument;
