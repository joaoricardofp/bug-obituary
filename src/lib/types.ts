/** Raw input from the bug submission form. */
export type BugInput = {
  bugName: string;
  description: string;
  born: string;
  died: string;
  stack: string;
};

/** AI-generated obituary content returned by Groq. */
export type ObituaryContent = {
  title: string;
  causaMortis: string;
  legacy: string;
  epitaph: string;
};

/** Full persisted bug record stored in KV / local JSON. */
export type BugRecord = BugInput & {
  id: string;
  obituary: ObituaryContent;
  createdAt: string;
};

/** Lightweight entry in the bugs:index sorted list. */
export type IndexEntry = {
  id: string;
  createdAt: string;
};
