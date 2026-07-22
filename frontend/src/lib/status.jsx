// Status labels and colors for ART JUNKIE OS

export const CUSTOMER_STATUS = {
  nou: { label: "Nou", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  activ: { label: "Activ", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ofertat: { label: "Ofertat", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  comanda_activa: { label: "Comandă activă", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  finalizat: { label: "Finalizat", cls: "bg-slate-100 text-slate-700 border-slate-200" },
  inactiv: { label: "Inactiv", cls: "bg-gray-100 text-gray-500 border-gray-200" },
  arhivat: { label: "Arhivat", cls: "bg-slate-200 text-slate-600 border-slate-300" },
};

export const LEAD_STATUS = {
  nou: { label: "Nou", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  contactat: { label: "Contactat", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  programat: { label: "Programat măs.", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  ofertat: { label: "Ofertat", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  pierdut: { label: "Pierdut", cls: "bg-red-50 text-red-700 border-red-200" },
  castigat: { label: "Câștigat", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export const MEASUREMENT_STATUS = {
  noua: { label: "Nouă", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  alocata: { label: "Alocată", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  notificata: { label: "Notificată", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  in_drum: { label: "În drum", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  ajuns: { label: "Ajuns", cls: "bg-pink-50 text-pink-700 border-pink-200" },
  masurata: { label: "Măsurată", cls: "bg-lime-50 text-lime-700 border-lime-200" },
  oferta_de_facut: { label: "Ofertă de făcut", cls: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  problema: { label: "Problemă", cls: "bg-red-50 text-red-700 border-red-200" },
  anulata: { label: "Anulată", cls: "bg-gray-100 text-gray-500 border-gray-200" },
  reprogramata: { label: "Reprogramată", cls: "bg-orange-50 text-orange-700 border-orange-200" },
};

export const INSTALLATION_STATUS = {
  nou: { label: "Nou", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  alocat: { label: "Alocat", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  notificat: { label: "Notificat", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  pregatit: { label: "Pregătit", cls: "bg-teal-50 text-teal-700 border-teal-200" },
  in_drum: { label: "În drum", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  ajuns: { label: "Ajuns", cls: "bg-pink-50 text-pink-700 border-pink-200" },
  in_montaj: { label: "În montaj", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  finalizat: { label: "Finalizat", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  problema: { label: "Problemă", cls: "bg-red-50 text-red-700 border-red-200" },
  reprogramat: { label: "Reprogramat", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  anulat: { label: "Anulat", cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

export const WORK_ORDER_STATUS = {
  lead: { label: "Lead", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  masuratoare_programata: { label: "Măs. programată", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  masurat: { label: "Măsurat", cls: "bg-lime-50 text-lime-700 border-lime-200" },
  oferta_de_facut: { label: "Ofertă de făcut", cls: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  ofertat: { label: "Ofertat", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  acceptat: { label: "Acceptat", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  avans_platit: { label: "Avans plătit", cls: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  in_productie: { label: "În producție", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  gata_de_montaj: { label: "Gata de montaj", cls: "bg-teal-50 text-teal-700 border-teal-200" },
  montaj_programat: { label: "Montaj programat", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  in_montaj: { label: "În montaj", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  montat: { label: "Montat", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  finalizat: { label: "Finalizat", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  garantie_activa: { label: "Garanție activă", cls: "bg-lime-50 text-lime-700 border-lime-200" },
  inchis: { label: "Închis", cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

export const PRODUCTION_STATUS = {
  nou: { label: "Nou", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  in_lucru: { label: "În lucru", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  in_asteptare_material: { label: "În așteptare material", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  finalizat: { label: "Finalizat", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  gata_de_montaj: { label: "Gata de montaj", cls: "bg-teal-50 text-teal-700 border-teal-200" },
};

export const WARRANTY_STATUS = {
  activa: { label: "Activă", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  expirata: { label: "Expirată", cls: "bg-gray-100 text-gray-500 border-gray-200" },
  interventie_deschisa: { label: "Intervenție deschisă", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  rezolvata: { label: "Rezolvată", cls: "bg-blue-50 text-blue-700 border-blue-200" },
};

export const SERVICE_STATUS = {
  noua: { label: "Nouă", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  alocata: { label: "Alocată", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  in_lucru: { label: "În lucru", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  rezolvata: { label: "Rezolvată", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  respinsa: { label: "Respinsă", cls: "bg-red-50 text-red-700 border-red-200" },
  contra_cost: { label: "Contra cost", cls: "bg-yellow-50 text-yellow-800 border-yellow-200" },
};

export const REFERRAL_STATUS = {
  trimisa: { label: "Trimisă", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  lead_creata: { label: "Lead creat", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  ofertat: { label: "Ofertat", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  castigat: { label: "Câștigat", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pierdut: { label: "Pierdut", cls: "bg-red-50 text-red-700 border-red-200" },
};

export const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin / Showroom",
  sales: "Consilier vânzări",
  measurement: "Măsurători",
  installer: "Montator",
  service: "Service",
  client: "Client",
};

export function Badge({ map, value, testId }) {
  const s = (map && map[value]) || { label: value || "-", cls: "bg-slate-100 text-slate-700 border-slate-200" };
  return <span data-testid={testId} className={`aj-badge ${s.cls}`}>{s.label}</span>;
}

export function formatDate(d) {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

export function formatDateTime(d) {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleString("ro-RO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return d; }
}
