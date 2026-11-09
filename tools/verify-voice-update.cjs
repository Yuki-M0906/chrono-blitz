// Verify embedded voice bank, speaker credits, and studio-mastered v2.4 voice upgrades.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),voice=path.join(root,'assets/voices');
const html=fs.readFileSync(path.join(root,'ai_studio_code.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(voice,'manifest.json'),'utf8'));
assert.equal(manifest.version,'1.7.0');
const sources=require('./packs.cjs').readPacks().assets.voices; // v2.6.0: voices are in data/voices.js
const profiles=JSON.parse(html.match(/const VOICE_PROFILES = (\{[^\n]+\});/)[1]);
assert.deepEqual(profiles,manifest.profiles);
assert.equal(Object.keys(sources).length,126);
const names=new Set();let added=0,reworked=0,remastered=0;
for(const [id,p] of Object.entries(profiles)) {
  names.add(p.voice);assert.equal(Object.keys(p.lines).length,21);
  assert.ok(html.includes(p.credit),'Voice credit must be in the page');
  for(const event of Object.keys(p.lines)) {
    const name=id+'-'+event+'.wav';
    const active=fs.readFileSync(path.join(voice,name));
    const baseline16=path.join(voice,'backup-v1.6',name);
    const baseline17=path.join(voice,'backup-v1.7',name);
    const embedded=Buffer.from(sources[id+'-'+event].split(',')[1],'base64');
    assert.deepEqual(embedded,active,'Embedded clip differs from active source');
    if(fs.existsSync(baseline17)) {
      assert.notDeepEqual(active,fs.readFileSync(baseline17),'Clip was not remastered from v1.7');
      remastered++;
    }
    if(['grabbed','throw_release','thrown','throw_impact'].includes(event)) {assert.ok(!fs.existsSync(baseline16));added++;}
    else {assert.notDeepEqual(active,fs.readFileSync(baseline16));reworked++;}
  }
}
assert.equal(names.size,6);
assert.equal(added,24);assert.equal(reworked,102);
if(fs.existsSync(path.join(voice,'backup-v1.7'))) assert.equal(remastered,126);
const report={version:'1.7.0-v2.4-mastered',clipsEmbedded:126,newThrowReactions:added,reworkedVoices:reworked,remasteredFromV17:remastered,distinctVoices:6};
fs.writeFileSync(path.join(root,'verification/voice-update.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
