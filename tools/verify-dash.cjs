// v2.8: real key edges, all six heroes, armored-boss knockdown, cancellation and asset preservation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification');let browser;
const VERSION=fs.readFileSync(path.join(root,'ai_studio_code.html'),'utf8').match(/^  Version: ([\d.]+)/m)[1];
const hashes=JSON.parse(fs.readFileSync(path.join(out,'v27-source-hashes.json'),'utf8'));
// v3/v3.1 intentionally redraws sprite/actor packs and overhauls audio/voice synthesis; v3.6.0 adds the factory
// backgrounds to belt-backgrounds. Still guarded: data/stages.js and assets/voices/engine.js.
for(const [f,hash] of Object.entries(hashes).filter(([f])=>!/^data\/(sprites-|belt-actors|belt-backgrounds|voices)|assets\/audio\/engine\.js/.test(f)))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex'),hash,'v2.7 asset changed: '+f);
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe',args:['--mute-audio']});
 const context=await browser.newContext({viewport:{width:1280,height:800}});await context.addInitScript(()=>window.requestAnimationFrame=()=>0);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,'ai_studio_code.html')).href);
 const loaded=await page.evaluate(async()=>{await Promise.all([BeltArt.ready,FighterSprites.ready,StageArt.ready]);sound.init=()=>{};sound.playBGM=()=>{};sound.announce=()=>{};fighterVoice.play=()=>false;
  return {sheets:BeltArt.dashSheets.size,errors:BeltArt.errors,version:STREET.version};});
 assert.deepEqual(loaded,{sheets:6,errors:[],version:VERSION});
 const checks={},check=(b,name)=>{assert(b,name);checks[name]=true;};
 const step=async(n=1)=>page.evaluate(n=>{for(let i=0;i<n;i++)game.update();},n);
 const setup=async(id=0,dir=1)=>{for(const k of ['ArrowRight','ArrowLeft','KeyA','KeyD','KeyJ','KeyZ','KeyK'])await page.keyboard.up(k);await page.evaluate(({id,dir})=>{
  game.startStreet(id);const s=game.street;s.intro=0;s.props=[];s.items=[];s.enemies=[];s.player.x=450;s.player.y=552;s.player.facing=dir;s.player.invuln=0;s.player.cooldown=0;input.keys={};input.just={};
 },{id,dir});};
 const state=()=>page.evaluate(()=>game.street.player.state);
 const tap=async k=>{await page.keyboard.down(k);await step();await page.keyboard.up(k);await step();};
 const run=async k=>{await tap(k);await page.keyboard.down(k);await step();};
 for(const [dir,key] of [[1,'ArrowRight'],[-1,'ArrowLeft'],[1,'KeyD'],[-1,'KeyA']]){
  await setup(0,dir);await run(key);check(await state()==='STREET_DASH','Double tap '+key);
  const x=await page.evaluate(()=>game.street.player.x);await step(5);const travel=await page.evaluate(()=>({x:game.street.player.x,speed:game.street.player.speed}));
  check(Math.abs(travel.x-x)>travel.speed*5*2,'Run faster than walking '+key);
  await page.keyboard.up(key);await step();check(await state()==='IDLE','Release stops '+key);
 }
 await setup();await page.keyboard.down('ArrowRight');await step();for(let i=0;i<8;i++){await page.keyboard.down('ArrowRight');await step();}
 check(await state()==='WALK_F','OS key repeat does not dash');
 await setup();await tap('ArrowRight');await step(15);await page.keyboard.down('ArrowRight');await step();check(await state()==='WALK_F','Late second tap stays walk');
 await setup();await tap('ArrowRight');await tap('ArrowLeft');await page.keyboard.down('ArrowRight');await step();check(await state()==='WALK_F','Opposite tap cancels pending input');
 await setup();await page.keyboard.down('KeyD');await step();await page.keyboard.down('ArrowRight');await step();check(await state()==='WALK_F','Adding alias while holding does not dash');
 await setup();await run('ArrowRight');await page.keyboard.down('ArrowLeft');await step();check(await state()!=='STREET_DASH','Opposite or simultaneous directions stop run');
 await setup();await run('ArrowRight');await page.keyboard.press('KeyK');await step();check(await state()==='JUMP','Jump cancels run');
 await setup();await tap('ArrowRight');await page.keyboard.press('Escape');await step();await page.keyboard.press('Escape');await step();await page.keyboard.down('ArrowRight');await step();check(await state()==='WALK_F','Pause clears pending double tap');
 await setup();await tap('ArrowRight');await page.keyboard.press('KeyH');await step();await page.keyboard.press('KeyH');await step();await page.keyboard.down('ArrowRight');await step();check(await state()==='WALK_F','Help clears pending double tap');
 await setup();await tap('ArrowRight');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.keyboard.press('Escape');await step();await page.keyboard.down('ArrowRight');await step();check(await state()==='WALK_F','Blur clears pending double tap');
 await setup();await run('ArrowRight');await page.evaluate(()=>{const s=game.street;s.player.x=s.gate-8;});await step();check(await state()==='IDLE','Gate stops run');
 const heroes=[];
 for(let id=0;id<6;id++){
  await setup(id);await run('ArrowRight');
  await page.evaluate(()=>{const s=game.street,p=s.player,e=s.spawnEnemy('brute',p.x+145,p.y);e.hp=e.maxHp=5000;e.cooldown=9999;});
  await page.keyboard.press('KeyJ');await step();check(await state()==='DASH_ATTACK','Dash attack '+id);
  const damage=await page.evaluate(()=>game.street.player.attack.damage);await step(19);
  const result=await page.evaluate(()=>{const s=game.street,p=s.player,e=s.enemies[0];game.draw();return {id:p.data.id,damage:e.maxHp-e.hp,state:e.state,z:e.z,normalHeavy:Math.round(68*p.power)};});
  check(result.damage===damage && damage>result.normalHeavy,'Single powerful hit '+result.id);
  check(['HIT_AIR','KNOCKDOWN'].includes(result.state),'Guaranteed knockdown '+result.id);
  await page.locator('#gameCanvas').screenshot({path:path.join(out,'dash-'+result.id+'.png')});
  await page.keyboard.up('ArrowRight');
  const landed=await page.evaluate(()=>{let down=false;for(let i=0;i<70;i++){game.update();down ||= game.street.enemies[0]?.state==='KNOCKDOWN';}return down;});
  check(landed,'Victim reaches floor knockdown '+result.id);
  check(await state()==='IDLE','Attack recovers '+result.id);heroes.push(result);
 }
 await setup(3,-1);await run('ArrowLeft');
 await page.evaluate(()=>{const s=game.street,e=s.spawnEnemy('brute',s.player.x-135,s.player.y);e.hp=e.maxHp=5000;e.cooldown=9999;});
 await page.keyboard.press('KeyZ');await step(20);
 check(await page.evaluate(()=>game.street.enemies[0].hp<5000&&game.street.enemies[0].state==='HIT_AIR'),'Left-facing Z dash attack knocks down');
 await setup();await tap('ArrowRight');await page.keyboard.down('ArrowRight');await page.keyboard.down('KeyJ');await step();
 check(await state()==='DASH_ATTACK','Second tap plus attack in the same frame');
 const mechanics=await page.evaluate(()=>{
  const results={},check=(b,n)=>{if(!b)throw Error(n);results[n]=true;};
  const setup=()=>{game.startStreet(0);const s=game.street;s.intro=0;s.props=[];s.enemies=[];s.player.x=450;s.player.cooldown=0;s.player.invuln=0;s.player.pose('STREET_DASH');input.keys={};input.just={};return s;};
  for(const state of ['IDLE','CHARGE','SLAM']){
   const s=setup(),p=s.player,b=s.spawnEnemy('boss',p.x+70,p.y);b.state=state;b.hp=b.maxHp;s.dashAttack();const atk=p.attack;s.swing(p,atk);const hp=b.hp;s.swing(p,atk);
   check(b.state==='HIT_AIR'&&b.hp===b.maxHp-atk.damage&&b.hp===hp,'Boss '+state+' knocked down once');
  }
  let s=setup(),p=s.player,e=s.spawnEnemy('punk',p.x+70,p.y+STREET.hit.playerDepth+1);s.dashAttack();s.swing(p,p.attack);check(e.hp===e.maxHp,'Dash respects lane range');
  s=setup();p=s.player;e=s.spawnEnemy('punk',p.x+70,p.y);e.invuln=20;s.dashAttack();s.swing(p,p.attack);check(e.hp===e.maxHp,'Existing invulnerability respected');
  s=setup();p=s.player;e=s.spawnEnemy('punk',p.x+70,p.y);p.weapon=8;s.dashAttack();const atk=p.attack;s.swing(p,atk);const e2=s.spawnEnemy('punk',p.x+80,p.y);s.swing(p,atk);check(p.weapon===7&&e2.hp<e2.maxHp,'Pipe wears once across multi-target dash');
  s=setup();p=s.player;p.weapon=8;s.props=[{x:p.x+60,y:p.y,type:'crate',loot:'food',hp:9999}];s.dashAttack();const a=p.attack;s.swing(p,a);s.swing(p,a);check(s.props[0].hp===9999-a.damage&&p.weapon===8,'Crate hit once without pipe wear');
  s=setup();p=s.player;s.dashAttack();s.hurt(p,20,-1,false);check(p.state==='HIT_STAND'&&!p.attack,'Damage interrupts dash attack');
  s=setup();p=s.player;e=s.spawnEnemy('punk',p.x+250,p.y);e.cooldown=9999;s.dashAttack();const window=p.attack;while(p.f<window.until+1){s.updateActor(p);}e.x=p.x+40;const hp=e.hp;s.updateActor(p);check(e.hp===hp,'Dash recovery frames cannot hit');
  s=setup();p=s.player;s.dashAttack();s.enemies=[];input.just.KeyJ=true;s.playerInput();check(p.queue===0,'Dash attack does not queue normal chain');
  s=setup();p=s.player;input.keys.KeyD=true;input.just.KeyJ=true;s.playerInput();check(p.state==='DASH_ATTACK','Attack takes priority over grabbing and picking up while running');
  s=setup();p=s.player;const before=JSON.stringify(s,(k,v)=>k==='owner'?undefined:v);let randomCalls=0;const random=Math.random;Math.random=()=>{randomCalls++;return .5;};for(let i=0;i<40;i++)s.draw(ctx);Math.random=random;
  check(before===JSON.stringify(s,(k,v)=>k==='owner'?undefined:v)&&randomCalls===0,'Dash rendering is pure');
  const bank=BeltArt.dashSheets;BeltArt.dashSheets=new Map();s.draw(ctx);BeltArt.dashSheets=bank;check(true,'Missing dash image falls back');
  return results;
 });
 const contact=await page.evaluate(()=>{
  const c=document.createElement('canvas');c.width=1440;c.height=960;const g=c.getContext('2d');g.fillStyle='#172536';g.fillRect(0,0,c.width,c.height);g.imageSmoothingEnabled=false;
  const frames=[0,2,4,6,8,10,12,13,14,17,20,23];CHARACTERS.forEach((ch,row)=>{frames.forEach((f,col)=>{g.drawImage(BeltArt.dashSheets.get(ch.id),f%6*FighterSprites.cell,Math.floor(f/6)*FighterSprites.cell,FighterSprites.cell,FighterSprites.cell,col*120,row*160,120,120);g.fillStyle='#b9cddc';g.font='11px monospace';g.fillText(ch.id+' '+f,col*120+3,row*160+142);});});return c.toDataURL().split(',')[1];
 });fs.writeFileSync(path.join(out,'dash-six-heroes.png'),Buffer.from(contact,'base64'));
 assert.deepEqual(errors,[]);const report={version:VERSION,originalV27AudioAndSceneryUnchanged:true,loaded,checks,heroes,mechanics,browserErrors:errors};
 fs.writeFileSync(path.join(out,'dash-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
