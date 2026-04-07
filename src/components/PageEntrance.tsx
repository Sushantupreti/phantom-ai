"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ghost } from "lucide-react";

export default function PageEntrance() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2400);
    // Prevent scroll during animation
    if (show) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-[#050510] flex items-center justify-center"
        >
          <div className="flex flex-col items-center">
            {/* Ghost icon with pulse */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="relative"
            >
              <Ghost className="w-16 h-16 text-violet-500" />
              {/* Pulse rings */}
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: 1,
                  ease: "easeOut",
                  delay: 0.3,
                }}
                className="absolute inset-0 border-2 border-violet-500 rounded-full"
              />
              <motion.div
                initial={{ scale: 1, opacity: 0.3 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: 1,
                  ease: "easeOut",
                  delay: 0.5,
                }}
                className="absolute inset-0 border border-cyan-500 rounded-full"
              />
              {/* Background glow */}
              <div className="absolute inset-0 bg-violet-500/30 rounded-full blur-2xl scale-150" />
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8 text-center"
            >
              <h1 className="text-3xl font-bold gradient-text">Phantom AI</h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="mt-2 text-sm text-gray-500"
              >
                Your invisible advantage
              </motion.p>
            </motion.div>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 w-48 h-0.5 bg-white/5 rounded-full overflow-hidden"
            >
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.4, delay: 0.8, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
