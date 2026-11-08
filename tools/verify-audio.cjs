const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/audio');fs.mkdirSync(out,{recursive:true});let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe',args:['--mute-audio']});
 const context=await browser.newContext();await context.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,'ai_studio_code.html')).href);
 const tracks=[];
 for(let id=0;id<8;id++) {
  const result=await page.evaluate(async id=>{
   const cfg=ARCADE_TRACKS[id],seconds=32*240/cfg.bpm,rate=24000,offline=new OfflineAudioContext(2,Math.ceil((seconds+1.3)*rate),rate),engine=new SoundEngine();engine.attach(offline,false);
   for(let step=0;step<512;step++)engine.tick(id,step,.05+step*60/cfg.bpm/4);
   const buffer=await offline.startRendering(),l=buffer.getChannelData(0),r=buffer.getChannelData(1);let peak=0,sum=0,difference=0,invalid=0;
   const blocks=[];
   for(let i=0;i<l.length;i++){peak=Math.max(peak,Math.abs(l[i]),Math.abs(r[i]));sum+=l[i]*l[i]+r[i]*r[i];difference+=(l[i]-r[i])**2;if(!Number.isFinite(l[i]+r[i]))invalid++;}
   for(let bar=0;bar<32;bar++){const start=Math.floor(bar*240/cfg.bpm*rate),end=Math.floor((bar+1)*240/cfg.bpm*rate);let energy=0;for(let i=start;i<end;i++)energy+=l[i]**2+r[i]**2;blocks.push(Math.sqrt(energy/(2*(end-start))));}
   // Preview the first chorus, not just the intro; no preview audio goes in the game file.
   let wav=null;
   if([0,5,6].includes(id)){
    const start=Math.floor(4*240/cfg.bpm*rate),n=18*rate,bytes=new Uint8Array(44+n*4),v=new DataView(bytes.buffer),str=(offset,s)=>{for(let i=0;i<s.length;i++)bytes[offset+i]=s.charCodeAt(i);};
    str(0,'RIFF');v.setUint32(4,36+n*4,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,rate,true);v.setUint32(28,rate*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,n*4,true);
    for(let i=0;i<n;i++){v.setInt16(44+i*4,Math.round(Math.max(-1,Math.min(1,l[start+i]))*32767),true);v.setInt16(46+i*4,Math.round(Math.max(-1,Math.min(1,r[start+i]))*32767),true);}
    let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));wav=btoa(binary);
   }
   return {id,name:cfg.name,bpm:cfg.bpm,bars:32,seconds,peak,rms:Math.sqrt(sum/(l.length*2)),stereoDifference:Math.sqrt(difference/l.length),invalid,barRms:blocks,events:engine.stats.started,ended:engine.stats.ended,score:JSON.stringify(Array.from({length:512},(_,s)=>engine.score(id,s))),wav};
  },id);
  if(result.wav){const file=['menu-preview.wav',null,null,null,null,'black-vein-preview.wav','boss-preview.wav'][id];fs.writeFileSync(path.join(out,file),Buffer.from(result.wav,'base64'));}delete result.wav;
  result.scoreHash=crypto.createHash('sha256').update(result.score).digest('hex');delete result.score;
  tracks.push(result);console.log(JSON.stringify({track:result.name,peak:result.peak,rms:result.rms,events:result.events}));
  assert.equal(result.invalid,0);assert.ok(result.peak<.99&&result.peak>.05,'Music peak '+id);assert.ok(result.rms>.008&&result.rms<.24,'Music RMS '+id);assert.ok(result.stereoDifference>.001);assert.ok(result.barRms.every(v=>v>.004),'Silent arrangement bar');assert.equal(result.events,result.ended,'Unreleased audio voices');
 }
 assert.equal(new Set(tracks.map(t=>t.scoreHash)).size,8);
 const effects=await page.evaluate(async()=>{
  const offline=new OfflineAudioContext(2,24000*15,24000),e=new SoundEngine();e.attach(offline,false);
  const keys=['punch0','heavy0','slash0','metal0','wood0','swingHeavy','catch','landing','energy'];
  keys.forEach((key,i)=>e.sample(key,.1+i*1.5,1,1,0,null,e.seGain,'effect'));
  const buffer=await offline.startRendering(),data=buffer.getChannelData(0),windows=keys.map((key,i)=>{const start=Math.floor((.1+i*1.5)*24000),end=start+24000;let sum=0,peak=0;for(let j=start;j<end;j++){sum+=data[j]**2;peak=Math.max(peak,Math.abs(data[j]));}return {key,rms:Math.sqrt(sum/24000),peak};});
  return {bank:e.bank.size,windows,started:e.stats.started,ended:e.stats.ended};
 });
 assert.equal(effects.bank,35);assert.equal(effects.started,effects.ended);for(const w of effects.windows)assert.ok(w.rms>.004&&w.peak<.99,w.key);
 await page.locator('#gameCanvas').click({position:{x:50,y:50}});
 const live=await page.evaluate(async()=>{
  await fighterVoice.ready;fighterVoice.stopAll();sound.stopBGM();const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const se=sound.ctx.createAnalyser(),music=sound.ctx.createAnalyser();se.fftSize=music.fftSize=2048;sound.seGain.connect(se);sound.bgmGain.connect(music);
  const signal=a=>{const d=new Float32Array(2048);a.getFloatTimeDomainData(d);return Math.max(...d.map(Math.abs));};
  sound.bgmVol=0;sound.seVol=.85;sound.updateVol();await sleep(260);sound.playGrapple('impact');await sleep(70);const landingWithBgmZero=signal(se);
  sound.bgmVol=.65;sound.seVol=0;sound.updateVol();sound.playBGM(5);await sleep(400);const musicWithSeZero=signal(music);
  const baselineGain=sound.bgmGain.gain.value;fighterVoice.play('freya','select',0,60);await sleep(150);const duckGain=sound.bgmGain.gain.value;fighterVoice.stopAll();await sleep(700);const recoveredGain=sound.bgmGain.gain.value;
  sound.seVol=.85;sound.updateVol();for(let i=0;i<80;i++){sound.playHit(i%2?'heavy':'slash');await sleep(23);}
  sound.playBGM(6);await sleep(120);sound.playBGM(7);await sleep(400);const buses=sound.musicBuses.size,track=sound.currentTrack;
  sound.nextStepTime=sound.ctx.currentTime-100;const step=sound.step;sound.schedule();const catchup=(sound.step-step+512)%512;
  sound.muted=true;sound.updateVol();await sleep(300);const muteMusic=signal(music),muteEffects=signal(se);sound.playSuper();await sleep(120);const afterMutedSuper=signal(se);
  sound.muted=false;sound.updateVol();sound.stopBGM();await sleep(1500);
  return {landingWithBgmZero,musicWithSeZero,baselineGain,duckGain,recoveredGain,buses,track,catchup,muteMusic,muteEffects,afterMutedSuper,activeAfterStop:sound.active.size,busesAfterStop:sound.musicBuses.size,stats:sound.stats};
 });
 assert.ok(live.landingWithBgmZero>.001);assert.ok(live.musicWithSeZero>.001);assert.ok(live.duckGain<live.baselineGain*.65);assert.ok(live.recoveredGain>live.baselineGain*.94);assert.ok(live.buses<=2);assert.equal(live.track,7);assert.ok(live.catchup<=2);assert.ok(live.muteMusic<.001&&live.muteEffects<.001&&live.afterMutedSuper<.001);assert.equal(live.activeAfterStop,0);assert.equal(live.busesAfterStop,0);
 const routing=await page.evaluate(()=>{const calls=[];sound.playBGM=id=>calls.push(id);sound.playCue=()=>{};game.startStreet(0);const street=calls.at(-1);game.street.area=4;game.street.wave=0;game.street.spawnWave();const boss=calls.at(-1);game.street.finish(true);const clear=calls.at(-1);game.toResult();const versusWin=calls.at(-1);return {street,boss,clear,versusWin};});
 assert.deepEqual(routing,{street:5,boss:6,clear:7,versusWin:7});assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({tracks,effects,live,routing,browserErrors:errors,listeningReview:'Rendered signal, arrangement and control checks; subjective listening not claimed.'},null,2));console.log(JSON.stringify({effects,live,routing,errors},null,2));await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
