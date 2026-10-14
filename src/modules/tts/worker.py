"""Long-lived EMA Lightning worker.

Protocol: one JSON request per stdin line -> one JSON response per stdout line.
  in:  {"id": 1, "text": "...", "speed": 1.0, "seed": 0}
  out: {"id": 1, "wav": "<base64>", "duration": 1.23, "seed": 0}  or  {"id": 1, "error": "..."}
"""
import base64
import io
import json
import sys
import wave

import numpy as np
from ema_lightning import EMA

out = sys.stdout
sys.stdout = sys.stderr  # keep library prints off the protocol channel

tts = EMA()
out.write(json.dumps({"ready": True}) + "\n")
out.flush()


def to_wav(audio, sample_rate):
    pcm = (np.clip(audio, -1, 1) * 32767).astype("<i2")
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


for line in sys.stdin:
    req = json.loads(line)
    try:
        opts = {k: req[k] for k in ("speed", "seed") if req.get(k) is not None}
        speech = tts.say(req["text"], **opts)
        res = {
            "id": req["id"],
            "wav": base64.b64encode(to_wav(speech.audio, speech.sample_rate)).decode(),
            "duration": speech.duration,
            "seed": speech.seed,
        }
    except Exception as e:  # ValueError for bad settings; keep the worker alive
        res = {"id": req["id"], "error": str(e)}
    out.write(json.dumps(res) + "\n")
    out.flush()
