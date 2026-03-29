import type { Metadata } from "next";
import Link from "next/link";
import { getAllBugs } from "@/lib/kv";
import type { BugRecord } from "@/lib/types";
import GraveyardSceneLoader from "@/components/GraveyardSceneLoader";

export const metadata: Metadata = {
  title: "Bug Obituary — The Graveyard",
  description:
    "A graveyard for bugs that have been fixed. Every bug deserves a proper burial.",
};

export default async function Home() {
  // Server-side fetch — no-store so new bugs appear without a redeploy.
  const bugs: BugRecord[] = await getAllBugs();

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* Three.js scene fills the viewport */}
      <GraveyardSceneLoader bugs={bugs} />

      {/* HUD — header overlay */}
      <header
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,15,0.9) 0%, rgba(10,10,15,0) 100%)",
          pointerEvents: "none",
        }}
      >
        <div
          className="flex items-center gap-3"
          style={{ pointerEvents: "auto" }}
        >
          <span className="text-2xl">🪦</span>
          <h1
            className="text-xl font-bold tracking-wide"
            style={{
              fontFamily: "var(--font-cinzel), serif",
              color: "#e7e5e4",
              textShadow: "0 2px 12px rgba(0,0,0,0.8)",
            }}
          >
            Bug Obituary
          </h1>
        </div>

        <Link
          id="nav-submit-bug"
          href="/submit"
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
            color: "#fff",
            fontFamily: "var(--font-cinzel), serif",
            letterSpacing: "0.05em",
            pointerEvents: "auto",
            boxShadow: "0 0 20px rgba(167,139,250,0.3)",
          }}
        >
          + Bury a Bug
        </Link>
      </header>

      {/* HUD — empty-state hint when no bugs yet */}
      {bugs.length === 0 && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center gap-4"
          style={{ pointerEvents: "none" }}
        >
          <p
            className="text-2xl italic"
            style={{
              fontFamily: "var(--font-cinzel), serif",
              color: "rgba(167,139,250,0.7)",
              textShadow: "0 2px 20px rgba(0,0,0,0.8)",
            }}
          >
            The graveyard is quiet… for now.
          </p>
          <p style={{ color: "rgba(168,162,158,0.6)", fontSize: "14px" }}>
            Every bug you squash deserves a proper burial.
          </p>
        </div>
      )}

      {/* HUD — hover hint */}
      {bugs.length > 0 && (
        <div
          className="absolute bottom-6 left-0 right-0 flex justify-center"
          style={{ pointerEvents: "none" }}
        >
          <p
            style={{
              color: "rgba(168,162,158,0.5)",
              fontSize: "12px",
              fontFamily: "var(--font-cinzel), serif",
              letterSpacing: "0.1em",
            }}
          >
            Hover over a gravestone · Click to read the obituary
          </p>
        </div>
      )}
    </main>
  );
}
