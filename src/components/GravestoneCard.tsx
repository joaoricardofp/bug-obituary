"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { BugRecord } from "@/lib/types";

interface GravestoneCardProps {
  bug: BugRecord;
  onSelect: (bug: BugRecord) => void;
}

/**
 * 2D card shown above a hovered 3D gravestone.
 * Front face: bug name + death year.
 * Back face: epitaph.
 * Clicking the back face fires onSelect to open the ObituaryModal.
 */
export default function GravestoneCard({ bug, onSelect }: GravestoneCardProps) {
  const [flipped, setFlipped] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const diedYear = new Date(bug.died).getFullYear();
  const bornYear = new Date(bug.born).getFullYear();

  const handleClick = () => {
    if (!flipped) {
      setFlipped(true);
    } else {
      onSelect(bug);
    }
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Gravestone for ${bug.bugName}. Click to flip.`}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      style={{
        perspective: "1000px",
        width: "180px",
        height: "220px",
        cursor: "pointer",
      }}
    >
      {/* Rotating inner wrapper */}
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.55, ease: "easeInOut" }
        }
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
        }}
      >
        {/* ── Front face ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            borderRadius: "16px 16px 8px 8px",
            background: "linear-gradient(180deg, #1c1824 0%, #110f18 100%)",
            border: "1px solid rgba(139,120,160,0.3)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 12px",
          }}
        >
          {/* Arch decoration */}
          <div
            style={{
              width: "32px",
              height: "3px",
              borderRadius: "9999px",
              background: "#a78bfa",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "28px" }}>🪦</span>
            <p
              style={{
                fontFamily: "var(--font-cinzel), serif",
                color: "#e7e5e4",
                fontSize: "13px",
                fontWeight: 700,
                lineHeight: 1.3,
              }}
            >
              {bug.bugName}
            </p>
            <p style={{ color: "#a8a29e", fontSize: "11px" }}>
              {bornYear} &ndash; {diedYear}
            </p>
          </div>

          <p style={{ color: "#78716c", fontSize: "10px", fontStyle: "italic" }}>
            Click to reveal
          </p>
        </div>

        {/* ── Back face ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: "16px 16px 8px 8px",
            background: "linear-gradient(180deg, #110f18 0%, #1c1824 100%)",
            border: "1px solid rgba(167,139,250,0.4)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 12px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "3px",
              borderRadius: "9999px",
              background: "#fbbf24",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-cinzel), serif",
                color: "#fbbf24",
                fontSize: "12px",
                fontStyle: "italic",
                lineHeight: 1.5,
              }}
            >
              &ldquo;{bug.obituary.epitaph}&rdquo;
            </p>
            <p style={{ color: "#a8a29e", fontSize: "10px" }}>{bug.stack}</p>
          </div>

          <p
            style={{
              color: "#a78bfa",
              fontSize: "10px",
              fontStyle: "italic",
            }}
          >
            Click to read obituary
          </p>
        </div>
      </motion.div>
    </div>
  );
}
