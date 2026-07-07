import React, { useState } from "react";
import { X } from "lucide-react";

/** Simple modal component used across admin pages. */
export default function Modal({ open, onClose, title, children, wide, testId }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aj-navy/50 backdrop-blur-sm" data-testid={testId || "modal"}>
      <div className={`bg-white rounded-xl shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-hidden flex flex-col animate-fade-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-aj-line">
          <h3 className="text-lg font-bold text-aj-navy">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-aj-navy" data-testid="modal-close" aria-label="Închide">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, wide }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <label className="block text-xs font-semibold text-aj-navy uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function TextInput(props) {
  return <input {...props} className={`aj-input ${props.className || ""}`} />;
}

export function TextArea(props) {
  return <textarea {...props} className={`aj-input min-h-[80px] ${props.className || ""}`} />;
}

export function Select({ options, ...props }) {
  return (
    <select {...props} className={`aj-input ${props.className || ""}`}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function useToggle(initial = false) {
  const [v, setV] = useState(initial);
  return [v, () => setV((x) => !x), () => setV(true), () => setV(false)];
}
