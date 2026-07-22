import React, { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { Field, TextInput, TextArea } from "./_Modal";
import {
  Save,
  AlertTriangle,
  Trash2,
  Loader2,
} from "lucide-react";

export default function AdminSettings() {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);

  const [resetConfirmation, setResetConfirmation] = useState("");
  const [resetting, setResetting] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/settings");
      setS(data);
    } catch (err) {
      console.error("Eroare la încărcarea setărilor:", err);

      toast.error(
        formatApiError(
          err?.response?.data?.detail,
          "Nu am putut încărca setările."
        )
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!s) {
    return (
      <div className="text-slate-400 text-sm">
        Se încarcă setările…
      </div>
    );
  }

  const save = async () => {
    setSaving(true);

    try {
      await api.put("/settings", s);
      toast.success("Setări salvate");
      await load();
    } catch (err) {
      console.error("Eroare la salvarea setărilor:", err);

      toast.error(
        formatApiError(
          err?.response?.data?.detail,
          "Eroare la salvare."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const resetDemoData = async () => {
    if (resetConfirmation !== "RESET") {
      toast.error('Introdu exact textul "RESET" pentru confirmare.');
      return;
    }

    const accepted = window.confirm(
      "Ești sigur că vrei să ștergi toate datele din aplicație?\n\n" +
        "Vor fi șterși clienții, angajații, măsurătorile, montajele, " +
        "lucrările, producția, garanțiile și celelalte date operaționale.\n\n" +
        "Contul tău Super Admin și setările firmei vor fi păstrate."
    );

    if (!accepted) {
      return;
    }

    setResetting(true);

    try {
      const { data } = await api.post(
        "/settings/reset-demo-data",
        {
          confirmation: resetConfirmation,
        }
      );

      const deleted = data?.deleted || {};

      const totalDeleted = Object.values(deleted).reduce(
        (total, value) => total + Number(value || 0),
        0
      );

      setResetConfirmation("");

      toast.success(
        `${data?.message || "Datele demo au fost șterse."} ` +
          `${totalDeleted} înregistrări eliminate.`
      );
    } catch (err) {
      console.error("Eroare la resetarea datelor demo:", err);

      toast.error(
        formatApiError(
          err?.response?.data?.detail,
          "Nu am putut reseta datele demo."
        )
      );
    } finally {
      setResetting(false);
    }
  };

  const setT = (key, value) => {
    setS({
      ...s,
      templates: {
        ...s.templates,
        [key]: value,
      },
    });
  };

  return (
    <div
      className="space-y-6 animate-fade-in max-w-4xl"
      data-testid="page-settings"
    >
      <div>
        <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">
          Configurare
        </div>

        <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">
          Setări
        </h1>
      </div>

      <div className="aj-card p-6 space-y-4">
        <h3 className="text-lg font-bold text-aj-navy border-b border-aj-line pb-3 mb-3">
          Date firmă
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nume firmă">
            <TextInput
              value={s.company_name || ""}
              onChange={(event) =>
                setS({
                  ...s,
                  company_name: event.target.value,
                })
              }
            />
          </Field>

          <Field label="Telefon firmă">
            <TextInput
              value={s.company_phone || ""}
              onChange={(event) =>
                setS({
                  ...s,
                  company_phone: event.target.value,
                })
              }
            />
          </Field>

          <Field label="Email firmă">
            <TextInput
              value={s.company_email || ""}
              onChange={(event) =>
                setS({
                  ...s,
                  company_email: event.target.value,
                })
              }
            />
          </Field>

          <Field label="WhatsApp firmă">
            <TextInput
              value={s.whatsapp_number || ""}
              onChange={(event) =>
                setS({
                  ...s,
                  whatsapp_number: event.target.value,
                })
              }
            />
          </Field>

          <Field label="Adresă showroom" wide>
            <TextInput
              value={s.company_address || ""}
              onChange={(event) =>
                setS({
                  ...s,
                  company_address: event.target.value,
                })
              }
            />
          </Field>

          <Field label="Program lucru" wide>
            <TextInput
              value={s.working_hours || ""}
              onChange={(event) =>
                setS({
                  ...s,
                  working_hours: event.target.value,
                })
              }
            />
          </Field>

          <Field label="Durată implicită garanție (luni)">
            <TextInput
              type="number"
              value={s.default_warranty_months || 24}
              onChange={(event) =>
                setS({
                  ...s,
                  default_warranty_months: Number(
                    event.target.value
                  ),
                })
              }
            />
          </Field>

          <Field label="Link Google Review">
            <TextInput
              value={s.google_review_link || ""}
              onChange={(event) =>
                setS({
                  ...s,
                  google_review_link: event.target.value,
                })
              }
            />
          </Field>
        </div>
      </div>

      <div className="aj-card p-6 space-y-4">
        <h3 className="text-lg font-bold text-aj-navy border-b border-aj-line pb-3 mb-3">
          Program Recomandare
        </h3>

        <p className="text-xs text-slate-500 mb-2">
          Configurează discountul afișat prietenilor recomandați
          și textul mesajului de share.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Discount recomandare (afișat prietenului)">
            <TextInput
              value={s.referral_discount || "10%"}
              onChange={(event) =>
                setS({
                  ...s,
                  referral_discount: event.target.value,
                })
              }
              placeholder="10% sau 200 lei"
              data-testid="setting-referral-discount"
            />
          </Field>

          <Field label="Program activ">
            <select
              value={String(s.referral_enabled !== false)}
              onChange={(event) =>
                setS({
                  ...s,
                  referral_enabled:
                    event.target.value === "true",
                })
              }
              className="aj-input"
              data-testid="setting-referral-enabled"
            >
              <option value="true">Da</option>
              <option value="false">Nu</option>
            </select>
          </Field>
        </div>

        <p className="text-xs text-slate-500 mt-3">
          Discount-ul <b>NU</b> se acordă automat. Adminul
          confirmă manual la crearea ofertei.
        </p>
      </div>

      <div className="aj-card p-6 space-y-4">
        <h3 className="text-lg font-bold text-aj-navy border-b border-aj-line pb-3 mb-3">
          Template-uri mesaje
        </h3>

        <p className="text-xs text-slate-500 mb-4">
          Variabile disponibile:{" "}
          <span className="font-mono">
            {
              "{clientName}, {clientPhone}, {address}, {date}, {time}, {products}"
            }
          </span>
          . Pentru <b>referral_share</b>:{" "}
          <span className="font-mono">
            {"{link}, {discount}"}
          </span>
          .
        </p>

        {Object.entries(s.templates || {}).map(([key, value]) => (
          <Field
            label={key.replaceAll("_", " ")}
            key={key}
            wide
          >
            <TextArea
              rows={3}
              value={value}
              onChange={(event) =>
                setT(key, event.target.value)
              }
              data-testid={`template-${key}`}
            />
          </Field>
        ))}
      </div>

      <div className="aj-card overflow-hidden border border-red-200">
        <div className="flex items-start gap-3 bg-red-50 px-6 py-5 border-b border-red-200">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle
              size={20}
              className="text-red-600"
            />
          </div>

          <div>
            <h3 className="text-lg font-bold text-red-800">
              Zonă periculoasă
            </h3>

            <p className="text-sm text-red-700 mt-1">
              Această operație șterge definitiv datele demo și
              datele operaționale existente.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h4 className="font-bold text-slate-800">
              Reset Demo Data
            </h4>

            <p className="text-sm text-slate-500 mt-1">
              Vor fi șterși toți clienții, angajații,
              leadurile, măsurătorile, montajele, comenzile,
              producția, garanțiile, tichetele și notificările.
            </p>

            <p className="text-sm font-semibold text-slate-700 mt-2">
              Contul Super Admin autentificat și setările firmei
              vor fi păstrate.
            </p>
          </div>

          <div className="max-w-md">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Introdu RESET pentru confirmare
            </label>

            <TextInput
              value={resetConfirmation}
              onChange={(event) =>
                setResetConfirmation(event.target.value)
              }
              placeholder="RESET"
              autoComplete="off"
              disabled={resetting}
              data-testid="reset-demo-confirmation"
            />
          </div>

          <button
            type="button"
            onClick={resetDemoData}
            disabled={
              resetting || resetConfirmation !== "RESET"
            }
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            data-testid="btn-reset-demo-data"
          >
            {resetting ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Se șterg datele…
              </>
            ) : (
              <>
                <Trash2 size={17} />
                Șterge toate datele demo
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="aj-btn-gold px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-60"
          data-testid="btn-save-settings"
        >
          {saving ? (
            <Loader2
              size={16}
              className="animate-spin"
            />
          ) : (
            <Save size={16} />
          )}

          {saving ? "Se salvează…" : "Salvează setările"}
        </button>
      </div>
    </div>
  );
}
