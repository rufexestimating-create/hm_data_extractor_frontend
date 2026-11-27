"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Search, Play, Square, Sun, Moon,
  Globe, Mail, Phone, Shield, CheckCircle2,
  AlertCircle, Loader2, Download, Trash2, Clock, Database,
  Filter, ChevronLeft, ChevronRight, ChevronDown, X, Table2, Activity, LogOut
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { API, apiFetch, getToken } from "@/lib/api";
import { displayName, useRequireAuth } from "@/lib/auth";

type Status = "idle" | "running" | "done" | "stopped" | "error";
type Tab = "extractor" | "history" | "data";

interface Stats { total?: number; with_website?: number; with_email?: number; with_phone?: number; with_license?: number; }
interface Batch { batch_id: string; source_url: string; mode: string; created_at: string; count: number; }
interface DataRecord { id: number; name: string; website: string; emails: string; phone: string; state: string; mode: string; created_at: string; }

export default function Home() {
  const { user, loading, signOut } = useRequireAuth();
  if (loading || !user) {
    return <div className="h-full flex items-center justify-center bg-bg"><Loader2 size={20} className="animate-spin text-accent" /></div>;
  }
  return <Dashboard user={user} onSignOut={signOut} />;
}

function Dashboard({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [tab, setTab] = useState<Tab>("extractor");

  // Extractor state
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"fast" | "deep">("fast");
  const [pages, setPages] = useState("All");
  const [pagesOpen, setPagesOpen] = useState(false);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [stats, setStats] = useState<Stats>({});
  const logRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  // History state
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [hMode, setHMode] = useState("");
  const [hDateFrom, setHDateFrom] = useState("");
  const [hDateTo, setHDateTo] = useState("");

  // Data Manager state
  const [dmRecords, setDmRecords] = useState<DataRecord[]>([]);
  const [dmTotal, setDmTotal] = useState(0);
  const [dmPage, setDmPage] = useState(0);
  const [dmLoading, setDmLoading] = useState(false);
  const [dmSearch, setDmSearch] = useState("");
  const [dmSearchInput, setDmSearchInput] = useState("");
  const [dmBatchId, setDmBatchId] = useState("");
  const DM_PER_PAGE = 20;

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logs]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pagesRef.current && !pagesRef.current.contains(e.target as Node)) setPagesOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Extraction ──
  const startExtraction = useCallback(async () => {
    if (!url.trim() || !url.startsWith("http")) return;
    setStatus("running"); setProgress(0); setLogs([]); setResultCount(0); setStats({});
    try {
      const res = await apiFetch("/api/extract", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), fast: mode === "fast", max_pages: pages.toLowerCase() === "all" ? null : parseInt(pages) || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setLogs([typeof body.detail === "string" ? body.detail : "Could not start the extraction."]);
        setStatus("error");
        return;
      }
      const es = new EventSource(`${API}/api/stream?access_token=${encodeURIComponent(await getToken())}`);
      esRef.current = es;
      es.addEventListener("update", (e) => {
        const d = JSON.parse(e.data);
        setProgress(d.progress || 0); setStatus(d.status as Status); setResultCount(d.result_count || 0);
        if (d.stats) setStats(d.stats);
        if (d.logs?.length) setLogs((p) => [...p, ...d.logs]);
      });
      es.addEventListener("complete", (e) => {
        const d = JSON.parse(e.data);
        setProgress(d.status === "done" ? 100 : d.progress); setStatus(d.status as Status);
        setResultCount(d.result_count || 0); if (d.stats) setStats(d.stats);
        if (d.batch_id) setDmBatchId(d.batch_id);
        es.close(); esRef.current = null;
      });
      es.addEventListener("status", (e) => { const d = JSON.parse(e.data); if (d.status === "idle") { es.close(); esRef.current = null; } });
      es.onerror = () => { es.close(); esRef.current = null; setStatus((p) => p === "running" ? "error" : p); };
    } catch { setStatus("error"); }
  }, [url, mode, pages]);

  const stopExtraction = async () => { try { await apiFetch("/api/stop", { method: "POST" }); } catch {} };

  // ── Batches ──
  const fetchBatches = useCallback(async () => {
    setLoadingBatches(true);
    const p = new URLSearchParams();
    if (hMode) p.set("mode", hMode);
    if (hDateFrom) p.set("date_from", hDateFrom);
    if (hDateTo) p.set("date_to", hDateTo);
    try { const r = await apiFetch(`/api/batches?${p}`); const d = await r.json(); setBatches(d.batches || []); } catch {}
    setLoadingBatches(false);
  }, [hMode, hDateFrom, hDateTo]);

  const exportCSV = async (batchId?: string) => {
    const u = batchId ? `/api/export-csv?batch_id=${encodeURIComponent(batchId)}` : "/api/export-csv";
    const r = await apiFetch(u); if (!r.ok) return;
    const b = await r.blob(); const a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = batchId ? `extracted_${batchId}.csv` : "extracted_all.csv"; a.click(); URL.revokeObjectURL(a.href);
  };

  const deleteBatch = async (batchId: string) => {
    try { await apiFetch(`/api/batch/${encodeURIComponent(batchId)}`, { method: "DELETE" }); setBatches((p) => p.filter((b) => b.batch_id !== batchId)); } catch {}
  };

  // ── Data Manager ──
  const fetchDmData = useCallback(async (page = 0, batchId?: string) => {
    setDmLoading(true);
    const bid = batchId ?? dmBatchId;
    const p = new URLSearchParams(); p.set("limit", String(DM_PER_PAGE)); p.set("offset", String(page * DM_PER_PAGE));
    if (bid) p.set("batch_id", bid);
    if (dmSearch) p.set("search", dmSearch);
    try { const r = await apiFetch(`/api/data?${p}`); const d = await r.json(); setDmRecords(d.records || []); setDmTotal(d.total || 0); setDmPage(page); } catch {}
    setDmLoading(false);
  }, [dmBatchId, dmSearch]);

  const exportFilteredCSV = async () => {
    const p = new URLSearchParams();
    if (dmBatchId) p.set("batch_id", dmBatchId);
    if (dmSearch) p.set("search", dmSearch);
    const r = await apiFetch(`/api/export-csv?${p}`); if (!r.ok) return;
    const b = await r.blob(); const a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = `filtered_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  useEffect(() => { if (tab === "history") fetchBatches(); }, [tab, fetchBatches]);

  // When DM tab opens and no batch_id yet, load the latest batch
  useEffect(() => {
    if (tab !== "data") return;
    if (dmBatchId) { fetchDmData(0); return; }
    (async () => {
      try {
        const r = await apiFetch("/api/batches");
        const d = await r.json();
        if (d.batches?.length) { setDmBatchId(d.batches[0].batch_id); }
        else { fetchDmData(0); }
      } catch { fetchDmData(0); }
    })();
  }, [tab, dmBatchId, dmSearch, fetchDmData]);

  const isRunning = status === "running";
  const isDone = status === "done";

  return (
    <div className="h-screen flex flex-col bg-bg transition-colors duration-300">

      {/* ════ NAVBAR ════ */}
      <nav className="flex-shrink-0 border-b border-border backdrop-blur-xl bg-nav-bg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center relative">
              <span className="text-white font-black text-xs">HM</span>
              {isRunning && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full animate-ping" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-text tracking-tight leading-none">Data Extractor</span>
              {isRunning && (
                <span className="text-[9px] text-accent font-medium mt-0.5">Extracting...</span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
            {([
              { id: "extractor" as Tab, label: "Extractor", icon: Zap },
              { id: "data" as Tab, label: "Data Manager", icon: Table2 },
              { id: "history" as Tab, label: "History", icon: Database },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium
                           transition-all duration-200 cursor-pointer
                  ${tab === id
                    ? "bg-accent text-white shadow-sm glow-accent"
                    : "text-text-muted hover:text-text-secondary glow-neutral"}`}
              >
                <Icon size={13} />
                {label}
                {id === "extractor" && isRunning && tab !== "extractor" && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Theme toggle + account */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="glow-neutral p-2 rounded-lg border border-border hover:border-border-hover
                         transition-all duration-200 cursor-pointer"
            >
              {theme === "dark" ? <Sun size={14} className="text-text-secondary" /> : <Moon size={14} className="text-text-secondary" />}
            </button>
            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-border" title={user.email ?? ""}>
              <div className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-bold uppercase">
                {displayName(user).charAt(0)}
              </div>
              <span className="hidden md:block text-xs font-medium text-text-secondary max-w-[110px] truncate">{displayName(user)}</span>
              <button
                onClick={onSignOut} title="Sign out"
                className="glow-neutral p-2 rounded-lg border border-border hover:border-danger/40 hover:text-danger
                           text-text-secondary transition-all duration-200 cursor-pointer"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ════ CONTENT ════ */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* ──── EXTRACTOR TAB ──── */}
          {tab === "extractor" && (
            <motion.div
              key="extractor"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto"
            >
              <div className="max-w-2xl mx-auto px-6 py-8">
                {/* URL Input */}
                <div className="mb-5">
                  <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3
                                  focus-within:border-accent/40 transition-colors duration-200">
                    <Globe size={16} className="text-text-muted flex-shrink-0" />
                    <input
                      type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste directory URL here..."
                      disabled={isRunning}
                      className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted
                                 disabled:opacity-40 outline-none"
                      onKeyDown={(e) => e.key === "Enter" && !isRunning && startExtraction()}
                    />
                    {url && !isRunning && (
                      <button onClick={() => setUrl("")} className="text-text-muted hover:text-text-secondary cursor-pointer"><X size={14} /></button>
                    )}
                  </div>
                </div>

                {/* Mode + Pages + Action */}
                <div className="flex items-stretch gap-3 mb-5">
                  {/* Fast */}
                  <button
                    onClick={() => setMode("fast")} disabled={isRunning}
                    className={`glow-fast flex-1 flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200
                               cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
                      ${mode === "fast" ? "border-fast/40 bg-fast/5" : "border-border hover:border-border-hover"}`}
                  >
                    <div className={`p-1.5 rounded-lg ${mode === "fast" ? "bg-fast/15" : "bg-card"}`}>
                      <Zap size={14} className={mode === "fast" ? "text-fast" : "text-text-muted"} />
                    </div>
                    <div className="text-left">
                      <div className={`text-xs font-semibold ${mode === "fast" ? "text-fast" : "text-text-secondary"}`}>Fast Mode</div>
                      <div className="text-[10px] text-text-muted mt-0.5">Name, Website, Email, Phone</div>
                    </div>
                  </button>

                  {/* Deep */}
                  <button
                    onClick={() => setMode("deep")} disabled={isRunning}
                    className={`glow-deep flex-1 flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200
                               cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
                      ${mode === "deep" ? "border-deep/40 bg-deep/5" : "border-border hover:border-border-hover"}`}
                  >
                    <div className={`p-1.5 rounded-lg ${mode === "deep" ? "bg-deep/15" : "bg-card"}`}>
                      <Search size={14} className={mode === "deep" ? "text-deep" : "text-text-muted"} />
                    </div>
                    <div className="text-left">
                      <div className={`text-xs font-semibold ${mode === "deep" ? "text-deep" : "text-text-secondary"}`}>Deep Mode</div>
                      <div className="text-[10px] text-text-muted mt-0.5">All Data + Website Crawl</div>
                    </div>
                  </button>

                  {/* Pages */}
                  <div ref={pagesRef} className="relative flex flex-col items-center justify-center border border-border rounded-xl px-3 min-w-[88px]">
                    <span className="text-[9px] text-text-muted uppercase tracking-wider font-medium">Pages</span>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <input
                        type="text" value={pages}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || /^\d+$/.test(v) || v.toLowerCase() === "all") setPages(v);
                        }}
                        onFocus={() => setPagesOpen(true)}
                        disabled={isRunning}
                        className="w-10 bg-transparent text-center text-sm text-text font-semibold outline-none
                                   disabled:opacity-40"
                      />
                      <button
                        onClick={() => !isRunning && setPagesOpen(!pagesOpen)}
                        disabled={isRunning}
                        className="text-text-muted hover:text-text-secondary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronDown size={12} className={`transition-transform duration-200 ${pagesOpen ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                    <AnimatePresence>
                      {pagesOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden min-w-[80px]"
                        >
                          {["All", "5", "10", "20", "50", "100"].map((opt) => (
                            <button
                              key={opt}
                              onClick={() => { setPages(opt); setPagesOpen(false); }}
                              className={`w-full px-4 py-2 text-xs text-left cursor-pointer transition-colors
                                ${pages === opt ? "bg-accent/10 text-accent font-semibold" : "text-text-secondary hover:bg-card-hover"}`}
                            >
                              {opt}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-5">
                  <button
                    onClick={startExtraction} disabled={isRunning || !url.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm
                               bg-accent text-white cursor-pointer transition-all duration-200
                               hover:bg-accent-hover active:scale-[0.98]
                               disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                    {isRunning ? "Extracting..." : "Start Extraction"}
                  </button>
                  <button
                    onClick={stopExtraction} disabled={!isRunning}
                    className="px-5 py-3 rounded-xl border border-border text-text-secondary cursor-pointer
                               hover:border-danger/40 hover:text-danger transition-all duration-200
                               disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    <Square size={14} />
                  </button>
                </div>

                {/* Progress */}
                {(isRunning || isDone || status === "stopped" || status === "error") && (
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isRunning && <Activity size={12} className="text-accent animate-pulse" />}
                        {isDone && <CheckCircle2 size={12} className="text-success" />}
                        {(status === "stopped" || status === "error") && <AlertCircle size={12} className="text-danger" />}
                        <span className="text-[11px] text-text-secondary">
                          {isRunning && "Extracting..."}{isDone && "Complete"}{status === "stopped" && "Stopped"}{status === "error" && "Error"}
                        </span>
                      </div>
                      <span className="text-[11px] text-text-muted font-mono">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-progress-bg rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: isDone ? "var(--success)" : status === "error" ? "var(--danger)" : "var(--accent)" }}
                        initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    {resultCount > 0 && (
                      <p className="text-[11px] text-text-secondary mt-2">
                        <span className="font-bold text-text">{resultCount}</span> records {isDone ? "extracted" : "so far"}
                      </p>
                    )}
                  </div>
                )}

                {/* Stats */}
                {isDone && stats.total != null && stats.total > 0 && (
                  <motion.div
                    className="grid grid-cols-4 gap-2.5 mb-5"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {[
                      { icon: Globe, label: "Website", val: stats.with_website, bg: "bg-accent/5 border-accent/20" },
                      { icon: Mail, label: "Email", val: stats.with_email, bg: "bg-fast/5 border-fast/20" },
                      { icon: Phone, label: "Phone", val: stats.with_phone, bg: "bg-deep/5 border-deep/20" },
                      { icon: Shield, label: "License", val: stats.with_license, bg: "bg-card border-border" },
                    ].map(({ icon: I, label, val, bg }) => (
                      <div key={label} className={`${bg} border rounded-xl p-3.5 text-center transition-transform
                                                    hover:scale-[1.03] cursor-default`}>
                        <I size={15} className="mx-auto mb-1.5 text-text-secondary" />
                        <div className="text-xl font-bold text-text">{val ?? 0}</div>
                        <div className="text-[9px] text-text-muted uppercase tracking-wider mt-0.5">{label}</div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Log */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Activity Log</span>
                    {logs.length > 0 && <span className="text-[10px] text-text-muted">{logs.length}</span>}
                  </div>
                  <div
                    ref={logRef}
                    className="h-40 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-[1.7]
                               text-text-secondary bg-bg-raised"
                  >
                    {logs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-text-muted text-xs gap-1.5">
                        <Activity size={16} className="opacity-30" />
                        <span>Waiting for extraction...</span>
                      </div>
                    ) : (
                      logs.map((log, i) => (
                        <div key={i} className="py-[1px] hover:text-text transition-colors">
                          <span className="text-text-muted mr-2 select-none">{String(i + 1).padStart(3, "0")}</span>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ──── HISTORY TAB ──── */}
          {tab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto"
            >
              <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-text">Extraction History</h2>
                    <p className="text-xs text-text-muted mt-0.5">{batches.length} extractions saved</p>
                  </div>
                  {batches.length > 0 && (
                    <button
                      onClick={() => exportCSV()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-xs
                                 font-medium cursor-pointer hover:bg-accent-hover transition-colors"
                    >
                      <Download size={13} /> Export All
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex items-end gap-3 mb-5 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-text-muted uppercase tracking-wider font-medium">Mode</label>
                    <select value={hMode} onChange={(e) => setHMode(e.target.value)}
                      className="bg-card border border-border rounded-lg py-2 px-3 text-xs text-text
                                 outline-none focus:border-accent/30 cursor-pointer min-w-[90px] transition-colors">
                      <option value="">All</option><option value="fast">Fast</option><option value="deep">Deep</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-text-muted uppercase tracking-wider font-medium">From</label>
                    <input type="date" value={hDateFrom} onChange={(e) => setHDateFrom(e.target.value)}
                      className="bg-card border border-border rounded-lg py-2 px-3 text-xs text-text outline-none
                                 focus:border-accent/30 transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-text-muted uppercase tracking-wider font-medium">To</label>
                    <input type="date" value={hDateTo} onChange={(e) => setHDateTo(e.target.value)}
                      className="bg-card border border-border rounded-lg py-2 px-3 text-xs text-text outline-none
                                 focus:border-accent/30 transition-colors" />
                  </div>
                  {(hMode || hDateFrom || hDateTo) && (
                    <button onClick={() => { setHMode(""); setHDateFrom(""); setHDateTo(""); }}
                      className="flex items-center gap-1 text-[10px] text-danger cursor-pointer hover:text-danger/70 py-2 uppercase tracking-wider font-medium">
                      <X size={12} /> Clear
                    </button>
                  )}
                </div>

                {loadingBatches ? (
                  <div className="flex items-center justify-center py-20 text-text-muted">
                    <Loader2 size={18} className="animate-spin mr-2" /> Loading...
                  </div>
                ) : batches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-text-muted">
                    <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
                      <Database size={24} className="opacity-40" />
                    </div>
                    <p className="text-sm font-medium text-text-secondary">No extractions saved yet</p>
                    <p className="text-xs mt-1.5 text-text-muted">Run an extraction from the Extractor tab</p>
                    <button onClick={() => setTab("extractor")}
                      className="mt-4 px-4 py-2 rounded-lg bg-accent text-white text-xs font-medium cursor-pointer
                                 hover:bg-accent-hover transition-colors">
                      Go to Extractor
                    </button>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_100px_160px_90px_90px] gap-4 px-5 py-3 border-b border-border
                                    text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                      <span>Source URL</span><span>Mode</span><span>Date</span><span className="text-right">Records</span><span></span>
                    </div>
                    {batches.map((batch) => (
                      <div
                        key={batch.batch_id}
                        className="grid grid-cols-[1fr_100px_160px_90px_90px] gap-4 px-5 py-3.5 border-b border-border/50
                                   hover:bg-card-hover transition-colors items-center group"
                      >
                        <span className="text-xs text-text truncate" title={batch.source_url}>{batch.source_url}</span>
                        <span className={`text-[10px] font-semibold uppercase w-fit px-2 py-0.5 rounded
                          ${batch.mode === "fast" ? "text-fast bg-fast/10" : "text-deep bg-deep/10"}`}>
                          {batch.mode}
                        </span>
                        <span className="text-[11px] text-text-muted flex items-center gap-1">
                          <Clock size={10} /> {new Date(batch.created_at).toLocaleString()}
                        </span>
                        <span className="text-xs text-text font-semibold text-right">{batch.count}</span>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => exportCSV(batch.batch_id)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent-soft cursor-pointer transition-all"
                            title="Export CSV"><Download size={13} /></button>
                          <button onClick={() => deleteBatch(batch.batch_id)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 cursor-pointer transition-all"
                            title="Delete"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ──── DATA MANAGER TAB ──── */}
          {tab === "data" && (
            <motion.div
              key="data"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              <div className="max-w-6xl mx-auto px-6 py-6 w-full flex flex-col flex-1 min-h-0">
                {/* Search + Export */}
                <div className="flex items-end gap-3 mb-5 flex-shrink-0">
                  <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                    <label className="text-[9px] text-text-muted uppercase tracking-wider font-medium">Search</label>
                    <div className="flex gap-1.5">
                      <input type="text" value={dmSearchInput} onChange={(e) => setDmSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && setDmSearch(dmSearchInput)}
                        placeholder="Name, website, email..."
                        className="flex-1 bg-card border border-border rounded-lg py-2 px-3 text-xs text-text
                                   placeholder:text-text-muted outline-none focus:border-accent/30 transition-colors" />
                      <button onClick={() => setDmSearch(dmSearchInput)}
                        className="px-3 py-2 bg-accent/10 text-accent rounded-lg cursor-pointer hover:bg-accent/20 transition-colors">
                        <Search size={13} />
                      </button>
                    </div>
                  </div>
                  {dmSearch && (
                    <button onClick={() => { setDmSearch(""); setDmSearchInput(""); }}
                      className="flex items-center gap-1 text-[10px] text-danger cursor-pointer hover:text-danger/70 py-2 uppercase tracking-wider font-medium">
                      <X size={12} /> Clear
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-3">
                    <span className="text-[11px] text-text-muted">{dmTotal.toLocaleString()} records</span>
                    <button onClick={exportFilteredCSV} disabled={dmTotal === 0}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-white text-[11px]
                                 font-medium cursor-pointer hover:bg-accent-hover transition-colors disabled:opacity-30">
                      <Download size={12} /> Export CSV
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="flex-1 min-h-0 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
                  <div className="overflow-auto flex-1">
                    {dmLoading ? (
                      <div className="flex items-center justify-center py-20 text-text-muted">
                        <Loader2 size={16} className="animate-spin mr-2" /> Loading...
                      </div>
                    ) : dmRecords.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 text-text-muted">
                        <div className="w-14 h-14 rounded-2xl bg-bg-raised border border-border flex items-center justify-center mb-4">
                          <Filter size={24} className="opacity-40" />
                        </div>
                        <p className="text-sm font-medium text-text-secondary">No records found</p>
                        <p className="text-xs mt-1.5">Try adjusting your filters or run a new extraction</p>
                      </div>
                    ) : (
                      <table className="w-full text-[11px]">
                        <thead className="sticky top-0 bg-card z-10">
                          <tr className="border-b border-border">
                            {["Name", "Website", "Email", "Phone", "State", "Mode", "Date"].map((h) => (
                              <th key={h} className="text-left px-4 py-2.5 text-[9px] font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dmRecords.map((rec) => (
                            <tr key={rec.id} className="border-b border-border/30 hover:bg-card-hover transition-colors">
                              <td className="px-4 py-2.5 text-text font-medium max-w-[150px] truncate">{rec.name || "—"}</td>
                              <td className="px-4 py-2.5 max-w-[160px] truncate">
                                {rec.website ? (
                                  <a href={rec.website} target="_blank" rel="noopener noreferrer"
                                     className="text-accent hover:underline underline-offset-2">{rec.website.replace(/^https?:\/\/(www\.)?/, "")}</a>
                                ) : "—"}
                              </td>
                              <td className="px-4 py-2.5 text-text-secondary max-w-[160px] truncate">{rec.emails || "—"}</td>
                              <td className="px-4 py-2.5 text-text-secondary whitespace-nowrap">{rec.phone || "—"}</td>
                              <td className="px-4 py-2.5 text-text-secondary">{rec.state || "—"}</td>
                              <td className="px-4 py-2.5">
                                <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded
                                  ${rec.mode === "fast" ? "text-fast bg-fast/10" : "text-deep bg-deep/10"}`}>{rec.mode}</span>
                              </td>
                              <td className="px-4 py-2.5 text-text-muted whitespace-nowrap">{new Date(rec.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Pagination */}
                  {dmTotal > DM_PER_PAGE && (
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border flex-shrink-0">
                      <span className="text-[10px] text-text-muted">
                        {dmPage * DM_PER_PAGE + 1}–{Math.min((dmPage + 1) * DM_PER_PAGE, dmTotal)} of {dmTotal.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => fetchDmData(dmPage - 1)} disabled={dmPage === 0}
                          className="p-1 rounded text-text-muted hover:text-accent cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                          <ChevronLeft size={14} />
                        </button>
                        <span className="text-[10px] text-text-secondary font-medium">
                          {dmPage + 1} / {Math.ceil(dmTotal / DM_PER_PAGE)}
                        </span>
                        <button onClick={() => fetchDmData(dmPage + 1)} disabled={(dmPage + 1) * DM_PER_PAGE >= dmTotal}
                          className="p-1 rounded text-text-muted hover:text-accent cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
