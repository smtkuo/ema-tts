# ⚡ EMA TTS

[EMA Lightning](https://huggingface.co/canberkkkkkk/ema-lightning) ile tamamen yerelde çalışan Türkçe TTS (Next.js + Python).

## Kurulum

```bash
npm install
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
npm run dev                     # http://localhost:3000
```

Model (~34 MB) ilk istekte Hugging Face'ten indirilir ve `~/.cache/huggingface/hub` altına kaydedilir. Sonrasında internet gerekmez.

## Yapı

```
src/app/                 # UI + POST /api/tts
src/modules/tts/         # TTS modülü (dışarıya yalnızca index.ts açık)
  index.ts               # speak() + doğrulama
  worker.ts              # Python sürecini yönetir
  worker.py              # Modeli bir kez yükler, istekleri işler
```

## API

```bash
curl -X POST localhost:3000/api/tts -H "Content-Type: application/json" \
  -d '{"text":"Merhaba!","speed":1,"seed":0}' -o out.wav
```

`text` zorunlu (en fazla 2000 karakter). `speed` 0.25–4, `seed` ≥ 0. Yanıt 48 kHz WAV olarak döner.
