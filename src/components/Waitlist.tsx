"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Ghost, ArrowRight, Sparkles, Users, Rocket } from "lucide-react";

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      // TODO: Connect to actual waitlist API
    }
  };

  return (
    <section id="waitlist" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-8">
            <Ghost className="w-8 h-8 text-violet-400" />
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Ready to Become{" "}
            <span className="gradient-text">Unstoppable?</span>
          </h2>
          <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
            Join the waitlist and be among the first to get access. Early birds
            get <span className="text-white font-medium">3 months free</span>{" "}
            on any paid plan.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-8 mb-10">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="w-4 h-4 text-violet-400" />
              <span>
                <span className="text-white font-semibold">2,847</span> on
                waitlist
              </span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-700" />
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Rocket className="w-4 h-4 text-cyan-400" />
              <span>Launching Q2 2026</span>
            </div>
          </div>

          {/* Form */}
          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-5 py-4 rounded-full bg-[#0a0a1a] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
              <button
                type="submit"
                className="group px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-sm hover:shadow-2xl hover:shadow-violet-500/25 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              >
                Join Waitlist
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-emerald-500/10 border border-emerald-500/20"
            >
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">
                You&apos;re in! Check your email for confirmation.
              </span>
            </motion.div>
          )}

          <p className="mt-4 text-xs text-gray-600">
            No spam, ever. Unsubscribe anytime. We respect your privacy.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
