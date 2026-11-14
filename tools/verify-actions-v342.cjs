const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('playwright');
const {PNG}=require('pngjs');
for(const id of ['kagura','volt','freya','titan','ayame','celine','fire']) {
 const png=PNG.sync.read(fs.readFileSync('assets/belt/art/actions-v342/'+id+'.png'));
 assert.equal(png.width,1536);assert.equal(png.height,1024);
 let clear=0;for(let i=3;i<png.data.length;i+=4)if(png.data[i]<24)clear++;
 assert(clear/(png.width*png.height)>.5,id+' transparent background');
}
(async()=>{
 const out=path.resolve('verification/actions-v342');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe',args:['--mute-audio']});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
  await page.goto(require('url').pathToFileURL(path.resolve('ai_studio_code.html')).href);
  await page.evaluate(async()=>{await Promise.all([FighterSprites.ready,BeltArt.ready]);});
  const result=await page.evaluate(async()=>{
   const checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n);};
   check(BeltArt.actionSheets.size===7,'7 action atlases decoded');check(!BeltArt.errors.length,'no atlas errors');
   sound.init=()=>{};sound.playBGM=()=>{};sound.announce=()=>{};fighterVoice.play=()=>false;
   const setup=(id=0)=>{input.keys={};input.just={};game.startStreet(id);const s=game.street;s.intro=0;s.enemies=[];s.props=[];s.items=[];s.player.x=400;s.player.y=540;s.player.invuln=0;return s;};
   const foe=(s,x,y,kind='punk')=>{const e=s.spawnEnemy(kind,x,y);e.hp=e.maxHp=3000;e.invuln=0;return e;};
   const calls=[];sound.playRising=n=>calls.push('r'+n);sound.playFlame=n=>calls.push('f'+n);
   for(let id=0;id<6;id++) {
    let s=setup(id),a=s.player,e=foe(s,450,540,'boss');e.pose('CHARGE');s.startRising();const start=calls.length;
    for(let i=0;i<18;i++)s.updateActor(a);
    check(calls.slice(start).join(',')==='r0,r1,r2','3 dedicated impact cues '+id);check(e.state==='HIT_AIR'&&s.combo===3,'3 hits and knockdown '+id);
    s=setup(id);a=s.player;e=foe(s,470,540,'boss');e.pose('CHARGE');a.pose('STREET_DASH');s.dashAttack();
    for(let i=0;i<20;i++)s.updateActor(a);
    check(e.burnTicks===72&&e.state==='HIT_AIR','fire downs armored boss '+id);
    check(3000-e.hp===Math.round(STREET.dash.damage*a.power),'dash hits only once '+id);
    for(let i=0;i<75;i++)s.updateActor(e);check(e.burnTicks===0,'fire expires '+id);
   }
   let s=setup(),a=s.player;s.startRising();let n=calls.length;for(let i=0;i<18;i++)s.updateActor(a);check(calls.length===n,'whiff has no impact cue');
   s=setup();a=s.player;let e=foe(s,477,590);e.pose('WINDUP');input.keys={KeyD:true};s.playerInput();check(s.grapple?.victim===e,'wide grab intercepts windup');
   for(const dir of [-1,1]) {
    s=setup();a=s.player;a.x=600;a.facing=dir;e=foe(s,600+dir*40,540);s.beginGrab(e);s.throwHeld(dir);
    for(let i=0;i<30;i++)s.updateGrab();const x=e.x,z=e.z;
    check(e.knockX===dir*18&&e.vz===6.5,'forward launch '+dir);
    const b=foe(s,x+dir*140,585),c=foe(s,x+dir*260,540);let peak=z;
    for(let i=0;i<45;i++){s.updateActor(e);s.updateActor(b);s.updateActor(c);peak=Math.max(peak,e.z);}
    check(b.hp===2936&&c.hp<3000,'multiple enemies swept '+dir);
    check(Math.abs(e.x-x)>250&&peak<100,'low long throw arc '+dir);
   }
   const canvas=document.createElement('canvas');canvas.width=400;canvas.height=400;
   const c=canvas.getContext('2d');s=setup();a=s.player;a.pose('SP_2');a.f=18;
   e=foe(s,450,540);e.pose('HIT_AIR');e.burnTicks=72;e.f=8;
   const before=JSON.stringify([a.f,a.z,e.f,e.z,e.burnTicks,s.tick]);
   const random=Math.random;Math.random=()=>{throw Error('render consumed RNG');};
   try {for(let i=0;i<4;i++){a.render(c);e.render(c);}} finally {Math.random=random;}
   check(before===JSON.stringify([a.f,a.z,e.f,e.z,e.burnTicks,s.tick]),'rising and burn rendering is pure');
   const offline=new OfflineAudioContext(2,24000*5,24000),audio=new SoundEngine();audio.attach(offline,false);
   const keys=['rising0','rising1','rising2','fireLaunch','fireHit'];
   keys.forEach((k,i)=>audio.sample(k,.1+i*.8,1,1,0,null,audio.seGain,'effect'));
   const buffer=await offline.startRendering(),data=buffer.getChannelData(0);
   const metrics=keys.map((k,i)=>{const b=audio.bank.get(k),d=b.getChannelData(0);let peak=0,sum=0;for(const v of d){check(Number.isFinite(v),'finite PCM');peak=Math.max(peak,Math.abs(v));sum+=v*v;}return {key:k,peak,rms:Math.sqrt(sum/d.length)};});
   for(const m of metrics)check(m.peak>.1&&m.peak<.95&&m.rms>.01,'audible bounded '+m.key);
   check(audio.stats.started===audio.stats.ended,'SE voices released');
   const bytes=new Uint8Array(44+data.length*2),v=new DataView(bytes.buffer),str=(o,s)=>{for(let i=0;i<s.length;i++)bytes[o+i]=s.charCodeAt(i);};
   str(0,'RIFF');v.setUint32(4,36+data.length*2,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,24000,true);v.setUint32(28,48000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,data.length*2,true);data.forEach((x,i)=>v.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,x))*32767),true));
   let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
   return {checks:checks.filter(x=>x!=='finite PCM'),metrics,wav:btoa(binary)};
  });
  fs.writeFileSync(path.join(out,'special-effects.wav'),Buffer.from(result.wav,'base64'));delete result.wav;
  await page.evaluate(()=>{
   const canvas=document.getElementById('gameCanvas');canvas.width=1440;canvas.height=960;const c=canvas.getContext('2d');c.fillStyle='#172433';c.fillRect(0,0,1440,960);
   for(let id=0;id<6;id++){game.startStreet(id);const s=game.street,a=s.player;a.x=120+id*240;a.y=270;a.z=0;a.pose('SP_2');a.f=18;a.render(c);c.fillStyle='white';c.font='18px sans-serif';c.fillText(a.data.id,a.x-35,305);a.y=570;a.pose('DASH_ATTACK');a.f=12;a.render(c);const e=s.spawnEnemy('punk',a.x,850);e.pose('HIT_AIR');e.f=id*2;e.burnTicks=72;e.render(c);}
  });
  await page.locator('#gameCanvas').screenshot({path:path.join(out,'actions-six-heroes.png')});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
