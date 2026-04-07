"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Ghost, Zap, Crown } from "lucide-react";

const plans = [
  {
    name: "Free",
    icon: Ghost,
    price: "$0",
    period: "forever",
    description: "Try Phantom with basic features. No credit card needed.",
    color: "gray",
    features: [
      "3 interview sessions/month",
      "Basic AI model",
      "Invisible overlay",
      "Live transcript",
      "Community support",
    ],
    cta: "Start Free",
    ctaStyle:
      "border border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/5",
  },
  {
    name: "Pro",
    icon: Zap,
    price: "$15",
    period: "/month",
    yearlyPrice: "$120/year (save 33%)",
    description: "Everything you need to ace interviews consistently.",
    popular: true,
    color: "violet",
    features: [
      "Unlimited interview sessions",
      "Claude + GPT-4 models",
      "Dual-channel audio",
      "Screen awareness + OCR",
      "Custom context (Resume, JD)",
      "Smart notes & summaries",
      "Dynamic Island UI",
      "Priority support",
    ],
    cta: "Get Pro Access",
    ctaStyle:
      "bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:shadow-2xl hover:shadow-violet-500/25",
  },
  {
    name: "Ultimate",
    icon: Crown,
    price: "$25",
    period: "/month",
    yearlyPrice: "$200/year (save 33%)",
    description: "For power users who want every possible advantage.",
    color: "amber",
    features: [
      "Everything in Pro",
      "Local AI (Ollama — fully offline)",
      "Multi-round interview memory",
      "Coding interview solver",
      "System design assistant",
      "Custom AI personality tuning",
      "API access",
      "White-glove onboarding",
    ],
    cta: "Go Ultimate",
    ctaStyle:
      "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-2xl hover:shadow-amber-500/25",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 sm:py-32 relative">
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
            Pricing
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
            Invest in Your{" "}
            <span className="gradient-text">Career Advantage</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            One successful interview pays for a lifetime of Phantom. Our
            competitors charge $90-149/mo. We don&apos;t believe in that.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? "border-gradient bg-[#0a0a1a]"
                  : "bg-[#0a0a1a] border border-white/5"
              } ${plan.popular ? "md:-mt-4 md:mb-[-16px] md:py-12" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-xs font-semibold">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    plan.popular
                      ? "bg-violet-500/10"
                      : plan.color === "amber"
                      ? "bg-amber-500/10"
                      : "bg-white/5"
                  }`}
                >
                  <plan.icon
                    className={`w-5 h-5 ${
                      plan.popular
                        ? "text-violet-400"
                        : plan.color === "amber"
                        ? "text-amber-400"
                        : "text-gray-400"
                    }`}
                  />
                </div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              </div>

              <div className="mb-2">
                <span className="text-4xl font-bold text-white">
                  {plan.price}
                </span>
                <span className="text-gray-500 ml-1">{plan.period}</span>
              </div>
              {plan.yearlyPrice && (
                <p className="text-xs text-emerald-400 mb-4">
                  {plan.yearlyPrice}
                </p>
              )}
              <p className="text-sm text-gray-400 mb-6">{plan.description}</p>

              <a
                href="#waitlist"
                className={`block text-center py-3 rounded-full font-semibold text-sm transition-all duration-300 hover:scale-[1.02] ${plan.ctaStyle}`}
              >
                {plan.cta}
              </a>

              <div className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.popular
                          ? "text-violet-400"
                          : plan.color === "amber"
                          ? "text-amber-400"
                          : "text-gray-500"
                      }`}
                    />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-gray-500 mt-12"
        >
          All plans include a 7-day free trial. Cancel anytime. No questions
          asked.
        </motion.p>
      </div>
    </section>
  );
}
