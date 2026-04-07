"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const stats = [
  { value: 200, suffix: "ms", label: "Response Latency", prefix: "<" },
  { value: 20, suffix: "+", label: "Meeting Platforms" },
  { value: 100, suffix: "%", label: "Invisible on Screen Share" },
  { value: 0, suffix: "", label: "Data Sent to Cloud", prefix: "", special: "ZERO" },
];

function AnimatedNumber({
  value,
  suffix,
  prefix,
  special,
}: {
  value: number;
  suffix: string;
  prefix?: string;
  special?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    if (special) return;

    let start = 0;
    const duration = 2000;
    const step = duration / value;

    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= value) clearInterval(timer);
    }, step);

    return () => clearInterval(timer);
  }, [isInView, value, special]);

  return (
    <span ref={ref} className="text-4xl sm:text-5xl font-bold text-white">
      {special ? (
        <span className="gradient-text">{special}</span>
      ) : (
        <>
          {prefix}
          {count}
          {suffix}
        </>
      )}
    </span>
  );
}

export default function Stats() {
  return (
    <section className="py-16 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <AnimatedNumber
                value={stat.value}
                suffix={stat.suffix}
                prefix={stat.prefix}
                special={stat.special}
              />
              <p className="mt-2 text-sm text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
