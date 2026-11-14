// v2.6.0: NEON UPRISING hit detection retune (STREET.hit) and the split distribution (HTML + data/*.js packs).
// Run: node tools/verify-hit.cjs
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{pathToFileURL}=require('node:url');
const {readPacks,root}=require('./packs.cjs');let browser;
// ---- Distribution: every file must be uploadable (GitHub rejects > 100 MB, warns > 50 MB) and match its source.
const htmlSize=fs.statSync(path.join(root,'ai_studio_code.html')).size,packs=readPacks();
assert(htmlSize<2*1048576,'HTML must stay small: '+htmlSize);
assert.equal(packs.files.length,11);
for(const f of packs.files)assert(f.size<50*1048576,f.name+' is too large: '+f.size);
const b64=(...p)=>fs.readFileSync(path.join(root,...p)).toString('base64');
for(const [id,uri] of Object.entries(packs.assets.sprites))assert.equal(uri,'data:image/png;base64,'+b64('assets/sprites/design-v33',id+'.png'),id);
for(const s of packs.assets.stages)assert.equal(s.src,'data:image/png;base64,'+b64('assets/stages',s.id+'.png'),s.id);
for(const [id,uri] of Object.entries(packs.assets.voices))assert.equal(uri,'data:audio/wav;base64,'+b64('assets/voices',id+'.wav'),id);
for(const [id,e] of Object.entries(packs.assets.beltArt))assert.equal(e.src,'data:image/png;base64,'+b64('assets/belt/art',e.file),id);
assert.equal(Object.keys(packs.assets.sprites).length,18);assert.equal(packs.assets.stages.length,4);
assert.equal(Object.keys(packs.assets.voices).length,136);assert.equal(Object.keys(packs.assets.beltArt).length,28);
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe',args:['--mute-audio']});
 const context=await browser.newContext({viewport:{width:1280,height:800}});
 await context.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,'ai_studio_code.html')).href);
 const boot=await page.evaluate(async()=>{await Promise.all([FighterSprites.ready,StageArt.ready,BeltArt.ready]);game.draw();
  return {overlayGone:!document.getElementById('cbLoading'),loaded:CB_ASSETS.loaded,total:CB_ASSETS.total,failed:CB_ASSETS.failed,sprites:FighterSprites.atlases?.size??null,belt:BeltArt.images.size,beltErrors:BeltArt.errors,inline:[...document.scripts].reduce((n,s)=>n+(s.src?0:s.textContent.length),0)};});
 assert.equal(boot.overlayGone,true);assert.equal(boot.loaded,boot.total);assert.deepEqual(boot.failed,[]);assert.equal(boot.belt,28);assert.deepEqual(boot.beltErrors,[]);assert(boot.inline<1048576);
 const checks=await page.evaluate(()=>{
  sound.playBGM=()=>{};sound.announce=()=>{};fighterVoice.play=()=>false;
  const out={};const check=(b,m)=>{if(!b)throw Error(m);out[m]=true;};const H=STREET.hit;
  const setup=(id=0)=>{game.startStreet(id);const s=game.street;s.intro=0;s.player.cooldown=0;s.enemies=[];s.props=[];s.items=[];input.keys={};input.just={};return s;};
  const step=s=>{s.update();input.clear();};
  const foe=(s,dx,dy,kind='punk')=>{const p=s.player,e=s.spawnEnemy(kind,p.x+dx,p.y+dy);e.cooldown=9999;e.x=p.x+dx;e.y=p.y+dy;e.hp=e.maxHp=5000;return e;};
  const strike=(s)=>{const p=s.player;p.pose('IDLE');p.chain=0;s.attack(p);s.swing(p,p.attack);};
  // 1. Lane tolerance of the player's strikes.
  let s=setup(),p=s.player,e=foe(s,60,H.playerDepth-3);strike(s);check(e.hp<e.maxHp,'Punch connects near the edge of the wider lane');
  s=setup();p=s.player;e=foe(s,60,31);strike(s);check(e.hp<e.maxHp,'Punch connects at 31px depth (missed before v2.6.0)');
  s=setup();p=s.player;e=foe(s,60,H.playerDepth+3);strike(s);check(e.hp===e.maxHp,'Punch still misses outside the lane');
  s=setup();p=s.player;e=foe(s,-(H.playerRear-3),0);strike(s);check(e.hp<e.maxHp,'Punch catches an enemy hugging the back');
  s=setup();p=s.player;e=foe(s,-(H.playerRear+8),0);strike(s);check(e.hp===e.maxHp,'Enemy clearly behind is not hit');
  // 2. Lane assist keeps the chain connecting.
  s=setup();p=s.player;e=foe(s,60,30);strike(s);check(Math.abs(e.y-p.y-30*(1-H.laneAssist))<0.01,'Staggered enemy slides toward the player lane');
  // 3. Active frames: an enemy that enters reach after the first active frame is still hit, exactly once.
  s=setup();p=s.player;e=foe(s,p.reach+60,0);s.attack(p);const atk=p.attack;
  check(atk.until-atk.active===H.playerActive-1,'Ground strike has several active frames');
  let hits=0,last=e.hp;for(let i=0;i<atk.end;i++){e.x=p.f>=atk.active+1?p.x+p.reach-6:p.x+p.reach+60;e.y=p.y;if(e.state!=='IDLE'&&e.state!=='WALK_F'&&e.hp===e.maxHp)e.pose('IDLE');step(s);if(e.hp<last){hits++;last=e.hp;}if(!p.attack)break;}
  check(hits===1,'Late entry into reach is hit once (hits='+hits+')');
  s=setup();p=s.player;e=foe(s,p.reach+60,0);s.attack(p);const a2=p.attack;hits=0;last=e.hp;
  for(let i=0;i<a2.end;i++){e.x=p.f>a2.until?p.x+p.reach-6:p.x+p.reach+60;e.y=p.y;step(s);if(e.hp<last){hits++;last=e.hp;}if(!p.attack)break;}
  check(hits===0,'Recovery frames do not hit');
  // 4. Breakables: wider lane, one hit per swing, and no pipe wear from crates.
  s=setup();p=s.player;let prop={type:'crate',x:p.x+60,y:p.y+H.propDepth-4,hp:9999,loot:'food'};s.props=[prop];p.weapon=8;s.attack(p);
  for(let i=0;i<40&&p.attack;i++)step(s);const dmg=9999-prop.hp;check(dmg>0&&p.weapon===8,'Crate is hit in the wider lane without pipe wear');
  s=setup();p=s.player;prop={type:'crate',x:p.x+60,y:p.y,hp:9999,loot:'food'};s.props=[prop];s.attack(p);const one=p.attack.damage;for(let i=0;i<30&&p.attack;i++)step(s);check(9999-prop.hp===one,'Crate takes one hit per swing');
  // 5. Jump attack stays active through the descent.
  s=setup();p=s.player;e=foe(s,70,0);input.just.KeyK=true;step(s);for(let i=0;i<6;i++){e.x=p.x+70;e.y=p.y;step(s);}input.just.KeyJ=true;step(s);
  check(p.attack&&p.attack.until-p.attack.active===H.airActive-1,'Jump attack has a long active window');
  e.x=p.x+400;for(let i=0;i<8;i++)step(s);e.x=p.x+70;e.y=p.y;e.pose('IDLE');last=e.hp;for(let i=0;i<6;i++)step(s);check(e.hp<last,'Jump attack hits late in its arc');
  // 6. Enemy punch is honest: one frame, narrow lane.
  const enemyPunch=(dy)=>{const s=setup(),p=s.player,e=foe(s,-70,dy);e.facing=1;e.pose('ATK_H');e.attack={active:5,end:32,damage:e.damage,reach:95,depth:H.enemyDepth,knock:false,hit:new Set()};p.invuln=0;const hp=p.hp;e.f=5;s.swing(e,e.attack);return p.hp<hp;};
  check(enemyPunch(H.enemyDepth-3)===true,'Enemy punch hits inside its lane');
  check(enemyPunch(H.enemyDepth+2)===false,'Stepping out of the lane dodges the enemy punch');
  s=setup();p=s.player;e=foe(s,80,0);e.cooldown=0;p.invuln=0;let wound=false;for(let i=0;i<8&&e.state!=='WINDUP';i++){e.x=p.x+80;e.y=p.y;step(s);}check(e.state==='WINDUP','Enemy winds up');
  for(let i=0;i<e.windup+2;i++)step(s);check(e.attack&&e.attack.depth===H.enemyDepth&&e.attack.until===undefined,'Enemy punch uses the narrow lane and a single active frame');
  // 7. Thrown body sweeps a wider lane.
  s=setup();p=s.player;e=foe(s,50,0);e.hp=e.maxHp=400;const far=foe(s,190,H.bodyDepth-6);s.beginGrab(e);s.throwHeld(1);
  for(let i=0;i<120&&far.hp===far.maxHp;i++){far.x=p.x+190;far.y=p.y+H.bodyDepth-6;if(far.state!=='IDLE')far.pose('IDLE');step(s);}check(far.hp<far.maxHp,'Thrown body hits an enemy 36px off the lane');
  // 8. Pickups and grabs.
  s=setup();p=s.player;s.items=[{x:p.x+H.pickupRange-6,y:p.y+H.pickupDepth-6,type:'cash',age:0}];check(s.pickup()===true,'Item is picked up from further away');
  s=setup();p=s.player;s.items=[{x:p.x+H.pickupRange+8,y:p.y,type:'cash',age:0}];check(s.pickup()===false,'Distant item is not picked up');
  s=setup();p=s.player;e=foe(s,60,H.grabDepth+2);check(s.grabbable(72,H.throwKeyDepth)===e&&!s.grabbable(72),'Throw key reaches a wider lane than the walking grab');
  // 9. Boss lanes are slightly narrower.
  s=setup();s.area=4;s.wave=0;s.backWall=5005;s.gate=6135;s.camera=4920;p=s.player;p.x=5400;s.spawnWave();s.bossIntro=0;const boss=s.alive().find(x=>x.kind==='boss');s.enemies=[boss];
  const charge=(dy)=>{boss.x=p.x-80;boss.y=p.y+dy;boss.facing=1;boss.pose('CHARGE');boss.chargeHit=false;p.invuln=0;p.pose('IDLE');p.z=0;const hp=p.hp;s.enemyAI(boss);p.hp=p.maxHp;const hit=boss.chargeHit;return hit;};
  check(charge(H.chargeDepth+2)===false,'Boss charge misses just outside its lane');p.dead=false;p.pose('IDLE');
  check(charge(H.chargeDepth-4)===true,'Boss charge hits inside its lane');
  // 10. Drawing stays pure with the new fields.
  s=setup();p=s.player;e=foe(s,60,0);s.attack(p);const frozen=JSON.stringify([s.tick,p.x,p.y,p.f,e.hp,e.y,e.state]);for(let i=0;i<5;i++)s.draw(ctx);check(JSON.stringify([s.tick,p.x,p.y,p.f,e.hp,e.y,e.state])===frozen,'Draw is pure');
  return out;
 });
 const report={version:await page.evaluate(()=>STREET.version),distribution:{htmlBytes:htmlSize,packs:packs.files},boot,checks,browserErrors:errors};
 fs.writeFileSync(path.join(root,'verification/hit-report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({htmlBytes:htmlSize,packs:packs.files.map(f=>f.name+' '+(f.size/1048576).toFixed(1)+'MB'),checks,browserErrors:errors},null,2));
 assert.deepEqual(errors,[]);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>browser&&browser.close());
