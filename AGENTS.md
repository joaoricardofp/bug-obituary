<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Bug Obituary — Agent Rules & Project Guide

This document is the source of truth for any AI agent or developer working on this codebase.  
Read it fully before touching any file. Do not rely on assumptions from prior Next.js projects.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Environment Variables](#4-environment-variables)
5. [App Router Conventions](#5-app-router-conventions)
6. [API Routes](#6-api-routes)
7. [Groq Integration](#7-groq-integration)
8. [Data Persistence](#8-data-persistence)
9. [Components](#9-components)
10. [Styling](#10-styling)
11. [Animations](#11-animations)
12. [Coding Standards](#12-coding-standards)
13. [Strict Prohibitions](#13-strict-prohibitions)
14. [Deploy](#14-deploy)

---

## 1. Project Overview

**Bug Obituary** is a portfolio project where developers can "bury" bugs they have fixed.  
Each bug receives a dramatised, AI-generated obituary — complete with name, birth date, death date,  
cause of death, legacy, and an epitaph — and is displayed on a visual graveyard grid as a gravestone card.

**Goal**: demonstrate full-stack Next.js skills, Groq AI integration, persistence, and polished UI/UX.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 — App Router | No Pages Router. Do not mix conventions. |
| Language | TypeScript (strict mode) | No `any`. No implicit `any`. |
| Styling | Tailwind CSS v3 | Utility-first. No CSS Modules unless scoping requires it. |
| AI | Groq API — `llama-3.3-70b-versatile` | Free tier. Never switch model without updating this file. |
| Persistence | Vercel KV (Redis) | Falls back to a local JSON file in development. |
| Animations | Framer Motion | Gravestone entrance and card flip animations only. |
| Deploy | Vercel | Single-command deploy via `vercel --prod`. |

---

## 3. Repository Structure

```
bug-obituary/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout — fonts, metadata, global providers
│   │   ├── page.tsx                    # / — Graveyard page (grid of gravestones)
│   │   ├── submit/
│   │   │   └── page.tsx                # /submit — Bug submission form
│   │   └── api/
│   │       └── obituary/
│   │           └── route.ts            # POST /api/obituary — Groq call + KV save
│   │
│   ├── components/
│   │   ├── GraveyardGrid.tsx           # Responsive grid, fetches and renders all bugs
│   │   ├── GravestoneCard.tsx          # Individual gravestone with flip animation
│   │   ├── ObituaryModal.tsx           # Full obituary displayed in a modal
│   │   └── BugForm.tsx                 # Controlled form for /submit
│   │
│   └── lib/
│       ├── groq.ts                     # Groq client initialisation + generateObituary()
│       ├── kv.ts                       # KV read/write helpers (Vercel KV + local fallback)
│       └── types.ts                    # All shared TypeScript types and interfaces
│
├── public/
│   └── og-image.png                    # Open Graph image for social sharing
│
├── .env.local                          # Local secrets — never commit this file
├── .env.example                        # Committed template with all required keys (no values)
├── next.config.ts                      # Next.js configuration
├── tailwind.config.ts                  # Tailwind configuration
├── tsconfig.json                       # TypeScript configuration
└── AGENTS.md                           # This file
```

> **Agent rule**: do not create files outside this structure without a documented reason.  
> Do not create barrel `index.ts` files unless there are 3 or more exports to consolidate.

---

## 4. Environment Variables

All variables must be declared in `.env.example` with empty values and a comment.  
Never hard-code secrets. Never commit `.env.local`.

```dotenv
# .env.example

# Groq API — get your free key at https://console.groq.com
GROQ_API_KEY=

# Vercel KV — provisioned automatically on Vercel, copy from dashboard for local dev
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Optional: set to "local" to use the JSON file fallback instead of KV in development
PERSISTENCE_DRIVER=
```

### Access pattern

Always access variables through a typed config helper. Never call `process.env` directly in components or route handlers.

```ts
// lib/config.ts
export const config = {
  groqApiKey: process.env.GROQ_API_KEY!,
  kvUrl: process.env.KV_REST_API_URL!,
  kvToken: process.env.KV_REST_API_TOKEN!,
  persistenceDriver: process.env.PERSISTENCE_DRIVER ?? "kv",
} as const;
```

---

## 5. App Router Conventions

This project uses the **Next.js App Router exclusively**. Every rule below is non-negotiable.

### Server vs. Client components

| Default | Override |
|---|---|
| All components are **Server Components** by default. | Add `"use client"` only when the component uses hooks, browser APIs, or event handlers. |

- `GraveyardGrid` — Server Component. Fetches all bugs at render time.
- `GravestoneCard` — Client Component. Requires Framer Motion and `useState` for flip.
- `ObituaryModal` — Client Component. Requires `useState` for open/close.
- `BugForm` — Client Component. Requires controlled inputs and `useRouter`.

### Data fetching

- Fetch data in Server Components using `async/await` directly. Do not use `useEffect` + `fetch` for initial data loading.
- Use `cache: "no-store"` on the graveyard fetch so new bugs appear without a redeploy.
- Mutations (form submit) must go through the API route, not Server Actions, to keep the AI call isolated.

### Metadata

Define metadata in `app/layout.tsx` and `app/page.tsx` using the `Metadata` export. Never use `<Head>` from `next/head` — that is Pages Router only.

```ts
// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bug Obituary",
  description: "A graveyard for bugs that have been fixed.",
};
```

### Routing

- `/` — graveyard grid
- `/submit` — submission form
- No dynamic routes are needed unless a "single bug page" feature is added later.

---

## 6. API Routes

### `POST /api/obituary`

**File**: `app/api/obituary/route.ts`

**Responsibility**: receive bug data from the form, call Groq to generate the obituary, persist the result, and return it.

**Request body** (`application/json`):

```ts
{
  bugName: string;       // e.g. "The NullPointer of Darkness"
  description: string;   // What the bug did
  born: string;          // ISO date string — when the bug first appeared
  died: string;          // ISO date string — when it was fixed
  stack: string;         // Technology context, e.g. "React, Node.js"
}
```

**Response body** (`application/json`):

```ts
{
  id: string;            // UUID generated server-side
  bugName: string;
  born: string;
  died: string;
  obituary: {
    title: string;
    causaMortis: string;
    legacy: string;
    epitaph: string;
  };
  createdAt: string;     // ISO timestamp
}
```

**Error responses**:

| Status | When |
|---|---|
| `400` | Missing required fields |
| `422` | Groq returned unparseable JSON |
| `500` | Groq API error or KV write failure |

**Implementation notes**:

- Validate the request body before calling Groq. Return `400` immediately if any required field is missing.
- Generate the `id` with `crypto.randomUUID()` — available natively in Node 18+.
- Do not stream the Groq response. Wait for the full JSON, parse it, then respond.
- The route must export only `POST`. Do not export `GET` from this file.

```ts
// app/api/obituary/route.ts — skeleton
import { NextRequest, NextResponse } from "next/server";
import { generateObituary } from "@/lib/groq";
import { saveBug } from "@/lib/kv";

export async function POST(req: NextRequest) {
  const body = await req.json();
  // 1. Validate
  // 2. Call generateObituary(body)
  // 3. Compose the full record with id + createdAt
  // 4. saveBug(record)
  // 5. Return NextResponse.json(record)
}
```

---

## 7. Groq Integration

**File**: `lib/groq.ts`

### Client initialisation

```ts
import Groq from "groq-sdk";
import { config } from "./config";

const groq = new Groq({ apiKey: config.groqApiKey });
```

Instantiate the client once at module level. Do not instantiate inside the function on every call.

### Model

Always use `llama-3.3-70b-versatile`. Do not change this without updating this file and testing token limits.

### Prompt

The system prompt must instruct the model to respond **only in valid JSON** with no preamble, no markdown fences, and no explanation. Any deviation will cause a `422` in the API route.

```ts
const SYSTEM_PROMPT = `
You are a dramatic and ironic writer specialised in software bug obituaries.
You must respond ONLY with a valid JSON object. No preamble. No markdown. No explanation.
The JSON must have exactly these keys:
  - title: string         — "In memoriam: [bug name]"
  - causaMortis: string   — Technical cause of death, written with theatrical drama (2–3 sentences)
  - legacy: string        — What this bug taught the developer (1–2 sentences, dry humour)
  - epitaph: string       — Final epitaph, max 15 words, ironic
`.trim();
```

### `generateObituary` function

```ts
export async function generateObituary(input: BugInput): Promise<ObituaryContent> {
  const userMessage = `
    Bug name: ${input.bugName}
    Description: ${input.description}
    Born: ${input.born}
    Died: ${input.died}
    Stack: ${input.stack}
  `.trim();

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.85,
    max_tokens: 512,
  });

  const raw = response.choices[0]?.message?.content ?? "";

  try {
    return JSON.parse(raw) as ObituaryContent;
  } catch {
    throw new Error(`Groq returned unparseable content: ${raw}`);
  }
}
```

### Rate limits (free tier)

The Groq free tier allows **30 requests per minute** on `llama-3.3-70b-versatile`. This project does not implement client-side rate limiting — rely on Groq's own 429 responses and surface them as a user-friendly error in the form.

---

## 8. Data Persistence

**File**: `lib/kv.ts`

### Schema

Each bug is stored as a single key-value pair:

- **Key**: `bug:{id}` — e.g. `bug:a1b2c3d4-...`
- **Value**: the full `BugRecord` object serialised as JSON

A sorted index is maintained separately:

- **Key**: `bugs:index`
- **Value**: array of `{ id, createdAt }` sorted descending by `createdAt`

### Vercel KV (production)

```ts
import { kv } from "@vercel/kv";

export async function saveBug(record: BugRecord): Promise<void> {
  await kv.set(`bug:${record.id}`, JSON.stringify(record));
  // Update index
  const index = (await kv.get<IndexEntry[]>("bugs:index")) ?? [];
  index.unshift({ id: record.id, createdAt: record.createdAt });
  await kv.set("bugs:index", JSON.stringify(index));
}

export async function getAllBugs(): Promise<BugRecord[]> {
  const index = (await kv.get<IndexEntry[]>("bugs:index")) ?? [];
  const records = await Promise.all(
    index.map((entry) => kv.get<BugRecord>(`bug:${entry.id}`))
  );
  return records.filter(Boolean) as BugRecord[];
}
```

### Local JSON fallback (development)

When `PERSISTENCE_DRIVER=local`, use a JSON file at `data/bugs.json`.  
This file must be in `.gitignore`.

```ts
// lib/kv.ts — driver selection
import { config } from "./config";

export const saveBug   = config.persistenceDriver === "local" ? saveBugLocal   : saveBugKv;
export const getAllBugs = config.persistenceDriver === "local" ? getAllBugsLocal : getAllBugsKv;
```

---

## 9. Components

### `GraveyardGrid`

- Server Component.
- Calls `getAllBugs()` directly (no API call needed — server-side).
- Renders a responsive CSS grid: 1 column on mobile, 3 on `md`, 4 on `lg`.
- Passes each `BugRecord` to `GravestoneCard`.
- If there are no bugs yet, renders an empty-state message: *"The graveyard is quiet... for now."*

### `GravestoneCard`

- Client Component (`"use client"`).
- Displays the bug name and death date on the front face.
- On click, flips (CSS 3D transform + Framer Motion) to reveal the epitaph on the back.
- Clicking the back opens `ObituaryModal`.
- Props: `bug: BugRecord`.

### `ObituaryModal`

- Client Component.
- Full-screen overlay with the complete obituary: title, dates, causa mortis, legacy, epitaph.
- Closes on backdrop click or `Escape` key.
- Props: `bug: BugRecord | null`, `onClose: () => void`.

### `BugForm`

- Client Component.
- Fields: bug name (text), description (textarea), born (date), died (date), stack (text).
- On submit: `POST /api/obituary`, then redirect to `/` using `useRouter`.
- Shows an inline loading state during the Groq call (it may take 2–4 seconds).
- Shows an inline error message if the API responds with an error.
- Does not use `<form action>` — uses `onSubmit` with `preventDefault`.

---

## 10. Styling

- **Tailwind CSS only**. Do not add a global `.css` file for component-specific styles.
- The graveyard aesthetic uses dark tones: slate-900 background, stone-300/400 text, and subtle green-900 accents for moss.
- Gravestone cards use a stone/gray palette with slight texture via Tailwind's `bg-stone-*` scale.
- Fonts: use `next/font/google` in `app/layout.tsx`. Suggested pairing:
  - Display: **Cinzel** (serif, gothic, appropriate for a graveyard)
  - Body: **Inter** (clean, readable)
- Do not use inline `style` props unless Tailwind cannot express the value (e.g. a specific transform origin for the card flip).

---

## 11. Animations

- All animations use **Framer Motion**. Do not use plain CSS `@keyframes` in component files.
- **Gravestone entrance**: `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}`. Stagger children with `staggerChildren: 0.05` in the parent `variants`.
- **Card flip**: 3D Y-axis rotation. Front face at `rotateY: 0`, back face at `rotateY: 180`. Use `backfaceVisibility: "hidden"` on both faces.
- **Modal**: fade in with `initial={{ opacity: 0 }}` → `animate={{ opacity: 1 }}`, duration `0.2s`.
- Respect `prefers-reduced-motion`: wrap animation props with a check using `useReducedMotion()` from Framer Motion and fall back to a simple opacity transition.

---

## 12. Coding Standards

### TypeScript

- `strict: true` in `tsconfig.json`. No exceptions.
- All shared types live in `lib/types.ts`. Do not define types inline in route handlers or components.
- Export types, not interfaces, for data shapes (easier to extend with `&`). Use `interface` only for React props.

```ts
// lib/types.ts

export type BugInput = {
  bugName: string;
  description: string;
  born: string;
  died: string;
  stack: string;
};

export type ObituaryContent = {
  title: string;
  causaMortis: string;
  legacy: string;
  epitaph: string;
};

export type BugRecord = BugInput & {
  id: string;
  obituary: ObituaryContent;
  createdAt: string;
};

export type IndexEntry = {
  id: string;
  createdAt: string;
};
```

### Imports

- Use the `@/` path alias for all project imports — it resolves to `src/` automatically when the `src` directory is present. Never use relative `../` paths that cross directory boundaries.
- Import order (enforced by ESLint `import/order` if configured): Node built-ins → external packages → internal `@/lib` → internal `@/components`.

### Error handling

- All `async` functions that call external services (`groq`, `kv`) must have `try/catch`.
- Never swallow errors silently. Either re-throw or return a typed error result.
- API routes must always return a `NextResponse.json` — never throw unhandled exceptions out of a route handler.

### Comments

- Write comments only when the *why* is non-obvious. Do not comment what the code does — only why it does it.
- All public functions in `lib/` must have a single-line JSDoc describing their purpose.

---

## 13. Strict Prohibitions

The following are **never** acceptable in this codebase. An agent that violates any of these rules must revert immediately.

| Prohibition | Reason |
|---|---|
| `"use client"` on layout or page files | Breaks static rendering and SEO |
| `process.env` accessed directly in components | Use `lib/config.ts` |
| Hardcoded API keys or secrets | Security |
| `any` type | Defeats TypeScript strict mode |
| `useEffect` for initial data fetching | Use Server Components |
| Pages Router conventions (`getServerSideProps`, `_app.tsx`, `pages/`) | This project uses App Router only |
| Streaming the Groq response | Adds complexity; full JSON parsing is required |
| Changing the Groq model | `llama-3.3-70b-versatile` is validated for this prompt; other models may reject the JSON-only instruction |
| Committing `.env.local` or any file containing secrets | Never |
| Installing new dependencies without updating this file | Undocumented dependencies break agent reproducibility |

---

## 14. Deploy

This project deploys to **Vercel** with zero configuration.

### Pre-deploy checklist

- [ ] All environment variables are set in the Vercel dashboard (Settings → Environment Variables).
- [ ] `GROQ_API_KEY` is set for Production and Preview environments.
- [ ] Vercel KV is provisioned and linked to the project (Storage → Create → KV).
- [ ] `KV_REST_API_URL` and `KV_REST_API_TOKEN` are populated (Vercel adds them automatically after linking KV).
- [ ] `data/` is in `.gitignore` (local JSON fallback must not ship).
- [ ] `npm run build` passes locally with no TypeScript errors.

### Deploy command

```bash
vercel --prod
```

### Vercel KV provisioning

1. Go to your Vercel project → **Storage** → **Create** → **KV**.
2. Link it to the project.
3. Vercel automatically injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` into all environments.
4. For local development, copy those values from the Vercel dashboard into `.env.local`.

### Regions

No special region configuration is needed. Vercel's default Edge Network is sufficient for this project's scale.