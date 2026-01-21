"use client";

import { motion } from "framer-motion";

export function CyberGrid() {
  return (
    <div className="fixed inset-0 pointer-events-none cyber-grid-container overflow-hidden z-0">
      <motion.div
        className="absolute inset-0 cyber-grid"
        animate={{
          y: [0, 40],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[var(--background-dark)]" />
    </div>
  );
}
