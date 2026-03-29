"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { BugRecord } from "@/lib/types";
import GravestoneCard from "@/components/GravestoneCard";

interface GraveyardOverlayProps {
  bug: BugRecord | null;
  screenPosition: { x: number; y: number } | null;
  onSelect: (bug: BugRecord) => void;
}

/**
 * Absolutely-positioned 2D layer that floats over the Three.js canvas.
 * Pointer events are disabled on the container so mouse events reach the canvas;
 * they are re-enabled only on the card itself.
 */
export default function GraveyardOverlay({
  bug,
  screenPosition,
  onSelect,
}: GraveyardOverlayProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className="fixed inset-0 z-10 overflow-hidden"
      style={{ pointerEvents: "none" }}
    >
      <AnimatePresence>
        {bug && screenPosition && (
          <motion.div
            key={bug.id}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            style={{
              position: "absolute",
              left: screenPosition.x,
              top: screenPosition.y,
              // Centre the card over the gravestone top.
              transform: "translate(-50%, -110%)",
              pointerEvents: "auto",
            }}
          >
            <GravestoneCard bug={bug} onSelect={onSelect} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
