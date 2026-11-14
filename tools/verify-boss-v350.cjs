const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe',args:['--mute-audio']});try{
 const out=path.resolve('verification/boss-v350');fs.mkdirSync(out,{recursive:true});const p=await b.newPage({viewport:{width:1440,height:960}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>window.requestAnimationFrame=()=>0);await p.goto(require('url').pathToFileURL(path.resolve('ai_studio_code.html')).href);
 const report=await p.evaluate(async()=>{
  await Promise.all([FighterSprites.ready,BeltArt.ready]);const ctx=new OfflineAudioContext(1,24000,24000);await fighterVoice.preload(ctx);
  const checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n);};check(fighterVoice.buffers.size===136,'136 voices decode');check(!fighterVoice.errors.length,'voice decode has no errors');
  const cues=[];sound.init=()=>{};sound.playBGM=()=>{};sound.announce=()=>{};fighterVoice.play=(id,event)=>{cues.push(id+'-'+event);return true;};
  const setup=(id=0)=>{input.keys={};input.just={};game.startStreet(id);const s=game.street;s.intro=0;s.enemies=[];s.props=[];s.player.x=450;s.player.y=550;s.player.invuln=0;return s;};
  let s=setup();const kinds=Object.keys(STREET.enemies).filter(k=>k!=='boss');check(kinds.length===9,'9 regular enemy types');check(new Set(kinds.map(k=>STREET.enemies[k].char)).size===6,'all 6 heroes reused');
  for(const kind of kinds){const e=s.spawnEnemy(kind,600,550);check(e.streetPalette?.size===3&&e.label===STREET.enemies[kind].name,'palette and name '+kind);if(STREET.enemies[kind].role)check(e.hp===STREET.enemies[e.role].hp,'existing balance '+kind);}
  s=setup();s.area=4;s.wave=0;s.spawnWave();check(cues.at(-1)==='voss-intro','boss entrance cue');check(s.bossIntro>=Math.ceil(fighterVoice.buffers.get('voss-intro').duration*60),'intro holds entire line');
  for(let id=0;id<6;id++)for(const method of ['dash','throw','rising']){
   s=setup(id);s.area=4;const boss=s.spawnEnemy('boss',510,550);boss.hp=1;boss.invuln=0;
   const begin=cues.length;
   if(method==='throw'){s.beginGrab(boss);s.throwHeld(1);for(let i=0;i<30;i++)s.updateGrab();}
   else if(method==='rising'){s.startRising();for(let i=0;i<18;i++)s.updateActor(s.player);}
   else s.hurt(boss,500,1,true,'dash');
   check(s.finale?.phase==='slow','finale starts '+id+' '+method);const f=boss.f,timer=s.timer;
   for(let i=0;i<12;i++)s.update();check(boss.f===f+3,'quarter-speed '+id+' '+method);check(s.timer===timer,'timer frozen '+id+' '+method);
   game.paused=true;const frame=s.finale.frame;s.update();check(s.finale.frame===frame,'pause freezes finale');game.paused=false;
   for(let i=0;i<800&&!s.result;i++)s.update();check(s.result==='clear','finale reaches clear '+id+' '+method);
   const played=cues.slice(begin).filter(x=>x==='voss-defeat'||x.endsWith('-finish'));
   check(played.join(',')==='voss-defeat,'+s.player.data.id+'-finish','scream then unique hero line once '+id+' '+method);
   check(!cues.slice(begin).includes(s.player.data.id+'-win'),'no overlapping generic win');
  }
  const audio=new SoundEngine(),offline=new OfflineAudioContext(2,24000*3,24000);audio.attach(offline,false);
  audio.sample('punch0',.05,1,1,0,null,audio.seGain,'effect');audio.sample('impactBody',.05,.8,1,0,null,audio.seGain,'effect');audio.sample('heavy0',1.1,1,1,0,null,audio.seGain,'effect');audio.sample('impactCrush',1.1,.95,1,0,null,audio.seGain,'effect');
  const rendered=await offline.startRendering(),d=rendered.getChannelData(0);let peak=0,sum=0;for(const v of d){if(!Number.isFinite(v))throw Error('invalid PCM');peak=Math.max(peak,Math.abs(v));sum+=v*v;}check(peak<.99&&Math.sqrt(sum/d.length)>.02,'weight mix audible and not clipped');check(audio.stats.started===audio.stats.ended,'impact voices released');
  return {checks,peak,rms:Math.sqrt(sum/d.length),voiceDurations:Object.fromEntries([...fighterVoice.buffers].filter(([k])=>k.startsWith('voss-')||k.endsWith('-finish')).map(([k,v])=>[k,v.duration]))};
 });
 await p.evaluate(()=>{game.startStreet(0);const s=game.street;s.intro=0;s.props=[];s.enemies=[];s.area=4;s.wave=0;s.player.x=500;s.spawnWave();game.draw();});await p.locator('#gameCanvas').screenshot({path:path.join(out,'boss-entrance.png')});
 await p.evaluate(()=>{const s=game.street,b=s.enemies.find(e=>e.kind==='boss');s.bossIntro=0;b.x=650;b.y=550;b.invuln=0;s.hurt(b,5000,1,true,'dash');for(let i=0;i<24;i++)s.update();game.draw();});await p.locator('#gameCanvas').screenshot({path:path.join(out,'final-impact.png')});
 await p.evaluate(()=>{const s=game.street;for(let i=0;i<600&&s.finale?.phase!=='victory';i++)s.update();game.draw();});await p.locator('#gameCanvas').screenshot({path:path.join(out,'hero-finish.png')});
 await p.evaluate(()=>{game.startStreet(0);const s=game.street;s.enemies=[];const canvas=document.getElementById('gameCanvas'),c=canvas.getContext('2d');c.fillStyle='#142231';c.fillRect(0,0,1280,720);Object.keys(STREET.enemies).filter(k=>k!=='boss').forEach((kind,i)=>{const e=s.spawnEnemy(kind,130+(i%5)*250,300+Math.floor(i/5)*310);e.pose('IDLE');e.render(c);STREET.text(c,e.label,e.x,e.y+30,17,'#ffe1b0','center');});});await p.locator('#gameCanvas').screenshot({path:path.join(out,'enemy-roster.png')});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks.length,peak:report.peak,rms:report.rms,voiceDurations:report.voiceDurations,errors},null,2));
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
