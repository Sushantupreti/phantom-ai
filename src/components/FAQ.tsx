"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle } from "lucide-react";

const faqs = [
  {
    question: "Is Phantom AI really invisible during screen sharing?",
    answer:
      "Yes. On Windows, we use OS-level window exclusion (SetWindowDisplayAffinity) which makes our overlay completely invisible to all screen capture methods. On macOS, we use a translucent minimal overlay combined with dock hiding and hotkey controls for maximum stealth. Your interviewer will never see it.",
  },
  {
    question: "How does the audio capture work?",
    answer:
      "Phantom uses dual-channel audio capture — we capture system audio (what your interviewer says) through Core Audio Taps on macOS or WASAPI on Windows, and your microphone audio separately. This means we know exactly who said what without needing AI-based speaker separation, which is faster and more accurate.",
  },
  {
    question: "Can I run Phantom completely offline?",
    answer:
      "Yes! On the Ultimate plan, you can use Ollama for local AI inference and faster-whisper for local transcription. Everything runs on your machine — no internet required, no data leaves your computer. Perfect for maximum privacy.",
  },
  {
    question: "What meeting platforms does Phantom work with?",
    answer:
      "Phantom works with 20+ platforms including Zoom, Google Meet, Microsoft Teams, Discord, Webex, Slack Huddles, GoTo Meeting, and more. Since we capture system audio at the OS level, we work with anything that makes sound on your computer.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Absolutely. Phantom is local-first by design. Your transcripts, AI responses, resume, and all personal data stay on your machine. We learned from the Cluely breach (83K users exposed) — the best security is having nothing to steal. Cloud features use end-to-end encryption.",
  },
  {
    question: "How fast are the AI responses?",
    answer:
      "Under 200 milliseconds for the first token. We use streaming AI (Claude/GPT-4) so you see the response being generated in real-time. By the time the interviewer finishes their question, you already have the beginning of a great answer.",
  },
  {
    question: "Does it work for coding interviews?",
    answer:
      "Yes! Phantom can read coding problems from your screen using OCR, understand the requirements, and generate solutions with explanations. It works with LeetCode, HackerRank, CodeSignal, CoderPad, and live whiteboard coding sessions.",
  },
  {
    question: "What if I get caught?",
    answer:
      "Our stealth technology is designed so that the overlay is not visible on screen shares, recordings, or screenshots taken by meeting software. The app doesn't appear in the dock/taskbar, alt-tab, or process lists under its real name. That said, always maintain natural eye contact and speaking pace.",
  },
  {
    question: "Can I customize what context the AI uses?",
    answer:
      "Absolutely. You can upload your resume, paste job descriptions, add company research notes, and even your personal STAR stories. The AI uses all of this to generate answers that sound like YOU, not a generic chatbot.",
  },
  {
    question: "What's the refund policy?",
    answer:
      "7-day free trial on all paid plans. After that, we offer a 30-day money-back guarantee — no questions asked. If Phantom doesn't help you nail your interviews, we'll refund every penny.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 sm:py-32 relative">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-violet-400 tracking-wider uppercase">
            FAQ
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
            Got <span className="gradient-text">Questions?</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Everything you need to know about Phantom AI.
          </p>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-xl border border-white/5 bg-[#0a0a1a] overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-medium text-gray-200 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5">
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* More questions */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Still have questions? Reach out at{" "}
            <a
              href="mailto:hello@phantom-ai.com"
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              hello@phantom-ai.com
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
