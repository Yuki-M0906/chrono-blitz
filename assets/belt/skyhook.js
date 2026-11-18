class Skyhook {
  static stage={title:'SKYHOOK ASCENT',jp:'建設用リフトで高層区画へ',boss:'vesper',bossName:'VESPER / ACID MATRIARCH',music:8,
    areas:[{left:0,right:1280,name:'05 / SKYHOOK ASCENT',jp:'屋外工事用昇降機',waves:[
      [0,20,48],[35,69,86,9],[78,42,57,26],[15,31,63,47,95],['boss']]}]};
  constructor(){this.height=0;this.acid=[];this.turn=0;}
  static driveBuffers=new WeakMap();
  static driveSound(ctx){
    if(this.driveBuffers.has(ctx))return this.driveBuffers.get(ctx);
    const rate=22050,n=rate*6,blend=2205,tau=2*Math.PI;
    const buffer=ctx.createBuffer(2,n,rate),raw=new Float32Array(n+blend);
    let seed=41371,low=0,roll=0,rough=0,air=0,load=0,knock=0,nextJoint=3600;
    let housing=0,previousHousing=0,toothPhase=0;
    const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
    const pole=Math.exp(-Math.PI*61/rate),resonance=2*pole*Math.cos(tau*158/rate);
    for(let i=0;i<raw.length;i++){
      const t=i/rate,noise=rand();
      low+=.012*(noise-low);roll+=.099*(noise-roll);air+=.29*(noise-air);rough+=.035*(noise-rough);
      load+=.00022*(noise-load);
      if(i===nextJoint){knock=.6+.22*rand();nextJoint+=Math.round(rate*(.69+.31*rand()));}
      knock*=.997;
      const y=(.12*noise*knock+.013*rough)+resonance*housing-pole*pole*previousHousing;
      previousHousing=housing;housing=y;
      toothPhase+=tau*(406+45*load+2.7*rough)/rate;
      const traction=2.2*low+1.2*(roll-low)+.39*(air-roll);
      const mesh=(.055+.20*Math.abs(rough))*Math.sin(toothPhase)+.025*Math.sin(toothPhase*2);
      const line=.115*Math.sin(tau*50*t)+.056*Math.sin(tau*100*t);
      raw[i]=.91*Math.tanh(traction+mesh+line+.28*y+knock*.46*(noise-air));
    }
    const loop=new Float32Array(n);
    for(let i=0;i<n;i++){
      const fade=Math.max(0,(i-n+blend)/blend);
      loop[i]=raw[i+blend]*(1-fade)+(fade?raw[i-n+blend]*fade:0);
    }
    for(let ch=0;ch<2;ch++){
      const data=buffer.getChannelData(ch),near=ch?309:173,far=ch?1079:887;
      for(let i=0;i<n;i++)data[i]=.78*loop[i]+.16*loop[(i+n-near)%n]+.06*loop[(i+n-far)%n];
    }
    this.driveBuffers.set(ctx,buffer);return buffer;
  }
  motor(running,audio=sound){
    const ctx=audio.ctx;
    if(!running||!ctx||!audio.seGain||audio.muted||(!audio.offline&&ctx.state!=='running')){
      if(this.drive){
        const {source,gain}=this.drive,now=source.context.currentTime;
        gain.gain.cancelScheduledValues(now);gain.gain.setTargetAtTime(.00001,now,.018);
        source.stop(now+.09);this.drive=null;
      }
      return;
    }
    if(this.drive)return;
    this.hum=Skyhook.driveSound(ctx);
    const source=ctx.createBufferSource(),gain=ctx.createGain();
    source.buffer=this.hum;source.loop=true;source.connect(gain);gain.connect(audio.seGain);
    gain.gain.value=.00001;gain.gain.setTargetAtTime(.49,ctx.currentTime,.16);
    source.onended=()=>{source.disconnect();gain.disconnect();};source.start();this.drive={source,gain};
  }
  board(street){
    const frame=99-street.intro,hero=street.player;
    if(frame<=66){hero.facing=1;hero.walkTo(-62+frame*4.4,552);hero.animTick++;}
    else {hero.pose('IDLE');this.height+=.8*(frame-66)/32;}
    if(frame===67)sound.playGrapple('impact');
    if(frame===98)street.spawnWave();
  }
  spawn(street){
    const wave=street.areaData().waves[street.wave];
    wave.forEach((entry,index)=>{
      const boss=entry==='boss',slot=(index*2+street.wave)%5;
      const actor=street.spawnEnemy(boss?'boss':'metro'+entry,boss?880:150+slot*235,486+((index+street.wave)%3)*49);
      if(boss){
        actor.alien=true;actor.label='VESPER MATRIARCH';actor.scale=1.48;
        actor.hp=actor.maxHp=actor.hudHp=2380;actor.value=18000;actor.damage=64;actor.speed=2.35;
        sound.playBGM(6);sound.playCue('boss');
      }
      actor.pose('DROP');actor.z=610;actor.dropDelay=index*14;actor.invuln=999;actor.vz=-3;actor.facing=actor.x>street.player.x?-1:1;
    });
  }
  descend(street,actor){
    if(actor.dropDelay>0){actor.dropDelay--;return;}
    actor.z=Math.max(0,actor.z+actor.vz);actor.vz-=.77;
    if(actor.z===0){
      actor.vz=0;actor.pose('IDLE');actor.invuln=6;actor.cooldown=actor.alien?55:28;
      street.effects(actor.x,actor.y,'#e5bf85',actor.alien?27:8);
      if(actor.alien){actor.arrivalTick=actor.animTick;street.shake=13;sound.playGrapple('impact');street.announce('VESPER MATRIARCH','#cbed7c');fighterVoice.play('vesper','intro',1,110);}
      else sound.playHit('light');
    }
  }
  ai(street,actor){
    const hero=street.player,dx=hero.x-actor.x,dy=hero.y-actor.y;
    if(actor.arrivalTick!=null&&actor.animTick-actor.arrivalTick<39&&actor.state==='IDLE')return;
    if(actor.state==='ALIEN_READY'){
      if(actor.f>=actor.windup){actor.pose('ALIEN_STRIKE');actor.contact=false;sound.playSwing(true);}
      return;
    }
    if(actor.state==='ALIEN_STRIKE'){
      const frame=actor.f,dir=actor.facing;
      if(actor.plan==='acid'&&[5,16,27].includes(frame)){
        const distance=STREET.clamp(actor.aimDistance,120,700),travel=34,launch=168;
        this.acid.push({x:actor.x+dir*99,y:actor.y,dir,age:0,travel,vx:dir*(distance-99)/travel,dy:(actor.aimY-actor.y)/travel,z:launch,launch,hit:false});
        sound.playFlame('launch');
      }
      if(actor.plan==='ram'&&frame>=5&&frame<=34){
        actor.x=STREET.clamp(actor.x+dir*17,street.backWall+40,street.gate-40);
        if(frame%4===0)street.effects(actor.x-dir*65,actor.y,'#ccaf94',3);
        if(!actor.contact&&Math.abs(hero.y-actor.y)<37&&Math.abs(hero.x-actor.x)<106&&hero.z<85)
          actor.contact=street.hurt(hero,75,dir,true,'alienRam');
      }
      if(actor.plan==='tail'&&frame>=9&&frame<=18&&!actor.contact&&Math.abs(dy)<49&&dx*dir>=-75&&dx*dir<269&&hero.z<82)
        actor.contact=street.hurt(hero,57,dir,true,'alienTail');
      if(actor.contact&&actor.f===frame&&!actor.impactPlayed){actor.impactPlayed=true;sound.playHit('heavy');street.shake=8;}
      if(frame>=52){actor.pose('IDLE');actor.cooldown=actor.hp<850?30:49;}
      return;
    }
    if(!STREET.ready(actor))return;
    actor.facing=dx>=0?1:-1;
    const plan=['acid','tail','ram'][this.turn%3],range=plan==='tail'?230:760;
    if(actor.cooldown<=0&&Math.abs(dx)<=range&&Math.abs(dy)<(plan==='acid'?155:38)){
      this.turn++;actor.plan=plan;actor.windup=plan==='ram'?42:plan==='acid'?35:28;
      fighterVoice.play('vesper',plan,1,75);
      actor.aimDistance=Math.abs(dx);actor.aimY=hero.y;actor.impactPlayed=false;actor.pose('ALIEN_READY');return;
    }
    actor.walkTo(STREET.clamp(actor.x+(Math.abs(dx)>110?Math.sign(dx)*actor.speed:0),street.backWall+40,street.gate-40),
      STREET.clamp(actor.y+STREET.clamp(dy,-1.8,1.8),STREET.top,STREET.bottom));
  }
  projectiles(street){
    const hero=street.player;
    for(const blob of this.acid){
      blob.age++;
      if(blob.age<=blob.travel){
        blob.x+=blob.vx;blob.y+=blob.dy;const t=blob.age/blob.travel;
        blob.z=blob.launch*(1-t)+180*t*(1-t);
        if(blob.age===blob.travel){street.effects(blob.x,blob.y,'#b4f24c',14);sound.playBreak('metal');}
      }
      if(!blob.hit&&Math.abs(hero.x-blob.x)<(blob.z?40:54)&&Math.abs(hero.y-blob.y)<25&&blob.z>=hero.z-5&&blob.z<hero.z+135)
        blob.hit=street.hurt(hero,blob.z?51:24,blob.dir,false,'alienAcid');
    }
    this.acid=this.acid.filter(blob=>blob.age<blob.travel+80);
  }
  drawHazards(street,ctx){
    ctx.save();
    for(const actor of street.enemies){
      if(actor.state==='DROP'&&actor.dropDelay<=0){
        ctx.strokeStyle=actor.alien?'#bdfa5f':'#ffca6d';ctx.lineWidth=3;
        ctx.beginPath();ctx.ellipse(actor.x,actor.y,32+actor.z*.048,11,0,0,Math.PI*2);ctx.stroke();
      }
      if(actor.alien&&actor.state==='ALIEN_READY'){
        const range=actor.plan==='ram'?620:actor.plan==='tail'?269:actor.aimDistance;
        ctx.fillStyle=actor.plan==='acid'?'rgba(170,235,43,.19)':'rgba(250,137,48,.22)';
        ctx.fillRect(actor.facing===1?actor.x:actor.x-range,actor.y-27,range,54);
        STREET.text(ctx,{ram:'BRACE  /  CHARGE',tail:'TAIL SWEEP',acid:'ACID SALVO'}[actor.plan],actor.x,actor.y-309,15,'#fff39f','center','900');
      }
    }
    for(const blob of this.acid){
      const air=blob.age<=blob.travel;
      ctx.globalAlpha=air?1:Math.min(1,(blob.travel+80-blob.age)/20);
      ctx.fillStyle='#48671b';ctx.beginPath();ctx.ellipse(blob.x,blob.y,air?14:52,air?4:13,0,0,Math.PI*2);ctx.fill();
      ctx.save();ctx.translate(blob.x,blob.y-blob.z);
      if(air){
        const t=blob.age/blob.travel,vz=(-blob.launch+180*(1-2*t))/blob.travel;
        ctx.rotate(Math.atan2(blob.dy-vz,blob.vx));
        for(let n=3;n>0;n--){
          ctx.fillStyle=n===1?'#c5ed30':'#78a526';ctx.beginPath();
          ctx.ellipse(-10-n*7,Math.sin(blob.age*.4+n)*3,9-n*1.6,4-n*.6,0,0,Math.PI*2);ctx.fill();
        }
      }
      const r=air?16:44;
      const acid=ctx.createRadialGradient(-r*.22,-2,1,0,0,r);
      acid.addColorStop(0,'#fbffbb');acid.addColorStop(.35,'#e6fa44');acid.addColorStop(.8,'#98ba20');acid.addColorStop(1,'#526514');
      ctx.fillStyle=acid;ctx.beginPath();ctx.ellipse(0,0,r,air?9:8,0,0,Math.PI*2);ctx.fill();
      if(!air)for(let n=0;n<4;n++){
        const age=(blob.age+n*7)%21;ctx.strokeStyle='#d6f250';ctx.lineWidth=1.25;
        ctx.beginPath();ctx.arc((n-1.5)*13+Math.sin(n*15)*6,-3-age*.39,1+age*.1,0,Math.PI*2);ctx.stroke();
      }
      ctx.restore();
    }ctx.restore();
  }
  // Height at eye level in meters, source band, position, width and parallax. Side-mounted structures
  // extend beyond the shaft; bridges span it. The cage, its floor and the actors share the same camera.
  static landmarks=[
    [4,'railworks',0,410,-55,1400,.66],
    [17,'railworks',412,428,-71,765,.59],
    [31,'railworks',878,338,-35,1350,.73],
    [47,'skyline',0,407,546,830,.53],
    [66,'skyline',443,381,-140,870,.63],
    [84,'summit',448,487,672,477,.76],
    [104,'summit',0,437,-253,945,.54],
    [127,'skyline',831,416,685,682,.58],
    [153,'summit',950,304,-160,1570,.29]
  ];
  static drawLandmarks(ctx,height){
    for(const [meters,art,sy,sh,left,width,speed] of this.landmarks){
      const y=210+(height-40*meters)*speed,dh=width*sh/1254,top=y-dh*.5;
      if(top>=438||top+dh < -180)continue;
      const sheet=BeltArt.images.get('ascent-'+art);
      if(!sheet)continue;
      const base=top+dh-5;
      ctx.save();ctx.globalAlpha*=STREET.clamp((base+170)/160,0,1);
      if(meters===4&&base<438){
        for(const u of [.065,.477,.951])ctx.drawImage(sheet,555,380,77,22,left+width*u-width*.03,base,width*.06,440-base);
      }
      if(meters===47&&base<438){
        const steel=BeltArt.images.get('hoist-metal'),mastWidth=width*.073;
        if(steel){
          ctx.save();ctx.translate(left+width*.31+mastWidth*.5,base-3);ctx.rotate(Math.PI/2);
          const bay=mastWidth*3.5;
          for(let p=0;p<444-base;p+=bay)ctx.drawImage(steel,49,782,1442,237,p,0,bay+.5,mastWidth);
          ctx.restore();
        }
      }
      if(meters===84){
        ctx.strokeStyle='#43434c';ctx.lineWidth=2;
        for(const u of [.15,.83]){
          ctx.beginPath();ctx.moveTo(left+width*u,0);ctx.lineTo(left+width*u,top+5);ctx.stroke();
        }
      }
      if(meters===104||meters===127){
        const wall=BeltArt.images.get('skyhook-towers');
        if(wall&&base<438)ctx.drawImage(wall,22,385,208,435,left+width*.07,base,width*.86,566);
      }
      ctx.drawImage(sheet,0,sy,sheet.width,sh,left,top,width,dh);
      if(meters===17){
        // Vapor leaves the relief valve, bends with the wind and dissipates behind the cage.
        for(let puff=0;puff<6;puff++){
          const age=(height*.037+puff*11)%66,r=3+age*.20;
          const x=left+width*.695+age*.45,y=top+dh*.13-age*.73;
          const steam=ctx.createRadialGradient(x,y,0,x,y,r);
          steam.addColorStop(0,'rgba(229,209,193,'+(.31*(1-age/66))+')');steam.addColorStop(1,'rgba(206,186,176,0)');
          ctx.fillStyle=steam;ctx.fillRect(x-r,y-r,r*2,r*2);
        }
      }
      if(meters===127){
        const x=left+width*.72,y=top+dh*.017,r=8+3*Math.sin(height*.045);
        const beacon=ctx.createRadialGradient(x,y,0,x,y,r);
        beacon.addColorStop(0,'#fff0a8');beacon.addColorStop(.23,'#ff654c');beacon.addColorStop(1,'rgba(251,59,57,0)');
        ctx.fillStyle=beacon;ctx.fillRect(x-r,y-r,r*2,r*2);
      }
      ctx.restore();
    }
    const mist=BeltArt.images.get('ascent-summit');
    if(height>6000&&mist){
      // At very high elevations individual banks pass below the lift while the estuary stays in sight.
      const travel=(height-6000)*.29,band=Math.floor(travel/530);
      for(let i=Math.max(0,band-1);i<=band;i++){
        const y=travel-i*530-165,w=i%2?820:1050;
        if(y>=438||y+134<=0)continue;
        const x=(i%2?590:-350)+Math.sin(height*.0008+i)*97;
        ctx.save();ctx.globalAlpha*=.32;ctx.drawImage(mist,0,950,1254,304,x,y,w,134);ctx.restore();
      }
    }
  }
  draw(street,ctx){
    ctx.save();ctx.beginPath();ctx.rect(0,0,W,641);ctx.clip();
    const height=this.height;
    const painted=BeltArt.images.get('skyhook-sunset');
    const split=painted?Math.round(painted.height*BELT_ART_SOURCES['skyhook-sunset'].horizon):0;
    const line=(x,y,xx,yy,color,width)=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
    const port=BeltArt.images.get('skyhook-aerial'),towers=BeltArt.images.get('skyhook-towers');
    if(port){
      // The harbor slowly recedes around its horizon as more of the river and rooftops come into view.
      // The rational curve keeps moving throughout the timed fight without a capped crop or a scene swap.
      const distance=height/(height+2200),zoom=2.18-1.18*distance;
      const width=W*zoom,imageHeight=width*port.height/port.width;
      const horizon=91+68*distance;
      ctx.save();ctx.beginPath();ctx.rect(0,0,W,438);ctx.clip();
      ctx.drawImage(port,(W-width)*.61,horizon-imageHeight*.394,width,imageHeight);
      const estuary=BeltArt.images.get('ascent-estuary');
      const reveal=STREET.clamp((height-2900)/1800,0,1);
      if(estuary&&reveal>0){
        const distantWidth=W*(1+.47*(1-distance)),distantHeight=distantWidth*estuary.height/estuary.width;
        const left=(W-distantWidth)*.65,top=horizon-distantHeight*.27;
        // Reveal the new panorama above a passing haze band; keep streets and towers sharp on either side.
        const edge=(438+64)*reveal,solid=Math.max(0,edge-64);
        const band=(y,h,alpha)=>{
          if(h<=0)return;
          ctx.globalAlpha=alpha;
          ctx.drawImage(estuary,0,(y-top)*estuary.height/distantHeight,estuary.width,h*estuary.height/distantHeight,
            left,y,distantWidth,h);
        };
        ctx.save();band(0,Math.min(438,solid),1);
        for(let y=solid;y<Math.min(edge,438);y+=4)
          band(y,Math.min(4,edge-y,438-y),STREET.clamp((edge-y-2)/64,0,1));
        ctx.restore();
      }
      if(towers){
        const facadeWidth=W*1.20,facadeHeight=facadeWidth*towers.height/towers.width;
        const facadeTop=458-facadeHeight+height*.37;
        if(facadeTop<438)ctx.drawImage(towers,(W-facadeWidth)/2,facadeTop,facadeWidth,facadeHeight);
      }
      Skyhook.drawLandmarks(ctx,height);
      ctx.restore();
    }else if(painted){
      const offset=Math.max(0,48-height*.014);
      ctx.drawImage(painted,0,offset,painted.width,split-48,0,0,W,438);
    }else{
    const sky=ctx.createLinearGradient(0,0,0,440);sky.addColorStop(0,'#192d50');sky.addColorStop(.55,'#ba7980');sky.addColorStop(1,'#f7c587');
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,641);
    ctx.fillStyle='#ffe4ac';ctx.beginPath();ctx.arc(829,224,40,0,Math.PI*2);ctx.fill();
    for(let row=0;row<2;row++)for(let n=0;n<23;n++){
      const x=n*67-35-row*20,y=219+row*20+((n*137+row*73)%101)+Math.min(80,height*(row?.018:.009));
      ctx.fillStyle=row?'#51526a':'#8b7784';ctx.fillRect(x,y,55,250);
      ctx.fillRect(x+12,y-11,29,15);
      ctx.fillStyle=row?'#c69b7c':'#b19697';
      for(let pane=0;pane<12;pane++)ctx.fillRect(x+6+(pane%4)*12,y+10+Math.floor(pane/4)*19,4,7);
    }
    for(const [x,top] of [[190,155],[1002,107]]){
      const y=top+Math.min(67,height*.012);line(x,y,x,460,'#504757',11);line(x-102,y+10,x+183,y+10,'#584851',8);
      line(x-100,y+8,x,y-32,'#67525a',3);line(x,y-32,x+182,y+8,'#67525a',3);
      for(let bay=0;bay<12;bay++)line(x-99+bay*23,y+8,x-77+bay*23,y-3,'#65535a',2);
      line(x-103,y-5,x+179,y-5,'#795b5b',3);
      for(let lattice=y+10;lattice<445;lattice+=25){
        line(x-11,lattice,x+10,lattice+25,'#765d62',2);
        line(x+10,lattice,x-11,lattice+25,'#765d62',2);
      }
      for(const offset of [-11,10])line(x+offset,y+10,x+offset,445,'#5e505b',3);
      ctx.fillStyle='#5f505c';ctx.fillRect(x-91,y-18,35,16);ctx.fillRect(x+10,y-27,22,20);
      ctx.fillStyle='#ce9c80';ctx.fillRect(x+15,y-24,12,8);
      line(x+136,y+9,x+136,y+97,'#594f5a',2);ctx.fillStyle='#67545e';ctx.fillRect(x+129,y+94,15,9);
    }
    }
    const metal=BeltArt.images.get('hoist-metal');
    const craneY=80+height*.125;
    if(metal&&craneY<438){
      ctx.save();ctx.translate(1165,craneY);ctx.scale(-1,1);
      ctx.drawImage(metal,0,0,1536,407,-116,0,570,151);
      ctx.restore();
    }
    const gantry=BeltArt.images.get('hoist-gantry');
    // Fixed landings pass behind the traveling lift. Keep the skyline open at center.
    if(gantry){
      for(let y=height%232-232;y<445;y+=232){
        const floor=1+Math.round((height-y)/232);
        for(const [x,span] of [[-18,340],[1018,300]]){
          if(metal)ctx.drawImage(metal,36,427,1460,279,x,y-40,span,45);
          ctx.drawImage(gantry,x,y,span,span*gantry.height/gantry.width);
          const tagX=x<0?x+span-78:x+28;
          ctx.fillStyle='#30373e';ctx.fillRect(tagX,y+6,52,15);
          STREET.text(ctx,'FL  '+String(floor).padStart(2,'0'),tagX+26,y+17,10,'#ffdc93','center','900');
        }
      }
    }
    for(const x of [35,1161]){
      if(metal){
        ctx.save();ctx.translate(x+70,0);ctx.rotate(Math.PI/2);
        for(let y=height%283-283;y<444;y+=283)ctx.drawImage(metal,49,782,1442,237,y,0,284,70);
        ctx.restore();continue;
      }
      ctx.fillStyle='#272e3d';ctx.fillRect(x,0,69,449);
      for(let y=(height%136)-136;y<465;y+=136){
        line(x+6,y,x+61,y+126,'#a26a51',7);line(x+61,y,x+6,y+126,'#765857',7);
        ctx.fillStyle='#ce9066';ctx.fillRect(x,y,69,6);
        for(const rivet of [9,57]){ctx.fillStyle='#403c45';ctx.fillRect(x+rivet,y+6,5,5);ctx.fillStyle='#d8a480';ctx.fillRect(x+rivet,y+6,4,2);}
      }
      for(const off of [0,62]){ctx.fillStyle='#a87359';ctx.fillRect(x+off,0,7,450);}
    }
    if(!gantry)for(let y=(height%232)-232;y<447;y+=232){
      ctx.fillStyle='#514553';ctx.fillRect(97,y,250,13);ctx.fillRect(965,y,204,13);
      line(100,y+59,190,y+13,'#715763',8);line(1158,y+65,1075,y+13,'#715763',8);
      ctx.fillStyle='#e6b07b';ctx.fillRect(97,y,250,3);
      for(const start of [105,972]){
        for(let bay=0;bay<5;bay++)line(start+bay*35,y-28,start+bay*35,y,'#695963',2);
        line(start,y-26,start+176,y-26,'#a88174',3);line(start,y-13,start+176,y-13,'#8e7270',2);
      }
      STREET.text(ctx,'LEVEL '+String(1+Math.round((height-y)/232)).padStart(2,'0'),238,y+12,11,'#ffdbab','center');
    }
    if(painted)ctx.drawImage(painted,0,split,painted.width,painted.height-split,0,437,W,204);
    else{
    const deck=ctx.createLinearGradient(0,436,0,641);deck.addColorStop(0,'#747a7e');deck.addColorStop(.52,'#4c5460');deck.addColorStop(1,'#29333d');
    ctx.fillStyle=deck;ctx.fillRect(0,437,W,204);
    for(let x=-300;x<1600;x+=140)line(x,437,(x-640)*1.4+640,641,'#323d49',3);
    for(let index=0;index<140;index++){
      const x=(index*391)%1280,y=447+(index*67)%178;
      line(x,y,x+5+(index%13),y-1,'rgba(185,195,193,.18)',1);
    }
    for(const x of [62,1050]){
      ctx.fillStyle='#29353d';ctx.fillRect(x,601,111,17);
      for(let slot=0;slot<13;slot++)line(x+5+8*slot,604,x+2+8*slot,615,'#66727a',3);
    }
    for(const y of [451,489,548,620]){line(0,y,W,y,'#303b48',3);line(0,y+3,W,y+3,'#879099',1);
      for(let x=15;x<W;x+=90){ctx.fillStyle='#b4b0a4';ctx.fillRect(x,y+6,4,2);}}
    }
    if(metal){
      for(let panel=0;panel<3;panel++)ctx.drawImage(metal,36,427,1460,279,panel*W/3,348,W/3+.5,91);
    }else{
    for(let x=0;x<W;x+=125){ctx.fillStyle='#343742';ctx.fillRect(x,348,9,91);ctx.fillStyle='#dfaa60';ctx.fillRect(x,348,3,85);}
    line(0,354,W,354,'#df9e43',9);line(0,359,W,359,'#5c483a',3);line(0,395,W,395,'#957855',4);
    }
    for(const y of painted?[]:[435,628]){
      ctx.fillStyle='#d7a14e';ctx.fillRect(0,y,W,10);
      for(let x=-9;x<W;x+=36)line(x,y+9,x+12,y+1,'#303946',10);
    }
    // Narrow braided cables feed the winches at the back edge of the playable deck.
    const winch=BeltArt.images.get('hoist-winch');
    for(const x of [52,1217]){
      for(const offset of [0,8]){
        const cable=x+offset;
        line(cable,0,cable,435,'#262a32',5);
        line(cable-1,0,cable-1,435,'#9e8c7b',1.5);
        ctx.save();ctx.setLineDash([3,6]);ctx.lineDashOffset=-(height%9);
        line(cable+1,0,cable+1,435,'#d9b690',1.2);ctx.restore();
      }
      if(winch){
        const width=x<100?145:118,left=x<100?4:W-width-5;
        ctx.fillStyle='rgba(29,21,26,.54)';ctx.beginPath();ctx.ellipse(left+width*.5,447,width*.52,6,0,0,Math.PI*2);ctx.fill();
        const h=width*winch.height/winch.width;ctx.drawImage(winch,left,449-h,width,h);
      }
    }
    // Project the traveling fence shadow onto the deck; it stays fixed to the cage.
    for(let x=15;x<W;x+=84)line(x,449,x-16,461,'rgba(43,31,37,.22)',3);
    line(0,461,W,461,'rgba(51,35,42,.19)',2);
    const casing=ctx.createLinearGradient(0,361,0,424);
    for(const [pos,color] of [[0,'#eed09f'],[.09,'#866a53'],[.44,'#48444a'],[.88,'#292d36'],[1,'#9b8270']])casing.addColorStop(pos,color);
    ctx.fillStyle='#21232b';ctx.fillRect(521,364,238,62);ctx.fillStyle=casing;ctx.fillRect(521,361,238,62);
    ctx.fillStyle='#14252b';ctx.fillRect(530,366,220,50);
    for(const x of [526,754])for(const y of [367,416]){
      ctx.fillStyle='#2b282d';ctx.fillRect(x-2,y-1,5,5);ctx.fillStyle='#dbc29f';ctx.fillRect(x-2,y-2,4,2);
    }
    STREET.text(ctx,'SKYHOOK   /   HOIST 09',640,385,13,'#a9c9c6','center','900');
    STREET.text(ctx,(street.finale||street.result?'■  HOLD':'▲  ASCENT')+'    '+(height/40).toFixed(1)+' m',640,408,18,'#ffda83','center','900');
    ctx.restore();
  }
  // Body anchor (in the 400x352 cel) and scale. Keep foot contact fixed across differently extended silhouettes.
  static anchors=[[205,343,.57],[210,340,.59],[196,343,.60],[190,341,.59],[168,341,.67],[195,343,.59],
    [192,343,.63],[205,348,.59],[205,346,.62],[148,349,.73],[202,338,.77],[176,343,.70],
    [200,340,.59],[200,340,.59],[200,340,.63],[200,340,.69]];
  // Extended frames are tightly cropped on their original sheets: x, y, w, h, foot axis within the crop, scale.
  static motionSheets=['stride','strike','reaction','feral'];
  static motionFrames=[
    [50,17,308,332,.54,.60],[452,75,328,303,.52,.61],[852,162,368,225,.48,.62],
    [28,524,345,265,.50,.61],[452,477,326,305,.52,.61],[858,466,353,319,.51,.60],
    [34,866,364,317,.51,.60],[440,869,374,311,.52,.60],[855,867,372,315,.52,.60],
    [39,104,336,253,.48,.64],[442,93,360,263,.48,.64],[881,88,329,268,.49,.64],
    [23,453,350,328,.52,.61],[415,518,425,249,.36,.68],[875,528,348,237,.52,.66],
    [31,913,327,238,.47,.66],[403,902,422,225,.46,.65],[847,939,387,208,.46,.65],
    [32,62,350,317,.52,.60],[448,35,349,341,.52,.60],[860,43,372,333,.53,.60],
    [29,450,356,332,.51,.60],[436,454,350,324,.48,.60],[869,452,357,284,.48,.61],
    [26,838,370,341,.52,.61],[433,938,394,213,.50,.68],[868,927,352,233,.50,.65],
    [10,95,357,280,.49,.61],[414,77,421,298,.47,.61],[858,61,381,314,.51,.61],
    [10,463,346,314,.52,.61],[396,413,451,363,.40,.64],[818,495,426,279,.49,.62],
    [13,856,348,321,.5,.60],[380,826,465,350,.49,.59],[845,856,365,320,.51,.60]
  ];
  static cel(actor){
    const f=actor.f,wounded=actor.hp>0&&actor.hp<actor.maxHp*.36;
    const arrival=actor.animTick-actor.arrivalTick;
    switch(actor.state){
      case 'DROP': return actor.z>380?8:actor.z>100?16:17;
      case 'WALK_F': return [20,21,1,22,23,2,24,0][Math.floor((actor.gait||0)/5)%8];
      case 'HIT_STAND': return f<4?37:f<10?7:38;
      case 'GRABBED': return f<8?38:7;
      case 'HIT_AIR': return actor.hp<=0&&f<11?40:f<5?37:f<12?38:39;
      case 'KNOCKDOWN': case 'DEAD': return f<6?41:10;
      case 'WAKEUP': return f<4?41:f<8?42:f<12?11:19;
      case 'IDLE':
        if(actor.arrivalTick!=null&&arrival<39)return [18,19,34,35,35,36,36,12][Math.floor(arrival/5)];
        if(wounded)return [49,51,51,13][Math.floor(actor.animTick/13)%4];
        return [12,12,13,0][Math.floor(actor.animTick/15)%4];
      case 'ALIEN_READY':
        if(actor.plan==='acid')return wounded?(f<15?43:44):(f<9?14:f<19?25:3);
        if(actor.plan==='tail')return f<9?11:wounded?46:f<19?5:28;
        return f<10?(wounded?49:13):f<22?(wounded?50:11):31;
      case 'ALIEN_STRIKE': {
        if(actor.plan==='acid'){
          const beat=f%11;
          if(f<32)return beat<3?(wounded?43:25):beat<5?(wounded?44:26):beat<9?4:(wounded?45:27);
          return f<39?(wounded?45:27):f<46?14:12;
        }
        if(actor.plan==='tail'){
          if(f<9)return wounded?46:28;
          if(f<14)return 29;
          if(f<20)return wounded?47:9;
          return f<31?(wounded?48:30):f<41?19:12;
        }
        if(f<5)return 31;
        if(f<35)return [6,32,15,32][Math.floor((f-5)/3)%4];
        return f<40?33:f<47?11:19;
      }
      default: return 0;
    }
  }
  static creature(actor,ctx){
    const cel=this.cel(actor),extra=cel>=16,group=Math.floor((cel-16)/9);
    const sheet=BeltArt.images.get(extra?'ascent-'+this.motionSheets[group]:'hoist-vesper');
    if(!sheet)return this.fallbackCreature(actor,ctx);
    const f=actor.f;
    ctx.save();ctx.scale(actor.facing,1);
    if(actor.state==='HIT_AIR')ctx.rotate(-Math.min(.7,f*.037));
    if(actor.state==='HIT_STAND')ctx.rotate(-.12*Math.max(0,1-f/15));
    if(cel===4)ctx.translate(-3*Math.exp(-Math.max(0,f%11-5)*.43),0);
    if(cel===6)ctx.rotate(.022*Math.sin(f*.69));
    if(cel===9||cel===29||cel===47){
      const arc=Math.sin(Math.PI*STREET.clamp((f-8)/16,0,1));
      ctx.save();ctx.globalAlpha*=arc*.7;
      ctx.strokeStyle='#f8e5ac';ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(-72,-69);ctx.bezierCurveTo(-17,-37,108,-32,173,-99);ctx.stroke();
      ctx.restore();
    }
    if(actor.burnTicks>0)ctx.filter='sepia(.85) saturate(2.8)';
    else if(actor.flashTimer>0&&actor.flashTimer%4<2)ctx.filter='brightness(1.45)';
    if(extra){
      const [x,y,w,h,axis,scale]=this.motionFrames[cel-16];
      ctx.drawImage(sheet,x,y,w,h,-w*axis*scale,-(h-2)*scale,w*scale,h*scale);
    }else{
      const [anchor,foot,scale]=this.anchors[cel];
      ctx.drawImage(sheet,cel%4*400,Math.floor(cel/4)*352,400,352,-anchor*scale,-foot*scale,400*scale,352*scale);
    }
    ctx.restore();return true;
  }
  static fallbackCreature(actor,ctx){
    const frame=actor.f,tick=actor.animTick,ready=actor.state==='ALIEN_READY',strike=actor.state==='ALIEN_STRIKE';
    const sweep=strike&&actor.plan==='tail'?Math.sin(Math.min(1,frame/26)*Math.PI):0;
    const gait=actor.state==='WALK_F'?Math.sin(actor.gait*.21):strike&&actor.plan==='ram'?Math.sin(frame*.54):0;
    ctx.save();ctx.scale(actor.facing,1);ctx.lineJoin='round';ctx.lineCap='round';
    if(['KNOCKDOWN','DEAD','WAKEUP','HIT_AIR','GRABBED'].includes(actor.state)){
      const down=actor.state==='WAKEUP'?Math.max(0,1-frame/14):1;
      ctx.translate(0,-25*down);ctx.rotate(-1.05*down);
    }else if(actor.state==='HIT_STAND')ctx.rotate(-.12*Math.max(0,1-frame/20));
    const path=(d,fill,stroke='#12202a',width=2.7)=>{
      const shape=new Path2D(d);ctx.fillStyle=fill;ctx.fill(shape);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke(shape);}
    };
    const ellipse=(x,y,w,h,angle,fill)=>{ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,w,h,angle,0,2*Math.PI);ctx.fill();};
    const shell=ctx.createLinearGradient(0,-155,18,-36);shell.addColorStop(0,'#b4dbcd');shell.addColorStop(.19,'#568c91');shell.addColorStop(.45,'#243c54');shell.addColorStop(.76,'#514b65');shell.addColorStop(1,'#202737');
    const hot=actor.burnTicks>0?'#ff8041':'#a2ee62';
    const curl=ready&&actor.plan==='tail'?-.5:0;
    for(let n=0;n<=19;n++){
      const t=n/19,theta=2.8+t*(2.2+curl)-sweep*3.85;
      const x=-25+Math.cos(theta-t*.55)*t*150+sweep*t*110,y=-62+Math.sin(theta)*t*50-sweep*t*15+Math.sin(tick*.06+t*5)*t*6;
      ellipse(x,y,15-9*t,11-7*t,theta,'#142331');ellipse(x,y-3,12-7*t,7-4*t,theta,'#719690');
      if(n===19){ctx.save();ctx.translate(x,y);ctx.rotate(theta+1);path('M-9 5 Q-5 -18 29 -22 Q13 -12 6 6Z','#d7ecab');ctx.restore();}
    }
    for(const side of [-1,1]){
      ctx.save();ctx.translate(side*25+gait*side*9,0);
      path('M-13 -88 Q15 -93 20 -72 L32 -43 14 -17 21 -9 37 -4 39 0 6 0 -2 -13 9 -43 -17 -62Z',side<0?'#284252':shell);
      path('M15 -53 L31 -49 36 -59 29 -37 13 -28Z','#86a6a0');
      path('M-12 -77 Q-2 -83 5 -73 L21 -48 13 -49Z','#567082');
      path('M12 -31 L20 -37 12 -13 17 -9 8 -11Z','#84959c',null);
      path('M24 -8 L45 -2 29 -2Z M9 -9 L19 -1 5 -2Z','#ecdcb0');ctx.restore();
    }
    ctx.translate(strike&&actor.plan==='ram'?12:0,ready?5:0);
    path('M-52 -68 Q-64 -102 -48 -129 L-61 -153 -39 -144 -41 -169 -18 -152 -8 -179 6 -153 Q44 -165 51 -132 Q54 -104 25 -83 L4 -63Z',shell);
    for(let rib=0;rib<5;rib++){
      ctx.save();ctx.translate(-44+rib*2,-105+rib*8);ctx.scale(1-rib*.075,1);
      path('M0 0 Q15 5 32 -3 L41 -10 Q39 2 26 7 L8 10Z','#37495c','#192d36',1.3);
      path('M3 1 Q16 6 31 -2 Q21 8 9 6Z','#9aaeb0',null);ctx.restore();
    }
    for(let n=0;n<5;n++){ctx.save();ctx.translate(-34+n*12,-114-n*1.4);path('M-8 -14 Q5 -7 4 13 Q-4 7 -11 5Z','#66878a');ctx.restore();}
    path('M-20 -128 Q0 -150 21 -127 L24 -111 50 -93 68 -95 52 -84 31 -89 10 -100 -9 -104Z',shell);
    path('M48 -94 L72 -103 60 -91 77 -94 53 -82Z','#dddbaf');
    ctx.save();ctx.translate(28,-143);ctx.rotate(ready&&actor.plan==='acid'?-.22:strike&&actor.plan==='ram'?.15:0);
    path('M-34 4 Q-53 -19 -65 -35 Q-16 -41 17 -29 Q44 -24 60 -5 L53 4 26 1 5 14Z',shell);
    path('M-50 -31 Q-11 -34 24 -22 L37 -14 Q3 -28 -42 -23Z','#afc6bb',null);
    for(let groove=0;groove<5;groove++){
      ctx.save();ctx.translate(-30+groove*9,-21+groove*.65);
      path('M-7 -2 Q-2 4 -4 13 L-9 17 Q-5 4 -10 0Z','#415c6b',null);ctx.restore();
    }
    path('M17 -11 L53 -5 39 1 20 -2Z','#17242b');
    for(let eye=0;eye<3;eye++)ellipse(22+eye*8,-7+eye,3.7,2.3,0,hot);
    const open=actor.plan==='acid'&&(ready||strike)?10:2;
    path('M13 3 L54 1 60 8 29 '+(15+open)+' 10 12Z','#27202d');
    for(let tooth=0;tooth<5;tooth++){const x=24+tooth*6;path('M'+x+' 4l5 -1 -2 8Z','#eee3bd',null);}
    path('M12 8 Q30 '+(16+open)+' 59 8 Q48 '+(28+open)+' 28 '+(23+open)+'Z',shell);
    if(ready&&actor.plan==='acid')ellipse(55,12,7,7+Math.sin(frame*.4)*2,0,hot);
    ctx.restore();ctx.restore();return true;
  }
}
