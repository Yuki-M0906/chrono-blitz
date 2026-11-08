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
 await page.screenshot({path:path.join(root,'verification/arcade-hub.png')});
 assert.equal(await page.evaluate(()=>game.scene),'HUB');
 // Real keyboard handlers enter the classic title and return to the collection.
 await page.keyboard.press('Enter');await page.evaluate(()=>game.update());
 assert.equal(await page.evaluate(()=>game.scene),'TITLE');
 await page.keyboard.press('Escape');await page.evaluate(()=>game.update());
 assert.equal(await page.evaluate(()=>game.scene),'HUB');
 await page.keyboard.press('ArrowRight');await page.evaluate(()=>game.update());
 await page.keyboard.press('Enter');await page.evaluate(()=>{game.update();game.draw();});
 assert.equal(await page.evaluate(()=>game.scene),'STREET_SELECT');
 await page.screenshot({path:path.join(root,'verification/street-select.png')});
 await page.keyboard.press('ArrowRight');await page.evaluate(()=>game.update());
 await page.keyboard.press('Enter');await page.evaluate(()=>game.update());
 assert.equal(await page.evaluate(()=>game.street.player.data.id),'volt');
 await page.evaluate(()=>{game.street.intro=0;for(let i=0;i<60;i++)game.update();game.draw();});
 await page.screenshot({path:path.join(root,'verification/street-stage1.png')});
 await page.keyboard.press('Escape');await page.evaluate(()=>game.update());
 const tick=await page.evaluate(()=>game.street.tick);await page.evaluate(()=>{for(let i=0;i<30;i++)game.update();});
 assert.equal(await page.evaluate(()=>game.street.tick),tick);
 await page.keyboard.press('Escape');await page.evaluate(()=>game.update());
 await page.keyboard.press('KeyH');await page.evaluate(()=>game.update());
 const helpTick=await page.evaluate(()=>game.street.tick);await page.evaluate(()=>{for(let i=0;i<30;i++)game.update();});assert.equal(await page.evaluate(()=>game.street.tick),helpTick);
 await page.keyboard.press('Escape');await page.evaluate(()=>game.update());
 const checks=await page.evaluate(()=>{
  const check=(b,m)=>{if(!b)throw Error(m);};
  const setup=(id=0)=>{game.startStreet(id);const s=game.street;s.intro=0;s.player.cooldown=0;s.enemies=[];input.keys={};input.just={};return s;};
  const step=s=>{s.update();input.clear();};
  let s=setup(),p=s.player,oldY=p.y;input.keys.KeyW=true;for(let i=0;i<10;i++)step(s);check(p.y<oldY&&p.z===0,'Up must move in depth, not jump');input.keys={};
  input.just.KeyK=true;step(s);for(let i=0;i<10;i++)step(s);check(p.z>40,'Separate jump height');
  const frozen=JSON.stringify([s.tick,p.x,p.y,p.z,p.hp]);for(let i=0;i<10;i++)s.draw(ctx);check(JSON.stringify([s.tick,p.x,p.y,p.z,p.hp])===frozen,'Draw mutated simulation');
  s=setup();p=s.player;let e=s.spawnEnemy('punk',p.x+70,p.y+80);s.attack(p);p.f=5;s.swing(p,p.attack);check(e.hp===e.maxHp,'Depth hitbox');e.y=p.y;s.swing(p,p.attack);check(e.hp<e.maxHp,'Aligned hit');const hp=e.hp;s.swing(p,p.attack);check(e.hp===hp,'Duplicate strike');
  s=setup();p=s.player;e=s.spawnEnemy('punk',p.x+50,p.y);s.beginGrab(e);s.throwHeld(1);let held=false,flight=false,landed=false;for(let i=0;i<130;i++){step(s);held||=e.state==='GRABBED';flight||=e.throwFlight;landed||=e.state==='KNOCKDOWN'||e.dead;}check(held&&flight&&landed&&!s.grapple,'Paired throw');
  s=setup();p=s.player;s.burst();check(p.hp===p.maxHp,'Empty emergency must not cost HP');p.cooldown=0;p.pose('IDLE');e=s.spawnEnemy('punk',p.x+70,p.y);s.burst();check(p.hp===p.maxHp-Math.ceil(p.maxHp*.075)&&e.hp<e.maxHp,'Emergency cost on hit');
  s=setup();p=s.player;const prop=s.props[0];p.x=prop.x-60;p.y=prop.y;s.attack(p);s.swing(p,p.attack);p.pose('IDLE');s.attack(p);s.swing(p,p.attack);check(prop.hp<=0&&s.items.length===1,'Breakable drops');p.x=prop.x;p.hp-=200;const injured=p.hp;check(s.pickup()&&p.hp>injured,'Food recovery');
  s.items.push({x:p.x,y:p.y,type:'pipe',age:0});check(s.pickup()&&p.weapon===8,'Pipe pickup');s.items.push({x:p.x,y:p.y,type:'cash',age:0});let score=s.score;s.pickup();check(s.score===score+1200,'Cash pickup');
  s=setup();s.spawnWave();p=s.player;p.x=s.gate+300;step(s);check(p.x<=s.gate&&s.locked,'Gate blocks while enemies live');
  for(const e of s.enemies){e.hp=0;s.kill(e);}for(let i=0;i<76;i++)step(s);check(s.wave===1&&s.alive().length===3,'Second wave spawned');for(const e of s.enemies){e.hp=0;s.kill(e);}for(let i=0;i<76;i++)step(s);check(!s.locked,'Gate opens after final wave');p.x=1351;step(s);check(s.area===1&&s.timer===9000,'Next area checkpoint');
  s=setup();p=s.player;for(let n=0;n<3;n++){p.hp=0;s.kill(p);for(let i=0;i<102;i++)step(s);}check(s.result==='over'&&s.lives===0,'Lives/game over');
  s=setup();s.addScore(20000);check(s.lives===4,'Score extend');s.addScore(20000);check(s.lives===4,'One score extend only');
  s=setup();s.area=4;s.wave=0;s.backWall=5005;s.gate=6135;s.camera=4920;p=s.player;p.x=5310;s.spawnWave();s.bossIntro=0;const boss=s.alive().find(e=>e.kind==='boss');boss.x=p.x+300;boss.y=p.y;boss.cooldown=0;s.enemyAI(boss);check(boss.state==='WINDUP'&&boss.plan==='charge','Boss telegraph');boss.f=boss.windup;s.enemyAI(boss);check(boss.state==='CHARGE','Boss charge');boss.pose('IDLE');boss.cooldown=0;boss.x=p.x+90;s.enemyAI(boss);check(boss.plan==='slam','Boss slam');boss.pose('IDLE');boss.hp=600;s.enemyAI(boss);check(boss.enraged&&s.alive().length===5,'Boss rage reinforcement once');boss.pose('IDLE');s.enemyAI(boss);check(s.alive().length===5,'No infinite reinforcements');
  game.draw();return {axisMovement:true,jump:true,pureDraw:true,depthHitbox:true,oneHitPerSwing:true,pairedThrow:true,emergency:true,breakables:true,pickups:true,wavesAndGates:true,lives:true,scoreExtend:true,bossPatterns:true};
 });
 await page.screenshot({path:path.join(root,'verification/street-boss.png')});
 // Full runs driven ONLY by the public keyboard-input state. No HP, enemy or stage cheats.
 const runs=await page.evaluate(()=>{
  sound.playBGM=()=>{};sound.announce=()=>{};fighterVoice.play=()=>false;
  const results=[];
  for(let id=0;id<6;id++) {
   game.startStreet(id);const s=game.street;
   for(let t=0;t<60000&&!s.result;t++) {
    input.keys={};input.just={};const p=s.player;
    const living=s.alive().sort((a,b)=>(Math.abs(a.x-p.x)+Math.abs(a.y-p.y)*2)-(Math.abs(b.x-p.x)+Math.abs(b.y-p.y)*2));
    const e=living[0],food=s.items.find(i=>i.type==='food'&&p.hp<p.maxHp*.75&&Math.abs(i.x-p.x)<500);
    if(p.state==='HOLD'){input.just.KeyI=true;}
    else if(food){const dx=food.x-p.x,dy=food.y-p.y;if(Math.abs(dx)>20)input.keys[dx>0?'KeyD':'KeyA']=true;if(Math.abs(dy)>12)input.keys[dy>0?'KeyS':'KeyW']=true;if(Math.abs(dx)<38&&Math.abs(dy)<22)input.just.KeyJ=true;}
    else if(e){
      const dx=e.x-p.x,dy=e.y-p.y,near=living.filter(a=>Math.abs(a.x-p.x)<145&&Math.abs(a.y-p.y)<60).length;
      if(Math.abs(dy)>12)input.keys[dy>0?'KeyS':'KeyW']=true;
      if(Math.abs(dx)>64||Math.sign(dx)!==p.facing)input.keys[dx>0?'KeyD':'KeyA']=true;
      if((near>=2||p.state==='HIT_STAND')&&p.cooldown<=0&&p.hp>p.maxHp*.15)input.just.KeyL=true;
      else if(e.kind==='boss'&&e.state==='WINDUP'&&e.f>e.windup-10)input.just.KeyK=true;
      else if(Math.abs(dx)<p.reach+20&&Math.abs(dy)<30&&t%7===0)input.just.KeyJ=true;
    }else input.keys.KeyD=true;
    game.update();
   }
   results.push({character:pName(s),result:s.result,area:s.area,kills:s.kills,lives:s.lives,hp:s.player.hp,ticks:s.tick,score:s.score});
  }
  function pName(s){return s.player.data.id;}
  return results;
 });
 await page.evaluate(()=>{for(let i=0;i<50;i++)game.update();game.draw();});await page.screenshot({path:path.join(root,'verification/street-clear.png')});
 await page.keyboard.press('Enter');await page.evaluate(()=>game.update());assert.equal(await page.evaluate(()=>game.street.result),null);
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.evaluate(()=>game.paused),true);
 await page.keyboard.press('Escape');await page.evaluate(()=>game.update());assert.equal(await page.evaluate(()=>game.paused),false);
 await page.keyboard.press('Escape');await page.evaluate(()=>game.update());await page.keyboard.press('KeyQ');await page.evaluate(()=>game.update());assert.equal(await page.evaluate(()=>game.scene),'HUB');
 const box=await page.locator('#gameCanvas').boundingBox();await page.mouse.click(box.x+900*box.width/1280,box.y+450*box.height/720);await page.evaluate(()=>game.update());assert.equal(await page.evaluate(()=>game.scene),'STREET_SELECT');
 checks.retry=true;checks.focusPause=true;checks.mouseNavigation=true;
 fs.writeFileSync(path.join(root,'verification/belt-report.json'),JSON.stringify({checks,runs,browserErrors:errors},null,2));
 console.log(JSON.stringify({checks,runs,browserErrors:errors},null,2));
 assert.deepEqual(errors,[]);for(const r of runs)assert.equal(r.result,'clear','Full-input playthrough '+r.character);
 await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
