"""Generate 142 dramatic, theatrical English fighter & boss voices into assets/voices/.

v3.8.0 English Theatrical Voice Overhaul:
- Uses Microsoft Edge Neural Voices with distinct actors per fighter, twin & boss.
- Multi-segment escalation on supers/finishers/boss intros, urgent combat delivery,
  formant-preserving NCC-PSOLA theatrical pitch arcs on short kiais/hurts/KOs,
  chest sub-harmonics on Titan/Voss, demonic dual-octave molten roar on Furnace Maw,
  and 24kHz 4-band studio mastering.

Run with: tools/english-voice-runtime/Scripts/python.exe -X utf8 tools/generate-english-voices.py

v3.20.1 engines (the caches are separate, and --install records the engine in manifest.json):
  --engine kokoro (default): Kokoro-82M through kokoro-onnx, fully local. Model Apache-2.0, runtime MIT.
      Needs tools/english-voice-runtime/kokoro/kokoro-v1.0.onnx and voices-v1.0.bin (kokoro-onnx release model-files-v1.1)
      and `pip install kokoro-onnx` in the runtime. The cast is "kokoroVoice" per profile in english-config.json.
      Kokoro has a speed control but no pitch control: the requested pitch offset becomes a resampling ratio
      (offset / typical f0 of the register) and the speed is divided by the same ratio, so tempo stays as requested.
  --engine azure: Azure AI Speech REST API with the original neural voices. Needs AZURE_SPEECH_KEY and
      AZURE_SPEECH_REGION in the environment (never in a file).
  --engine edge: the v3.8.0 path (edge-tts, the Edge read-aloud endpoint). Local auditions only; cannot --install.
"""
import argparse
import array
import asyncio
import hashlib
import json
import math
import os
import sys
import urllib.error
import urllib.request
import wave
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
VOICES = ROOT / "assets" / "voices"
CFG_PATH = VOICES / "english-config.json"
OUT_DIR = VOICES / "generated-en"
CACHE_DIR = OUT_DIR / "cache"
RATE = 24000


def read_wav_pcm(path: Path) -> array.array:
    with wave.open(str(path), "rb") as f:
        assert (f.getnchannels(), f.getsampwidth(), f.getframerate()) == (1, 2, RATE)
        pcm = array.array("h", f.readframes(f.getnframes()))
    if sys.byteorder != "little":
        pcm.byteswap()
    return pcm


def save_pcm(path: Path, samples: array.array) -> None:
    enc = array.array("h", samples)
    if sys.byteorder != "little":
        enc.byteswap()
    with wave.open(str(path), "wb") as f:
        f.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
        f.writeframes(enc.tobytes())


def fmt_delta(val: int, unit: str) -> str:
    return f"{val:+d}{unit}"


def event_deltas(event: str) -> tuple[int, int]:
    """Return (rate_delta_pct, pitch_delta_hz) for dramatic combat acting."""
    if event in ("light0", "light1", "jump"):
        return 18, 16
    if event in ("heavy0", "heavy1", "throw", "burst", "dash", "throw_release", "combo"):
        return 14, 14
    if event in ("sp1", "sp2", "sp3"):
        return 12, 16
    if event in ("hurt0", "grabbed", "throw_impact"):
        return 18, 18
    if event in ("hurt1", "thrown"):
        return 10, 12
    if event in ("ko", "defeat"):
        return -10, -8
    if event == "win":
        return 2, 2
    if event == "select":
        return 2, 2
    if event == "intro":
        return -2, -4
    return 6, 6


ENGINE = "kokoro"
KOKORO_DIR = ROOT / "tools" / "english-voice-runtime" / "kokoro"
_kokoro = None


