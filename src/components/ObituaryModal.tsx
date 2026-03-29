"use client";

import { useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { BugRecord } from "@/lib/types";

interface ObituaryModalProps {
  bug: BugRecord | null;
  onClose: () => void;
}

/** Full-obituary modal with Tim Burton aesthetic: dark parchment, Cinzel font, candlelight amber accents. */
export default function ObituaryModal({ bug, onClose }: ObituaryModalProps) {
  const prefersReducedMotion = useReducedMotion();

  // Close on Escape key.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll while modal is open.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const bornDate = bug
    ? new Date(bug.born).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const diedDate = bug
    ? new Date(bug.died).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <AnimatePresence>
      {bug && (
        // Backdrop
        <motion.div
          id={`modal-backdrop-${bug.id}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.88)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onClick={onClose}
        >
          {/* Panel */}
          <motion.div
            id={`modal-panel-${bug.id}`}
            className="relative w-full max-w-lg rounded-2xl overflow-hidden border"
            style={{
              background: "#1c1824",
              borderColor: "rgba(139,120,160,0.3)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.9), 0 0 40px rgba(167,139,250,0.08)",
            }}
            initial={{
              opacity: 0,
              y: prefersReducedMotion ? 0 : 40,
            }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="px-6 pt-8 pb-5 text-center border-b"
              style={{ borderColor: "rgba(139,120,160,0.2)" }}
            >
              <span className="text-5xl block mb-4">🪦</span>
              <h1
                className="text-xl font-bold leading-tight"
                style={{
                  fontFamily: "var(--font-cinzel), serif",
                  color: "#e7e5e4",
                }}
              >
                {bug.obituary.title}
              </h1>
              <p className="mt-2 text-xs" style={{ color: "#fbbf24" }}>
                {bornDate} &ndash; {diedDate}
              </p>
              <p className="mt-1 text-xs" style={{ color: "#a78bfa" }}>
                {bug.stack}
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-6">
              {/* Causa Mortis */}
              <section>
                <h2
                  className="text-xs uppercase tracking-widest mb-2"
                  style={{
                    color: "#a78bfa",
                    fontFamily: "var(--font-cinzel), serif",
                  }}
                >
                  Causa Mortis
                </h2>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: "#d6d3d1",
                    fontFamily: "var(--font-crimson), serif",
                    fontSize: "15px",
                  }}
                >
                  {bug.obituary.causaMortis}
                </p>
              </section>

              {/* Legacy */}
              <section>
                <h2
                  className="text-xs uppercase tracking-widest mb-2"
                  style={{
                    color: "#a78bfa",
                    fontFamily: "var(--font-cinzel), serif",
                  }}
                >
                  Legacy
                </h2>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: "#d6d3d1",
                    fontFamily: "var(--font-crimson), serif",
                    fontSize: "15px",
                  }}
                >
                  {bug.obituary.legacy}
                </p>
              </section>

              {/* Epitaph */}
              <div
                className="text-center py-5 px-6 rounded-xl border"
                style={{
                  borderColor: "rgba(251,191,36,0.3)",
                  background: "rgba(251,191,36,0.05)",
                }}
              >
                <p
                  className="text-base italic"
                  style={{
                    fontFamily: "var(--font-cinzel), serif",
                    color: "#fbbf24",
                  }}
                >
                  &ldquo;{bug.obituary.epitaph}&rdquo;
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              id={`modal-close-${bug.id}`}
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{
                background: "rgba(139,120,160,0.15)",
                color: "#a8a29e",
              }}
              aria-label="Close obituary"
            >
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
