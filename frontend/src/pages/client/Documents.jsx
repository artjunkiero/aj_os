import React from "react";
import { FileText } from "lucide-react";

export default function ClientDocuments() {
  return (
    <div className="space-y-4 animate-fade-in" data-testid="client-documents">
      <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight flex items-center gap-2"><FileText className="text-aj-gold" /> Documente</h1>
      <div className="aj-card p-10 text-center">
        <FileText className="w-12 h-12 text-aj-gold mx-auto mb-3" />
        <h3 className="font-bold text-aj-navy">Documente în curând</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Vei putea descărca ofertele, contractele, facturile și certificatele de garanție direct din portal.</p>
      </div>
    </div>
  );
}
