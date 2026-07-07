import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Badge, REFERRAL_STATUS, formatDate } from "@/lib/status";
import { Gift, Copy, Share2, MessageCircle, Lock, Sparkles } from "lucide-react";

export default function ClientReferrals() {
  const [info, setInfo] = useState(null);
  const [rows, setRows] = useState([]);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    const [i, r] = await Promise.all([api.get("/client/referral"), api.get("/client/referrals")]);
    setInfo(i.data); setRows(r.data || []);
  };
  useEffect(() => { load(); }, []);

  if (!info) return <div className="text-slate-400 text-sm">Se încarcă…</div>;

  const shareLink = `${window.location.origin}/refer/${info.code}`;
  const message = (info.whatsapp_template || "")
    .replace("{link}", shareLink)
    .replace("{discount}", info.discount || "10%");

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true); toast.success("Link copiat");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("Nu am putut copia"); }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Mesaj copiat");
    } catch { toast.error("Nu am putut copia"); }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "ART JUNKIE", text: message, url: shareLink }); }
      catch { /* user dismissed */ }
    } else {
      copyLink();
    }
  };

  if (!info.eligible) {
    return (
      <div className="space-y-4 animate-fade-in max-w-2xl" data-testid="client-referrals-locked">
        <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight flex items-center gap-2">
          <Gift className="text-aj-gold" /> Recomandă un prieten
        </h1>
        <div className="aj-card p-10 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-aj-cream text-aj-navy flex items-center justify-center border border-aj-line">
            <Lock size={24} />
          </div>
          <h3 className="font-bold text-aj-navy">Disponibil după prima ta comandă</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Programul de recomandare se activează automat imediat ce ai o garanție ART JUNKIE activă.
            Îți vom trimite un cod personalizat și un discount pentru fiecare prieten pe care îl aduci.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="client-referrals">
      <div>
        <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1 flex items-center gap-2">
          <Sparkles size={12} className="text-aj-gold" /> Program VIP
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-aj-navy tracking-tight flex items-center gap-3">
          <Gift className="text-aj-gold" /> Recomandă ART JUNKIE
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Trimite linkul tău personalizat prietenilor. Ei primesc <b className="text-aj-navy">{info.discount} discount</b> la
          prima comandă, iar tu ești răsplătit de fiecare dată când o recomandare devine client.
        </p>
      </div>

      {/* Referral code hero card */}
      <div className="relative overflow-hidden rounded-2xl bg-aj-navy text-white p-8" data-testid="referral-code-card">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-aj-gold/10" />
        <div className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full bg-aj-gold/5" />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.35em] text-aj-gold mb-3">Codul tău</div>
          <div className="font-black text-5xl sm:text-6xl tracking-[0.15em] text-white" data-testid="referral-code">{info.code}</div>
          <div className="mt-4 text-white/70 text-sm break-all font-mono">{shareLink}</div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={copyLink} className="aj-btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm" data-testid="btn-copy-link">
              <Copy size={14} /> {copied ? "Copiat!" : "Copiază linkul"}
            </button>
            <a href={whatsappUrl} target="_blank" rel="noreferrer"
               className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold" data-testid="btn-share-whatsapp">
              <MessageCircle size={14} /> Trimite pe WhatsApp
            </a>
            <button onClick={nativeShare} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold border border-white/20" data-testid="btn-share-native">
              <Share2 size={14} /> Distribuie
            </button>
          </div>
        </div>
      </div>

      {/* Editable message preview */}
      <div className="aj-card p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-aj-navy">Mesaj sugerat</h3>
          <button onClick={copyMessage} className="text-sm text-aj-navy hover:text-aj-gold font-semibold flex items-center gap-1" data-testid="btn-copy-message">
            <Copy size={13} /> Copiază mesajul
          </button>
        </div>
        <p className="text-sm text-slate-600 whitespace-pre-line bg-aj-cream border border-aj-line rounded-lg p-4" data-testid="referral-message">{message}</p>
      </div>

      {/* History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-aj-navy">Recomandările tale</h3>
          <span className="text-xs text-slate-500">{rows.length} recomandări</span>
        </div>
        {rows.length === 0 && (
          <div className="aj-card p-10 text-center text-sm text-slate-400" data-testid="referrals-empty">
            Nu ai făcut încă nicio recomandare. Trimite linkul tău celor apropiați!
          </div>
        )}
        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.id} className="aj-card p-4 flex items-start justify-between gap-3" data-testid={`referral-${r.id}`}>
              <div className="min-w-0">
                <div className="font-semibold text-aj-navy">{r.friend_name}</div>
                <div className="text-xs text-slate-500">{r.friend_phone}{r.friend_city ? ` · ${r.friend_city}` : ""}</div>
                {r.product_interest && <div className="text-xs text-slate-500 mt-1">Interes: {r.product_interest}</div>}
                <div className="text-[11px] text-slate-400 mt-1">{formatDate(r.created_at)}</div>
              </div>
              <Badge map={REFERRAL_STATUS} value={r.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
