// v1.5: generated detailed panoramas + animated ambience; v1.4 geometry is the decode fallback.
// World floor remains y=580. Backgrounds never consume the combat RNG.
const StageArt = {
  cache: new Map(),
  artwork: new Map(),
  errors: [],
  ready: null,
  load(sources) {
    this.ready=Promise.all(sources.map((entry,idx)=>new Promise(resolve=>{
      const image=new Image();
      image.onload=()=>{
        this.artwork.set(idx,{image,horizon:Math.round(image.height*entry.horizon)});
        resolve();
      };
      image.onerror=()=>{this.errors.push('Stage '+idx+' failed to decode');resolve();};
      image.src=entry.src;
    })));
    return this.ready;
  },
  palettes: [
    ['#110d30','#71305b','#dc667c','#322238','#ad7884'],
    ['#070e2c','#153e68','#28c8db','#14243b','#497590'],
    ['#101d40','#426e9c','#b7e9ef','#2c4869','#9ec9e1'],
    ['#553667','#e9987c','#ffde9f','#70504c','#d9ae79']
  ],
  build(idx) {
    const board = document.createElement('canvas'); board.width = 900; board.height = 360;
    const c = board.getContext('2d'); c.scale(0.5, 0.5);
    const p = this.palettes[idx];
    const rect = (x,y,w,h,color) => { c.fillStyle=color; c.fillRect(x,y,w,h); };
    const poly = (points,color) => { c.fillStyle=color; c.beginPath(); points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y)); c.closePath(); c.fill(); };
    const disk = (x,y,r,color) => { c.fillStyle=color; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill(); };
    const line = (x,y,x2,y2,color,w=2) => { c.strokeStyle=color; c.lineWidth=w; c.beginPath(); c.moveTo(x,y); c.lineTo(x2,y2); c.stroke(); };
    const sky = c.createLinearGradient(0,0,0,580); sky.addColorStop(0,p[0]); sky.addColorStop(0.65,p[1]); sky.addColorStop(1,p[2]);
    rect(0,0,1800,580,sky);
    if (idx === 0) {
      disk(1030,180,76,'#fbe3bd'); disk(1010,164,68,'#ffeccc');
      for(let i=0;i<90;i++) rect((i*173)%1800,70+(i*47)%240,2,2,'#ca99b4');
      for(let i=0;i<9;i++) poly([[i*260-100,480],[i*260+90,250+(i%3)*35],[i*260+300,480]],i%2?'#332441':'#422a48');
      // Layered castle roofs and warm shoji windows.
      for(let tower=0;tower<3;tower++) {
        const cx=360+tower*500, base=470;
        for(let tier=0;tier<4;tier++) {
          const w=230-tier*34,y=base-tier*72;
          rect(cx-w/2,y-42,w,60,'#54343e');
          for(let k=0;k<5;k++) rect(cx-w/2+18+k*(w-30)/5,y-30,14,26,'#efbb79');
          poly([[cx-w/2-40,y-40],[cx-w/2+10,y-68],[cx,y-100],[cx+w/2-10,y-68],[cx+w/2+40,y-40]],'#1c1931');
          line(cx-w/2-40,y-40,cx+w/2+40,y-40,'#a15168',5);
        }
      }
      rect(0,484,1800,68,'#322237');
      for(let x=0;x<1800;x+=84) {rect(x,468,10,102,'#6d3a4b');rect(x+12,486,64,7,'#a66370');}
      for(const side of [0,1480]) {
        poly([[side+40,580],[side+66,278],[side+150,150],[side+120,320],[side+92,580]],'#271b2a');
        for(let i=0;i<32;i++) { const x=side-70+(i*61)%360,y=110+(i*37)%180; disk(x,y,25+(i%4)*6,['#b95b89','#db7d9e','#8d416f'][i%3]); }
      }
      for(let x=100;x<1700;x+=320) {rect(x,397,8,160,'#302134');rect(x-14,380,36,40,'#ffd292');rect(x-20,374,48,8,'#5c2d3e');}
    } else if (idx === 1) {
      for(let layer=0;layer<2;layer++) for(let i=0;i<19;i++) {
        const x=i*104-layer*30,h=120+(i*79+layer*43)%270,y=470-h;
        rect(x,y,82,h,layer?'#132540':'#223858');
        for(let wy=y+16;wy<460;wy+=22) for(let wx=x+12;wx<x+72;wx+=18)
          if((wx+wy+i)%5!==0) rect(wx,wy,7,10,layer?'#45a7bf':'#5f7d9b');
        if(layer && i%3===0) {rect(x+5,y-14,72,6,'#e964b4');line(x+42,y-12,x+42,y-60,'#4e7699');}
      }
      for(let i=0;i<3;i++) { const x=180+i*550; rect(x,220,170,72,'#0b1c3f');rect(x+4,224,162,64,i%2?'#17627c':'#742b68');
        c.fillStyle=i%2?'#73eaff':'#ffa0df'; c.font='bold 25px monospace';c.textAlign='center';c.fillText(['NEO ARK','OVERDRIVE','24 / 7'][i],x+85,264); }
      rect(0,470,1800,18,'#09162e');rect(0,489,1800,4,'#4c97ac');
      for(let x=0;x<1800;x+=120) {rect(x,494,8,80,'#0a1428');line(x,502,x+120,558,'#22405c',3);}
      rect(0,558,1800,22,'#101b30');
    } else if (idx === 2) {
      for(let i=0;i<7;i++) poly([[i*300,440],[i*300+170,150+(i%2)*70],[i*300+320,440]],'#779fba');
      // Repeating Gothic arches and stained crystal windows.
      for(let x=120;x<1800;x+=330) {
        c.fillStyle='#23395e';c.beginPath();c.moveTo(x-100,540);c.lineTo(x-100,235);c.quadraticCurveTo(x-100,110,x,62);c.quadraticCurveTo(x+100,110,x+100,235);c.lineTo(x+100,540);c.fill();
        c.strokeStyle='#8bb7d3';c.lineWidth=12;c.stroke();
        poly([[x,110],[x-70,235],[x-70,485],[x+70,485],[x+70,235]],'#4364a0');
        for(let j=0;j<6;j++) {const y=210+j*45;poly([[x,y-27],[x+54,y],[x,y+27],[x-54,y]],j%2?'#80dae5':'#a69bd7');}
        line(x,115,x,485,'#ddf4ec',5);
        rect(x-130,150,24,416,'#55799b');rect(x+106,150,24,416,'#55799b');
      }
      rect(0,530,1800,50,'#4a7194');
      for(let i=0;i<14;i++) { const x=i*133, h=35+(i*23)%100;poly([[x,580],[x+15,580-h],[x+34,580-h-22],[x+52,580]],'#a0deed');poly([[x+34,558-h],[x+30,580],[x+52,580]],'#578fbe'); }
    } else {
      disk(970,234,82,'#ffe7ad');
      for(let i=0;i<13;i++) { const x=i*145,h=60+(i*31)%110;rect(x,398-h,110,h,'#7b637f');poly([[x-10,398-h],[x+55,348-h],[x+120,398-h]],'#594e70'); }
      rect(0,398,1800,182,'#47778a');
      for(let i=0;i<60;i++) rect((i*107)%1800,406+(i*29)%150,30+(i%4)*22,3,i%3?'#76a2a7':'#edbc98');
      // Lighthouse and sailboats.
      poly([[180,420],[205,185],[260,185],[285,420]],'#e0c3ae');rect(200,246,66,26,'#aa6562');rect(195,180,76,42,'#634e67');rect(210,188,47,25,'#ffe6ae');poly([[182,181],[232,143],[282,181]],'#493e5a');
      for(let i=0;i<3;i++) {const x=480+i*430; poly([[x-100,500],[x+110,500],[x+70,528],[x-60,528]],'#463b50');line(x,285,x,502,'#614a54',6);poly([[x-8,300],[x-8,478],[x-105,478]],'#f5d8b4');poly([[x+6,330],[x+6,478],[x+90,478]],'#be8179');}
      for(let x=60;x<1800;x+=240) {rect(x,519,14,61,'#59414c');line(x+7,532,x+247,546,'#d3a879',5);}
      line(0,90,1800,170,'#53485f',4);
      for(let i=0;i<24;i++) {const x=i*78,y=90+x*80/1800;poly([[x,y],[x+38,y+2],[x+19,y+42]],['#cf7180','#e7ba7a','#65a5ac'][i%3]);}
    }
    // Perspective floor: stone / metal / ice mosaic / wooden dock.
    rect(0,580,1800,140,p[3]); rect(0,580,1800,6,p[4]);
    for(let y=592;y<720;y+=idx===3?22:32) {line(0,y,1800,y,p[4],2);}
    for(let x=-500;x<2300;x+=120) line(800+(x-800)*0.45,582,x,720,p[4],2);
    if(idx===1) {rect(60,602,220,4,'#20d8de');rect(1100,602,220,4,'#eb64ac');}
    this.cache.set(idx,board);return board;
  },
  draw(ctx, idx, camX=0, tick=0, animated=true) {
    const art=this.artwork.get(idx);
    ctx.save();ctx.imageSmoothingEnabled=false;
    if(art) {
      const {image,horizon}=art;
      ctx.drawImage(image,0,0,image.width,horizon,camX*0.22,0,1600,580);
      ctx.drawImage(image,0,horizon,image.width,image.height-horizon,0,580,1600,140);
      // A restrained dark band behind fighters improves separation without flattening the scenery.
      const shade=ctx.createLinearGradient(0,320,0,590);
      shade.addColorStop(0,'rgba(5,9,20,0)');shade.addColorStop(.75,'rgba(5,9,20,0.17)');shade.addColorStop(1,'rgba(5,9,20,0)');
      ctx.fillStyle=shade;ctx.fillRect(camX,320,1280,270);
    } else {
      const board=this.cache.get(idx)||this.build(idx);
      ctx.drawImage(board,0,0,900,290,camX*0.65,0,1800,580);
      ctx.drawImage(board,0,290,800,70,0,580,1600,140);
    }
    if(animated) {
      ctx.save();ctx.beginPath();ctx.rect(camX,100,1280,475);ctx.clip();
      if(idx===0) for(let i=0;i<34;i++) {const x=(i*97+tick*(i%2?.65:1.1))%1500+camX-80,y=130+(i*53+tick*.3)%430;ctx.fillStyle=i%2?'#f3b2c6':'#cc6e99';ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(tick*.025+i));ctx.fillRect(-2,-1,i%2?5:3,2);ctx.restore();}
      if(idx===1) {ctx.strokeStyle='rgba(128,211,245,0.25)';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<58;i++){const x=(i*97+tick*2)%1400+camX,y=(i*61+tick*7)%570;ctx.moveTo(x,y);ctx.lineTo(x-6,y+20);}ctx.stroke();}
      if(idx===2) {
        ctx.fillStyle=`rgba(150,200,255,${.025+.012*Math.sin(tick*.01)})`;
        ctx.beginPath();ctx.moveTo(800+camX*.22,30);ctx.lineTo(1100+camX*.22,550);ctx.lineTo(990+camX*.22,550);ctx.closePath();ctx.fill();
        for(let i=0;i<40;i++){ctx.fillStyle=`rgba(209,246,255,${0.2+0.4*(1+Math.sin(tick*0.04+i))/2})`;ctx.fillRect(camX+(i*127)%1280,140+(i*59+tick*0.15)%420,2,2);}
      }
      if(idx===3) {
        ctx.fillStyle='rgba(255,220,150,.4)';for(let i=0;i<20;i++)ctx.fillRect(650+(i*113+tick*.35)%560+camX*.22,425+(i*31)%115,12+Math.sin(tick*.035+i)*8,1);
        ctx.strokeStyle='rgba(255,244,210,.75)';ctx.lineWidth=2;ctx.beginPath();
        for(let i=0;i<3;i++){const x=camX+(tick*.45+i*340)%1400-60,y=145+i*26,w=6+Math.sin(tick*.12+i)*3;ctx.moveTo(x-w,y-2);ctx.lineTo(x,y+2);ctx.lineTo(x+w,y-2);}ctx.stroke();
      }
      ctx.restore();
      if(idx===1){
        ctx.save();ctx.strokeStyle='rgba(90,196,239,.3)';ctx.lineWidth=1;
        for(let i=0;i<12;i++){const age=(tick+i*13)%46;ctx.globalAlpha=1-age/46;ctx.beginPath();ctx.ellipse(camX+(i*113)%1280,592+(i*17)%75,age*.33,age*.07,0,0,Math.PI*2);ctx.stroke();}
        ctx.restore();
      }
    }
    ctx.restore();
  }
};
StageArt.load(STAGE_SOURCES);
