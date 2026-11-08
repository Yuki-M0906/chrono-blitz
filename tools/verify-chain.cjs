// v2.3.0: NEON UPRISING Final Fight style chain (punch -> body blow -> uppercut), down-held chain throw,
// thrown bodies hitting other enemies, and the on-screen version label. Run: node tools/verify-chain.cjs
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe',args:['--mute-audio']});
 const context=await browser.newContext({viewport:{width:1280,height:800}});
 await context.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,'ai_studio_code.html')).href);
 await page.evaluate(async()=>{await FighterSprites.ready;await StageArt.ready;game.draw();});
 const report=await page.evaluate(()=>{
  sound.playBGM=()=>{};sound.announce=()=>{};fighterVoice.play=()=>false;
  const out={};const check=(b,m)=>{if(!b)throw Error(m);out[m]=true;};
  const setup=(id=1)=>{game.startStreet(id);const s=game.street;s.intro=0;s.player.cooldown=0;s.enemies=[];input.keys={};input.just={};return s;};
  const step=s=>{s.update();input.clear();};
  const finish=(s,p)=>{let n=0;while(p.attack&&n++<60)step(s);};
  check(typeof STREET.version==='string'&&/^\d+\.\d+\.\d+$/.test(STREET.version),'Version string present');
  // 1. Whiff: the chain must not advance when nothing was hit.
  let s=setup(),p=s.player;s.attack(p);check(p.chain===1&&p.state==='ATK_L','First press is the punch');finish(s,p);
  s.attack(p);check(p.chain===1&&p.state==='ATK_L','Whiff restarts at the punch');finish(s,p);
  // 2. Hit chain: punch -> body blow -> uppercut, only while each stage connects.
  s=setup();p=s.player;let e=s.spawnEnemy('punk',p.x+60,p.y);e.cooldown=999;
  s.attack(p);finish(s,p);check(p.chainHit===true&&e.hp<e.maxHp,'Punch connects');
  s.attack(p);check(p.chain===2&&p.state==='ATK_C_L','Second press is the body blow');finish(s,p);check(e.state==='HIT_STAND'||e.state==='IDLE','Body blow staggers without launching');
  s.attack(p);check(p.chain===3&&p.state==='ATK_H'&&p.attack.upper===true,'Third press is the uppercut');
  let peak=0,launched=false;for(let i=0;i<60;i++){step(s);launched||=e.state==='HIT_AIR';peak=Math.max(peak,e.z);}
  check(launched&&peak>60,'Uppercut launches the enemy high');finish(s,p);
  // 3. Chain window: after the uppercut the next press restarts at the punch.
  s.attack(p);check(p.chain===1,'Chain restarts after the uppercut');finish(s,p);
  // 4. Down-held third hit becomes a throw, and the thrown body hits another enemy.
  s=setup();p=s.player;e=s.spawnEnemy('punk',p.x+60,p.y);e.cooldown=999;const far=s.spawnEnemy('punk',p.x+190,p.y);far.cooldown=999;far.y=p.y;e.y=p.y;
  s.attack(p);finish(s,p);s.attack(p);finish(s,p);check(p.chain===2&&p.chainHit,'Two hits landed before the throw');
  input.keys.KeyS=true;s.attack(p);input.keys={};
  check(p.state==='THROWING'&&s.grapple&&s.grapple.mode==='throw'&&s.grapple.victim===e,'Down + third hit throws instead of uppercut');
  // The far enemy's AI drifts in depth while it closes in; pin it on the throw lane until the body reaches it.
  let flew=false,otherHit=false;for(let i=0;i<120;i++){if(!otherHit){far.x=p.x+190;far.y=p.y;}step(s);flew||=e.throwFlight===true;otherHit||=far.hp<far.maxHp;}
  check(flew&&otherHit,'Thrown body hits the other enemy');
  check(!s.grapple&&['IDLE','THROW_RECOVER'].includes(p.state),'Throw finishes cleanly');
  // 5. Down without a grabbable enemy in front falls back to the uppercut.
  s=setup();p=s.player;e=s.spawnEnemy('punk',p.x+60,p.y);e.cooldown=999;s.attack(p);finish(s,p);s.attack(p);finish(s,p);
  e.x=p.x+p.reach+80;input.keys.KeyS=true;s.attack(p);input.keys={};check(p.state==='ATK_H'&&p.chain===3,'No grab target: uppercut instead');finish(s,p);
  // 6. Pipe keeps the heavy swing and never converts to a throw.
  s=setup();p=s.player;e=s.spawnEnemy('punk',p.x+60,p.y);e.cooldown=999;p.weapon=8;s.attack(p);check(p.state==='ATK_H'&&!p.attack.upper,'Pipe swing');finish(s,p);
  s.attack(p);finish(s,p);input.keys.KeyS=true;s.attack(p);input.keys={};check(p.state==='ATK_H'&&p.chain===3,'Pipe third hit stays a swing');finish(s,p);
  // 7. Public input path (J presses through playerInput and the queue) reaches the uppercut on a live enemy.
  s=setup();p=s.player;e=s.spawnEnemy('punk',p.x+60,p.y);e.cooldown=999;e.hp=9999;e.maxHp=9999;let reached=0;
  for(let t=0;t<120;t++){if(t%9===0)input.just.KeyJ=true;step(s);reached=Math.max(reached,p.chain);}
  check(reached===3,'Key-driven chain reaches stage 3');
  // 7b. Real input, slow presses: holding S between hits must not walk the player off the enemy's lane,
  //     and the third press must still become the throw (v2.3.1 fix).
  for(const period of [9,20,30]){
    s=setup();p=s.player;e=s.spawnEnemy('punk',p.x+60,p.y);e.cooldown=999;e.y=p.y;e.hp=9999;e.maxHp=9999;const y0=p.y;let thrown=false,maxDy=0;
    for(let t=0;t<110&&!thrown;t++){input.keys={KeyS:true};input.just={};if(t%period===0)input.just.KeyJ=true;step(s);maxDy=Math.max(maxDy,Math.abs(p.y-y0));thrown=p.state==='THROWING';}
    check(thrown&&maxDy<1,'Held down + J every '+period+'F throws without leaving the lane');
    input.keys={};for(let i=0;i<80;i++)step(s);input.keys={KeyS:true};for(let i=0;i<10;i++)step(s);check(p.y>y0,'Depth movement works again after the throw ('+period+'F)');input.keys={};
  }
  // 8. Breakables continue the chain (two presses must still break a crate as in verify-belt).
  s=setup();p=s.player;const prop=s.props[0];p.x=prop.x-60;p.y=prop.y;s.attack(p);s.swing(p,p.attack);check(p.chainHit,'Crate hit continues the chain');
  // 9. Drawing never mutates the simulation.
  s=setup();p=s.player;e=s.spawnEnemy('punk',p.x+60,p.y);s.attack(p);const frozen=JSON.stringify([s.tick,p.x,p.chain,p.chainHit,e.hp,e.state]);for(let i=0;i<5;i++)s.draw(ctx);check(JSON.stringify([s.tick,p.x,p.chain,p.chainHit,e.hp,e.state])===frozen,'Draw is pure');
  game.scene='HUB';game.draw();
  return out;
 });
 await page.screenshot({path:path.join(root,'verification/chain-hub.png')});
 await page.evaluate(()=>{game.startStreet(1);const s=game.street;s.intro=0;for(let i=0;i<5;i++)game.update();game.draw();});
 await page.screenshot({path:path.join(root,'verification/chain-hud.png')});
 fs.writeFileSync(path.join(root,'verification/chain-report.json'),JSON.stringify({checks:report,browserErrors:errors},null,2));
 console.log(JSON.stringify({checks:report,browserErrors:errors},null,2));
 assert.deepEqual(errors,[]);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>browser&&browser.close());
