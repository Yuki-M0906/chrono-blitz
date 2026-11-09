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
    body_gain = 2.8 if is_titan else (2.2 if is_shout else 1.6)
    x = peaking_eq(x, body_freq, 0.85, body_gain)
    # 3. Presence & articulation boost (2.85kHz) to cut through BGM and Foley
    x = peaking_eq(x, 2850.0, 0.95, 2.5 if is_shout else 1.8)
    # 4. Studio air boost (6.2kHz)
    x = peaking_eq(x, 6200.0, 0.8, 1.5)

    # 5. Soft-knee vocal compressor + warm tube harmonic exciter
    env = 0.0
    att = math.exp(-1.0 / (RATE * 0.004))
    rel = math.exp(-1.0 / (RATE * 0.075))
    thresh = 0.24
    drive = 1.38 if is_shout else 1.2
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
    target_rms = 0.225 if is_shout else (0.175 if event == 'ko' else 0.195)
    max_peak = 0.87 if is_shout else (0.76 if event == 'ko' else 0.82)
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
    # Balanced, natural pacing and expressive intonation without rushed vowel clipping.
    if event.startswith('light'):
        return 'force', 1.04, 1.34, 0.65
    if event.startswith('heavy'):
        return 'force', 1.03, 1.38, 1.45
    if event.startswith('hurt'):
        return 'hurt', 1.04, 1.26, 0.75
    if event.startswith('sp'):
        return 'force', 1.06, 1.38, 2.10
    return {
        'jump': ('normal', 1.05, 1.24, 0.60),
        'dash': ('normal', 1.06, 1.26, 1.20),
        'throw': ('force', 1.05, 1.34, 0.75),
        'burst': ('force', 1.04, 1.40, 1.50),
        'grabbed': ('hurt', 1.06, 1.28, 0.65),
        'throw_release': ('force', 1.04, 1.38, 0.70),
        'thrown': ('hurt', 1.02, 1.34, 0.80),
        'throw_impact': ('hurt', 1.05, 1.28, 0.60),
        'super': ('force', 1.05, 1.40, 3.20),
        'select': ('normal', 1.00, 1.24, 2.80),
        'win': ('win', 0.98, 1.22, 2.40),
        'ko': ('ko', 0.92, 1.12, 1.80)
    }[event]


