import fs from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import { config } from "./config";
import type { BugRecord, IndexEntry } from "./types";

// ---------------------------------------------------------------------------
// Upstash Redis client — instantiated once at module level
// ---------------------------------------------------------------------------
const redis = new Redis({
  url: config.upstashUrl,
  token: config.upstashToken,
});

// ---------------------------------------------------------------------------
// Production implementation — Upstash Redis
// ---------------------------------------------------------------------------

export async function saveBugKv(record: BugRecord): Promise<void> {
  // @upstash/redis auto-serialises objects — do NOT manually JSON.stringify
  await redis.set(`bug:${record.id}`, record);

  const index: IndexEntry[] = (await redis.get<IndexEntry[]>("bugs:index")) ?? [];
  index.unshift({ id: record.id, createdAt: record.createdAt });
  await redis.set("bugs:index", index);
}

export async function getAllBugsKv(): Promise<BugRecord[]> {
  const index: IndexEntry[] = (await redis.get<IndexEntry[]>("bugs:index")) ?? [];

  const records = await Promise.all(
    index.map((entry) => redis.get<BugRecord>(`bug:${entry.id}`)),
  );

  return records.filter(Boolean) as BugRecord[];
}

// ---------------------------------------------------------------------------
// Local JSON fallback — used when PERSISTENCE_DRIVER=local
// ---------------------------------------------------------------------------
const DATA_FILE = path.resolve(process.cwd(), "data", "bugs.json");

function readLocalData(): BugRecord[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as BugRecord[];
  } catch {
    return [];
  }
}

function writeLocalData(records: BugRecord[]): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
}

export async function saveBugLocal(record: BugRecord): Promise<void> {
  const records = readLocalData();
  records.unshift(record);
  writeLocalData(records);
}

export async function getAllBugsLocal(): Promise<BugRecord[]> {
  return readLocalData();
}

// ---------------------------------------------------------------------------
// Driver selection — default is "upstash"
// ---------------------------------------------------------------------------
export const saveBug =
  config.persistenceDriver === "local" ? saveBugLocal : saveBugKv;

export const getAllBugs =
  config.persistenceDriver === "local" ? getAllBugsLocal : getAllBugsKv;