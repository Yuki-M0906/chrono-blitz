const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{PNG}=require('pngjs'),{chromium}=require('playwright');
const png=PNG.sync.read(fs.readFileSync('assets/belt/art/actions-v343/titan.png'));assert.equal(png.width,1536);assert.equal(png.height,1024);
let clear=0;for(let i=3;i<png.data.length;i+=4)if(png.data[i]<24)clear++;assert(clear/(1536*1024)>.5,'transparent Titan');
(async()=>{const out=path.resolve('verification/hud-v343');fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({headless:true,executablePath:'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe'});
 try {const page=await b.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
 await page.goto(require('url').pathToFileURL(path.resolve('ai_studio_code.html')).href);
 const report=await page.evaluate(async()=>{
  await Promise.all([BeltArt.ready,FighterSprites.ready]);sound.init=()=>{};sound.playBGM=()=>{};sound.announce=()=>{};fighterVoice.play=()=>false;
  const checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n);};
  const setup=()=>{input.keys={};input.just={};game.startStreet(3);const s=game.street;s.intro=0;s.enemies=[];s.props=[];s.player.x=430;s.player.y=560;return s;};
  const canvas=document.createElement('canvas');canvas.width=canvas.height=400;const c=canvas.getContext('2d',{willReadFrequently:true});
  let s=setup();check(s.hudEnemy()===null,'empty HUD before contact');
  let e=s.spawnEnemy('brute',520,560);e.invuln=0;
  const render=dir=>{e.pose('IDLE');e.invuln=0;e.hp=e.maxHp;s.hurt(e,30,dir,true,'dash');check(e.burnDirection===dir,'capture launch '+dir);e.f=10;e.facing=1;c.clearRect(0,0,400,400);c.save();c.translate(200,300);BeltArt.drawBurn(e,c);c.restore();return c.getImageData(0,0,400,400).data;};
  const right=render(1),left=render(-1);let mirrorError=0,sameError=0;for(let y=0;y<400;y++)for(let x=0;x<400;x++){const a=(y*400+x)*4+3,b=(y*400+399-x)*4+3;mirrorError+=Math.abs(right[a]-left[b]);sameError+=Math.abs(right[a]-left[a]);}
  check(mirrorError<sameError*.02,'burn sprites mirror with launch direction even if facing changes');
  check(s.hudEnemy()===e&&e.label==='BRICK','burning enemy name and identity');
  const text=[],fill=c.fillText.bind(c);c.fillText=(t,...args)=>{text.push(t);fill(t,...args);};s.drawHUD(c);check(text.includes('BRICK')&&text.includes('BURN'),'HUD enemy name and burn label');
  check(text.includes((e.maxHp-30)+' / '+e.maxHp),'HUD real HP denominator');
  const before=JSON.stringify([e.hp,e.hudHp,e.burnDirection,s.hudTargetUntil]);s.drawHUD(c);check(before===JSON.stringify([e.hp,e.hudHp,e.burnDirection,s.hudTargetUntil]),'HUD draw is pure');
  e.pose('IDLE');e.hp=10;e.hudHp=e.maxHp;e.hudHold=24;s.updateActor(e);check(e.hudHp===e.maxHp,'damage band holds');for(let i=0;i<30;i++)s.updateActor(e);check(e.hudHp<e.maxHp&&e.hudHp>=e.hp,'damage band eases without overshoot');
  e.hp=0;s.kill(e);check(s.hudEnemy()===e,'KO remains in HUD');s.tick+=91;check(s.hudEnemy()===null,'KO target expires');
  const boss=s.spawnEnemy('boss',800,540);check(s.hudEnemy()===boss,'boss fallback');const grabbed=s.spawnEnemy('knife',470,560);s.beginGrab(grabbed);check(s.hudEnemy()===grabbed,'grab selects correct enemy');s.hurtHeld(10);check(s.hudTarget===grabbed,'grab attack retains target');
  const rects=[],rect=c.fillRect.bind(c);c.fillRect=(x,y,w,h)=>{rects.push(w);rect(x,y,w,h);};s.drawHealth(c,{hp:-40,maxHp:100,hudHp:200},0,0,400,20,'#fff');check(rects.every(w=>w>=0&&w<=406),'bar widths clamped');
  let panelCalls=0;const panel=STREET.panel;STREET.panel=(...args)=>{panelCalls++;return panel(...args);};try{e.dead=false;e.flashTimer=100;e.render(c);}finally{STREET.panel=panel;}check(panelCalls===0,'no overhead health panels');
  return {checks,mirrorError,sameError};
 });
 for(const dir of [1,-1]) {await page.evaluate(dir=>{game.startStreet(3);const s=game.street;s.intro=0;s.props=[];s.enemies=[];s.player.x=dir===1?470:790;s.player.y=550;s.player.facing=dir;s.player.hp=Math.round(s.player.maxHp*.67);s.player.hudHp=s.player.maxHp*.84;s.score=16750;s.combo=3;const e=s.spawnEnemy('brute',s.player.x+dir*120,550);e.invuln=0;s.hurt(e,120,dir,true,'dash');e.f=10;e.z=45;s.player.pose('DASH_ATTACK');s.player.f=12;game.draw();},dir);await page.locator('#gameCanvas').screenshot({path:path.join(out,'fire-'+(dir===1?'right':'left')+'.png')});}
 await page.evaluate(()=>{game.startStreet(3);const s=game.street;s.intro=0;s.props=[];s.enemies=[];s.player.x=480;s.player.y=560;s.player.pose('SP_2');s.player.f=18;s.player.z=90;const e=s.spawnEnemy('boss',900,560);e.hp=620;s.trackHudHit(e);game.draw();});await page.locator('#gameCanvas').screenshot({path:path.join(out,'titan-rise-hud.png')});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(report);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