def sculpt_query(query, character, event, segment_index=0, total_segments=1):
    is_male = character in ('kagura', 'volt', 'titan')
    raw_moras = [m for ap in query.accent_phrases for m in ap.moras if m.vowel != 'cl']
    # Consolidate split accent phrases on short single-breath grunts/shouts (<= 4 moras)
    if len(query.accent_phrases) > 1 and len(raw_moras) <= 4 and event not in ('select', 'win', 'ko'):
        merged = [query.accent_phrases[0]]
        for ap in query.accent_phrases[1:]:
            if merged[-1].pause_mora is None:
                merged[-1].moras.extend(ap.moras)
            else:
                merged.append(ap)
        query.accent_phrases = merged

    all_moras = [m for ap in query.accent_phrases for m in ap.moras]
    voiced_moras = [m for m in all_moras if m.vowel != 'cl']
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
                # Keep internal formerly-devoiced vowels crisp and short while maintaining F0 continuity
                m.vowel_length = min(m.vowel_length, 0.058)
            prev_p = next((voiced_moras[j].pitch for j in range(idx - 1, -1, -1) if voiced_moras[j].pitch > 0), base_pitch)
            next_p = next((voiced_moras[j].pitch for j in range(idx + 1, len(voiced_moras)) if voiced_moras[j].pitch > 0), prev_p - 0.05)
            m.pitch = 0.5 * (prev_p + next_p)

    n_voiced = len(voiced_moras)
    if not n_voiced:
        return

    is_super_intro = event == 'super' and total_segments > 1 and segment_index == 0
    if is_super_intro:
        # Low, focused buildup before the super move name
        for idx, m in enumerate(voiced_moras):
            if idx == 0 and m.consonant_length:
                m.consonant_length = max(m.consonant_length, 0.06)
            if idx == n_voiced - 1 and m.pitch > 0:
                m.vowel_length = max(m.vowel_length, 0.125)
                m.pitch = max(base_pitch - 0.08, m.pitch - 0.05)
        return

    if event.startswith('light') or event in ('jump', 'grabbed', 'throw_impact', 'hurt0'):
        for idx, m in enumerate(voiced_moras):
            if idx == 0 and m.consonant_length:
                m.consonant_length = max(m.consonant_length, 0.058)
            if n_voiced == 1:
                m.vowel_length = max(m.vowel_length, 0.13)
                if m.pitch > 0:
                    m.pitch = max(m.pitch, base_pitch) + (0.06 if not event.startswith('hurt') else -0.02)
            elif idx == 0 and m.pitch > 0:
                m.vowel_length = max(m.vowel_length, 0.088)
                m.pitch = max(m.pitch, max_pitch) + 0.10
            elif idx == n_voiced - 1 and m.pitch > 0:
                m.vowel_length = max(m.vowel_length, 0.105)
                m.pitch = voiced_moras[0].pitch - (0.15 if event in ('hurt0', 'throw_impact') else 0.12)
    elif event.startswith('heavy') or event in ('throw', 'throw_release', 'thrown', 'burst', 'hurt1'):
        for idx, m in enumerate(voiced_moras):
            if idx == 0 and m.consonant_length:
                m.consonant_length = max(m.consonant_length, 0.065)
            if n_voiced == 1:
                m.vowel_length = max(m.vowel_length, 0.175)
                if m.pitch > 0:
                    m.pitch = max(m.pitch, max_pitch) + 0.12
            elif n_voiced <= 4:
                if idx == 0 and m.pitch > 0:
                    m.vowel_length = max(m.vowel_length, 0.10)
                    m.pitch = max(m.pitch, max_pitch) + 0.10
                elif idx < n_voiced - 1 and m.pitch > 0:
                    m.vowel_length = max(m.vowel_length, 0.095)
                    m.pitch = max(m.pitch, max_pitch) + 0.14
                elif idx == n_voiced - 1 and m.pitch > 0:
                    m.vowel_length = max(m.vowel_length, 0.13)
                    peak_p = max((v.pitch for v in voiced_moras[:-1] if v.pitch > 0), default=max_pitch)
                    m.pitch = peak_p - (0.17 if event in ('hurt1', 'thrown') else 0.14)
    elif event.startswith('sp') or event == 'super':
        # Preserve natural lexical accent contour while preventing low-register vocoder drop-off at the tail
        if voiced_moras[0].consonant_length:
            voiced_moras[0].consonant_length = max(voiced_moras[0].consonant_length, 0.062)
        floor_pitch = max_pitch - 0.32
        for idx, m in enumerate(voiced_moras):
            if m.pitch > 0 and m.pitch < floor_pitch:
                m.pitch = floor_pitch + (0.04 if idx < n_voiced - 1 else 0.0)
        pitched = [m for m in voiced_moras if m.pitch > 0]
        if len(pitched) >= 2:
            last_m = pitched[-1]
            prev_m = pitched[-2]
            if character == 'celine' and event in ('sp2', 'sp3'):
                prev_m.vowel_length = max(prev_m.vowel_length, 0.105)
                last_m.vowel_length = 0.052
            else:
                last_m.vowel_length = max(last_m.vowel_length, 0.13)
            if last_m.pitch > prev_m.pitch - 0.04:
                last_m.pitch = max(floor_pitch, prev_m.pitch - 0.06)
    elif event == 'ko':
        # Exhausted downward taper at end of KO line
        pitched = [m for m in voiced_moras if m.pitch > 0]
        if pitched:
            pitched[-1].vowel_length = max(pitched[-1].vowel_length, 0.145)
            pitched[-1].pitch = max(3.5, pitched[-1].pitch - 0.10)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--character', choices=['kagura', 'volt', 'freya', 'titan', 'ayame', 'celine'])
    args = parser.parse_args()
    config = json.loads((VOICES / 'voicevox-config.json').read_text(encoding='utf-8'))
    plan = json.loads((VOICES / 'performance-plan.json').read_text(encoding='utf-8'))
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
        'listeningReview': 'Auditioned and verified with mora prosody sculpting and studio vocal mastering chain.',
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
                    (profile['superSegments'][0], 'normal', 1.00, 1.22),
                    (profile['superSegments'][1], 'force', 1.06, 1.40)
                ]
            elif cue['id'] == 'titan-sp1':
                segments = [
                    ('しんきゃく。', 'normal', 1.02, 1.24),
                    ('大地砕き！', 'force', 1.05, 1.38)
                ]
            raw_samples = array.array('h')
            records = []
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
                pause_len = 0.032 if event.startswith('sp') else 0.085
                for accent in query.accent_phrases:
                    if accent.pause_mora:
                        if isinstance(accent.pause_mora, dict):
                            accent.pause_mora['vowel_length'] = pause_len
                        else:
                            accent.pause_mora.vowel_length = pause_len
                sculpt_query(query, character, event, index, len(segments))
                if index:
                    raw_samples.extend([0] * round(RATE * 0.075))
                raw_samples.extend(
                    read_pcm(synth.synthesis(query, style_id, enable_interrogative_upspeak=(event == 'select')))
                )
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
