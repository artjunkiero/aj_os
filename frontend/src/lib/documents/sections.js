import COMPANY from "./company";
import { escapeHtml, formatMoney } from "./helpers";

export const getNotesSection = ({
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

export const getSignaturesSection = ({
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

export const getFooter = (text = COMPANY.footer) => `
  <div class="footer">
    ${escapeHtml(text)}
  </div>
`;

export const getTotalsSection = (workOrder = {}) => {
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
