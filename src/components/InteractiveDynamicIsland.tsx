"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ghost, Code, Users, Server, ChevronRight, Sparkles } from "lucide-react";

const scenarios = [
  {
    id: "behavioral",
    label: "Behavioral",
    icon: Users,
    color: "violet",
    question:
      "Tell me about a time you disagreed with your manager. How did you handle it?",
    answer:
      "At [Company], my manager wanted to ship a feature without proper load testing. I respectfully presented data showing our 99th percentile latency was already at 800ms. I proposed a 2-day spike to set up automated load tests. He agreed, and we caught a critical N+1 query that would have caused a P0 in production. Key takeaway: I back disagreements with data, not opinions.",
    context: "Using: Resume context + STAR format + JD keywords",
  },
  {
    id: "coding",
    label: "Coding",
    icon: Code,
    color: "cyan",
    question:
      "Given an array of integers, find two numbers that add up to a target sum.",
    answer:
      "Use a hash map approach — O(n) time, O(n) space:\n\ndef two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n\nThis is optimal because we only traverse the array once, storing complements as we go.",
    context: "Detected via: Screen OCR → LeetCode #1 pattern match",
  },
  {
    id: "system",
    label: "System Design",
    icon: Server,
    color: "emerald",
    question: "Design a URL shortener like bit.ly that handles 100M URLs.",
    answer:
      "High-level:\n• Base62 encoding of auto-increment ID for short URLs\n• Write path: API → ID Generator → DB (sharded by hash)\n• Read path: CDN cache → Redis cache → DB lookup → 301 redirect\n• Scale: Consistent hashing across 4 DB shards, 10K QPS read with Redis cluster\n• Storage: ~5TB/year at 100M URLs × 500 bytes avg\n• Include rate limiting + analytics pipeline via Kafka",
    context: "Using: System design template + scaling patterns",
  },
];

function TypewriterText({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-[2px] h-[14px] bg-violet-400 ml-0.5 align-middle"
        />
      )}
    </span>
  );
}

export default function InteractiveDynamicIsland() {
  const [activeScenario, setActiveScenario] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const scenario = scenarios[activeScenario];

  useEffect(() => {
    setExpanded(false);
    setShowAnswer(false);
    // Auto-expand after a short delay
    const t1 = setTimeout(() => setExpanded(true), 800);
    const t2 = setTimeout(() => setShowAnswer(true), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [activeScenario]);

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-violet-400 tracking-wider uppercase">
            Live Demo
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
            The <span className="gradient-text">Dynamic Island</span> in Action
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Click the scenarios below and watch Phantom generate real-time
            answers. This is exactly what you&apos;d see during an interview.
          </p>
        </motion.div>

        {/* Scenario tabs */}
        <div className="flex items-center justify-center gap-3 mb-12">
          {scenarios.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveScenario(i)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                i === activeScenario
                  ? "bg-violet-500/10 border border-violet-500/30 text-violet-400"
                  : "border border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10"
              }`}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          ))}
        </div>

        {/* Demo area */}
        <div ref={containerRef} className="max-w-3xl mx-auto">
          {/* Mock screen background */}
          <div className="rounded-2xl bg-[#0a0a1a] border border-white/5 p-6 sm:p-8 relative min-h-[400px]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <div className="ml-4 flex-1 h-7 rounded-lg bg-white/5 flex items-center px-3">
                <span className="text-xs text-gray-500">
                  {scenario.id === "coding"
                    ? "leetcode.com/problems/two-sum"
                    : "meet.google.com/phantom-demo"}
                </span>
              </div>
            </div>

            {/* Question display */}
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-[10px] text-blue-400 font-bold">Q</span>
                </div>
                <span className="text-xs text-gray-500">
                  {scenario.id === "coding"
                    ? "Problem Statement"
                    : "Interviewer asks:"}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                &quot;{scenario.question}&quot;
              </p>
            </div>

            {/* The Dynamic Island */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeScenario}-${expanded}`}
                layout
                initial={false}
                animate={{
                  width: expanded ? "100%" : "180px",
                  height: expanded ? "auto" : "40px",
                }}
                transition={{
                  layout: { duration: 0.5, ease: [0.32, 0.72, 0, 1] },
                }}
                className="mx-auto animate-island rounded-[24px] bg-[#0f0f1f]/95 backdrop-blur-2xl border border-violet-500/20 overflow-hidden cursor-pointer"
                onClick={() => setExpanded(!expanded)}
              >
                {!expanded ? (
                  /* Collapsed pill */
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 px-4 h-[40px]"
                  >
                    <Ghost className="w-4 h-4 text-violet-400" />
                    <span className="text-xs text-violet-400 font-medium">
                      Phantom AI
                    </span>
                    <span className="flex-1" />
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  </motion.div>
                ) : (
                  /* Expanded */
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-5"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Ghost className="w-4 h-4 text-violet-400" />
                        <span className="text-xs font-semibold text-violet-400">
                          Phantom AI
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Live
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-600">
                        {scenario.context}
                      </span>
                    </div>

                    {/* Answer with typewriter */}
                    <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                      {showAnswer ? (
                        <TypewriterText
                          text={scenario.answer}
                          speed={15}
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Sparkles className="w-4 h-4 animate-pulse text-violet-400" />
                          <span className="text-xs">Generating answer...</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Hint */}
            <p className="text-center text-[11px] text-gray-600 mt-4 flex items-center justify-center gap-1">
              <ChevronRight className="w-3 h-3" />
              Click the Dynamic Island to expand/collapse
            </p>
          </div>
        </div>

        {/* Fun fact */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-600 italic">
            Fun fact: The average interview has 8-12 questions. Phantom handles
            all of them — behavioral, coding, system design, even &quot;tell me about
            yourself.&quot;
          </p>
        </motion.div>
      </div>
    </section>
  );
}
