// v2.5 visual layer only. No combat state, RNG, input, AI, audio or hitboxes are changed here.
const BeltArt = {
  images: new Map(),
  boards: new Map(),
  bossCells: new Map(),
  bossSheets: new Map(),
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
          else if (id === 'props') this.prepareProps(img);
          else if (id.startsWith('voss-')) this.prepareBoss(id, img);
        } catch (error) { this.errors.push(id + ': ' + error.message); }
        resolve();
      };
      img.onerror = () => { this.errors.push(id + ': image decode failed'); resolve(); };
      img.src = entry.src;
    })));
    return this.ready;
  },

  prepareBoard(index, image, horizon = .685) {
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
    this.boards.set(index, board);
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
    if (image.width !== 1536 || image.height !== 1024) throw Error('Boss atlas must be 1536 × 1024');
    // Same 160px cached cells / 16px gutters as the shared fighter renderer.
    // The defeated base pose extends 24px into the preceding source cell.
    const board = document.createElement('canvas'); board.width = 960; board.height = 640;
    const c = board.getContext('2d', { willReadFrequently: true }); c.imageSmoothingEnabled = false;
    const cells = [];
    for (let i = 0; i < 24; i++) {
      const col = i % 6, row = Math.floor(i / 6), left = id !== 'voss-motion' && i === 20 ? -32 : 0;
      c.save(); c.translate(col * 160 + 16, row * 160 + 16); c.scale(.5, .5);
      c.beginPath(); c.rect(left, 0, 256 - left, 256); c.clip(); c.drawImage(image, -col * 256, -row * 256);
      if (id !== 'voss-motion' && i === 19) c.clearRect(224, 180, 32, 76);
      c.restore();
      FighterSprites.cleanCell(c, col * 160, row * 160, id === 'voss-base' ? [14, 17].includes(i) : [20, 22].includes(i));
      cells.push(this.bounds(c, col * 160, row * 160, 160, 160));
    }
    this.bossSheets.set(id, board);
    this.bossCells.set(id, cells);
  },

  drawStreet(street, c) {
    if (this.boards.size !== 5) return false;
    c.save(); c.imageSmoothingEnabled = false;
    c.fillStyle = '#101924'; c.fillRect(0, 0, W, H);
    c.translate(-Math.round(street.camera), 0);
    for (let i = 0; i < 5; i++) {
      const x = i * 1240 - 96;
      if (x > street.camera + W || x + this.boardWidth < street.camera) continue;
      c.drawImage(this.boards.get(i), x, 0);
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
    c.save(); c.strokeStyle = 'rgba(176,207,223,.17)'; c.lineWidth = 1;
    for (let i = 0; i < 62; i++) {
      const x = (i * 173 + t * 2) % W, y = (i * 91 + t * 8) % 641;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x - 5, y + 14); c.stroke();
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
    // The generated motion sheet's 26/27 are walking poses; keep both feet planted while idle.
    if (state === 'IDLE') return [0, 24, 1, 25, 1, 24][Math.floor(actor.animTick / 6) % 6];
    if (actor.state === 'WINDUP') return actor.plan === 'slam' ? 44 : 39;
    // Match the existing damage / sound event at SLAM frame 20 exactly.
    if (actor.state === 'SLAM') return f < 20 ? 44 : f < 33 ? 14 : f < 43 ? 47 : 11;
    return FighterSprites.frame('titan', state, f, actor.animTick, actor.blockstun > 0, actor.vy);
  },

  drawBoss(actor, c, state, f) {
    if (this.bossCells.size !== 3) return false;
    const pose = this.bossFrame(actor, state, f);
    const id = pose >= 48 ? 'voss-throw' : pose >= 24 ? 'voss-motion' : 'voss-base';
    const frame = pose % 24, image = this.bossSheets.get(id), box = this.bossCells.get(id)[frame];
    const scale = 1.48, foot = actor.z > 0 ? 138 : box.bottom + 1;
    c.save(); c.scale(actor.facing, 1); c.imageSmoothingEnabled = false;
    if (actor.invuln > 0 && Math.floor(actor.animTick / 3) % 2) c.globalAlpha *= .72;
    c.drawImage(image, frame % 6 * 160, Math.floor(frame / 6) * 160, 160, 160, -80 * scale, -foot * scale, 160 * scale, 160 * scale);
    c.restore(); return true;
  }
};
BeltArt.load(BELT_ART_SOURCES);
