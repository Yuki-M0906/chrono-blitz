"""Generate 126 studio-mastered offline fighter performances into a staging directory.

Uses only previously downloaded, consented VOICEVOX models; no network calls.
v3.2 pipeline: AquesTalk kana phrase control, plateau-breaking theatrical F0
contour sculpting at intonation_scale=1.0, NCC-locked TD-PSOLA for short kinetic
kiais & defeat tails, and 4-band studio mastering.
Run with tools/voicevox-runtime/venv/Scripts/python.exe.
"""
from pathlib import Path
import argparse
import array
import hashlib
import io
import json
import math
import re
import sys
import wave
from dataclasses import asdict

ROOT = Path(__file__).resolve().parent.parent
CORE = ROOT / 'tools/voicevox-runtime/core'
VOICES = ROOT / 'assets/voices'
RATE = 24000


def read_pcm(data):
    with wave.open(io.BytesIO(data), 'rb') as f:
        assert (f.getnchannels(), f.getsampwidth(), f.getframerate()) == (1, 2, RATE)
        samples = array.array('h', f.readframes(f.getnframes()))
    if sys.byteorder != 'little':
        samples.byteswap()
    return samples


def save_pcm(path, samples):
    encoded = array.array('h', samples)
    if sys.byteorder != 'little':
        encoded.byteswap()
    with wave.open(str(path), 'wb') as f:
        f.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        f.writeframes(encoded.tobytes())


def biquad(samples, b0, b1, b2, a1, a2):
    out = [0.0] * len(samples)
    x1 = x2 = y1 = y2 = 0.0
    for i, x in enumerate(samples):
        y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1 = x1, x
        y2, y1 = y1, y
        out[i] = y
    return out


def peaking_eq(samples, freq, q, gain_db):
    A = 10.0 ** (gain_db / 40.0)
    w0 = 2.0 * math.pi * freq / RATE
    alpha = math.sin(w0) / (2.0 * q)
    cosw = math.cos(w0)
    b0 = 1.0 + alpha * A
    b1 = -2.0 * cosw
    b2 = 1.0 - alpha * A
    a0 = 1.0 + alpha / A
    a1 = -2.0 * cosw
    a2 = 1.0 - alpha / A
    return biquad(samples, b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0)


def highpass_eq(samples, freq, q=0.707):
    w0 = 2.0 * math.pi * freq / RATE
    alpha = math.sin(w0) / (2.0 * q)
    cosw = math.cos(w0)
    b0 = (1.0 + cosw) / 2.0
    b1 = -(1.0 + cosw)
    b2 = (1.0 + cosw) / 2.0
    a0 = 1.0 + alpha
    a1 = -2.0 * cosw
    a2 = 1.0 - alpha
    return biquad(samples, b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0)


