import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, Package, ShieldCheck, LifeBuoy, FileText, MessageSquare, LogOut } from "lucide-react";

const NAV = [
  { to: "/client", end: true, label: "Prezentare", icon: LayoutDashboard, tid: "client-nav-home" },
  { to: "/client/comenzi", label: "Comenzi", icon: Package, tid: "client-nav-orders" },
  { to: "/client/garantii", label: "Garanții", icon: ShieldCheck, tid: "client-nav-warranties" },
  { to: "/client/service", label: "Service", icon: LifeBuoy, tid: "client-nav-service" },
  { to: "/client/documente", label: "Documente", icon: FileText, tid: "client-nav-docs" },
  { to: "/client/mesaje", label: "Mesaje", icon: MessageSquare, tid: "client-nav-messages" },
];

export default function ClientLayout() {
  const { client, clientLogout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-aj-cream" data-testid="client-shell">
      <header className="bg-white border-b border-aj-line">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-aj-navy text-aj-gold font-black flex items-center justify-center">AJ</div>
            <div>
              <div className="font-extrabold tracking-tight text-aj-navy leading-none">ART JUNKIE</div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-aj-gold">Portal client</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-aj-navy">{client?.name}</div>
              <div className="text-xs text-slate-500">{client?.phone}</div>
            </div>
            <button onClick={async () => { await clientLogout(); nav("/client/login"); }}
              className="text-slate-500 hover:text-aj-navy" data-testid="client-logout"><LogOut size={18} /></button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} data-testid={n.tid}
              className={({ isActive }) => `px-3 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px flex items-center gap-1.5 ${
                isActive ? "text-aj-navy border-aj-gold" : "text-slate-500 hover:text-aj-navy border-transparent"
              }`}
            >
              <n.icon size={15} /> {n.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}
