// Street art: embedded code is in sync with its sources, every belt image decodes, both stages render
// (5 districts + seams each), drawing is pure and the fallback path works.
// v3.6.1: the comparisons against ai_studio_code.v2.4.0.backup.html were removed. Since v3.4.0 the street engine,
// the shared IDLE frame and the voice list differ from v2.4.0 on purpose, so they could only fail, and the backup is
// a git-ignored 85 MB file that a fresh clone does not have.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'verification', 'belt-art-v30');
fs.mkdirSync(out, {recursive:true});
const read = name => fs.readFileSync(path.join(root, name), 'utf8').replace(/\r\n/g, '\n');
const current = read('ai_studio_code.html');
const block = (html, name) => html.match(new RegExp('^// '+name+'_BEGIN$([\\s\\S]*?)^// '+name+'_END$', 'm'))[1];
// Every embedded region must be exactly what the build would write from the sources (a hand edit inside the
// markers, or a source edit without a rebuild, fails here). Pack contents versus source files: verify-hit.cjs.
const manifest = JSON.parse(read('assets/belt/art/manifest.json'));
assert.equal(block(current, 'AUDIO_ENGINE').trim(), read('assets/audio/engine.js').trim(), 'AUDIO_ENGINE out of sync with assets/audio/engine.js');
for (const f of ['assets/sprites/throws.js', 'assets/sprites/renderer.js', 'assets/stages/renderer.js', 'assets/voices/engine.js'])
  assert(block(current, 'SPRITE_ASSETS').includes(read(f).trim()), 'SPRITE_ASSETS out of sync with ' + f);
for (const f of ['assets/belt/art.js', 'assets/belt/engine.js'])
  assert(block(current, 'BELT_ENGINE').includes(read(f).trim()), 'BELT_ENGINE out of sync with ' + f);
