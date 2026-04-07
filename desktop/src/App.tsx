import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ghost, Mic, MicOff, Camera, SlidersHorizontal, ChevronUp, ChevronDown,
  Copy, Check, Sparkles, Pencil, MessageSquare, Zap, HelpCircle,
  RefreshCw, Upload, X, EyeOff, MousePointer2Off, ArrowRight,
} from "lucide-react";
import "./App.css";

// Window sizes
const W = 600;
const PILL_H = 52;
const PANEL_H = 520;
const SETTINGS_H = 480;

type View = "pill" | "panel" | "settings";

interface Msg {
  id: number;
  type: "question" | "answer" | "info";
  text: string;
}

let _id = 0;

export default function App() {
  const [view, setView] = useState<View>("pill");
  const [listening, setListening] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [_status, setStatus] = useState("Ready");
  const [passthrough, setPassthrough] = useState(false);
  const [askText, setAskText] = useState("");
  const [contextLoaded, setContextLoaded] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // ---- EVENTS ----
  useEffect(() => {
    const u: (() => void)[] = [];

    listen<{ text: string; is_final: boolean }>("transcript", (e) => {
      const t = e.payload.text.trim();
      if (t.length > 3) {
        setTranscript((p) => [...p.slice(-8), t]);
        if (e.payload.is_final && t.length > 5) {
          setMessages((p) => [...p, { id: ++_id, type: "question", text: t }]);
          if (view === "pill") setView("panel");
        }
      }
    }).then((x) => u.push(x));

    listen<{ text: string; is_done: boolean }>("ai_response", (e) => {
      if (e.payload.is_done) {
        setStreaming(false);
        setStreamText((prev) => {
          if (prev) setMessages((m) => [...m, { id: ++_id, type: "answer", text: prev }]);
          return "";
        });
      } else {
        setStreaming(true);
        setStreamText((p) => p + e.payload.text);
      }
    }).then((x) => u.push(x));

    listen<{ message: string }>("status", (e) => setStatus(e.payload.message)).then((x) => u.push(x));

    listen<{ message: string }>("ai_generating", (e) => {
      setStreaming(true);
      setStreamText("");
      invoke("generate_answer", { question: e.payload.message }).catch(() => setStreaming(false));
    }).then((x) => u.push(x));

    return () => u.forEach((f) => f());
  }, [view]);

  // ---- RESIZE ----
  useEffect(() => {
    const h = view === "pill" ? PILL_H : view === "panel" ? PANEL_H : SETTINGS_H;
    invoke("resize_overlay", { width: W, height: h }).catch(() => {});
    if (view === "pill") invoke("center_overlay_top").catch(() => {});
  }, [view]);

  // ---- SCROLL ----
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamText]);

  // ---- ACTIONS ----
  const toggleMic = useCallback(async () => {
    if (listening) {
      await invoke("stop_listening").catch(() => {});
      setListening(false);
    } else {
      try { await invoke("start_listening"); setListening(true); } catch (e) {
        setMessages((p) => [...p, { id: ++_id, type: "info", text: String(e) }]);
      }
    }
  }, [listening]);

  const copyLast = useCallback(() => {
    const a = [...messages].reverse().find((m) => m.type === "answer");
    if (a || streamText) { navigator.clipboard.writeText(a?.text || streamText); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  }, [messages, streamText]);

  const quickAction = useCallback((prompt: string) => {
    const lastQ = [...messages].reverse().find((m) => m.type === "question");
    if (lastQ) {
      setStreaming(true); setStreamText("");
      invoke("generate_answer", { question: `${prompt}: "${lastQ.text}"` }).catch(() => setStreaming(false));
    }
  }, [messages]);

  const askCustom = useCallback(() => {
    if (!askText.trim()) return;
    setMessages((p) => [...p, { id: ++_id, type: "question", text: askText }]);
    setStreaming(true); setStreamText("");
    invoke("generate_answer", { question: askText }).catch(() => setStreaming(false));
    setAskText("");
  }, [askText]);

  const uploadFile = useCallback(async (name: string, cmd: string) => {
    try {
      const f = await open({ multiple: false, filters: [{ name: "Text", extensions: ["txt", "md"] }] });
      if (f) { const c = await readTextFile(f as string); await invoke(cmd, { text: c }); setContextLoaded((p) => ({ ...p, [name]: true })); }
    } catch (_) {}
  }, []);

  const glow = streaming ? "glow-ai" : listening ? "glow-listen" : "glow-idle";
  const shell = "bg-[rgba(18,18,28,0.88)] backdrop-blur-[20px] backdrop-saturate-[140%]";

  return (
    <div className="h-full w-full" data-tauri-drag-region>
      <AnimatePresence mode="wait">

        {/* ====================== TOP PILL ====================== */}
        {view === "pill" && (
          <motion.div key="pill"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className={`${glow} ${shell} w-full h-full rounded-full border border-white/[0.08] flex items-center px-2 gap-1`}
            data-tauri-drag-region
          >
            {/* Logo */}
            <button onClick={toggleMic} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors relative">
              <Ghost className="w-5 h-5 text-violet-400" />
              {listening && <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 pulse-soft" />}
            </button>

            {/* Expand / Status */}
            <button onClick={() => setView("panel")} className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-white/[0.04] transition-colors">
              {listening ? (
                <div className="flex items-end gap-[2.5px] h-4">
                  {[0,1,2,3,4,5].map((i) => (
                    <motion.div key={i}
                      animate={{ height: [3, 14 + Math.random() * 5, 3] }}
                      transition={{ duration: 0.3 + Math.random() * 0.25, repeat: Infinity, delay: i * 0.05 }}
                      className="w-[2.5px] rounded-full bg-gradient-to-t from-emerald-500 to-emerald-300"
                    />
                  ))}
                </div>
              ) : streaming ? (
                <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
              ) : null}
              <span className="text-[13px] font-medium text-white/70 truncate">
                {streaming ? "Generating answer..." : listening ? "Listening..." : "Phantom AI"}
              </span>
            </button>

            {/* Show/Hide */}
            <button onClick={() => setView("panel")} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
              <ChevronDown className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[12px] font-medium text-white/40">Show</span>
            </button>

            {/* Quit */}
            <button onClick={() => { invoke("stop_listening").catch(() => {}); setListening(false); }}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-500/10 transition-colors group">
              <div className="w-3.5 h-3.5 rounded-[3px] bg-white/20 group-hover:bg-red-400 transition-colors" />
            </button>
          </motion.div>
        )}

        {/* ====================== MAIN PANEL ====================== */}
        {view === "panel" && (
          <motion.div key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className={`${glow} ${shell} w-full h-full rounded-[24px] border border-white/[0.08] flex flex-col overflow-hidden`}
          >
            {/* ---- TOP PILL BAR ---- */}
            <div className="flex items-center justify-center gap-2 pt-2.5 pb-1" data-tauri-drag-region>
              <button onClick={toggleMic} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors relative">
                <Ghost className="w-4 h-4 text-violet-400" />
                {listening && <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-400 pulse-soft" />}
              </button>
              <button onClick={() => setView("pill")} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
                <ChevronUp className="w-3.5 h-3.5 text-white/40" />
                <span className="text-[12px] font-medium text-white/40">Hide</span>
              </button>
              <button onClick={() => { invoke("stop_listening").catch(() => {}); setListening(false); }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500/10 transition-colors group">
                <div className="w-3 h-3 rounded-[2px] bg-white/20 group-hover:bg-red-400 transition-colors" />
              </button>
            </div>

            {/* ---- ROLLING TRANSCRIPT ---- */}
            {transcript.length > 0 && (
              <div className="transcript-mask mx-4 mb-1 overflow-hidden whitespace-nowrap">
                <div className="scroll-text inline-flex gap-3 text-[13px] italic text-white/25 leading-7">
                  {[...transcript, ...transcript].map((t, i) => (
                    <span key={i} className="flex items-center gap-2">
                      {listening && i === 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse flex-shrink-0" />}
                      {t}
                      <span className="text-white/10">·</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ---- CHAT AREA ---- */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-3" style={{ scrollbarWidth: "none" }}>
              {messages.length === 0 && !streaming && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={toggleMic}
                    className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      listening ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/[0.08] bg-white/[0.03] hover:border-violet-500/20 hover:bg-violet-500/[0.06]"
                    }`}
                  >
                    {listening ? (
                      <div className="flex items-end gap-[3px] h-8">
                        {[0,1,2,3,4,5,6].map((i) => (
                          <motion.div key={i}
                            animate={{ height: [4, 24 + Math.random() * 8, 4] }}
                            transition={{ duration: 0.3 + Math.random() * 0.2, repeat: Infinity, delay: i * 0.04 }}
                            className="w-[3px] rounded-full bg-gradient-to-t from-emerald-500 to-emerald-300"
                          />
                        ))}
                      </div>
                    ) : (
                      <Mic className="w-8 h-8 text-white/30" />
                    )}
                  </motion.button>
                  <p className="text-[13px] text-white/30">{listening ? "Listening for questions..." : "Tap to start"}</p>
                  <p className="text-[11px] text-white/15">Local AI — Whisper + Ollama</p>
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id} className="fade-up">
                  {m.type === "question" && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-[18px] rounded-tl-[4px] bg-white/[0.04] border border-white/[0.06] px-4 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-white/25 font-medium mb-1">Interviewer</p>
                        <p className="text-[13px] text-white/50 italic leading-relaxed">&ldquo;{m.text}&rdquo;</p>
                      </div>
                    </div>
                  )}
                  {m.type === "answer" && (
                    <div className="flex justify-start group">
                      <div className="max-w-[85%] rounded-[18px] rounded-tl-[4px] bg-emerald-500/[0.06] border border-emerald-500/[0.1] px-4 py-3 relative">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] uppercase tracking-wider text-emerald-400/70 font-semibold">Say This</span>
                        </div>
                        <p className="text-[14px] text-white/80 leading-[1.65]">{m.text}</p>
                        <button onClick={copyLast}
                          className="absolute top-2 right-2 p-1 rounded-md bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity">
                          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-white/30" />}
                        </button>
                      </div>
                    </div>
                  )}
                  {m.type === "info" && (
                    <div className="px-3 py-2 rounded-xl bg-amber-500/[0.04] border border-amber-500/[0.08]">
                      <p className="text-[11px] text-amber-400/60">{m.text}</p>
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming */}
              {streaming && streamText && (
                <div className="fade-up flex justify-start">
                  <div className="max-w-[85%] rounded-[18px] rounded-tl-[4px] bg-violet-500/[0.06] border border-violet-500/[0.1] px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                      <span className="text-[10px] uppercase tracking-wider text-violet-400/70 font-semibold">Thinking</span>
                    </div>
                    <p className="text-[14px] text-white/80 leading-[1.65]">
                      {streamText}<span className="cursor-blink inline-block w-[2px] h-[15px] bg-violet-400 ml-0.5 align-middle" />
                    </p>
                  </div>
                </div>
              )}
              {streaming && !streamText && (
                <div className="flex items-center gap-2 py-2">
                  {[0,1,2].map((i) => (
                    <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      className="w-2 h-2 rounded-full bg-emerald-400" />
                  ))}
                  <span className="text-[11px] text-emerald-400/50">Generating...</span>
                </div>
              )}
            </div>

            {/* ---- QUICK ACTIONS ---- */}
            {messages.length > 0 && (
              <div className="flex items-center justify-center gap-1.5 px-4 py-2">
                <ActionChip icon={Pencil} label="What to answer?" onClick={() => quickAction("Give me the best answer for this interview question")} />
                <ActionChip icon={MessageSquare} label="Clarify" onClick={() => quickAction("Clarify and simplify this question")} />
                <ActionChip icon={RefreshCw} label="Recap" onClick={() => quickAction("Give a brief recap of the conversation so far")} />
                <ActionChip icon={HelpCircle} label="Follow-up" onClick={() => quickAction("What follow-up questions might they ask about")} />
                <ActionChip icon={Camera} label="Screen" onClick={() => invoke("screenshot_ocr", { region: false }).catch(() => {})} />
              </div>
            )}

            {/* ---- TEXT INPUT ---- */}
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                <input
                  type="text"
                  value={askText}
                  onChange={(e) => setAskText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askCustom()}
                  placeholder="Ask anything about screen or conversation..."
                  className="flex-1 bg-transparent text-[13px] text-white/70 placeholder-white/20 outline-none"
                />
                {askText ? (
                  <button onClick={askCustom} className="w-7 h-7 rounded-full bg-[#007AFF] flex items-center justify-center hover:bg-[#0071E3] transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>
                ) : (
                  <span className="text-[10px] text-white/15 font-mono">enter</span>
                )}
              </div>
            </div>

            {/* ---- BOTTOM BAR ---- */}
            <div className="flex items-center px-4 py-2 border-t border-white/[0.04]">
              {/* Left: model + settings + passthrough */}
              <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors mr-2">
                <Zap className="w-3 h-3 text-violet-400" />
                <span className="text-[11px] text-white/40 font-medium">Llama 3.1</span>
              </button>
              <div className="w-px h-3 bg-white/[0.06] mx-1" />
              <button onClick={() => setView("settings")} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] transition-colors">
                <SlidersHorizontal className="w-3.5 h-3.5 text-white/25" />
              </button>
              <div className="w-px h-3 bg-white/[0.06] mx-1" />
              <button onClick={() => { setPassthrough(!passthrough); invoke("set_click_through", { enabled: !passthrough }).catch(() => {}); }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${passthrough ? "bg-sky-500/10" : "hover:bg-white/[0.06]"}`}>
                <MousePointer2Off className={`w-3.5 h-3.5 ${passthrough ? "text-sky-400" : "text-white/25"}`} />
              </button>

              <div className="flex-1" />

              {/* Right: mic toggle */}
              <button onClick={toggleMic}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                  listening
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1]"
                }`}
              >
                {listening ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-white/30" />}
                <span className={`text-[11px] font-medium ${listening ? "text-emerald-400" : "text-white/30"}`}>
                  {listening ? "Listening" : "Start"}
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ====================== SETTINGS ====================== */}
        {view === "settings" && (
          <motion.div key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className={`${shell} glow-idle w-full h-full rounded-[24px] border border-white/[0.08] flex flex-col overflow-hidden`}
          >
            <div className="flex items-center px-4 py-3 border-b border-white/[0.04]" data-tauri-drag-region>
              <button onClick={() => setView("panel")} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.06] transition-colors mr-2">
                <ChevronUp className="w-4 h-4 text-white/30 -rotate-90" />
              </button>
              <span className="text-[14px] font-semibold text-white/80">Settings</span>
              <div className="flex-1" />
              <button onClick={() => setView("panel")} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.06] transition-colors">
                <X className="w-4 h-4 text-white/30" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
              {/* AI Engine */}
              <Section title="AI Engine" desc="Fully local, zero cost">
                <Row label="Speech-to-Text" value="Whisper base.en" ok />
                <Row label="Language Model" value="Llama 3.1 8B" ok />
                <Row label="Data Privacy" value="100% offline" ok />
              </Section>

              {/* Context */}
              <Section title="Interview Context" desc="Upload for personalized answers">
                {[
                  { n: "Resume", c: "set_resume" },
                  { n: "Job Description", c: "set_job_description" },
                  { n: "Company Notes", c: "set_company_notes" },
                ].map((f) => (
                  <button key={f.n} onClick={() => uploadFile(f.n, f.c)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-violet-500/15 hover:bg-violet-500/[0.03] transition-all group">
                    {contextLoaded[f.n] ? <Check className="w-4 h-4 text-emerald-400" /> : <Upload className="w-4 h-4 text-white/20 group-hover:text-violet-400 transition-colors" />}
                    <span className="text-[13px] text-white/60 flex-1">{f.n}</span>
                    <span className="text-[10px] text-white/20">{contextLoaded[f.n] ? "Loaded" : ".txt"}</span>
                  </button>
                ))}
              </Section>

              {/* Stealth */}
              <Section title="Stealth" desc="Invisible to screen share">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/[0.08]">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-emerald-400" />
                    <span className="text-[13px] text-emerald-400">Screen share protection</span>
                  </div>
                  <span className="text-[11px] text-emerald-400/60 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">Active</span>
                </div>
              </Section>

              {/* Shortcuts */}
              <Section title="Shortcuts" desc="Quick access anywhere">
                <KBD action="Toggle overlay" keys="Cmd+Shift+P" />
                <KBD action="Screenshot OCR" keys="Cmd+Shift+S" />
              </Section>
            </div>

            <div className="px-4 py-2.5 border-t border-white/[0.04] text-center">
              <span className="text-[10px] text-white/12">Phantom AI v0.1.0</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- SMALL COMPONENTS ----

function ActionChip({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium text-white/30 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:text-white/50 active:scale-95 transition-all duration-150">
      <Icon className="w-3 h-3" />{label}
    </button>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[13px] text-white/70 font-semibold">{title}</p>
      <p className="text-[11px] text-white/25 mb-3">{desc}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
      <span className="text-[13px] text-white/50">{label}</span>
      <div className="flex items-center gap-2">
        {ok && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
        <span className="text-[12px] text-white/35">{value}</span>
      </div>
    </div>
  );
}

function KBD({ action, keys }: { action: string; keys: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
      <span className="text-[13px] text-white/50">{action}</span>
      <kbd className="text-[11px] text-white/25 bg-white/[0.04] px-2 py-0.5 rounded-md font-mono">{keys}</kbd>
    </div>
  );
}
