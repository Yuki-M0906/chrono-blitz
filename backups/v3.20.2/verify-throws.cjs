const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe',args:['--mute-audio']});
 const context=await browser.newContext({viewport:{width:1280,height:800}});
 await context.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,'ai_studio_code.html')).href);
 const result=await page.evaluate(async()=>{
  await FighterSprites.ready;await StageArt.ready;
  const check=(ok,msg)=>{if(!ok)throw Error(msg);};
  check(FighterSprites.sheets.size===18 && !FighterSprites.errors.length,'18 sprite atlases');
  sound.init=()=>{};sound.playBGM=()=>{};sound.announce=()=>{};
  const calls=[];fighterVoice.play=(id,event,player,priority)=>{calls.push({id,event,player,priority});return true;};
  const setup=(a,b,owner=0)=>{
   game.mode=2;game.p1Char=owner?b:a;game.p2Char=owner?a:b;game.stageIdx=0;game.startMatch();
   game.bannerTimer=game.superFreeze=game.hitstop=0;game.paused=false;
   input.keys={};input.just={};calls.length=0;
   const atk=owner?game.f2:game.f1,def=owner?game.f1:game.f2;
   atk.x=owner?900:700;def.x=owner?830:770;atk.facing=owner?-1:1;def.facing=-atk.facing;
   return {atk,def};
  };
  const poses=Object.fromEntries(CHARACTERS.map(c=>[c.id,new Set()]));
  let cases=0;
  for(let a=0;a<6;a++)for(let b=0;b<6;b++)for(let owner=0;owner<2;owner++){
   const {atk,def}=setup(a,b,owner),hp=def.hp;
   atk.setState('THROW');let caught=false,released=false,landed=false,lowY=580;
   for(let t=0;t<150;t++){
    game.updateBattle();
    for(const f of [atk,def]){const p=ThrowMotion.sprite(f,f.state,f.f);if(p!==null)poses[f.data.id].add(p);}
    if(game.grapple){caught=true;check(def.hp===hp,'Damage before release');check(def.state==='GRABBED','Victim not held');}
    if(def.throwFlight){released=true;check(def.hp===hp-115,'Wrong throw damage');lowY=Math.min(lowY,def.y);}
    if(def.throwLanding&&def.state==='KNOCKDOWN')landed=true;
   }
   check(caught&&released&&landed&&lowY<460,'Missing throw phases '+a+'/'+b+'/'+owner);
   check(atk.state==='IDLE'&&def.state==='IDLE'&&def.grounded&&!game.grapple,'Throw softlock');
   for(const event of ['throw','grabbed','throw_release','thrown','throw_impact'])check(calls.filter(c=>c.event===event).length===1,'Voice milestone '+event);
   cases++;
  }
  for(const [id,frames] of Object.entries(poses))check(frames.size===24,'Missing throw poses '+id+': '+[...frames]);
  const gaia=[];
  for(const tech of [false,true]){const {atk,def}=setup(3,0),hp=def.hp;atk.setState('SP_3',tech);for(let t=0;t<150;t++)game.updateBattle();const damage=hp-def.hp;check(damage===Math.round(165*(tech?1.15:1)),'Gaia damage');check(def.state==='IDLE','Gaia recovery');gaia.push(damage);}
  for(const kind of ['far','air','invulnerable','down','wakeup']){
   const {atk,def}=setup(0,1),hp=def.hp;
   if(kind==='far')def.x=1150;if(kind==='air')def.y=350;if(kind==='invulnerable')def.invuln=60;
   if(kind==='down')def.setState('KNOCKDOWN');if(kind==='wakeup')def.setState('WAKEUP');
   calls.length=0;atk.setState('THROW');for(let t=0;t<24;t++)game.updateBattle();
   check(def.hp===hp&&!game.grapple,'Throw should miss '+kind);check(!calls.some(c=>c.event==='throw_release'||c.event==='throw'),'False throw voice '+kind);
  }
  for(const x of [100,1500]){
   const {atk,def}=setup(4,5);atk.x=x;def.x=x+(x<500?65:-65);atk.setState('THROW');
   for(let t=0;t<5;t++)game.updateBattle();check(game.grapple.dir===(x<500?1:-1),'Wall direction');
   for(let t=0;t<150;t++){game.updateBattle();check([atk,def].every(f=>Number.isFinite(f.x)&&f.x>=90&&f.x<=1510),'Out of stage');}
  }
  const {atk,def}=setup(0,5);atk.setState('THROW');for(let t=0;t<10;t++)game.updateBattle();
  const frozen=JSON.stringify([atk.x,atk.y,def.x,def.y,game.grapple.t]);
  game.paused=true;for(let t=0;t<10;t++)game.update();check(JSON.stringify([atk.x,atk.y,def.x,def.y,game.grapple.t])===frozen,'Pause grapple');
  game.paused=false;game.hitstop=4;for(let t=0;t<4;t++)game.updateBattle();check(JSON.stringify([atk.x,atk.y,def.x,def.y,game.grapple.t])===frozen,'Hitstop grapple');
  game.projs.push({owner:atk,x:def.x,y:def.y-70,vx:0,w:300,h:300,dmg:999,color:'#fff',style:'plasma',life:10});
  const hp=def.hp;for(let t=0;t<6;t++)game.updateBattle();check(def.hp===hp,'Projectile interrupted hold');
  game.toTitle();check(!game.grapple&&atk.state==='IDLE'&&def.state==='IDLE','Scene cancellation');
  const lethal=setup(0,1);lethal.def.hp=50;lethal.atk.setState('THROW');let airKO=false,groundKO=false;
  for(let t=0;t<120;t++){game.updateBattle();if(lethal.def.hp===0&&lethal.def.throwFlight){airKO=true;check(!game.roundOverTimer,'KO interrupted flight');}if(game.roundOverTimer){groundKO=true;check(lethal.def.grounded,'KO before landing');break;}}
  check(airKO&&groundKO,'Lethal throw completion');
  // Six snapshots of the real paired animation, composed from the rendered game canvas.
  const board=document.createElement('canvas');board.width=1280;board.height=1080;const c=board.getContext('2d');
  const demo=setup(3,5);demo.atk.setState('THROW');const times=[5,14,26,36,48,78];let slot=0;
  for(let t=1;t<=78;t++){game.updateBattle();if(t===times[slot]){game.shake=0;game.draw();const x=(slot%2)*640,y=Math.floor(slot/2)*360;c.drawImage(canvas,0,0,1280,720,x,y,640,360);c.fillStyle='#081224';c.fillRect(x,y,640,24);c.fillStyle='#fff';c.font='14px sans-serif';c.fillText(['GRAB','LIFT','OVERHEAD','RELEASE','FLIGHT','LAND'][slot],x+12,y+17);slot++;}}
  window.throwAudit=board.toDataURL();
  return {pairCases:cases,poses:Object.fromEntries(Object.entries(poses).map(([k,s])=>[k,s.size])),gaiaDamage:gaia,missCases:5,wallCases:2,pause:true,hitstop:true,projectileProtection:true,sceneCancellation:true,lethalLanding:true};
 });
 fs.writeFileSync(path.join(root,'verification/throw-sequence.png'),Buffer.from((await page.evaluate(()=>window.throwAudit)).split(',')[1],'base64'));
 const audioPage=await context.newPage();audioPage.on('pageerror',e=>errors.push(e.message));
 await audioPage.goto(pathToFileURL(path.join(root,'ai_studio_code.html')).href);
 await audioPage.locator('#gameCanvas').click({position:{x:50,y:50}});
 result.actualAudio=await audioPage.evaluate(async()=>{
  await fighterVoice.ready;fighterVoice.debug=true;sound.announce=()=>{};sound.playBGM=()=>{};
  const analyzer=sound.ctx.createAnalyser();analyzer.fftSize=2048;fighterVoice.gain.connect(analyzer);
  const outcomes=[];
  for(let id=0;id<6;id++) {
   game.mode=2;game.p1Char=id;game.p2Char=(id+1)%6;game.startMatch();fighterVoice.history=[];
   game.bannerTimer=game.hitstop=game.superFreeze=0;input.keys={};input.just={};
   game.f1.x=700;game.f2.x=770;game.f1.setState(id===3?'SP_3':'THROW');
   let signal=false;
   for(let t=0;t<130;t++) {game.updateBattle();await new Promise(r=>setTimeout(r,17));const data=new Float32Array(2048);analyzer.getFloatTimeDomainData(data);if(data.some(v=>Math.abs(v)>.001))signal=true;}
   const keys=fighterVoice.history.map(h=>h.key),a=game.f1.data.id,b=game.f2.data.id;
   const expected=[a+'-throw',b+'-grabbed',a+'-throw_release',b+'-thrown',b+'-throw_impact'];
   if(!signal||expected.some(k=>keys.filter(v=>v===k).length!==1))throw Error('Actual throw playback '+id+': '+keys);
   outcomes.push({thrower:a,victim:b,command:id===3,events:expected,nonZeroOutput:signal});
  }
  return outcomes;
 });
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(root,'verification/throws.json'),JSON.stringify({...result,browserErrors:errors},null,2));
 console.log(JSON.stringify(result,null,2));await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
