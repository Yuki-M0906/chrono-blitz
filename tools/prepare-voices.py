"""Trim SAPI padding, normalize peaks and fade clip edges. No network or dependencies."""
from pathlib import Path
import array, json, sys, wave
root = Path(__file__).resolve().parent.parent / 'assets' / 'voices'
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
if 'Windows SAPI' not in manifest.get('engine', ''):
    raise SystemExit('Legacy SAPI preprocessing is disabled for VOICEVOX audio; use generate-voicevox.py.')
report = []
for name, profile in manifest['profiles'].items():
    for event in profile['lines']:
        path = root / f'{name}-{event}.wav'
        with wave.open(str(path), 'rb') as source:
            rate = source.getframerate()
            assert source.getnchannels() == 1 and source.getsampwidth() == 2
            samples = array.array('h', source.readframes(source.getnframes()))
        if sys.byteorder != 'little': samples.byteswap()
        peak = max(abs(v) for v in samples)
        assert peak > 200, f'Silent clip: {path.name}'
        active = [i for i, v in enumerate(samples) if abs(v) > max(100, peak * 0.012)]
        samples = samples[max(0, active[0]-int(rate*.018)):min(len(samples), active[-1]+int(rate*.055))]
        gain = min(4.0, 27800 / peak)
        fade = int(rate*.004)
        for i, value in enumerate(samples):
            envelope = min(1, i/fade, (len(samples)-1-i)/fade)
            samples[i] = int(value * gain * max(0,envelope))
        if sys.byteorder != 'little': samples.byteswap()
        with wave.open(str(path), 'wb') as target:
            target.setparams((1,2,rate,0,'NONE','not compressed')); target.writeframes(samples.tobytes())
        report.append({'clip': path.stem, 'seconds': round(len(samples)/rate,3), 'bytes': path.stat().st_size, 'peakBefore': peak})
(root/'audio-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Prepared {len(report)} non-silent clips; {sum(r["bytes"] for r in report):,} bytes')
