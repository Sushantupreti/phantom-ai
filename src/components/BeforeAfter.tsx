"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Ghost,
  AlertCircle,
  Clock,
  Frown,
  Smile,
  Zap,
  CheckCircle2,
  XCircle,
  Brain,
  Shield,
} from "lucide-react";

export default function BeforeAfter() {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <section className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.02] to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-amber-400 tracking-wider uppercase">
            The Difference
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
            Interview <span className="text-red-400">Without</span> vs{" "}
            <span className="gradient-text">With Phantom</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Drag the slider to see the difference. Spoiler: it&apos;s night and day.
          </p>
        </motion.div>

        {/* Interactive Slider Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <div
            className="relative rounded-2xl overflow-hidden border border-white/10"
            style={{ height: "540px" }}
          >
            {/* WITHOUT side (Red tint — full background) */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 to-[#0a0a1a] p-8 sm:p-12">
              <div className="h-full flex flex-col justify-between max-w-md">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-6">
                    <XCircle className="w-3.5 h-3.5" />
                    Without Phantom
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-6">
                    The Struggle is Real
                  </h3>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      icon: Frown,
                      text: "Blanking on behavioral questions",
                      sub: "\"Um... let me think about that...\"",
                    },
                    {
                      icon: Clock,
                      text: "Awkward 30-second silences",
                      sub: "While you desperately recall STAR stories",
                    },
                    {
                      icon: AlertCircle,
                      text: "Fumbling through coding problems",
                      sub: "Can't remember the optimal approach",
                    },
                    {
                      icon: XCircle,
                      text: "Generic answers that don't impress",
                      sub: "Sound like every other candidate",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <item.icon className="w-5 h-5 text-red-400/60 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-300">{item.text}</p>
                        <p className="text-xs text-gray-600 italic">
                          {item.sub}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <p className="text-sm text-red-400 font-medium">Result:</p>
                  <p className="text-xs text-gray-500 mt-1">
                    &quot;We&apos;ll get back to you&quot; (they never do)
                  </p>
                </div>
              </div>
            </div>

            {/* WITH side (Violet tint — clips based on slider) */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-violet-950/40 to-[#0a0a1a] p-8 sm:p-12 overflow-hidden"
              style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
            >
              <div className="h-full flex flex-col justify-between ml-auto max-w-md">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    With Phantom AI
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-6">
                    Absolutely Crushing It
                  </h3>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      icon: Brain,
                      text: "Perfect STAR answers in real-time",
                      sub: "\"At my previous role, I led the initiative...\"",
                    },
                    {
                      icon: Zap,
                      text: "Instant, confident responses",
                      sub: "Answer appears before the question ends",
                    },
                    {
                      icon: Ghost,
                      text: "AI reads the coding problem for you",
                      sub: "Optimal solution with time complexity analysis",
                    },
                    {
                      icon: Shield,
                      text: "Personalized, impressive answers",
                      sub: "Uses YOUR resume and the specific JD",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <item.icon className="w-5 h-5 text-emerald-400/60 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-300">{item.text}</p>
                        <p className="text-xs text-gray-600 italic">
                          {item.sub}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-sm text-emerald-400 font-medium">
                    Result:
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    &quot;We&apos;d like to extend you an offer!&quot; 🎉
                  </p>
                </div>
              </div>
            </div>

            {/* Slider handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 via-cyan-400 to-violet-500 cursor-ew-resize z-20"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#0a0a1a] border-2 border-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <div className="flex items-center gap-0.5">
                  <div className="w-0.5 h-4 bg-violet-400 rounded-full" />
                  <div className="w-0.5 h-4 bg-violet-400 rounded-full" />
                </div>
              </div>
            </div>

            {/* Invisible slider input */}
            <input
              type="range"
              min="5"
              max="95"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
            />
          </div>

          <p className="text-center text-xs text-gray-600 mt-4">
            ← Drag the slider to compare →
          </p>
        </motion.div>
      </div>
    </section>
  );
}