def ncc_psola(pcm, f0_hz, semi_fn, amp_fn):
    """Formant-preserving, duration-preserving Cross-Correlation TD-PSOLA for short cries & defeat tails."""
    n = len(pcm)
    if n < 320 or f0_hz <= 0:
        return pcm
    x = [v / 32768.0 for v in pcm]
    peak = max(map(abs, x), default=1e-6)
    thresh = peak * 0.14
    s0 = next((i for i, v in enumerate(x) if abs(v) > thresh), 0)
    s1 = next((i for i in range(n - 1, -1, -1) if abs(x[i]) > thresh * 0.6), n - 1)
    p_nom = max(55, min(360, round(RATE / max(65.0, min(460.0, f0_hz)))))
    if s1 - s0 < p_nom * 4:
        return pcm

    mid_a = s0 + (s1 - s0) // 5
    mid_b = min(n - 1, s0 + max(mid_a + 1, (s1 - s0) * 3 // 5))
    anchor = max(range(mid_a, mid_b), key=lambda i: x[i])

    def find_next_mark(cur, direction):
        half_t = max(20, p_nom // 2)
        lo_p = max(45, int(p_nom * 0.72))
        hi_p = min(400, int(p_nom * 1.32))
        ref_a = max(0, cur - half_t)
        ref_b = min(n, cur + half_t + 1)
        best_pos = cur + direction * p_nom
        best_corr = -1e18
        for p in range(lo_p, hi_p + 1):
            cand = cur + direction * p
            if cand - half_t < 0 or cand + half_t >= n:
                continue
            dot = 0.0
            norm = 0.0
            for d in range(ref_a - cur, ref_b - cur):
                vx = x[cur + d]
                vy = x[cand + d]
                dot += vx * vy
                norm += vy * vy
            score = dot / (math.sqrt(norm) + 1e-9)
            if score > best_corr:
                best_corr = score
                best_pos = cand
        return best_pos

    fwd = [anchor]
    cur = anchor
    while cur + p_nom < min(n - 20, s1 + p_nom):
        nxt = find_next_mark(cur, 1)
        if nxt <= cur + 35:
            break
        fwd.append(nxt)
        cur = nxt

    bwd = []
    cur = anchor
    while cur - p_nom > max(20, s0 - p_nom):
        prv = find_next_mark(cur, -1)
        if prv >= cur - 35:
            break
        bwd.append(prv)
        cur = prv

    marks = list(reversed(bwd)) + fwd
    if len(marks) < 4:
        return pcm

    out = [0.0] * n
    wsum = [0.0] * n
    pos = float(marks[0])
    end_m = float(marks[-1])
    ptr = 0
    while pos <= end_m:
        while ptr + 1 < len(marks) and abs(marks[ptr + 1] - pos) < abs(marks[ptr] - pos):
            ptr += 1
        am = marks[ptr]
        if 0 < ptr < len(marks) - 1:
            p_loc = 0.5 * (marks[ptr + 1] - marks[ptr - 1])
        elif ptr + 1 < len(marks):
            p_loc = float(marks[ptr + 1] - marks[ptr])
        else:
            p_loc = float(marks[ptr] - marks[ptr - 1])
        p_loc = max(50.0, min(380.0, p_loc))

        u = max(0.0, min(1.0, (pos - s0) / max(1, s1 - s0)))
        semi = semi_fn(u, pos / RATE)
        amp = amp_fn(u, pos / RATE)
        ratio = 2.0 ** (semi / 12.0)
        p_syn = max(45.0, min(420.0, p_loc / ratio))

        half_w = int(round(p_loc))
        ip = int(round(pos))
        for d in range(-half_w, half_w + 1):
            src = am + d
            dst = ip + d
            if 0 <= src < n and 0 <= dst < n:
                hw = 0.5 * (1.0 + math.cos(math.pi * d / max(1, half_w)))
                out[dst] += x[src] * hw * amp
                wsum[dst] += hw
        pos += p_syn

    res = array.array('h')
    for i in range(n):
        if wsum[i] > 0.05:
            ps = out[i] / wsum[i]
            b = min(1.0, (wsum[i] - 0.05) / 0.30)
            val = ps * b + x[i] * (1.0 - b)
        else:
            val = x[i]
        res.append(max(-32760, min(32760, round(val * 32767.0))))
    return res


def apply_short_kiai_psola(pcm, f0_hz, event, mora_count):
    """Apply expressive micro-F0 contour via NCC-PSOLA only on short cries & KO tails."""
    if event == 'ko':
        return ncc_psola(
            pcm,
            f0_hz,
            lambda u, t: -0.3 - 2.3 * (u ** 1.1) + 0.28 * math.sin(2.0 * math.pi * 12.0 * t) * (1.0 - 0.5 * u),
            lambda u, t: 1.0 - 0.38 * (u ** 1.35)
        )
    if mora_count > 3:
        return pcm
    if event in ('hurt0', 'throw_impact', 'grabbed'):
        return ncc_psola(
            pcm,
            f0_hz,
            lambda u, t: 1.9 - 4.4 * (u ** 1.12) + 0.32 * math.sin(2.0 * math.pi * 18.5 * t),
            lambda u, t: 1.05 - 0.14 * u
        )
    if event in ('hurt1', 'thrown'):
        return ncc_psola(
            pcm,
            f0_hz,
            lambda u, t: 1.4 - 4.2 * (u ** 1.18) + 0.44 * math.sin(2.0 * math.pi * 17.5 * t),
            lambda u, t: 1.05 - 0.20 * u
        )
    if event.startswith('light') or event == 'jump':
        if event == 'light1':
            # Distinct secondary light-attack upward flick + crisp cut
            return ncc_psola(
                pcm,
                f0_hz,
                lambda u, t: 0.4 + 1.6 * math.sin(math.pi * min(1.0, u / 0.5)) - 3.6 * max(0.0, (u - 0.35) / 0.65) ** 1.3,
                lambda u, t: 1.06 - 0.14 * max(0.0, u - 0.5)
            )
        return ncc_psola(
            pcm,
            f0_hz,
            lambda u, t: 1.4 - 4.0 * (u ** 1.25),
            lambda u, t: 1.06 - 0.15 * max(0.0, u - 0.5)
        )
    if event in ('heavy0', 'heavy1', 'throw', 'throw_release', 'burst', 'dash'):
        return ncc_psola(
            pcm,
            f0_hz,
            lambda u, t: 1.7 * math.sin(min(1.0, u / 0.35) * math.pi * 0.5) - 3.8 * max(0.0, (u - 0.45) / 0.55) ** 1.4,
            lambda u, t: 1.06 - 0.14 * max(0.0, u - 0.55)
        )
    return pcm


def master_voice(raw_pcm, character, event):
    is_male = character in ('kagura', 'volt', 'titan')
    is_titan = character == 'titan'
    is_shout = event not in ('select', 'win', 'ko')

    n = len(raw_pcm)
    start = 0
    while start < n and abs(raw_pcm[start]) <= 12:
        start += 1
    end = n - 1
    while end > start and abs(raw_pcm[end]) <= 12:
        end -= 1
    pre = round(RATE * 0.010)
    post = round(RATE * (0.018 if is_shout and not event.startswith('sp') and event != 'super' else (0.042 if is_shout else 0.068)))
    start = max(0, start - pre)
    end = min(n, end + post)
    x = [v / 32768.0 for v in raw_pcm[start:end]]
    if len(x) < round(RATE * 0.08):
        x = [v / 32768.0 for v in raw_pcm]

    # 1. Clean high-pass at 80Hz to remove sub-rumble and DC
    x = highpass_eq(x, 80.0, 0.707)
    # 2. Chest/body warmth tailored to voice register
    body_freq = 142.0 if is_titan else (190.0 if is_male else 242.0)
    body_gain = 3.6 if is_titan else (2.4 if is_shout else 1.8)
    x = peaking_eq(x, body_freq, 0.85, body_gain)
    # 3. Presence articulation peak (3.1kHz) so combat dialogue cuts through BGM & SE
    x = peaking_eq(x, 3100.0, 0.92, 3.0 if is_shout else 2.0)
    # 4. Crisp air polish (7.2kHz)
    x = peaking_eq(x, 7200.0, 0.80, 1.8)

    # 5. Fast transparent vocal compressor + warm soft saturation
    env = 0.0
    att = math.exp(-1.0 / (RATE * 0.003))
    rel = math.exp(-1.0 / (RATE * 0.065))
    thresh = 0.24
    drive = 1.40 if is_shout else 1.18
    out = [0.0] * len(x)
    for i, s in enumerate(x):
        a = abs(s)
        env = att * env + (1.0 - att) * a if a > env else rel * env + (1.0 - rel) * a
        g = 1.0
        if env > thresh:
            g = (thresh + (env - thresh) * 0.48) / env
        out[i] = math.tanh(s * g * drive)

    peak = max((abs(v) for v in out), default=1e-6)
    rms = math.sqrt(sum(v * v for v in out) / len(out))
    target_rms = 0.235 if is_shout else (0.175 if event == 'ko' else 0.205)
    max_peak = 0.88 if is_shout else (0.76 if event == 'ko' else 0.84)
    scale = min(max_peak / peak, target_rms / max(rms, 1e-4))

    fade_in = min(round(RATE * 0.0025), len(out) // 4)
    fade_out = min(round(RATE * (0.035 if event in ('ko', 'win') else 0.018)), len(out) // 3)
    res = array.array('h')
    for i, v in enumerate(out):
        w = 1.0
        if i < fade_in and fade_in > 0:
            w = 0.5 * (1.0 - math.cos(math.pi * i / fade_in))
        elif i >= len(out) - fade_out and fade_out > 0:
            rem = len(out) - 1 - i
            w = 0.5 * (1.0 - math.cos(math.pi * rem / fade_out))
        res.append(max(-28800, min(28800, round(v * scale * w * 32767.0))))
    return res


def delivery(event):
    if event.startswith('light') or event in ('jump', 'hurt0', 'throw_impact'):
        return 'force', 1.16, 0.48
    if event.startswith('heavy') or event in ('throw_release', 'burst', 'dash'):
        return 'force', 1.08, 1.35
    if event.startswith('hurt') or event in ('grabbed', 'thrown'):
        return 'hurt', 1.10, 0.85
    if event.startswith('sp'):
        return 'force', 1.05, 1.85
    return {
        'jump': ('force', 1.18, 0.45),
        'dash': ('force', 1.10, 0.95),
        'throw': ('force', 1.08, 1.15),
        'burst': ('force', 1.08, 1.35),
        'grabbed': ('hurt', 1.14, 0.65),
        'throw_release': ('force', 1.10, 0.75),
        'thrown': ('hurt', 1.06, 0.85),
        'throw_impact': ('hurt', 1.14, 0.55),
        'super': ('force', 1.03, 2.80),
        'select': ('normal', 1.01, 2.60),
        'win': ('win', 0.99, 2.30),
        'ko': ('ko', 0.90, 1.80)
    }[event]


def sculpt_query(query, character, event, cue_id='', segment_index=0, total_segments=1):
    """Sculpt expressive natural prosody directly at intonation_scale=1.0 (zero double distortion)."""
    is_male = character in ('kagura', 'volt', 'titan')
    query.intonation_scale = 1.0

    all_moras = [m for ap in query.accent_phrases for m in ap.moras]
    voiced = [m for m in all_moras if m.vowel != 'cl']
    if not voiced:
        return 200.0, 0
    valid_p = [m.pitch for m in voiced if m.pitch > 0]
    base_p = sum(valid_p) / len(valid_p) if valid_p else (5.05 if is_male else 5.82)

    # Restore devoiced vowels only on short/force/hurt/ko cries so neural decoder holds full glottal tone
    for i, m in enumerate(voiced):
        was_dev = m.vowel in ('A', 'I', 'U', 'E', 'O') or m.pitch == 0.0
        if m.vowel in ('A', 'I', 'U', 'E', 'O'):
            if len(voiced) <= 4 or event.startswith('hurt') or event == 'ko' or event.startswith('heavy'):
                m.vowel = m.vowel.lower()
        if m.vowel in ('a', 'i', 'u', 'e', 'o') and (was_dev or m.pitch == 0.0):
            prv = next((voiced[j].pitch for j in range(i - 1, -1, -1) if voiced[j].pitch > 0), base_p)
            nxt = next((voiced[j].pitch for j in range(i + 1, len(voiced)) if voiced[j].pitch > 0), prv - 0.04)
            m.pitch = 0.5 * (prv + nxt)

    # Trim oversized glottal stops (`ッ` cl) & guarantee crisp initial breath/plosive bursts
    for m in all_moras:
        if m.vowel == 'cl':
            m.vowel_length = max(0.055, min(0.095, m.vowel_length))

    if len(voiced) <= 3 and voiced[0].consonant:
        min_c = 0.085 if voiced[0].consonant in ('h', 'f') else 0.068
        voiced[0].consonant_length = max(voiced[0].consonant_length or 0.0, min_c)

    if cue_id == 'ayame-sp2' and len(query.accent_phrases[0].moras) >= 2:
        # Ensure 'エ' in ヒエンノマイ is clearly articulated rather than swallowed into ヒ
        query.accent_phrases[0].moras[1].vowel_length = max(query.accent_phrases[0].moras[1].vowel_length, 0.120)

    n_ap = len(query.accent_phrases)
    for ap_i, ap in enumerate(query.accent_phrases):
        ap_v = [m for m in ap.moras if m.vowel != 'cl' and m.pitch > 0]
        if not ap_v:
            continue
        ap_mean = sum(m.pitch for m in ap_v) / len(ap_v)
        n_v = len(ap_v)
        acc_idx = max(0, min(n_v - 1, (ap.accent - 1) if ap.accent > 0 else 0))

        # Break flat multi-mora H or L plateaus organically inside the phrase
        if event in ('select', 'win'):
            decl = 0.05 - 0.13 * (ap_i / max(1, n_ap)) if n_ap > 1 else 0.0
            for mi, m in enumerate(ap_v):
                rel = m.pitch - ap_mean
                # Add organic climbing curve before accent & smooth declination after accent
                if mi < acc_idx and acc_idx >= 2:
                    arch = 0.05 * (mi / max(1, acc_idx))
                elif mi > acc_idx and (n_v - 1 - acc_idx) >= 2:
                    t_tail = (mi - acc_idx) / max(1, n_v - 1 - acc_idx)
                    # Add gentle subtle human cadence lift near mid-tail before final resolution drop
                    arch = -0.07 * t_tail + 0.03 * math.sin(math.pi * t_tail)
                else:
                    arch = 0.0
                m.pitch = ap_mean + decl + rel * 1.36 + arch
                if mi == acc_idx:
                    m.pitch += 0.075
                    m.vowel_length = max(m.vowel_length, m.vowel_length * 1.14)
                if mi == n_v - 1 and m.text in ('ハ', 'ヲ', 'ガ', 'ニ', 'デ', 'ノ') and n_v > 2:
                    m.vowel_length *= 0.78
            if ap.pause_mora:
                if isinstance(ap.pause_mora, dict):
                    ap.pause_mora['vowel_length'] = 0.095
                else:
                    ap.pause_mora.vowel_length = 0.095

        elif event == 'ko':
            shift = -0.09 if character == 'titan' else -0.05
            for mi, m in enumerate(ap_v):
                u = mi / max(1, n_v - 1)
                m.pitch = (ap_mean + shift) + (m.pitch - ap_mean) * 1.08 - 0.21 * u
            ap_v[-1].vowel_length = max(ap_v[-1].vowel_length, 0.175)

        elif event.startswith('sp') or event == 'super':
            is_intro = (event == 'super' or cue_id == 'titan-sp1') and total_segments > 1 and segment_index == 0
            if is_intro:
                for mi, m in enumerate(ap_v):
                    rel = m.pitch - ap_mean
                    u = mi / max(1, n_v - 1)
                    if event == 'super' and character != 'volt':
                        m.pitch = (ap_mean - 0.07) + rel * 1.25 - 0.05 * u
                    else:
                        m.pitch = (ap_mean + 0.04) + rel * 1.30
                ap_v[-1].vowel_length = max(ap_v[-1].vowel_length, 0.13)
            else:
                is_final_ap = (ap_i == n_ap - 1)
                boost = (-0.04 if (n_ap > 1 and ap_i == 0) else 0.13 + 0.08 * (ap_i / max(1, n_ap - 1)))
                for mi, m in enumerate(ap_v):
                    rel = m.pitch - ap_mean
                    arch = -0.05 * ((mi - acc_idx) / max(1, n_v - 1 - acc_idx)) if (mi > acc_idx and n_v - acc_idx >= 3) else 0.0
                    m.pitch = base_p + boost + rel * 1.32 + arch
                    if mi == acc_idx:
                        m.pitch += 0.105 if is_final_ap else 0.06
                        m.vowel_length = max(m.vowel_length, 0.115 if is_final_ap else 0.092)
                    else:
                        # Keep minimum vowel length >= 0.062s so diphthongs like ヒ・エ in ヒエンノマイ never slur away
                        m.vowel_length = max(0.062, m.vowel_length)
                if is_final_ap and n_v >= 2 and ap_v[-1].text in ('ー', 'ン', 'ウ', 'イ', 'ア'):
                    ap_v[-1].vowel_length = max(ap_v[-1].vowel_length, 0.155)
        else:
            # Combat shouts (heavy, burst, dash, throw, light, hurt)
            boost = 0.09 if event.startswith('heavy') or event in ('burst', 'throw_release') else 0.03
            for mi, m in enumerate(ap_v):
                rel = m.pitch - ap_mean
                arch = 0.0
                if mi > acc_idx and (n_v - 1 - acc_idx) >= 2:
                    t_tail = (mi - acc_idx) / max(1, n_v - 1 - acc_idx)
                    arch = -0.08 * t_tail
                m.pitch = base_p + boost + rel * 1.34 + arch
                if mi == acc_idx:
                    m.pitch += 0.09
            # Sharp terminal drop right into glottal stop `ッ`
            if ap.moras[-1].vowel == 'cl' and n_v >= 2:
                ap_v[-1].pitch -= 0.08

    voiced_after = [m for m in all_moras if m.vowel != 'cl' and m.pitch > 0]
    mean_f0 = math.exp(sum(m.pitch for m in voiced_after) / len(voiced_after)) if voiced_after else 200.0
    return mean_f0, len(voiced_after)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--character', choices=['kagura', 'volt', 'freya', 'titan', 'ayame', 'celine'])
    args = parser.parse_args()
    config = json.loads((VOICES / 'voicevox-config.json').read_text(encoding='utf-8'))
    plan = json.loads((VOICES / 'performance-plan.json').read_text(encoding='utf-8'))
    kana_map = config.get('kana', {})
    profiles = {k: v for k, v in config['profiles'].items() if not args.character or k == args.character}
    models = sorted({m for profile in profiles.values() for m in profile['models']})
    for model in models:
        if not (CORE / f'models/vvms/{model}.vvm').is_file():
            raise SystemExit(f'Missing consented model {model}.vvm. No files were changed.')
    from voicevox_core.blocking import Onnxruntime, OpenJtalk, Synthesizer, VoiceModelFile
    runtime = next((CORE / 'onnxruntime').rglob('voicevox_onnxruntime.dll'))
    synth = Synthesizer(
        Onnxruntime.load_once(filename=str(runtime)),
        OpenJtalk(str(CORE / 'dict/open_jtalk_dic_utf_8-1.11')),
        acceleration_mode='CPU',
        cpu_num_threads=4
    )
    for number in models:
        with VoiceModelFile.open(str(CORE / f'models/vvms/{number}.vvm')) as model:
            synth.load_voice_model(model)
    styles = {s.id: (c.name, s.name) for c in synth.metas() for s in c.styles}
    output = VOICES / ('generated-v1.7' if not args.character else 'generated-' + args.character)
    output.mkdir(exist_ok=True)
    report = {
        'version': config['version'],
        'engine': config['engine'],
        'sampleRate': RATE,
        'listeningReview': 'v3.2 overhaul: AquesTalk kana accent precision, intonation_scale=1.0 plateau-breaking prosody, zero-shimmer neural HiFi-GAN multi-syllables, and NCC-PSOLA short kinetic kiais.',
        'clips': [],
        'warnings': []
    }
    manifest = {
        'version': config['version'],
        'engine': config['engine'],
        'language': 'ja-JP',
        'profiles': {}
    }
    queries = {}
    preview = array.array('h')
    for character, profile in profiles.items():
        manifest['profiles'][character] = {**profile, 'credit': 'VOICEVOX:' + profile['voice'], 'lines': {}}
        for cue in (c for c in plan['clips'] if c['character'] == character):
            event = cue['event']
            family, speed, maximum = delivery(event)
            speed = profile.get('eventSpeeds', {}).get(event, speed)
            text = config['pronunciations'].get(cue['id'], re.sub(r'[…・]+', '', cue['text']))
            segments = [(text, family, speed)]
            if event == 'super':
                segments = [
                    (profile['superSegments'][0], 'intro' if 'intro' in profile['styles'] else 'normal', 1.01 if character != 'volt' else 1.06),
                    (profile['superSegments'][1], 'force', 1.04)
                ]
            elif cue['id'] == 'titan-sp1':
                segments = [
                    ('震脚っ！', 'force', 1.06),
                    ('大地砕きっ！', 'force', 1.04)
                ]
            raw_samples = array.array('h')
            records = []
            is_question = cue['originalText'].endswith('？')
            for index, (phrase, style_key, pace) in enumerate(segments):
                style_id = profile['styles'][style_key]
                if styles[style_id][0] != profile['voice']:
                    raise ValueError('Unexpected voice identity: ' + cue['id'])
                seg_key = f"{cue['id']}:{index}" if len(segments) > 1 else cue['id']
                if seg_key in kana_map:
                    query = synth.create_audio_query_from_kana(kana_map[seg_key], style_id)
                else:
                    query = synth.create_audio_query(phrase, style_id)
                query.speed_scale = round(pace * profile['speed'], 4)
                query.pitch_scale = profile['pitch']
                query.pre_phoneme_length = 0.025 if event not in ('select', 'win', 'ko') else 0.020
                query.post_phoneme_length = 0.020 if event not in ('select', 'win', 'ko', 'super', 'sp1', 'sp2', 'sp3') else (0.048 if event not in ('ko', 'win') else 0.070)
                query.output_sampling_rate = RATE
                query.output_stereo = False
                pause_len = 0.028 if event.startswith('sp') else 0.095
                for accent in query.accent_phrases:
                    if accent.pause_mora:
                        if isinstance(accent.pause_mora, dict):
                            accent.pause_mora['vowel_length'] = pause_len
                        else:
                            accent.pause_mora.vowel_length = pause_len
                mean_f0, mora_cnt = sculpt_query(query, character, event, cue['id'], index, len(segments))
                seg_pcm = read_pcm(synth.synthesis(query, style_id, enable_interrogative_upspeak=is_question))
                seg_event = 'super_intro' if (len(segments) > 1 and index == 0) else event
                if seg_event != 'super_intro':
                    seg_pcm = apply_short_kiai_psola(seg_pcm, mean_f0, seg_event, mora_cnt)
                if index:
                    pause_ms = 0.115 if event == 'super' else 0.040
                    raw_samples.extend([0] * round(RATE * pause_ms))
                raw_samples.extend(seg_pcm)
                records.append({
                    'text': phrase,
                    'kana': kana_map.get(seg_key, query.kana),
                    'voice': styles[style_id][0],
                    'style': styles[style_id][1],
                    'styleId': style_id,
                    'query': asdict(query)
                })
            samples = master_voice(raw_samples, character, event)
            peak = max(map(abs, samples), default=0)
            if peak < 200:
                raise ValueError('Silent clip: ' + cue['id'])
            rms = math.sqrt(sum(v * v for v in samples) / len(samples))
            path = output / cue['file']
            save_pcm(path, samples)
            duration = len(samples) / RATE
            if duration > maximum:
                report['warnings'].append({'clip': cue['id'], 'seconds': duration, 'recommendedMaximum': maximum})
            report['clips'].append({
                'clip': cue['id'],
                'seconds': round(duration, 3),
                'bytes': path.stat().st_size,
                'peak': peak,
                'rms': round(rms, 1),
                'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                'segments': [{k: v for k, v in r.items() if k != 'query'} for r in records]
            })
            queries[cue['id']] = records
            manifest['profiles'][character]['lines'][event] = cue['originalText']
            if event in ('select', 'sp1', 'super'):
                preview.extend(samples)
                preview.extend([0] * round(RATE * 0.30))
        print(character + ': 21 clips generated', flush=True)
    count = 21 * len(profiles)
    assert len(report['clips']) == count and len({c['clip'] for c in report['clips']}) == count
    for name, data in [('manifest.json', manifest), ('audio-report.json', report), ('queries.json', queries)]:
        (output / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    save_pcm(output / 'preview.wav', preview)
    print(json.dumps({'generated': count, 'warnings': report['warnings'], 'output': str(output)}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
