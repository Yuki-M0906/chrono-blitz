// Verify v1.7's embedded voice bank and throw reactions.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),voice=path.join(root,'assets/voices');
const html=fs.readFileSync(path.join(root,'ai_studio_code.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(voice,'manifest.json'),'utf8'));
assert.equal(manifest.version,'1.7.0');
const sources=JSON.parse(html.match(/const VOICE_SOURCES = (\{[^\n]+\});/)[1]);
const profiles=JSON.parse(html.match(/const VOICE_PROFILES = (\{[^\n]+\});/)[1]);
assert.deepEqual(profiles,manifest.profiles);
assert.equal(Object.keys(sources).length,126);
const names=new Set();let added=0,reworked=0,preserved=0;
for(const [id,p] of Object.entries(profiles)) {
  names.add(p.voice);assert.equal(Object.keys(p.lines).length,21);
  assert.ok(html.includes(p.credit),'Voice credit must be in the page');
  for(const event of Object.keys(p.lines)) {
    const name=id+'-'+event+'.wav';
    const active=fs.readFileSync(path.join(voice,name));
    const baseline=path.join(voice,'backup-v1.6',name);
    const embedded=Buffer.from(sources[id+'-'+event].split(',')[1],'base64');
    assert.deepEqual(embedded,active,'Embedded clip differs from active source');
    if(['grabbed','throw_release','thrown','throw_impact'].includes(event)) {assert.ok(!fs.existsSync(baseline));added++;}
    else if(event==='throw') {assert.notDeepEqual(active,fs.readFileSync(baseline));reworked++;}
    else {assert.deepEqual(active,fs.readFileSync(baseline),'Unrelated voice changed');preserved++;}
  }
}
assert.equal(names.size,6);
assert.equal(added,24);assert.equal(reworked,6);assert.equal(preserved,96);
const report={version:'1.7.0',clipsEmbedded:126,newThrowReactions:added,reworkedCaptureVoices:reworked,unchangedOtherVoices:preserved,distinctVoices:6};
fs.writeFileSync(path.join(root,'verification/voice-update.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
