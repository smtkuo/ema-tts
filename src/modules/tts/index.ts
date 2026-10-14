// Public API of the tts module. Other modules and the app import only from "@/modules/tts".
import "server-only";
import { synthesize } from "./worker";

export const MAX_TEXT_LENGTH = 2000;

export class TtsInputError extends Error {}

export type SpeakInput = { text: unknown; speed?: unknown; seed?: unknown };

export async function speak({ text, speed, seed }: SpeakInput) {
  if (typeof text !== "string" || !text.trim()) throw new TtsInputError("text is required");
  if (text.length > MAX_TEXT_LENGTH) throw new TtsInputError(`text exceeds ${MAX_TEXT_LENGTH} characters`);
  if (speed != null && (typeof speed !== "number" || speed < 0.25 || speed > 4))
    throw new TtsInputError("speed must be between 0.25 and 4");
  if (seed != null && (!Number.isInteger(seed) || (seed as number) < 0))
    throw new TtsInputError("seed must be a non-negative integer");

  return synthesize(text, speed as number | undefined, seed as number | undefined);
}
