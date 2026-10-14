"use client";
import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("Merhaba, size nasıl yardımcı olabilirim?");
  const [speed, setSpeed] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setInfo("");
    try {
      const t0 = performance.now();
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, speed }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(await res.blob()));
      const ms = Math.round(performance.now() - t0);
      setInfo(`${Number(res.headers.get("X-Duration")).toFixed(2)} sn ses, ${ms} ms, seed ${res.headers.get("X-Seed")}`);
    } catch (err) {
      setInfo(`Hata: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>⚡ EMA TTS</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label htmlFor="text">Metin</label>
        <textarea id="text" rows={5} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} />
        <label htmlFor="speed">Hız: {speed}×</label>
        <input id="speed" type="range" min={0.5} max={2} step={0.1} value={speed} onChange={(e) => setSpeed(+e.target.value)} />
        <button disabled={loading || !text.trim()}>{loading ? "Üretiliyor…" : "Seslendir"}</button>
      </form>
      {info && <p role="status">{info}</p>}
      {audioUrl && <audio src={audioUrl} controls autoPlay style={{ width: "100%" }} />}
    </main>
  );
}
