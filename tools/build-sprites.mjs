// Builds the distributable: ai_studio_code.html (code only) + data/*.js (asset packs as data URIs).
// v2.6.0: assets moved out of the HTML because the single file passed GitHub's 100 MB limit. Packs are plain
// scripts so the game still opens from file:// (fetch() and canvas pixel reads of separate PNG files would be
// blocked there). Run: node tools/build-sprites.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'ai_studio_code.html');
const dataDir = path.join(root, 'data');
const b64 = (...parts) => fs.readFileSync(path.join(root, ...parts)).toString('base64');
const characters = ['kagura', 'volt', 'freya', 'titan', 'ayame', 'celine'];
const stageIds = ['crimson','cyber','crystal','harbor'];
const stageHorizons = [660/822,635/822,636/821,604/821];
const voiceProfiles=JSON.parse(fs.readFileSync(path.join(root,'assets/voices/manifest.json'),'utf8')).profiles;
const artManifest=JSON.parse(fs.readFileSync(path.join(root,'assets/belt/art/manifest.json'),'utf8'));
const art = filter => Object.fromEntries(Object.entries(artManifest.assets).filter(([id]) => filter(id)).map(([id, entry]) => [id, {...entry,
  src: 'data:image/png;base64,' + b64('assets/belt/art', entry.file)}]));

// ---- Asset packs. Order matters: the game reads keys in insertion order. Each pack stays far below 50 MB.
const packs = [
  ...characters.map(id => ({name: 'sprites-' + id, kind: 'sprites', data: Object.fromEntries([id, id + '-motion', id + '-throw'].map(key =>
    [key, 'data:image/png;base64,' + b64('assets', 'sprites', key + '.png')]))})),
  {name: 'stages', kind: 'stages', data: stageIds.map((id, i) => ({id, horizon: stageHorizons[i], src: 'data:image/png;base64,' + b64('assets/stages', id + '.png')}))},
  {name: 'voices', kind: 'voices', data: Object.fromEntries(Object.entries(voiceProfiles).flatMap(([id, profile]) => Object.keys(profile.lines).map(event =>
    [id + '-' + event, 'data:audio/wav;base64,' + b64('assets/voices', id + '-' + event + '.wav')])))},
  {name: 'belt-backgrounds', kind: 'beltArt', data: art(id => id.startsWith('district-'))},
  {name: 'belt-actors', kind: 'beltArt', data: art(id => !id.startsWith('district-'))}
];
fs.mkdirSync(dataDir, {recursive: true});
let total = 0;
for (const pack of packs) {
  const json = JSON.stringify(pack.data);
  pack.bytes = json.length; total += json.length;
  // One call per file, JSON on a single line: tools/packs.cjs parses it without running it.
  const text = 'CB_ASSETS.add(' + JSON.stringify(pack.kind) + ',' + json + ',' + pack.bytes + ');\n';
  pack.hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 10);
  const target = path.join(dataDir, pack.name + '.js');
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== text) fs.writeFileSync(target, text);
}
for (const stale of fs.readdirSync(dataDir)) if (stale.endsWith('.js') && !packs.some(p => p.name + '.js' === stale)) fs.unlinkSync(path.join(dataDir, stale));

