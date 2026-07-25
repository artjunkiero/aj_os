import { escapeHtml, getCustomerValue } from "./helpers";

const getCustomerSection = (customer = {}) => `
  <section class="section">
    <div class="section-title">
      Date client
    </div>

    <div class="info-grid">
      <div class="info-item">
        <strong>Client</strong>

        ${escapeHtml(
          getCustomerValue(
            customer,
            "name",
            "full_name",
            "company_name"
          )
        )}
      </div>

      <div class="info-item">
        <strong>Telefon</strong>

        ${escapeHtml(
          getCustomerValue(
            customer,
            "phone",
            "telephone",
            "mobile"
          )
        )}
      </div>

      <div class="info-item">
        <strong>E-mail</strong>

        ${escapeHtml(
          getCustomerValue(
            customer,
            "email"
          )
        )}
      </div>

      <div class="info-item">
        <strong>Adresă montaj</strong>

        ${escapeHtml(
          getCustomerValue(
            customer,
            "installation_address",
            "address",
            "billing_address"
          )
        )}
      </div>

      ${
        customer?.cui ||
        customer?.tax_id ||
        customer?.vat_number
          ? `
            <div class="info-item">
              <strong>CUI / CIF</strong>

              ${escapeHtml(
                getCustomerValue(
                  customer,
                  "cui",
                  "tax_id",
                  "vat_number"
                )
              )}
            </div>
          `
          : ""
      }

      ${
        customer?.reg_com ||
        customer?.regCom ||
        customer?.registration_number
          ? `
            <div class="info-item">
              <strong>Nr. Registrul Comerțului</strong>

              ${escapeHtml(
                getCustomerValue(
                  customer,
                  "reg_com",
                  "regCom",
                  "registration_number"
                )
              )}
            </div>
          `
          : ""
      }

      ${
        customer?.contact_person
          ? `
            <div class="info-item">
              <strong>Persoană de contact</strong>

              ${escapeHtml(customer.contact_person)}
            </div>
          `
          : ""
      }

      ${
        customer?.billing_address &&
        customer.billing_address !== customer.installation_address
          ? `
            <div class="info-item">
              <strong>Adresă facturare</strong>

              ${escapeHtml(customer.billing_address)}
            </div>
          `
          : ""
      }
    </div>
  </section>
`;

export default getCustomerSection;
