"use client";

import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mic,
  Monitor,
  Brain,
  Shield,
  Zap,
  FileText,
  Headphones,
} from "lucide-react";

const features = [
  {
    icon: EyeOff,
    title: "Truly Invisible Overlay",
    description:
      "Our Dynamic Island overlay is invisible during screen sharing and recording. Uses OS-level window exclusion — not a hack, real stealth.",
    color: "violet",
    gradient: "from-violet-500/10 to-violet-500/5",
    iconColor: "text-violet-400",
    borderColor: "border-violet-500/10",
  },
  {
    icon: Mic,
    title: "Dual-Channel Audio",
    description:
      "Captures system audio (interviewer) and your mic separately. No speaker diarization needed — we know who said what, instantly.",
    color: "cyan",
    gradient: "from-cyan-500/10 to-cyan-500/5",
    iconColor: "text-cyan-400",
    borderColor: "border-cyan-500/10",
  },
  {
    icon: Monitor,
    title: "Screen Awareness + OCR",
    description:
      "Reads coding problems, slides, and on-screen questions in real-time using native Vision OCR. Hotkey-triggered or automatic.",
    color: "emerald",
    gradient: "from-emerald-500/10 to-emerald-500/5",
    iconColor: "text-emerald-400",
    borderColor: "border-emerald-500/10",
  },
  {
    icon: Brain,
    title: "Context-Aware AI",
    description:
      "Upload your resume, job description, and company research. Phantom answers as YOU — not generic AI. Multi-round memory across interviews.",
    color: "amber",
    gradient: "from-amber-500/10 to-amber-500/5",
    iconColor: "text-amber-400",
    borderColor: "border-amber-500/10",
  },
  {
    icon: Shield,
    title: "Local-First Privacy",
    description:
      "Run fully offline with Ollama + local Whisper. Your transcripts, answers, and data never leave your machine. Zero breach risk.",
    color: "emerald",
    gradient: "from-emerald-500/10 to-emerald-500/5",
    iconColor: "text-emerald-400",
    borderColor: "border-emerald-500/10",
  },
  {
    icon: Zap,
    title: "Sub-200ms Responses",
    description:
      "Streaming AI answers via Deepgram + Claude/GPT. See the first word appear before the interviewer finishes asking. Lightning fast.",
    color: "yellow",
    gradient: "from-yellow-500/10 to-yellow-500/5",
    iconColor: "text-yellow-400",
    borderColor: "border-yellow-500/10",
  },
  {
    icon: Headphones,
    title: "Works Everywhere",
    description:
      "Zoom, Google Meet, Teams, Discord, Webex, Slack huddles — if it makes sound, Phantom hears it. 20+ platforms supported.",
    color: "blue",
    gradient: "from-blue-500/10 to-blue-500/5",
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/10",
  },
  {
    icon: FileText,
    title: "Smart Notes & Summaries",
    description:
      "Auto-generates meeting notes, action items, and post-interview summaries. Review what was discussed and how you performed.",
    color: "pink",
    gradient: "from-pink-500/10 to-pink-500/5",
    iconColor: "text-pink-400",
    borderColor: "border-pink-500/10",
  },
  {
    icon: Eye,
    title: "Dynamic Island UI",
    description:
      "Inspired by iPhone's Dynamic Island. Tiny pill when idle, expands with answers on demand. Minimal, beautiful, distraction-free.",
    color: "violet",
    gradient: "from-violet-500/10 to-violet-500/5",
    iconColor: "text-violet-400",
    borderColor: "border-violet-500/10",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function Features() {
  return (
    <section id="features" className="py-24 sm:py-32 relative">
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
          <span className="text-sm font-medium text-violet-400 tracking-wider uppercase">
            Features
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
            Everything You Need to{" "}
            <span className="gradient-text">Ace Any Interview</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            From invisible overlays to local AI — Phantom gives you an unfair
            advantage that no one can detect.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className={`group relative rounded-2xl bg-gradient-to-b ${feature.gradient} border ${feature.borderColor} p-6 hover:border-opacity-30 transition-all duration-300 hover:-translate-y-1`}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-b ${feature.gradient} flex items-center justify-center mb-4 border ${feature.borderColor}`}
              >
                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
