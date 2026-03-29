import fs from "node:fs";
import path from "node:path";
import { config } from "@/lib/config";
import type { BugRecord, IndexEntry } from "@/lib/types";

// ─── Vercel KV (production) ─────────────────────────────────────────────────

/** Save a bug record to Vercel KV and update the sorted index. */
async function saveBugKv(record: BugRecord): Promise<void> {
  const { kv } = await import("@vercel/kv");
  await kv.set(`bug:${record.id}`, JSON.stringify(record));
  const index = (await kv.get<IndexEntry[]>("bugs:index")) ?? [];
  index.unshift({ id: record.id, createdAt: record.createdAt });
  await kv.set("bugs:index", JSON.stringify(index));
}

/** Retrieve all bug records from Vercel KV, ordered newest-first. */
async function getAllBugsKv(): Promise<BugRecord[]> {
  const { kv } = await import("@vercel/kv");
  const index = (await kv.get<IndexEntry[]>("bugs:index")) ?? [];
  const records = await Promise.all(
    index.map((entry) => kv.get<BugRecord>(`bug:${entry.id}`)),
  );
  return records.filter(Boolean) as BugRecord[];
}

// ─── Local JSON fallback (development) ──────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "bugs.json");

function readLocalBugs(): BugRecord[] {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw) as BugRecord[];
}

function writeLocalBugs(bugs: BugRecord[]): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(bugs, null, 2), "utf-8");
}

/** Save a bug record to the local JSON file. */
async function saveBugLocal(record: BugRecord): Promise<void> {
  const bugs = readLocalBugs();
  bugs.unshift(record);
  writeLocalBugs(bugs);
}

/** Retrieve all bug records from the local JSON file, newest-first. */
async function getAllBugsLocal(): Promise<BugRecord[]> {
  return readLocalBugs();
}

// ─── Driver selection ────────────────────────────────────────────────────────

export const saveBug =
  config.persistenceDriver === "local" ? saveBugLocal : saveBugKv;

export const getAllBugs =
  config.persistenceDriver === "local" ? getAllBugsLocal : getAllBugsKv;
