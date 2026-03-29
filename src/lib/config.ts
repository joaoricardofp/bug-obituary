/** Typed, centralised access to environment variables. Never call process.env directly outside this file. */
export const config = {
  groqApiKey: process.env.GROQ_API_KEY!,
  kvUrl: process.env.KV_REST_API_URL!,
  kvToken: process.env.KV_REST_API_TOKEN!,
  persistenceDriver: process.env.PERSISTENCE_DRIVER ?? "kv",
} as const;
