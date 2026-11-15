// v3.0 anime characters / v2.5 scenery. Visual layer only. No combat state, RNG, input, AI, audio or hitboxes are changed here.
const BeltArt = {
  images: new Map(),
  boards: new Map(),
  factoryBoards: new Map(),
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
    if (index > 0) {
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

  drawStreet(street, c) {
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
