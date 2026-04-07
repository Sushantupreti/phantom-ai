import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ghost,
  Mic,
  MicOff,
  EyeOff,
  Camera,
  Settings,
  Minimize2,
  Maximize2,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import "./App.css";

const COLLAPSED_WIDTH = 220;
const COLLAPSED_HEIGHT = 44;
const EXPANDED_WIDTH = 480;
const EXPANDED_HEIGHT = 380;
const SETTINGS_HEIGHT = 480;

type ViewMode = "collapsed" | "expanded" | "settings";

interface Message {
  role: "interviewer" | "phantom" | "status";
  text: string;
  isStreaming?: boolean;
}

function TypewriterText({ text }: { text: string }) {
  return <span>{text}<span className="cursor-blink inline-block w-[2px] h-[13px] bg-violet-400 ml-0.5 align-middle" /></span>;
}

export default function App() {
  const [mode, setMode] = useState<ViewMode>("collapsed");
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [opacity, setOpacityVal] = useState(0.95);
  const [clickThrough, setClickThroughVal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState("Ready — Local AI (Whisper + Ollama)");
  const [currentAIResponse, setCurrentAIResponse] = useState("");
  const [isAIStreaming, setIsAIStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen to backend events
  useEffect(() => {
    const unlisteners: (() => void)[] = [];

    listen<{ text: string; is_final: boolean; speaker: string }>("transcript", (event) => {
      const { text, is_final } = event.payload;
      if (is_final && text.length > 3) {
        setMessages((prev) => [
          ...prev,
          { role: "interviewer", text },
        ]);
        // Auto-expand when we get a transcript
        setMode("expanded");
      }
    }).then((u) => unlisteners.push(u));

    listen<{ text: string; is_done: boolean }>("ai_response", (event) => {
      const { text, is_done } = event.payload;
      if (is_done) {
        setIsAIStreaming(false);
        setCurrentAIResponse((prev) => {
          if (prev) {
            setMessages((msgs) => [...msgs, { role: "phantom", text: prev }]);
          }
          return "";
        });
      } else {
        setIsAIStreaming(true);
        setCurrentAIResponse((prev) => prev + text);
      }
    }).then((u) => unlisteners.push(u));

    listen<{ status: string; message: string }>("status", (event) => {
      setStatus(event.payload.message);
    }).then((u) => unlisteners.push(u));

    listen<{ status: string; message: string }>("ai_generating", (event) => {
      setIsAIStreaming(true);
      setCurrentAIResponse("");
      // Auto-trigger AI response
      invoke("generate_answer", { question: event.payload.message }).catch((e) => {
        console.error("AI error:", e);
        setIsAIStreaming(false);
      });
    }).then((u) => unlisteners.push(u));

    return () => { unlisteners.forEach((u) => u()); };
  }, []);

  // Resize window on mode change
  useEffect(() => {
    let w = COLLAPSED_WIDTH, h = COLLAPSED_HEIGHT;
    if (mode === "expanded") { w = EXPANDED_WIDTH; h = EXPANDED_HEIGHT; }
    else if (mode === "settings") { w = EXPANDED_WIDTH; h = SETTINGS_HEIGHT; }
    invoke("resize_overlay", { width: w, height: h }).catch(() => {});
    if (mode === "collapsed") invoke("center_overlay_top").catch(() => {});
  }, [mode]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentAIResponse]);

  const handleCopy = useCallback(() => {
    const lastPhantom = messages.filter((m) => m.role === "phantom").pop();
    if (lastPhantom) {
      navigator.clipboard.writeText(lastPhantom.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [messages]);

  const toggleListening = useCallback(async () => {
    if (isListening) {
      await invoke("stop_listening").catch(() => {});
      setIsListening(false);
    } else {
      try {
        await invoke("start_listening");
        setIsListening(true);
      } catch (e) {
        setStatus(String(e));
        setMessages((prev) => [...prev, { role: "status", text: `Error: ${e}` }]);
      }
    }
  }, [isListening]);

  const handleOpacity = useCallback(async (val: number) => {
    setOpacityVal(val);
    await invoke("set_opacity", { opacity: val }).catch(() => {});
  }, []);

  const handleClickThrough = useCallback(async (val: boolean) => {
    setClickThroughVal(val);
    await invoke("set_click_through", { enabled: val }).catch(() => {});
  }, []);

  return (
    <div className="h-full w-full" data-tauri-drag-region>
      <AnimatePresence mode="wait">
        {/* ===== COLLAPSED ===== */}
        {mode === "collapsed" && (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="island-glow w-full h-full rounded-[22px] bg-[#0f0f1f]/95 backdrop-blur-2xl border border-violet-500/20 flex items-center px-4 cursor-pointer"
            onClick={() => setMode("expanded")}
            data-tauri-drag-region
          >
            <Ghost className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <span className="ml-2 text-xs font-semibold text-violet-400 flex-shrink-0">Phantom</span>
            <div className="flex-1" />
            {isListening && (
              <div className="flex items-end gap-[2px] h-3 mr-3">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div key={i}
                    animate={{ height: [3, 10 + Math.random() * 4, 3] }}
                    transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.08 }}
                    className="w-[2px] bg-gradient-to-t from-violet-500 to-cyan-400 rounded-full"
                  />
                ))}
              </div>
            )}
            <div className="relative w-2 h-2 mr-1">
              <div className="live-dot absolute inset-0" />
              <div className={`w-2 h-2 rounded-full ${isListening ? "bg-emerald-400" : "bg-gray-500"}`} />
            </div>
          </motion.div>
        )}

        {/* ===== EXPANDED ===== */}
        {mode === "expanded" && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="island-glow w-full h-full rounded-[20px] bg-[#0f0f1f]/95 backdrop-blur-2xl border border-violet-500/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center px-4 py-2.5 border-b border-white/5" data-tauri-drag-region>
              <Ghost className="w-4 h-4 text-violet-400" />
              <span className="ml-2 text-xs font-semibold text-violet-400">Phantom AI</span>
              {isListening && (
                <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Live</span>
              )}
              <div className="flex-1" />
              <button onClick={handleCopy} className="p-1 rounded-md hover:bg-white/5 transition-colors mr-1" title="Copy">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" />}
              </button>
              <button onClick={toggleListening} className="p-1 rounded-md hover:bg-white/5 transition-colors mr-1" title="Mic">
                {isListening ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-gray-500" />}
              </button>
              <button onClick={() => invoke("screenshot_ocr", { region: false }).catch(console.error)} className="p-1 rounded-md hover:bg-white/5 transition-colors mr-1" title="Screenshot OCR (Cmd+Shift+S)">
                <Camera className="w-3.5 h-3.5 text-gray-500 hover:text-cyan-400" />
              </button>
              <button onClick={() => setMode("settings")} className="p-1 rounded-md hover:bg-white/5 transition-colors mr-1">
                <Settings className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" />
              </button>
              <button onClick={() => setMode("collapsed")} className="p-1 rounded-md hover:bg-white/5 transition-colors">
                <Minimize2 className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && !isAIStreaming && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                  <Ghost className="w-8 h-8 text-violet-400/30 mb-3" />
                  <p className="text-xs text-gray-500">
                    {isListening
                      ? "Listening for questions..."
                      : "Click the mic to start listening"}
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === "interviewer" && (
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[8px] text-blue-400 font-bold">Q</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Interviewer</p>
                        <p className="text-xs text-gray-400 leading-relaxed">&quot;{msg.text}&quot;</p>
                      </div>
                    </div>
                  )}
                  {msg.role === "phantom" && (
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-2.5 h-2.5 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-violet-400 mb-0.5 font-medium">Phantom AI</p>
                        <p className="text-xs text-gray-300 leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  )}
                  {msg.role === "status" && (
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      <p className="text-[10px] text-amber-400">{msg.text}</p>
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming AI response */}
              {isAIStreaming && currentAIResponse && (
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-violet-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] text-violet-400 mb-0.5 font-medium">Phantom AI</p>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      <TypewriterText text={currentAIResponse} />
                    </p>
                  </div>
                </div>
              )}

              {isAIStreaming && !currentAIResponse && (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                  <span className="text-[10px] text-gray-500">Generating answer...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isListening && (
                  <div className="flex items-center gap-1">
                    <div className="flex items-end gap-[1px] h-2.5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div key={i}
                          animate={{ height: [2, 8 + Math.random() * 3, 2] }}
                          transition={{ duration: 0.3 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.06 }}
                          className="w-[1.5px] bg-gradient-to-t from-violet-500 to-cyan-400 rounded-full"
                        />
                      ))}
                    </div>
                    <span className="text-[9px] text-gray-500">Listening...</span>
                  </div>
                )}
                {!isListening && <span className="text-[9px] text-gray-600">{status}</span>}
              </div>
              <span className="text-[9px] text-gray-600">Cmd+Shift+P</span>
            </div>
          </motion.div>
        )}

        {/* ===== SETTINGS ===== */}
        {mode === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="island-glow w-full h-full rounded-[20px] bg-[#0f0f1f]/95 backdrop-blur-2xl border border-violet-500/20 flex flex-col overflow-hidden"
          >
            <div className="flex items-center px-4 py-2.5 border-b border-white/5" data-tauri-drag-region>
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="ml-2 text-xs font-semibold text-gray-300">Settings</span>
              <div className="flex-1" />
              <button onClick={() => setMode("expanded")} className="p-1 rounded-md hover:bg-white/5 transition-colors">
                <Maximize2 className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {/* API Keys */}
              <div>
                <label className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5 mb-2">
                  Local AI Engine
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-emerald-400 flex-1">Whisper STT (Local)</span>
                    <span className="text-[8px] text-gray-500">base.en</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-emerald-400 flex-1">Ollama LLM (Local)</span>
                    <span className="text-[8px] text-gray-500">llama3.1:8b</span>
                  </div>
                  <p className="text-[9px] text-gray-600 text-center">100% offline — zero API costs — your data never leaves your Mac</p>
                </div>
              </div>

              {/* Opacity */}
              <div>
                <label className="text-[11px] text-gray-400 font-medium block mb-2">Overlay Opacity</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0.3" max="1" step="0.05" value={opacity}
                    onChange={(e) => handleOpacity(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-[10px] text-gray-500 w-8 text-right">{Math.round(opacity * 100)}%</span>
                </div>
              </div>

              {/* Click-through */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Click-Through Mode</p>
                  <p className="text-[9px] text-gray-600 mt-0.5">Clicks pass through to windows below</p>
                </div>
                <button onClick={() => handleClickThrough(!clickThrough)}
                  className={`w-9 h-5 rounded-full transition-colors flex items-center ${clickThrough ? "bg-violet-500 justify-end" : "bg-white/10 justify-start"}`}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm mx-[3px]" />
                </button>
              </div>

              {/* Stealth */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Stealth Mode</p>
                  <p className="text-[9px] text-gray-600 mt-0.5">Hidden from screen share</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <EyeOff className="w-3 h-3 text-emerald-400" />
                  <span className="text-[9px] text-emerald-400">Active</span>
                </div>
              </div>

              {/* Context */}
              <div>
                <label className="text-[11px] text-gray-400 font-medium block mb-2">Context</label>
                <div className="space-y-2">
                  {[
                    { name: "Resume", icon: "\uD83D\uDCC4", cmd: "set_resume" },
                    { name: "Job Description", icon: "\uD83D\uDCCB", cmd: "set_job_description" },
                    { name: "Company Notes", icon: "\uD83C\uDFE2", cmd: "set_company_notes" },
                  ].map((item) => (
                    <div key={item.name}
                      onClick={async () => {
                        try {
                          const file = await open({ multiple: false, filters: [{ name: "Text", extensions: ["txt", "md", "pdf"] }] });
                          if (file) {
                            const content = await readTextFile(file as string);
                            await invoke(item.cmd, { text: content });
                            setStatus(`${item.name} loaded (${content.length} chars)`);
                          }
                        } catch (e) { console.error(e); }
                      }}
                      className="flex items-center gap-2 p-2 rounded-lg border border-white/5 bg-white/[0.02] hover:border-violet-500/10 hover:bg-violet-500/5 cursor-pointer transition-all"
                    >
                      <span className="text-xs">{item.icon}</span>
                      <span className="text-[10px] text-gray-300 flex-1">{item.name}</span>
                      <span className="text-[8px] text-violet-400">Upload .txt</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shortcuts */}
              <div>
                <label className="text-[11px] text-gray-400 font-medium block mb-2">Keyboard Shortcuts</label>
                <div className="space-y-1.5 text-[10px]">
                  {[
                    { keys: "Cmd+Shift+P", action: "Toggle Overlay" },
                    { keys: "Cmd+Shift+M", action: "Toggle Mic" },
                    { keys: "Cmd+Shift+S", action: "Screenshot OCR" },
                  ].map((s) => (
                    <div key={s.keys} className="flex items-center justify-between">
                      <span className="text-gray-500">{s.action}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400 font-mono text-[9px]">{s.keys}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-[9px] text-gray-600">Phantom AI v0.1.0</span>
              <span className="text-[9px] text-violet-400/50">phantomai.com</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
