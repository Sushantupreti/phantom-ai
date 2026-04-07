import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ghost, Mic, MicOff, Camera, ChevronUp, ChevronDown,
  Copy, Check, Sparkles, Pencil, MessageSquare, HelpCircle,
  RefreshCw, X, EyeOff, MousePointer2Off, ArrowRight, Globe,
  FileUp, ClipboardPaste, Link, ChevronLeft, SlidersHorizontal,
  Keyboard, Shield, Brain, Wand2,
} from "lucide-react";
import "./App.css";

const W = 620;
const PILL_H = 52;
const PANEL_H = 560;
const CONTEXT_H = 560;

type View = "pill" | "panel" | "context";
interface Msg { id: number; type: "q" | "a" | "i"; text: string }
let _id = 0;

export default function App() {
  const [view, setView] = useState<View>("pill");
  const [on, setOn] = useState(false);        // listening
  const [ai, setAi] = useState(false);         // streaming
  const [aiTxt, setAiTxt] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [trs, setTrs] = useState<string[]>([]);
  const [cp, setCp] = useState(false);
  const [pt, setPt] = useState(false);         // passthrough
  const [ask, setAsk] = useState("");
  const [ctx, setCtx] = useState<Record<string, string>>({});  // loaded context labels
  const [urlInput, setUrlInput] = useState("");
  const [fetching, setFetching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // --- EVENTS ---
  useEffect(() => {
    const u: (() => void)[] = [];
    listen<{ text: string; is_final: boolean }>("transcript", (e) => {
      const t = e.payload.text.trim();
      if (t.length > 3) setTrs((p) => [...p.slice(-10), t]);
      if (e.payload.is_final && t.length > 5) {
        setMsgs((p) => [...p, { id: ++_id, type: "q", text: t }]);
        if (view === "pill") setView("panel");
      }
    }).then((x) => u.push(x));
    listen<{ text: string; is_done: boolean }>("ai_response", (e) => {
      if (e.payload.is_done) { setAi(false); setAiTxt((p) => { if (p) setMsgs((m) => [...m, { id: ++_id, type: "a", text: p }]); return ""; }); }
      else { setAi(true); setAiTxt((p) => p + e.payload.text); }
    }).then((x) => u.push(x));
    listen<{ message: string }>("status", () => {}).then((x) => u.push(x));
    listen<{ message: string }>("ai_generating", (e) => {
      setAi(true); setAiTxt("");
      invoke("generate_answer", { question: e.payload.message }).catch(() => setAi(false));
    }).then((x) => u.push(x));
    return () => u.forEach((f) => f());
  }, [view]);

  // --- RESIZE ---
  useEffect(() => {
    const h = view === "pill" ? PILL_H : view === "panel" ? PANEL_H : CONTEXT_H;
    invoke("resize_overlay", { width: W, height: h }).catch(() => {});
    if (view === "pill") invoke("center_overlay_top").catch(() => {});
  }, [view]);

  // --- SCROLL ---
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" }); }, [msgs, aiTxt]);

  // --- ACTIONS ---
  const mic = useCallback(async () => {
    if (on) { await invoke("stop_listening").catch(() => {}); setOn(false); }
    else { try { await invoke("start_listening"); setOn(true); } catch (e) { setMsgs((p) => [...p, { id: ++_id, type: "i", text: String(e) }]); } }
  }, [on]);

  const copy = useCallback(() => {
    const a = [...msgs].reverse().find((m) => m.type === "a");
    if (a || aiTxt) { navigator.clipboard.writeText(a?.text || aiTxt); setCp(true); setTimeout(() => setCp(false), 1500); }
  }, [msgs, aiTxt]);

  const qa = useCallback((p: string) => {
    const q = [...msgs].reverse().find((m) => m.type === "q");
    if (q) { setAi(true); setAiTxt(""); invoke("generate_answer", { question: `${p}: "${q.text}"` }).catch(() => setAi(false)); }
  }, [msgs]);

  const send = useCallback(() => {
    if (!ask.trim()) return;
    setMsgs((p) => [...p, { id: ++_id, type: "q", text: ask }]);
    setAi(true); setAiTxt("");
    invoke("generate_answer", { question: ask }).catch(() => setAi(false));
    setAsk("");
  }, [ask]);

  const uploadCtx = useCallback(async (name: string, cmd: string) => {
    try {
      const f = await open({ multiple: false, filters: [{ name: "Documents", extensions: ["txt", "md", "pdf", "doc", "docx"] }] });
      if (!f) return;
      const path = f as string;
      let content: string;
      if (path.endsWith(".pdf")) {
        content = await invoke<string>("parse_pdf", { path });
      } else {
        content = await readTextFile(path);
      }
      if (content) {
        await invoke(cmd, { text: content });
        setCtx((p) => ({ ...p, [name]: `${content.length.toLocaleString()} chars` }));
      }
    } catch (e) { setMsgs((p) => [...p, { id: ++_id, type: "i", text: String(e) }]); }
  }, []);

  const pasteCtx = useCallback(async (name: string, cmd: string) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        await invoke(cmd, { text });
        setCtx((p) => ({ ...p, [name]: `${text.length.toLocaleString()} chars pasted` }));
      }
    } catch (_) {}
  }, []);

  const fetchUrl = useCallback(async () => {
    if (!urlInput.trim()) return;
    setFetching(true);
    try {
      const text = await invoke<string>("fetch_url", { url: urlInput });
      await invoke("set_company_notes", { text });
      setCtx((p) => ({ ...p, "Company": `Fetched from ${new URL(urlInput).hostname}` }));
      setUrlInput("");
    } catch (e) { setMsgs((p) => [...p, { id: ++_id, type: "i", text: `Fetch failed: ${e}` }]); }
    setFetching(false);
  }, [urlInput]);

  const glow = ai ? "g-ai" : on ? "g-listen" : "g-idle";
  const bg = "bg-[rgba(12,10,20,0.92)] backdrop-blur-[24px] backdrop-saturate-[160%]";

  return (
    <div className="h-full w-full" data-tauri-drag-region>
      <AnimatePresence mode="wait">

        {/* ==================== PILL ==================== */}
        {view === "pill" && (
          <motion.div key="pill" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className={`${glow} gradient-border ${bg} w-full h-full rounded-full flex items-center px-2 gap-1`} data-tauri-drag-region>
            <button onClick={mic} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition relative">
              <Ghost className="w-5 h-5 text-violet-400" />
              {on && <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 pulse-s border-2 border-[rgba(12,10,20,0.92)]" />}
            </button>
            <button onClick={() => setView("panel")} className="flex-1 flex items-center gap-2.5 px-2 py-1.5 rounded-full hover:bg-white/[0.04] transition" data-tauri-drag-region>
              {on ? (
                <div className="flex items-end gap-[3px] h-[18px]">
                  {[0,1,2,3,4,5].map((i) => (
                    <motion.div key={i} animate={{ height: [3, 15 + Math.random() * 5, 3] }}
                      transition={{ duration: 0.3 + Math.random() * 0.2, repeat: Infinity, delay: i * 0.05 }}
                      className="w-[3px] rounded-full bg-gradient-to-t from-emerald-500 to-emerald-300" />
                  ))}
                </div>
              ) : ai ? (
                <div className="flex gap-1">
                  {[0,1,2].map((i) => (
                    <motion.div key={i} animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  ))}
                </div>
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400/40" />
              )}
              <span className="text-[13px] font-medium text-white/60 truncate">
                {ai ? "Generating answer..." : on ? "Listening..." : "Phantom AI"}
              </span>
            </button>
            <button onClick={() => setView("panel")} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/15 hover:from-violet-500/15 hover:to-cyan-500/15 transition">
              <ChevronDown className="w-3.5 h-3.5 text-violet-400/60" />
              <span className="text-[12px] font-medium text-violet-400/60">Show</span>
            </button>
            <button onClick={() => { invoke("stop_listening"); setOn(false); }}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500/10 transition group">
              <div className="w-3 h-3 rounded-sm bg-white/15 group-hover:bg-red-400 transition" />
            </button>
          </motion.div>
        )}

        {/* ==================== PANEL ==================== */}
        {view === "panel" && (
          <motion.div key="panel" initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className={`${glow} gradient-border ${bg} w-full h-full rounded-[24px] flex flex-col overflow-hidden`}>

            {/* TOP BAR */}
            <div className="flex items-center justify-center gap-2 pt-3 pb-1" data-tauri-drag-region>
              <button onClick={mic} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition relative">
                <Ghost className="w-4 h-4 text-violet-400" />
                {on && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 pulse-s border-2 border-[rgba(12,10,20,0.92)]" />}
              </button>
              <button onClick={() => setView("pill")} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.07] transition border border-white/[0.04]">
                <ChevronUp className="w-3.5 h-3.5 text-white/35" />
                <span className="text-[12px] font-medium text-white/35">Hide</span>
              </button>
              <button onClick={() => { invoke("stop_listening"); setOn(false); }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500/10 transition group">
                <div className="w-2.5 h-2.5 rounded-sm bg-white/15 group-hover:bg-red-400 transition" />
              </button>
            </div>

            {/* ROLLING TRANSCRIPT */}
            {trs.length > 0 && (
              <div className="t-mask mx-5 mb-1 overflow-hidden whitespace-nowrap h-7">
                <div className="scroll-t inline-flex gap-4 text-[12px] italic text-white/20 leading-7">
                  {[...trs, ...trs].map((t, i) => (
                    <span key={i} className="flex items-center gap-2">
                      {on && i === 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-pulse flex-shrink-0" />}
                      {t}<span className="text-white/8">·</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CHAT */}
            <div ref={ref} className="flex-1 overflow-y-auto px-5 py-2 space-y-3" style={{ scrollbarWidth: "none" }}>
              {/* EMPTY STATE */}
              {msgs.length === 0 && !ai && (
                <div className="flex flex-col items-center justify-center h-full gap-5">
                  <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={mic}
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      on ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/[0.06] bg-white/[0.02] hover:border-violet-500/20"
                    }`}>
                    {/* Rotating gradient ring */}
                    {!on && <div className="absolute inset-[-2px] rounded-full gradient-border opacity-30" />}
                    {on ? (
                      <div className="flex items-end gap-[3px] h-10">
                        {[0,1,2,3,4,5,6,7].map((i) => (
                          <motion.div key={i} animate={{ height: [3, 28 + Math.random() * 10, 3] }}
                            transition={{ duration: 0.25 + Math.random() * 0.2, repeat: Infinity, delay: i * 0.04 }}
                            className="w-[3px] rounded-full bg-gradient-to-t from-emerald-500 via-emerald-400 to-cyan-300" />
                        ))}
                      </div>
                    ) : (
                      <Mic className="w-10 h-10 text-white/20" />
                    )}
                  </motion.button>
                  <div className="text-center">
                    <p className="text-[14px] font-medium text-white/50">{on ? "Listening for questions..." : "Tap to Start Listening"}</p>
                    <p className="text-[11px] text-white/20 mt-1 flex items-center justify-center gap-1.5">
                      <Shield className="w-3 h-3" /> 100% Local — Whisper + Ollama
                    </p>
                  </div>
                  {!on && (
                    <div className="flex gap-2 flex-wrap justify-center">
                      <PillBtn icon={Camera} label="Screenshot" onClick={() => invoke("screenshot_ocr", { region: false })} accent="cyan" />
                      <PillBtn icon={FileUp} label="Upload Context" onClick={() => setView("context")} accent="violet" />
                      <PillBtn icon={Globe} label="Fetch Company" onClick={() => setView("context")} accent="pink" />
                    </div>
                  )}
                </div>
              )}

              {/* MESSAGES */}
              {msgs.map((m) => (
                <div key={m.id} className="fade-up">
                  {m.type === "q" && (
                    <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-gradient-to-br from-blue-500/[0.08] to-indigo-500/[0.04] border border-blue-500/[0.1] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-widest text-blue-400/50 font-semibold mb-1">Interviewer</p>
                      <p className="text-[13px] text-white/50 italic leading-relaxed">&ldquo;{m.text}&rdquo;</p>
                    </div>
                  )}
                  {m.type === "a" && (
                    <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-gradient-to-br from-emerald-500/[0.08] to-teal-500/[0.04] border border-emerald-500/[0.1] px-4 py-3 group relative">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] uppercase tracking-widest text-emerald-400/70 font-bold">Say This</span>
                      </div>
                      <p className="text-[14px] text-white/85 leading-[1.7]">{m.text}</p>
                      <button onClick={copy} className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-all hover:bg-white/[0.08]">
                        {cp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-white/30" />}
                      </button>
                    </div>
                  )}
                  {m.type === "i" && (
                    <div className="px-3 py-2 rounded-xl bg-amber-500/[0.05] border border-amber-500/[0.08]">
                      <p className="text-[11px] text-amber-400/60">{m.text}</p>
                    </div>
                  )}
                </div>
              ))}

              {/* STREAMING */}
              {ai && aiTxt && (
                <div className="fade-up max-w-[88%] rounded-2xl rounded-tl-md bg-gradient-to-br from-violet-500/[0.08] to-purple-500/[0.04] border border-violet-500/[0.1] px-4 py-3 shimmer">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest text-violet-400/70 font-bold">Thinking</span>
                  </div>
                  <p className="text-[14px] text-white/85 leading-[1.7]">{aiTxt}<span className="blink inline-block w-[2px] h-[15px] bg-violet-400 ml-0.5 align-middle" /></p>
                </div>
              )}
              {ai && !aiTxt && (
                <div className="flex items-center gap-2 py-2">
                  {[0,1,2].map((i) => (
                    <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      className="w-2.5 h-2.5 rounded-full bg-gradient-to-t from-emerald-500 to-cyan-400" />
                  ))}
                  <span className="text-[12px] text-emerald-400/40 ml-1">Generating...</span>
                </div>
              )}
            </div>

            {/* QUICK ACTIONS */}
            {msgs.length > 0 && (
              <div className="flex items-center gap-1.5 px-5 py-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                <QA icon={Pencil} label="Answer" onClick={() => qa("Give me the best interview answer for")} color="emerald" />
                <QA icon={MessageSquare} label="Clarify" onClick={() => qa("Simplify and clarify this question")} color="blue" />
                <QA icon={RefreshCw} label="Recap" onClick={() => qa("Brief recap of our conversation")} color="indigo" />
                <QA icon={HelpCircle} label="Follow-up" onClick={() => qa("Predict follow-up questions for")} color="amber" />
                <QA icon={Camera} label="Screen" onClick={() => invoke("screenshot_ocr", { region: false })} color="cyan" />
              </div>
            )}

            {/* INPUT */}
            <div className="px-5 pb-2">
              <div className="flex items-center gap-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] px-4 py-2.5 focus-within:border-violet-500/20 transition">
                <input value={ask} onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Ask anything about the interview..."
                  className="flex-1 bg-transparent text-[13px] text-white/70 placeholder-white/18" />
                {ask ? (
                  <button onClick={send} className="w-7 h-7 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 flex items-center justify-center hover:shadow-lg hover:shadow-violet-500/20 transition">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>
                ) : (
                  <span className="text-[10px] text-white/12 font-mono">enter ↵</span>
                )}
              </div>
            </div>

            {/* BOTTOM BAR */}
            <div className="flex items-center px-5 py-2.5 border-t border-white/[0.04]">
              <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/[0.06] border border-violet-500/[0.08] hover:bg-violet-500/[0.1] transition mr-2">
                <Brain className="w-3 h-3 text-violet-400" />
                <span className="text-[11px] text-violet-400/70 font-medium">Llama 3.1</span>
              </button>
              <div className="w-px h-3 bg-white/[0.05] mx-1" />
              <IBn icon={FileUp} tip="Context" onClick={() => setView("context")} />
              <IBn icon={SlidersHorizontal} tip="Settings" onClick={() => setView("context")} />
              <IBn icon={MousePointer2Off} tip="Passthrough" active={pt} onClick={() => { setPt(!pt); invoke("set_click_through", { enabled: !pt }); }} />
              <div className="flex-1" />
              <button onClick={mic}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  on ? "bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-500/20" : "bg-white/[0.04] border border-white/[0.06] hover:border-violet-500/15"
                }`}>
                {on ? (
                  <>
                    <div className="flex items-end gap-[2px] h-3">
                      {[0,1,2,3].map((i) => (
                        <motion.div key={i} animate={{ height: [2, 10, 2] }}
                          transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.06 }}
                          className="w-[2px] rounded-full bg-emerald-400" />
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-400">Listening</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-white/25" />
                    <span className="text-[11px] font-medium text-white/25">Start</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ==================== CONTEXT / SETTINGS ==================== */}
        {view === "context" && (
          <motion.div key="ctx" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className={`g-idle ${bg} w-full h-full rounded-[24px] border border-white/[0.06] flex flex-col overflow-hidden`}>

            <div className="flex items-center px-5 py-3.5 border-b border-white/[0.04]" data-tauri-drag-region>
              <button onClick={() => setView("panel")} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/[0.06] transition mr-2">
                <ChevronLeft className="w-4 h-4 text-white/30" />
              </button>
              <span className="text-[14px] font-semibold text-white/80">Interview Setup</span>
              <div className="flex-1" />
              <button onClick={() => setView("panel")} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/[0.06] transition">
                <X className="w-4 h-4 text-white/25" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

              {/* UPLOAD FILES */}
              <Sec title="Upload Context" desc="PDF, TXT, or paste text — for personalized answers" icon={FileUp}>
                {[
                  { n: "Resume", c: "set_resume", ic: "📄" },
                  { n: "Job Description", c: "set_job_description", ic: "📋" },
                  { n: "Company Notes", c: "set_company_notes", ic: "🏢" },
                ].map((f) => (
                  <div key={f.n} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{f.ic}</span>
                      <span className="text-[13px] text-white/60 font-medium flex-1">{f.n}</span>
                      {ctx[f.n] && <span className="text-[10px] text-emerald-400/70 bg-emerald-500/10 px-2 py-0.5 rounded-full">{ctx[f.n]}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => uploadCtx(f.n, f.c)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-500/[0.06] border border-violet-500/[0.08] hover:bg-violet-500/[0.1] transition text-[11px] font-medium text-violet-400/70">
                        <FileUp className="w-3 h-3" /> Upload File
                      </button>
                      <button onClick={() => pasteCtx(f.n, f.c)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-cyan-500/[0.06] border border-cyan-500/[0.08] hover:bg-cyan-500/[0.1] transition text-[11px] font-medium text-cyan-400/70">
                        <ClipboardPaste className="w-3 h-3" /> Paste Text
                      </button>
                    </div>
                  </div>
                ))}
              </Sec>

              {/* FETCH FROM URL */}
              <Sec title="Company Research" desc="Paste a URL — we'll fetch and analyze it" icon={Globe}>
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
                  <div className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-pink-400/50" />
                    <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchUrl()}
                      placeholder="https://company.com/about or job posting URL..."
                      className="flex-1 bg-transparent text-[13px] text-white/60 placeholder-white/20" />
                    <button onClick={fetchUrl} disabled={fetching || !urlInput}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500/10 to-violet-500/10 border border-pink-500/[0.1] text-[11px] font-medium text-pink-400/70 hover:from-pink-500/15 hover:to-violet-500/15 transition disabled:opacity-30">
                      {fetching ? "Fetching..." : "Fetch"}
                    </button>
                  </div>
                  {ctx["Company"] && (
                    <p className="text-[10px] text-emerald-400/60 mt-2 flex items-center gap-1">
                      <Check className="w-3 h-3" /> {ctx["Company"]}
                    </p>
                  )}
                </div>
              </Sec>

              {/* AI ENGINE */}
              <Sec title="AI Engine" desc="Everything runs locally on your Mac" icon={Brain}>
                <Row label="Speech-to-Text" value="Whisper base.en" ok />
                <Row label="Language Model" value="Llama 3.1 8B" ok />
                <Row label="Screen OCR" value="macOS Vision" ok />
              </Sec>

              {/* STEALTH */}
              <Sec title="Privacy & Stealth" desc="Invisible to screen share" icon={Shield}>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/[0.05] to-cyan-500/[0.03] border border-emerald-500/[0.08]">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-emerald-400" />
                    <span className="text-[13px] text-emerald-400/80">Screen share protection</span>
                  </div>
                  <span className="text-[10px] text-emerald-400/60 bg-emerald-500/10 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[13px] text-white/40">Data sent to cloud</span>
                  <span className="text-[13px] font-bold text-emerald-400">ZERO</span>
                </div>
              </Sec>

              {/* SHORTCUTS */}
              <Sec title="Shortcuts" desc="Works globally" icon={Keyboard}>
                <KBD a="Toggle overlay" k="Cmd+Shift+P" />
                <KBD a="Screenshot OCR" k="Cmd+Shift+S" />
              </Sec>
            </div>

            <div className="px-5 py-2.5 border-t border-white/[0.04] text-center">
              <span className="text-[10px] text-white/10">Phantom AI v0.1.0</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ======== COMPONENTS ========

function PillBtn({ icon: I, label, onClick, accent }: { icon: React.ElementType; label: string; onClick: () => void; accent: string }) {
  const colors: Record<string, string> = {
    cyan: "from-cyan-500/10 to-blue-500/10 border-cyan-500/15 text-cyan-400/60 hover:from-cyan-500/15",
    violet: "from-violet-500/10 to-purple-500/10 border-violet-500/15 text-violet-400/60 hover:from-violet-500/15",
    pink: "from-pink-500/10 to-rose-500/10 border-pink-500/15 text-pink-400/60 hover:from-pink-500/15",
  };
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r border text-[11px] font-medium transition ${colors[accent]}`}>
      <I className="w-3 h-3" />{label}
    </button>
  );
}

function QA({ icon: I, label, onClick, color }: { icon: React.ElementType; label: string; onClick: () => void; color: string }) {
  const c: Record<string, string> = {
    emerald: "border-emerald-500/[0.08] text-emerald-400/50 hover:bg-emerald-500/[0.06] hover:text-emerald-400/70",
    blue: "border-blue-500/[0.08] text-blue-400/50 hover:bg-blue-500/[0.06] hover:text-blue-400/70",
    indigo: "border-indigo-500/[0.08] text-indigo-400/50 hover:bg-indigo-500/[0.06] hover:text-indigo-400/70",
    amber: "border-amber-500/[0.08] text-amber-400/50 hover:bg-amber-500/[0.06] hover:text-amber-400/70",
    cyan: "border-cyan-500/[0.08] text-cyan-400/50 hover:bg-cyan-500/[0.06] hover:text-cyan-400/70",
  };
  return (
    <button onClick={onClick} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium border bg-white/[0.01] active:scale-95 transition-all duration-150 flex-shrink-0 ${c[color]}`}>
      <I className="w-3 h-3" />{label}
    </button>
  );
}

function IBn({ icon: I, tip, onClick, active }: { icon: React.ElementType; tip: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} title={tip}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${active ? "bg-sky-500/10" : "hover:bg-white/[0.05]"}`}>
      <I className={`w-3.5 h-3.5 ${active ? "text-sky-400" : "text-white/20"}`} />
    </button>
  );
}

function Sec({ title, desc, icon: I, children }: { title: string; desc: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <I className="w-4 h-4 text-violet-400/50" />
        <div>
          <p className="text-[13px] text-white/70 font-semibold">{title}</p>
          <p className="text-[11px] text-white/25">{desc}</p>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
      <span className="text-[13px] text-white/45">{label}</span>
      <div className="flex items-center gap-2">{ok && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}<span className="text-[12px] text-white/30">{value}</span></div>
    </div>
  );
}

function KBD({ a, k }: { a: string; k: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
      <span className="text-[13px] text-white/45">{a}</span>
      <kbd className="text-[11px] text-white/25 bg-white/[0.04] px-2.5 py-1 rounded-lg font-mono">{k}</kbd>
    </div>
  );
}
