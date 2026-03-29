import Groq from "groq-sdk";
import { config } from "@/lib/config";
import type { BugInput, ObituaryContent } from "@/lib/types";

// Instantiate once at module level — never inside the function.
const groq = new Groq({ apiKey: config.groqApiKey });

const SYSTEM_PROMPT = `
You are a dramatic and ironic writer specialised in software bug obituaries.
You must respond ONLY with a valid JSON object. No preamble. No markdown. No explanation.
The JSON must have exactly these keys:
  - title: string         — "In memoriam: [bug name]"
  - causaMortis: string   — Technical cause of death, written with theatrical drama (2–3 sentences)
  - legacy: string        — What this bug taught the developer (1–2 sentences, dry humour)
  - epitaph: string       — Final epitaph, max 15 words, ironic
`.trim();

/** Call Groq to generate a dramatic obituary for a given bug. */
export async function generateObituary(
  input: BugInput,
): Promise<ObituaryContent> {
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