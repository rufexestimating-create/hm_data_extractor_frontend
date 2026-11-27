"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Globe, Mail, Phone } from "lucide-react";

const ROWS = [
  { name: "Madison Remodeling Co.", site: "madisonremodel.com" },
  { name: "Badger State Builders", site: "badgerbuilds.com" },
  { name: "Lakeshore Roofing LLC", site: "lakeshoreroof.com" },
  { name: "Capital City Exteriors", site: "capitalexteriors.com" },
];
const TOTAL = 570;

export function AgentIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <path d="M24 13V7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="5.5" r="3" fill="currentColor" />
      <rect x="3" y="22" width="4.5" height="11" rx="2.25" fill="currentColor" opacity=".7" />
      <rect x="40.5" y="22" width="4.5" height="11" rx="2.25" fill="currentColor" opacity=".7" />
      <rect x="8" y="13" width="32" height="28" rx="10" fill="currentColor" />
      <rect x="12.5" y="19" width="23" height="14" rx="7" fill="#fff" opacity=".18" />
      <circle cx="18.5" cy="26" r="3.6" fill="#fff" />
      <circle cx="29.5" cy="26" r="3.6" fill="#fff" />
      <circle cx="19.4" cy="26.4" r="1.6" fill="#064e3b" />
      <circle cx="30.4" cy="26.4" r="1.6" fill="#064e3b" />
      <path d="M19 35.5c3 1.6 7 1.6 10 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Donut() {
  const r = 24, c = 2 * Math.PI * r;
  const segs = [
    { len: 0.6, color: "#10b981" },
    { len: 0.25, color: "#5eead4" },
    { len: 0.15, color: "#cbd5e1" },
  ];
  let offset = 0;
  return (
    <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
      {segs.map((s) => {
        const dash = s.len * c;
        const el = (
          <circle key={s.color} cx="32" cy="32" r={r} fill="none" stroke={s.color} strokeWidth="8"
                  strokeDasharray={`${dash - 2} ${c - dash + 2}`} strokeDashoffset={-offset} />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

export default function ExtractorIllustration() {
  const [active, setActive] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % (ROWS.length + 2)), 1300);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setCount((c) => (c >= TOTAL ? 0 : Math.min(TOTAL, c + 19))), 90);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full max-w-[470px] mx-auto pt-14 select-none">
      {/* floating coverage card */}
      <motion.div
        className="absolute top-0 right-2 z-10 bg-white rounded-xl shadow-xl px-3.5 py-3 w-[168px]"
        animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="text-[9px] font-semibold text-slate-500 mb-1.5">Data coverage</div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Donut />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] font-bold text-slate-800 leading-none">{TOTAL}</span>
              <span className="text-[7px] text-slate-400 mt-0.5">records</span>
            </div>
          </div>
          <div className="space-y-1">
            {[["Website", "#10b981"], ["Email", "#5eead4"], ["Phone", "#cbd5e1"]].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5 text-[8px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />{label}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* main agent card */}
      <div className="bg-white rounded-2xl shadow-2xl p-4 text-slate-800">
        <div className="flex items-center mb-3.5">
          <div className="flex items-center gap-2.5">
            <motion.div
              className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"
              animate={{ rotate: [0, -4, 4, 0] }} transition={{ duration: 3.5, repeat: Infinity }}
            >
              <AgentIcon className="w-7 h-7" />
            </motion.div>
            <div>
              <div className="text-xs font-bold leading-tight">Extraction Agent</div>
              <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-medium mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live · reading directory pages…
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1.25fr] gap-2 items-start">
          {/* directory list */}
          <div>
            <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Directory</div>
            <div className="space-y-1.5">
              {ROWS.map((_, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-1.5 rounded-lg border px-2 h-9"
                  animate={{
                    borderColor: active === i ? "#10b981" : "#f1f5f9",
                    backgroundColor: active === i ? "#ecfdf5" : "#f8fafc",
                  }}
                >
                  <span className="w-4 h-4 rounded bg-slate-200 flex-shrink-0" />
                  <span className="space-y-1 flex-1">
                    <span className="block h-1.5 rounded bg-slate-300 w-4/5" />
                    <span className="block h-1.5 rounded bg-slate-200 w-3/5" />
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          <ArrowRight size={14} className="text-emerald-500 mt-[52px]" />

          {/* extracted rows */}
          <div>
            <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Extracted</div>
            <div className="space-y-1.5">
              {ROWS.map((row, i) => (
                <div key={i} className="h-9 rounded-lg border border-slate-100 bg-slate-50 px-2 flex items-center">
                  {i < active ? (
                    <motion.div
                      key={`${i}-${active > i}`}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1.5 w-full min-w-0"
                    >
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                        <Check size={9} strokeWidth={3} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[9px] font-semibold truncate leading-tight">{row.name}</span>
                        <span className="flex items-center gap-1 text-[8px] text-slate-400 mt-0.5">
                          <Globe size={8} /><span className="truncate">{row.site}</span>
                          <Mail size={8} /><Phone size={8} />
                        </span>
                      </span>
                    </motion.div>
                  ) : (
                    <span className="space-y-1 flex-1">
                      <span className="block h-1.5 rounded bg-slate-200 w-3/4" />
                      <span className="block h-1.5 rounded bg-slate-100 w-1/2" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3.5">
          <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1">
            <span>Pages scanned</span>
            <span className="font-semibold text-slate-700">{count} / {TOTAL} records</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-100"
                 style={{ width: `${(count / TOTAL) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
