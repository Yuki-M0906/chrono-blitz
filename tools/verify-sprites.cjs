// Run with Node and Playwright available (NODE_PATH may point to the bundled packages).
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'ai_studio_code.html'), 'utf8');
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(code);
assert.equal((code.match(/data:image\/png;base64,/g) || []).length, 22);
assert.equal((code.match(/data:audio\/wav;base64,/g) || []).length, 126);
const { chromium } = require('playwright');
let browser;

(async () => {
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN ||
    path.join(os.homedir(), 'AppData/Local/Google/Chrome/Application/chrome.exe') });
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addInitScript(() => {
    window.requestAnimationFrame = () => 0; // Advance simulation explicitly, independent of wall clock.
    Date.now = () => 1000;
  });
  const current = await context.newPage();
  const baseline = await context.newPage();
  for (const page of [current, baseline]) page.on('pageerror', error => errors.push(error.message));
  await current.goto(pathToFileURL(path.join(root, 'ai_studio_code.html')).href);
  await baseline.goto(pathToFileURL(path.join(root, 'ai_studio_code.v1.6.0.backup.html')).href);
  const loaded = await current.evaluate(async () => {
    await FighterSprites.ready;
    await StageArt.ready;
    game.draw();
    return { count: FighterSprites.sheets.size, errors: FighterSprites.errors, stages:StageArt.artwork.size, stageErrors:StageArt.errors };
  });
  assert.deepEqual(loaded, { count: 18, errors: [], stages:4,stageErrors:[] });
  await current.screenshot({ path: path.join(root, 'verification/title.png') });

  const simulate = () => {
    let seed = 123456;
    Math.random = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
    sound.init = () => {}; sound.playBGM = () => {}; sound.announce = () => {};
    const result = [];
    for (let id = 0; id < 6; id++) {
      game.mode = 2; game.p1Char = id; game.p2Char = (id + 1) % 6; game.startMatch();
      game.f1.x = 700; game.f2.x = 810;
      game.f1.meter = 100; game.f2.meter = 100;
      for (let t = 0; t < 480; t++) {
        input.keys = {}; input.just = {};
        if (t % 80 < 30) input.keys.KeyD = true;
        if (t % 100 < 40) input.keys.ArrowLeft = true;
        if (t % 89 === 0) input.keys.KeyW = true;
        if (t % 47 === 0) input.just.KeyJ = true;
        if (t % 61 === 0) input.just.KeyK = true;
        // Throw choreography intentionally differs; verify it separately in verify-throws.cjs.
        if (t % 103 === 0 && id !== 3) input.just.KeyL = true;
        if (t === 240) input.just.KeyU = true;
        if (t === 300) input.just.KeyO = true;
        if (t % 37 === 0) input.just.KeyM = true;
        if (t % 73 === 0 && (id+1)%6 !== 3) input.just.Comma = true;
        game.update();
        result.push([id, t, game.timer, game.hitstop, game.superFreeze,
          ...[game.f1, game.f2].flatMap(f => [f.x, f.y, f.vx, f.vy, f.hp, f.meter, f.state, f.f, f.hitstun,
            f.blockstun, f.combo, f.hasHit, f.burstReady]), game.projs.length]);
      }
    }
    return result;
  };
  const after = await current.evaluate(simulate);
  const before = await baseline.evaluate(simulate);
  assert.deepEqual(after, before, 'Rendering integration must preserve combat simulation');

  const behavior = await current.evaluate(() => {
    const f = game.f1;
    f.setState('ATK_H'); f.f = 8;
    const snapshot = () => JSON.stringify(f, (key, value) => key === 'battle' ? undefined : value);
    const before = snapshot();
    for (let i = 0; i < 20; i++) f.draw(ctx);
    const pure = before === snapshot();
    game.paused = true;
    const tick = f.animTick;
    for (let i = 0; i < 10; i++) { game.update(); game.draw(); }
    const pause = tick === f.animTick;
    game.paused = false; game.hitstop = 5;
    game.update(); game.draw();
    const hitstop = tick === f.animTick;
    return { pure, pause, hitstop,
      weak: [2, 3, 7, 8].map(n => FighterSprites.frame('kagura', 'ATK_L', n, 0, false)),
      strong: [5, 6, 13, 14].map(n => FighterSprites.frame('freya', 'ATK_H', n, 0, false)) };
  });
  assert.deepEqual(behavior, { pure: true, pause: true, hitstop: true, weak: [8, 9, 33, 36], strong: [8, 10, 35, 36] });

  const additions = await current.evaluate(() => {
    const results = [];
    for (const id of [4,5]) for (const special of ['SP_1','SP_2','SP_3','SUPER']) {
      game.mode=3;game.p1Char=id;game.p2Char=0;game.startMatch();
      game.f1.x=680;game.f2.x=780;
      if(special==='SUPER') game.f1.setState('SUPER'); else game.f1.doSpecial(special,false,game);
      let emitted=0,active=0;
      const neutral={up:false,down:false,left:false,right:false,light:false,heavy:false,special:false,superBtn:false,throwBtn:false,burstBtn:false};
      for(let n=0;n<120;n++) {game.f1.update(neutral,game.f2,game);if(game.f1.getHitbox())active++;emitted=Math.max(emitted,game.projs.length);}
      results.push({ id:CHARACTERS[id].id,special,emitted,active,recovered:game.f1.state==='IDLE'&&game.f1.y===580 });
    }
    const coverage={};
    for(const id of CHARACTERS.map(c=>c.id)) {
      const idle=new Set(),walk=new Set();for(let t=0;t<36;t++){idle.add(FighterSprites.frame(id,'IDLE',t,t,false));walk.add(FighterSprites.frame(id,'WALK_F',t,t,false));}
      coverage[id]={idle:idle.size,walk:walk.size};
    }
    // Inspect all decoded cells to catch empty/missing frames.
    let nonempty=0;
    for(const sheet of FighterSprites.sheets.values()) {
      const c=sheet.atlas.getContext('2d');
      for(let n=0;n<24;n++) {const p=c.getImageData(n%6*160,Math.floor(n/6)*160,160,160).data;let visible=0;for(let i=3;i<p.length;i+=4)if(p[i]>32)visible++;if(visible>100)nonempty++;}
    }
    return {characters:CHARACTERS.length,stages:STAGES.length,results,coverage,nonempty};
  });
  assert.equal(additions.characters,6);assert.equal(additions.stages,4);assert.equal(additions.nonempty,432);
  for(const r of additions.results){assert.equal(r.recovered,true,JSON.stringify(r));assert.ok(r.special==='SP_1'?r.emitted>0:r.active>0,JSON.stringify(r));}
  for(const c of Object.values(additions.coverage))assert.deepEqual(c,{idle:6,walk:8});

  await current.evaluate(() => {
    game.p1Char=4; game.p2Char=5; game.toSelect(2); game.update(); game.draw();
  });
  await current.screenshot({ path: path.join(root, 'verification/select.png') });
  await current.evaluate(() => {
    game.p1Char = 4; game.p2Char = 5; game.stageIdx=3; game.startMatch();
    game.f1.x = 620; game.f2.x = 820; game.bannerTimer = 0;
    game.f1.setState('ATK_H'); game.f1.f = 8;
    game.f2.setState('IDLE'); game.f2.blockstun = 10;
    game.shake = 0; game.superFreeze = 0; game.flash = 0; game.draw();
  });
  await current.screenshot({ path: path.join(root, 'verification/battle.png') });

  // Readable visual audit: all 432 source poses on a dark opaque backdrop.
  await current.evaluate(() => {
    document.getElementById('toolbar').style.display = 'none';
    const board = document.createElement('canvas'); board.width = 1536; board.height = 5184;
    const c = board.getContext('2d');
    c.fillStyle = '#10192b'; c.fillRect(0, 0, board.width, board.height);
    const states = ['IDLE','IDLE','WALK_F','WALK_F','WALK_F','WALK_F','CROUCH','JUMP',
      'ATK_H','ATK_L','ATK_H','ATK_H','ATK_C_H','ATK_J_H','SP_1','SP_2','DASH_F','SUPER',
      'HIT_STAND','HIT_AIR','KNOCKDOWN','IDLE','THROW','VICTORY'];
    for (let k = 0; k < 6; k++) {
      const f = new Fighter(CHARACTERS[k], k % 2, 0, 1);
      for (let i = 0; i < 72; i++) {
        const sheet = FighterSprites.sheets.get(f.data.id+(i>=48?'-throw':i>=24?'-motion':'')).atlas;
        const local=i%24;
        const x = (i % 12) * 128, y = k * 864 + Math.floor(i / 12) * 144;
        c.fillStyle = '#a9bfd3'; c.font = '11px sans-serif';
        c.fillText(f.data.name + ' / ' + i, x + 5, y + 13);
        c.imageSmoothingEnabled = false;
        c.drawImage(sheet, (local % 6) * 160, Math.floor(local / 6) * 160, 160, 160, x, y + 16, 128, 128);
      }
    }
    window.auditImage = board.toDataURL();
  });
  const audit = await current.evaluate(() => window.auditImage.split(',')[1]);
  fs.writeFileSync(path.join(root, 'verification/poses.png'), Buffer.from(audit, 'base64'));
  const stageAudit=await current.evaluate(()=>{
    const c=document.createElement('canvas');c.width=1280;c.height=720;const g=c.getContext('2d');
    for(let i=0;i<4;i++){g.save();g.translate(i%2*640,Math.floor(i/2)*360);g.beginPath();g.rect(0,0,640,360);g.clip();g.scale(.5,.5);StageArt.draw(g,i,0,200);g.fillStyle='rgba(4,8,20,.7)';g.fillRect(0,0,1280,60);g.fillStyle='#fff';g.font='bold 28px sans-serif';g.fillText(STAGES[i].short,30,40);g.restore();}
    return c.toDataURL().split(',')[1];
  });
  fs.writeFileSync(path.join(root,'verification/stages.png'),Buffer.from(stageAudit,'base64'));

  // Exercise the real requestAnimationFrame loop and actual keyboard event wiring.
  const liveContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const live = await liveContext.newPage();
  live.on('pageerror', error => errors.push(error.message));
  await live.goto(pathToFileURL(path.join(root, 'ai_studio_code.html')).href);
  await live.evaluate(async () => {
    await FighterSprites.ready;
    sound.init = () => {}; sound.playBGM = () => {}; sound.announce = () => {};
    game.mode = 3;
  });
  await live.keyboard.press('Enter');
  await live.waitForFunction(() => game.scene === 'TITLE');
  await live.keyboard.press('Enter');
  await live.waitForFunction(() => game.scene === 'SELECT');
  for(let i=0;i<4;i++) {
    const rect=await live.evaluate(i=>game.stageCard(i),i);
    const box=await live.locator('canvas').boundingBox();
    await live.mouse.click(box.x+(rect.x+rect.w/2)*box.width/1280,box.y+(rect.y+40)*box.height/720);
    await live.waitForFunction(i=>game.stageIdx===i,i);
    assert.equal(await live.evaluate(()=>game.scene),'SELECT');
  }
  await live.keyboard.press('ArrowUp');await live.waitForFunction(()=>game.stageIdx===2);
  await live.keyboard.press('ArrowDown');await live.waitForFunction(()=>game.stageIdx===3);
  for(let i=0;i<4;i++) {await live.keyboard.press('ArrowRight');await live.waitForFunction(i=>game.p1Char===i+1,i);}
  await live.keyboard.press('Enter');
  await live.waitForFunction(() => game.selectStep === 1);
  const last=await live.evaluate(()=>game.characterCard(5));
  const box=await live.locator('canvas').boundingBox();
  await live.mouse.click(box.x+(last.x+last.w/2)*box.width/1280,box.y+(last.y+last.h/2)*box.height/720);
  await live.waitForFunction(() => game.scene === 'BATTLE' && game.f1.animTick > 5);
  assert.deepEqual(await live.evaluate(()=>[game.f1.data.id,game.f2.data.id,game.stageIdx]),['ayame','celine',3]);
  const startX = await live.evaluate(() => game.f1.x);
  await live.keyboard.down('KeyD');
  await live.waitForFunction(x => game.f1.x > x + 25, startX);
  await live.keyboard.up('KeyD');
  await live.keyboard.press('KeyH');
  const frozen = await live.evaluate(() => ({ open: game.modalOpen, tick: game.f1.animTick }));
  await live.waitForTimeout(120);
  assert.equal(await live.evaluate(() => game.f1.animTick), frozen.tick);
  assert.equal(frozen.open, true);
  await live.keyboard.press('Escape');
  await live.waitForFunction(tick => !game.modalOpen && game.f1.animTick > tick, frozen.tick);
  await live.keyboard.press('Escape');
  assert.equal(await live.evaluate(() => game.paused), true);
  await liveContext.close();

  // Actual Web Audio decoding/output after a trusted user gesture; Chrome itself is muted.
  const audioContext = await browser.newContext({ viewport:{width:1280,height:800} });
  await audioContext.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  const voicePage=await audioContext.newPage();
  voicePage.on('pageerror',error=>errors.push(error.message));
  await voicePage.goto(pathToFileURL(path.join(root,'ai_studio_code.html')).href);
  await voicePage.locator('#gameCanvas').click({position:{x:50,y:50}});
  const decoded=await voicePage.evaluate(async()=>{
    await fighterVoice.ready;
    fighterVoice.debug=true;
    const analyzer=sound.ctx.createAnalyser();analyzer.fftSize=2048;fighterVoice.gain.connect(analyzer);window.voiceAnalyzer=analyzer;
    return {count:fighterVoice.buffers.size,errors:fighterVoice.errors,
      nonSilent:[...fighterVoice.buffers.values()].filter(b=>b.getChannelData(0).some(v=>Math.abs(v)>.005)).length};
  });
  assert.deepEqual(decoded,{count:126,errors:[],nonSilent:126});
  for(let id=0;id<6;id++) {
    await voicePage.evaluate(id=>{game.mode=3;game.p1Char=id;game.p2Char=(id+1)%6;game.startMatch();game.f1.setState('SP_1');},id);
    await voicePage.waitForFunction(id=>fighterVoice.channels.get(0)?.key===CHARACTERS[id].id+'-sp1',id,{polling:20});
    await voicePage.waitForFunction(()=>{const a=new Float32Array(2048);voiceAnalyzer.getFloatTimeDomainData(a);return a.some(v=>Math.abs(v)>.001);},null,{polling:20});
    const priority=await voicePage.evaluate(()=>{
      game.f1.setState('SUPER');const key=fighterVoice.channels.get(0)?.key;
      game.f1.setState('ATK_L');return {key,after:fighterVoice.channels.get(0)?.key};
    });
    assert.ok(priority.key.endsWith('-super'));assert.equal(priority.key,priority.after);
  }
  const mixing=await voicePage.evaluate(()=>{
    fighterVoice.stopAll();game.f1.setState('SP_2');game.f2.setState('SP_3');
    const channels=fighterVoice.channels.size;
    const replay=fighterVoice.play(game.f1.data.id,'sp2',0,75);
    fighterVoice.volume=0;fighterVoice.updateVolume();
    const mutedChannels=fighterVoice.channels.size,mutedPlay=fighterVoice.play(game.f1.data.id,'super',0,100);
    fighterVoice.volume=.85;fighterVoice.updateVolume();
    game.f1.setState('SP_1');game.paused=false;game.togglePause();
    const pausedChannels=fighterVoice.channels.size;
    game.paused=false;game.f1.setState('SP_1');toggleModal(true);
    const modalChannels=fighterVoice.channels.size;toggleModal(false);
    sound.muted=true;sound.updateVol();const globalMute=fighterVoice.play(game.f1.data.id,'super',0,100);
    return {channels,replay,mutedChannels,mutedPlay,pausedChannels,modalChannels,globalMute};
  });
  assert.deepEqual(mixing,{channels:2,replay:false,mutedChannels:0,mutedPlay:false,pausedChannels:0,modalChannels:0,globalMute:false});
  await audioContext.close();
  assert.deepEqual(errors, []);
  const report = { syntax: 'passed', embeddedAtlases: loaded.count, decodeErrors: loaded.errors,
    backgrounds:loaded.stages,stageErrors:loaded.stageErrors,voice:{decoded,mixing,actualOutput:'non-zero signal for all six fighters'},
    regressionFrames: after.length, nonThrowCombatMatchesV160: true, behavior, additions,
    liveKeyboardAndAnimation: 'passed', browserErrors: errors };
  fs.writeFileSync(path.join(root, 'verification/report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch(async error => { console.error(error); if (browser) await browser.close(); process.exitCode = 1; });
