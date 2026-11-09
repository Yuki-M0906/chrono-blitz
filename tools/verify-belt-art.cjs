// v2.5 visual-only regression against the user's exact v2.4.0 handoff.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'verification');
const read = name => fs.readFileSync(path.join(root, name), 'utf8').replace(/\r\n/g, '\n');
const current = read('ai_studio_code.html'), old = read('ai_studio_code.v2.4.0.backup.html');
const block = (html, name) => html.match(new RegExp('^// '+name+'_BEGIN$([\\s\\S]*?)^// '+name+'_END$', 'm'))[1];
// v2.6.0: the three asset tables moved to data/*.js. Compare the code with those tables removed, and the asset
// data itself (pack contents versus what the v2.4.0 file embedded).
const packs = require('./packs.cjs').readPacks().assets;
const oldBlock = block(old, 'SPRITE_ASSETS'), codeStart = text => text.slice(text.indexOf('const VOICE_PROFILES = '));
const oldTable = (name, next) => JSON.parse(oldBlock.slice(oldBlock.indexOf('const '+name+' = ')+name.length+9, oldBlock.indexOf(';\nconst '+next+' = ')));
assert.equal(codeStart(block(current, 'SPRITE_ASSETS')), codeStart(oldBlock), 'SPRITE_ASSETS code changed');
assert.deepEqual(packs.sprites, oldTable('SPRITE_SOURCES', 'STAGE_SOURCES'), 'Sprite data changed');
assert.deepEqual(packs.stages, oldTable('STAGE_SOURCES', 'VOICE_SOURCES'), 'Stage data changed');
assert.deepEqual(packs.voices, oldTable('VOICE_SOURCES', 'VOICE_PROFILES'), 'Voice data changed');
assert.equal(block(current, 'AUDIO_ENGINE'), block(old, 'AUDIO_ENGINE'), 'AUDIO_ENGINE changed');
const core = html => html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^\/\/ (SPRITE_ASSETS|AUDIO_ENGINE|BELT_ENGINE)_BEGIN$[\s\S]*?^\/\/ \1_END$/gm, '');
assert.equal(core(current), core(old), 'Shared game code changed');
let browser;
(async () => {
  browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_BIN || 'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe', args:['--mute-audio']});
  const context = await browser.newContext({viewport:{width:1280,height:800}});
  await context.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  const page = await context.newPage(), baseline = await context.newPage(), errors = [];
  for (const p of [page, baseline]) p.on('pageerror', e => errors.push(e.message));
  await page.goto(pathToFileURL(path.join(root,'ai_studio_code.html')).href);
  await baseline.goto(pathToFileURL(path.join(root,'ai_studio_code.v2.4.0.backup.html')).href);
  const signatures = () => {
    const methods = (klass, skip) => Object.fromEntries(Object.getOwnPropertyNames(klass.prototype).filter(k => !skip.includes(k)).map(k => {
      const code=klass.prototype[k].toString().replace(/\r\n/g,'\n');
      return [k,k==='constructor'?code.match(/constructor\([\s\S]*?\n  }/)[0]:code];
    }));
    // v2.6.0 retuned hit detection on purpose: STREET.hit and the methods listed after the draw methods are excluded
    // from the v2.4.0 comparison (tools/verify-hit.cjs covers them). Everything else must still match the baseline.
    const spec = {...STREET}; delete spec.version; delete spec.hit;
    return {actor:methods(StreetActor,['render']), street:methods(NeonUprising,['drawStreet','drawProp','drawItem','updateActor','playerInput','grabbable','attack','swing','pickup','enemyAI']), spec:JSON.stringify(spec)};
  };
  assert.deepEqual(await page.evaluate(signatures), await baseline.evaluate(signatures), 'Nonvisual street methods or balance changed');
  await baseline.close();
  const loaded = await page.evaluate(async () => {
    await Promise.all([FighterSprites.ready, StageArt.ready, BeltArt.ready]);
    return {images:BeltArt.images.size, districts:BeltArt.boards.size, props:BeltArt.props.length, bossPoses:[...BeltArt.bossCells.values()].flat().length, errors:BeltArt.errors,
      transparent:[...BeltArt.images].filter(([id])=>!id.startsWith('district')).map(([id,img])=>{
        const b=document.createElement('canvas'); b.width=img.width; b.height=img.height; const c=b.getContext('2d'); c.drawImage(img,0,0);const a=c.getImageData(0,0,b.width,b.height).data;let clear=0;for(let i=3;i<a.length;i+=4)if(a[i]<25)clear++;return {id,ratio:clear/(b.width*b.height)};
      })};
  });
  assert.equal(loaded.images,9); assert.equal(loaded.districts,5); assert.equal(loaded.props,8); assert.equal(loaded.bossPoses,72); assert.deepEqual(loaded.errors,[]);
  for(const a of loaded.transparent)assert(a.ratio>.35 && a.ratio<.9, a.id+' alpha');
  const stage = async (area, seam=false) => {
    await page.evaluate(({area,seam})=>{
      sound.playBGM=()=>{}; sound.announce=()=>{}; fighterVoice.play=()=>false;
      game.startStreet(4);const s=game.street; s.intro=0;s.bossIntro=0;s.area=area;s.tick=90;
      s.camera=seam ? area*1240-640 : Math.min(4920,area*1240);s.backWall=area*1240;s.gate=(area+1)*1240-50;s.locked=true;
      s.player.x=s.camera+280;s.player.y=557;s.player.weapon=8;s.player.pose('IDLE');s.enemies=[];
      s.spawnEnemy(area===4?'boss':'brute',s.camera+810,560);s.spawnEnemy('punk',s.camera+1030,590);
      s.props=[{type:'crate',x:s.camera+460,y:493,hp:48},{type:'crate',x:s.camera+565,y:500,hp:12},{type:'barrel',x:s.camera+1030,y:472,hp:48},{type:'barrel',x:s.camera+1130,y:483,hp:12}];
      s.items=['food','cash','pipe'].map((type,i)=>({type,x:s.camera+450+i*115,y:609,age:0}));game.draw();
    },{area,seam});
    await page.locator('#gameCanvas').screenshot({path:path.join(out,`art-v25-${seam?'seam':'district'}-${area}.png`)});
  };
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
    return {sharedImagesVoicesAndAudioIdentical:true,sharedGameIdentical:true,nonvisualStreetMethodsIdentical:true,pureDraw:true,randomCalls:calls,fallback:true,bossStates:true,meanRenderMs:renderMs};
  });
  const sheet = await page.evaluate(()=>{
    const b=document.createElement('canvas');b.width=1440;b.height=960;const c=b.getContext('2d');c.fillStyle='#1b2637';c.fillRect(0,0,b.width,b.height);c.imageSmoothingEnabled=false;
    for(let f=0;f<72;f++){
      const id=f>=48?'voss-throw':f>=24?'voss-motion':'voss-base',n=f%24,x=f%12*120,y=Math.floor(f/12)*160;
      c.drawImage(BeltArt.bossSheets.get(id),n%6*160,Math.floor(n/6)*160,160,160,x,y,120,120);
      c.fillStyle='#a9c9dc';c.font='12px monospace';c.fillText(String(f).padStart(2,'0'),x+4,y+142);
    }return b.toDataURL('image/png').split(',')[1];
  });
  fs.writeFileSync(path.join(out,'art-v25-voss-poses.png'),Buffer.from(sheet,'base64'));
  assert.deepEqual(errors,[]);
  const report={version:await page.evaluate(()=>STREET.version),loaded,checks,browserErrors:errors};
  fs.writeFileSync(path.join(out,'belt-art-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  await browser.close();
})().catch(async error=>{console.error(error);if(browser)await browser.close();process.exitCode=1;});