let browser;
(async () => {
  browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_BIN || 'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe', args:['--mute-audio']});
  const context = await browser.newContext({viewport:{width:1280,height:800}});
  await context.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(pathToFileURL(path.join(root,'ai_studio_code.html')).href);
  const loaded = await page.evaluate(async () => {
    await Promise.all([FighterSprites.ready, StageArt.ready, BeltArt.ready]);
    return {images:BeltArt.images.size, districts:BeltArt.boards.size, factory:BeltArt.factoryBoards.size, monsterCells:BeltArt.monsterCells.length, props:BeltArt.props.length, bossPoses:[...BeltArt.bossCells.values()].flat().length, errors:BeltArt.errors,
      transparent:[...BeltArt.images].filter(([id])=>!/^(district|factory)-/.test(id)).map(([id,img])=>{
        const b=document.createElement('canvas'); b.width=img.width; b.height=img.height; const c=b.getContext('2d'); c.drawImage(img,0,0);const a=c.getImageData(0,0,b.width,b.height).data;let clear=0;for(let i=3;i<a.length;i+=4)if(a[i]<25)clear++;return {id,ratio:clear/(b.width*b.height)};
      })};
  });
  assert.equal(loaded.images,Object.keys(manifest.assets).length); assert.equal(loaded.districts,5); assert.equal(loaded.factory,5); assert.equal(loaded.monsterCells,24);
  assert.equal(loaded.props,8); assert.equal(loaded.bossPoses,72); assert.deepEqual(loaded.errors,[]);
  for(const a of loaded.transparent)assert(a.ratio>.35 && a.ratio<.9, a.id+' alpha');
  const stage = async (area, seam=false, stageIndex=0) => {
    await page.evaluate(({area,seam,stageIndex})=>{
      sound.playBGM=()=>{}; sound.announce=()=>{}; fighterVoice.play=()=>false;
      game.startStreet(4,stageIndex);const s=game.street; s.intro=0;s.bossIntro=0;s.area=area;s.tick=90;
      s.camera=seam ? area*1240-640 : Math.min(4920,area*1240);s.backWall=area*1240;s.gate=(area+1)*1240-50;s.locked=true;
      s.player.x=s.camera+280;s.player.y=557;s.player.weapon=8;s.player.pose('IDLE');s.enemies=[];
      s.spawnEnemy(area===4?'boss':'brute',s.camera+810,560);s.spawnEnemy('punk',s.camera+1030,590);
      s.props=[{type:'crate',x:s.camera+460,y:493,hp:48},{type:'crate',x:s.camera+565,y:500,hp:12},{type:'barrel',x:s.camera+1030,y:472,hp:48},{type:'barrel',x:s.camera+1130,y:483,hp:12}];
      s.items=['food','cash','pipe'].map((type,i)=>({type,x:s.camera+450+i*115,y:609,age:0}));game.draw();
    },{area,seam,stageIndex});
    await page.locator('#gameCanvas').screenshot({path:path.join(out,`art-${stageIndex?'factory':'v25'}-${seam?'seam':'district'}-${area}.png`)});
  };
  // Stage 2 (INFERNAL WORKS, boss FURNACE MAW) first, then stage 1 so the checks below run on the VOSS boss.
  for(let i=0;i<5;i++)await stage(i,false,1);
  for(let i=1;i<5;i++)await stage(i,true,1);
  const monster=await page.evaluate(()=>{const s=game.street,b=s.enemies.find(e=>e.kind==='boss'),snap=()=>JSON.stringify(s,(k,v)=>k==='owner'?undefined:v);
    for(const state of ['IDLE','WALK_F','WINDUP','CHARGE','SLAM','ATK_H','HIT_STAND','HIT_AIR','KNOCKDOWN','WAKEUP']){b.state=state;for(let f=0;f<45;f+=3){b.f=f;b.animTick=f;const before=snap();s.draw(ctx);if(snap()!==before)throw Error('Monster draw changed state in '+state);}}
    return {monster:b.monster===true,label:b.label,stage:s.stageIndex};});
  assert.deepEqual(monster,{monster:true,label:'FURNACE MAW',stage:1});
  for(let i=0;i<5;i++)await stage(i);
  for(let i=1;i<5;i++)await stage(i,true);
  await stage(4);
  const checks = await page.evaluate(()=>{
    const s=game.street, snap=()=>JSON.stringify(s,(k,v)=>k==='owner'?undefined:v), before=snap();
    const random=Math.random;let calls=0;Math.random=()=>{calls++;return random();};
    const start=performance.now();for(let i=0;i<120;i++)s.draw(ctx);const renderMs=(performance.now()-start)/120;Math.random=random;
    if(snap()!==before||calls)throw Error('Drawing changed simulation or used random');
    const {boards,props,bossCells}=BeltArt;BeltArt.boards=new Map();BeltArt.props=[];BeltArt.bossCells=new Map();
    s.draw(ctx);BeltArt.boards=boards;BeltArt.props=props;BeltArt.bossCells=bossCells;s.draw(ctx);
    if(snap()!==before)throw Error('Fallback changed simulation');
    const boss=s.enemies.find(e=>e.kind==='boss');
    boss.state='SLAM';
    if(BeltArt.bossFrame(boss,'SP_1',19)!==44 || BeltArt.bossFrame(boss,'SP_1',20)!==14)throw Error('Slam art must land on damage frame 20');
    boss.state='IDLE';for(let t=0;t<36;t++){boss.animTick=t;if([26,27].includes(BeltArt.bossFrame(boss,'IDLE',0)))throw Error('Idle uses walking pose');}
    for(const state of ['IDLE','WALK_F','WINDUP','CHARGE','SLAM','HIT_STAND','KNOCKDOWN','THROWN'])for(let f=0;f<55;f++){boss.state=state;boss.f=f;boss.animTick=f;s.draw(ctx);}
    return {embeddedCodeInSync:true,pureDraw:true,randomCalls:calls,fallback:true,bossStates:true,meanRenderMs:renderMs};
  });
  const sheet = await page.evaluate(()=>{
    const b=document.createElement('canvas');b.width=1440;b.height=960;const c=b.getContext('2d');c.fillStyle='#1b2637';c.fillRect(0,0,b.width,b.height);c.imageSmoothingEnabled=false;
    for(let f=0;f<72;f++){
      const id=f>=48?'voss-throw':f>=24?'voss-motion':'voss-base',n=f%24,x=f%12*120,y=Math.floor(f/12)*160;
      c.drawImage(BeltArt.bossSheets.get(id),n%6*FighterSprites.cell,Math.floor(n/6)*FighterSprites.cell,FighterSprites.cell,FighterSprites.cell,x,y,120,120);
      c.fillStyle='#a9c9dc';c.font='12px monospace';c.fillText(String(f).padStart(2,'0'),x+4,y+142);
    }return b.toDataURL('image/png').split(',')[1];
  });
  fs.writeFileSync(path.join(out,'art-v25-voss-poses.png'),Buffer.from(sheet,'base64'));
  assert.deepEqual(errors,[]);
  const report={version:await page.evaluate(()=>STREET.version),loaded,monster,checks,browserErrors:errors};
  fs.writeFileSync(path.join(out,'belt-art-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  await browser.close();
})().catch(async error=>{console.error(error);if(browser)await browser.close();process.exitCode=1;});
