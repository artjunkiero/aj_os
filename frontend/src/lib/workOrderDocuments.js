import DocumentEngine, {
  DOCUMENT_TYPES,
} from "./documents/engine";

export const generateClientOrderDocument = (
  workOrder,
  customer
) => {
  return DocumentEngine.render({
    type: DOCUMENT_TYPES.CLIENT_ORDER,
    workOrder,
    customer,
  });
};

export const generateProductionSheetDocument = (
  workOrder,
  customer
) => {
  return DocumentEngine.render({
    type: DOCUMENT_TYPES.PRODUCTION,
    workOrder,
    customer,
  });
};

export { DocumentEngine, DOCUMENT_TYPES };

export default DocumentEngine;
