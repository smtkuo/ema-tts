import { speak, TtsInputError } from "@/modules/tts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { wav, duration, seed } = await speak(await req.json());
    return new Response(new Uint8Array(wav), {
      headers: { "Content-Type": "audio/wav", "X-Duration": String(duration), "X-Seed": String(seed) },
    });
  } catch (e) {
    const status = e instanceof TtsInputError || e instanceof SyntaxError ? 400 : 500;
    return Response.json({ error: (e as Error).message }, { status });
  }
}
