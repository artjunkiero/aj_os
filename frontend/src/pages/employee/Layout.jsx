import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/status";
import { Home, Ruler, Wrench, LifeBuoy, LogOut, CalendarDays } from "lucide-react";

const NAV = [
  { to: "/app/azi", label: "Azi", icon: CalendarDays, tid: "emp-nav-today" },
  { to: "/app/masuratori", label: "Măsurători", icon: Ruler, tid: "emp-nav-measurements" },
  { to: "/app/montaje", label: "Montaje", icon: Wrench, tid: "emp-nav-installations" },
  { to: "/app/service", label: "Service", icon: LifeBuoy, tid: "emp-nav-service" },
];

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="aj-employee-shell pb-24 min-h-screen" data-testid="employee-shell">
      <header className="sticky top-0 z-20 bg-aj-navy border-b border-white/10">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-aj-gold text-aj-navy font-black flex items-center justify-center">AJ</div>
            <div>
              <div className="text-white font-extrabold tracking-tight leading-none">ART JUNKIE</div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-aj-gold">Echipă</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white text-sm font-semibold">{user?.name?.split(" ")[0]}</div>
            <div className="text-white/60 text-[11px]">{ROLE_LABELS[user?.role]}</div>
          </div>
        </div>
      </header>

      <main className="p-4 pt-6 max-w-2xl mx-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-aj-navy border-t border-white/10 flex items-stretch z-30" data-testid="employee-bottom-nav">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} data-testid={n.tid}
            className={({ isActive }) => `flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive ? "text-aj-gold" : "text-white/60 hover:text-white"
            }`}
          >
            <n.icon size={20} />
            <span>{n.label}</span>
          </NavLink>
        ))}
        <button onClick={async () => { await logout(); nav("/app/login"); }} data-testid="emp-logout"
          className="flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-white/60 hover:text-white">
          <LogOut size={20} />
          <span>Ieșire</span>
        </button>
      </nav>
    </div>
  );
}
