import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { normalizeStatusKey } from "@/lib/status";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  LifeBuoy,
  Loader2,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Ruler,
  UserRound,
  Users,
  Wrench,
  X,
} from "lucide-react";

const DAYS = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"];
const AUTO_REFRESH_MS = 30_000;

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

/**
 * Evită problemele de fus orar produse de date.toISOString().
 */
function ymd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}


function statusLabel(status) {
  const labels = {
    nou: "Nou",
    programat: "Programat",
    confirmat: "Confirmat",
    reprogramat: "Reprogramat",
    anulat: "Anulat",
    finalizat: "Finalizat",
    in_lucru: "În lucru",
    alocat: "Alocat",
    rezolvat: "Rezolvat",
    inchis: "Închis",
  };

  const normalized = normalizeStatusKey(status);
  return labels[normalized] || String(status || "Programat");
}

function eventClasses(event) {
  const status = normalizeStatusKey(event.status);

  if (status === "anulat") {
    return "bg-slate-100 text-slate-500 border-slate-300 line-through opacity-80";
  }

  if (status === "reprogramat") {
    return "bg-amber-50 text-amber-900 border-amber-300";
  }

  if (status === "finalizat" || status === "rezolvat" || status === "inchis") {
    return "bg-emerald-50 text-emerald-800 border-emerald-300";
  }

  if (status === "confirmat") {
    return "bg-blue-50 text-blue-800 border-blue-300";
  }

  if (event.kind === "m") {
    return "bg-sky-50 text-sky-800 border-sky-200";
  }

  if (event.kind === "i") {
    return "bg-violet-50 text-violet-800 border-violet-200";
  }

  return "bg-orange-50 text-orange-800 border-orange-200";
}

function eventTypeLabel(kind) {
  if (kind === "m") return "Măsurătoare";
  if (kind === "i") return "Montaj";
  return "Service";
}

function eventIcon(kind) {
  if (kind === "m") return Ruler;
  if (kind === "i") return Wrench;
  return LifeBuoy;
}

