"use client";

const stats = [
  "100% Invisible During Screen Share",
  "Sub-200ms Response Time",
  "Works with 20+ Meeting Platforms",
  "Local-First Privacy — Your Data Never Leaves",
  "Dual-Channel Audio — Hears Both Sides",
  "OCR Screen Awareness — Reads What You See",
  "Powered by Claude, GPT-4 & Ollama",
  "Dynamic Island UI — Minimal & Clean",
];

export default function Ticker() {
  return (
    <div className="relative py-4 overflow-hidden border-y border-white/5 bg-violet-500/[0.02]">
      <div className="flex animate-ticker whitespace-nowrap">
        {[...stats, ...stats].map((stat, i) => (
          <div key={i} className="flex items-center mx-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mr-3 flex-shrink-0" />
            <span className="text-sm text-gray-400">{stat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
