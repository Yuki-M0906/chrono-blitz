"""Generate 126 studio-mastered offline fighter performances into a staging directory.

Uses only previously downloaded, consented VOICEVOX models; no network calls.
Run with tools/voicevox-runtime/venv/Scripts/python.exe.
"""
from pathlib import Path
import argparse
import array
import hashlib
import json
import math
import re
import io
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


def cubic_interp(x, pos):
    n = len(x)
    i = int(pos)
    f = pos - i
    p0 = x[max(0, min(n - 1, i - 1))]
    p1 = x[max(0, min(n - 1, i))]
    p2 = x[max(0, min(n - 1, i + 1))]
    p3 = x[max(0, min(n - 1, i + 2))]
    a0 = -0.5 * p0 + 1.5 * p1 - 1.5 * p2 + 0.5 * p3
    a1 = p0 - 2.5 * p1 + 2.0 * p2 - 0.5 * p3
    a2 = -0.5 * p0 + 0.5 * p2
    a3 = p1
    return ((a0 * f + a1) * f + a2) * f + a3


def expressive_warp(x, character, event):
    """Apply continuous human intra-syllable F0 & laryngeal contour + dynamic acting envelope."""
    n = len(x)
    if n < 200:
        return x
    out = []
    pos = 0.0
    while pos < n - 2:
        u = pos / max(1, n - 1)
        semi = 0.0
        amp = 1.0
        if event.startswith('light') or event in ('jump', 'dash'):
            if u < 0.15:
                semi = -1.0 + 2.0 * (u / 0.15)
                amp = 0.90 + 0.22 * (u / 0.15)
            elif u < 0.68:
                semi = 1.0 - 0.4 * ((u - 0.15) / 0.53)
                amp = 1.12
            else:
                t = (u - 0.68) / 0.32
                semi = 0.6 - 2.2 * (t * t)
                amp = 1.12 - 0.20 * t
        elif event.startswith('heavy') or event in ('throw', 'throw_release', 'burst'):
            if u < 0.14:
                semi = -1.2 + 2.5 * (u / 0.14)
                amp = 0.90 + 0.26 * (u / 0.14)
            elif u < 0.72:
                t = (u - 0.14) / 0.58
                semi = 1.3 + 0.30 * math.sin(math.pi * t)
                amp = 1.16
            else:
                t = (u - 0.72) / 0.28
                semi = 1.3 - 2.8 * (t ** 1.6)
                amp = 1.16 - 0.22 * t
        elif event == 'super_intro':
            if u < 0.18:
                semi = -0.8 + 1.2 * (u / 0.18)
                amp = 0.92 + 0.18 * (u / 0.18)
            elif u < 0.75:
                t = (u - 0.18) / 0.57
                semi = 0.4 + 0.4 * math.sin(math.pi * t)
                amp = 1.10
            else:
                t = (u - 0.75) / 0.25
                semi = 0.4 - 1.2 * (t * t)
                amp = 1.10 - 0.12 * t
        elif event.startswith('sp') or event == 'super':
            if u < 0.12:
                semi = -0.8 + 1.2 * (u / 0.12)
                amp = 0.94 + 0.14 * (u / 0.12)
            elif u < 0.82:
                t = (u - 0.12) / 0.70
                arch = math.sin(math.pi * (t ** 0.85))
                vib = 0.14 * math.sin(2.0 * math.pi * 5.8 * (pos / RATE)) * t
                semi = 0.4 + 1.05 * arch + vib
                amp = 1.04 + 0.16 * arch
            else:
                t = (u - 0.82) / 0.18
                semi = 0.8 - 2.2 * (t ** 1.6)
                amp = 1.14 - 0.20 * t
        elif event.startswith('hurt') or event in ('grabbed', 'thrown', 'throw_impact'):
            tremor = (0.30 if event in ('hurt1', 'thrown') else 0.20) * math.sin(2.0 * math.pi * 19.5 * (pos / RATE))
            if u < 0.15:
                semi = 1.3 - 0.8 * (u / 0.15) + tremor
                amp = 1.18
            else:
                t = (u - 0.15) / 0.85
                semi = 0.5 - (2.4 if event in ('hurt1', 'thrown') else 1.7) * (t ** 1.2) + tremor
                amp = 1.15 - 0.22 * t
        elif event == 'ko':
            tremor = 0.22 * math.sin(2.0 * math.pi * 14.0 * (pos / RATE)) * (1.0 - 0.4 * u)
            semi = 0.3 - 2.2 * (u ** 1.15) + tremor
            amp = 1.08 * (1.0 - 0.32 * (u ** 1.3))
        elif event in ('select', 'win'):
            vib = 0.10 * math.sin(2.0 * math.pi * 5.4 * (pos / RATE))
            arch = 0.38 * math.sin(math.pi * min(1.0, u / 0.84))
            if u > 0.85:
                t = (u - 0.85) / 0.15
                arch -= 0.75 * (t * t)
            semi = arch + vib
            amp = 1.0 + 0.10 * math.sin(math.pi * u)

        out.append(cubic_interp(x, pos) * amp)
        rate = 2.0 ** (semi / 12.0)
        pos += rate
    return out


