// v3.0 anime characters / v2.5 scenery. Visual layer only. No combat state, RNG, input, AI, audio or hitboxes are changed here.
const BeltArt = {
  images: new Map(),
  boards: new Map(),
  factoryBoards: new Map(),
  metroBoards:new Map(), resortBoards:new Map(), resortWater:new Map(), beachSheets:new Map(), beachPalettes:new Map(), beachDecor:[],
  monsterSheet: null,
  monsterCells: [],
  monsterAtlases: new Map(),
  monsterContacts: new Map(),
  risingFx: null,
  breathFx: null,
  bossCells: new Map(),
  bossSheets: new Map(),
  dashSheets: new Map(),
  actionSheets: new Map(),
  props: [],
  errors: [],
  ready: null,
  boardWidth: 1432,
  curbY: 440,
  floorBottom: 641,

  load(sources) {
    this.ready = Promise.all(Object.entries(sources).map(([id, entry]) => new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        try {
          this.images.set(id, img);
          if (id.startsWith('district-')) this.prepareBoard(Number(id.slice(-1)), img, entry.horizon);
          else if (id.startsWith('metro-')) this.prepareBoard(Number(id.slice(-1)),img,entry.horizon,this.metroBoards);
          else if (id.startsWith('resort-')) { const n=Number(id.slice(-1));this.prepareBoard(n,img,entry.horizon,this.resortBoards);this.prepareResortWater(n); }
          else if(id==='subway-train'){const cc=document.createElement('canvas');cc.width=img.width;cc.height=img.height;const g=cc.getContext('2d');g.drawImage(img,0,0);this.trainBounds=this.bounds(g,0,0,img.width,img.height);}
          else if(id==='beach-decor')this.prepareBeachDecor(img);
          else if(id.startsWith('beach-'))this.beachSheets.set(id.slice(6),this.prepareBeachAtlas(img));
          else if (id.startsWith('factory-')) this.prepareBoard(Number(id.slice(-1)), img, entry.horizon, this.factoryBoards);
          else if (id === 'maw') {
            this.monsterSheet = FighterSprites.prepareAtlas(img, 'maw');
            const c=this.monsterSheet.getContext('2d',{willReadFrequently:true}),cell=FighterSprites.cell;
            this.monsterCells=Array.from({length:24},(_,i)=>this.bounds(c,i%6*cell,Math.floor(i/6)*cell,cell,cell));
          }
          else if (['maw-motion','maw-breath','maw-hurt'].includes(id)) {
            const atlas=this.prepareStrictAtlas(img),c=atlas.getContext('2d',{willReadFrequently:true}),cell=FighterSprites.cell;
            this.monsterAtlases.set(id,atlas);
            this.monsterContacts.set(id,Array.from({length:24},(_,i)=>this.bounds(c,i%6*cell,Math.floor(i/6)*cell,cell,cell).bottom+1));
          }
          else if (id === 'rise-fx') this.risingFx = this.prepareStrictAtlas(img, true);
          else if (id === 'maw-flame') {
            this.breathFx=document.createElement('canvas'); this.breathFx.width=img.width; this.breathFx.height=img.height;
            const c=this.breathFx.getContext('2d',{willReadFrequently:true}); c.drawImage(img,0,0);
            const data=c.getImageData(0,0,img.width,img.height);
            for(let i=3;i<data.data.length;i+=4) if(data.data[i]<24)data.data[i]=0;
            c.putImageData(data,0,0);
          }
          else if (id === 'props') this.prepareProps(img);
          else if (id.startsWith('voss-')) this.prepareBoss(id, img);
          else if (id.startsWith('dash-')) this.prepareDash(id.slice(5), img);
          else if (id.startsWith('rise-') || id === 'fx-fire') this.actionSheets.set(id, FighterSprites.prepareAtlas(img, id));
        } catch (error) { this.errors.push(id + ': ' + error.message); }
        resolve();
      };
      img.onerror = () => { this.errors.push(id + ': image decode failed'); resolve(); };
      img.src = entry.src;
    })));
    return this.ready;
  },

  prepareDash(id, image) {
    this.dashSheets.set(id, FighterSprites.prepareAtlas(image, 'dash-' + id));
  },

  dashFrame(actor) {
    if (actor.state === 'STREET_DASH') return Math.floor(actor.f / 3) % 8;
    if (actor.state !== 'DASH_ATTACK') return null;
    const d = STREET.dash;
    if (actor.f < d.active) return 8 + Math.min(3, Math.floor(actor.f * 4 / d.active));
    if (actor.f <= d.until) return 12 + Math.min(5, Math.floor((actor.f - d.active) * 6 / (d.until - d.active + 1)));
    return 18 + Math.min(5, Math.floor((actor.f - d.until - 1) * 6 / (d.end - d.until - 1)));
  },

  drawDash(actor, c) {
    const f = this.dashFrame(actor), image = this.dashSheets.get(actor.data.id);
    if (f === null || !image) return false;
    const scale = FighterSprites.scaleFor(actor.data.id), cell = FighterSprites.cell;
    c.save(); c.scale(actor.facing, 1); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    if (actor.invuln > 0 && Math.floor(actor.animTick / 3) % 2) c.globalAlpha *= .72;
    const draw = offset => c.drawImage(image, f % 6 * cell, Math.floor(f / 6) * cell, cell, cell,
      -Math.round(FighterSprites.pivotX * scale) + offset, -Math.round(FighterSprites.pivotY * scale), Math.round(cell * scale), Math.round(cell * scale));
    const alpha = c.globalAlpha;
    if (actor.state === 'STREET_DASH' || actor.f <= STREET.dash.until) {
      c.globalAlpha = alpha * .12; draw(-32);
      c.globalAlpha = alpha * .22; draw(-16);
      c.globalAlpha = alpha;
    }
    draw(0); c.restore(); return true;
  },

  // v3.4.2: Render-only action atlases, synchronized to fixed simulation frames.
  drawAction(key, frame, actor, c, offsetX = 0, offsetY = 0, alpha = 1, direction = actor.facing) {
    const image = this.actionSheets.get(key);
    if (!image) return false;
    const scale = FighterSprites.scaleFor(actor.data.id), cell = FighterSprites.cell;
    c.save(); c.scale(direction, 1); c.globalAlpha *= alpha;
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(image, frame % 6 * cell, Math.floor(frame / 6) * cell, cell, cell,
      -FighterSprites.pivotX * scale + offsetX, -FighterSprites.pivotY * scale + offsetY, cell * scale, cell * scale);
    c.restore(); return true;
  },
  prepareStrictAtlas(image, effects = false) {
    // New atlases never borrow pixels from adjacent drawings. Shared renderer stays unchanged.
    const c=document.createElement('canvas'); c.width=FighterSprites.cell*6; c.height=FighterSprites.cell*4;
    const g=c.getContext('2d',{willReadFrequently:true}), cell=FighterSprites.cell;
    for(let f=0;f<24;f++) {
      g.drawImage(image,f%6*256,Math.floor(f/6)*256,256,256,f%6*cell+64,Math.floor(f/6)*cell+64,256,256);
      FighterSprites.cleanCell(g,f%6*cell,Math.floor(f/6)*cell,effects);
    }
    return c;
  },
  risingBodyFrame(t) {
    // The body comes from the normal character atlas, at exactly its normal scale and pivot.
    // Separate VFX means a tall trail can never shrink/elongate the person to fit an action cell.
    const keys=[[0,0],[2,41],[4,6],[5,34],[6,15],[9,37],[10,8],[12,15],
      [15,37],[16,8],[18,15],[27,7],[31,38],[35,41],[39,11],[42,0]];
    let frame=0; for(const [at,pose] of keys) { if(t<at)break;frame=pose; } return frame;
  },
  drawRisingBody(actor, c) {
    const frame=this.risingBodyFrame(actor.f), sheet=FighterSprites.sheets.get(actor.data.id+(frame>=24?'-motion':''));
    if(!sheet) return false;
    const cell=FighterSprites.cell,scale=FighterSprites.scaleFor(actor.data.id),f=frame%24;
    c.save(); c.scale(actor.facing,1); c.imageSmoothingEnabled=true;
    c.drawImage(sheet.atlas,f%6*cell,Math.floor(f/6)*cell,cell,cell,
      -Math.round(FighterSprites.pivotX*scale),-Math.round(FighterSprites.pivotY*scale),Math.round(cell*scale),Math.round(cell*scale));
    c.restore(); return true;
  },
  drawRising(actor, c) {
    if (actor.state !== 'SP_2') return false;
    const ok=this.drawRisingBody(actor,c), t=actor.f;
    if(ok && this.risingFx && t>=4 && t<39) {
      const phase=t<6?0:t<9?1:t<12?0:t<15?1:t<18?0:t<28?2:3;
      const frame=CHARACTERS.findIndex(x=>x.id===actor.data.id)+phase*6,cell=FighterSprites.cell,scale=FighterSprites.scaleFor(actor.data.id);
      c.save(); c.scale(actor.facing,1); c.globalAlpha*=t>=28?Math.max(0,(39-t)/11):.9;
      c.drawImage(this.risingFx,frame%6*cell,Math.floor(frame/6)*cell,cell,cell,-FighterSprites.pivotX*scale,-FighterSprites.pivotY*scale,cell*scale,cell*scale);
      c.restore();
    }
    return ok;
  },
  drawBurn(actor, c) {
    if (!(actor.burnTicks > 0) || !['HIT_AIR','KNOCKDOWN','DEAD'].includes(actor.state)) return false;
    if (actor.monster) return this.drawMonster(actor, c);
    if (actor.resort) return this.drawResortActor(actor,c);
    const frame = actor.state === 'HIT_AIR' ? Math.min(11, Math.floor(actor.f / 2)) : 12 + Math.min(5, Math.floor(actor.f / 5));
    // Fire atlas tumbles to the RIGHT: orient by the captured launch vector, not the victim facing the attacker.
    return this.drawAction('fx-fire', frame, actor, c, 0, 0, 1, actor.burnDirection || Math.sign(actor.knockX) || -actor.facing);
  },
  drawFlameDash(actor, c) {
    if (actor.state !== 'DASH_ATTACK' || actor.f > STREET.dash.until + 5) return;
    const alpha = actor.f < STREET.dash.active ? .45 : actor.f > STREET.dash.until ? .55 : .9;
    this.drawAction('fx-fire', 18 + Math.floor(actor.f / 2) % 6, actor, c, 24, -12, alpha);
  },

  prepareBoard(index, image, horizon = .685, boards = this.boards) {
    const board = document.createElement('canvas');
    board.width = this.boardWidth; board.height = this.floorBottom;
    const c = board.getContext('2d'), split = Math.round(image.height * horizon);
    c.imageSmoothingEnabled = false;
    // Pin the painted curb to the existing depth plane. Buildings never change the playable bounds.
    c.drawImage(image, 0, 0, image.width, split, 0, 0, board.width, this.curbY);
    c.drawImage(image, 0, split, image.width, image.height - split, 0, this.curbY, board.width, board.height - this.curbY);
    if (index > 0 && boards!==this.resortBoards && boards!==this.metroBoards) {
      c.globalCompositeOperation = 'destination-in';
      const blend = c.createLinearGradient(0, 0, 192, 0);
      blend.addColorStop(0, 'rgba(0,0,0,0)'); blend.addColorStop(1, 'rgba(0,0,0,1)');
      c.fillStyle = blend; c.fillRect(0, 0, board.width, board.height);
    }
    boards.set(index, board);
  },

  bounds(c, x, y, width, height) {
    const data = c.getImageData(x, y, width, height).data;
    let left = width, top = height, right = -1, bottom = -1, count = 0;
    for (let py = 0; py < height; py++) for (let px = 0; px < width; px++) {
      if (data[(py * width + px) * 4 + 3] <= 24) continue;
      left = Math.min(left, px); right = Math.max(right, px);
      top = Math.min(top, py); bottom = Math.max(bottom, py); count++;
    }
    if (right < left) throw Error('Empty sprite cell');
    return { x: x + left, y: y + top, w: right - left + 1, h: bottom - top + 1, bottom, count };
  },

  prepareProps(image) {
    const board = document.createElement('canvas'); board.width = image.width; board.height = image.height;
    const c = board.getContext('2d', { willReadFrequently: true }); c.drawImage(image, 0, 0);
    for (let i = 0; i < 8; i++) {
      const x0 = Math.round((i % 4) * image.width / 4), x1 = Math.round((i % 4 + 1) * image.width / 4);
      const y0 = Math.round(Math.floor(i / 4) * image.height / 2), y1 = Math.round((Math.floor(i / 4) + 1) * image.height / 2);
      this.props[i] = this.bounds(c, x0, y0, x1 - x0, y1 - y0);
    }
  },

  prepareBoss(id, image) {
    const board = FighterSprites.prepareAtlas(image, id), cell = FighterSprites.cell;
    const c = board.getContext('2d', { willReadFrequently: true }), cells = [];
    for (let i = 0; i < 24; i++) cells.push(this.bounds(c, i % 6 * cell, Math.floor(i / 6) * cell, cell, cell));
    this.bossSheets.set(id, board);
    this.bossCells.set(id, cells);
  },

  prepareResortWater(index) {
    const source=this.resortBoards.get(index),water=document.createElement('canvas');water.width=source.width;water.height=source.height;
    const c=water.getContext('2d',{willReadFrequently:true});c.drawImage(source,0,0);const d=c.getImageData(0,0,water.width,water.height);
    for(let y=0;y<water.height;y++)for(let x=0;x<water.width;x++){
      const i=(y*water.width+x)*4,r=d.data[i],g=d.data[i+1],b=d.data[i+2];
      const ocean=y>215&&y<420&&x>(index===3?700:390)&&g>105&&b>120&&r<g*.83;
      if(!ocean)d.data[i+3]=0;
    }c.putImageData(d,0,0);this.resortWater.set(index,water);
  },
  prepareBeachAtlas(image) {
    // Lunges cross the nominal cell's left edge. Include horizontal bleed only,
    // then retain the character's connected silhouette, never the adjacent row.
    const canvas=document.createElement('canvas'),cell=FighterSprites.cell;
    canvas.width=cell*6;canvas.height=cell*4;
    const c=canvas.getContext('2d',{willReadFrequently:true});
    for(let f=0;f<24;f++){
      const col=f%6,row=Math.floor(f/6);
      c.drawImage(image,col*256-96,row*256,384,256,col*cell,row*cell+64,384,256);
      FighterSprites.cleanCell(c,col*cell,row*cell,false);
    }
    return canvas;
  },
  prepareBeachDecor(image) {
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
    for(let i=0;i<8;i++)this.beachDecor[i]=this.bounds(c,i%4*384,Math.floor(i/4)*512,384,512);
  },
  drawBeachDecor(c,frame,x,y,w,h) {
    const box=this.beachDecor[frame],image=this.images.get('beach-decor');if(!box||!image)return;
    c.drawImage(image,box.x,box.y,box.w,box.h,x,y,w,h);
  },
  drawResortStreet(s,c) {
    if(this.resortBoards.size!==5)return false;
    const t=s.tick;c.save();c.fillStyle='#a8e8ff';c.fillRect(0,0,W,H);c.translate(-Math.round(s.camera),0);
    for(const i of [s.area]){
      const x=s.camera-STREET.clamp(s.camera-i*1240+96,0,this.boardWidth-W);
      c.save();c.beginPath();c.rect(s.camera,0,W,641);c.clip();
      c.drawImage(this.resortBoards.get(i),x,0);
      const water=this.resortWater.get(i);
      // Move only the water pixels: boats, rails and architecture remain anchored.
      for(let y=216;y<420;y+=4){const shift=Math.sin(t*.045+y*.09+i)*2.8;c.drawImage(water,0,y,1432,4,x+shift,y,1432,4);}
      c.save();c.globalCompositeOperation='screen';c.globalAlpha=.22+.12*Math.sin(t*.04+i);
      for(let n=0;n<14;n++){const wx=x+550+n*51,wy=280+(n*31)%115;const blink=Math.max(0,Math.sin(t*.06+n));c.fillStyle='rgba(230,255,255,'+blink+')';c.fillRect(wx+Math.sin(t*.02+n)*7,wy,8+blink*12,1);}
      c.restore();
      c.save();c.translate(x+30,-18);c.rotate(Math.sin(t*.025+i)*.045);this.drawBeachDecor(c,0,0,0,200,220);c.restore();
      c.save();c.translate(x+1260,-22);c.rotate(-Math.sin(t*.027+i)*.05);this.drawBeachDecor(c,1,-170,0,200,220);c.restore();
      if(i===4){for(let j=0;j<2;j++){c.save();c.translate(x+350+j*320,90);c.transform(1,0,Math.sin(t*.04+j)*.045,1,0,0);this.drawBeachDecor(c,4+j,0,0,65,160);c.restore();}}
      c.restore();
    }
    c.restore();c.save();
    for(let j=0;j<3;j++){const x=(t*(.8+j*.18)+j*440)%(W+140)-70,y=150+j*35+Math.sin(t*.02+j)*12;this.drawBeachDecor(c,Math.floor(t/12+j)%2?2:3,x,y,46,30);}
    c.restore();return true;
  },
  resortPose(a) {
    if(a.twin&&['TWIN_WINDUP','TWIN_ATTACK'].includes(a.state)) {
      const row=a.twinMode==='spear'? (a.twinPattern===2?3:1) :a.twinMode==='parasol'?(a.twinPattern===2?3:1):a.twinMode==='tonfa'?2: (a.twinPattern===2?2:0);
      const f=a.state==='TWIN_WINDUP'?Math.min(1,Math.floor(a.f/24)):2+Math.min(3,Math.floor(a.f/12));
      return [a.resort+'-motion',row*6+f];
    }
    let f=0;
    if(a.armored&&['CHARGE','SLAM'].includes(a.state))return ['warlord',a.state==='CHARGE'?9+Math.floor(a.f/5)%3:a.f<16?12:a.f<28?15:11];
    if(a.dead||a.state==='KNOCKDOWN')f=20;
    else if(a.state==='WAKEUP')f=a.f<9?21:1;
    else if(a.state==='GRABBED')f=a.throwFrame>=62?19:18;
    else if(a.state==='HIT_AIR')f=a.throwFlight?19:17;
    else if(a.state==='HIT_STAND')f=16;
    else if(a.state==='WINDUP')f=8;
    else if(a.state==='ATK_H')f=a.f<5?8:a.f<12?9:a.f<20?10:11;
    else if(a.state==='WALK_F')f=2+Math.floor(a.animTick/4)%6;
    return [a.resort,f];
  },
  beachPalette(id,hue) {
    const key=id+':'+hue;if(this.beachPalettes.has(key))return this.beachPalettes.get(key);
    const src=this.beachSheets.get(id);if(!src)return null;
    if(!hue)return src;
    const canvas=document.createElement('canvas');canvas.width=src.width;canvas.height=src.height;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(src,0,0);const original=c.getImageData(0,0,src.width,src.height);
    c.clearRect(0,0,src.width,src.height);c.filter='hue-rotate('+hue+'deg)';c.drawImage(src,0,0);c.filter='none';const d=c.getImageData(0,0,src.width,src.height),a=original.data;
    for(let i=0;i<a.length;i+=4){const costume=id==='coral'?a[i]>a[i+1]*1.8:id==='azure'?a[i+2]>a[i]*1.2:a[i+2]>a[i+1]*1.3;if(!costume)for(let k=0;k<3;k++)d.data[i+k]=a[i+k];}
    c.putImageData(d,0,0);this.beachPalettes.set(key,canvas);return canvas;
  },
  drawResortActor(a,c) {
    const [id,f]=this.resortPose(a),image=this.beachPalette(id,a.resortHue||0);if(!image)return false;
    const cell=FighterSprites.cell,k=FighterSprites.scaleFor(a.data.id);c.save();c.scale(a.facing,1);c.imageSmoothingEnabled=true;
    if(a.burnTicks>0){c.filter='sepia(.8) saturate(3)';c.shadowColor='#ff671c';c.shadowBlur=16;}
    c.drawImage(image,f%6*cell,Math.floor(f/6)*cell,cell,cell,-(FighterSprites.pivotX+32)*k,-FighterSprites.pivotY*k,cell*k,cell*k);c.restore();return true;
  },
  drawMetroStreet(s,c) {
    c.save();c.fillStyle='#080d14';c.fillRect(0,0,W,H);c.translate(-Math.round(s.camera),0);
    for(const i of [s.area]){const x=s.camera;
      c.save();c.beginPath();c.rect(x,0,W,641);c.clip();c.drawImage(this.metroBoards.get(i),x-STREET.clamp(s.camera-i*1240+96,0,this.boardWidth-W),0);
      // Structural joins hide the hard boundary between deliberately different environments.
      
      if(i===1||i===2){const ev=s.metroEvent,u=ev?.kind==='stop'?Math.min(150,ev.f):0,travel=ev?.kind==='stop'?ev.startTick+u-u*u/300:s.tick;for(let n=0;n<6;n++){const xx=x+(travel*14+n*270)%1500-150;c.fillStyle='rgba(255,193,99,.12)';c.fillRect(xx,100,7,220);}}
      if(i===4){const image=this.images.get('arena-crowd');if(image)for(let tier=0;tier<3;tier++){
        const width=[150,180,220][tier],height=328*width/768,base=[170,270,355][tier];
        for(let j=0;j<Math.ceil(W/width)+1;j++){const frame=Math.floor(s.tick/12+j+tier)%4;
          c.drawImage(image,frame%2*768,Math.floor(frame/2)*512+88,768,328,x+j*width-25,base-height,width,height);
        }
      }}
      c.restore();
    }c.restore();return true;
  },
  drawStreet(street, c) {
    if(street.stageIndex===3)return this.drawMetroStreet(street,c);
    if(street.stageIndex===2)return this.drawResortStreet(street,c);
    const boards = street.stageIndex === 1 ? this.factoryBoards : this.boards;
    if (boards.size !== 5) return false;
    c.save(); c.imageSmoothingEnabled = false;
    c.fillStyle = '#101924'; c.fillRect(0, 0, W, H);
    c.translate(-Math.round(street.camera), 0);
    for (let i = 0; i < 5; i++) {
      const x = i * 1240 - 96;
      if (x > street.camera + W || x + this.boardWidth < street.camera) continue;
      c.drawImage(boards.get(i), x, 0);
    }
    // Subtle moving reflections/steam/rain sit over painted detail without obscuring the lane warnings.
    const t = street.tick;
    for (let n = 0; n < 20; n++) {
      const x = 120 + n * 311;
      if (x < street.camera - 130 || x > street.camera + W + 130) continue;
      c.globalAlpha = .035 + .015 * Math.sin(t * .045 + n);
      c.fillStyle = n % 2 ? '#eb9f7d' : '#6fe1e5';
      for (let j = 0; j < 4; j++) c.fillRect(x + Math.sin(t * .028 + j) * 5, 488 + (n % 3) * 38 + j * 4, 24 + j * 16, 1);
    }
    for (const x of [710, 1820, 3010, 4450, 5610]) {
      if (x < street.camera - 80 || x > street.camera + W + 80) continue;
      for (let i = 0; i < 5; i++) {
        const age = (t + i * 29) % 145;
        c.globalAlpha = .035 * Math.sin(age / 145 * Math.PI);
        c.fillStyle = '#b9d3d5'; c.beginPath();
        c.ellipse(x + Math.sin(age * .035 + i) * 16, 438 - age * .62, 13 + age * .11, 9 + age * .07, 0, 0, Math.PI * 2); c.fill();
      }
    }
    c.restore();
    c.save(); c.strokeStyle = street.stageIndex === 1 ? 'rgba(255,147,65,.32)' : 'rgba(176,207,223,.17)'; c.lineWidth = 1;
    for (let i = 0; i < 62; i++) {
      const x = (i * 173 + t * (street.stageIndex === 1 ? .3 : 2)) % W, y = (i * 91 + t * (street.stageIndex === 1 ? .7 : 8)) % 641;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x - (street.stageIndex === 1 ? 1 : 5), y + (street.stageIndex === 1 ? 2 : 14)); c.stroke();
    }
    c.restore(); return true;
  },

  object(c, frame, x, y, maxW, maxH) {
    const image = this.images.get('props'), box = this.props[frame];
    if (!image || !box) return false;
    const scale = Math.min(maxW / box.w, maxH / box.h), w = Math.round(box.w * scale), h = Math.round(box.h * scale);
    c.imageSmoothingEnabled = false;
    c.drawImage(image, box.x, box.y, box.w, box.h, Math.round(x - w / 2), Math.round(y - h), w, h);
    return true;
  },

  drawProp(c, p) {
    if(p.resort&&this.beachDecor.length){
      c.save();c.fillStyle='rgba(13,56,67,.2)';c.beginPath();c.ellipse(p.x,p.y,40,10,0,0,Math.PI*2);c.fill();
      this.drawBeachDecor(c,p.type==='crate'?6:7,p.x-40,p.y-65,80,65);
      if(p.hp<24){c.strokeStyle='#35606a';c.lineWidth=2;c.beginPath();c.moveTo(p.x-15,p.y-60);c.lineTo(p.x+5,p.y-37);c.lineTo(p.x-8,p.y-10);c.stroke();}c.restore();return true;
    }
    if (this.props.length !== 8) return false;
    c.save(); c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(p.x, p.y, 34, 9, 0, 0, Math.PI * 2); c.fill();
    const frame = (p.type === 'barrel' ? 2 : 0) + (p.hp < 24 ? 1 : 0);
    this.object(c, frame, p.x, p.y, p.type === 'barrel' ? 57 : 76, p.type === 'barrel' ? 79 : 69);
    c.restore(); return true;
  },

  drawItem(street, c, item) {
    if (this.props.length !== 8) return false;
    c.save();
    const frame = item.type === 'food' ? 4 : item.type === 'cash' ? 5 : 6;
    const y = item.y - 4 - Math.sin((item.age + street.tick) / 12) * 3;
    c.shadowBlur = 7; c.shadowColor = item.type === 'food' ? '#8ed8a2' : '#f0c77f';
    this.object(c, frame, item.x, y, frame === 6 ? 86 : frame === 4 ? 58 : 47, frame === 6 ? 19 : 35);
    c.shadowBlur = 0;
    if (frame !== 5) STREET.text(c, frame === 4 ? 'FOOD' : 'PIPE', item.x, item.y + 17, 10, frame === 4 ? '#b4e4bc' : '#cbdce5', 'center');
    c.restore(); return true;
  },

  drawPipe(c) {
    if (this.props.length !== 8) return false;
    c.save(); this.object(c, 7, 0, 18, 13, 85); c.restore(); return true;
  },

  bossFrame(actor, state, f) {
    const thrown = ThrowMotion.sprite(actor, state, f);
    if (thrown !== null) return thrown;
    // Keep the boss's silhouette stable too; idle atlases differ in size and stance.
    if (state === 'IDLE') return 0;
    if (actor.state === 'WINDUP') return actor.plan === 'slam' ? 44 : 39;
    // Match the existing damage / sound event at SLAM frame 20 exactly.
    if (actor.state === 'SLAM') return f < 20 ? 44 : f < 33 ? 14 : f < 43 ? 47 : 11;
    return FighterSprites.frame('titan', state, f, actor.animTick, actor.blockstun > 0, actor.vy);
  },

  monsterPose(a) {
    const f=a.f, seq=(start,count,step)=>start+Math.min(count-1,Math.floor(f/step));
    if(a.dead) return ['maw-hurt',f<5?18:19];
    if(a.state==='KNOCKDOWN') return ['maw-hurt',f<5?18:19];
    if(a.state==='WAKEUP') return ['maw-hurt',20+Math.min(3,Math.floor(f/3))];
    if(a.state==='GRABBED') return ['maw-hurt',a.monsterHit==='rising'?6:a.throwFrame>=62?Math.min(17,a.throwFrame-48):a.throwFrame===61?13:12];
    if(a.state==='THROWING') return ['maw-hurt',seq(14,4,5)];
    if(a.state==='HIT_AIR') return ['maw-hurt',a.throwFlight?14+Math.min(3,Math.floor(f/4)):6+Math.min(5,Math.floor(f/4))];
    if(a.state==='HIT_STAND') return ['maw-hurt',a.monsterHitHeavy?3+Math.min(2,Math.floor(f/4)):Math.min(2,Math.floor(f/4))];
    if(a.state==='WINDUP') {
      if(a.plan==='breath') return ['maw-breath',Math.min(5,Math.floor(f/10))];
      if(a.plan==='slam') return ['maw-motion',6+Math.min(3,Math.floor(f*4/Math.max(1,a.windup)))];
      return ['maw-motion',18+Math.min(2,Math.floor(f*3/Math.max(1,a.windup)))];
    }
    if(a.state==='BREATH') return ['maw-breath',f<18?6+Math.floor(f/3):f<66?12+Math.floor((f-18)/4)%6:18+Math.min(5,Math.floor((f-66)/3))];
    if(a.state==='SLAM') return ['maw-motion',f<20?8+Math.min(1,Math.floor(f/10)):f<30?10:11];
    if(a.state==='CHARGE') return ['maw-motion',12+Math.floor(f/3)%6];
    if(a.state==='ATK_H') return ['maw-motion',18+Math.min(5,Math.floor(f/5))];
    if(a.state==='WALK_F') return ['maw-motion',Math.floor(a.animTick/5)%6];
    return ['maw',0];
  },
  monsterFrame(a) { return this.monsterPose(a)[1]; },
  monsterFoot(actor) {
    const [id,frame]=this.monsterPose(actor);
    return actor.z>0?FighterSprites.pivotY:id==='maw'?this.monsterCells[frame].bottom+1:this.monsterContacts.get(id)[frame];
  },
  drawMonster(actor, c) {
    const [id,frame]=this.monsterPose(actor), image=id==='maw'?this.monsterSheet:this.monsterAtlases.get(id);
    if(!image) return false;
    const cell=FighterSprites.cell,scale=FighterSprites.scaleFor('titan');
    // Align the actual contact point to the floor, without changing body scale.
    const foot=this.monsterFoot(actor);
    c.save(); c.scale(actor.burnTicks>0 ? (actor.burnDirection || actor.facing) : actor.facing,1);
    if(actor.burnTicks>0){c.filter='sepia(.7) saturate(3)';c.shadowColor='#ff6a14';c.shadowBlur=16;}
    c.imageSmoothingEnabled=true;
    c.drawImage(image,frame%6*cell,Math.floor(frame/6)*cell,cell,cell,-FighterSprites.pivotX*scale,-foot*scale,cell*scale,cell*scale);
    c.restore(); return true;
  },
  drawMonsterBreath(actor,c) {
    if(!this.breathFx || actor.state!=='BREATH' || actor.f<6 || actor.f>=78) return;
    const f=actor.f,frame=f<18?Math.floor((f-6)/4):f<66?3+Math.floor((f-18)/3)%6:9+Math.min(2,Math.floor((f-66)/4));
    // Actor-local coordinates: draw after the monster body, locked to the open jaw.
    const scale=FighterSprites.scaleFor('titan');
    c.save(); c.scale(actor.facing,1);c.translate(92*scale,(-114+FighterSprites.pivotY-this.monsterFoot(actor))*scale);c.rotate(.28);
    c.imageSmoothingEnabled=true;
    c.drawImage(this.breathFx,frame%3*512,Math.floor(frame/3)*256,512,256,-8,-82,350,175);
    c.restore();
  },
  drawBoss(actor, c, state, f) {
    if (actor.monster) return this.drawMonster(actor,c);
    if (this.bossCells.size !== 3) return false;
    const pose = this.bossFrame(actor, state, f);
    const id = pose >= 48 ? 'voss-throw' : pose >= 24 ? 'voss-motion' : 'voss-base';
    const frame = pose % 24, image = this.bossSheets.get(id), box = this.bossCells.get(id)[frame];
    const scale = FighterSprites.scaleFor('titan'), cell = FighterSprites.cell, foot = actor.z > 0 ? FighterSprites.pivotY : box.bottom + 1;
    c.save(); c.scale(actor.facing, 1); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    if (actor.invuln > 0 && Math.floor(actor.animTick / 3) % 2) c.globalAlpha *= .72;
    c.drawImage(image, frame % 6 * cell, Math.floor(frame / 6) * cell, cell, cell, -FighterSprites.pivotX * scale, -foot * scale, cell * scale, cell * scale);
    c.restore(); return true;
  }
};
BeltArt.load(BELT_ART_SOURCES);