def kokoro_request(text: str, voice: str, rate_str: str, pitch_str: str) -> array.array:
    """Local synthesis. `voice` is "<kokoro voice>|<register>"; a voice may be a blend "a*0.6+b*0.4"."""
    global _kokoro
    import numpy as np
    from kokoro_onnx import Kokoro
    if _kokoro is None:
        _kokoro = Kokoro(str(KOKORO_DIR / "kokoro-v1.0.onnx"), str(KOKORO_DIR / "voices-v1.0.bin"))
    name, register = voice.split("|")
    if "*" in name:
        style = sum(_kokoro.get_voice_style(part.split("*")[0]) * float(part.split("*")[1]) for part in name.split("+"))
    else:
        style = name
    speed = 1.0 + int(rate_str.rstrip("%")) / 100.0
    typical_f0 = {"male": 115.0, "female": 205.0}.get(register, 100.0)  # titan / boss / monster are low voices
    ratio = max(0.8, min(1.25, 1.0 + int(pitch_str[:-2]) / typical_f0))
    lang = "en-gb" if name.startswith("b") else "en-us"
    audio, rate = _kokoro.create(text, voice=style, speed=max(0.5, min(2.0, speed / ratio)), lang=lang)
    assert rate == RATE, rate
    audio = np.asarray(audio, dtype=np.float64)
    if abs(ratio - 1.0) > 1e-3:  # play faster / slower: pitch moves by `ratio`, tempo returns to the requested speed
        audio = np.interp(np.arange(0, len(audio) - 1, ratio), np.arange(len(audio)), audio)
    peak = float(np.abs(audio).max()) or 1.0
    if len(audio) < RATE * 0.08:
        raise RuntimeError(f"Empty audio for {voice}: {text!r}")
    return array.array("h", (np.clip(audio / peak * 0.82, -1, 1) * 32767).astype(np.int16).tolist())


