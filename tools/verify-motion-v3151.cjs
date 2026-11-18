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
      check(enemy.walkBack&&!enemy.rush&&BeltArt.resortPose(enemy)[1]===9,'backstep uses reverse contact');
      enemy.walkTo(enemy.x,enemy.y,true);check(enemy.state==='IDLE'&&!enemy.rush,'no running in place');
      const hero=street.player;hero.z=40;hero.vz=2;hero.invuln=0;
      street.hurt(hero,1,1,false);street.updateActor(hero);check(hero.z===42&&hero.vz<2,'airborne light hit keeps moving');
      for(let tick=0;tick<50;tick++)street.updateActor(hero);
      check(hero.z===0&&hero.vz===0&&hero.state==='IDLE','airborne hit lands and recovers');
      street.startRising();enemy.pose('GRABBED');street.rising.targets=[enemy];enemy.z=40;
      street.kill(hero);street.respawn();check(!street.rising&&enemy.state==='HIT_AIR'&&hero.z===0&&hero.vz===0&&!hero.throwLanding,'KO clears interrupted rise and victim');
      game.startStreet(0,3);game.street.beginMetroEvent('arrival');for(let step=0;step<333;step++)game.street.updateMetroEvent();
      check(game.street.player.state==='IDLE','boarding actor stops at the door');
      const fighter=game.getPreviewFighter(0);fighter.state='SP_2';fighter.animTick=18;fighter.vy=-7;fighter.addGhost();fighter.animTick=35;fighter.vy=9;
      const shadow=fighter.ghosts.at(-1);check(shadow.animTick===18&&shadow.vy===-7,'afterimage keeps original motion');
      return checks;
    });
    if(errors.length)throw Error(errors.join('\n'));
    console.log(checks.length+' checks passed; no page errors');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
