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
10. [Three.js Scene](#10-threejs-scene)
11. [Styling](#11-styling)
12. [Animations](#12-animations)
13. [Coding Standards](#13-coding-standards)
14. [Strict Prohibitions](#14-strict-prohibitions)
15. [Deploy](#15-deploy)

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
| Persistence | Upstash Redis | Vercel KV was discontinued — use Upstash via `@upstash/redis`. Falls back to a local JSON file in development. |
| 3D Scene | Three.js (r128) | Full immersive graveyard — gravestones, fog, lighting, hover via raycasting. |
| UI Animations | Framer Motion | Modal entrance, card flip, and 2D overlay transitions only. |
| Deploy | Vercel | Single-command deploy via `vercel --prod`. |

---

## 3. Repository Structure

```
bug-obituary/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout — fonts, metadata, global providers
│   │   ├── page.tsx                    # / — Graveyard page (Three.js scene + 2D overlay)
│   │   ├── submit/
│   │   │   └── page.tsx                # /submit — Bug submission form
│   │   └── api/
│   │       └── obituary/
│   │           └── route.ts            # POST /api/obituary — Groq call + KV save
│   │
│   ├── components/
│   │   ├── GraveyardScene.tsx          # Three.js canvas — full immersive 3D graveyard
│   │   ├── GraveyardOverlay.tsx        # Absolute-positioned 2D layer over the canvas
│   │   ├── GravestoneCard.tsx          # 2D card shown on hover/click (Framer Motion)
│   │   ├── ObituaryModal.tsx           # Full obituary modal (Framer Motion)
│   │   └── BugForm.tsx                 # Controlled form for /submit
│   │
│   ├── three/
│   │   ├── scene.ts                    # Scene, camera, renderer, fog initialisation
│   │   ├── controls.ts                 # Orbit Controls — drag, zoom, pan navigation
│   │   ├── graveyard.ts                # Creates and positions all gravestone meshes
│   │   ├── gravestone.ts               # Three gravestone types + weathering details
│   │   ├── atmosphere.ts               # Moon, stars, dead trees, ground, fence
│   │   ├── lighting.ts                 # Ambient, moonlight, candle point lights, rim
│   │   └── raycaster.ts                # Hover detection — maps 3D mesh → BugRecord id
│   │
│   └── lib/
│       ├── groq.ts                     # Groq client initialisation + generateObituary()
│       ├── kv.ts                       # KV read/write helpers (Vercel KV + local fallback)
│       ├── config.ts                   # Typed environment variable access
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

# Upstash Redis — create a free database at https://console.upstash.com
# Copy the REST URL and token from the database dashboard
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Optional: set to "local" to use the JSON file fallback instead of KV in development
PERSISTENCE_DRIVER=
```

### Access pattern

Always access variables through a typed config helper. Never call `process.env` directly in components or route handlers.

```ts
// lib/config.ts
export const config = {
  groqApiKey: process.env.GROQ_API_KEY!,
  upstashUrl: process.env.UPSTASH_REDIS_REST_URL!,
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN!,
  persistenceDriver: process.env.PERSISTENCE_DRIVER ?? "upstash",
} as const;
```

---

## 5. App Router Conventions

This project uses the **Next.js App Router exclusively**. Every rule below is non-negotiable.

### Server vs. Client components

| Default | Override |
|---|---|
| All components are **Server Components** by default. | Add `"use client"` only when the component uses hooks, browser APIs, or event handlers. |

- `GraveyardScene` — Client Component. Mounts the Three.js canvas, requires `useEffect`, `useRef`, and `window`.
- `GraveyardOverlay` — Client Component. Renders the hovered `GravestoneCard` absolutely over the canvas.
- `GravestoneCard` — Client Component. Requires Framer Motion and `useState` for flip.
- `ObituaryModal` — Client Component. Requires `useState` for open/close.
- `BugForm` — Client Component. Requires controlled inputs and `useRouter`.

### Data fetching

- `app/page.tsx` is a Server Component that fetches all bugs and passes them as a serialised prop to `GraveyardScene`.
- Use `cache: "no-store"` on the graveyard fetch so new bugs appear without a redeploy.
- `GraveyardScene` receives `bugs: BugRecord[]` as a prop — it does not fetch data itself. Three.js runs entirely client-side.
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

Vercel KV has been discontinued. This project uses **Upstash Redis** via the `@upstash/redis` package, which provides an HTTP-based Redis client that works in both Node.js and Edge runtimes.

### Installation

```bash
npm install @upstash/redis
```

### Schema

Each bug is stored as a single key-value pair:

- **Key**: `bug:{id}` — e.g. `bug:a1b2c3d4-...`
- **Value**: the full `BugRecord` object serialised as JSON

A sorted index is maintained separately:

- **Key**: `bugs:index`
- **Value**: array of `{ id, createdAt }` sorted descending by `createdAt`

### Upstash client initialisation

```ts
// lib/kv.ts
import { Redis } from "@upstash/redis";
import { config } from "./config";

const redis = new Redis({
  url: config.upstashUrl,
  token: config.upstashToken,
});
```

Instantiate once at module level. Do not instantiate inside individual functions.

### Production implementation (Upstash)

```ts
export async function saveBugKv(record: BugRecord): Promise<void> {
  await redis.set(`bug:${record.id}`, JSON.stringify(record));

  const raw = await redis.get<string>("bugs:index");
  const index: IndexEntry[] = raw ? JSON.parse(raw) : [];
  index.unshift({ id: record.id, createdAt: record.createdAt });
  await redis.set("bugs:index", JSON.stringify(index));
}

export async function getAllBugsKv(): Promise<BugRecord[]> {
  const raw = await redis.get<string>("bugs:index");
  const index: IndexEntry[] = raw ? JSON.parse(raw) : [];

  const records = await Promise.all(
    index.map(async (entry) => {
      const data = await redis.get<string>(`bug:${entry.id}`);
      return data ? (JSON.parse(data) as BugRecord) : null;
    })
  );

  return records.filter(Boolean) as BugRecord[];
}
```

### Local JSON fallback (development)

When `PERSISTENCE_DRIVER=local`, use a JSON file at `data/bugs.json`.
This file must be in `.gitignore`.

```ts
// Driver selection
export const saveBug   = config.persistenceDriver === "local" ? saveBugLocal   : saveBugKv;
export const getAllBugs = config.persistenceDriver === "local" ? getAllBugsLocal : getAllBugsKv;
```

### Upstash setup (production)

1. Go to [console.upstash.com](https://console.upstash.com) → **Create database**.
2. Choose **Regional** (lower latency than Global for a single-region Vercel deploy). Pick the same region as your Vercel deployment (e.g. `us-east-1`).
3. Copy **REST URL** and **REST Token** from the database dashboard.
4. Add them to the Vercel dashboard under **Settings → Environment Variables** as `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
5. For local development, paste the same values into `.env.local`.

---

## 9. Components

### `GraveyardScene`

- Client Component (`"use client"`).
- Mounts a full-viewport `<canvas>` via `useRef`. Initialises the Three.js scene inside a `useEffect` that runs once on mount.
- Receives `bugs: BugRecord[]` as a prop. Passes the array to `graveyard.ts` to build the meshes.
- Runs the animation loop with `requestAnimationFrame`. Cancels the loop and disposes all geometries/materials on unmount.
- On each frame, calls the raycaster to detect which gravestone the cursor is over. On hover change, updates `hoveredId` state and positions the `GraveyardOverlay`.
- On click, if a gravestone is hovered, sets `selectedBug` state to open `ObituaryModal`.
- Must be dynamically imported in `app/page.tsx` with `ssr: false` — Three.js requires `window` and cannot run on the server.

```ts
// app/page.tsx
import dynamic from "next/dynamic";

const GraveyardScene = dynamic(
  () => import("@/components/GraveyardScene"),
  { ssr: false }
);
```

### `GraveyardOverlay`

- Client Component.
- Absolutely positioned `<div>` rendered on top of the canvas (`z-index: 10`).
- Receives `bug: BugRecord | null` and `screenPosition: { x: number; y: number } | null`.
- When `bug` is not null, renders a `GravestoneCard` at the given screen position.
- Pointer events must be `none` on the overlay container itself — only the card receives events.

### `GravestoneCard`

- Client Component.
- A 2D card that appears on gravestone hover showing: bug name and death date on the front, epitaph on the back.
- On click, triggers `onSelect` callback to open `ObituaryModal`.
- Flip animation via Framer Motion (Y-axis 3D rotation). See Section 11 for exact values.
- Props: `bug: BugRecord`, `onSelect: (bug: BugRecord) => void`.

### `ObituaryModal`

- Client Component.
- Full-screen overlay with the complete obituary: title, dates, causa mortis, legacy, epitaph.
- Closes on backdrop click or `Escape` key.
- Styled in the Tim Burton aesthetic: dark background, Cinzel font, faded parchment card, candlelight glow accents.
- Props: `bug: BugRecord | null`, `onClose: () => void`.

### `BugForm`

- Client Component.
- Fields: bug name (text), description (textarea), born (date), died (date), stack (text).
- On submit: `POST /api/obituary`, then redirect to `/` using `useRouter`.
- Shows an inline loading state during the Groq call (it may take 2–4 seconds).
- Shows an inline error message if the API responds with an error.
- Does not use `<form action>` — uses `onSubmit` with `preventDefault`.

---

## 10. Three.js Scene

All Three.js logic lives in `src/three/`. These are plain TypeScript modules — not React components. They are imported and called inside `GraveyardScene`'s `useEffect`.

### Visual aesthetic — Tim Burton cartoon macabre

The scene must feel hand-crafted and stylised, not photorealistic. Key principles:

- **Colour palette**: near-black sky (`#0a0a0f`), desaturated purple-grey ground (`#1a1520`), cold blue-white moonlight, warm amber point lights near certain graves.
- **Materials**: `MeshToonMaterial` throughout — it produces the characteristic cel-shaded look. No `MeshStandardMaterial` or `MeshPhongMaterial`.
- **Fog**: `THREE.FogExp2(0x0a0a0f, 0.035)` — exponential fog that thickens in the distance, hiding the scene edges cleanly.
- **No textures or external assets** — everything is built from primitives. This keeps the bundle small and the deploy simple.

---

### `scene.ts` — initialisation

```ts
export function createScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0f);
  scene.fog = new THREE.FogExp2(0x0a0a0f, 0.035);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  // Starting position — looking at the graveyard from a slight elevation
  camera.position.set(0, 4, 12);
  camera.lookAt(0, 0, 0);

  return { renderer, scene, camera };
}
```

---

### `controls.ts` — Orbit Controls (navigation)

Orbit Controls allow the user to drag to rotate, scroll to zoom, and right-click to pan freely around the graveyard.

**Important**: Three.js r128 does not bundle `OrbitControls` in the main package. Import it from the `three/examples/jsm/` path:

```ts
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export function createControls(
  camera: THREE.PerspectiveCamera,
  domElement: HTMLElement
): OrbitControls {
  const controls = new OrbitControls(camera, domElement);

  // Feel — slow, weighty, like you're really walking through fog
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.8;
  controls.panSpeed = 0.6;

  // Zoom limits — don't let the user clip inside a stone or fly to infinity
  controls.minDistance = 3;
  controls.maxDistance = 30;

  // Vertical angle limits — keep the ground and sky always visible
  controls.minPolarAngle = Math.PI * 0.1;  // ~18° — can't look straight up
  controls.maxPolarAngle = Math.PI * 0.72; // ~130° — can't go below ground

  // Target — orbit around the centre of the graveyard, not the world origin
  controls.target.set(0, 0.5, 0);
  controls.update();

  return controls;
}
```

**Call `controls.update()` every frame** inside the animation loop — required for damping to work:

```ts
// animation loop
function animate() {
  rafId = requestAnimationFrame(animate);
  controls.update(); // must be before renderer.render
  renderer.render(scene, camera);
}
```

**Dispose on unmount** to remove all event listeners:

```ts
return () => {
  cancelAnimationFrame(rafId);
  controls.dispose();
  renderer.dispose();
  // ... geometry/material disposal below
};
```

**`src/three/` must export `createControls`** and the `controls.ts` file must be added to the repository structure. Update the scaffold prompt in Section 13 accordingly.

---

### `gravestone.ts` — gravestone geometry (3 types, randomly assigned)

Each bug is assigned one of three archetypal gravestone shapes. The type is deterministic based on the bug's `id` so it never changes between renders: `type = hashId(id) % 3`.

`hashId` hashes the **full UUID string** to a stable 32-bit integer — this guarantees an even distribution across all three types regardless of UUID format, unlike `parseInt(id[0], 16) % 3` which clusters on whichever hex digits are most common.

All types share the same stone `MeshToonMaterial`. Stone base colour: `#3d3a4a`. Per-stone hue jitter: `±0.03` on the HSL hue channel (keeps them feeling like the same stone quarry, not a rainbow).

**Weathering details** are achieved entirely with geometry — no textures:

- **Moss patches**: 3–5 flat `BoxGeometry(rnd, 0.01, rnd)` slabs placed on the stone surface at random positions, `MeshToonMaterial` colour `#2d4a2d` (dark green). They sit flush against the slab face, rotated slightly.
- **Cracks**: 2–3 very thin, tall `BoxGeometry(0.01, rnd, 0.01)` meshes placed on the slab face at slight angles, same stone material but lightness `+0.05` so they catch light differently.
- **Name plate**: a thin `BoxGeometry(0.6, 0.25, 0.04)` raised `0.02` off the slab face, slightly lighter stone material (`lightness +0.04`). This represents the inscribed area. Do not attempt to render actual text in 3D — the bug name is shown only in the 2D `GravestoneCard` overlay.
- **Slight lean**: each stone group gets a random `rotation.z` tilt of `±0.05` radians — old stones sink unevenly.

#### Type 0 — Classic arch

The most common gravestone shape. A rectangular slab with a rounded top.

```ts
function buildClassicArch(mat: THREE.MeshToonMaterial): THREE.Group {
  const g = new THREE.Group();

  // Main rectangular body
  const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1.8, 0.22), mat);
  body.position.y = 0.9; // sits on ground at y=0
  g.add(body);

  // Arch cap — correct orientation: curved surface facing up, flat face down.
  // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength)
  const arch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.22, 16, 1, false, 0, Math.PI),
    mat
  );
  arch.rotation.x = Math.PI / 2; // stand upright so curved surface faces up
  arch.rotation.y = Math.PI / 2; // align flat cut along the body width axis
  arch.position.set(0, 1.8, 0); // sit exactly on top of the body's top edge
  g.add(arch);

  return g;
}
```

#### Type 1 — Cross

A vertical beam with a horizontal crossbar. More dramatic and recognisable at a distance.

```ts
function buildCross(mat: THREE.MeshToonMaterial): THREE.Group {
  const g = new THREE.Group();

  // Vertical beam — tall and slightly wider than it is deep
  const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.2, 0.2), mat);
  vertical.position.y = 1.1;
  g.add(vertical);

  // Horizontal crossbar — placed at ~70% of the total height
  const horizontal = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.28, 0.2), mat);
  horizontal.position.y = 1.6;
  g.add(horizontal);

  // Small base block — gives it weight and stops it looking like it floats
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.3), mat);
  base.position.y = 0.09;
  g.add(base);

  return g;
}
```

#### Type 2 — Obelisk

A tall, tapering rectangular monolith. Imposing and easy to spot across the graveyard.

```ts
function buildObelisk(mat: THREE.MeshToonMaterial): THREE.Group {
  const g = new THREE.Group();

  // Taper achieved with a custom BufferGeometry — 8 vertices, 2 faces per side
  // Bottom face: 0.7 × 0.3, Top face: 0.25 × 0.12, Height: 2.8
  const w0 = 0.35, d0 = 0.15; // half-extents at bottom
  const w1 = 0.125, d1 = 0.06; // half-extents at top
  const h = 2.8;

  const positions = new Float32Array([
    // bottom face (y=0)
    -w0, 0,  d0,   w0, 0,  d0,   w0, 0, -d0,  -w0, 0, -d0,
    // top face (y=h)
    -w1, h,  d1,   w1, h,  d1,   w1, h, -d1,  -w1, h, -d1,
  ]);
  const indices = [
    0,1,5, 0,5,4, // front
    1,2,6, 1,6,5, // right
    2,3,7, 2,7,6, // back
    3,0,4, 3,4,7, // left
    4,5,6, 4,6,7, // top
    0,3,2, 0,2,1, // bottom
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const obelisk = new THREE.Mesh(geo, mat);
  obelisk.castShadow = true;
  g.add(obelisk);

  // Stepped base block — gives it weight and visual grounding.
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.12, 0.35),
    mat.clone()
  );
  (base.material as THREE.MeshToonMaterial).color.offsetHSL(0, 0, 0.03);
  base.position.y = 0.06;
  g.add(base);

  // Pyramid cap — four-sided pointed top, rotated 45° so corners align with faces.
  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(0.15, 0.3, 4),
    mat
  );
  cap.position.y = h + 0.15;
  cap.rotation.y = Math.PI / 4;
  cap.castShadow = true;
  g.add(cap);

  return g;
}
```

#### Full `createGravestone` function

```ts
export function createGravestone(bug: BugRecord): THREE.Group {
  const rng = seededRandom(bug.id); // all randomness is seeded — stable across re-renders

  const mat = createStoneMaterial(rng);

  // Slightly lighter clone for name plate and crack details.
  const lightMat = mat.clone();
  lightMat.color.offsetHSL(0, 0, 0.04);

  const group = new THREE.Group();

  // Select one of three distinct shapes using the full-id hash.
  const typeIndex = hashId(bug.id) % 3;
  if (typeIndex === 0) {
    group.add(buildClassicArch(mat));
  } else if (typeIndex === 1) {
    group.add(buildCross(mat));
  } else {
    group.add(buildObelisk(mat));
  }

  // Name plate — thin raised panel mimicking an engraved inscription area.
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.04), lightMat);
  plate.position.set(0, 0.6, 0.13);
  group.add(plate);

  // Weathering — seeded so positions are stable across re-renders.
  addMoss(group, rng);
  addCracks(group, rng, lightMat.clone());

  // Small random tilt so stones look hand-placed and slightly weathered.
  group.rotation.z = (rng() - 0.5) * 0.06; // ±1.7° lean left/right
  group.rotation.x = (rng() - 0.5) * 0.04; // ±1.1° lean forward/back

  // Tag the group so raycaster.ts can resolve the hovered bug.
  group.userData.bugId = bug.id;
  // Also tag every child mesh so hits on individual parts bubble up correctly.
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.userData.bugId = bug.id;
    }
  });

  return group;
}
```

> **Raycaster note**: `Raycaster.intersectObjects` returns individual `Mesh` hits, not `Group` hits. After getting the first intersection, walk up with `object.parent` until `userData.bugId` is found. Tag every child mesh as shown above.

---

### `graveyard.ts` — organic polar layout

Gravestones are distributed using a **scattered polar arc** rather than a rigid grid — this avoids the mechanical row-and-column feel.

- Sort newest-first so the most recent bugs appear closest to the camera.
- Distribute stones across a **126° fan** (±63°) centred on the camera's look-at point, with per-stone angle jitter so no stone lines up perfectly.
- Depth increases for older bugs (newer: Z ≈ −2 to −5 · older: Z ≈ −5 to −14, fading into fog).
- All randomness is seeded from `hashId(bug.id)` so positions are stable across re-renders.
- Stones face roughly toward the camera position `(0, y, 12)` with a small random Y-rotation offset.
- Non-uniform scale per axis gives each stone a hand-carved feel.

```ts
export function buildGraveyard(
  bugs: BugRecord[],
  scene: THREE.Scene,
): Map<string, THREE.Group> {
  const meshMap = new Map<string, THREE.Group>();

  // Sort newest-first — newer bugs appear closer to the camera.
  const sorted = [...bugs].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  sorted.forEach((bug, i) => {
    const seed = hashId(bug.id);

    // Cheap LCG keyed per offset so each dimension gets its own stream.
    const pseudoRand = (offset: number): number =>
      (((seed + offset) * 1664525 + 1013904223) >>> 0) / 0xffffffff;

    // Distribute across a 126° fan centred on the camera's look-at point.
    const totalAngle = Math.PI * 0.7;
    const angleStep = sorted.length > 1 ? totalAngle / (sorted.length - 1) : 0;
    const baseAngle = -totalAngle / 2 + i * angleStep;
    const angleJitter = (pseudoRand(1) - 0.5) * (angleStep * 0.6);
    const finalAngle = baseAngle + angleJitter;

    // Newer bugs: z ≈ −2 to −5. Older bugs: z ≈ −5 to −14, fading into fog.
    const depthFraction = sorted.length > 1 ? i / (sorted.length - 1) : 0;
    const baseDepth = 2 + depthFraction * 10;
    const depthJitter = (pseudoRand(2) - 0.5) * 2.5;
    const finalDepth = Math.max(1.5, baseDepth + depthJitter);

    const x = Math.sin(finalAngle) * finalDepth + (pseudoRand(3) - 0.5) * 1.2;
    const z = -Math.cos(finalAngle) * finalDepth + (pseudoRand(4) - 0.5) * 1.0;

    const stone = createGravestone(bug);
    stone.position.set(x, 0, z);

    // Rotate stones to face roughly toward the camera position (0, y, 12).
    const angleToCamera = Math.atan2(-x, -z - 12);
    stone.rotation.y = angleToCamera + (pseudoRand(5) - 0.5) * 0.4;

    // Non-uniform scale for a hand-carved, organic feel.
    stone.scale.set(
      0.85 + pseudoRand(6) * 0.3,
      0.9 + pseudoRand(7) * 0.45,
      0.9 + pseudoRand(8) * 0.15,
    );

    scene.add(stone);
    meshMap.set(bug.id, stone);
  });

  return meshMap;
}
```

---

### `atmosphere.ts` — environmental elements

- **Ground**: `PlaneGeometry(80, 80)` rotated flat (`rotation.x = -Math.PI / 2`), `MeshToonMaterial` colour `#1a1520`. Receives shadows.
- **Moon**: `SphereGeometry(1.5, 16, 16)` placed at `(-10, 14, -25)`, `MeshToonMaterial` colour `#dde8f0`, `emissive: #aabbcc`, `emissiveIntensity: 0.3`. Does not cast shadows.
- **Dead trees**: 4–6 trees scattered at the scene perimeter (Z between `-18` and `-8`, X between `±12`). Each tree:
  - Trunk: `CylinderGeometry(0.08, 0.14, 2.5, 6)` — slightly irregular hexagonal cross-section for a hand-drawn feel.
  - Branches: 3–4 `CylinderGeometry(0.03, 0.06, 1.0, 5)` meshes attached at the upper trunk, angled outward (`rotation.z = ±0.6–1.0`) and rotated around Y at random.
  - All parts `MeshToonMaterial` colour `#1c1410` (near-black brown).
- **Stars**: `Points` with 400 random positions in a hemisphere of radius `45` (only positive Y). `PointsMaterial` size `0.06`, colour `#e8e8ff`, `sizeAttenuation: true`.
- **Fence**: optional — a row of thin `BoxGeometry` pickets (`0.06 × 0.9 × 0.06`) spaced `0.35` apart along the back edge of the graveyard (Z = `-(rows * 3 + 2)`), connected by two horizontal rails. `MeshToonMaterial` colour `#1a1510`. Adds depth without complexity.

---

### `lighting.ts`

`createLighting` **returns** the two candle `PointLight` references so the animation loop in `GraveyardScene` can animate their intensities for a flicker effect.

```ts
export function createLighting(scene: THREE.Scene): {
  candle1: THREE.PointLight;
  candle2: THREE.PointLight;
} {
  // Low ambient — prevents shadows from going pure black.
  const ambient = new THREE.AmbientLight(0x1a1a2e, 0.5);
  scene.add(ambient);

  // Moonlight — cold blue-white directional from top-left.
  const moon = new THREE.DirectionalLight(0x8899cc, 1.4);
  moon.position.set(-10, 14, -5);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.near = 0.5;
  moon.shadow.camera.far = 60;
  moon.shadow.camera.left = -20;
  moon.shadow.camera.right = 20;
  moon.shadow.camera.top = 20;
  moon.shadow.camera.bottom = -20;
  scene.add(moon);

  // Warm candle-glow — placed near the front gravestones, left side.
  const candle1 = new THREE.PointLight(0xff6a00, 2.0, 7);
  candle1.position.set(-2, 0.4, 4);
  scene.add(candle1);

  // Second candle — right side, creates asymmetric warmth.
  const candle2 = new THREE.PointLight(0xff8c00, 1.4, 5);
  candle2.position.set(3.5, 0.4, 2);
  scene.add(candle2);

  // Subtle cool rim from behind — separates distant stones from the fog.
  const rim = new THREE.DirectionalLight(0x334466, 0.4);
  rim.position.set(5, 3, -15);
  scene.add(rim);

  return { candle1, candle2 };
}
```

---

### `raycaster.ts` — hover detection

- Maintains a `THREE.Raycaster` and a `THREE.Vector2` for normalised mouse coordinates.
- `updateMouse(event, canvas)` — converts `clientX/Y` to NDC (`-1` to `+1`) relative to the canvas bounds (not `window`) so it works correctly when the canvas does not fill the viewport.
- `getHoveredBugId(camera, scene)` — casts the ray against all objects in the scene with `recursive: true`, then walks up the hit object's parent chain until a `userData.bugId` is found. Returns `null` if none.
- `getScreenPosition(group, camera, renderer)` — projects the group's world position to CSS pixel coordinates for overlay placement.

```ts
// Walk up from the hit mesh to find the bugId on the group
function findBugId(object: THREE.Object3D): string | null {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.userData.bugId) return current.userData.bugId as string;
    current = current.parent;
  }
  return null;
}

export function getHoveredBugId(
  raycaster: THREE.Raycaster,
  mouse: THREE.Vector2,
  camera: THREE.Camera,
  scene: THREE.Scene
): string | null {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  for (const hit of hits) {
    const id = findBugId(hit.object);
    if (id) return id;
  }
  return null;
}

export function getScreenPosition(
  group: THREE.Object3D,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer
): { x: number; y: number } {
  const pos = new THREE.Vector3();
  group.getWorldPosition(pos);
  // Offset upward so the card appears above the stone, not inside it
  pos.y += 1.2;
  pos.project(camera);
  return {
    x: (pos.x * 0.5 + 0.5) * renderer.domElement.clientWidth,
    y: (-pos.y * 0.5 + 0.5) * renderer.domElement.clientHeight,
  };
}
```

---

### Hover highlight

When a gravestone is hovered, traverse its group and set `emissive` to `0x2a1a44` (cold purple glow) on every `MeshToonMaterial` child. On hover exit, reset to `0x000000`. Change the cursor to `pointer` via `canvas.style.cursor`.

Because each gravestone uses its own material instance (created fresh in `createGravestone`), it is safe to mutate the material directly without cloning.

This logic lives inline in `GraveyardScene.tsx`'s animation loop, not in a separate utility, so it has direct access to the `meshMap` and React state setters.

```ts
// Inside the animation loop in GraveyardScene.tsx
if (newHoveredId !== hoveredIdRef.current) {
  // Reset emissive on previously hovered group.
  if (hoveredIdRef.current) {
    const prev = meshMap.get(hoveredIdRef.current);
    if (prev) {
      prev.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.MeshToonMaterial).emissive.set(0x000000);
        }
      });
    }
  }
  // Apply cold purple highlight to newly hovered group.
  if (newHoveredId) {
    const next = meshMap.get(newHoveredId);
    if (next) {
      next.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.MeshToonMaterial).emissive.set(0x2a1a44);
        }
      });
    }
  }
}
```

---

### Candle flicker animation

In the animation loop, animate the two candle `PointLight` intensities with low-frequency noise to simulate a real flame:

```ts
const t = clock.getElapsedTime();
candle1.intensity = 2.0 + Math.sin(t * 3.7) * 0.3 + Math.sin(t * 11.3) * 0.15;
candle2.intensity = 1.4 + Math.sin(t * 4.1) * 0.2 + Math.sin(t * 9.7) * 0.1;
```

---

### Performance constraints

- Target 60 fps on mid-range hardware.
- Cap `devicePixelRatio` at `2`.
- Shadow map size: `1024 × 1024` — sufficient for this scene scale without GPU cost.
- Do not use post-processing passes (`EffectComposer`) — the Tim Burton look is achieved through materials and lighting, not filters.
- Dispose of all geometries, materials, and controls on unmount:

```ts
return () => {
  cancelAnimationFrame(rafId);
  controls.dispose();
  renderer.dispose();
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else {
        (obj.material as THREE.Material).dispose();
      }
    }
  });
};
```

---

## 11. Styling

- **Tailwind CSS only** for 2D UI elements. Do not add a global `.css` file for component-specific styles.
- The Tim Burton aesthetic governs all 2D elements that overlay the scene (modal, card, form, nav).
- **Colour palette**:
  - Background: `slate-950` / `#0a0a0f`
  - Surface (cards, modal): `stone-900` with a faint purple tint (`bg-[#1c1824]`)
  - Primary text: `stone-200`
  - Accent: `purple-400` for names and highlights; `amber-400` for dates and epitaphs
  - Borders: `stone-700` at low opacity
- **Fonts** — load via `next/font/google` in `app/layout.tsx`:
  - Display / headings: **Cinzel** (gothic serif — graveyard inscriptions)
  - Body: **Crimson Text** (old-style serif — obituary prose)
- **The `/submit` page** should feel like filling out a death certificate — dark form, Cinzel labels, parchment-toned inputs (`bg-stone-800`).
- Do not use inline `style` props unless Tailwind cannot express the value (e.g. specific 3D transform origins for the card flip).

---

## 12. Animations

Framer Motion is used **only for 2D UI elements**. Three.js handles all in-scene motion.

- **`GravestoneCard` flip**: 3D Y-axis rotation via Framer Motion. Front face at `rotateY: 0`, back face at `rotateY: 180`. Use `backfaceVisibility: "hidden"` on both faces. Wrap in `style={{ perspective: 1000 }}` on the container.
- **`GravestoneCard` entrance**: `initial={{ opacity: 0, y: 10 }}` → `animate={{ opacity: 1, y: 0 }}`, duration `0.2s`. Triggered when the card appears on hover.
- **`ObituaryModal`**: backdrop fades in with `initial={{ opacity: 0 }}` → `animate={{ opacity: 1 }}`, duration `0.2s`. Modal panel slides up: `initial={{ y: 40, opacity: 0 }}` → `animate={{ y: 0, opacity: 1 }}`, duration `0.3s`.
- **`AnimatePresence`**: wrap both `GravestoneCard` (in overlay) and `ObituaryModal` in `AnimatePresence` so exit animations play correctly when they unmount.
- Respect `prefers-reduced-motion`: use `useReducedMotion()` from Framer Motion and fall back to opacity-only transitions when it returns `true`.

---

## 13. Coding Standards

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

## 14. Strict Prohibitions

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
| `THREE.CapsuleGeometry` | Not available in Three.js r128 — introduced in r142 |
| `MeshStandardMaterial` or `MeshPhongMaterial` in the scene | Use `MeshToonMaterial` exclusively to preserve the Tim Burton cel-shaded aesthetic |
| Post-processing (`EffectComposer`, passes) | Performance overhead; the visual style is achieved through materials and lighting |
| Importing Three.js in a Server Component | Three.js requires `window` — it must only run in Client Components or inside `useEffect` |
| Three.js scene code in `src/components/` | All scene logic belongs in `src/three/`; components only mount the canvas and wire up state |
| Camera auto-drift sinusoidal animation on position | Orbit Controls manage camera position — mutating `camera.position` in the loop breaks damping |
| Importing `OrbitControls` from `three` directly | Import only from `three/examples/jsm/controls/OrbitControls` |

---

## 15. Deploy

This project deploys to **Vercel** with zero configuration.

### Pre-deploy checklist

- [ ] All environment variables are set in the Vercel dashboard (Settings → Environment Variables).
- [ ] `GROQ_API_KEY` is set for Production and Preview environments.
- [ ] Upstash database is created at [console.upstash.com](https://console.upstash.com).
- [ ] `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set in Vercel dashboard.
- [ ] `data/` is in `.gitignore` (local JSON fallback must not ship).
- [ ] `npm run build` passes locally with no TypeScript errors.

### Deploy command

```bash
vercel --prod
```

### Upstash setup

See Section 8 for the full step-by-step. Short version: create a Regional database at [console.upstash.com](https://console.upstash.com), copy the REST URL and token, add them to Vercel's environment variables and to `.env.local` for local development.

### Regions

No special region configuration is needed. Vercel's default Edge Network is sufficient for this project's scale.