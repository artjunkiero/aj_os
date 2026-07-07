import React, { useState, useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/status";
import {
  LayoutDashboard, Users, UserCog, Ruler, Wrench, ClipboardList, Factory,
  CalendarDays, ShieldCheck, LifeBuoy, Bell, BarChart3, Settings,
  LogOut, Sparkles, Target, Gift,
} from "lucide-react";

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, tid: "nav-dashboard" },
  { to: "/admin/clienti", label: "Clienți", icon: Users, tid: "nav-clients" },
  { to: "/admin/leaduri", label: "Lead-uri", icon: Target, tid: "nav-leads" },
  { to: "/admin/masuratori", label: "Măsurători", icon: Ruler, tid: "nav-measurements" },
  { to: "/admin/montaj", label: "Montaje", icon: Wrench, tid: "nav-installations" },
  { to: "/admin/lucrari", label: "Lucrări", icon: ClipboardList, tid: "nav-work-orders" },
  { to: "/admin/productie", label: "Producție", icon: Factory, tid: "nav-production" },
  { to: "/admin/calendar", label: "Calendar", icon: CalendarDays, tid: "nav-calendar" },
  { to: "/admin/garantii", label: "Garanții", icon: ShieldCheck, tid: "nav-warranties" },
  { to: "/admin/service", label: "Service", icon: LifeBuoy, tid: "nav-service" },
  { to: "/admin/recomandari", label: "Recomandări", icon: Gift, tid: "nav-referrals" },
  { to: "/admin/angajati", label: "Angajați", icon: UserCog, tid: "nav-employees" },
  { to: "/admin/notificari", label: "Notificări", icon: Bell, tid: "nav-notifications" },
  { to: "/admin/rapoarte", label: "Rapoarte", icon: BarChart3, tid: "nav-reports" },
  { to: "/admin/setari", label: "Setări", icon: Settings, tid: "nav-settings" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const initials = useMemo(() => {
    const s = (user?.name || "").trim();
    if (!s) return "AJ";
    return s.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
  }, [user]);

  const doLogout = async () => {
    await logout();
    nav("/admin/login");
  };

  return (
    <div className="min-h-screen bg-aj-cream text-aj-black flex" data-testid="admin-shell">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-40 h-screen w-64 aj-sidebar flex-shrink-0 transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        data-testid="admin-sidebar"
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-aj-gold text-aj-navy font-black flex items-center justify-center">AJ</div>
            <div>
              <div className="font-extrabold tracking-tight text-white leading-none">ART JUNKIE</div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-aj-gold mt-1">Sistem OS</div>
            </div>
          </div>
        </div>

        <nav className="py-3 overflow-y-auto max-h-[calc(100vh-14rem)]">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={n.tid}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm font-medium ${isActive ? "active" : ""}`
              }
            >
              <n.icon size={17} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-aj-gold text-aj-navy font-bold flex items-center justify-center text-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-semibold truncate">{user?.name}</div>
              <div className="text-white/60 text-[11px] truncate">{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
          </div>
          <button
            data-testid="logout-btn"
            onClick={doLogout}
            className="w-full flex items-center justify-center gap-2 text-white/80 hover:text-aj-gold text-sm py-2 rounded-md hover:bg-white/5"
          >
            <LogOut size={15} /> Deconectare
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-aj-cream/85 backdrop-blur border-b border-aj-line">
          <div className="flex items-center justify-between px-5 lg:px-8 py-3">
            <button
              className="lg:hidden text-aj-navy p-2 -ml-2"
              onClick={() => setOpen(true)}
              data-testid="menu-toggle"
              aria-label="Meniu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <div className="text-xs uppercase tracking-[0.25em] text-aj-navy/60 flex items-center gap-2">
              <Sparkles size={12} className="text-aj-gold" />
              Consolă ART JUNKIE
            </div>
            <div className="text-sm text-aj-navy font-semibold">{new Date().toLocaleDateString("ro-RO", { weekday: "long", day: "2-digit", month: "long" })}</div>
          </div>
        </header>
        <div className="p-5 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
