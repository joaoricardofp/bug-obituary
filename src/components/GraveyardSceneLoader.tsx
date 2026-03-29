"use client";

import dynamic from "next/dynamic";
import type { BugRecord } from "@/lib/types";

// ssr: false must live inside a Client Component per Next.js App Router rules.
const GraveyardScene = dynamic(() => import("@/components/GraveyardScene"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0f",
        color: "rgba(167,139,250,0.5)",
        fontFamily: "var(--font-cinzel), serif",
        fontSize: "14px",
        letterSpacing: "0.1em",
      }}
    >
      Loading the graveyard…
    </div>
  ),
});

interface GraveyardSceneLoaderProps {
  bugs: BugRecord[];
}

/** Client wrapper that lazily loads GraveyardScene only on the client. */
export default function GraveyardSceneLoader({
  bugs,
}: GraveyardSceneLoaderProps) {
  return <GraveyardScene bugs={bugs} />;
}
