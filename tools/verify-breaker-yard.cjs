const path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage(),errors=[];page.on('pageerror',err=>errors.push(err.message));
    await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
    await page.goto(pathToFileURL(path.resolve('ai_studio_code.html')).href);
    const frames=await page.evaluate(async()=>{
      await Promise.all([BeltArt.ready,FighterSprites.ready]);sound.playBGM=()=>{};fighterVoice.play=()=>false;
      const check=(ok,label)=>{if(!ok)throw Error(label);},shots={};
      const sheet=BeltArt.images.get('yard-gt');check(sheet?.naturalWidth===1024&&sheet.naturalHeight===1536,'GT damage atlas decoded');
      for(let id=0;id<6;id++){
        game.startStreet(id,3);let street=game.street;street.finish(true);street.resultTick=50;
        const score=street.score;input.just={Enter:true};game.update();street=game.street;
        const yard=street.bonus,hero=street.player;check(yard&&street.score===score&&street.character===id&&!street.enemies.length,'handoff');
        for(let frame=0;frame<84;frame++)game.update();check(street.intro===0,'intro');
        game.paused=true;game.update();check(yard.elapsed===0,'clock paused');game.paused=false;
        const attack={damage:20,reach:100,depth:50};hero.x=100;street.swing(hero,attack);
        hero.x=350;hero.facing=-1;street.swing(hero,attack);hero.facing=1;hero.y=440;street.swing(hero,attack);
        check(yard.hp===yard.max,'miss distance direction depth');hero.y=552;
        street.swing(hero,attack);street.swing(hero,attack);check(yard.hp===yard.max-20,'one hit per swing');
        hero.x=940;hero.facing=-1;street.swing(hero,{...attack,carHit:false});check(yard.hp===yard.max-40,'right side');
        const first=id%2,dir=first?-1:1;
        hero.x=first?945:335;hero.facing=dir;
        let crossed=false;
        for(let frame=0;!street.result&&frame<5000;frame++){
          input.keys={};
          if(!yard.integrity[first]&&!crossed){
            check(!yard.finish&&yard.integrity[1-first]===yard.sideMax-20,'one side cannot finish');
            if(hero.facing===dir&&Math.abs(hero.x-640)>268){
              const hits=yard.hits,points=street.score;
              street.swing(hero,{damage:9999,reach:100,depth:80,carHit:false});
              check(yard.hits===hits&&street.score===points,'no score on wrecked side');
            }
            if(hero.y<585)input.keys.ArrowDown=true;
            else if((hero.x-(first?348:932))*dir<0)input.keys[first?'ArrowLeft':'ArrowRight']=true;
            else{input.keys[first?'ArrowRight':'ArrowLeft']=true;crossed=true;}
          }else if(frame%5===0)input.just={KeyJ:true};
          game.update();
          if(id===0&&shots[yard.level]===undefined&&(!yard.finish||street.result)){game.draw();shots[yard.level]=canvas.toDataURL('image/png').split(',')[1];}
        }
        check(crossed&&yard.hp===0&&street.result==='perfect'&&yard.award>=10000,'perfect using attack button '+id);
        check(street.score===score+yard.max*5+3000+yard.award,'one complete score award');
        for(let frame=0;frame<90;frame++)game.update();
        input.just={Enter:true};game.update();check(game.scene==='STREET'&&game.street.lift&&game.street.character===id&&game.street.score===street.score,'stage 5 handoff');
      }
      return shots;
    });
    if(errors.length)throw Error(errors.join('; '));
    const out='verification/breaker-yard';fs.mkdirSync(out,{recursive:true});
    for(const [level,data] of Object.entries(frames))fs.writeFileSync(path.join(out,'damage-'+level+'.png'),Buffer.from(data,'base64'));
    console.log('Six characters completed via attack input; damage states captured: '+Object.keys(frames).length);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
