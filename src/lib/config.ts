/** Typed, centralised access to environment variables. Never call process.env directly outside this file. */
export const config = {
  groqApiKey: process.env.GROQ_API_KEY!,
  upstashUrl: process.env.UPSTASH_REDIS_REST_URL!,
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN!,
  persistenceDriver: process.env.PERSISTENCE_DRIVER ?? "upstash",
} as const;
