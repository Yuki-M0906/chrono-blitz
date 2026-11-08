// Source of the embedded v1.3 sprite renderer. Run: node tools/build-sprites.mjs
// 6 columns x 4 rows; 256px source cells, 160px cached cells including 16px gutters.
const FighterSprites = {
  sheets: new Map(),
  errors: [],
  ready: null,

  load(sources) {
    this.ready = Promise.all(Object.entries(sources).map(([id, src]) => new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        try {
          if (image.width !== 1536 || image.height !== 1024) throw new Error('Expected 1536x1024 atlas');
          const atlas = document.createElement('canvas');
          atlas.width = 960; atlas.height = 640;
          const c = atlas.getContext('2d');
          c.imageSmoothingEnabled = false;
          for (let frame = 0; frame < 24; frame++) {
            // Hand-audited slice corrections: generated sheets are not perfectly grid-aligned.
            // Gutters preserve extended sword tips and the left edge of horizontal knockdowns.
            const col = frame % 6, row = Math.floor(frame / 6);
            let left = 0, top = 0, right = 256, bottom = 256;
            if (frame === 20) { left = -32; right = 264; }
            if (frame === 9) bottom = 244;
            if (id === 'freya' && frame === 15) top = -16;
            if (id === 'freya' && frame === 10) right = 288;
            c.save();
            c.translate(col * 160 + 16, row * 160 + 16);
            c.scale(0.5, 0.5);
            c.beginPath();
            c.rect(left, top, right - left, bottom - top); c.clip();
            c.drawImage(image, -col * 256, -row * 256);
            // Remove only identified fragments of an adjacent pose, retaining the sprite's alpha.
            if (frame === 19) c.clearRect(224, 180, 32, 76);
            if (id === 'freya' && frame === 11) c.clearRect(0, 86, 34, 40);
            if (id === 'freya' && frame === 10) {
              c.clearRect(256, 0, 32, 86); c.clearRect(256, 126, 32, 130);
            }
            c.restore();
            // A generated pose can spill into a neighboring cell. Isolate this pose's
            // connected silhouette; retain separate substantial spell effects in cast frames.
            this.cleanCell(c, col * 160, row * 160, frame === 14 || frame === 17);
          }
          const ghost = document.createElement('canvas');
          ghost.width = atlas.width; ghost.height = atlas.height;
          const g = ghost.getContext('2d');
          g.drawImage(atlas, 0, 0);
          g.globalCompositeOperation = 'source-in';
          g.fillStyle = { kagura: '#ff4466', volt: '#00efff', freya: '#a4e8ff', titan: '#ff9b32' }[id];
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

  frame(id, state, f, tick, blocking) {
    if (blocking && !state.startsWith('HIT')) return state === 'CROUCH' ? 6 : 21;
    const phase = (windup, end, active, recovery = 11, idle = 0) =>
      f < windup ? (idle === 6 ? 6 : 8) : f <= end ? active : f < end + 6 ? recovery : idle;
    switch (state) {
      case 'IDLE': return [0, 1, 1, 0][Math.floor(tick / 9) % 4];
      case 'WALK_F': return [2, 3, 4, 5][Math.floor(tick / 6) % 4];
      case 'WALK_B': return [5, 4, 3, 2][Math.floor(tick / 7) % 4];
      case 'DASH_F': return [16, 2, 16, 4][Math.floor(tick / 4) % 4];
      case 'DASH_B': return 7;
      case 'CROUCH': return 6;
      case 'JUMP': return 7;
      case 'ATK_L': return phase(3, 7, 9);
      case 'ATK_H': return phase(6, 13, 10);
      case 'ATK_F_H': return phase(8, 15, 10);
      case 'ATK_C_L': return phase(3, 7, 12, 6, 6);
      case 'ATK_C_H': return phase(7, 14, 12, 6, 6);
      case 'ATK_J_L': return f < 3 ? 7 : f <= 10 ? 13 : 7;
      case 'ATK_J_H': return f < 5 ? 7 : f <= 14 ? 13 : 7;
      case 'THROW': return phase(5, 13, 22);
      case 'SP_1': return phase(11, 23, 14);
      case 'SP_2': return phase(5, 24, id === 'kagura' ? 15 : 16);
      case 'SP_3': return phase(id === 'titan' ? 7 : 6, 23,
        { kagura: 16, volt: 15, freya: 17, titan: 22 }[id]);
      case 'SUPER': return f < 5 ? 8 : f <= 30 ? [17, 10, 17, 15][Math.floor((f - 5) / 6) % 4] : 11;
      case 'BURST': return f < 6 ? 6 : f < 20 ? 17 : 21;
      case 'HIT_STAND': return 18;
      case 'HIT_AIR': return 19;
      case 'KNOCKDOWN': return 20;
      case 'WAKEUP': return f < 5 ? 20 : f < 10 ? 6 : 21;
      case 'VICTORY': return 23;
      default: return 0;
    }
  },

  draw(fighter, ctx, x, y, facing, state, f, silhouette) {
    const sheet = this.sheets.get(fighter.data.id);
    if (!sheet) return false; // The previous procedural renderer remains a decode-failure fallback.
    const tick = fighter.animTick;
    const blocking = !silhouette && fighter.blockstun > 0;
    const frame = this.frame(fighter.data.id, state, f, tick, blocking);
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
