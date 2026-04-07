"use client";

import { motion } from "framer-motion";
import { Download, Mic, Brain, Ghost } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Download,
    title: "Install & Setup",
    description:
      "Download the lightweight Phantom desktop app (10MB). Upload your resume, paste the job description, and add any company research notes.",
    color: "violet",
    detail: "Works on macOS & Windows. 30-second setup.",
  },
  {
    step: "02",
    icon: Mic,
    title: "Start Your Interview",
    description:
      "Join your meeting on any platform — Zoom, Meet, Teams, anything. Phantom activates automatically when it detects a call. Dual-channel audio captures both sides.",
    color: "cyan",
    detail: "Zero configuration. Auto-detects meetings.",
  },
  {
    step: "03",
    icon: Brain,
    title: "AI Processes in Real-Time",
    description:
      "Audio is transcribed instantly. Screen content is OCR'd. Your context (resume, JD) is combined with the live conversation. AI generates the perfect answer.",
    color: "emerald",
    detail: "Sub-200ms latency. Streaming responses.",
  },
  {
    step: "04",
    icon: Ghost,
    title: "Dynamic Island Delivers",
    description:
      "Answers appear in a sleek Dynamic Island overlay at the top of your screen. Only you can see it — invisible during screen sharing. Expand for details, collapse when done.",
    color: "amber",
    detail: "100% invisible. Hotkey controlled.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-sm font-medium text-cyan-400 tracking-wider uppercase">
            How It Works
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
            Four Steps to Your{" "}
            <span className="gradient-text">Phantom Advantage</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            From install to acing your interview in under a minute.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/20 via-cyan-500/20 to-amber-500/20 hidden lg:block" />

          <div className="space-y-16 lg:space-y-24">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
                  i % 2 !== 0 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Content */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <span className="text-sm font-mono text-gray-500">
                      {step.step}
                    </span>
                    <div className="w-8 h-px bg-gradient-to-r from-violet-500 to-cyan-500" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed mb-3 max-w-md mx-auto lg:mx-0">
                    {step.description}
                  </p>
                  <span className="text-xs font-medium text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full">
                    {step.detail}
                  </span>
                </div>

                {/* Icon node */}
                <div className="relative flex-shrink-0 order-first lg:order-none">
                  <div className="w-20 h-20 rounded-2xl bg-[#0a0a1a] border border-white/10 flex items-center justify-center relative z-10">
                    <step.icon className="w-8 h-8 text-violet-400" />
                  </div>
                  <div className="absolute inset-0 bg-violet-500/20 rounded-2xl blur-xl" />
                </div>

                {/* Visual */}
                <div className="flex-1">
                  <div className="rounded-2xl bg-[#0a0a1a] border border-white/5 p-6 max-w-sm mx-auto">
                    {i === 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                            <Ghost className="w-4 h-4 text-violet-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              Phantom AI
                            </p>
                            <p className="text-xs text-gray-500">v1.0 — 10MB</p>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: "0%" }}
                            whileInView={{ width: "100%" }}
                            viewport={{ once: true }}
                            transition={{ duration: 2, delay: 0.3 }}
                            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                          />
                        </div>
                        <p className="text-xs text-emerald-400">
                          Ready to go.
                        </p>
                      </div>
                    )}
                    {i === 1 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Detecting audio...
                          </span>
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Connected
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-end gap-0.5 h-8">
                            {Array.from({ length: 20 }).map((_, j) => (
                              <motion.div
                                key={j}
                                animate={{
                                  height: [4, Math.random() * 28 + 4, 4],
                                }}
                                transition={{
                                  duration: 0.5 + Math.random() * 0.5,
                                  repeat: Infinity,
                                  delay: j * 0.05,
                                }}
                                className="flex-1 bg-gradient-to-t from-violet-500 to-cyan-500 rounded-full min-h-[4px]"
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">
                          System Audio + Microphone
                        </p>
                      </div>
                    )}
                    {i === 2 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="w-4 h-4 text-violet-400 animate-pulse" />
                          <span className="text-xs text-violet-400">
                            Processing...
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs font-mono">
                          <p className="text-gray-500">
                            [STT] &quot;Tell me about a production outage...&quot;
                          </p>
                          <p className="text-cyan-400/60">
                            [CTX] Resume + JD loaded ✓
                          </p>
                          <p className="text-emerald-400/60">
                            [AI] Generating response...
                          </p>
                          <motion.span
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="inline-block w-2 h-3 bg-violet-400"
                          />
                        </div>
                      </div>
                    )}
                    {i === 3 && (
                      <div>
                        <div className="rounded-[20px] bg-[#0f0f1f] border border-violet-500/20 p-3 animate-island">
                          <div className="flex items-center gap-2 mb-2">
                            <Ghost className="w-4 h-4 text-violet-400" />
                            <span className="text-[10px] font-medium text-violet-400">
                              Phantom
                            </span>
                            <span className="text-[8px] px-1 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                              Live
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-300 leading-relaxed">
                            &quot;At [Company], I led incident response for a
                            payment outage during peak traffic. Restored in 23
                            min, then built post-mortem processes...&quot;
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
