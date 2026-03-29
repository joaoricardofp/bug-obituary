import type { Metadata } from "next";
import Link from "next/link";
import BugForm from "@/components/BugForm";

export const metadata: Metadata = {
  title: "Bug Obituary — Bury a Bug",
  description:
    "Submit the details of a bug you fixed and receive a dramatic AI-generated obituary.",
};

export default function SubmitPage() {
  return (
    <main
      className="flex flex-col min-h-screen"
      style={{ background: "#0a0a0f" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b"
        style={{
          background: "rgba(10,10,15,0.9)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(139,120,160,0.2)",
        }}
      >
        <Link
          id="nav-back-home"
          href="/"
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: "#a8a29e" }}
        >
          ← Back to the Graveyard
        </Link>
        <span className="text-2xl">🪦</span>
      </header>

      {/* Form card */}
      <section className="flex-1 flex items-start justify-center px-4 py-12">
        <div
          className="w-full max-w-lg rounded-2xl border p-8"
          style={{
            background: "#1c1824",
            borderColor: "rgba(139,120,160,0.25)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(167,139,250,0.06)",
          }}
        >
          <div className="text-center mb-8">
            <span className="text-5xl block mb-4">⚰️</span>
            <h1
              className="text-2xl font-bold"
              style={{
                fontFamily: "var(--font-cinzel), serif",
                color: "#e7e5e4",
              }}
            >
              Bury a Bug
            </h1>
            <p className="mt-2 text-sm" style={{ color: "#a8a29e" }}>
              Give your fallen bug the dramatic farewell it deserves.
            </p>
          </div>

          <BugForm />
        </div>
      </section>
    </main>
  );
}
