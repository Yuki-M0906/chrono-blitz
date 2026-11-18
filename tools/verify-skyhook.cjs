const path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required'],executablePath:process.env.CHROME_BIN||'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
    await page.goto(pathToFileURL(path.resolve('ai_studio_code.html')).href);
    const frames=await page.evaluate(async()=>{
      await Promise.all([FighterSprites.ready,BeltArt.ready]);sound.playBGM=()=>{};
      const check=(ok,label)=>{if(!ok)throw Error(label);},shots={};
      const shot=label=>{game.draw();shots[label]=canvas.toDataURL().split(',')[1];};
      check(BeltArt.images.get('skyhook-sunset')?.naturalWidth>=1280,'painted backdrop decoded');
      check(BeltArt.images.get('hoist-metal')?.naturalWidth===1536,'crane and fence atlas decoded');
      check(BeltArt.images.get('hoist-gantry')?.naturalWidth===800&&BeltArt.images.get('hoist-winch')?.naturalWidth===420,'gantry and winch decoded');
      const sheet=BeltArt.images.get('hoist-vesper');
      check(sheet?.width===1600&&sheet.height===1408,'sixteen Vesper cels decoded');
      check(['skyhook-aerial','skyhook-towers'].every(id=>BeltArt.images.get(id)?.width===1280),'city depth layers decoded');
      check(Skyhook.motionSheets.every(key=>BeltArt.images.get('ascent-'+key)?.width===1254),'all extra animation sheets decoded');
      sound.init();await sound.ctx.resume();await fighterVoice.ready;
      const calls=Object.keys(VOICE_PROFILES.vesper.lines),heard=[];
      for(const event of calls){
        fighterVoice.stopAll();fighterVoice.play('vesper',event,1,80);
        check(fighterVoice.channels.get(1)?.key==='vesper-'+event,'decoded and started '+event);
      }
      fighterVoice.stopAll();fighterVoice.play=(id,event)=>{if(id==='vesper')heard.push(event);return false;};
      check(Skyhook.stage.music===8&&ARCADE_TRACKS[8].bpm===156,'dedicated ascent BGM');
      const audioContext=new AudioContext();await audioContext.resume();
      const audio=new Skyhook(),oldContext=sound.ctx,oldSE=sound.seGain;
      sound.ctx=audioContext;sound.seGain=audioContext.createGain();sound.seGain.gain.value=.85*.82;
      const meter=audioContext.createAnalyser(),sink=audioContext.createGain();meter.smoothingTimeConstant=0;sink.gain.value=0;
      sound.seGain.connect(meter);meter.connect(sink);sink.connect(audioContext.destination);
      audio.motor(true);const node=audio.drive;
      check(node?.source.loop&&audio.hum.duration===6,'motor starts');audio.motor(true);check(audio.drive===node,'no duplicate motor');
      check(audio.hum.numberOfChannels===2,'stereo motor');const left=audio.hum.getChannelData(0),right=audio.hum.getChannelData(1);
      check(left.every(v=>Math.abs(v)<1)&&right.every(v=>Math.abs(v)<1)&&left.some((v,i)=>Math.abs(v-right[i])>.02),'separate reflections without sample clipping');
      await new Promise(resolve=>setTimeout(resolve,850));
      const rms=()=>{const data=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(data);return Math.sqrt(data.reduce((n,x)=>n+x*x,0)/data.length);};
      const spectrum=new Float32Array(meter.frequencyBinCount);meter.getFloatFrequencyData(spectrum);
      const toothBins=spectrum.slice(Math.ceil(300*meter.fftSize/audioContext.sampleRate),Math.floor(1000*meter.fftSize/audioContext.sampleRate));
      const motorRms=rms(),gearPeak=Math.max(...toothBins);
      check(motorRms>.04&&gearPeak>-50,'motor signal RMS '+motorRms+' / gear band '+gearPeak+' dB / '+audioContext.state+' at '+audioContext.currentTime);
      audio.motor(false);await new Promise(resolve=>setTimeout(resolve,170));check(!audio.drive&&rms()<.001,'motor stops audibly');
      audio.motor(true);check(audio.drive!==node,'motor resumes');audio.motor(false);
      sound.ctx=oldContext;sound.seGain=oldSE;await audioContext.close();
      game.startStreet(2,4);const street=game.street,lift=street.lift,hero=street.player;
      check(STREET_STAGES.length===5&&hero.x<0,'select and board');for(let tick=0;tick<98;tick++)game.update();
      check(hero.x>200&&lift.height>0&&street.enemies.length===3,'boarding and first wave');hero.invuln=9999;
      const currentHeight=lift.height,scenery=document.createElement('canvas');scenery.width=W;scenery.height=641;
      const g=scenery.getContext('2d',{willReadFrequently:true});
      const view=h=>{lift.height=h;lift.draw(street,g);return g.getImageData(425,170,425,156).data;};
      const difference=(a,b)=>{let sum=0;for(let i=0;i<a.length;i+=4)sum+=Math.abs(a[i]-b[i]);return sum/(a.length/4);};
      const low=view(0);shot('lower-floors');const mid=view(1120);shot('rooftops');const high=view(4320);shot('harbor');
      check(difference(low,mid)>12&&difference(mid,high)>8&&difference(high,view(6000))>3,'center skyline changes continuously with elevation');
      const gallery=document.createElement('canvas');gallery.width=1440;gallery.height=594;
      const galleryContext=gallery.getContext('2d');
      Skyhook.landmarks.forEach(([meters],i)=>{
        lift.height=meters*40;lift.draw(street,g);
        galleryContext.drawImage(scenery,0,0,W,528,(i%3)*480,Math.floor(i/3)*198,480,198);
      });
      shots['altitude-route']=gallery.toDataURL().split(',')[1];
      lift.height=currentHeight;
      let count=0;const designs=new Set();
      for(let wave=0;wave<4;wave++){
        for(const enemy of street.enemies){check(enemy.z===610&&enemy.state==='DROP','spawn above');designs.add(enemy.data.id);count++;}
        for(let tick=0;tick<13;tick++)game.update();
        if(!wave)shot('drop');
        for(let tick=0;tick<90;tick++)game.update();
        check(street.enemies.every(enemy=>!enemy.z&&enemy.state!=='DROP'),'grounded');
        for(const enemy of street.enemies)street.kill(enemy);
        for(let tick=0;tick<75;tick++)game.update();
      }
      check(count===16&&designs.size===6,'cast');
      const boss=street.enemies.find(enemy=>enemy.alien);check(boss,'alien arrives');
      for(let tick=0;tick<85;tick++)game.update();
      const seen=new Set();
      for(const state of ['IDLE','WALK_F','DROP','KNOCKDOWN','WAKEUP','HIT_STAND','HIT_AIR','ALIEN_READY','ALIEN_STRIKE']){
        for(const hp of [0,600,2380])for(const plan of ['acid','tail','ram'])for(let f=0;f<108;f++)
          seen.add(Skyhook.cel({state,plan,f,hp,maxHp:2380,gait:f,z:610-7*f,animTick:f,arrivalTick:0}));
      }
      check(seen.size===52&&!seen.has(undefined),'all 52 cels reachable: '+[...seen].sort((a,b)=>a-b).join(','));
      const height=lift.height;game.paused=true;game.update();game.draw();game.draw();check(lift.height===height,'pause/draw pure');game.paused=false;
      const reset=()=>{hero.pose('IDLE');hero.dead=false;hero.hp=hero.maxHp;hero.invuln=0;hero.x=610;hero.y=550;hero.z=0;boss.x=800;boss.y=550;boss.pose('IDLE');boss.cooldown=0;};
      for(const plan of ['acid','tail','ram']){
        reset();lift.ai(street,boss);check(boss.plan===plan&&boss.state==='ALIEN_READY','telegraph '+plan);
        for(let tick=0;tick<boss.windup;tick++){street.updateActor(boss);lift.ai(street,boss);}
        let maxBlobs=0;
        for(let tick=0;tick<70;tick++){
          street.updateActor(boss);lift.ai(street,boss);lift.projectiles(street);maxBlobs=Math.max(maxBlobs,lift.acid.length);
          if(tick===14)shot(plan);
        }
        check(hero.hp<hero.maxHp,'can hit '+plan);if(plan==='acid')check(maxBlobs===3&&lift.acid.some(blob=>blob.z===0),'acid puddles');lift.acid=[];
      }
      for(const plan of ['ram','tail','acid']){
        reset();boss.facing=-1;boss.plan=plan;boss.aimDistance=190;boss.aimY=550;boss.pose('ALIEN_STRIKE');boss.contact=false;hero.y=620;
        for(let tick=0;tick<52;tick++){street.updateActor(boss);lift.ai(street,boss);lift.projectiles(street);}
        check(hero.hp===hero.maxHp,'lane dodge '+plan);lift.acid=[];
      }
      reset();boss.invuln=0;street.hurt(boss,30,1,false);boss.invuln=0;
      street.hurt(boss,9999,1,true,'dash');const stopped=lift.height;
      for(let tick=0;tick<1200&&!street.result;tick++)game.update();
      check(street.result==='clear'&&stopped===lift.height,'finale stops hoist');
      check(calls.every(event=>heard.includes(event)),'all vocal cues triggered in gameplay');
      street.resultTick=50;input.just={Enter:true};game.update();check(game.scene==='HUB','ending');
      game.startStreet(2,4);game.street.finish(false);game.street.resultTick=50;input.just={Enter:true};game.update();
      check(game.street.lift&&game.street.intro===98,'retry');return shots;
    });
    if(errors.length)throw Error(errors.join('; '));fs.mkdirSync('verification/skyhook',{recursive:true});
    for(const [label,data] of Object.entries(frames))fs.writeFileSync('verification/skyhook/'+label+'.png',Buffer.from(data,'base64'));
    const mix=await page.evaluate(async()=>{
      const rate=24000,seconds=7;
      async function render(motor){
        const ctx=new OfflineAudioContext(2,rate*seconds,rate),engine=new SoundEngine();
        engine.attach(ctx,false);
        for(let step=0;step*60/156/4<seconds;step++)engine.tick(8,step,.04+step*60/156/4);
        if(motor)new Skyhook().motor(true,engine);
        return ctx.startRendering();
      }
      const music=await render(false),combined=await render(true);
      let reference=0,delta=0,peak=0;
      const pcm=new Int16Array(combined.length*2);
      for(let ch=0;ch<2;ch++){
        const a=music.getChannelData(ch),b=combined.getChannelData(ch);
        for(let i=0;i<b.length;i++){
          if(i>rate){reference+=a[i]**2;delta+=(b[i]-a[i])**2;}
          peak=Math.max(peak,Math.abs(b[i]));
          const fade=Math.min(1,(b.length-i)/2400);
          pcm[2*i+ch]=Math.round(32767*fade*Math.max(-1,Math.min(1,b[i])));
        }
      }
      const bytes=new Uint8Array(pcm.buffer);let raw='';
      for(let i=0;i<bytes.length;i+=16384)raw+=String.fromCharCode(...bytes.subarray(i,i+16384));
      return {rate,pcm:btoa(raw),ratio:10*Math.log10(delta/reference),peak};
    });
    if(!(mix.ratio>-12&&mix.ratio<9&&mix.peak<.99))throw Error('Music/drive mix '+mix.ratio+' dB, peak '+mix.peak);
    const pcm=Buffer.from(mix.pcm,'base64'),header=Buffer.alloc(44);
    header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVEfmt ',8);
    header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(2,22);header.writeUInt32LE(mix.rate,24);
    header.writeUInt32LE(mix.rate*4,28);header.writeUInt16LE(4,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);
    fs.writeFileSync('verification/skyhook/ascent-mix.wav',Buffer.concat([header,pcm]));
    console.log('52 cels, 9 landmarks, 6 voice cues, live motor, three attacks/dodges, finale and retry passed. Motor contribution relative to music '+mix.ratio.toFixed(1)+' dB, mixed peak '+mix.peak.toFixed(3));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
