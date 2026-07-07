import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatDateTime } from "@/lib/status";
import { MessageSquare, Send } from "lucide-react";

export default function ClientMessages() {
  const [rows, setRows] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  const load = async () => {
    const { data } = await api.get("/client/messages"); setRows(data || []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  useEffect(() => { load(); }, []);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api.post("/client/messages", { body: text.trim() });
      setText(""); load();
    } catch { toast.error("Eroare"); }
  };

  return (
    <div className="space-y-4 animate-fade-in" data-testid="client-messages">
      <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight flex items-center gap-2"><MessageSquare className="text-aj-gold" /> Mesaje</h1>

      <div className="aj-card flex flex-col h-[65vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {rows.length === 0 && <div className="text-sm text-slate-400 text-center py-10">Nu ai mesaje. Scrie-ne mai jos.</div>}
          {rows.map(m => (
            <div key={m.id} className={`flex ${m.from_role === "client" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
                m.from_role === "client" ? "bg-aj-navy text-white rounded-br-sm" : "bg-aj-cream text-aj-navy rounded-bl-sm border border-aj-line"
              }`}>
                {m.body}
                <div className={`text-[10px] mt-1 ${m.from_role === "client" ? "text-white/50" : "text-slate-400"}`}>{formatDateTime(m.created_at)}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} className="p-3 border-t border-aj-line flex gap-2">
          <input data-testid="client-msg-input" className="aj-input flex-1" value={text} onChange={(e) => setText(e.target.value)} placeholder="Scrie un mesaj…" />
          <button type="submit" className="aj-btn-navy px-4 rounded-lg flex items-center gap-1 text-sm" data-testid="client-msg-send"><Send size={14} /> Trimite</button>
        </form>
      </div>
    </div>
  );
}
