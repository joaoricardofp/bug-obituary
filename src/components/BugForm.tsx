"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BugInput } from "@/lib/types";

const EMPTY_FORM: BugInput = {
  bugName: "",
  description: "",
  born: "",
  died: "",
  stack: "",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontFamily: "var(--font-cinzel), serif",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#a78bfa",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  background: "#110f18",
  border: "1px solid rgba(139,120,160,0.3)",
  color: "#e7e5e4",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  fontFamily: "var(--font-crimson), serif",
  transition: "border-color 0.2s",
};

/** Controlled bug-submission form. Posts to /api/obituary then redirects to /. */
export default function BugForm() {
  const router = useRouter();
  const [form, setForm] = useState<BugInput>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/obituary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Bug Name */}
      <div>
        <label htmlFor="bugName" style={labelStyle}>
          Bug Name
        </label>
        <input
          id="bugName"
          name="bugName"
          type="text"
          required
          placeholder="e.g. The NullPointer of Darkness"
          value={form.bugName}
          onChange={handleChange}
          style={inputStyle}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" style={labelStyle}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          placeholder="What did this bug do? How did it terrorise the codebase?"
          value={form.description}
          onChange={handleChange}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      {/* Born / Died */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="born" style={labelStyle}>
            Born
          </label>
          <input
            id="born"
            name="born"
            type="date"
            required
            value={form.born}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="died" style={labelStyle}>
            Died
          </label>
          <input
            id="died"
            name="died"
            type="date"
            required
            value={form.died}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Stack */}
      <div>
        <label htmlFor="stack" style={labelStyle}>
          Tech Stack
        </label>
        <input
          id="stack"
          name="stack"
          type="text"
          required
          placeholder="e.g. React, Node.js, PostgreSQL"
          value={form.stack}
          onChange={handleChange}
          style={inputStyle}
        />
      </div>

      {/* Error message */}
      {error && (
        <p
          className="text-sm px-4 py-3 rounded-lg border"
          style={{
            color: "#f87171",
            borderColor: "rgba(127,29,29,0.6)",
            background: "rgba(127,29,29,0.12)",
          }}
        >
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        id="submit-bug"
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
        style={{
          background: loading
            ? "rgba(139,120,160,0.2)"
            : "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
          color: loading ? "#a8a29e" : "#fff",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "var(--font-cinzel), serif",
          letterSpacing: "0.05em",
          boxShadow: loading ? "none" : "0 0 20px rgba(167,139,250,0.25)",
        }}
      >
        {loading
          ? "Generating obituary… (this may take a few seconds)"
          : "Bury This Bug 🪦"}
      </button>
    </form>
  );
}
