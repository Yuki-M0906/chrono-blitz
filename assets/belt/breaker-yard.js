class BreakerYard {
  static salvage={hood:[516,1173,273,169,110],door:[782,1167,216,207,87],wheel:[534,1350,165,173,58],glass:[703,1374,304,134,89]};
  static stage={title:'BREAKER YARD',music:3,areas:[{left:0,right:1280,name:'BREAKER YARD'}]};
  static labels=[
    ['','SPLITTER BUCKLED','HEADLAMP SHATTERED','GRILLE TORN OUT','ENGINE EXPOSED','HOOD CRUSHED','TOTAL WRECK'],
    ['','FENDER BUCKLED','GLASS SHATTERED','DOOR TORN OFF','FRAME EXPOSED','ROOF COLLAPSED','TOTAL WRECK']
  ];
  constructor(){
    this.max=1080;this.hp=this.max;this.level=0;this.elapsed=0;this.hits=0;this.flash=0;
    this.sideMax=this.max/2;this.integrity=[this.sideMax,this.sideMax];this.stages=[0,0];
    this.pieces=[];this.blasts=[];this.message=0;this.finish=0;this.award=0;this.notice='';
  }
  strike(street,actor,attack){
    if(!this.hp||attack.carHit||!attack.damage||street.intro)return;
    const contact=STREET.clamp(actor.x,400,880),gap=contact-actor.x;
    if(Math.abs(gap)>attack.reach||
       Math.abs(actor.y-547)>30+attack.depth||actor.z>172)return;
    if(Math.abs(actor.x-640)<52){this.notice='左右の端から狙え';this.message=45;return;}
    const side=actor.x<640?0:1,inward=side===0?1:-1;
    if(!attack.radial&&actor.facing!==inward)return;
    if(!this.integrity[side]){
      this.notice=side===0?'右側へ回り込め  →':'←  左側へ回り込め';this.message=78;return;
    }
    attack.carHit=true;actor.chainHit=true;
    this.hits++;
    const old=this.stages[side],damage=Math.min(this.integrity[side],Math.round(attack.damage));
    this.integrity[side]-=damage;this.hp=this.integrity[0]+this.integrity[1];
    const stage=this.stages[side]=Math.floor((this.sideMax-this.integrity[side])*6/this.sideMax);
    this.level=this.stages[0]+this.stages[1];
    const broke=stage>old;
    this.impactX=STREET.clamp(actor.x+inward*64,424,856);
    this.impactY=STREET.clamp(actor.y-83-actor.z,383,506);
    this.direction=inward;this.flash=broke?12:7;
    street.hitstop=broke?7:3;street.shake=broke?11:4;
    street.score+=damage*5+(stage-old)*250;
    sound.playWreck(side,stage,broke,!this.hp);
    this.scatter(this.impactX,this.impactY,broke?32:11,stage===2?'#baf3ff':'#ffd563');
    if(broke){
      const parts=side?['','trim','glass','door','rail','hood','wheel']:['','trim','glass','grille','hood','rail','trim'];
      const offsets=[0,156,83,151,83,69,162],heights=[0,495,368,445,430,374,504];
      for(let n=old+1;n<=stage;n++)this.eject(parts[n],640-inward*offsets[n],heights[n]);
      this.blasts.push({x:this.impactX,y:this.impactY,age:0,size:75});
      this.notice=this.integrity[side]?(side===0?'LEFT':'RIGHT')+'  /  '+BreakerYard.labels[side][stage]:
        (side===0?'右側へ回り込め  →':'←  左側へ回り込め');
      this.message=this.integrity[side]?54:110;
    }
    if(!this.hp){
      this.award=10000+Math.max(0,45-Math.ceil(this.elapsed/60))*200;
      street.score+=this.award;this.finish=1;street.hitstop=10;
      this.scatter(640,470,55,'#fff2bb');
      this.blasts.push({x:640,y:490,age:0,size:190});street.shake=18;
    }
  }
  scatter(x,y,count,color){
    for(let index=0;index<count;index++){
      const seed=this.hits*41+index*17,angle=seed*2.39996,speed=3+(seed%12);
      this.pieces.push({x,y,vx:Math.cos(angle)*speed,vy:-3-Math.abs(Math.sin(angle))*speed,
        spin:Math.sin(seed)*.24,angle,life:34+seed%24,size:2+seed%5,color:index%3?color:'#ec5149'});
    }
  }
  eject(part,x,y){
    this.pieces.push({part,x,y,vx:(x<640?-1:1)*6,vy:-12,angle:0,spin:(x<640?-.1:.1),life:110});
  }
  update(street){
    street.tick++;
    if(street.intro){street.intro--;if(street.intro===1)sound.playCue('start');return;}
    if(street.hitstop){street.hitstop--;return;}
    street.shake*=.82;this.flash=Math.max(0,this.flash-1);this.message=Math.max(0,this.message-1);
    for(const piece of this.pieces){
      piece.x+=piece.vx;piece.y+=piece.vy;piece.vy+=.55;piece.angle+=piece.spin;
      if(piece.y>570){piece.y=570;piece.vy*=-.38;piece.vx*=.76;piece.spin*=.72;}
      piece.life--;
    }
    this.pieces=this.pieces.filter(piece=>piece.life>0);
    for(const blast of this.blasts)blast.age++;
    this.blasts=this.blasts.filter(blast=>blast.age<28);
    if(this.finish){
      this.finish++;
      if(this.finish===7||this.finish===15){
        const x=this.finish===7?531:746;
        this.scatter(x,493,26,'#ffc47b');this.blasts.push({x,y:487,age:0,size:119});street.shake=9;
      }
      if(this.finish===22){street.result='perfect';street.player.pose('VICTORY');street.player.z=0;street.player.speak('win',100);sound.playBGM(7);sound.playCue('clear');}
      if(this.finish>82&&STREET.press('Enter','Space','KeyJ','KeyZ'))street.owner.startStreet(street.character,4,street);
      return;
    }
    this.elapsed++;
    const hero=street.player,lastX=hero.x,lastY=hero.y;
    street.updateActor(hero);if(!this.finish)street.playerInput();
    if(hero.x>392&&hero.x<888&&hero.y>511&&hero.y<571){
      if(lastX<=392)hero.x=392;else if(lastX>=888)hero.x=888;
      else hero.y=lastY<=511?511:571;
    }
  }
  draw(street,ctx){
    const text=(label,x,y,size,color='#fff',align='center')=>STREET.text(ctx,label,x,y,size,color,align,'900');
    ctx.save();ctx.fillStyle='#101822';ctx.fillRect(0,0,W,H);
    ctx.save();ctx.translate(Math.sin(street.tick*2)*street.shake,Math.cos(street.tick*2.7)*street.shake*.45);
    const yard=BeltArt.factoryBoards.get(0);
    if(yard)ctx.drawImage(yard,0,0,1280,641,0,0,1280,641);
    ctx.fillStyle='rgba(7,19,31,.36)';ctx.fillRect(0,0,W,641);
    ctx.fillStyle='#101922';ctx.fillRect(508,182,264,60);
    ctx.strokeStyle='#c39857';ctx.strokeRect(512,186,256,52);
    text('B R E A K E R   Y A R D',640,211,17,'#ffda96');text('SALVAGE DIVISION   /   BAY 07',640,229,10,'#a9b7b8');
    ctx.save();ctx.translate(638,557);ctx.scale(1,.24);
    ctx.strokeStyle='rgba(255,200,103,.55)';ctx.lineWidth=3;ctx.setLineDash([23,13]);ctx.strokeRect(-290,-152,580,245);ctx.restore();
    if(street.player.y<547)street.player.render(ctx);
    this.drawCar(ctx,street.tick);
    if(street.player.y>=547)street.player.render(ctx);
    for(const piece of this.pieces){
      ctx.save();ctx.translate(piece.x,piece.y);ctx.rotate(piece.angle);ctx.globalAlpha=Math.min(1,piece.life/12);
      const atlas=BeltArt.images.get('yard-gt'),clip=BreakerYard.salvage[piece.part];
      if(clip&&atlas){const [sx,sy,sw,sh,w]=clip,h=w*sh/sw;ctx.drawImage(atlas,sx,sy,sw,sh,-w/2,-h/2,w,h);}
      else if(piece.part==='grille'&&atlas)ctx.drawImage(atlas,118,251,113,44,-38,-15,76,30);
      else if(piece.part==='wheel')this.wheel(ctx,0,0,27);
      else if(piece.part){const shapes={door:[[-43,-17],[39,-15],[28,22],[-36,17]],hood:[[-59,-10],[34,-12],[57,3],[-38,12]],glass:[[-21,14],[-5,-21],[20,-15],[9,13]],rail:[[-59,-3],[12,-10],[48,4],[0,0]],trim:[[-31,-4],[32,-4],[24,5],[-25,5]],grille:[[-38,-14],[37,-10],[30,13],[-34,11]]};
        this.poly(ctx,shapes[piece.part],piece.part==='glass'?'#9ddbe5':piece.part==='trim'?'#c5d4da':'#b62f33','#272737',3);
      }else{ctx.fillStyle=piece.color;ctx.fillRect(-piece.size,0,piece.size*1.8,2.7);}
      ctx.restore();
    }
    for(const blast of this.blasts){
      const t=blast.age/28,radius=blast.size*(.18+.82*Math.sqrt(t));
      ctx.save();ctx.translate(blast.x,blast.y);
      const glow=ctx.createRadialGradient(0,0,0,0,0,radius);
      glow.addColorStop(0,'rgba(255,246,191,'+.64*(1-t)**2+')');
      glow.addColorStop(.46,'rgba(255,136,43,'+.30*(1-t)**2+')');glow.addColorStop(1,'rgba(240,80,26,0)');
      ctx.fillStyle=glow;ctx.fillRect(-radius,-radius,2*radius,2*radius);
      ctx.strokeStyle='rgba(255,222,151,'+.72*(1-t)**2+')';ctx.lineWidth=1+4*(1-t);
      ctx.beginPath();ctx.ellipse(0,0,radius,radius*.55,-.12,0,2*Math.PI);ctx.stroke();
      ctx.restore();
    }
    if(this.flash>2){
      ctx.save();ctx.translate(this.impactX,this.impactY);ctx.scale(this.direction,1);
      ctx.globalAlpha=Math.min(1,this.flash/7);
      this.poly(ctx,[[-30,4],[-7,-6],[-19,-34],[4,-13],[24,-49],[13,-10],[53,-19],[22,1],[46,12],[11,8],[10,29],[-2,10]],'#fff6ba','#ff9b32',3);
      ctx.restore();
    }ctx.restore();
    STREET.panel(ctx,25,19,1230,78,'rgba(7,16,25,.94)','#b59155');
    text('BONUS  /  BREAKER YARD',45,48,22,'#ffd68a','left');
    text(street.player.data.name+'   /   SCORE  '+street.score,45,77,16,'#e6eceb','left');
    for(let side=0;side<2;side++){
      const x=446+side*195,hp=this.integrity[side],tone=side?'#91dce1':'#ffd085';
      text((side?'RIGHT  /  右':'LEFT  /  左')+(hp?'':'   CLEAR'),x,47,14,hp?tone:'#b5b9ae','left');
      for(let n=0;n<6;n++){const bx=x+29*n;
        ctx.fillStyle='#394148';ctx.fillRect(bx,58,25,12);
        ctx.fillStyle=tone;ctx.fillRect(bx,58,25*STREET.clamp(hp/(this.sideMax/6)-n,0,1),12);
      }
    }
    text(this.hits+'  HITS',978,62,23,'#e7f2f4');
    text((this.elapsed/60).toFixed(1)+' s',1226,63,24,'#ffda95','right');
    if(this.message&&!this.finish)text(this.notice,640,150,26,'#ffe5a4');
    ctx.fillStyle='#101923';ctx.fillRect(0,641,W,H-641);
    text('J / Z  攻撃　　矢印 / WASD  移動　　車の手前・奥を通って左右を破壊　　45秒以内はタイム加点',640,682,17,'#e0cfad');
    if(street.intro)street.overlay(ctx,'BONUS STAGE','BREAKER YARD','左右から J / Z で攻撃！　両側の完全破壊で PERFECT');
    if(this.finish>=22){
      STREET.panel(ctx,292,139,696,133,'rgba(13,20,27,.94)','#d1a763');
      text('P E R F E C T',640,212,66,'#ffda74');
      text('完全破壊！   BONUS +'+this.award+'   /   TOTAL '+street.score,640,246,21,'#faf1d4');
      if(this.finish>82)text('NEXT  /  SKYHOOK ASCENT   　ENTER：ステージ5へ',640,619,20);
    }
    if(street.owner.paused)street.overlay(ctx,'PAUSED','BREAKER YARD','ESC：再開　 Q：ゲーム選択');
    ctx.restore();
  }
  poly(ctx,points,fill,stroke='#19232e',width=3){
    ctx.beginPath();points.forEach(([x,y],index)=>index?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
    ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();}
  }
  wheel(ctx,x,y,r){
    ctx.save();ctx.translate(x,y);
    for(const [scale,color] of [[1,'#10131b'],[.94,'#373e4a'],[.82,'#171d28'],[.70,'#b8c7c9'],[.60,'#37424d']]){
      ctx.beginPath();ctx.arc(0,0,r*scale,0,2*Math.PI);ctx.fillStyle=color;ctx.fill();}
    for(let index=0;index<6;index++){
      ctx.rotate(Math.PI/3);this.poly(ctx,[[-4,-4],[-1,-r*.64],[6,-r*.54],[4,-3]],'#a9bbc4',null);
    }ctx.fillStyle='#efdabc';ctx.fillRect(-4,-4,8,8);ctx.restore();
  }
  damagedBody(atlas){
    const [left,right]=this.stages,key=left*7+right;
    if(this.bodyKey===key)return this.body;
    const body=this.body??document.createElement('canvas');
    body.width=512;body.height=384;
    const g=body.getContext('2d'),roof=[46,46,46,46,46,90,185],sill=340;
    // Bend neighboring panels into the torn center seam. The axle line remains grounded.
    for(let x=0;x<512;x+=2){
      const fraction=STREET.clamp((x-168)/158,0,1),blend=fraction*fraction*(3-2*fraction);
      const top=roof[left]*(1-blend)+roof[right]*blend;
      const join=STREET.clamp((x-234)/32,0,1);
      for(const [stage,opacity] of [[left,1-join],[right,join]]){
        if(!opacity)continue;
        const scale=(sill-top)/(sill-roof[stage]);
        g.globalCompositeOperation='lighter';g.globalAlpha=opacity;
        g.drawImage(atlas,stage%2*512+x,Math.floor(stage/2)*384,2,384,x,sill*(1-scale),2,384*scale);
      }
    }
    g.globalAlpha=1;g.globalCompositeOperation='source-atop';
    // On the near front corner the lamp and the intercooler are visible head-on.
    // These parts can break away even while the passenger door is still pristine.
    if(left>=2&&left<=4){
      const lens=g.createRadialGradient(61,203,2,65,210,18);
      lens.addColorStop(0,'#666465');lens.addColorStop(.61,'#352e35');lens.addColorStop(1,'#151c25');
      g.fillStyle=lens;g.beginPath();g.ellipse(65,210,15,16,.27,0,2*Math.PI);g.fill();
      this.poly(g,[[51,205],[56,198],[63,195],[60,202],[62,207],[56,204],[53,213]],'#afc6c8',null);
      this.poly(g,[[71,213],[78,206],[77,217],[70,222],[63,224]],'#899eaa',null);
      this.poly(g,[[71,202],[66,214],[58,218],[65,212]],'#c6c7bc',null);
    }
    if(left>=3&&left<=4){
      this.poly(g,[[117,250],[147,253],[179,250],[174,261],[185,267],[175,277],[183,288],[165,300],[116,296]],'#211e24','#594648',2);
      for(let i=0;i<6;i++){
        const y=255+i*7;
        this.poly(g,[[119,y],[135,y+4],[150+i%3*5,y+2],[141,y+5],[133,y+6],[119,y+2]],'#797478',null);
      }
      this.poly(g,[[117,295],[146,301],[164,297],[175,299],[147,306],[115,300]],'#bdaca2',null);
    }
    // Hand-placed creases on the lamp surround, grille and door skin; exposed metal catches the yard light.
    for(let side=0;side<2;side++){
      const stage=this.stages[side];
      if(stage===6)continue;
      const origin=side?416:65,dir=side?-1:1;
      for(let dent=0;dent<stage;dent++){
        const x=origin+dir*[0,21,52,12,67][dent],y=[236,261,224,299,283][dent];
        g.save();g.translate(x,y);g.scale(dir,1);
        this.poly(g,[[0,2],[12,-2],[21,1],[35,-7],[24,5],[14,3],[4,10]],'#483439',null);
        this.poly(g,[[4,10],[14,3],[24,5],[35,-7],[25,7],[14,5]],'#b9aaa2',null);g.restore();
      }
    }
    this.body=body;this.bodyKey=key;return body;
  }
  drawCar(ctx,tick){
    ctx.save();ctx.translate(640,554);ctx.lineJoin='round';
    ctx.fillStyle='rgba(5,9,14,.65)';ctx.beginPath();ctx.ellipse(0,2,259,20,0,0,Math.PI*2);ctx.fill();
    const bounce=this.flash*Math.sin(tick*1.9)*.31;
    const atlas=BeltArt.images.get('yard-gt');
    if(atlas){
      ctx.translate(bounce,0);ctx.drawImage(this.damagedBody(atlas),-256,-276,512,316);
      for(let side=0;side<2;side++)if(this.stages[side]>=4)for(let puff=0;puff<5;puff++){
        const age=(tick+puff*15+side*7)%75,base=this.stages[side]===6?-84:-155;
        const x=(side?108:-92)+Math.sin(age*.055+puff)*13+age*.23,y=base-age*1.23;
        const plume=ctx.createRadialGradient(x,y,0,x,y,7+age*.24);
        plume.addColorStop(0,'rgba(127,141,148,'+(.34*(1-age/75))+')');plume.addColorStop(1,'rgba(70,76,82,0)');
        ctx.fillStyle=plume;ctx.fillRect(x-26,y-26,52,52);
      }
      ctx.restore();return;
    }
    for(let side=0;side<2;side++){
      ctx.save();ctx.beginPath();ctx.rect(side?0:-260,-300,260,370);ctx.clip();
      this.drawFallback(ctx,bounce,this.stages[side],tick);ctx.restore();
    }
    ctx.restore();
  }
  drawFallback(ctx,bounce,level,tick){
    ctx.translate(bounce,level>=5?11:0);
    const poly=(points,fill,stroke,width)=>this.poly(ctx,points,fill,stroke,width);
    const paint=ctx.createLinearGradient(0,-117,0,-21);
    for(const [offset,color] of [[0,'#ffaba0'],[.14,'#f44546'],[.38,'#dc343a'],[.48,'#a62033'],[.7,'#a72637'],[1,'#511c2e']])paint.addColorStop(offset,color);
    const glass=ctx.createLinearGradient(0,-170,0,-90);glass.addColorStop(0,'#abcbd9');glass.addColorStop(.36,'#49738b');glass.addColorStop(1,'#172b40');
    poly([[-225,-48],[-196,-72],[201,-72],[234,-48],[212,-19],[-213,-19]],'#232c35');
    if(level<6){
      this.wheel(ctx,-155,-32,38);this.wheel(ctx,151,-32,38);
      ctx.save();ctx.translate(0,bounce*.6);
      if(level<5){
        poly([[-155,-98],[-104,-153],[-76,-170],[15,-174],[49,-168],[119,-109],[153,-99]],paint);
        poly([[-138,-107],[-94,-153],[-76,-159],[-55,-159],[-65,-110]],level<2?glass:'#182333');
        poly([[-55,-110],[-45,-160],[13,-162],[36,-157],[89,-113]],level<2?glass:'#1b2936');
        poly([[46,-157],[59,-151],[117,-110],[100,-113]],level<2?'#8cabb5':'#283444');
        if(level<2){poly([[-45,-153],[-24,-157],[-54,-115]],'#bad9e2',null);poly([[5,-156],[25,-153],[-12,-115],[-32,-116]],'#7b9aa9',null);}
        if(level===1){poly([[37,-133],[29,-138],[35,-131],[18,-117],[39,-129],[47,-118],[42,-133],[51,-143]],'#dae9e8',null);}
        if(level>=2){poly([[-50,-157],[-31,-160],[-37,-147],[-43,-151],[-48,-141]],'#b0dbe3',null);
          poly([[-39,-107],[-39,-130],[-30,-139],[-18,-139],[-12,-108]],'#49505c');}
      }else poly([[-125,-95],[-90,-122],[-15,-110],[27,-125],[68,-111],[117,-94]],'#86414c');
      const nose=level>=1?-83:-96;
      poly([[-235,-91],[-206,-102],[-148,-106],[47,-114],[106,-111],[level>=4?144:183,level>=4?-87:-107],[224,nose],[242,-79],[243,-47],[226,-34],[197,-31],[190,-59],[177,-73],[156,-78],[134,-74],[119,-59],[111,-32],[-112,-30],[-117,-54],[-130,-70],[-153,-77],[-176,-72],[-189,-58],[-197,-30],[-230,-36],[-241,-53]],paint);
      poly([[-224,-89],[-151,-99],[67,-103],[108,-108],[66,-98],[-205,-83]],'#ffc3a8',null);
      poly([[-107,-50],[109,-57],[107,-40],[-110,-33]],'#3b2539',null);
      poly([[-95,-95],[76,-102],[61,-60],[-74,-52]],level<3?paint:'#202c37','#52313a',2);
      if(level<3){ctx.fillStyle='#c8b9b4';ctx.fillRect(-80,-88,21,4);ctx.fillStyle='#efbe80';ctx.font='italic bold 26px Georgia';ctx.fillText('07',-25,-66);}
      else{poly([[-80,-68],[48,-89],[43,-79],[-65,-57]],'#6e7374');poly([[9,-57],[14,-82],[32,-82],[43,-60]],'#4b5661');}
      if(level<4){poly([[111,-108],[178,-105],[219,nose],[188,-89],[127,-98]],level?'#bc3d44':'#ee625d');}
      else{poly([[110,-104],[144,-112],[176,-96],[214,-89],[197,-81],[126,-88]],'#232e37');
        for(let rib=0;rib<5;rib++)poly([[129+rib*10,-101],[135+rib*10,-100],[144+rib*10,-88],[139+rib*10,-88]],'#97a3a4',null);}
      poly([[204,-84],[235,-80],[233,-73],[208,-75]],level<2?'#fff0bd':'#443b43');
      poly([[-235,-85],[-210,-86],[-207,-77],[-235,-75]],'#ff7a58');
      ctx.fillStyle='#24313c';ctx.fillRect(211,-62,27,8);
      if(level<3)poly([[199,-44],[241,-50],[247,-45],[240,-39],[199,-36]],'#bcc5be');
      ctx.restore();
    }else{
      this.wheel(ctx,-154,-20,22);
      poly([[-227,-28],[-207,-55],[-164,-44],[-121,-63],[-74,-54],[-46,-78],[9,-60],[54,-73],[102,-43],[153,-57],[212,-38],[232,-20],[193,-10],[-192,-13]],paint);
      poly([[-120,-51],[-65,-62],[-28,-77],[9,-62],[69,-69],[110,-44],[33,-52],[-14,-46],[-66,-53]],'#343a43');
      poly([[-211,-30],[-126,-21],[-51,-35],[38,-25],[137,-36],[208,-22],[135,-18],[37,-18],[-49,-24],[-128,-14]],'#d6b19e',null);
    }
    if(level>=4){for(let puff=0;puff<6;puff++){const age=(tick+puff*12)%72;ctx.fillStyle='rgba(85,94,100,'+(.27*(1-age/72))+')';ctx.beginPath();ctx.arc(146+Math.sin(age*.04+puff)*12,-90-age*.91,5+age*.21,0,Math.PI*2);ctx.fill();}}
  }
}
