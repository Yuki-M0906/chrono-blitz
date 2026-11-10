// v2.8.1: start gate on the game select screen (HUB). Browsers keep audio locked until a user gesture, so the first
// click / key press on the HUB only starts the music and does not pick a game. Uses real mouse and key events.
// Run: node tools/verify-start.cjs
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');let browser;
// Peak level at the master output over ~0.8 s, plus the state the music scheduler is in.
const probe=page=>page.evaluate(async()=>{
 const s=sound;if(!s.ctx)return {ctx:false,scene:game.scene,gate:!!game.awaitStart};
 if(!window.__an){window.__an=s.ctx.createAnalyser();window.__an.fftSize=2048;s.master.connect(window.__an);}
 let peak=0;const buf=new Float32Array(2048);
 for(let i=0;i<16;i++){window.__an.getFloatTimeDomainData(buf);for(const v of buf)peak=Math.max(peak,Math.abs(v));await new Promise(r=>setTimeout(r,50));}
 return {ctx:true,state:s.ctx.state,track:s.currentTrack,timer:!!s.timer,music:[...s.active].filter(v=>v.group==='music').length,peak:+peak.toFixed(3),scene:game.scene,gate:!!game.awaitStart};
});
const frames=(page,n=4)=>page.waitForTimeout(n*17+40);
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe'});
 const out={},errors=[];const check=(b,m)=>{assert(b,m);out[m]=true;};
 const open=async()=>{const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.join(root,'ai_studio_code.html')).href);
  await page.evaluate(()=>Promise.all([FighterSprites.ready,StageArt.ready,BeltArt.ready]));await page.waitForTimeout(900);return page;};
 // Canvas position of a point given in game coordinates (1280x720).
 const at=async(page,x,y)=>{const r=await page.evaluate(()=>{const b=canvas.getBoundingClientRect();return {x:b.left,y:b.top,w:b.width,h:b.height};});return [r.x+x*r.w/1280,r.y+y*r.h/720];};

 // 1. Mouse only: the first click on a game card starts the music and stays on the HUB.
 let page=await open(),s=await probe(page);const version=await page.evaluate(()=>STREET.version);
 check(s.ctx===false&&s.gate===true&&s.scene==='HUB','Boot waits on the HUB with audio still locked');
 await page.mouse.move(...await at(page,900,400));await frames(page);s=await probe(page);
 check(s.ctx===false&&s.gate===true,'Moving the mouse does not start anything');
 await page.mouse.click(...await at(page,900,400));await frames(page);s=await probe(page);
 check(s.scene==='HUB'&&s.gate===false,'First click on a card is consumed by the start gate');
 check(s.state==='running'&&s.track===0&&s.timer&&s.music>0&&s.peak>0.02,'HUB music is audible after the first click (peak='+s.peak+')');
 await page.screenshot({path:path.join(root,'verification/start-hub-playing.png')});
 await page.mouse.click(...await at(page,900,400));await frames(page);s=await probe(page);
 check(s.scene==='STREET_SELECT'&&s.track===0&&s.peak>0.02,'Second click picks the game and the music keeps playing');
 await page.keyboard.press('Escape');await frames(page);s=await probe(page);
 check(s.scene==='HUB'&&s.gate===false,'Returning to the HUB does not ask again');
 await page.context().close();

 // 2. Keyboard only: Enter as the very first key starts the music instead of leaving the HUB.
 page=await open();await page.screenshot({path:path.join(root,'verification/start-gate.png')});
 await page.keyboard.press('Enter');await frames(page);s=await probe(page);
 check(s.scene==='HUB'&&s.gate===false&&s.state==='running'&&s.track===0&&s.peak>0.02,'First Enter starts the HUB music and stays (peak='+s.peak+')');
 const before=await page.evaluate(()=>game.hubChoice||0);
 await page.keyboard.press('ArrowRight');await frames(page);
 check(await page.evaluate(()=>game.hubChoice||0)===1-before,'Cursor keys work after the gate');
 await page.keyboard.press('Enter');await frames(page);s=await probe(page);
 check(s.scene!=='HUB'&&s.peak>0.02,'Next Enter picks the game');
 await page.context().close();

 // 3. Escape and modifier keys keep the gate closed (Chrome may or may not unlock audio on them); the next real key opens it.
 page=await open();await page.keyboard.press('Escape');await page.keyboard.press('Shift');await frames(page);s=await probe(page);
 check(s.gate===true&&s.scene==='HUB','Escape and Shift do not open the gate');
 await page.keyboard.press('KeyJ');await frames(page);s=await probe(page);
 check(s.gate===false&&s.scene==='HUB'&&s.state==='running'&&s.peak>0.02,'A real key after them starts the music (peak='+s.peak+')');
 await page.context().close();

 // 4. Touching the toolbar or the page margin first also starts the music and skips the gate.
 page=await open();const box=await page.locator('#bgmVol').boundingBox();
 await page.mouse.click(box.x+box.width*0.6,box.y+box.height/2);await frames(page);s=await probe(page);
 check(s.gate===false&&s.scene==='HUB'&&s.state==='running'&&s.track===0&&s.peak>0.02,'Volume slider as the first touch starts the music (peak='+s.peak+')');
 await page.context().close();
 page=await open();await page.click('#btnMute');await frames(page);s=await probe(page);
 check(s.gate===false&&s.scene==='HUB'&&s.state==='running'&&s.track===0&&await page.evaluate(()=>sound.muted)===true,'Mute button as the first touch unlocks audio in the muted state');
 await page.click('#btnMute');await frames(page);s=await probe(page);
 check(s.peak>0.02,'Unmuting plays the HUB music (peak='+s.peak+')');
 await page.context().close();

 // 5. The gate lives only on the HUB and drawing it is pure.
 page=await open();
 const pure=await page.evaluate(()=>{const snap=()=>JSON.stringify([game.scene,game.awaitStart,game.stageTick,game.hubChoice||0,sound.seed,!!sound.ctx]);const a=snap();for(let i=0;i<5;i++)game.draw();return a===snap();});
 check(pure,'Drawing the gate changes no state');
 const direct=await page.evaluate(()=>{sound.playBGM=()=>{};game.startStreet(0);const s=game.street;s.intro=0;const x=s.player.x;input.keys.ArrowRight=true;for(let i=0;i<10;i++)game.update();return {scene:game.scene,moved:s.player.x>x};});
 check(direct.scene==='STREET'&&direct.moved,'Starting a game directly is not blocked by the gate');
 await page.context().close();

 fs.writeFileSync(path.join(root,'verification/start-report.json'),JSON.stringify({version,checks:out,browserErrors:errors},null,2));
 console.log(JSON.stringify({checks:out,browserErrors:errors},null,2));
 assert.deepEqual(errors,[]);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>browser&&browser.close());
