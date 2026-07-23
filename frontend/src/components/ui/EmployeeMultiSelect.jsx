import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, Users, X } from "lucide-react";

export default function EmployeeMultiSelect({
  employees = [],
  value = [],
  onChange,
  placeholder = "— nealocat —",
  compact = false,
  disabled = false,
  testId,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  const selectedIds = Array.isArray(value) ? value.filter(Boolean) : [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return employees;
    }

    return employees.filter((employee) =>
      [employee.name, employee.email, employee.phone]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalizedQuery))
    );
  }, [employees, query]);

  const selectedEmployees = useMemo(
    () => employees.filter((employee) => selectedIds.includes(employee.id)),
    [employees, selectedIds]
  );

  const toggleEmployee = (employeeId) => {
    const nextValue = selectedIds.includes(employeeId)
      ? selectedIds.filter((id) => id !== employeeId)
      : [...selectedIds, employeeId];

    onChange(nextValue);
  };

  const clearSelection = (event) => {
    event.stopPropagation();
    onChange([]);
  };

  const label =
    selectedEmployees.length === 0
      ? placeholder
      : selectedEmployees.length === 1
        ? selectedEmployees[0].name
        : `${selectedEmployees.length} tehnicieni`;

  return (
    <div ref={rootRef} className="relative" data-testid={testId}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`w-full border border-aj-line bg-white text-left flex items-center justify-between gap-2 transition hover:border-aj-navy/40 disabled:opacity-60 disabled:cursor-not-allowed ${
          compact
            ? "min-w-[170px] max-w-[220px] rounded px-2 py-1 text-xs"
            : "rounded-lg px-3 py-2.5 text-sm"
        }`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Users size={compact ? 13 : 15} className="text-aj-gold shrink-0" />
          <span
            className={`truncate ${
              selectedEmployees.length ? "text-aj-navy font-medium" : "text-slate-500"
            }`}
          >
            {label}
          </span>
        </span>

        <span className="flex items-center gap-1 shrink-0">
          {selectedEmployees.length > 0 && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={clearSelection}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  clearSelection(event);
                }
              }}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-400"
              aria-label="Șterge alocarea"
            >
              <X size={compact ? 12 : 14} />
            </span>
          )}
          <ChevronDown
            size={compact ? 13 : 15}
            className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full min-w-[260px] rounded-xl border border-aj-line bg-white shadow-xl overflow-hidden">
          <div className="p-2 border-b border-aj-line bg-aj-cream/30">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Caută tehnician..."
                className="w-full rounded-lg border border-aj-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-aj-navy/40"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {filteredEmployees.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-slate-400">
                Niciun tehnician găsit.
              </div>
            ) : (
              filteredEmployees.map((employee) => {
                const checked = selectedIds.includes(employee.id);

                return (
                  <button
                    type="button"
                    key={employee.id}
                    onClick={() => toggleEmployee(employee.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                      checked ? "bg-aj-navy/5" : "hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                        checked
                          ? "bg-aj-navy border-aj-navy text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {checked && <Check size={13} />}
                    </span>

                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-aj-navy truncate">
                        {employee.name}
                      </span>
                      {employee.phone && (
                        <span className="block text-xs text-slate-500 truncate">
                          {employee.phone}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-aj-line bg-aj-cream/30 px-3 py-2">
            <span className="text-xs text-slate-500">
              {selectedEmployees.length === 0
                ? "Niciun tehnician selectat"
                : `${selectedEmployees.length} selectat${selectedEmployees.length === 1 ? "" : "i"}`}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-aj-navy hover:underline"
            >
              Gata
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
