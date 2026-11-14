const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe',args:['--mute-audio']});try{
 const p=await b.newPage();await p.addInitScript(()=>window.requestAnimationFrame=()=>0);await p.goto(require('url').pathToFileURL(path.resolve('ai_studio_code.html')).href);
 const result=await p.evaluate(async()=>{
  const rate=24000,ctx=new OfflineAudioContext(2,rate*6,rate),e=new SoundEngine();e.attach(ctx,false);
  ['punch0','punch0','heavy0','heavy0'].forEach((key,i)=>{e.sample(key,.1+i*1.4,1,1,0,null,e.seGain,'effect');if(i%2)e.sample(i===1?'impactBody':'impactCrush',.1+i*1.4,.85,1,0,null,e.seGain,'effect');});
  const b=await ctx.startRendering(),d=b.getChannelData(0);const metrics=[];
  for(let i=0;i<4;i++){let low=0,sum=0,peak=0;for(let j=Math.floor((.1+i*1.4)*rate);j<Math.floor((1.1+i*1.4)*rate);j++){low+=.045*(d[j]-low);sum+=low*low;peak=Math.max(peak,Math.abs(d[j]));}metrics.push({lowRms:Math.sqrt(sum/rate),peak});}
  const bytes=new Uint8Array(44+d.length*2),v=new DataView(bytes.buffer),str=(o,s)=>{for(let i=0;i<s.length;i++)bytes[o+i]=s.charCodeAt(i);};str(0,'RIFF');v.setUint32(4,36+d.length*2,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,d.length*2,true);d.forEach((x,i)=>v.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,x))*32767),true));let bin='';for(let i=0;i<bytes.length;i+=16384)bin+=String.fromCharCode(...bytes.subarray(i,i+16384));return {metrics,wav:btoa(bin)};
 });
 console.log(result.metrics);assert(result.metrics[1].lowRms>result.metrics[0].lowRms);assert(result.metrics[3].lowRms>result.metrics[2].lowRms);assert(result.metrics.every(m=>m.peak<.99));
 // v3.6.1 [AUDIO-135]: the weight layer must add low end for every hit variant and playback pitch the game uses
 // (playHit picks variant 0-2 and a rate of 0.96-1.05). v3.5.0 / v3.6.0 lost up to 18 % for some pairs because the
 // body frequency sat inside the punch's own band and the two cancelled.
 const robust=await p.evaluate(async()=>{
  const rate=24000,low=async(keys)=>{const ctx=new OfflineAudioContext(2,rate*2,rate),e=new SoundEngine();e.attach(ctx,false);for(const [key,vol,r] of keys)e.sample(key,.1,vol,r,0,null,e.seGain,'effect');
   const d=(await ctx.startRendering()).getChannelData(0);let l=0,sum=0;for(let j=Math.floor(.1*rate);j<Math.floor(1.1*rate);j++){l+=.045*(d[j]-l);sum+=l*l;}return Math.sqrt(sum/rate);};
  const out=[];for(const [base,layer,vol,layerVol] of [['punch','impactBody',1,.8],['heavy','impactCrush',1.08,.95]])for(let v=0;v<3;v++)for(const r of [.96,1.005,1.05])
   out.push({key:base+v,rate:r,ratio:(await low([[layer,layerVol,1],[base+v,vol,r]]))/(await low([[base+v,vol,r]]))});
  return out;});
 result.weightGain={min:Math.min(...robust.map(x=>x.ratio)),cases:robust};console.log('weight layer gain (low band), min',result.weightGain.min.toFixed(3));
 for(const x of robust)assert(x.ratio>1.08,'weight layer must add low end for '+x.key+' at rate '+x.rate+': '+x.ratio.toFixed(3));
 await p.locator('#gameCanvas').click({position:{x:50,y:50}});
 const live=await p.evaluate(async()=>{sound.init();await fighterVoice.ready;sound.stopBGM();fighterVoice.stopAll();fighterVoice.debug=true;const sleep=ms=>new Promise(r=>setTimeout(r,ms));const a=sound.ctx.createAnalyser();a.fftSize=2048;fighterVoice.gain.connect(a);const signal=()=>{const d=new Float32Array(2048);a.getFloatTimeDomainData(d);return Math.max(...d.map(Math.abs));};const clips=[];
  for(const key of ['voss-intro','voss-defeat',...CHARACTERS.map(c=>c.id+'-finish')]){fighterVoice.stopAll();const pos=key.indexOf('-');const accepted=fighterVoice.play(key.slice(0,pos),key.slice(pos+1),0,150);await sleep(180);clips.push({key,accepted,active:fighterVoice.channels.get(0)?.key,signal:signal()});}
  fighterVoice.volume=0;fighterVoice.updateVolume();const zero=fighterVoice.play('voss','intro',0,150);fighterVoice.volume=.85;sound.muted=true;sound.updateVol();const muted=fighterVoice.play('voss','intro',0,150);sound.muted=false;sound.seVol=0;sound.updateVol();const se=sound.ctx.createAnalyser();se.fftSize=2048;sound.seGain.connect(se);await sleep(200);sound.playHit('heavy');await sleep(80);const d=new Float32Array(2048);se.getFloatTimeDomainData(d);const silentSe=Math.max(...d.map(Math.abs));fighterVoice.stopAll();return {clips,zero,muted,silentSe};});
 assert(live.clips.every(x=>x.accepted&&x.active===x.key&&x.signal>.001));assert(!live.zero&&!live.muted);assert(live.silentSe<.001);
 const out='verification/boss-v350';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/impact-before-after.wav',Buffer.from(result.wav,'base64'));delete result.wav;fs.writeFileSync(out+'/audio-report.json',JSON.stringify({...result,live},null,2));console.log({...result,live});
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
