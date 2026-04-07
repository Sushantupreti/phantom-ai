"use client";

import { motion } from "framer-motion";
import { Ghost, ArrowRight, Shield, Zap, Eye } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid">
      {/* Background effects */}
      <div className="absolute inset-0">
        {/* Radial gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-violet-500/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-sm mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
            </span>
            Now in Early Access — Join the Waitlist
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] max-w-5xl"
          >
            Your{" "}
            <span className="gradient-text">Invisible</span>
            <br />
            Interview Copilot
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed"
          >
            Phantom listens to your interview, reads your screen, and whispers
            perfect answers through a Dynamic Island overlay —{" "}
            <span className="text-white font-medium">
              completely invisible during screen sharing.
            </span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <a
              href="#waitlist"
              className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-lg hover:shadow-2xl hover:shadow-violet-500/25 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              Get Early Access
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#how-it-works"
              className="px-8 py-4 rounded-full border border-white/10 text-gray-300 font-semibold text-lg hover:border-white/20 hover:bg-white/5 transition-all duration-300 flex items-center gap-2"
            >
              See How It Works
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Local-First Privacy</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-700" />
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-violet-500" />
              <span>Invisible to Screen Share</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-700" />
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-500" />
              <span>Sub-Second Response</span>
            </div>
          </motion.div>

          {/* Dynamic Island Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-20 w-full max-w-4xl"
          >
            <div className="relative">
              {/* Mock interview screen */}
              <div className="rounded-2xl bg-[#0a0a1a] border border-white/5 p-6 sm:p-8">
                {/* Browser bar */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <div className="ml-4 flex-1 h-7 rounded-lg bg-white/5 flex items-center px-3">
                    <span className="text-xs text-gray-500">meet.google.com/abc-defg-hij</span>
                  </div>
                </div>

                {/* Video call mockup */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <div className="aspect-video rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border border-white/5">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 mx-auto mb-2 flex items-center justify-center">
                        <span className="text-blue-400 text-lg font-bold">HR</span>
                      </div>
                      <p className="text-xs text-gray-500">Interviewer</p>
                    </div>
                  </div>
                  <div className="aspect-video rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border border-white/5">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-violet-500/20 mx-auto mb-2 flex items-center justify-center">
                        <span className="text-violet-400 text-lg font-bold">You</span>
                      </div>
                      <p className="text-xs text-gray-500">Candidate</p>
                    </div>
                  </div>
                </div>

                {/* Transcript area */}
                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                  <p className="text-xs text-gray-500 mb-2">Live Transcript</p>
                  <p className="text-sm text-gray-400">
                    <span className="text-blue-400">[Interviewer]:</span> &quot;Can you tell me about a time
                    you handled a production outage under pressure?&quot;
                  </p>
                </div>
              </div>

              {/* The Dynamic Island overlay - floating above */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-lg"
              >
                <div className="animate-island rounded-[28px] bg-[#0f0f1f]/95 backdrop-blur-2xl border border-violet-500/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Ghost className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-violet-400">
                          Phantom AI
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Live
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                        &quot;In my previous role at [Company], our payment service went down
                        during Black Friday. I immediately initiated the incident
                        response protocol, coordinated with 3 teams, and we restored
                        service in 23 minutes. Key takeaway: I established post-mortem
                        processes that reduced incidents by 40%.&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Label */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                <span className="text-xs text-violet-400 font-medium flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-400" />
                  </span>
                  Only you can see this
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
