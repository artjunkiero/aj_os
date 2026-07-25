import COMPANY from "./company";
import { escapeHtml, formatDate } from "./helpers";

const getOrderNumber = (workOrder = {}) =>
  workOrder.order_number ||
  workOrder.number ||
  workOrder.id ||
  "—";

const getDeliveryDate = (workOrder = {}) =>
  workOrder.delivery_date
    ? formatDate(workOrder.delivery_date)
    : "—";

const getOrderDate = (workOrder = {}) =>
  formatDate(workOrder.order_date || workOrder.created_at);

const getHeader = (title, workOrder = {}) => `
<header class="header">

    <div>

        ${
          COMPANY.logo
            ? `<img class="logo" src="${COMPANY.logo}" alt="${escapeHtml(
                COMPANY.brand
              )}" />`
            : `<div class="brand-name">${escapeHtml(COMPANY.brand)}</div>`
        }

        <div class="brand-subtitle">
            ${escapeHtml(COMPANY.slogan)}
        </div>

        <div class="company-info">

            ${escapeHtml(COMPANY.address)}
            <br>

            Telefon:
            ${escapeHtml(COMPANY.phone)}

            <br>

            ${escapeHtml(COMPANY.email)}

            ·

            ${escapeHtml(COMPANY.website)}

            ${
              COMPANY.company.cui
                ? `<br>CUI: ${escapeHtml(COMPANY.company.cui)}`
                : ""
            }

            ${
              COMPANY.company.regCom
                ? `<br>Reg. Com.: ${escapeHtml(COMPANY.company.regCom)}`
                : ""
            }

        </div>

    </div>

    <div class="document-title">

        <h1>
            ${escapeHtml(title)}
        </h1>

        <div class="document-number">

            Nr. ${escapeHtml(getOrderNumber(workOrder))}

        </div>

        <div style="margin-top:10px">

            <strong>Data comandă</strong><br>

            ${getOrderDate(workOrder)}

        </div>

        <div style="margin-top:8px">

            <strong>Termen livrare</strong><br>

            ${getDeliveryDate(workOrder)}

        </div>

    </div>

</header>
`;

export default getHeader;
