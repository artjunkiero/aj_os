const COMPANY = {
  // Identitate
  brand: "ART JUNKIE",
  legalName: "ART JUNKIE SRL",
  slogan: "Povestea casei tale începe cu noi",

  // Contact
  address: "Calea Chișinăului 29, Iași",
  phone: "0737 334 097",
  email: "office@artjunkie.ro",
  website: "https://artjunkie.ro",

  // Branding
logo: "/logo_artjunkie.png", // vom adăuga logo-ul ulterior
  favicon: "/favicon.ico",

  colors: {
    primary: "#13233A",
    secondary: "#B99652",
    background: "#FFFFFF",
    text: "#2D3748",
    border: "#D9DEE5",
  },

  // Portal client
  portal: {
    baseUrl: "https://portal.artjunkie.ro/order/",
  },

  // Social
  social: {
    facebook: "https://facebook.com/decojunkie",
    instagram: "",
    youtube: "",
  },

  // Date firmă
  company: {
    cui: "",
    regCom: "",
    iban: "",
    bank: "",
    capital: "",
  },

  // Documente
  documents: {
    prefix: "AJ",
    currency: "RON",
    locale: "ro-RO",
  },

  // Footer implicit
  footer:
    "Document generat automat de ART JUNKIE OS. Reproducerea sau modificarea acestuia fără acordul ART JUNKIE este interzisă.",

  // Garanție implicită
  warranty: {
    months: 24,
  },
};

export default COMPANY;
