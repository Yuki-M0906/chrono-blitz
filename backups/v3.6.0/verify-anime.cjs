// v3: complete art coverage, source consistency, exact v3.2.0 gameplay preservation and visual review.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {PNG}=require('pngjs'),{chromium}=require('playwright'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/design-v33');fs.mkdirSync(out,{recursive:true});
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
const hashes=JSON.parse(read('assets/characters/v33/baseline-hashes.json'));
for(const f of ['assets/audio/engine.js','assets/voices/engine.js','assets/voices/manifest.json','assets/voices/voicevox-config.json','assets/sprites/throws.js','assets/stages/renderer.js','assets/belt/art.js','data/stages.js','data/voices.js','data/belt-backgrounds.js'])assert.equal(hash(f),hashes[f],f+' preserved');
const core=h=>h.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^\/\/ (SPRITE_ASSETS|AUDIO_ENGINE|BELT_ENGINE)_BEGIN$[\s\S]*?^\/\/ \1_END$/gm,'');
assert.equal(core(read('ai_studio_code.html')),core(read('ai_studio_code.v3.2.0.backup.html')),'Entire shared gameplay and START_GATE preserved');
assert.equal(read('assets/belt/engine.js').replace("version: '3.3.0'","version: '3.2.0'"),read('assets/characters/v33/backup/assets__belt__engine.js'),'Street engine differs only in version');
const frame=s=>s.slice(s.indexOf('  frame('),s.indexOf('  draw('));
assert.equal(frame(read('assets/sprites/renderer.js')),frame(read('assets/characters/v33/backup/assets__sprites__renderer.js')),'Animation event mapping preserved');
const packs=require('./packs.cjs').readPacks().assets,manifest=JSON.parse(read('assets/belt/art/manifest.json'));
const assets=[...Object.entries(packs.sprites).map(([id,uri])=>({id,uri,file:'assets/sprites/design-v33/'+id+'.png',old:'assets/sprites/anime-v3/'+id+'.png'})),
 ...Object.entries(manifest.assets).filter(([id])=>/^(voss-|dash-)/.test(id)).map(([id,e])=>({id,uri:packs.beltArt[id].src,file:'assets/belt/art/'+e.file,old:'assets/belt/art/anime-v3/'+id+'.png'}))];
