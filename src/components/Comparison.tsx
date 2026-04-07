"use client";

import { motion } from "framer-motion";
import { Check, X, Ghost, AlertTriangle, Info } from "lucide-react";

const competitors = [
  {
    name: "Phantom AI",
    isUs: true,
    price: "$15/mo",
    stealth: "OS-Level Invisible",
    audio: "Dual-Channel Native",
    privacy: "Local-First",
    latency: "<200ms",
    coding: true,
    context: true,
    platforms: "20+",
    localAI: true,
  },
  {
    name: "Final Round AI",
    price: "$149/mo",
    stealth: "Desktop Overlay",
    audio: "Single Channel",
    privacy: "Cloud Only",
    latency: "~1-2s",
    coding: true,
    context: false,
    platforms: "3",
    localAI: false,
  },
  {
    name: "Sensei AI",
    price: "$89/mo",
    stealth: "Chrome Tab (Detectable)",
    audio: "Browser Only",
    privacy: "Cloud Only",
    latency: "<1s",
    coding: true,
    context: false,
    platforms: "3",
    localAI: false,
  },
  {
    name: "LockedIn AI",
    price: "$70/mo",
    stealth: "Process Masking",
    audio: "System WASAPI",
    privacy: "Cloud Only",
    latency: "~1s",
    coding: true,
    context: false,
    platforms: "5+",
    localAI: false,
  },
  {
    name: "Cluely",
    price: "$20/mo",
    stealth: "Electron Overlay",
    audio: "Single Channel",
    privacy: "Cloud (BREACHED)",
    latency: "~1-2s",
    coding: false,
    context: true,
    platforms: "3",
    localAI: false,
  },
];

const rows = [
  { label: "Monthly Price", key: "price" },
  { label: "Stealth Method", key: "stealth" },
  { label: "Audio Capture", key: "audio" },
  { label: "Data Privacy", key: "privacy" },
  { label: "Response Time", key: "latency" },
  { label: "Coding Support", key: "coding", boolean: true },
  { label: "Custom Context (Resume/JD)", key: "context", boolean: true },
  { label: "Meeting Platforms", key: "platforms" },
  { label: "Local/Offline AI", key: "localAI", boolean: true },
];

export default function Comparison() {
  return (
    <section id="compare" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-cyan-400 tracking-wider uppercase">
            Compare
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
            See Why <span className="gradient-text">Phantom Wins</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            We studied every competitor. Then we built something better.
          </p>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-x-auto rounded-xl border border-white/5"
        >
          <p className="text-xs text-gray-600 mb-2 text-center sm:hidden">← Scroll to compare →</p>
          <table className="w-full min-w-[800px]">
            <thead>
              <tr>
                <th className="text-left p-4 text-sm text-gray-500 font-medium">
                  Feature
                </th>
                {competitors.map((c) => (
                  <th
                    key={c.name}
                    className={`p-4 text-center text-sm font-medium ${
                      c.isUs
                        ? "text-violet-400"
                        : "text-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {c.isUs && <Ghost className="w-4 h-4" />}
                      {c.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.key}
                  className={`border-t border-white/5 ${
                    i % 2 === 0 ? "bg-white/[0.01]" : ""
                  }`}
                >
                  <td className="p-4 text-sm text-gray-400">{row.label}</td>
                  {competitors.map((c) => {
                    const value = c[row.key as keyof typeof c];
                    return (
                      <td key={c.name} className="p-4 text-center">
                        {row.boolean ? (
                          value ? (
                            <Check
                              className={`w-5 h-5 mx-auto ${
                                c.isUs ? "text-emerald-400" : "text-emerald-400/50"
                              }`}
                            />
                          ) : (
                            <X className="w-5 h-5 mx-auto text-red-400/50" />
                          )
                        ) : (
                          <span
                            className={`text-sm ${
                              c.isUs
                                ? "text-white font-medium"
                                : String(value).includes("BREACHED")
                                ? "text-red-400"
                                : String(value).includes("Detectable")
                                ? "text-yellow-400"
                                : "text-gray-400"
                            }`}
                          >
                            {String(value)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Did You Know callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-400 mb-1">
                Did You Know?
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                In mid-2025, <span className="text-white">Cluely AI was breached</span> — 83,000+ users had their
                interview transcripts, screenshots, and personal data exposed.
                The cause? An admin password left in a public GitHub repo.
                That&apos;s why Phantom is <span className="text-emerald-400 font-medium">local-first</span>. Your data
                stays on YOUR machine. Even if someone hacks our servers, they
                get nothing.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Fun quote */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500 italic flex items-center justify-center gap-2">
            <Info className="w-4 h-4" />
            &quot;The best security is when there&apos;s nothing to steal.&quot; — Phantom Philosophy
          </p>
        </motion.div>
      </div>
    </section>
  );
}
