"""Offline v3.5 dramatic cues; uses the six previously consented VOICEVOX voices only."""
import importlib.util,json,math,hashlib,array
from dataclasses import asdict
from pathlib import Path
spec=importlib.util.spec_from_file_location('acting',Path(__file__).with_name('generate-voicevox.py'))
v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
from voicevox_core.blocking import Onnxruntime,OpenJtalk,Synthesizer,VoiceModelFile
config=json.loads((v.VOICES/'voicevox-config.json').read_text(encoding='utf-8'))
lines=[('maw','intro','titan','炉の底で、灰になれ！','select'),('maw','defeat','titan','ぐおおおおおっ！','ko')]
out=v.VOICES/'cinematic-v360';out.mkdir(exist_ok=True)
syn=Synthesizer(Onnxruntime.load_once(filename=str(next((v.CORE/'onnxruntime').rglob('voicevox_onnxruntime.dll')))),OpenJtalk(str(v.CORE/'dict/open_jtalk_dic_utf_8-1.11')),acceleration_mode='CPU',cpu_num_threads=4)
for n in sorted({n for p in config['profiles'].values() for n in p['models']}):
 with VoiceModelFile.open(str(v.CORE/f'models/vvms/{n}.vvm')) as model:syn.load_voice_model(model)
report=[];preview=array.array('h');manifest=json.loads((v.VOICES/'manifest.json').read_text(encoding='utf-8'))
manifest['profiles']['maw']={**config['profiles']['titan'],'credit':'VOICEVOX:麒ヶ島宗麟','lines':{}}
for id,event,actor,text,delivery in lines:
 p=config['profiles'][actor];style=p['styles']['ko' if delivery=='ko' else 'win' if delivery=='win' else 'intro']
 q=syn.create_audio_query(text,style);q.speed_scale=.82 if id=='maw' else p['speed'];q.pitch_scale=-.14 if id=='maw' else p['pitch'];q.output_sampling_rate=v.RATE;q.output_stereo=False;q.pre_phoneme_length=.03;q.post_phoneme_length=.12
 f0,count=v.sculpt_query(q,actor,delivery,id+'-'+event,0,1)
 if event=='defeat':
  voiced=[m for a in q.accent_phrases for m in a.moras if m.pitch>0]
  for i,m in enumerate(voiced):
   u=i/max(1,len(voiced)-1);m.pitch+=.22-.35*u;m.vowel_length=max(m.vowel_length,.14 if i==0 else .22)
 pcm=v.read_pcm(syn.synthesis(q,style));pcm=v.apply_short_kiai_psola(pcm,f0,delivery,count);pcm=v.master_voice(pcm,actor,delivery)
 key=id+'-'+event;v.save_pcm(out/(key+'.wav'),pcm)
 peak=max(map(abs,pcm));rms=math.sqrt(sum(x*x for x in pcm)/len(pcm));assert peak>1000 and rms>200
 entry={'id':key,'text':text,'voice':p['voice'],'style':style,'seconds':round(len(pcm)/v.RATE,3),'peak':peak,'rms':round(rms,2),'sha256':hashlib.sha256((out/(key+'.wav')).read_bytes()).hexdigest(),'query':asdict(q)};report.append(entry)
 manifest['profiles'][id]['lines'][event]=text
 preview.extend(pcm);preview.extend([0]*7200)
 print(key,entry['seconds'],flush=True)
for entry in report:
 key=entry['id'];(v.VOICES/(key+'.wav')).write_bytes((out/(key+'.wav')).read_bytes())
manifest['version']='3.6.0';(v.VOICES/'manifest.json').write_bytes((json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode())
(out/'report.json').write_bytes((json.dumps(report,ensure_ascii=False,indent=2)+'\n').encode());v.save_pcm(out/'preview.wav',preview)