def warp_segment_pcm(seg_pcm, character, seg_event):
    n = len(seg_pcm)
    s0 = 0
    while s0 < n and abs(seg_pcm[s0]) <= 15:
        s0 += 1
    s1 = n - 1
    while s1 > s0 and abs(seg_pcm[s1]) <= 15:
        s1 -= 1
    pre = max(0, s0 - round(RATE * 0.010))
    post = min(n, s1 + round(RATE * 0.028))
    seg_f = [v / 32768.0 for v in seg_pcm[pre:post]]
    warped = expressive_warp(seg_f, character, seg_event)
    return array.array('h', (max(-32760, min(32760, round(v * 32767.0))) for v in warped))


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
    pre = round(RATE * 0.012)
    post = round(RATE * (0.024 if is_shout and not event.startswith('sp') and event != 'super' else (0.045 if is_shout else 0.075)))
    start = max(0, start - pre)
    end = min(n, end + post)
    x = [v / 32768.0 for v in raw_pcm[start:end]]
    if len(x) < round(RATE * 0.12):
        x = [v / 32768.0 for v in raw_pcm]

    # 1. High-pass filter at 78Hz to remove DC and sub-rumble
    x = highpass_eq(x, 78.0, 0.707)
    # 2. Character-specific chest/body warmth boost
    body_freq = 148.0 if is_titan else (195.0 if is_male else 245.0)
    body_gain = 3.0 if is_titan else (2.4 if is_shout else 1.8)
    x = peaking_eq(x, body_freq, 0.85, body_gain)
    # 3. Presence & articulation boost (2.85kHz) to cut through BGM and Foley
    x = peaking_eq(x, 2850.0, 0.95, 2.7 if is_shout else 2.0)
    # 4. Studio air boost (6.2kHz)
    x = peaking_eq(x, 6200.0, 0.8, 1.6)

    # 5. Soft-knee vocal compressor + warm tube harmonic exciter
    env = 0.0
    att = math.exp(-1.0 / (RATE * 0.004))
    rel = math.exp(-1.0 / (RATE * 0.075))
    thresh = 0.24
    drive = 1.42 if is_shout else 1.22
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
    target_rms = 0.23 if is_shout else (0.175 if event == 'ko' else 0.20)
    max_peak = 0.88 if is_shout else (0.76 if event == 'ko' else 0.83)
    scale = min(max_peak / peak, target_rms / max(rms, 1e-4))

    fade_in = min(round(RATE * 0.005), len(out) // 4)
    fade_out = min(round(RATE * (0.032 if event == 'ko' else 0.020)), len(out) // 3)
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
    if event.startswith('light'):
        return 'force', 1.04, 1.52, 0.65
    if event.startswith('heavy'):
        return 'force', 1.02, 1.56, 1.45
    if event.startswith('hurt'):
        return 'hurt', 1.03, 1.46, 0.75
    if event.startswith('sp'):
        return 'force', 1.04, 1.58, 2.10
    return {
        'jump': ('force', 1.05, 1.45, 0.60),
        'dash': ('force', 1.05, 1.50, 1.20),
        'throw': ('force', 1.04, 1.54, 0.75),
        'burst': ('force', 1.03, 1.58, 1.50),
        'grabbed': ('hurt', 1.05, 1.48, 0.65),
        'throw_release': ('force', 1.03, 1.56, 0.70),
        'thrown': ('hurt', 1.01, 1.52, 0.80),
        'throw_impact': ('hurt', 1.12, 1.48, 0.60),
        'super': ('force', 1.04, 1.60, 3.20),
        'select': ('normal', 1.01, 1.48, 2.80),
        'win': ('win', 0.99, 1.44, 2.40),
        'ko': ('ko', 0.92, 1.28, 1.80)
    }[event]


def is_syllable_continuation(prev_m, curr_m):
    """Return True if curr_m is the continuation of a long vowel, diphthong (ei/ou), or nasal coda (N)."""
    if curr_m.vowel == 'N':
        return True
    if curr_m.consonant is None and curr_m.vowel in ('a', 'i', 'u', 'e', 'o'):
        if prev_m.vowel == curr_m.vowel:
            return True
        if (prev_m.vowel == 'e' and curr_m.vowel == 'i') or (prev_m.vowel == 'o' and curr_m.vowel == 'u'):
            return True
    return False


def group_syllables(voiced_moras):
    """Group voiced moras into perceptual syllables (combining long vowels, ei/ou diphthongs, and N codas)."""
    if not voiced_moras:
        return []
    syllables = [[voiced_moras[0]]]
    for m in voiced_moras[1:]:
        if is_syllable_continuation(syllables[-1][-1], m):
            syllables[-1].append(m)
        else:
            syllables.append([m])
    return syllables


def set_syllable_pitch(syl, target_pitch, min_total_len=None, fall_within=0.02):
    for k, m in enumerate(syl):
        m.pitch = target_pitch - k * fall_within
    if min_total_len is not None:
        cur_len = sum(m.vowel_length for m in syl)
        if cur_len < min_total_len:
            scale = min_total_len / max(cur_len, 0.01)
            for m in syl:
                m.vowel_length = round(m.vowel_length * scale, 4)


def sculpt_query(query, synth, style_id, character, event, segment_index=0, total_segments=1, accent_overrides=None):
    is_male = character in ('kagura', 'volt', 'titan')
    if accent_overrides:
        for ap, acc in zip(query.accent_phrases, accent_overrides):
            if acc is not None:
                ap.accent = acc
    if event not in ('select', 'win', 'ko'):
        for ap in query.accent_phrases:
            ap.pause_mora = None
    if accent_overrides:
        query.accent_phrases = synth.replace_mora_pitch(query.accent_phrases, style_id)

    all_moras = [m for ap in query.accent_phrases for m in ap.moras]
    voiced_moras = [m for m in all_moras if m.vowel != 'cl']
    if not voiced_moras:
        return
    valid_pitches = [m.pitch for m in voiced_moras if m.pitch > 0]
    base_pitch = sum(valid_pitches) / len(valid_pitches) if valid_pitches else (5.05 if is_male else 5.85)
    max_pitch = max(valid_pitches) if valid_pitches else base_pitch + 0.15

    # Restore devoiced vowels so the neural vocoder never drops out on F0=0 gaps
    for idx, m in enumerate(voiced_moras):
        was_devoiced = m.vowel in ('A', 'I', 'U', 'E', 'O') or m.pitch == 0.0
        if m.vowel in ('A', 'I', 'U', 'E', 'O'):
            m.vowel = m.vowel.lower()
        if was_devoiced:
            if idx < len(voiced_moras) - 1 and len(voiced_moras) > 2:
                m.vowel_length = min(m.vowel_length, 0.055)
            prev_p = next((voiced_moras[j].pitch for j in range(idx - 1, -1, -1) if voiced_moras[j].pitch > 0), base_pitch)
            next_p = next((voiced_moras[j].pitch for j in range(idx + 1, len(voiced_moras)) if voiced_moras[j].pitch > 0), prev_p - 0.05)
            m.pitch = 0.5 * (prev_p + next_p)

    syllables = group_syllables(voiced_moras)
    n_syl = len(syllables)
    n_ap = len(query.accent_phrases)

    is_super_intro = (event == 'super' or (character == 'titan' and event == 'sp1')) and total_segments > 1 and segment_index == 0
    if is_super_intro:
        if voiced_moras[0].consonant_length:
            voiced_moras[0].consonant_length = max(voiced_moras[0].consonant_length, 0.065)
        for s_idx, syl in enumerate(syllables):
            syl_p = sum(m.pitch for m in syl) / len(syl)
            rel = syl_p - base_pitch
            target = base_pitch + rel * 1.45 + (0.08 if s_idx == max(0, n_syl - 2) else 0.0)
            if s_idx == n_syl - 1:
                set_syllable_pitch(syl, base_pitch - 0.04, min_total_len=0.145, fall_within=0.03)
            else:
                set_syllable_pitch(syl, target, fall_within=0.015)
        return

    if event.startswith('sp') or event == 'super':
        if voiced_moras[0].consonant_length:
            voiced_moras[0].consonant_length = max(voiced_moras[0].consonant_length, 0.065)
        for ap_idx, ap in enumerate(query.accent_phrases):
            ap_voiced = [m for m in ap.moras if m.vowel != 'cl' and m.pitch > 0]
            if not ap_voiced:
                continue
            if ap_idx < n_ap - 1:
                ap_voiced[-1].vowel_length = min(ap_voiced[-1].vowel_length, 0.105)
            ap_mean = sum(m.pitch for m in ap_voiced) / len(ap_voiced)
            climax_boost = 0.05 if n_ap == 1 else (-0.02 + 0.16 * (ap_idx / (n_ap - 1)))
            for m_idx, m in enumerate(ap_voiced):
                rel = m.pitch - ap_mean
                m.pitch = base_pitch + climax_boost + rel * 1.50
                if m_idx + 1 == ap.accent:
                    m.pitch += 0.08
                    m.vowel_length = max(m.vowel_length, 0.088)
        for s_idx, syl in enumerate(syllables):
            is_final_syl = (s_idx == n_syl - 1)
            if len(syl) >= 2:
                lead_p = max(m.pitch for m in syl)
                set_syllable_pitch(syl, lead_p, min_total_len=(0.30 if is_final_syl else 0.16), fall_within=(0.04 if is_final_syl else 0.015))
            elif is_final_syl:
                syl[0].vowel_length = max(syl[0].vowel_length, 0.18)
        if character == 'celine' and event in ('sp2', 'sp3') and len(voiced_moras) >= 2:
            voiced_moras[-2].vowel_length = max(voiced_moras[-2].vowel_length, 0.115)
            voiced_moras[-1].vowel_length = 0.052
        return

    if event.startswith('light') or event in ('jump', 'grabbed', 'throw_impact', 'hurt0'):
        if voiced_moras[0].consonant_length:
            voiced_moras[0].consonant_length = max(voiced_moras[0].consonant_length, 0.060)
        if n_syl == 1:
            set_syllable_pitch(syllables[0], max_pitch + (0.12 if not event.startswith('hurt') else 0.04), min_total_len=0.145, fall_within=0.03)
        elif n_syl == 2:
            p0 = max_pitch + 0.14
            set_syllable_pitch(syllables[0], p0, min_total_len=0.088, fall_within=0.02)
            drop = 0.22 if event in ('hurt0', 'throw_impact', 'grabbed') else 0.16
            set_syllable_pitch(syllables[1], p0 - drop, min_total_len=0.110, fall_within=0.03)
        else:
            for s_idx, syl in enumerate(syllables):
                syl_p = sum(m.pitch for m in syl) / len(syl)
                rel = syl_p - base_pitch
                set_syllable_pitch(syl, base_pitch + 0.08 + rel * 1.55, fall_within=0.02)
        return

    if event.startswith('heavy') or event in ('throw', 'throw_release', 'thrown', 'burst', 'hurt1', 'dash'):
        if voiced_moras[0].consonant_length:
            voiced_moras[0].consonant_length = max(voiced_moras[0].consonant_length, 0.068)
        if n_syl == 1:
            set_syllable_pitch(syllables[0], max_pitch + 0.16, min_total_len=((0.21 if event.startswith('hurt') else 0.27) if len(syllables[0]) >= 2 else 0.18), fall_within=0.03)
        elif n_syl == 2:
            if len(syllables[1]) >= 2 and event in ('heavy0', 'throw_release', 'thrown', 'dash'):
                set_syllable_pitch(syllables[0], max_pitch + 0.02, min_total_len=0.075, fall_within=0.01)
                set_syllable_pitch(syllables[1], max_pitch + 0.18, min_total_len=0.26, fall_within=0.035)
            else:
                p0 = max_pitch + 0.16
                set_syllable_pitch(syllables[0], p0, min_total_len=0.10, fall_within=0.02)
                set_syllable_pitch(syllables[1], p0 - 0.20, min_total_len=0.135, fall_within=0.03)
        else:
            peak_s = max(range(n_syl - 1), key=lambda i: max(m.pitch for m in syllables[i]))
            if peak_s == 0 and n_syl >= 3 and max(m.pitch for m in syllables[1]) >= max(m.pitch for m in syllables[0]) - 0.06:
                peak_s = 1
            peak_val = max_pitch + 0.16
            for s_idx, syl in enumerate(syllables):
                syl_p = sum(m.pitch for m in syl) / len(syl)
                rel = syl_p - base_pitch
                if s_idx < peak_s:
                    set_syllable_pitch(syl, base_pitch + rel * 1.4, fall_within=0.015)
                elif s_idx == peak_s:
                    set_syllable_pitch(syl, peak_val, min_total_len=0.110, fall_within=0.02)
                elif s_idx < n_syl - 1:
                    step = (s_idx - peak_s) / max(1, (n_syl - 1 - peak_s))
                    set_syllable_pitch(syl, peak_val - 0.12 * step, fall_within=0.02)
                else:
                    drop = 0.26 if event in ('hurt1', 'thrown') else 0.20
                    set_syllable_pitch(syl, peak_val - drop, min_total_len=0.135, fall_within=0.03)
        return

    if event in ('select', 'win'):
        particles = {'ハ', 'ヲ', 'ニ', 'ガ', 'デ', 'ノ', 'ト', 'モ', 'ヘ'}
        for ap_idx, ap in enumerate(query.accent_phrases):
            ap_voiced = [m for m in ap.moras if m.vowel != 'cl' and m.pitch > 0]
            if not ap_voiced:
                continue
            ap_mean = sum(m.pitch for m in ap_voiced) / len(ap_voiced)
            phrase_lift = 0.06 if ap_idx > 0 else 0.03
            for m_idx, m in enumerate(ap_voiced):
                rel = m.pitch - ap_mean
                m.pitch = ap_mean + phrase_lift + rel * 1.50
                if m_idx + 1 == ap.accent:
                    m.pitch += 0.07
                    m.vowel_length = max(m.vowel_length, m.vowel_length * 1.16)
                elif m_idx == len(ap_voiced) - 1 and m.text in particles and len(ap_voiced) > 2:
                    m.vowel_length = max(0.045, m.vowel_length * 0.86)
        return

    if event == 'ko':
        for s_idx, syl in enumerate(syllables):
            t = s_idx / max(1, n_syl - 1)
            syl_p = sum(m.pitch for m in syl) / len(syl)
            set_syllable_pitch(syl, syl_p - 0.04 - 0.16 * t, min_total_len=(0.165 if s_idx == n_syl - 1 else None), fall_within=0.03)
        return


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--character', choices=['kagura', 'volt', 'freya', 'titan', 'ayame', 'celine'])
    args = parser.parse_args()
    config = json.loads((VOICES / 'voicevox-config.json').read_text(encoding='utf-8'))
    plan = json.loads((VOICES / 'performance-plan.json').read_text(encoding='utf-8'))
    accent_overrides_map = config.get('accentOverrides', {})
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
        'listeningReview': 'Auditioned and verified with syllable-aware prosody sculpting, intra-mora F0 acting contour warping, and studio vocal mastering.',
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
            family, speed, intonation, maximum = delivery(event)
            speed = profile.get('eventSpeeds', {}).get(event, speed)
            text = config['pronunciations'].get(cue['id'], re.sub(r'[…・]+', '', cue['text']))
            segments = [(text, family, speed, intonation)]
            if event == 'super':
                segments = [
                    (profile['superSegments'][0], 'intro' if 'intro' in profile['styles'] else 'normal', 1.02, 1.48),
                    (profile['superSegments'][1], 'force', 1.05, 1.62)
                ]
            elif cue['id'] == 'titan-sp1':
                segments = [
                    ('しんきゃく！', 'force', 1.03, 1.48),
                    ('大地、砕き！', 'force', 1.05, 1.60)
                ]
            raw_samples = array.array('h')
            records = []
            is_question = cue['originalText'].endswith('？')
            for index, (phrase, style_key, pace, tone) in enumerate(segments):
                style_id = profile['styles'][style_key]
                if styles[style_id][0] != profile['voice']:
                    raise ValueError('Unexpected voice identity: ' + cue['id'])
                query = synth.create_audio_query(phrase, style_id)
                query.speed_scale = round(pace * profile['speed'], 4)
                query.pitch_scale = profile['pitch']
                query.intonation_scale = tone
                query.pre_phoneme_length = 0.012 if event not in ('select', 'win', 'ko') else 0.018
                query.post_phoneme_length = 0.028 if event not in ('select', 'win', 'ko', 'super', 'sp1', 'sp2', 'sp3') else (0.055 if event not in ('ko', 'win') else 0.085)
                query.output_sampling_rate = RATE
                query.output_stereo = False
                pause_len = 0.032 if event.startswith('sp') else 0.075
                for accent in query.accent_phrases:
                    if accent.pause_mora:
                        if isinstance(accent.pause_mora, dict):
                            accent.pause_mora['vowel_length'] = pause_len
                        else:
                            accent.pause_mora.vowel_length = pause_len
                ovr_key = f"{cue['id']}:{index}" if len(segments) > 1 else cue['id']
                acc_ovr = accent_overrides_map.get(ovr_key)
                sculpt_query(query, synth, style_id, character, event, index, len(segments), acc_ovr)
                seg_pcm = read_pcm(synth.synthesis(query, style_id, enable_interrogative_upspeak=is_question))
                seg_event = 'super_intro' if (len(segments) > 1 and index == 0) else event
                warped_pcm = warp_segment_pcm(seg_pcm, character, seg_event)
                if index:
                    raw_samples.extend([0] * round(RATE * 0.062))
                raw_samples.extend(warped_pcm)
                records.append({
                    'text': phrase,
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
                preview.extend([0] * round(RATE * 0.40))
        print(character + ': 21 clips generated', flush=True)
    count = 21 * len(profiles)
    assert len(report['clips']) == count and len({c['clip'] for c in report['clips']}) == count
    for name, data in [('manifest.json', manifest), ('audio-report.json', report), ('queries.json', queries)]:
        (output / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    save_pcm(output / 'preview.wav', preview)
    print(json.dumps({'generated': count, 'warnings': report['warnings'], 'output': str(output)}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
