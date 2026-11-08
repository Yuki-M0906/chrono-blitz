"""Offline VOICEVOX audition. Generates candidates only; never edits the game audio.

Run after consenting to the official model/runtime and Shikoku Metan terms:
tools/voicevox-runtime/venv/Scripts/python.exe tools/generate-local-audition.py
"""
from pathlib import Path
import array
import html
import io
import json
import sys
import wave

ROOT = Path(__file__).resolve().parent.parent
CORE = ROOT / 'tools/voicevox-runtime/core'
OUTPUT = ROOT / 'assets/voices/audition-local'
RATE = 24000
CASES = [
    ('select', '選択台詞', [('静かな決着を。', 2, 1.06, 1.12)]),
    ('sp1', '必殺技', [('グレイシャーピラー！', 6, 1.20, 1.24)]),
    ('hurt0', '被弾', [('くっ！', 2, 1.24, .90)]),
    ('super', '超必殺技', [('アブソリュートゼロ。', 2, 1.10, 1.08), ('カリバー！', 6, 1.18, 1.28)]),
]


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


def main():
    # This script never downloads a model or automatically accepts its terms.
    model_path = CORE / 'models/vvms/0.vvm'
    dictionary = CORE / 'dict/open_jtalk_dic_utf_8-1.11'
    libraries = list((CORE / 'onnxruntime').rglob('voicevox_onnxruntime.dll'))
    if not model_path.is_file() or not dictionary.is_dir() or not libraries:
        raise SystemExit('VOICEVOX models/runtime/dictionary missing. Complete the consented official setup first.')
    from voicevox_core.blocking import Onnxruntime, OpenJtalk, Synthesizer, VoiceModelFile
    synth = Synthesizer(Onnxruntime.load_once(filename=str(libraries[0])), OpenJtalk(str(dictionary)),
                        acceleration_mode='CPU', cpu_num_threads=4)
    with VoiceModelFile.open(str(model_path)) as model:
        synth.load_voice_model(model)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    report = {'engine': 'VOICEVOX Core 0.17.1 / CPU', 'credit': 'VOICEVOX:四国めたん',
              'status': 'audition_only_not_applied_to_game', 'listeningReview': 'pending', 'clips': []}
    montage = array.array('h')
    cards = []
    for event, label, segments in CASES:
        samples = array.array('h')
        settings = []
        for index, (text, style, speed, intonation) in enumerate(segments):
            query = synth.create_audio_query(text, style)
            query.speed_scale = speed
            query.intonation_scale = intonation
            query.pitch_scale = -.025
            query.pre_phoneme_length = .02
            query.post_phoneme_length = .055
            query.output_sampling_rate = RATE
            query.output_stereo = False
            for phrase in query.accent_phrases:
                if phrase.pause_mora is not None:
                    if isinstance(phrase.pause_mora, dict): phrase.pause_mora['vowel_length'] = .10
                    else: phrase.pause_mora.vowel_length = .10
            if index:
                samples.extend([0] * int(RATE * .10))
            samples.extend(read_pcm(synth.synthesis(query, style, enable_interrogative_upspeak=False)))
            settings.append({'text': text, 'styleId': style, 'style': 'ノーマル' if style == 2 else 'ツンツン',
                             'speedScale': speed, 'intonationScale': intonation, 'pitchScale': -.025})
        peak = max(map(abs, samples), default=0)
        if peak < 200:
            raise RuntimeError('Silent audition clip: ' + event)
        # Attenuate only when necessary. Preserve breaths, dynamics and phrase endings.
        gain = min(1.0, 30000 / peak)
        fade = round(RATE * .004)
        samples = array.array('h', (round(value * gain * min(1, i / fade, (len(samples)-1-i) / fade))
                                   for i, value in enumerate(samples)))
        filename = 'freya-' + event + '.wav'
        save_pcm(OUTPUT / filename, samples)
        report['clips'].append({'file': filename, 'event': event, 'label': label,
                                'seconds': round(len(samples)/RATE, 3), 'peak': max(map(abs, samples)),
                                'segments': settings})
        montage.extend(samples)
        montage.extend([0] * round(RATE * .55))
        baseline = '../backup-v1.5/' if (ROOT/'assets/voices/backup-v1.5').exists() else '../'
        cards.append(f'<section><h2>{label}</h2><p>{html.escape(" / ".join(s[0] for s in segments))}</p>'
                     f'<div><label>旧版の音声（Windows SAPI）<audio controls preload="metadata" src="{baseline}{filename}"></audio></label>'
                     f'<label>ローカル試作（VOICEVOX）<audio controls preload="metadata" src="{filename}"></audio></label></div></section>')
        print(f'{filename}: {len(samples)/RATE:.2f}s', flush=True)
    save_pcm(OUTPUT / 'freya-preview.wav', montage)
    (OUTPUT / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    (OUTPUT / 'index.html').write_text('''<!doctype html><html lang="ja"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>フレイヤ 音声の聴き比べ</title>
<style>body{max-width:900px;margin:48px auto;padding:0 24px;background:#0c1423;color:#e5edf8;font:16px/1.7 system-ui}h1{font-size:28px}h2{font-size:20px;color:#9ddcf5}section{margin:22px 0;padding:20px;background:#172439;border:1px solid #31455f;border-radius:12px}section div{display:grid;grid-template-columns:1fr 1fr;gap:24px}audio{display:block;width:100%;margin-top:10px}a{color:#9ddcf5}footer{font-size:14px;color:#bbc9da}@media(max-width:650px){section div{grid-template-columns:1fr}}</style>
<h1>フレイヤの声を聴き比べ</h1><p>選択台詞・必殺技・被弾・超必殺技の4種類。初回の試作を記録した比較ページです。</p>
''' + ''.join(cards) + '''<footer>音声生成：VOICEVOX:四国めたん（ノーマル／ツンツン）<br>
<a href="https://zunko.jp/con_ongen_kiyaku.html">音源利用規約</a> · <a href="https://voicevox.hiroshiba.jp/">VOICEVOX</a>
<p>この音声を再利用・配布する場合も、上記クレジットと音源規約を守ってください。</p></footer>
<script>document.addEventListener('play',e=>{if(e.target.tagName==='AUDIO')document.querySelectorAll('audio').forEach(a=>{if(a!==e.target)a.pause()})},true)</script></html>''', encoding='utf-8')
    print('Audition page: ' + str(OUTPUT / 'index.html'))


if __name__ == '__main__':
    main()
