// Source of the embedded v1.7 sprite renderer. Run: node tools/build-sprites.mjs
// 6 columns x 4 rows; 256px source cells, 160px cached cells including 16px gutters.
const FighterSprites = {
  sheets: new Map(),
  errors: [],
  ready: null,

  load(sources) {
    this.ready = Promise.all(Object.entries(sources).map(([id, src]) => new Promise(resolve => {
      const motion = /-(motion|throw)$/.test(id), characterId = id.replace(/-(motion|throw)$/,'');
      const image = new Image();
      image.onload = () => {
        try {
          if (image.width !== 1536 || image.height !== 1024) throw new Error('Expected 1536x1024 atlas');
          const atlas = document.createElement('canvas');
          atlas.width = 960; atlas.height = 640;
          const c = atlas.getContext('2d', { willReadFrequently: true }); // cleanCell reads every cell back
          c.imageSmoothingEnabled = false;
          for (let frame = 0; frame < 24; frame++) {
            // Hand-audited slice corrections: generated sheets are not perfectly grid-aligned.
            // Gutters preserve extended sword tips and the left edge of horizontal knockdowns.
            const col = frame % 6, row = Math.floor(frame / 6);
            let left = 0, top = 0, right = 256, bottom = 256;
            if (!motion && frame === 20) { left = -32; right = 264; }
            if (!motion && frame === 9) bottom = 244;
            if (!motion && id === 'freya' && frame === 15) top = -16;
            if (!motion && id === 'freya' && frame === 10) right = 288;
            c.save();
            c.translate(col * 160 + 16, row * 160 + 16);
            c.scale(0.5, 0.5);
            c.beginPath();
            c.rect(left, top, right - left, bottom - top); c.clip();
            c.drawImage(image, -col * 256, -row * 256);
            // Remove only identified fragments of an adjacent pose, retaining the sprite's alpha.
            if (!motion && frame === 19) c.clearRect(224, 180, 32, 76);
            if (!motion && id === 'freya' && frame === 11) c.clearRect(0, 86, 34, 40);
            if (!motion && id === 'freya' && frame === 10) {
              c.clearRect(256, 0, 32, 86); c.clearRect(256, 126, 32, 130);
            }
            c.restore();
            // A generated pose can spill into a neighboring cell. Isolate this pose's
            // connected silhouette; retain separate substantial spell effects in cast frames.
            this.cleanCell(c, col * 160, row * 160, motion ? frame === 20 || frame === 22 : frame === 14 || frame === 17);
          }
          const ghost = document.createElement('canvas');
          ghost.width = atlas.width; ghost.height = atlas.height;
          const g = ghost.getContext('2d');
          g.drawImage(atlas, 0, 0);
          g.globalCompositeOperation = 'source-in';
          g.fillStyle = { kagura: '#ff4466', volt: '#00efff', freya: '#a4e8ff', titan: '#ff9b32', ayame: '#d9a2ff', celine: '#70ffc5' }[characterId];
          g.fillRect(0, 0, ghost.width, ghost.height);
          this.sheets.set(id, { atlas, ghost });
        } catch (error) { this.errors.push(id + ': ' + error.message); }
        resolve();
      };
      image.onerror = () => { this.errors.push(id + ': image decode failed'); resolve(); };
      image.src = src;
    })));
    return this.ready;
  },

  cleanCell(ctx, x, y, keepEffects) {
    const image = ctx.getImageData(x, y, 160, 160), pixels = image.data;
    const labels = new Int32Array(160 * 160), sizes = [0];
    const queue = new Int32Array(labels.length);
    for (let seed = 0; seed < labels.length; seed++) {
      if (labels[seed] || pixels[seed * 4 + 3] < 32) continue;
      const label = sizes.length;
      let read = 0, write = 1; queue[0] = seed; labels[seed] = label;
      while (read < write) {
        const p = queue[read++], px = p % 160, py = Math.floor(p / 160);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (px + dx < 0 || px + dx >= 160 || py + dy < 0 || py + dy >= 160) continue;
          const n = p + dy * 160 + dx;
          if (!labels[n] && pixels[n * 4 + 3] >= 32) { labels[n] = label; queue[write++] = n; }
        }
      }
      sizes.push(write);
    }
    const largest = sizes.indexOf(Math.max(...sizes));
    for (let p = 0; p < labels.length; p++) {
      const label = labels[p];
      if (!label || (label !== largest && !(keepEffects && sizes[label] >= 50))) pixels[p * 4 + 3] = 0;
    }
    ctx.putImageData(image, x, y);
  },

  frame(id, state, f, tick, blocking, vy = 0) {
    if (blocking && !state.startsWith('HIT')) return state === 'CROUCH' ? 6 : (Math.floor(tick / 4) % 2 ? 42 : 21);
    const cycle = (frames, speed) => frames[Math.floor(tick / speed) % frames.length];
    const phase = (windup, end, active, follow = 35) => f < Math.ceil(windup / 2) ? 34 : f < windup ? 8 :
      f <= end ? (f < windup + 4 ? active : follow) : f < end + 5 ? 36 : 11;
    switch (state) {
      case 'IDLE': return cycle([0, 24, 1, 25, 26, 27], 6);
      case 'WALK_F': return cycle([2, 28, 3, 29, 4, 30, 5, 31], 3);
      case 'WALK_B': return cycle([31, 5, 30, 4, 29, 3, 28, 2], 3);
      case 'DASH_F': return cycle([39, 16, 40, 16], 3);
      case 'DASH_B': return f < 4 ? 37 : vy > 0 ? 38 : 7;
      case 'CROUCH': return f < 3 ? 41 : 6;
      case 'JUMP': return f < 4 ? 37 : vy > 2 ? 38 : 7;
      case 'ATK_L': return f < 1 ? 32 : f < 3 ? 8 : f < 6 ? 9 : f <= 7 ? 33 : f < 11 ? 36 : 11;
      case 'ATK_H': return phase(6, 13, 10, id === 'volt' ? 10 : 35);
      case 'ATK_F_H': return phase(8, 15, 10, id === 'volt' ? 10 : 35);
      case 'ATK_C_L': return f < 3 ? 6 : f <= 7 ? 12 : f < 11 ? 41 : 6;
      case 'ATK_C_H': return f < 4 ? 41 : f < 7 ? 6 : f <= 14 ? 12 : f < 20 ? 41 : 6;
      case 'ATK_J_L': return f < 3 ? 37 : f <= 10 ? 13 : 38;
      case 'ATK_J_H': return f < 5 ? 37 : f <= 14 ? 13 : 38;
      case 'THROW': return phase(5, 13, 22, 22);
      case 'SP_1': return f < 5 ? 8 : f < 11 ? 44 : f <= 22 ? 14 : f < 27 ? 36 : 11;
      case 'SP_2': return phase(5, 20, ['kagura', 'ayame'].includes(id) ? 15 : 16,
        ['kagura', 'ayame'].includes(id) ? 15 : cycle([39, 16, 40], 3));
      case 'SP_3': return phase(id === 'titan' ? 7 : 6, 19,
        { kagura: 16, volt: 15, freya: 17, titan: 22, ayame: 16, celine: 17 }[id],
        { kagura: 40, volt: 15, freya: 46, titan: 22, ayame: 40, celine: 46 }[id]);
      case 'SUPER': return f < 3 ? 45 : f < 5 ? 8 : f <= 30 ? [17, 46, 35, 17, 46, 10][Math.floor((f - 5) / 4) % 6] : f < 37 ? 36 : 11;
      case 'BURST': return f < 3 ? 41 : f < 6 ? 45 : f < 14 ? 17 : f < 20 ? 46 : 42;
      case 'HIT_STAND': return f < 6 ? 18 : 43;
      case 'HIT_AIR': return 19;
      case 'KNOCKDOWN': return 20;
      case 'WAKEUP': return f < 3 ? 20 : f < 7 ? 47 : f < 10 ? 41 : 21;
      case 'VICTORY': return 23;
      default: return 0;
    }
  },

  draw(fighter, ctx, x, y, facing, state, f, silhouette) {
    const id = fighter.data.id;
    const throwFrame = !silhouette ? ThrowMotion.sprite(fighter,state,f) : null;
    let frame = throwFrame ?? this.frame(id, state, f, fighter.animTick, !silhouette && fighter.blockstun > 0, fighter.vy);
    let sheet = this.sheets.get(id + (frame >= 48 ? '-throw' : frame >= 24 ? '-motion' : ''));
    if(!sheet && frame>=48){frame=state==='HIT_AIR'?19:state==='KNOCKDOWN'?20:state==='WAKEUP'?47:22;sheet=this.sheets.get(id+(frame>=24?'-motion':''));}
    if (!sheet && frame >= 24) {
      frame = [0,1,1,0,2,3,4,5,8,9,8,10,11,7,7,16,16,6,21,18,14,8,17,6][frame - 24];
      sheet = this.sheets.get(id);
    }
    if (!sheet) return false; // The previous procedural renderer remains a decode-failure fallback.
    // Optional clothing palette supplied by the side-scrolling mode; shared source atlases stay intact.
    if (!silhouette && fighter.streetPalette) sheet = fighter.streetPalette.get(frame >= 48 ? '-throw' : frame >= 24 ? '-motion' : '') || sheet;
    frame %= 24;
    const tick = fighter.animTick;
    const cell = 160;
    const scale = fighter.data.id === 'titan' ? 1.48 : 1.36;
    // Half-resolution source anchor. Shared across frames: no bounding-box recentering/jitter.
    const pivotX = 80, pivotY = 138;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(facing, 1);
    ctx.imageSmoothingEnabled = false;
    if (!silhouette && fighter.invuln > 0 && Math.floor(tick / 3) % 2) ctx.globalAlpha *= 0.72;
    ctx.drawImage(silhouette ? sheet.ghost : sheet.atlas,
      (frame % 6) * cell, Math.floor(frame / 6) * cell, cell, cell,
      -Math.round(pivotX * scale), -Math.round(pivotY * scale), Math.round(cell * scale), Math.round(cell * scale));
    ctx.restore();
    return true;
  }
};
FighterSprites.load(SPRITE_SOURCES);
