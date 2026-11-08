import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'ai_studio_code.html');
const characters = ['kagura', 'volt', 'freya', 'titan', 'ayame', 'celine'];
const ids = characters.flatMap(id => [id, id + '-motion', id + '-throw']);
const sources = Object.fromEntries(ids.map(id => [id,
  'data:image/png;base64,' + fs.readFileSync(path.join(root, 'assets', 'sprites', id + '.png')).toString('base64')]));
const stageIds = ['crimson','cyber','crystal','harbor'];
const stageHorizons = [660/822,635/822,636/821,604/821];
const stages = stageIds.map((id,i)=>({id,horizon:stageHorizons[i],src:'data:image/png;base64,'+
  fs.readFileSync(path.join(root,'assets/stages',id+'.png')).toString('base64')}));
const voiceProfiles=JSON.parse(fs.readFileSync(path.join(root,'assets/voices/manifest.json'),'utf8')).profiles;
const voices=Object.fromEntries(Object.entries(voiceProfiles).flatMap(([id,profile])=>Object.keys(profile.lines).map(event=>{
  const key=id+'-'+event;
  return [key,'data:audio/wav;base64,'+fs.readFileSync(path.join(root,'assets/voices',key+'.wav')).toString('base64')];
})));
const begin = '// SPRITE_ASSETS_BEGIN';
const end = '// SPRITE_ASSETS_END';
const code = begin + '\nconst SPRITE_SOURCES = ' + JSON.stringify(sources, null, 2) + ';\n' +
  'const STAGE_SOURCES = '+JSON.stringify(stages)+';\n'+
  'const VOICE_SOURCES = '+JSON.stringify(voices)+';\n'+
  'const VOICE_PROFILES = '+JSON.stringify(voiceProfiles)+';\n'+
  fs.readFileSync(path.join(root, 'assets/sprites/throws.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(root, 'assets/sprites/renderer.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(root, 'assets/stages/renderer.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(root, 'assets/voices/engine.js'), 'utf8') + '\n' + end;
let html = fs.readFileSync(file, 'utf8');
if (html.includes(begin)) {
  html = html.slice(0, html.indexOf(begin)) + code + html.slice(html.indexOf(end) + end.length);
} else {
  const marker = '// 1. WEB AUDIO API SYNTHESIZER';
  const index = html.lastIndexOf('// ============================================================================', html.indexOf(marker));
  if (index < 0) throw new Error('Sprite insertion anchor missing');
  html = html.slice(0, index) + code + '\n\n' + html.slice(index);
}
const beltBegin = '// BELT_ENGINE_BEGIN', beltEnd = '// BELT_ENGINE_END';
const audioBegin='// AUDIO_ENGINE_BEGIN',audioEnd='// AUDIO_ENGINE_END';
const audioCode=audioBegin+'\n'+fs.readFileSync(path.join(root,'assets/audio/engine.js'),'utf8')+'\n'+audioEnd;
if(html.includes(audioBegin))html=html.slice(0,html.indexOf(audioBegin))+audioCode+html.slice(html.indexOf(audioEnd)+audioEnd.length);
else {const start=html.indexOf('class SoundEngine {'),end=html.indexOf('const sound = new SoundEngine();',start)+'const sound = new SoundEngine();'.length;if(start<0||end<start)throw Error('Audio insertion anchor missing');html=html.slice(0,start)+audioCode+html.slice(end);}
const beltCode = beltBegin+'\n'+fs.readFileSync(path.join(root,'assets/belt/engine.js'),'utf8')+'\n'+beltEnd;
if(html.includes(beltBegin)) html=html.slice(0,html.indexOf(beltBegin))+beltCode+html.slice(html.indexOf(beltEnd)+beltEnd.length);
else html=html.replace('const game = new Game();',()=>beltCode+'\n\nconst game = new Game();\ngame.scene = \'HUB\';');
fs.writeFileSync(file, html);
console.log('Embedded '+ids.length+' sprite atlases, '+stages.length+' backgrounds, '+Object.keys(voices).length+' voice clips: '+fs.statSync(file).size+' bytes');
