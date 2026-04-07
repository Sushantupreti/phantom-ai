import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ghost, Eye, Copy, Check, X, EyeOff, ArrowRight, FileUp,
  ClipboardPaste, Link, ChevronLeft, Wand2,
} from "lucide-react";
import "./App.css";

const W = 680, TOOLBAR_H = 52, FULL_H = 620, CTX_H = 580;
type View = "toolbar" | "full" | "context";
interface Msg { id: number; who: "me" | "others" | "system"; text: string }
let _id = 0;

export default function App() {
  const [view, setView] = useState<View>("toolbar");
  const [on, setOn] = useState(false);          // listening
  const [aiOn, setAiOn] = useState(false);       // AI streaming
  const [aiTxt, setAiTxt] = useState("");        // current AI answer
  const [lastAnswer, setLastAnswer] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [cp, setCp] = useState(false);
  const [autoAnswer, setAutoAnswer] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [askTxt, setAskTxt] = useState("");
  const [ctx, setCtx] = useState<Record<string, string>>({});
  const [urlIn, setUrlIn] = useState("");
  const [fetching, setFetching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // --- EVENTS ---
  useEffect(() => {
    const u: (() => void)[] = [];
    listen<{ text: string; is_final: boolean }>("transcript", (e) => {
      const t = e.payload.text.trim();
      if (e.payload.is_final && t.length > 5) {
        setMsgs((p) => [...p, { id: ++_id, who: "others", text: t }]);
        if (view === "toolbar") setView("full");
      }
    }).then((x) => u.push(x));

    listen<{ text: string; is_done: boolean }>("ai_response", (e) => {
      if (e.payload.is_done) {
        setAiOn(false);
        setAiTxt((p) => { if (p) setLastAnswer(p); return ""; });
      } else {
        setAiOn(true);
        setAiTxt((p) => p + e.payload.text);
      }
    }).then((x) => u.push(x));

    listen<{ message: string }>("ai_generating", (e) => {
      setAiOn(true); setAiTxt("");
      invoke("generate_answer", { question: e.payload.message }).catch(() => setAiOn(false));
    }).then((x) => u.push(x));

    listen<{ message: string }>("status", () => {}).then((x) => u.push(x));
    return () => u.forEach((f) => f());
  }, [view]);

  // --- RESIZE ---
  useEffect(() => {
    const h = view === "toolbar" ? TOOLBAR_H : view === "full" ? FULL_H : CTX_H;
    invoke("resize_overlay", { width: W, height: h }).catch(() => {});
    if (view === "toolbar") invoke("center_overlay_top").catch(() => {});
  }, [view]);

  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" }); }, [msgs, aiTxt]);

  // --- ACTIONS ---
  const mic = useCallback(async () => {
    if (on) { await invoke("stop_listening").catch(() => {}); setOn(false); }
    else { try { await invoke("start_listening"); setOn(true); } catch (e) { setMsgs((p) => [...p, { id: ++_id, who: "system", text: String(e) }]); } }
  }, [on]);

  const copyAnswer = useCallback(() => {
    const t = aiTxt || lastAnswer;
    if (t) { navigator.clipboard.writeText(t); setCp(true); setTimeout(() => setCp(false), 1500); }
  }, [aiTxt, lastAnswer]);

  const doAsk = useCallback((q: string) => {
    if (!q.trim()) return;
    setMsgs((p) => [...p, { id: ++_id, who: "me", text: q }]);
    setAiOn(true); setAiTxt(""); setLastAnswer("");
    invoke("generate_answer", { question: q }).catch(() => setAiOn(false));
  }, []);

  const uploadCtx = useCallback(async (n: string, c: string) => {
    try {
      const f = await open({ multiple: false, filters: [{ name: "Docs", extensions: ["txt", "md", "pdf", "doc", "docx"] }] });
      if (!f) return;
      let content: string;
      if ((f as string).endsWith(".pdf")) content = await invoke<string>("parse_pdf", { path: f });
      else content = await readTextFile(f as string);
      if (content) { await invoke(c, { text: content }); setCtx((p) => ({ ...p, [n]: `${content.length.toLocaleString()} chars` })); }
    } catch (e) { setMsgs((p) => [...p, { id: ++_id, who: "system", text: String(e) }]); }
  }, []);

  const pasteCtx = useCallback(async (n: string, c: string) => {
    try { const t = await navigator.clipboard.readText(); if (t) { await invoke(c, { text: t }); setCtx((p) => ({ ...p, [n]: `${t.length.toLocaleString()} chars` })); } } catch (_) {}
  }, []);

  const fetchUrl = useCallback(async () => {
    if (!urlIn.trim()) return; setFetching(true);
    try { const t = await invoke<string>("fetch_url", { url: urlIn }); await invoke("set_company_notes", { text: t }); setCtx((p) => ({ ...p, Company: `Fetched` })); setUrlIn(""); }
    catch (e) { setMsgs((p) => [...p, { id: ++_id, who: "system", text: `Fetch error: ${e}` }]); }
    setFetching(false);
  }, [urlIn]);

  const glow = aiOn ? "glow-p" : on ? "glow-g" : "glow-b";

  return (
    <div className="h-full w-full" data-tauri-drag-region>
      <AnimatePresence mode="wait">

        {/* ==================== TOOLBAR ONLY ==================== */}
        {view === "toolbar" && (
          <motion.div key="tb" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`${glow} glass-toolbar w-full h-full rounded-full flex items-center px-2 gap-1`} data-tauri-drag-region>

            <TBtn label="Listen" color={on ? "#34d399" : "#64748b"} dot={on ? "#34d399" : undefined} onClick={mic} />
            <TBtn label="Stop" color="#f87171" onClick={() => { invoke("stop_listening"); setOn(false); }} />
            <TBtn label="Ask" color="#38bdf8" dot="#38bdf8" onClick={() => setView("full")} />
            <TBtn label="Screenshot" color="#fb923c" onClick={() => invoke("screenshot_ocr", { region: false })} />
            <button onClick={() => setView("full")} className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-500/25 flex items-center justify-center hover:from-cyan-500/40 transition mx-1">
              <Eye className="w-4 h-4 text-cyan-300" />
            </button>
            <TBtn label="Settings" color="#94a3b8" onClick={() => setView("context")} />
            <TBtn label="Quit" color="#94a3b8" onClick={() => { invoke("stop_listening"); setOn(false); }} />
          </motion.div>
        )}

        {/* ==================== FULL PANEL ==================== */}
        {view === "full" && (
          <motion.div key="full" initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className={`${glow} glass-panel w-full h-full rounded-[18px] flex flex-col overflow-hidden relative`}>

            {/* === ROW 1: Top toolbar (like Helvia) === */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-blue-500/8" data-tauri-drag-region>
              <TBtn label="Listen" color={on ? "#34d399" : "#64748b"} dot={on ? "#34d399" : undefined} onClick={mic} small />
              <TBtn label="Stop" color="#f87171" onClick={() => { invoke("stop_listening"); setOn(false); }} small />
              <TBtn label="Ask" color="#38bdf8" dot="#38bdf8" onClick={() => { if (!askTxt) setAskTxt(" "); }} small />
              <TBtn label="Screenshot" color="#fb923c" onClick={() => invoke("screenshot_ocr", { region: false })} small />
              <button className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/25 to-blue-600/25 border border-cyan-500/20 flex items-center justify-center hover:from-cyan-500/35 transition">
                <Eye className="w-3.5 h-3.5 text-cyan-300" />
              </button>
              <TBtn label="Settings" color="#94a3b8" onClick={() => setView("context")} small />
              <TBtn label="Quit" color="#94a3b8" onClick={() => setView("toolbar")} small />
            </div>

            {/* === ROW 2: Feature bar === */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-blue-500/8">
              <span className="text-[13px] font-semibold text-cyan-400/80">Live meeting</span>
              <div className="flex-1" />
              <FBtn label={autoAnswer ? "Auto-answer ON" : "Auto-answer OFF"} active={autoAnswer} onClick={() => setAutoAnswer(!autoAnswer)} />
              <FBtn label="What to say next" active color="teal" onClick={() => doAsk("Based on the conversation, what should I say next?")} />
              <FBtn label="Images" active color="teal" onClick={() => invoke("screenshot_ocr", { region: false })} />
              <FBtn label="Select text" onClick={() => invoke("screenshot_ocr", { region: false })} />
              <button onClick={() => { invoke("stop_listening"); setOn(false); }} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-[11px] text-white/50 font-medium hover:bg-white/8 transition">Stop</button>
              <button onClick={() => setView("toolbar")} className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center hover:bg-white/8 transition">
                <X className="w-3.5 h-3.5 text-white/40" />
              </button>
            </div>

            {/* === ROW 3: Transcript toggle === */}
            <div className="flex items-center gap-3 px-4 py-1.5 border-b border-blue-500/6">
              <span className="text-[12px] text-white/40 font-medium">Transcript</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={showTranscript} onChange={() => setShowTranscript(!showTranscript)} className="sr-only" />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${showTranscript ? "bg-cyan-500 border-cyan-500" : "border-white/20 bg-transparent"}`}>
                  {showTranscript && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-[11px] text-white/30">System Audio Only</span>
              </label>
              <div className="flex-1" />
              <ActionBtn label="Ask" color="cyan" onClick={() => doAsk(askTxt || "What should I say?")} />
              <ActionBtn label="Scenario" color="slate" onClick={() => doAsk("Give me a practice scenario for this interview")} />
              <ActionBtn label="Explain" color="orange" onClick={() => doAsk("Explain the last question in simple terms")} />
              <button onClick={() => setShowTranscript(!showTranscript)} className="px-3 py-1 rounded-lg bg-white/4 border border-white/6 text-[11px] text-white/35 font-medium hover:bg-white/6 transition">
                {showTranscript ? "Hide transcript" : "Show transcript"}
              </button>
            </div>

            {/* === CHAT / TRANSCRIPT AREA === */}
            {showTranscript && (
              <div ref={ref} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {msgs.length === 0 && !aiOn && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
                    <Ghost className="w-10 h-10 text-cyan-400/40" />
                    <p className="text-[14px] text-white/40">{on ? "Listening for conversation..." : "Click Listen to start"}</p>
                    <p className="text-[11px] text-white/20">100% Local AI — Whisper + Ollama</p>
                  </div>
                )}

                {msgs.map((m) => (
                  <div key={m.id} className="fade-up">
                    {/* OTHERS — left aligned */}
                    {m.who === "others" && (
                      <div className="flex flex-col items-start">
                        <span className="text-[11px] text-white/30 font-medium mb-1 ml-1">Others</span>
                        <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-[rgba(30,40,70,0.8)] border border-blue-500/10 px-4 py-2.5">
                          <p className="text-[14px] text-white/70 leading-relaxed">{m.text}</p>
                        </div>
                      </div>
                    )}
                    {/* ME — right aligned */}
                    {m.who === "me" && (
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] text-white/30 font-medium mb-1 mr-1">Me</span>
                        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-gradient-to-br from-blue-600/40 to-blue-700/30 border border-blue-500/20 px-4 py-2.5">
                          <p className="text-[14px] text-white/90 leading-relaxed">{m.text}</p>
                        </div>
                      </div>
                    )}
                    {/* SYSTEM */}
                    {m.who === "system" && (
                      <div className="px-3 py-2 rounded-xl bg-amber-500/8 border border-amber-500/12 text-center">
                        <p className="text-[12px] text-amber-300/60">{m.text}</p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading dots */}
                {aiOn && !aiTxt && (
                  <div className="flex items-center gap-2 py-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3], y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Non-transcript mode — just show empty space */}
            {!showTranscript && <div className="flex-1" />}

            {/* === WHAT TO SAY NEXT (Answer card) === */}
            {(aiTxt || lastAnswer) && (
              <div className="mx-3 mb-2 rounded-2xl bg-gradient-to-br from-[rgba(15,25,50,0.95)] to-[rgba(10,18,38,0.98)] border border-blue-500/15 p-4 shadow-[0_-4px_30px_rgba(0,20,60,0.3)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-[13px] font-bold text-cyan-400/90">What to say next</span>
                    {aiOn && <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }} className="w-2 h-2 rounded-full bg-cyan-400" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={copyAnswer} className="px-3 py-1 rounded-lg bg-white/5 border border-white/8 text-[11px] text-white/50 font-medium hover:bg-white/10 transition flex items-center gap-1">
                      {cp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {cp ? "Copied" : "Copy"}
                    </button>
                    <button onClick={() => doAsk("Expand on the previous answer with more details")} className="px-3 py-1 rounded-lg bg-white/5 border border-white/8 text-[11px] text-white/50 font-medium hover:bg-white/10 transition">
                      Say more
                    </button>
                  </div>
                </div>
                <p className="text-[15px] text-white/85 leading-[1.75]">
                  {aiTxt || lastAnswer}
                  {aiOn && <span className="blink inline-block w-[2px] h-[16px] bg-cyan-400 ml-1 align-middle" />}
                </p>
              </div>
            )}

            {/* === INPUT BAR === */}
            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 rounded-xl bg-[rgba(15,25,50,0.6)] border border-blue-500/10 px-3 py-2 focus-within:border-cyan-500/25 transition">
                <input value={askTxt} onChange={(e) => setAskTxt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { doAsk(askTxt); setAskTxt(""); } }}
                  placeholder="Ask anything about the interview or conversation..."
                  className="flex-1 bg-transparent text-[13px] text-white/80 placeholder-white/25" />
                {askTxt.trim() && (
                  <button onClick={() => { doAsk(askTxt); setAskTxt(""); }} className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center hover:shadow-[0_0_15px_rgba(56,140,255,0.3)] transition">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Resize indicator */}
            <div className="resize-handle" />
          </motion.div>
        )}

        {/* ==================== CONTEXT / SETTINGS ==================== */}
        {view === "context" && (
          <motion.div key="ctx" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.2 }}
            className="glow-b glass-panel w-full h-full rounded-[18px] flex flex-col overflow-hidden">
            <div className="flex items-center px-4 py-3 border-b border-blue-500/8" data-tauri-drag-region>
              <button onClick={() => setView("full")} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-500/10 transition mr-2">
                <ChevronLeft className="w-5 h-5 text-cyan-300/50" />
              </button>
              <span className="text-[15px] font-bold text-white/85">Interview Setup</span>
              <div className="flex-1" />
              <button onClick={() => setView("full")} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition">
                <X className="w-4 h-4 text-white/30" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
              {/* UPLOADS */}
              <Sec title="Upload Context" desc="PDF, TXT, or paste — for better answers">
                {([["Resume", "set_resume", "\uD83D\uDCC4"], ["Job Description", "set_job_description", "\uD83D\uDCCB"], ["Company Notes", "set_company_notes", "\uD83C\uDFE2"]] as const).map(([n, c, ic]) => (
                  <div key={n} className="rounded-xl bg-[rgba(15,25,50,0.5)] border border-blue-500/8 p-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{ic}</span>
                      <span className="text-[13px] text-white/70 font-semibold flex-1">{n}</span>
                      {ctx[n] && <span className="text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full font-semibold">{ctx[n]}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => uploadCtx(n, c)} className="flex-1 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/15 text-[12px] font-semibold text-cyan-300/80 hover:bg-cyan-500/15 transition flex items-center justify-center gap-1.5">
                        <FileUp className="w-3.5 h-3.5" /> Upload File
                      </button>
                      <button onClick={() => pasteCtx(n, c)} className="flex-1 py-2 rounded-lg bg-blue-500/10 border border-blue-500/15 text-[12px] font-semibold text-blue-300/80 hover:bg-blue-500/15 transition flex items-center justify-center gap-1.5">
                        <ClipboardPaste className="w-3.5 h-3.5" /> Paste
                      </button>
                    </div>
                  </div>
                ))}
              </Sec>
              {/* URL */}
              <Sec title="Company Research" desc="Paste URL — auto-fetch company info">
                <div className="rounded-xl bg-[rgba(15,25,50,0.5)] border border-blue-500/8 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 rounded-lg bg-white/3 border border-white/5 px-3 py-2">
                    <Link className="w-4 h-4 text-cyan-400/50 flex-shrink-0" />
                    <input value={urlIn} onChange={(e) => setUrlIn(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchUrl()}
                      placeholder="https://company.com or job posting URL..."
                      className="flex-1 bg-transparent text-[13px] text-white/70 placeholder-white/20" />
                  </div>
                  <button onClick={fetchUrl} disabled={fetching || !urlIn}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-600/20 to-blue-500/15 border border-cyan-500/15 text-[13px] font-semibold text-cyan-300/80 hover:from-cyan-600/30 transition disabled:opacity-30">
                    {fetching ? "Fetching..." : "Fetch & Analyze"}
                  </button>
                  {ctx.Company && <p className="text-[11px] text-emerald-400/70 flex items-center gap-1"><Check className="w-3 h-3" /> {ctx.Company}</p>}
                </div>
              </Sec>
              {/* ENGINE */}
              <Sec title="AI Engine" desc="100% local, zero cost">
                <SRow l="Speech-to-Text" v="Whisper base.en" ok />
                <SRow l="Language Model" v="Llama 3.1 8B" ok />
                <SRow l="Screen OCR" v="macOS Vision" ok />
              </Sec>
              {/* STEALTH */}
              <Sec title="Privacy" desc="Invisible to screen share">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/12">
                  <div className="flex items-center gap-2"><EyeOff className="w-4 h-4 text-emerald-400" /><span className="text-[13px] text-emerald-300/90">Screen share protection</span></div>
                  <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase">Active</span>
                </div>
              </Sec>
            </div>
            <div className="px-4 py-2 border-t border-blue-500/6 text-center">
              <span className="text-[10px] text-cyan-400/15">Phantom AI v0.1.0</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// === TOOLBAR BUTTON (Helvia-style) ===
function TBtn({ label, color, dot, onClick, small }: { label: string; color: string; dot?: string; onClick: () => void; small?: boolean }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 ${small ? "px-2.5 py-1" : "px-3 py-1.5"} rounded-full bg-[rgba(20,30,55,0.8)] border border-white/8 hover:bg-[rgba(30,45,75,0.8)] hover:border-white/12 transition active:scale-95`}>
      {dot && <div className="w-2 h-2 rounded-full pulse-dot" style={{ backgroundColor: dot }} />}
      <span className={`${small ? "text-[11px]" : "text-[12px]"} font-semibold`} style={{ color }}>{label}</span>
    </button>
  );
}

// === FEATURE BAR BUTTON ===
function FBtn({ label, active, color, onClick }: { label: string; active?: boolean; color?: string; onClick: () => void }) {
  const bg = active
    ? color === "teal" ? "bg-gradient-to-r from-cyan-600/30 to-teal-500/25 border-cyan-500/25 text-cyan-200" : "bg-white/8 border-white/10 text-white/60"
    : "bg-white/4 border-white/6 text-white/35";
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold hover:bg-white/8 transition ${bg}`}>{label}</button>
  );
}

// === ACTION BUTTON (Ask/Scenario/Explain) ===
function ActionBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  const c: Record<string, string> = {
    cyan: "bg-gradient-to-r from-cyan-600/30 to-cyan-500/20 border-cyan-500/25 text-cyan-200",
    slate: "bg-white/6 border-white/10 text-white/60",
    orange: "bg-gradient-to-r from-orange-600/30 to-orange-500/20 border-orange-500/25 text-orange-200",
  };
  return <button onClick={onClick} className={`px-4 py-1.5 rounded-full border text-[12px] font-bold transition hover:brightness-110 ${c[color]}`}>{label}</button>;
}

// === SETTINGS COMPONENTS ===
function Sec({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return <div><div className="mb-3"><p className="text-[14px] text-white/80 font-bold">{title}</p><p className="text-[11px] text-cyan-300/25">{desc}</p></div><div className="space-y-2.5">{children}</div></div>;
}
function SRow({ l, v, ok }: { l: string; v: string; ok?: boolean }) {
  return <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(15,25,50,0.5)] border border-blue-500/8"><span className="text-[13px] text-white/50">{l}</span><div className="flex items-center gap-2">{ok && <div className="w-2 h-2 rounded-full bg-emerald-400" />}<span className="text-[12px] text-white/35">{v}</span></div></div>;
}
