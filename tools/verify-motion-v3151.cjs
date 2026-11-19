const {chromium}=require('playwright');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe'});
  try {
    const page=await browser.newPage(), errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
    await page.goto(pathToFileURL(path.resolve(__dirname,'../ai_studio_code.html')).href);
    const checks=await page.evaluate(async()=>{
      await Promise.all([BeltArt.ready,FighterSprites.ready]);
      const checks=[];
      function check(ok,label){if(!ok)throw Error(label);checks.push(label);}
      check(!BeltArt.errors.length&&!FighterSprites.errors.length,'art decoded');
      const update=game.update,draw=game.draw;
      let updates=0,draws=0;
      game.update=()=>updates++; game.draw=()=>draws++;
      for(const hz of [60,120,144]){
        lastTime=0;accumulator=0;firstDraw=false;updates=draws=0;
        for(let frame=1;frame<=hz;frame++)loop(frame*1000/hz+.001);
        check(updates===60&&draws===60,'60 ticks and draws at '+hz+'Hz');
      }
      lastTime=0;accumulator=0;updates=0;loop(STEP_MS*5.75);loop(STEP_MS*6.01);
      check(updates===6,'catch-up preserves fractional tick');
      game.update=update;game.draw=draw;
      for(const scene of ['TITLE','SELECT','RESULT','BATTLE','HUB','STREET_SELECT']){
        game.scene=scene;game.modalOpen=true;const tick=game.stageTick;
        input.just={Enter:true};game.update();check(game.stageTick===tick&&game.scene===scene&&!input.just.Enter,'help freezes '+scene);
      }
      game.modalOpen=false;sound.playBGM=()=>{};fighterVoice.play=()=>false;
      for(const character of CHARACTERS){
        check(FighterSprites.frame(character.id,'WALK_F',0,63,false)===2&&FighterSprites.frame(character.id,'WALK_F',3,63,false)===28,'walk starts with same foot: '+character.id);
      }
      for(const stage of [0,1,2,3]){
        game.startStreet(0,stage);const street=game.street, hero=street.player;
        street.intro=0;street.enemies=[];hero.x=street.gate-8;input.keys={ArrowRight:true};street.playerInput();
        check(hero.state==='IDLE','hero at wall '+stage);
        input.keys={ArrowLeft:true};street.playerInput();check(hero.state==='WALK_F'&&hero.gait===0,'first step '+stage);
        street.playerInput();check(Math.abs(hero.gait-1)<.001,'one stride '+stage);input.keys={};
      }
      for(const spec of Object.values(RESORT_ENEMIES).filter(spec=>spec.hue))check(BeltArt.beachPalettes.has(spec.resort+'-life:'+spec.hue),'prewarmed '+spec.name);
      game.startStreet(0,2);const street=game.street,enemy=street.spawnEnemy('azure',500,550);enemy.facing=1;
      for(let step=0;step<9;step++)enemy.walkTo(enemy.x-enemy.speed,enemy.y);
      {const pose=BeltArt.resortPose(enemy);check(enemy.walkBack&&!enemy.rush&&pose[0]==='azure-walk'&&pose[1]===7,'backstep plays the walk sheet in reverse');}
      // v3.21.0 [ANIM-219] enemy walk sheets
      for(const name of ['coral','azure','pearl','luka','misha','warlord']){
        const sheet=BeltArt.beachSheets.get(name+'-walk');check(!!sheet,'walk sheet loaded '+name);
        const info=BeltArt.cellAnchors('beach-'+name+'-walk',sheet,FighterSprites.pivotX+32),jog=name!=='warlord';
        const used=[0,1,2,3,4,5,6,7].concat(jog?[12,13,14,15,16,17,18,19]:[]);
        check(used.every(f=>info[f])&&[8,9,10,11,20,21,22,23].concat(jog?[]:[12,13,14,15,16,17,18,19]).every(f=>!info[f]),'walk sheet cells '+name);
        const hips=used.map(f=>info[f].hip),soles=[0,1,2,3,4,5,6,7].map(f=>info[f].bottom);
        check(Math.max(...hips)-Math.min(...hips)<=3,'enemy hips on one line '+name);check(Math.max(...soles)-Math.min(...soles)<=2,'enemy soles on one line '+name);
        const cells=new Set();for(let g=0;g<BeltArt.enemyWalkHold[name][0]*8;g++)cells.add(BeltArt.enemyWalkCell(name,g,false));check(cells.size===8&&Math.max(...cells)===7,'eight walk cells '+name);
        const jogs=new Set();for(let g=0;g<BeltArt.enemyWalkHold[name][1]*8;g++)jogs.add(BeltArt.enemyWalkCell(name,g,false,true));check(jogs.size===8&&Math.min(...jogs)===12&&Math.max(...jogs)===19,'eight jog cells '+name);
      }
      for(const spec of Object.values(RESORT_ENEMIES).filter(spec=>spec.hue))check(BeltArt.beachPalettes.has(spec.resort+'-walk:'+spec.hue),'walk sheet prewarmed '+spec.name);
      {const st=game.street,fwd=st.spawnEnemy('coral',700,550);fwd.facing=1;for(let i=0;i<3;i++)fwd.walkTo(fwd.x+fwd.speed,fwd.y,true);
        const pose=BeltArt.resortPose(fwd);check(pose[0]==='coral-walk'&&pose[1]===12,'far approach uses the jog cells');
        const probe=document.createElement('canvas');probe.width=probe.height=500;const pc=probe.getContext('2d');pc.translate(250,400);check(BeltArt.drawResortActor(fwd,pc)===true,'walk sheet draws');}
      for(const [stage,sheet] of [[0,'voss'],[1,'maw-walk'],[3,'warlord-walk']]){
        game.startStreet(0,stage);const st=game.street;st.intro=0;st.enemies=[];const boss=st.spawnEnemy('boss',700,550);boss.facing=1;const seen=new Set();
        for(let i=0;i<110;i++){boss.walkTo(boss.x+boss.speed,boss.y);
          if(sheet==='voss'){const f=BeltArt.bossFrame(boss,'WALK_F',boss.f);check(f>=72&&f<80,'boss walk cell '+stage);seen.add(f);}
          else{const pose=boss.monster?BeltArt.monsterPose(boss):BeltArt.resortPose(boss);check(pose[0]===sheet,'boss walk sheet '+stage);seen.add(pose[1]);}}
        check(seen.size===8,'boss walks through eight cells '+stage);
        const probe=document.createElement('canvas');probe.width=probe.height=700;const pc=probe.getContext('2d');pc.translate(350,600);
        check((boss.resort?BeltArt.drawResortActor(boss,pc):BeltArt.drawBoss(boss,pc,'WALK_F',boss.f))===true,'boss walk draws '+stage);
      }
      game.startStreet(0,2);const street2=game.street;
      enemy.walkTo(enemy.x,enemy.y,true);check(enemy.state==='IDLE'&&!enemy.rush,'no running in place');
      const hero=street.player;hero.z=40;hero.vz=2;hero.invuln=0;
      street.hurt(hero,1,1,false);street.updateActor(hero);check(hero.z===42&&hero.vz<2,'airborne light hit keeps moving');
      for(let tick=0;tick<50;tick++)street.updateActor(hero);
      check(hero.z===0&&hero.vz===0&&hero.state==='IDLE','airborne hit lands and recovers');
      street.startRising();enemy.pose('GRABBED');street.rising.targets=[enemy];enemy.z=40;
      street.kill(hero);street.respawn();check(!street.rising&&enemy.state==='HIT_AIR'&&hero.z===0&&hero.vz===0&&!hero.throwLanding,'KO clears interrupted rise and victim');
      game.startStreet(0,3);game.street.beginMetroEvent('arrival');for(let step=0,n=game.street.metroEvent.boardEnd+1;step<n;step++)game.street.updateMetroEvent(); // v3.22.0: the boarding beat is set when the event begins
      check(game.street.player.state==='IDLE','boarding actor stops at the door');
      const fighter=game.getPreviewFighter(0);fighter.state='SP_2';fighter.animTick=18;fighter.vy=-7;fighter.addGhost();fighter.animTick=35;fighter.vy=9;
      const shadow=fighter.ghosts.at(-1);check(shadow.animTick===18&&shadow.vy===-7,'afterimage keeps original motion');
      // v3.20.2 [ANIM-216]: the belt walk uses only the four matching base cells, each held for the same number of frames.
      // v3.21.0 [ANIM-217]: a character with a walk / run sheet uses its eight walk cells (72-79) and eight run cells (84-91).
      let withSheet=0;
      for(const data of CHARACTERS){
        const own=!!BeltArt.locomotion(data.id),first=own?72:2,count=own?8:4;withSheet+=own?1:0;
        const walker=new StreetActor(data,300,550,0,0),hold=own?BeltArt.strideHold+(data.id==='titan'?1:0):BeltArt.walkHold+(data.id==='titan'?1:0),seen=[];
        walker.facing=1;walker.pose('IDLE');
        for(let t=0;t<hold*count*2;t++){walker.walkTo(walker.x+walker.speed,walker.y);seen.push(walker.walkCell(false));}
        check(seen.every(cell=>cell>=first&&cell<first+count),'walk uses one matching set of cells '+data.id);
        // Run lengths, not exact frames: gait is a sum of distance / speed and may land a hair below a multiple of hold.
        const runs=[];for(const cell of seen){if(runs.length&&runs.at(-1)[0]===cell)runs.at(-1)[1]++;else runs.push([cell,1]);}
        check(runs.slice(0,-1).every(([cell,n],i)=>cell===first+i%count&&Math.abs(n-hold)<=1),'walk holds each cell for about '+hold+' frames in order '+data.id);
        walker.walkTo(walker.x,walker.y);walker.walkTo(walker.x-walker.speed,walker.y);
        const back=walker.walkCell(true);check(walker.walkBack&&back>=first&&back<first+count,'backward walk stays on the same cells '+data.id);
        if(own){
          const sheet=BeltArt.locomotion(data.id).atlas,g=sheet.getContext('2d',{willReadFrequently:true}),cell=FighterSprites.cell;
          const filled=f=>{const d=g.getImageData(f%6*cell,Math.floor(f/6)*cell,cell,cell).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>170)n++;return n;};
          check([0,1,2,3,4,5,6,7,12,13,14,15,16,17,18,19].every(f=>filled(f)>3000),'walk / run sheet has all sixteen figures '+data.id);
          check([8,9,10,11,20,21,22,23].every(f=>filled(f)===0),'unused cells of the walk / run sheet are empty '+data.id);
          const info=BeltArt.cellAnchors('hero-'+data.id+'-locomotion',sheet,FighterSprites.pivotX);
          const used=[0,1,2,3,4,5,6,7,12,13,14,15,16,17,18,19].map(f=>info[f]);
          check(Math.max(...used.map(c=>c.hip))-Math.min(...used.map(c=>c.hip))<=3,'hips stay on one line through walk and run '+data.id);
          check(Math.max(...used.slice(0,8).map(c=>c.bottom))-Math.min(...used.slice(0,8).map(c=>c.bottom))<=2,'walking soles stay on one line (2 px of edge softness allowed) '+data.id);
          check(Math.max(...used.slice(0,8).map(c=>c.h))-Math.min(...used.slice(0,8).map(c=>c.h))<=6,'body height varies by 6 px at most while walking '+data.id);
          const cells=new Set();for(let f=0;f<BeltArt.runHold*8;f++)cells.add(BeltArt.runCell(f));
          check(cells.size===8&&[...cells].every(f=>f>=12&&f<=19),'run loop uses the eight run cells '+data.id);
          const n=BeltArt.heroNudge(data.id,'-locomotion',15,'DASH_F'),n0=BeltArt.heroNudge(data.id,'-locomotion',12,'DASH_F');
          check(n&&n0&&n.y===n0.y,'flight cells of the run are not pulled down to the floor '+data.id);
          game.startStreet(CHARACTERS.indexOf(data),0);const s=game.street,p=s.player;s.intro=0;s.enemies=[];p.pose('STREET_DASH');
          const probe=document.createElement('canvas');probe.width=400;probe.height=400;const pc=probe.getContext('2d');pc.translate(200,330);
          check(BeltArt.drawDash(p,pc)===true,'dash draws from the walk / run sheet '+data.id);
        }
      }
      check(withSheet>=1&&BeltArt.locomotion('volt'),'VOLT has a walk / run sheet');
      check(FighterSprites.suffixOf(71)==='-throw'&&FighterSprites.suffixOf(72)==='-locomotion'&&FighterSprites.suffixOf(23)==='','cell ranges map to their sheets');
      { // Recoloured enemies that reuse a hero with a walk / run sheet get a recoloured copy of it as well.
        const palette=StreetPalettes.get('punk');check(palette&&palette.get('-locomotion')&&palette.get('-locomotion').atlas!==BeltArt.locomotion('volt').atlas,'enemy palette covers the walk / run sheet');
        check(FighterSprites.metroMasks.has('volt-locomotion'),'metro mask covers the walk / run sheet');
      }
      check(!('walkCell' in Fighter.prototype),'versus fighters keep the shared walk cycle');
      return checks;
    });
    if(errors.length)throw Error(errors.join('\n'));
    console.log(checks.length+' checks passed; no page errors');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