def azure_request(text: str, voice: str, rate_str: str, pitch_str: str) -> array.array:
    """One blocking call to the Azure AI Speech REST endpoint. Returns 24 kHz mono 16-bit PCM."""
    key, region = os.environ["AZURE_SPEECH_KEY"], os.environ["AZURE_SPEECH_REGION"]
    body = escape(text)
    if "Multilingual" in voice:  # same English delivery the multilingual voices gave before
        body = f"<lang xml:lang='en-US'>{body}</lang>"
    ssml = (f"<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='{voice}'>"
            f"<prosody rate='{rate_str}' pitch='{pitch_str}'>{body}</prosody></voice></speak>")
    request = urllib.request.Request(
        f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1", data=ssml.encode("utf-8"), method="POST",
        headers={"Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml",
                 "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm", "User-Agent": "voice-build"})
    with urllib.request.urlopen(request, timeout=60) as response:
        riff = response.read()
    at = riff.find(b"data")
    if not riff.startswith(b"RIFF") or at < 0 or len(riff) - at - 8 < 512:
        raise RuntimeError(f"Empty audio for {voice}: {text!r}")
    raw = riff[at + 8:]
    pcm = array.array("h", raw[:len(raw) // 2 * 2])
    if sys.byteorder != "little":
        pcm.byteswap()
    return pcm


async def fetch_tts_segment(sem, text: str, voice: str, rate_str: str, pitch_str: str) -> array.array:
    key = hashlib.sha256(f"{voice}|{rate_str}|{pitch_str}|{text}".encode("utf-8")).hexdigest()[:24]
    cached = CACHE_DIR / (f"{key}.wav" if ENGINE == "edge" else f"{ENGINE}-{key}.wav")
    if cached.is_file():
        return read_wav_pcm(cached)
    if ENGINE == "kokoro":
        async with sem:
            pcm = await asyncio.to_thread(kokoro_request, text, voice, rate_str, pitch_str)
            save_pcm(cached, pcm)
            return pcm
    if ENGINE == "azure":
        async with sem:
            last_err = None
            for attempt in range(6):
                try:
                    pcm = await asyncio.to_thread(azure_request, text, voice, rate_str, pitch_str)
                    save_pcm(cached, pcm)
                    return pcm
                except urllib.error.HTTPError as exc:
                    if exc.code in (401, 403):
                        raise RuntimeError("Azure AI Speech refused the key or region (HTTP %d). Check AZURE_SPEECH_KEY / AZURE_SPEECH_REGION." % exc.code)
                    if exc.code == 400:
                        raise RuntimeError(f"Azure AI Speech rejected the request for {voice}: {text!r} (HTTP 400). Is the voice available in this region?")
                    last_err = exc
                    await asyncio.sleep(2.0 * (attempt + 1))  # 429 and 5xx: back off
                except Exception as exc:
                    last_err = exc
                    await asyncio.sleep(1.0 * (attempt + 1))
            raise RuntimeError(f"Azure TTS failed after retries for {text!r}: {last_err}")
    import edge_tts
    import miniaudio
    async with sem:
        last_err = None
        for attempt in range(4):
            try:
                comm = edge_tts.Communicate(text, voice, rate=rate_str, pitch=pitch_str)
                mp3 = bytearray()
                async for chunk in comm.stream():
                    if chunk["type"] == "audio":
                        mp3.extend(chunk["data"])
                if len(mp3) < 256:
                    raise RuntimeError(f"Empty audio for {voice}: {text!r}")
                dec = miniaudio.decode(
                    bytes(mp3),
                    output_format=miniaudio.SampleFormat.SIGNED16,
                    nchannels=1,
                    sample_rate=RATE,
                )
                pcm = array.array("h", dec.samples)
                save_pcm(cached, pcm)
                return pcm
            except Exception as exc:
                last_err = exc
                await asyncio.sleep(0.5 * (attempt + 1))
        raise RuntimeError(f"TTS failed after retries for {text!r}: {last_err}")


def trim_pcm(pcm: array.array, pre_ms: float = 10.0, post_ms: float = 35.0, keep_tail: bool = False) -> array.array:
    n = len(pcm)
    if n < 120:
        return pcm
    s = next((i for i, v in enumerate(pcm) if abs(v) > 95), 0)
    thresh_end = 55 if keep_tail else 85
    e = next((i for i in range(n - 1, s, -1) if abs(pcm[i]) > thresh_end), n - 1)
    lo = max(0, s - int(RATE * pre_ms / 1000.0))
    hi = min(n, e + int(RATE * post_ms / 1000.0))
    if hi - lo < int(RATE * 0.08):
        return pcm
    return pcm[lo:hi]


def biquad(samples: list[float], b0: float, b1: float, b2: float, a1: float, a2: float) -> list[float]:
    out = [0.0] * len(samples)
    x1 = x2 = y1 = y2 = 0.0
    for i, x in enumerate(samples):
        y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1 = x1, x
        y2, y1 = y1, y
        out[i] = y
    return out


def peaking_eq(samples: list[float], freq: float, q: float, gain_db: float) -> list[float]:
    A = 10.0 ** (gain_db / 40.0)
    w0 = 2.0 * math.pi * freq / RATE
    alpha = math.sin(w0) / (2.0 * q)
    cosw = math.cos(w0)
    b0, b1, b2 = 1.0 + alpha * A, -2.0 * cosw, 1.0 - alpha * A
    a0, a1, a2 = 1.0 + alpha / A, -2.0 * cosw, 1.0 - alpha / A
    return biquad(samples, b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0)


def highpass_eq(samples: list[float], freq: float, q: float = 0.707) -> list[float]:
    w0 = 2.0 * math.pi * freq / RATE
    alpha = math.sin(w0) / (2.0 * q)
    cosw = math.cos(w0)
    b0, b1, b2 = (1.0 + cosw) / 2.0, -(1.0 + cosw), (1.0 + cosw) / 2.0
    a0, a1, a2 = 1.0 + alpha, -2.0 * cosw, 1.0 - alpha
    return biquad(samples, b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0)


def estimate_f0(pcm: array.array, register: str) -> float:
    x = [v / 32768.0 for v in pcm]
    n = len(x)
    s0 = min(n - 1, n // 6)
    s1 = min(n, max(s0 + 1, n * 4 // 6))
    seg = x[s0:s1]
    if len(seg) < 420:
        return 215.0 if register == "female" else 135.0
    lo_hz = 62 if register in ("titan", "boss", "monster") else (90 if register == "male" else 135)
    hi_hz = 190 if register in ("titan", "boss", "monster") else (280 if register == "male" else 390)
    lmin = max(30, RATE // hi_hz)
    lmax = min(len(seg) // 2, RATE // lo_hz)
    if lmax <= lmin + 2:
        return 190.0
    best_lag, best_r = (lmin + lmax) // 2, -1e12
    win = min(len(seg) - lmax, 420)
    for lag in range(lmin, lmax):
        r = sum(seg[i] * seg[i + lag] for i in range(0, win, 2))
        if r > best_r:
            best_r, best_lag = r, lag
    return RATE / best_lag


def ncc_psola(pcm: array.array, f0_hz: float, semi_fn, amp_fn) -> array.array:
    """Formant-preserving, duration-preserving TD-PSOLA for dramatic pitch contours."""
    n = len(pcm)
    if n < 380 or f0_hz <= 0:
        return pcm
    x = [v / 32768.0 for v in pcm]
    peak = max(map(abs, x), default=1e-6)
    s0 = next((i for i, v in enumerate(x) if abs(v) > peak * 0.12), 0)
    s1 = next((i for i in range(n - 1, -1, -1) if abs(x[i]) > peak * 0.09), n - 1)
    p_nom = max(55, min(390, round(RATE / max(58.0, min(420.0, f0_hz)))))
    if s1 - s0 < p_nom * 4:
        return pcm
    mid_a = s0 + (s1 - s0) // 5
    mid_b = min(n - 1, max(mid_a + 1, s0 + (s1 - s0) * 3 // 5))
    anchor = max(range(mid_a, mid_b), key=lambda i: x[i])
    marks = [anchor]
    for step in (-1, 1):
        cur = anchor
        while True:
            est = cur + step * p_nom
            if est < s0 or est > s1:
                break
            lo = max(1, est - int(0.26 * p_nom))
            hi = min(n - 2, est + int(0.26 * p_nom))
            best, best_v = est, -1e12
            for k in range(lo, hi + 1):
                if x[k] >= x[k - 1] and x[k] >= x[k + 1] and x[k] > best_v:
                    best_v, best = x[k], k
            marks.append(best)
            cur = best
    marks = sorted(set(marks))
    if len(marks) < 4:
        return pcm

    out = [0.0] * n
    wsum = [0.0] * n
    pos = float(marks[0])
    ptr = 0
    while pos <= marks[-1]:
        while ptr + 1 < len(marks) and abs(marks[ptr + 1] - pos) < abs(marks[ptr] - pos):
            ptr += 1
        am = marks[ptr]
        if 0 < ptr < len(marks) - 1:
            p_loc = 0.5 * (marks[ptr + 1] - marks[ptr - 1])
        elif ptr == 0:
            p_loc = float(marks[1] - marks[0])
        else:
            p_loc = float(marks[ptr] - marks[ptr - 1])
        p_loc = max(50.0, min(410.0, p_loc))

        u = max(0.0, min(1.0, (pos - s0) / max(1, s1 - s0)))
        semi = semi_fn(u, pos / RATE)
        amp = amp_fn(u, pos / RATE)
        p_syn = max(45.0, min(450.0, p_loc / (2.0 ** (semi / 12.0))))
        hw = int(round(p_loc))
        ip = int(round(pos))
        for d in range(-hw, hw + 1):
            src, dst = am + d, ip + d
            if 0 <= src < n and 0 <= dst < n:
                w = 0.5 * (1.0 + math.cos(math.pi * d / max(1, hw)))
                out[dst] += x[src] * w * amp
                wsum[dst] += w
        pos += p_syn

    res = array.array("h")
    for i in range(n):
        if wsum[i] > 0.05:
            b = min(1.0, (wsum[i] - 0.05) / 0.30)
            v = (out[i] / wsum[i]) * b + x[i] * (1.0 - b)
        else:
            v = x[i]
        res.append(max(-32760, min(32760, round(v * 32767.0))))
    return res


def add_stage_hall(x: list[float], mix: float = 0.22, tail_sec: float = 0.35) -> list[float]:
    """Compact tapped hall ambience for heroic super/boss defeat tails."""
    pad = int(RATE * tail_sec)
    buf = x + [0.0] * pad
    out = list(buf)
    taps = [(int(0.029 * RATE), 0.44), (int(0.053 * RATE), 0.32), (int(0.089 * RATE), 0.22), (int(0.141 * RATE), 0.14)]
    for d, g in taps:
        lp = 0.0
        for i in range(d, len(out)):
            lp = 0.72 * lp + 0.28 * buf[i - d]
            out[i] += lp * mix * g
    return out


def apply_theatrical_acting(pcm: array.array, event: str, register: str) -> array.array:
    """Apply expressive micro-F0 theatre, sub-octave chest grit, and dramatic ambience."""
    f0 = estimate_f0(pcm, register)
    dur = len(pcm) / RATE

    # 1. Dramatic F0 contour on compact shouts, hits & defeat screams
    if event in ("ko", "defeat"):
        pcm = ncc_psola(
            pcm,
            f0,
            lambda u, t: 0.8 * (1.0 - min(1.0, u * 3.0)) - 2.6 * (u ** 1.35) + 0.35 * math.sin(2.0 * math.pi * 15.0 * t) * u,
            lambda u, t: 1.0 - 0.26 * (u ** 1.5),
        )
    elif event in ("hurt0", "hurt1", "grabbed", "thrown", "throw_impact"):
        pcm = ncc_psola(
            pcm,
            f0,
            lambda u, t: 2.0 * (1.0 - u) - 3.4 * (u ** 1.2) + 0.42 * math.sin(2.0 * math.pi * 17.5 * t),
            lambda u, t: 1.06 - 0.16 * u,
        )
    elif dur < 0.95 and event in ("light0", "light1", "jump", "throw", "burst", "throw_release", "heavy0", "heavy1"):
        pcm = ncc_psola(
            pcm,
            f0,
            lambda u, t: 1.8 * math.sin(math.pi * min(1.0, u / 0.55)) - 2.4 * max(0.0, (u - 0.45) / 0.55) ** 1.3,
            lambda u, t: 1.08 - 0.12 * max(0.0, u - 0.55),
        )

    # 2. Sub-harmonic heavy chest / demonic furnace layer
    if register == "monster":
        sub_a = ncc_psola(pcm, f0, lambda u, t: -7.2 - 1.2 * u + 0.55 * math.sin(2.0 * math.pi * 21.0 * t), lambda u, t: 0.78)
        sub_b = ncc_psola(pcm, f0, lambda u, t: -12.0, lambda u, t: 0.50)
        n = min(len(pcm), len(sub_a), len(sub_b))
        pcm = array.array("h", [max(-32760, min(32760, round(pcm[i] * 0.74 + sub_a[i] * 0.50 + sub_b[i] * 0.36))) for i in range(n)])
    elif register in ("titan", "boss"):
        sub = ncc_psola(pcm, f0, lambda u, t: -11.5, lambda u, t: 0.26 if register == "boss" else 0.20)
        n = min(len(pcm), len(sub))
        pcm = array.array("h", [max(-32760, min(32760, round(pcm[i] * 0.90 + sub[i] * 0.28))) for i in range(n)])

    return pcm


def master_voice(pcm: array.array, event: str, register: str) -> array.array:
    is_shout = event not in ("select", "win", "ko")
    x = [v / 32768.0 for v in pcm]
    x = highpass_eq(x, 78.0, 0.707)
    body_f = 122.0 if register in ("titan", "boss", "monster") else (175.0 if register == "male" else 235.0)
    body_db = 4.2 if register in ("titan", "boss", "monster") else (2.5 if is_shout else 1.8)
    x = peaking_eq(x, body_f, 0.85, body_db)
    x = peaking_eq(x, 3200.0, 0.90, 3.4 if is_shout else 2.2)
    x = peaking_eq(x, 7400.0, 0.80, 2.0)

    if event in ("defeat", "super", "finish") or register in ("boss", "monster"):
        x = add_stage_hall(x, mix=0.34 if event == "defeat" or register == "monster" else 0.16, tail_sec=0.30 if event == "defeat" else 0.12)

    env = 0.0
    att = math.exp(-1.0 / (RATE * 0.0025))
    rel = math.exp(-1.0 / (RATE * 0.060))
    thresh = 0.23
    drive = 1.65 if register == "monster" else (1.42 if is_shout else 1.18)
    out = [0.0] * len(x)
    for i, s in enumerate(x):
        a = abs(s)
        env = att * env + (1.0 - att) * a if a > env else rel * env + (1.0 - rel) * a
        g = (thresh + (env - thresh) * 0.45) / env if env > thresh else 1.0
        out[i] = math.tanh(s * g * drive)

    peak = max((abs(v) for v in out), default=1e-6)
    rms = math.sqrt(sum(v * v for v in out) / max(1, len(out)))
    target_rms = 0.245 if is_shout else (0.185 if event == "ko" else 0.215)
    max_peak = 0.89 if is_shout else (0.78 if event == "ko" else 0.85)
    scale = min(max_peak / peak, target_rms / max(rms, 1e-4))

    fade_in = min(round(RATE * 0.003), len(out) // 4)
    fade_out = min(round(RATE * (0.045 if event in ("ko", "defeat", "win") else 0.022)), len(out) // 3)
    res = array.array("h")
    for i, v in enumerate(out):
        w = 1.0
        if i < fade_in and fade_in > 0:
            w = 0.5 * (1.0 - math.cos(math.pi * i / fade_in))
        elif i >= len(out) - fade_out and fade_out > 0:
            rem = len(out) - 1 - i
            w = 0.5 * (1.0 - math.cos(math.pi * rem / fade_out))
        res.append(max(-29200, min(29200, round(v * scale * w * 32767.0))))
    return res


async def build_all(install: bool) -> None:
    cfg = json.loads(CFG_PATH.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore({"edge": 6, "azure": 2}.get(ENGINE, 1))  # the free Azure tier allows few requests; Kokoro is one local model
    def brand(t):
        if ENGINE == "azure":
            return (t.replace("Microsoft Edge Neural Voices", "Microsoft Azure AI Speech neural voices")
                     .replace("Microsoft Edge Neural", "Microsoft Azure AI Speech").replace("EdgeNeural:", "AzureNeural:"))
        if ENGINE == "kokoro":
            return t.replace("Microsoft Edge Neural Voices", "Kokoro-82M (Apache-2.0, local synthesis)")
        return t

    tasks = []
    meta = []
    for char_id, profile in cfg["profiles"].items():
        nvoice = profile["neuralVoice"]
        if ENGINE == "kokoro":
            nvoice = profile["kokoroVoice"] + "|" + profile["register"]
            profile = dict(profile, neuralVoice=profile["kokoroVoice"], voice="Kokoro:" + profile["kokoroVoice"],
                           credit="Kokoro-82M (" + profile["kokoroVoice"] + ")")
        pbase = int(profile["pitchBase"])
        sbase = int(profile["speedBase"])
        segs_map = profile.get("segments", {})
        for event, line_text in profile["lines"].items():
            if event in segs_map:
                segs = segs_map[event]
            else:
                rd, pd = event_deltas(event)
                segs = [{"text": line_text, "rate": fmt_delta(sbase + rd, "%"), "pitch": fmt_delta(pbase + pd, "Hz")}]
            coros = [fetch_tts_segment(sem, s["text"], nvoice, s["rate"], s["pitch"]) for s in segs]
            tasks.append(asyncio.gather(*coros))
            meta.append((char_id, profile, event, line_text, segs))

    results = await asyncio.gather(*tasks)

    manifest = {
        "version": cfg["version"],
        "engine": brand(cfg["engine"]),
        "language": cfg["language"],
        "profiles": {},
    }
    report = {"version": cfg["version"], "engine": brand(cfg["engine"]), "sampleRate": RATE, "clips": []}
    preview = array.array("h")
    preview_events = ("sp2", "super", "select", "win", "ko", "finish", "intro", "combo", "defeat")

    for (char_id, profile, event, line_text, segs), seg_pcms in zip(meta, results):
        if char_id not in manifest["profiles"]:
            manifest["profiles"][char_id] = {
                "voice": brand(profile["voice"]),
                "neuralVoice": profile["neuralVoice"],
                "credit": brand(profile["credit"]),
                "lines": {},
            }
        manifest["profiles"][char_id]["lines"][event] = line_text

        combined = array.array("h")
        for idx, spcm in enumerate(seg_pcms):
            tpcm = trim_pcm(spcm, pre_ms=12.0 if idx == 0 else 8.0, post_ms=42.0 if idx == len(seg_pcms) - 1 else 20.0)
            combined.extend(tpcm)
            if idx < len(seg_pcms) - 1:
                combined.extend([0] * int(RATE * 0.065))

        acted = apply_theatrical_acting(combined, event, profile["register"])
        mastered = master_voice(acted, event, profile["register"])
        clip_id = f"{char_id}-{event}"
        wav_path = OUT_DIR / f"{clip_id}.wav"
        save_pcm(wav_path, mastered)

        peak = max(map(abs, mastered))
        rms = math.sqrt(sum(v * v for v in mastered) / len(mastered))
        assert peak > 1200 and rms > 220, f"Low signal on {clip_id}: peak={peak}, rms={rms}"
        report["clips"].append({
            "id": clip_id,
            "voice": profile["neuralVoice"],
            "text": line_text,
            "seconds": round(len(mastered) / RATE, 3),
            "peak": peak,
            "rms": round(rms, 2),
            "sha256": hashlib.sha256(wav_path.read_bytes()).hexdigest(),
        })
        if event in preview_events:
            preview.extend(mastered)
            preview.extend([0] * (RATE // 5))
        if install:
            (VOICES / f"{clip_id}.wav").write_bytes(wav_path.read_bytes())

    save_pcm(OUT_DIR / "preview.wav", preview)
    (OUT_DIR / "manifest.json").write_bytes((json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
    (OUT_DIR / "audio-report.json").write_bytes((json.dumps(report, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))

    if install:
        # Keep casts that are not generated here (VESPER's creature sounds come from tools/render-vesper-voices.mjs)
        # and keep the existing order: the build embeds manifest.json as it is.
        current = json.loads((VOICES / "manifest.json").read_text(encoding="utf-8"))
        merged = {}
        for char_id, old in current.get("profiles", {}).items():
            merged[char_id] = manifest["profiles"].get(char_id, old)
        for char_id, new in manifest["profiles"].items():
            merged.setdefault(char_id, new)
        manifest["profiles"] = merged
        report_path = VOICES / "audio-report.json"
        old_report = json.loads(report_path.read_text(encoding="utf-8")) if report_path.is_file() else {"clips": []}
        made = {clip["id"] for clip in report["clips"]}
        report["clips"] += [clip for clip in old_report.get("clips", []) if clip["id"] not in made and clip["id"].split("-")[0] in merged]
        (VOICES / "manifest.json").write_bytes((json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
        report_path.write_bytes((json.dumps(report, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))

    print(f"Generated {len(report['clips'])} clips in {OUT_DIR} (installed={install}).")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--install", action="store_true", help="Copy validated WAVs & manifest into assets/voices/")
    parser.add_argument("--engine", choices=("kokoro", "azure", "edge"), default="kokoro",
                        help="kokoro: local Kokoro-82M (default). azure: Azure AI Speech. edge: edge-tts, local audition only.")
    args = parser.parse_args()
    global ENGINE
    ENGINE = args.engine
    if ENGINE == "azure" and not (os.environ.get("AZURE_SPEECH_KEY") and os.environ.get("AZURE_SPEECH_REGION")):
        sys.exit("Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION first (Azure portal > Speech resource > Keys and Endpoint).")
    if ENGINE == "kokoro" and not (KOKORO_DIR / "kokoro-v1.0.onnx").is_file():
        sys.exit("Kokoro model files are missing in " + str(KOKORO_DIR) + " (see the header of this script).")
    if ENGINE == "edge" and args.install:
        sys.exit("--engine edge is for local auditions only; its clips are not installed. Use the Azure engine to install.")
    asyncio.run(build_all(args.install))


if __name__ == "__main__":
    main()
