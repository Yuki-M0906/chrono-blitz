const {chromium}=require('playwright'),assert=require('assert/strict'),path=require('path');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe'});try{
 const p=await b.newPage();await p.addInitScript(()=>window.requestAnimationFrame=()=>0);await p.goto(require('url').pathToFileURL(path.resolve('ai_studio_code.html')).href);
 const checks=await p.evaluate(()=>{sound.init=()=>{};sound.playBGM=()=>{};sound.announce=()=>{};fighterVoice.play=()=>false;const out=[];
 const check=(v,n)=>{if(!v)throw Error(n);out.push(n);};
 const setup=(id=0)=>{input.keys={};input.just={};game.startStreet(id);const s=game.street;s.intro=0;s.enemies=[];s.props=[];s.items=[];s.player.x=400;s.player.y=540;s.player.invuln=0;return s;};
 const key=(s,keys)=>{input.keys=keys;input.just={};s.playerInput();s.tick++;};
 let s=setup();key(s,{ArrowDown:true});s.tick+=25;key(s,{ArrowUp:true});check(s.rising,'25F input');
 s=setup();key(s,{KeyS:true});key(s,{KeyS:true,KeyW:true});check(s.rising,'overlapping key release');
 s=setup();key(s,{KeyS:true,KeyW:true});check(!s.rising,'fresh simultaneous keys rejected');
 s=setup();key(s,{KeyS:true});s.tick+=35;key(s,{KeyW:true});check(!s.rising,'expired command rejected');
 s=setup();key(s,{KeyS:true});s.resetDashTap();key(s,{KeyW:true});check(!s.rising,'pause clears input');
 s=setup();s.attack(s.player);s.player.f=12;key(s,{KeyS:true});key(s,{KeyW:true});check(!s.rising&&s.riseBuffered!=null,'recovery buffer');for(let i=0;i<6;i++){s.updateActor(s.player);key(s,{});}check(s.rising,'buffer triggers on recovery');
 s=setup();const rear=s.spawnEnemy('punk',370,540),front=s.spawnEnemy('punk',458,570);rear.invuln=front.invuln=0;key(s,{KeyD:true});check(s.grapple?.victim===front,'front grab ignores rear decoy');
 s=setup();const e=s.spawnEnemy('punk',440,577);e.invuln=0;key(s,{KeyS:true});check(s.grapple?.victim===e,'depth approach grab');
 for(let id=0;id<6;id++){s=setup(id);const a=s.player,e=s.spawnEnemy('punk',a.x+a.reach+25,a.y+47);e.hp=1000;e.invuln=0;s.attack(a);for(let f=0;f<11;f++)s.updateActor(a);check(e.hp<1000,'wider opening hit '+id);const damage=1000-e.hp;for(let f=0;f<3;f++)s.updateActor(a);check(1000-e.hp===damage,'one hit per swing '+id);}
 s=setup();const far=s.spawnEnemy('punk',440,600);far.invuln=0;far.hp=1000;s.attack(s.player);for(let i=0;i<12;i++)s.updateActor(s.player);check(far.hp===1000,'outside lane still misses');
 return out;});assert(checks.length>=20);console.log(JSON.stringify(checks,null,2));
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