function safeProducts(products) {
  if (!products) return "—";

  if (Array.isArray(products)) {
    const values = products
      .map((item) => {
        if (typeof item === "string") return item;
        return item?.name || item?.product || "";
      })
      .filter(Boolean);

    return values.length ? values.join(", ") : "—";
  }

  return String(products);
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const [measurements, setMeasurements] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadCalendar = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setLoadError("");

    try {
      const [m, i, t, c, u] = await Promise.all([
        api.get("/measurements"),
        api.get("/installations"),
        api.get("/service-tickets"),
        api.get("/customers"),
        api.get("/users"),
      ]);

      setMeasurements(m.data || []);
      setInstallations(i.data || []);
      setTickets(t.data || []);
      setCustomers(c.data || []);
      setUsers(u.data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Eroare la încărcarea calendarului:", error);
      setLoadError(
        error?.response?.data?.detail ||
          "Calendarul nu a putut fi actualizat. Încearcă din nou."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCalendar();

    const intervalId = window.setInterval(() => {
      loadCalendar({ silent: true });
    }, AUTO_REFRESH_MS);

    const onFocus = () => loadCalendar({ silent: true });
    const onCalendarRefresh = () => loadCalendar({ silent: true });
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadCalendar({ silent: true });
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("calendar:refresh", onCalendarRefresh);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("calendar:refresh", onCalendarRefresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loadCalendar]);

  const customerById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers]
  );

  const userById = useMemo(
    () => new Map(users.map((employee) => [employee.id, employee])),
    [users]
  );

  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const shift = (first.getDay() + 6) % 7;
    const numberOfDays = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      0
    ).getDate();

    const result = [];

    for (let index = 0; index < shift; index += 1) {
      result.push(null);
    }

    for (let day = 1; day <= numberOfDays; day += 1) {
      result.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    }

    while (result.length % 7 !== 0) {
      result.push(null);
    }

    return result;
  }, [cursor]);

  const buildEvent = useCallback(
    (item, kind) => {
      const customer = customerById.get(item.customer_id);
      const assignedIds = [
        ...(Array.isArray(item.assigned_user_ids)
          ? item.assigned_user_ids
          : []),
        ...(item.assigned_to ? [item.assigned_to] : []),
      ].filter(Boolean);

      const uniqueAssignedIds = [...new Set(assignedIds)];
      const assignedEmployees = uniqueAssignedIds
        .map((id) => userById.get(id))
        .filter(Boolean);

      return {
        id: `${kind}${item.id}`,
        sourceId: item.id,
        kind,
        label: customer?.name || "Client necunoscut",
        customer,
        time: item.time || "",
        date: item.date || (item.created_at || "").slice(0, 10),
        status: item.status || "programat",
        address: item.address || customer?.address || "",
        phone: customer?.phone || "",
        products: item.products,
        notes: item.notes || item.observations || item.description || item.problem || "",
        assignedEmployees,
        raw: item,
      };
    },
    [customerById, userById]
  );

  const eventsByDate = useMemo(() => {
    const map = new Map();

    const addEvent = (date, event) => {
      if (!date) return;
      if (!map.has(date)) map.set(date, []);
      map.get(date).push(event);
    };

    measurements.forEach((item) => {
      addEvent(item.date, buildEvent(item, "m"));
    });

    installations.forEach((item) => {
      addEvent(item.date, buildEvent(item, "i"));
    });

    tickets.forEach((item) => {
      const date = item.date || (item.created_at || "").slice(0, 10);
      addEvent(date, buildEvent(item, "s"));
    });

    for (const events of map.values()) {
      events.sort((a, b) => {
        const timeCompare = String(a.time || "").localeCompare(String(b.time || ""));
        if (timeCompare !== 0) return timeCompare;
        return a.label.localeCompare(b.label, "ro");
      });
    }

    return map;
  }, [measurements, installations, tickets, buildEvent]);

  const eventsForDay = (date) => {
    if (!date) return [];
    return eventsByDate.get(ymd(date)) || [];
  };

  const monthLabel = cursor.toLocaleDateString("ro-RO", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-calendar">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">
            Programări
          </div>
          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight capitalize">
            {monthLabel}
          </h1>

          <div className="mt-1 text-xs text-slate-500">
            {lastUpdated
              ? `Actualizat la ${lastUpdated.toLocaleTimeString("ro-RO", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}`
              : "Se încarcă programările..."}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadCalendar({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-aj-line rounded-lg text-sm hover:bg-white disabled:opacity-60"
            title="Actualizează calendarul"
          >
            {refreshing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Actualizează
          </button>

          <button
            type="button"
            onClick={() => setCursor(addMonths(cursor, -1))}
            className="p-2 border border-aj-line rounded-lg hover:bg-white"
            data-testid="cal-prev"
            aria-label="Luna precedentă"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="px-3 py-1.5 border border-aj-line rounded-lg text-sm hover:bg-white"
            data-testid="cal-today"
          >
            Azi
          </button>

          <button
            type="button"
            onClick={() => setCursor(addMonths(cursor, 1))}
            className="p-2 border border-aj-line rounded-lg hover:bg-white"
            data-testid="cal-next"
            aria-label="Luna următoare"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
        <LegendDot color="bg-sky-100 border-sky-300" icon={Ruler} label="Măsurători" />
        <LegendDot color="bg-violet-100 border-violet-300" icon={Wrench} label="Montaje" />
        <LegendDot color="bg-orange-100 border-orange-300" icon={LifeBuoy} label="Service" />
        <LegendDot color="bg-amber-100 border-amber-300" label="Reprogramat" />
        <LegendDot color="bg-emerald-100 border-emerald-300" label="Finalizat" />
        <LegendDot color="bg-slate-100 border-slate-300" label="Anulat" />
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <div className="aj-card overflow-hidden">
        <div className="grid grid-cols-7 bg-aj-cream/60 border-b border-aj-line">
          {DAYS.map((day) => (
            <div
              key={day}
              className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center gap-3 text-slate-500">
            <Loader2 className="animate-spin" size={20} />
            Se încarcă programările...
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((date, index) => {
              const events = eventsForDay(date);
              const isToday = date && ymd(date) === ymd(new Date());

              return (
                <div
                  key={index}
                  className={`min-h-[125px] p-2 border-b border-r border-aj-line ${
                    !date ? "bg-slate-50/50" : "bg-white/30"
                  }`}
                >
                  {date && (
                    <>
                      <div
                        className={`text-xs font-semibold mb-1.5 flex items-center justify-between ${
                          isToday ? "text-aj-gold" : "text-aj-navy"
                        }`}
                      >
                        <span
                          className={
                            isToday
                              ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-aj-gold text-white"
                              : ""
                          }
                        >
                          {date.getDate()}
                        </span>

                        {isToday && (
                          <span className="text-[10px] uppercase tracking-wider">
                            Azi
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {events.slice(0, 5).map((event) => {
                          const Icon = eventIcon(event.kind);
                          const tooltip = [
                            eventTypeLabel(event.kind),
                            event.label,
                            event.time ? `Ora ${event.time}` : "",
                            statusLabel(event.status),
                            event.address,
                            event.assignedEmployees.length
                              ? `Echipă: ${event.assignedEmployees
                                  .map((employee) => employee.name)
                                  .join(", ")}`
                              : "",
                          ]
                            .filter(Boolean)
                            .join("\n");

                          return (
                            <button
                              key={event.id}
                              type="button"
                              onClick={() => setSelectedEvent(event)}
                              title={tooltip}
                              className={`w-full text-left text-[11px] px-2 py-1.5 rounded border transition hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-aj-gold/30 ${eventClasses(
                                event
                              )}`}
                            >
                              <span className="flex items-center gap-1.5 min-w-0">
                                <Icon size={12} className="shrink-0" />

                                {event.time && (
                                  <b className="shrink-0">{event.time}</b>
                                )}

                                <span className="truncate">{event.label}</span>
                              </span>
                            </button>
                          );
                        })}

                        {events.length > 5 && (
                          <div className="text-[10px] text-slate-500 px-1">
                            +{events.length - 5} programări
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

function EventDetailsModal({ event, onClose }) {
  const Icon = eventIcon(event.kind);
  const employeesText = event.assignedEmployees.length
    ? event.assignedEmployees.map((employee) => employee.name).join(", ")
    : "Nealocat";

  useEffect(() => {
    const onKeyDown = (keyboardEvent) => {
      if (keyboardEvent.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-aj-navy/55 p-4"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-aj-line px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-aj-cream p-2.5 text-aj-navy">
              <Icon size={20} />
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-aj-navy/55">
                {eventTypeLabel(event.kind)}
              </div>
              <h2 className="text-xl font-extrabold text-aj-navy">
                {event.label}
              </h2>
              <span
                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${eventClasses(
                  event
                )}`}
              >
                {statusLabel(event.status)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-aj-navy"
            aria-label="Închide"
          >
            <X size={19} />
          </button>
        </div>

        <div className="grid gap-3 px-5 py-5 sm:grid-cols-2">
          <DetailItem
            icon={CalendarDays}
            label="Data"
            value={event.date || "—"}
          />
          <DetailItem icon={Clock} label="Ora" value={event.time || "—"} />
          <DetailItem
            icon={Phone}
            label="Telefon client"
            value={event.phone || "—"}
          />
          <DetailItem
            icon={Users}
            label="Echipă"
            value={employeesText}
          />
          <DetailItem
            icon={MapPin}
            label="Adresă"
            value={event.address || "—"}
            wide
          />
          <DetailItem
            icon={Package}
            label="Produse"
            value={safeProducts(event.products)}
            wide
          />
          <DetailItem
            icon={UserRound}
            label="Observații"
            value={event.notes || "—"}
            wide
          />
        </div>

        <div className="flex justify-end border-t border-aj-line bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-aj-line bg-white px-4 py-2 text-sm font-semibold text-aj-navy hover:bg-aj-cream"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, wide = false }) {
  return (
    <div
      className={`rounded-xl border border-aj-line bg-slate-50/60 p-3 ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon size={14} />
        {label}
      </div>
      <div className="whitespace-pre-wrap break-words text-sm font-medium text-aj-navy">
        {value}
      </div>
    </div>
  );
}

function LegendDot({ color, icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-4 w-4 rounded border ${color}`} />
      {Icon && <Icon size={14} />}
      <span>{label}</span>
    </div>
  );
}
