const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{PNG}=require('pngjs'),{chromium}=require('playwright');
const png=PNG.sync.read(fs.readFileSync('assets/belt/art/actions-v344/kagura.png'));assert.equal(png.width,1536);assert.equal(png.height,1024);
let clear=0;for(let i=3;i<png.data.length;i+=4)if(png.data[i]<24)clear++;assert(clear/(1536*1024)>.5,'transparent Kagura');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe'});try{
 const out=path.resolve('verification/idle-fire-v344');fs.mkdirSync(out,{recursive:true});
 const page=await b.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
 await page.goto(require('url').pathToFileURL(path.resolve('ai_studio_code.html')).href);
 const oldSource=fs.readFileSync('backups/v3.4.3/assets/sprites/renderer.js','utf8').replace('FighterSprites.load(SPRITE_SOURCES);','');
 const report=await page.evaluate(async oldSource=>{
  await Promise.all([FighterSprites.ready,BeltArt.ready]);sound.init=()=>{};sound.playBGM=()=>{};sound.announce=()=>{};fighterVoice.play=()=>false;
  const checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n);};
  const canvas=document.createElement('canvas');canvas.width=canvas.height=400;const c=canvas.getContext('2d',{willReadFrequently:true});
  for(let id=0;id<6;id++) {
   const a=game.getPreviewFighter(id);a.invuln=a.blockstun=0;a.throwFrame=null;
   const pictures=new Set();for(let tick=0;tick<72;tick+=6){a.animTick=tick;c.clearRect(0,0,400,400);a.drawBody(c,200,320,1,'IDLE',0,false);pictures.add(canvas.toDataURL());}
   check(pictures.size===1,'stable preview and shared idle '+a.data.id);
   check(new Set(Array.from({length:30},(_,t)=>FighterSprites.frame(a.data.id,'WALK_F',0,t,false))).size>1,'walking still animates '+a.data.id);
  }
  game.startStreet(0);let s=game.street;s.intro=0;s.enemies=[];s.props=[];const boss=s.spawnEnemy('boss',800,550);const poses=new Set();for(let t=0;t<72;t++){boss.animTick=t;poses.add(BeltArt.bossFrame(boss,'IDLE',0));}check(poses.size===1,'boss idle stable');
  const old=new Function(oldSource+';return FighterSprites;')();const oldAtlas=old.prepareAtlas(BeltArt.images.get('fx-fire'),'fx-fire'),fixed=BeltArt.actionSheets.get('fx-fire');
  const gutterPixels=(atlas,frame)=>{const cell=384,d=atlas.getContext('2d').getImageData(frame%6*cell,Math.floor(frame/6)*cell,cell,cell).data;let n=0;for(let y=0;y<cell;y++)for(let x=0;x<cell;x++)if((x<64||x>=320||y<64||y>=320)&&d[(y*cell+x)*4+3]>0)n++;return n;};
  const oldBleed=Array.from({length:6},(_,i)=>gutterPixels(oldAtlas,12+i));check(oldBleed.some(n=>n>0),'reproduced old down-frame contamination');
  for(let f=0;f<24;f++)check(gutterPixels(fixed,f)===0,'isolated fire cell '+f);
  s.enemies=[];const e=s.spawnEnemy('brute',650,550);e.invuln=0;s.hurt(e,70,1,true,'dash');let reached=false;
  for(let t=0;t<75;t++){s.updateActor(e);if(e.state==='KNOCKDOWN'){reached=true;check(e.z===0,'burn down stays grounded');}e.render(c);}
  check(reached&&e.burnTicks===0,'burn lands and ends normally');
  return {checks,oldBleed};
 },oldSource);
 await page.evaluate(()=>{game.startStreet(0);const s=game.street;s.intro=0;s.enemies=[];s.props=[];s.player.x=440;s.player.y=560;s.player.pose('SP_2');s.player.f=18;s.player.z=90;const e=s.spawnEnemy('brute',760,560);e.invuln=0;s.hurt(e,75,1,true,'dash');e.pose('KNOCKDOWN');e.f=15;e.z=0;game.draw();});await page.locator('#gameCanvas').screenshot({path:path.join(out,'kagura-and-fire-down.png')});
 await page.evaluate(()=>{const canvas=document.getElementById('gameCanvas'),c=canvas.getContext('2d');c.fillStyle='#172433';c.fillRect(0,0,1280,720);const a=game.street.enemies[0];for(let i=0;i<6;i++){a.x=110+i*210;a.y=340;a.state='KNOCKDOWN';a.f=i*5;a.burnTicks=60;a.z=0;a.render(c);STREET.text(c,'DOWN '+i,a.x,390,16,'#fff','center');a.y=580;a.burnDirection=-1;a.render(c);a.burnDirection=1;}});await page.locator('#gameCanvas').screenshot({path:path.join(out,'fire-down-cells.png')});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(report);
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