assert.equal(assets.length,27);
let rawPoses=0;const alpha=[];
for(const a of assets){
 const buf=fs.readFileSync(path.join(root,a.file)),png=PNG.sync.read(buf);assert.equal(png.width,1536);assert.equal(png.height,1024);
 assert.equal(a.uri,'data:image/png;base64,'+buf.toString('base64'),a.id+' packed source');assert.notEqual(hash(a.file),hash(a.old),a.id+' redrawn');
 let transparent=0,soft=0;for(let i=3;i<png.data.length;i+=4){if(png.data[i]<25)transparent++;else if(png.data[i]<255)soft++;}
 assert(transparent>png.width*png.height*.2,a.id+' true alpha');assert(soft>300,a.id+' antialiased linework');
 for(let f=0;f<24;f++){let visible=0;for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(png.data[((Math.floor(f/6)*256+y)*1536+f%6*256+x)*4+3]>32)visible++;assert(visible>1500,a.id+' frame '+f);rawPoses++;}
 alpha.push({id:a.id,transparent:transparent/(1536*1024),softPixels:soft});
}
assert.equal(packs.beltArt.props.src,'data:image/png;base64,'+fs.readFileSync(path.join(root,'assets/belt/art/props.png')).toString('base64'),'Props preserved');
let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe',args:['--mute-audio']});
 const context=await browser.newContext({viewport:{width:1440,height:940}});await context.addInitScript(()=>window.requestAnimationFrame=()=>0);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.join(root,'ai_studio_code.html')).href);
 const loaded=await page.evaluate(async()=>{await Promise.all([FighterSprites.ready,BeltArt.ready,StageArt.ready]);sound.init=()=>{};sound.playBGM=()=>{};sound.announce=()=>{};fighterVoice.play=()=>false;return{shared:FighterSprites.sheets.size,boss:BeltArt.bossSheets.size,dash:BeltArt.dashSheets.size,errors:[...FighterSprites.errors,...BeltArt.errors],cell:FighterSprites.cell,scale:FighterSprites.visualScale};});
 assert.deepEqual(loaded,{shared:18,boss:3,dash:6,errors:[],cell:384,scale:1.15});
 const cells=await page.evaluate(()=>{
  const all=[...[...FighterSprites.sheets].map(([id,s])=>[id,s.atlas]),...BeltArt.bossSheets,...[...BeltArt.dashSheets].map(([id,s])=>['dash-'+id,s])];
  let nonempty=0;const clipping=[];
  for(const [id,sheet] of all)for(let f=0;f<24;f++){
   const box=BeltArt.bounds(sheet.getContext('2d'),f%6*FighterSprites.cell,Math.floor(f/6)*FighterSprites.cell,FighterSprites.cell,FighterSprites.cell);if(box.count>1000)nonempty++;
   if(box.x%FighterSprites.cell===0||box.y%FighterSprites.cell===0||box.x%FighterSprites.cell+box.w>=FighterSprites.cell||box.y%FighterSprites.cell+box.h>=FighterSprites.cell)clipping.push({id,f,box});
  }return{nonempty,clipping};
 });assert.equal(cells.nonempty,648);assert.deepEqual(cells.clipping,[],'No cached cell outer-edge clipping');
 for(const id of ['kagura','volt','freya','titan','ayame','celine','voss']){
  const data=await page.evaluate(id=>{
   const b=document.createElement('canvas');b.width=1920;b.height=id==='voss'?1080:1440;const c=b.getContext('2d');c.fillStyle='#172330';c.fillRect(0,0,b.width,b.height);c.imageSmoothingEnabled=true;c.font='14px monospace';
   const sheets=id==='voss'?[...BeltArt.bossSheets.values()]:['','-motion','-throw'].map(s=>FighterSprites.sheets.get(id+s).atlas).concat(BeltArt.dashSheets.get(id));
   for(let k=0;k<sheets.length;k++)for(let f=0;f<24;f++){
    const x=f%12*160,y=k*360+Math.floor(f/12)*180;c.drawImage(sheets[k],f%6*FighterSprites.cell,Math.floor(f/6)*FighterSprites.cell,FighterSprites.cell,FighterSprites.cell,x,y,160,160);c.fillStyle='#b8d5e5';c.fillText((['BASE','MOTION','THROW','DASH'][k])+' '+f,x+4,y+174);
   }return b.toDataURL().split(',')[1];
  },id);fs.writeFileSync(path.join(out,id+'-all-poses.png'),Buffer.from(data,'base64'));
 }
 await page.evaluate(()=>{game.awaitStart=false;game.openHub();game.draw();});await page.locator('#gameCanvas').screenshot({path:path.join(out,'hub.png')});
 for(let id=0;id<6;id++){
  await page.evaluate(id=>{game.mode=2;game.p1Char=id;game.p2Char=(id+1)%6;game.startMatch();game.f1.x=510;game.f2.x=1040;game.f1.animTick=0;game.f2.animTick=0;game.draw();},id);
  await page.locator('#gameCanvas').screenshot({path:path.join(out,'versus-'+id+'.png')});
  await page.evaluate(id=>{game.startStreet(id);const s=game.street;s.intro=0;s.enemies=[];s.player.x=330;s.player.y=570;s.player.invuln=0;s.spawnEnemy('punk',670,550);s.spawnEnemy('boss',960,580);game.draw();},id);
  await page.locator('#gameCanvas').screenshot({path:path.join(out,'street-'+id+'.png')});
 }
 const purity=await page.evaluate(()=>{const s=game.street,snap=()=>JSON.stringify(s,(k,v)=>k==='owner'?undefined:v),before=snap();let calls=0;const random=Math.random;Math.random=()=>{calls++;return .5;};const start=performance.now();for(let i=0;i<90;i++)s.draw(ctx);const meanMs=(performance.now()-start)/90;Math.random=random;return{unchanged:before===snap(),randomCalls:calls,meanMs};});
 assert(purity.unchanged);assert.equal(purity.randomCalls,0);assert.deepEqual(errors,[]);
 const report={version:'3.3.0',rawPoses,cachedPoses:cells.nonempty,loaded,preservedGameplay:true,preservedAudioAndScenery:true,purity,alpha,browserErrors:errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,alpha:undefined},null,2));await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