let html = fs.readFileSync(file, 'utf8');
// Markers count only as whole lines: the header comment may mention them in prose (it did in v2.2.0, and a plain
// indexOf() then wiped everything between the header and the real end marker).
const find = (text, marker) => { const m = text.match(new RegExp('^' + marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\r?$', 'm')); return m ? m.index : -1; };
const cut = (text, b, e, replacement) => { const i = find(text, b), j = find(text, e); if (i < 0 || j < i) throw new Error('Marker pair broken: ' + b); return text.slice(0, i) + replacement + text.slice(j + e.length); };

// ---- Loader block: loading overlay, CB_ASSETS registry and one script tag per pack (?v=hash busts stale caches,
// so a code-only update re-downloads nothing but the HTML).
const packsBegin = '<!-- DATA_PACKS_BEGIN -->', packsEnd = '<!-- DATA_PACKS_END -->';
const loader = packsBegin + `
<div id="cbLoading" style="position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#05070f;color:#cfe9f5;font:700 15px 'Segoe UI',Meiryo,sans-serif;letter-spacing:1px;text-align:center">
  <div>CHRONO BLITZ — LOADING <span id="cbLoadingPct">0%</span></div>
  <div style="width:min(420px,70vw);height:8px;border:1px solid #2b5566;border-radius:6px;overflow:hidden"><div id="cbLoadingBar" style="width:0;height:100%;background:#00f0ff"></div></div>
  <div id="cbLoadingNote" style="font-weight:400;font-size:12px;color:#7f9aaa;line-height:1.7">画像・音声データを読み込んでいます / Loading assets</div>
</div>
<script data-cb-loader>
// Asset registry filled by data/*.js. The main script reads CB_ASSETS.sprites / stages / voices / beltArt.
const CB_ASSETS = {
  sprites: {}, stages: [], voices: {}, beltArt: {}, total: ${total}, loaded: 0, failed: [],
  add(kind, data, bytes) {
    if (Array.isArray(this[kind])) this[kind].push(...data); else Object.assign(this[kind], data);
    this.loaded += bytes;
    const pct = Math.min(100, Math.round(this.loaded / this.total * 100));
    document.getElementById('cbLoadingPct').textContent = pct + '%';
    document.getElementById('cbLoadingBar').style.width = pct + '%';
  },
  fail(name) {
    this.failed.push(name);
    const note = document.getElementById('cbLoadingNote');
    note.style.color = '#ff8a7a';
    note.innerHTML = 'data/' + name + '.js を読み込めませんでした。ai_studio_code.html と同じ場所に data フォルダを置いてください。<br>Could not load data/' + name + '.js. Keep the data folder next to ai_studio_code.html.';
  }
};
document.addEventListener('DOMContentLoaded', () => { if (!CB_ASSETS.failed.length) document.getElementById('cbLoading').remove(); });
</script>
` + packs.map(p => `<script src="data/${p.name}.js?v=${p.hash}" onerror="CB_ASSETS.fail('${p.name}')"></script>`).join('\n') + '\n' + packsEnd;
if (find(html, packsBegin) >= 0) html = cut(html, packsBegin, packsEnd, loader);
else {
  const m = html.match(/^<script>\r?$/m);
  if (!m) throw new Error('Main script tag missing');
  html = html.slice(0, m.index) + loader + '\n\n' + html.slice(m.index);
}

const begin = '// SPRITE_ASSETS_BEGIN';
const end = '// SPRITE_ASSETS_END';
const code = begin + '\nconst SPRITE_SOURCES = CB_ASSETS.sprites;\n' +
  'const STAGE_SOURCES = CB_ASSETS.stages;\n'+
  'const VOICE_SOURCES = CB_ASSETS.voices;\n'+
  'const VOICE_PROFILES = '+JSON.stringify(voiceProfiles)+';\n'+
  fs.readFileSync(path.join(root, 'assets/sprites/throws.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(root, 'assets/sprites/renderer.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(root, 'assets/stages/renderer.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(root, 'assets/voices/engine.js'), 'utf8') + '\n' + end;
if (find(html, begin) >= 0) {
  html = cut(html, begin, end, code);
} else {
  const marker = '// 1. WEB AUDIO API SYNTHESIZER';
  const index = html.lastIndexOf('// ============================================================================', html.indexOf(marker));
  if (index < 0) throw new Error('Sprite insertion anchor missing');
  html = html.slice(0, index) + code + '\n\n' + html.slice(index);
}
const beltBegin = '// BELT_ENGINE_BEGIN', beltEnd = '// BELT_ENGINE_END';
const audioBegin='// AUDIO_ENGINE_BEGIN',audioEnd='// AUDIO_ENGINE_END';
const audioCode=audioBegin+'\n'+fs.readFileSync(path.join(root,'assets/audio/engine.js'),'utf8')+'\n'+audioEnd;
if(find(html,audioBegin)>=0)html=cut(html,audioBegin,audioEnd,audioCode);
else {const start=html.indexOf('class SoundEngine {'),end=html.indexOf('const sound = new SoundEngine();',start)+'const sound = new SoundEngine();'.length;if(start<0||end<start)throw Error('Audio insertion anchor missing');html=html.slice(0,start)+audioCode+html.slice(end);}
const beltCode = beltBegin+'\nconst BELT_ART_SOURCES = CB_ASSETS.beltArt;\n'+
  fs.readFileSync(path.join(root,'assets/belt/art.js'),'utf8')+'\n'+
  fs.readFileSync(path.join(root,'assets/belt/engine.js'),'utf8')+'\n'+beltEnd;
if(find(html,beltBegin)>=0) html=cut(html,beltBegin,beltEnd,beltCode);
else html=html.replace('const game = new Game();',()=>beltCode+'\n\nconst game = new Game();\ngame.scene = \'HUB\';');
fs.writeFileSync(file, html);
const sizes = packs.map(p => p.name + ' ' + (fs.statSync(path.join(dataDir, p.name + '.js')).size / 1048576).toFixed(1) + 'MB').join(', ');
console.log('HTML ' + fs.statSync(file).size + ' bytes. ' + packs.length + ' packs in data/: ' + sizes);
