"use client";

import { motion } from "framer-motion";

const platforms = [
  { name: "Zoom", color: "#2D8CFF" },
  { name: "Google Meet", color: "#00897B" },
  { name: "Microsoft Teams", color: "#6264A7" },
  { name: "Discord", color: "#5865F2" },
  { name: "Webex", color: "#07C160" },
  { name: "Slack", color: "#E01E5A" },
  { name: "GoTo Meeting", color: "#FF8C00" },
  { name: "Skype", color: "#00AFF0" },
  { name: "Amazon Chime", color: "#FF9900" },
  { name: "Jitsi Meet", color: "#location97C" },
  { name: "RingCentral", color: "#F47920" },
  { name: "BlueJeans", color: "#0075E0" },
  { name: "Whereby", color: "#7B68EE" },
  { name: "Livestorm", color: "#4F46E5" },
  { name: "Lark", color: "#3370FF" },
  { name: "Mattermost", color: "#0058CC" },
];

function PlatformPill({ name, color }: { name: string; color: string }) {
  return (
    <div className="group relative flex-shrink-0 flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 cursor-default mx-2">
      {/* Colored dot */}
      <div
        className="w-2.5 h-2.5 rounded-full transition-all duration-300 group-hover:scale-125 group-hover:shadow-lg"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 0 0 ${color}00`,
        }}
      />
      <span className="text-sm text-gray-400 group-hover:text-white transition-colors duration-300 whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}

export default function Platforms() {
  return (
    <section className="py-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-sm text-gray-500">
            Works seamlessly with{" "}
            <span className="text-white font-medium">20+ platforms</span> — if
            it makes sound, Phantom hears it
          </p>
        </motion.div>
      </div>

      {/* Row 1 — scroll left */}
      <div className="relative mb-3">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050510] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#050510] to-transparent z-10" />
        <div className="flex animate-ticker">
          {[...platforms.slice(0, 8), ...platforms.slice(0, 8)].map(
            (platform, i) => (
              <PlatformPill
                key={`row1-${i}`}
                name={platform.name}
                color={platform.color}
              />
            )
          )}
        </div>
      </div>

      {/* Row 2 — scroll right */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050510] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#050510] to-transparent z-10" />
        <div
          className="flex"
          style={{
            animation: "ticker 30s linear infinite reverse",
          }}
        >
          {[...platforms.slice(8), ...platforms.slice(8)].map((platform, i) => (
            <PlatformPill
              key={`row2-${i}`}
              name={platform.name}
              color={platform.color}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
