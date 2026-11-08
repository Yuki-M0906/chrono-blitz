"""Generate 126 offline fighter performances into a staging directory.

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
    if sys.byteorder != 'little': samples.byteswap()
    return samples


def save_pcm(path, samples):
    encoded = array.array('h', samples)
    if sys.byteorder != 'little': encoded.byteswap()
    with wave.open(str(path), 'wb') as f:
        f.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        f.writeframes(encoded.tobytes())


def delivery(event):
    # Style changes affect the learned voice performance, independently of pitch/speed.
    if event.startswith('light'): return 'force', 1.20, 1.17, .65
    if event.startswith('heavy'): return 'force', 1.19, 1.27, 1.45
    if event.startswith('hurt'): return 'hurt', 1.24, .88, .75
    if event.startswith('sp'): return 'force', 1.20, 1.25, 2.10
    return {
        'jump':('normal',1.24,.95,.60), 'dash':('normal',1.20,1.12,1.2),
        'throw':('force',1.30,1.20,.60), 'burst':('force',1.17,1.30,1.5),
        'grabbed':('hurt',1.28,1.05,.65), 'throw_release':('force',1.30,1.30,.70),
        'thrown':('hurt',1.15,1.18,.80), 'throw_impact':('hurt',1.30,.90,.60),
        'super':('force',1.18,1.30,3.2), 'select':('normal',1.06,1.12,2.8),
        'win':('win',1.02,1.12,2.4), 'ko':('ko',.98,.85,1.8)
    }[event]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--character', choices=['kagura','volt','freya','titan','ayame','celine'])
    args = parser.parse_args()
    config = json.loads((VOICES/'voicevox-config.json').read_text(encoding='utf-8'))
    plan = json.loads((VOICES/'performance-plan.json').read_text(encoding='utf-8'))
    profiles = {k:v for k,v in config['profiles'].items() if not args.character or k == args.character}
    models = sorted({m for profile in profiles.values() for m in profile['models']})
    for model in models:
        if not (CORE/f'models/vvms/{model}.vvm').is_file():
            raise SystemExit(f'Missing consented model {model}.vvm. No files were changed.')
    from voicevox_core.blocking import Onnxruntime, OpenJtalk, Synthesizer, VoiceModelFile
    runtime = next((CORE/'onnxruntime').rglob('voicevox_onnxruntime.dll'))
    synth = Synthesizer(Onnxruntime.load_once(filename=str(runtime)),
                        OpenJtalk(str(CORE/'dict/open_jtalk_dic_utf_8-1.11')),
                        acceleration_mode='CPU', cpu_num_threads=4)
    for number in models:
        with VoiceModelFile.open(str(CORE/f'models/vvms/{number}.vvm')) as model:
            synth.load_voice_model(model)
    styles = {s.id:(c.name,s.name) for c in synth.metas() for s in c.styles}
    output = VOICES / ('generated-v1.7' if not args.character else 'generated-'+args.character)
    output.mkdir(exist_ok=True)
    report = {'version':config['version'],'engine':config['engine'], 'sampleRate':RATE,
              'listeningReview':'Not claimed: automated decode, signal, duration and waveform checks only.',
              'clips':[], 'warnings':[]}
    manifest = {'version':config['version'],'engine':config['engine'],'language':'ja-JP','profiles':{}}
    queries = {}
    preview = array.array('h')
    for character, profile in profiles.items():
        manifest['profiles'][character] = {**profile,'credit':'VOICEVOX:'+profile['voice'],'lines':{}}
        for cue in (c for c in plan['clips'] if c['character']==character):
            event = cue['event']
            family, speed, intonation, maximum = delivery(event)
            speed = profile.get('eventSpeeds',{}).get(event,speed)
            text = config['pronunciations'].get(cue['id'], re.sub(r'[…・]+','',cue['text']))
            segments = [(text, family, speed, intonation)]
            if event=='super':
                segments = [(profile['superSegments'][0],'normal',1.08,1.08),
                            (profile['superSegments'][1],'force',1.18,1.30)]
            elif cue['id']=='titan-sp1':
                segments = [('シンキャク。','normal',1.18,1.10),('大地砕き！','force',1.20,1.28)]
            samples = array.array('h')
            records = []
            for index,(phrase, style_key, pace, tone) in enumerate(segments):
                style_id = profile['styles'][style_key]
                if styles[style_id][0] != profile['voice']:
                    raise ValueError('Unexpected voice identity: '+cue['id'])
                query = synth.create_audio_query(phrase, style_id)
                query.speed_scale = round(pace*profile['speed'],4)
                query.pitch_scale = profile['pitch']
                query.intonation_scale = tone
                query.pre_phoneme_length = .014
                query.post_phoneme_length = .045 if event not in ('ko','win') else .085
                query.output_sampling_rate = RATE
                query.output_stereo = False
                for accent in query.accent_phrases:
                    if accent.pause_mora:
                        if isinstance(accent.pause_mora, dict): accent.pause_mora['vowel_length'] = .09
                        else: accent.pause_mora.vowel_length = .09
                if index: samples.extend([0]*round(RATE*.09))
                samples.extend(read_pcm(synth.synthesis(query,style_id,enable_interrogative_upspeak=event=='select')))
                records.append({'text':phrase,'voice':styles[style_id][0],'style':styles[style_id][1],
                                'styleId':style_id,'query':asdict(query)})
            peak = max(map(abs,samples),default=0)
            if peak<200: raise ValueError('Silent clip: '+cue['id'])
            rms = math.sqrt(sum(v*v for v in samples)/len(samples))
            target = 5200 if family=='force' else 4100
            gain = min(1.35, target/max(rms,1), 29200/peak)
            fade = round(RATE*.004)
            samples = array.array('h',(round(v*gain*max(0,min(1,i/fade,(len(samples)-1-i)/fade)))
                                      for i,v in enumerate(samples)))
            path = output / cue['file']
            save_pcm(path,samples)
            duration = len(samples)/RATE
            if duration>maximum: report['warnings'].append({'clip':cue['id'],'seconds':duration,'recommendedMaximum':maximum})
            report['clips'].append({'clip':cue['id'],'seconds':round(duration,3), 'bytes':path.stat().st_size,
                                    'peak':max(map(abs,samples)), 'rms':round(rms*gain,1),
                                    'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                                    'segments':[{k:v for k,v in r.items() if k!='query'} for r in records]})
            queries[cue['id']] = records
            manifest['profiles'][character]['lines'][event] = ''.join(s[0] for s in segments)
            if event in ('select','sp1','super'):
                preview.extend(samples);preview.extend([0]*round(RATE*.40))
        print(character+': 21 clips generated',flush=True)
    count = 21*len(profiles)
    assert len(report['clips'])==count and len({c['clip'] for c in report['clips']})==count
    for name, data in [('manifest.json',manifest),('audio-report.json',report),('queries.json',queries)]:
        (output/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    save_pcm(output/'preview.wav',preview)
    print(json.dumps({'generated':count,'warnings':report['warnings'],'output':str(output)},ensure_ascii=False),flush=True)


if __name__ == '__main__': main()
