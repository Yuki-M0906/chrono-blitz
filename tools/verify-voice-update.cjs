// Verify embedded voice bank, speaker credits, and studio-mastered v2.4 voice upgrades.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),voice=path.join(root,'assets/voices');
const html=fs.readFileSync(path.join(root,'ai_studio_code.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(voice,'manifest.json'),'utf8'));
assert.match(manifest.version,/^\d+\.\d+\.\d+$/); // was pinned to 1.7.0; the manifest now carries the game version
const sources=require('./packs.cjs').readPacks().assets.voices; // v2.6.0: voices are in data/voices.js
const profiles=JSON.parse(html.match(/const VOICE_PROFILES = (\{[^\n]+\});/)[1]);
assert.deepEqual(profiles,manifest.profiles);
// v3.5.0 / v3.6.0 added cinematic lines: one 'finish' per fighter, intro / defeat per boss (voss, maw).
const fighters=Object.entries(profiles).filter(([,p])=>Object.keys(p.lines).length>2),bosses=Object.entries(profiles).filter(([,p])=>Object.keys(p.lines).length===2);
const total=Object.values(profiles).reduce((n,p)=>n+Object.keys(p.lines).length,0);
assert.equal(fighters.length,6);assert.deepEqual(bosses.map(([id])=>id),['voss','maw']);
assert.equal(Object.keys(sources).length,total);
const names=new Set();let added=0,reworked=0,remastered=0,cinematic=0;
for(const [id,p] of Object.entries(profiles)) {
  const boss=Object.keys(p.lines).length===2;
  if(boss)assert.deepEqual(Object.keys(p.lines),['intro','defeat']);else{names.add(p.voice);assert.equal(Object.keys(p.lines).length,22);assert.ok('finish' in p.lines);}
  assert.ok(html.includes(p.credit),'Voice credit must be in the page');
  for(const event of Object.keys(p.lines)) {
    const name=id+'-'+event+'.wav';
    const active=fs.readFileSync(path.join(voice,name));
    const baseline16=path.join(voice,'backup-v1.6',name);
    const baseline17=path.join(voice,'backup-v1.7',name);
    const embedded=Buffer.from(sources[id+'-'+event].split(',')[1],'base64');
    assert.deepEqual(embedded,active,'Embedded clip differs from active source');
    if(boss||event==='finish'){cinematic++;continue;} // no v1.6 / v1.7 baseline exists for these
    if(fs.existsSync(baseline17)) {
      assert.notDeepEqual(active,fs.readFileSync(baseline17),'Clip was not remastered from v1.7');
      remastered++;
    }
    if(['grabbed','throw_release','thrown','throw_impact'].includes(event)) {assert.ok(!fs.existsSync(baseline16));added++;}
    else {assert.notDeepEqual(active,fs.readFileSync(baseline16));reworked++;}
  }
}
assert.equal(names.size,6);
assert.equal(added,24);assert.equal(reworked,102);assert.equal(cinematic,total-126);
if(fs.existsSync(path.join(voice,'backup-v1.7'))) assert.equal(remastered,126);
const report={version:manifest.version,clipsEmbedded:total,cinematicLines:cinematic,newThrowReactions:added,reworkedVoices:reworked,remasteredFromV17:remastered,distinctVoices:6};
fs.writeFileSync(path.join(root,'verification/voice-update.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
