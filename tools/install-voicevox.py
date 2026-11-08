"""Validate the complete generated voice bank, preserve v1.6 sources, and install.
Follow with node tools/build-sprites.mjs to update the distributable HTML.
"""
from pathlib import Path
import array
import hashlib
import json
import shutil
import wave

ROOT = Path(__file__).resolve().parent.parent
VOICE = ROOT / 'assets/voices'
STAGE = VOICE / 'generated-v1.7'
BACKUP = VOICE / 'backup-v1.6'
names = ['kagura','volt','freya','titan','ayame','celine']
manifest = json.loads((STAGE/'manifest.json').read_text(encoding='utf-8'))
old = json.loads((VOICE/'manifest.json').read_text(encoding='utf-8'))
report = json.loads((STAGE/'audio-report.json').read_text(encoding='utf-8'))
assert list(manifest['profiles']) == names
expected = {f'{id}-{event}' for id,p in old['profiles'].items() for event in p['lines']}
actual = {f'{id}-{event}' for id,p in manifest['profiles'].items() for event in p['lines']}
assert expected <= actual and len(actual)==126
assert len(report['clips'])==126 and {c['clip'] for c in report['clips']}==actual
for clip in report['clips']:
    file = STAGE/(clip['clip']+'.wav')
    assert hashlib.sha256(file.read_bytes()).hexdigest()==clip['sha256']
    with wave.open(str(file),'rb') as f:
        assert (f.getnchannels(),f.getsampwidth(),f.getframerate()) == (1,2,24000)
        samples = array.array('h',f.readframes(f.getnframes()))
        assert .08 < len(samples)/24000 < 3.5
        assert 200 < max(map(abs,samples)) <= 29200
if not BACKUP.exists():
    assert old['version']=='1.6.0', 'Refuse to label other versions as the v1.6 backup'
    BACKUP.mkdir()
    for key in sorted(expected): shutil.copy2(VOICE/(key+'.wav'), BACKUP/(key+'.wav'))
    for file in ['manifest.json','audio-report.json']: shutil.copy2(VOICE/file,BACKUP/file)
# All files validated before modifying the active bank. Restore the original bank on copy failure.
rollback = {f: (VOICE/f).read_bytes() if (VOICE/f).exists() else None for f in [*(k+'.wav' for k in sorted(actual)),'manifest.json','audio-report.json']}
try:
    for file in rollback: shutil.copy2(STAGE/file,VOICE/file)
except Exception:
    for file,data in rollback.items():
        if data is not None: (VOICE/file).write_bytes(data)
        elif (VOICE/file).exists(): (VOICE/file).unlink()
    raise
# Keep the earlier comparison page's SAPI side pointing at the original files.
page = VOICE/'audition-local/index.html'
if page.exists():
    content=page.read_text(encoding='utf-8')
    for event in ['select','sp1','hurt0','super']:
        content=content.replace(f'src="../freya-{event}.wav"',f'src="../backup-v1.5/freya-{event}.wav"')
    content=content.replace('現在の音声（Windows SAPI）','旧版の音声（Windows SAPI）')
    content=content.replace('ゲーム本体への適用前の試作です。','初回の試作記録です。ゲーム本体は全6人のVOICEVOX版へ更新済みです。')
    page.write_text(content,encoding='utf-8')
print('Installed 126 validated VOICEVOX clips; preceding voice bank retained in assets/voices/backup-v1.6.')
