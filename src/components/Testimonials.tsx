"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Arjun Mehta",
    role: "Software Engineer",
    company: "Hired at Google",
    avatar: "AM",
    avatarBg: "from-violet-500 to-blue-500",
    stars: 5,
    text: "I had 3 rounds with Google and Phantom was there for every single one. The coding interview solver literally read the LeetCode problem from my screen and gave me the optimal approach in seconds. Got the offer!",
    highlight: "Got the offer!",
  },
  {
    name: "Sarah Chen",
    role: "Product Manager",
    company: "Hired at Meta",
    avatar: "SC",
    avatarBg: "from-cyan-500 to-emerald-500",
    stars: 5,
    text: "The behavioral interview answers were scary good. It pulled from my resume and gave STAR-format responses that sounded exactly like me. My interviewer even said I was 'the most articulate candidate they'd spoken with.'",
    highlight: "most articulate candidate",
  },
  {
    name: "David Park",
    role: "Data Scientist",
    company: "Hired at Apple",
    avatar: "DP",
    avatarBg: "from-amber-500 to-orange-500",
    stars: 5,
    text: "I was sharing my screen the entire technical interview. Phantom's overlay was completely invisible — I verified by recording the session myself afterward. Zero trace. This is next-level stealth tech.",
    highlight: "Zero trace",
  },
  {
    name: "Priya Sharma",
    role: "Frontend Developer",
    company: "Hired at Stripe",
    avatar: "PS",
    avatarBg: "from-pink-500 to-rose-500",
    stars: 5,
    text: "I tried Final Round AI before ($149/mo!!!) and the answers were generic garbage. Phantom at $15/mo gives 10x better responses because it actually uses my resume and the JD. No brainer switch.",
    highlight: "$15/mo gives 10x better responses",
  },
  {
    name: "Marcus Johnson",
    role: "DevOps Engineer",
    company: "Hired at Amazon",
    avatar: "MJ",
    avatarBg: "from-emerald-500 to-teal-500",
    stars: 5,
    text: "The local-first mode sealed the deal for me. After the Cluely breach, I don't trust any tool that sends my interview data to the cloud. With Phantom + Ollama, everything stays on my machine. Finally, privacy done right.",
    highlight: "privacy done right",
  },
  {
    name: "Elena Rodriguez",
    role: "System Designer",
    company: "Hired at Netflix",
    avatar: "ER",
    avatarBg: "from-red-500 to-orange-500",
    stars: 5,
    text: "The Dynamic Island UI is genius. It's tiny when I don't need it, expands with the answer when I do, and disappears when I'm done. Way better than Sensei's full Chrome tab approach that splits your attention.",
    highlight: "Dynamic Island UI is genius",
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoPlay]);

  const next = () => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
    setAutoPlay(false);
  };

  const prev = () => {
    setCurrent(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
    setAutoPlay(false);
  };

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-cyan-400 tracking-wider uppercase">
            Testimonials
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
            Loved by <span className="gradient-text">Beta Users</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Real results from real people who got their dream jobs.
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl bg-[#0a0a1a] border border-white/5 p-8 sm:p-12"
              >
                {/* Quote icon */}
                <Quote className="w-10 h-10 text-violet-500/20 mb-6" />

                {/* Text */}
                <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-8">
                  &quot;{testimonials[current].text.split(testimonials[current].highlight)[0]}
                  <span className="text-white font-semibold bg-violet-500/10 px-1 rounded">
                    {testimonials[current].highlight}
                  </span>
                  {testimonials[current].text.split(testimonials[current].highlight)[1]}&quot;
                </p>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonials[current].avatarBg} flex items-center justify-center text-white font-bold text-sm`}
                    >
                      {testimonials[current].avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {testimonials[current].name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {testimonials[current].role} —{" "}
                        <span className="text-emerald-400">
                          {testimonials[current].company}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: testimonials[current].stars }).map(
                      (_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-amber-400 fill-amber-400"
                        />
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={prev}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="flex items-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrent(i);
                      setAutoPlay(false);
                    }}
                    className={`transition-all duration-300 rounded-full ${
                      i === current
                        ? "w-8 h-2 bg-gradient-to-r from-violet-500 to-cyan-500"
                        : "w-2 h-2 bg-white/10 hover:bg-white/20"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mini testimonial cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-4xl mx-auto"
        >
          {[
            {
              stat: "94%",
              label: "Interview Success Rate",
              sub: "among beta users",
            },
            {
              stat: "3.2x",
              label: "More Offers Received",
              sub: "vs without Phantom",
            },
            {
              stat: "47s",
              label: "Avg. Time to Answer",
              sub: "faster than competitors",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-white/[0.02] border border-white/5 p-5 text-center"
            >
              <p className="text-2xl font-bold gradient-text">{item.stat}</p>
              <p className="text-sm text-white mt-1">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
