import "server-only";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";
import readline from "node:readline";

type Pending = { resolve: (v: WorkerResult) => void; reject: (e: Error) => void };
export type WorkerResult = { wav: Buffer; duration: number; seed: number };

const PYTHON =
  process.env.EMA_PYTHON ??
  path.join(process.cwd(), ".venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
const SCRIPT = path.join(process.cwd(), "src/modules/tts/worker.py");

// ponytail: one process for the whole server; EMA's Playhead batches concurrent work inside it.
// Requests are serialized over stdin, so add a pool of workers if CPU throughput matters.
let proc: ChildProcessWithoutNullStreams | null = null;
let ready: Promise<void> | null = null;
let nextId = 0;
const pending = new Map<number, Pending>();

function start() {
  proc = spawn(PYTHON, ["-u", SCRIPT], { env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
  proc.stderr.on("data", (d) => process.stderr.write(`[ema] ${d}`));

  ready = new Promise((resolve, reject) => {
    readline.createInterface({ input: proc!.stdout }).on("line", (line) => {
      const msg = JSON.parse(line);
      if (msg.ready) return resolve();
      const p = pending.get(msg.id);
      if (!p) return;
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error));
      else p.resolve({ wav: Buffer.from(msg.wav, "base64"), duration: msg.duration, seed: msg.seed });
    });
    const fail = (e: Error) => {
      reject(e);
      for (const p of pending.values()) p.reject(e);
      pending.clear();
      proc = null; // next request respawns
    };
    proc!.on("error", fail);
    proc!.on("exit", (code) => fail(new Error(`EMA worker exited (code ${code})`)));
  });
}

export async function synthesize(text: string, speed?: number, seed?: number): Promise<WorkerResult> {
  if (!proc) start();
  await ready;
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    proc!.stdin.write(JSON.stringify({ id, text, speed, seed }) + "\n");
  });
}
