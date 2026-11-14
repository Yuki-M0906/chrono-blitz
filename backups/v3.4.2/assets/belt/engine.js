// CHRONO BLITZ: NEON UPRISING — v2.0. Shared Fighter/Sprite/Stage/Voice/Sound assets.
// Coordinates: x = street distance, y = floor depth, z = height above that floor.
// Fixed 60 Hz simulation. Draw methods must not change simulation or consume random values.
const STREET = {
  version: '3.4.2',
  risingInput: { window: 30, buffer: 12 },
  dash: { tapWindow: 14, speed: 2.2, damage: 112, active: 8, until: 19, end: 38 },
  // v2.6.0 hit detection tuning. One table so the feel can be adjusted without hunting through the methods.
  // Rule of thumb: the player's attacks are generous (wide lane, several active frames), enemy attacks are honest
  // (one frame, narrow lane) so that stepping up/down out of a telegraphed blow reliably works.
  hit: {
    playerDepth: 52, // lane tolerance of player strikes (was 29)
    playerRear: 30, // how far behind the player's centre a strike still connects (was 22)
    playerActive: 7, // ground strikes stay active for this many frames (was 1)
    airActive: 12, // jump attack stays active this long, i.e. for most of the descent (was 1)
    propDepth: 44, // crates and barrels (was 35)
    enemyDepth: 22, // enemy punch lane (was 26); the AI only starts a punch inside this lane
    laneAssist: 0.5, // a struck enemy is pulled this fraction toward the player's lane so the chain keeps connecting
    grabDepth: 54, // walking grab (was 22)
    throwKeyDepth: 60, // I-key throw (was 22)
    chainThrowDepth: 52, // down + third hit (was 29); equals playerDepth so anything the chain reached can be thrown
    bodyDepth: 60, // thrown body versus other enemies (was 27)
    bodyRange: 84, // (was 55)
    pickupRange: 62, // (was 45)
    pickupDepth: 38, // (was 26)
    chargeDepth: 30, // boss charge lane (was 35)
    slamRange: 150, // boss slam (was 155)
    slamDepth: 70 // (was 78)
  },
  width: 6200,
  top: 440,
  bottom: 626,
  areas: [
    {
      left: 0,
      right: 1240,
      name: '01 / NEON ROW',
      jp: 'ネオン街',
      waves: [
        ['punk', 'punk', 'knife'],
        ['punk', 'brute', 'punk']
      ]
    },
    {
      left: 1240,
      right: 2480,
      name: '02 / DEAD END ARCADE',
      jp: '廃ゲームセンター前',
      waves: [
        ['knife', 'punk', 'punk'],
        ['brute', 'knife', 'punk', 'punk']
      ]
    },
    {
      left: 2480,
      right: 3720,
      name: '03 / UNDERPASS',
      jp: '高架下',
      waves: [
        ['punk', 'brute', 'knife', 'punk'],
        ['knife', 'brute', 'knife']
      ]
    },
    {
      left: 3720,
      right: 4960,
      name: '04 / BLACK MARKET',
      jp: '闇市倉庫',
      waves: [
        ['brute', 'punk', 'knife', 'punk'],
        ['knife', 'brute', 'punk', 'knife']
      ]
    },
    { left: 4960, right: 6200, name: '05 / THE IRON GATE', jp: '鉄門の処刑場', waves: [['boss', 'punk', 'knife']] }
  ],
  enemies: {
    punk: { char: 1, name: 'RAZOR', hp: 122, speed: 2.45, damage: 26, hue: 138, score: 300 },
    knife: { char: 0, name: 'SHIV', hp: 106, speed: 2.9, damage: 32, hue: 175, score: 400 },
    brute: { char: 3, name: 'BRICK', hp: 232, speed: 1.55, damage: 43, hue: 310, score: 650 },
    boss: { char: 3, name: 'IRON VOSS', hp: 1500, speed: 2.05, damage: 62, hue: 345, score: 6000 }
  },
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  ready: (a) => ['IDLE', 'WALK_F'].includes(a.state),
  press: (...keys) => keys.some((k) => input.just[k]),
  down: (...keys) => keys.some((k) => input.keys[k]),
  inside: (r) => input.mouseX >= r.x && input.mouseX <= r.x + r.w && input.mouseY >= r.y && input.mouseY <= r.y + r.h,
  text(c, s, x, y, size = 16, color = '#e8edf6', align = 'left', weight = '600') {
    c.fillStyle = color;
    c.font = weight + ' ' + size + 'px "Segoe UI",Meiryo,sans-serif';
    c.textAlign = align;
    c.fillText(s, x, y);
  },
  panel(c, x, y, w, h, color = '#101b2c', border = '#34485e') {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
    if (border) {
      c.strokeStyle = border;
      c.lineWidth = 1;
      c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }
  }
};

const StreetPalettes = {
  cache: new Map(),
  get(kind) {
    if (this.cache.has(kind)) return this.cache.get(kind);
    const spec = STREET.enemies[kind],
      id = CHARACTERS[spec.char].id,
      result = new Map();
    for (const suffix of ['', '-motion', '-throw']) {
      const source = FighterSprites.sheets.get(id + suffix);
      if (!source) return null;
      const atlas = document.createElement('canvas');
      atlas.width = source.atlas.width;
      atlas.height = source.atlas.height;
      const c = atlas.getContext('2d', { willReadFrequently: true });
      c.drawImage(source.atlas, 0, 0);
      const original = c.getImageData(0, 0, atlas.width, atlas.height);
      c.clearRect(0, 0, atlas.width, atlas.height);
      c.filter = 'hue-rotate(' + spec.hue + 'deg) saturate(.8) brightness(.86)';
      c.drawImage(source.atlas, 0, 0);
      c.filter = 'none';
    if (this.team === 0) BeltArt.drawFlameDash(this, c);
      const changed = c.getImageData(0, 0, atlas.width, atlas.height),
        a = original.data,
        b = changed.data;
      // Restore warm skin and neutral hair highlights, recoloring only the costume/effects.
      for (let i = 0; i < a.length; i += 4)
        if (
          a[i + 3] &&
          ((a[i] > 65 && a[i] > a[i + 1] * 1.12 && a[i + 1] > a[i + 2] * 1.13) ||
            Math.max(a[i], a[i + 1], a[i + 2]) - Math.min(a[i], a[i + 1], a[i + 2]) < 20)
        ) {
          b[i] = a[i];
          b[i + 1] = a[i + 1];
          b[i + 2] = a[i + 2];
        }
      c.putImageData(changed, 0, 0);
      result.set(suffix, { atlas, ghost: source.ghost });
    }
    this.cache.set(kind, result);
    return result;
  }
};

class StreetActor extends Fighter {
  constructor(data, x, y, team, id, kind = 'hero') {
    super(data, team === 0 ? 0 : 1, x, team === 0 ? 1 : -1);
    this.y = y;
    this.z = 0;
    this.team = team;
    this.uid = id;
    this.kind = kind;
    this.dead = false;
    this.cooldown = 45 + (id % 4) * 16;
    this.attack = null;
    this.hold = null;
    this.queue = 0;
    this.chain = 0;
    this.chainHit = false;
    this.comboTTL = 0;
    this.flashTimer = 0;
    this.vz = 0;
    this.knockX = 0;
    this.weapon = 0;
    this.scale = kind === 'boss' ? 1.26 : 1;
    this.hue = 0;
    this.label = data.name;
    this.jumpHits = new Set();
    if (team === 0) {
      this.maxHp = Math.round(data.maxHp * 0.62);
      this.hp = this.maxHp;
      this.speed = data.walk * 0.66;
      this.power = 0.82 + data.stats[0] * 0.065;
      this.reach = data.weapon === 'greatsword' ? 116 : data.weapon === 'rapier' ? 108 : 96;
    } else {
      const spec = STREET.enemies[kind];
      Object.assign(this, {
        maxHp: spec.hp,
        hp: spec.hp,
        speed: spec.speed,
        damage: spec.damage,
        hue: spec.hue,
        label: spec.name,
        value: spec.score
      });
      this.streetPalette = StreetPalettes.get(kind);
    }
  }
  pose(state) {
    this.state = state;
    this.f = 0;
    this.attack = null;
  }
  speak(event, priority = 40) {
    fighterVoice.play(this.data.id, event, this.team === 0 ? 0 : 1, priority);
  }
  render(c) {
    c.save();
    c.translate(Math.round(this.x), Math.round(this.y));
    c.fillStyle = 'rgba(0,0,0,.46)';
    c.beginPath();
    c.ellipse(0, 0, 34 * this.scale * (1 - this.z / 700), 9, 0, 0, Math.PI * 2);
    c.fill();
    if (this.dead && this.f > 30) c.globalAlpha = Math.max(0, 1 - (this.f - 30) / 40);
    c.translate(0, -this.z);
    c.scale(this.scale, this.scale);
    const state =
      this.state === 'HOLD'
        ? 'THROWING'
        : this.state === 'DEAD'
          ? 'KNOCKDOWN'
          : this.state === 'WINDUP'
            ? 'ATK_H'
            : this.state === 'CHARGE'
              ? 'DASH_F'
              : this.state === 'SLAM'
                ? 'SP_1'
                : this.state;
    const poseFrame = this.state === 'WINDUP' ? 4 : this.f;
    if (!BeltArt.drawBurn(this, c) &&
        !(this.team === 0 && BeltArt.drawRising(this, c)) &&
        !(this.team === 0 && BeltArt.drawDash(this, c)) &&
        !(this.kind === 'boss' && BeltArt.drawBoss(this, c, state, poseFrame)))
      this.drawBody(c, 0, 0, this.facing, this.state === 'STREET_DASH' ? 'DASH_F' :
        this.state === 'DASH_ATTACK' ? 'ATK_H' : state, poseFrame, false);
    c.filter = 'none';
    if (this.team === 0) BeltArt.drawFlameDash(this, c);
    if (this.weapon > 0) {
      c.save();
      c.translate(this.facing * 34, -67);
      c.rotate(this.facing * (this.attack?.stage === 3 ? 1.4 : 0.65));
      if (!BeltArt.drawPipe(c)) {
        c.fillStyle = '#bfcbd6';
        c.fillRect(-4, -65, 8, 83);
        c.fillStyle = '#5b7286';
        c.fillRect(-4, 5, 8, 18);
      }
      c.restore();
    }
    c.restore();
    if (this.team === 1 && !this.dead && (this.flashTimer > 0 || this.kind === 'boss')) {
      STREET.panel(c, this.x - 33, this.y - this.z - 205 * this.scale, 66, 5, '#251c25', null);
      c.fillStyle = this.kind === 'boss' ? '#ff644f' : '#f7b35a';
      c.fillRect(this.x - 33, this.y - this.z - 205 * this.scale, (66 * this.hp) / this.maxHp, 5);
    }
    if (this.state === 'WINDUP') STREET.text(c, '!', this.x, this.y - 223 * this.scale, 28, '#ff755c', 'center', '900');
  }
}

class NeonUprising {
  constructor(owner, index) {
    this.owner = owner;
    this.character = index;
    this.tick = 0;
    this.resetDashTap();
    this.nextId = 1;
    this.area = 0;
    this.wave = 0;
    this.player = new StreetActor(CHARACTERS[index], 230, 552, 0, 0);
    this.enemies = [];
    this.items = [];
    this.props = [];
    this.particles = [];
    this.popups = [];
    this.score = 0;
    this.kills = 0;
    this.lives = 3;
    this.extended = false;
    this.camera = 0;
    this.backWall = 60;
    this.gate = STREET.areas[0].right - 65;
    this.locked = true;
    this.wait = 0;
    this.timer = 150 * 60;
    this.hitstop = 0;
    this.shake = 0;
    this.grapple = null;
    this.intro = 150;
    this.bossIntro = 0;
    this.result = null;
    this.resultTick = 0;
    this.combo = 0;
    this.comboTime = 0;
    for (let i = 0; i < 5; i++) {
      const base = i * 1240;
      this.props.push(
        { x: base + 465, y: 470, hp: 48, type: 'crate', loot: 'food', id: 'box' + i },
        { x: base + 960, y: 603, hp: 48, type: 'barrel', loot: i % 2 ? 'cash' : 'pipe', id: 'barrel' + i }
      );
    }
    this.spawnWave();
    sound.playBGM(5);
    this.player.speak('select', 60);
  }
  areaData() {
    return STREET.areas[this.area];
  }
  alive() {
    return this.enemies.filter((e) => !e.dead && e.hp > 0);
  }
  announce(text, color = '#f5b864') {
    this.popups.push({ x: this.player.x, y: this.player.y - 220, text, color, life: 90 });
  }
  spawnWave() {
    const area = this.areaData(),
      types = area.waves[this.wave];
    this.locked = true;
    types.forEach((kind, i) => {
      const fromLeft = this.wave > 0 && i % 2 === 0;
      const x = fromLeft
        ? Math.max(this.backWall + 35, this.camera + 60 + i * 40)
        : Math.min(area.right - 95, Math.max(this.player.x + 370, this.camera + 1050) - i * 85);
      const e = this.spawnEnemy(kind, x, 470 + ((i * 67) % 150));
      e.cooldown = 80 + i * 14;
    });
    if (types.includes('boss')) {
      this.bossIntro = 150;
      sound.playBGM(6);
      sound.playCue('boss');
      this.announce('IRON VOSS — 街を支配する鉄拳', '#ff7c65');
    }
  }
  spawnEnemy(kind, x, y) {
    const e = new StreetActor(CHARACTERS[STREET.enemies[kind].char], x, y, 1, this.nextId++, kind);
    this.enemies.push(e);
    return e;
  }
  effects(x, y, color, n = 12) {
    for (let i = 0; i < n; i++) {
      const angle = i * 2.399 + this.tick * 0.31;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * (2 + (i % 5)),
        vy: Math.sin(angle) * 4 - 3,
        life: 20 + (i % 10),
        color
      });
    }
  }
  addScore(n) {
    this.score += n;
    if (!this.extended && this.score >= 20000) {
      this.extended = true;
      this.lives++;
      this.announce('1UP!', '#78e8bd');
      sound.playCue('extend');
    }
  }
  update() {
    if (this.owner.isPaused()) return;
    if (this.result) {
      this.resultTick++;
      if (this.resultTick > 45 && STREET.press('Enter', 'KeyJ', 'KeyZ', 'Space'))
        this.owner.startStreet(this.character);
      return;
    }
    this.tick++;
    if (this.shake > 0) this.shake *= 0.82;
    if (this.intro > 0) {
      this.intro--;
      return;
    }
    if (this.bossIntro > 0) {
      this.bossIntro--;
      return;
    }
    if (this.hitstop > 0) {
      this.hitstop--;
      return;
    }
    if (this.comboTime > 0) this.comboTime--;
    else this.combo = 0;
    this.timer--;
    if (this.timer <= 0 && !this.player.dead) {
      this.breakGrab();
      this.player.hp = 0;
      this.kill(this.player);
      this.announce('TIME OUT', '#ff765c');
    }
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.24;
      p.life--;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.popups) {
      p.y -= 0.35;
      p.life--;
    }
    this.popups = this.popups.filter((p) => p.life > 0);
    for (const item of this.items) item.age++;
    if (this.grapple) this.updateGrab();
    this.updateActor(this.player);
    for (const e of this.enemies) this.updateActor(e);
    this.enemies = this.enemies.filter((e) => !(e.dead && e.f > 70));
    if (!this.player.dead) this.playerInput();
    for (const e of this.enemies) if (!e.dead) this.enemyAI(e);
    this.resolveBodies();
    if (this.player.dead && this.player.f >= 100) this.respawn();
    if (!this.alive().length && this.locked) {
      if (++this.wait >= 75) {
        this.wait = 0;
        this.wave++;
        if (this.wave < this.areaData().waves.length) this.spawnWave();
        else if (this.area === 4) this.finish(true);
        else {
          this.locked = false;
          this.gate = this.areaData().right + 300;
          this.announce('GO →', '#74e9d0');
          this.addScore(500);
        }
      }
    }
    if (!this.locked && this.player.x >= this.areaData().right + 110) {
      this.area++;
      this.wave = 0;
      this.backWall = this.areaData().left + 45;
      this.gate = this.areaData().right - 65;
      this.timer = 150 * 60;
      this.spawnWave();
    }
    // Camera never scrolls backwards. A cleared section is left behind.
    const cap = this.areaData().right - W + 70;
    this.camera = Math.max(
      this.camera,
      STREET.clamp(this.player.x - 450, 0, Math.max(0, this.locked ? cap : STREET.width - W))
    );
    this.backWall = Math.max(this.backWall, this.camera + 40);
    this.player.x = STREET.clamp(this.player.x, this.backWall, this.gate);
  }
  updateActor(a) {
    a.f++;
    a.animTick++;
    a.vy = a.z > 0 ? -a.vz : 0;
    if (a.invuln > 0) a.invuln--;
    if (a.cooldown > 0) a.cooldown--;
    if (a.flashTimer > 0) a.flashTimer--;
    if (a.comboTTL > 0) a.comboTTL--;
    else a.chain = 0;
    if (a.queue > 0) a.queue--;
    if (a.burnTicks > 0) a.burnTicks--;
    if (a.dead) return;
    if (a === this.player && this.rising) { this.updateRising(); return; }
    if (['GRABBED', 'THROWING', 'HOLD'].includes(a.state)) return;
    if (a.state === 'HIT_AIR') {
      a.z += a.vz;
      a.vz -= 0.85;
      a.x += a.knockX;
      a.knockX *= a.throwFlight ? 0.99 : 0.98;
      a.x = STREET.clamp(a.x, this.backWall + 8, this.gate - 8);
      if (a.throwFlight)
        for (const other of this.enemies)
          if (
            other !== a &&
            !other.dead &&
            other.state !== 'HIT_AIR' &&
            Math.abs(other.y - a.y) < STREET.hit.bodyDepth &&
            Math.abs(other.x - a.x) < STREET.hit.bodyRange &&
            !a.jumpHits.has(other.uid)
          ) {
            a.jumpHits.add(other.uid);
            this.hurt(other, 64, a.facing, true, 'body');
          }
      if (a.z <= 0) {
        a.z = 0;
        a.pose('KNOCKDOWN');
        a.throwFlight = false;
        a.throwLanding = true;
        this.effects(a.x, a.y, '#ad9d87', 16);
        sound.playGrapple('impact');
        a.speak('throw_impact', 86);
        this.shake = 8;
        if (a.hp <= 0) this.kill(a);
      }
      return;
    }
    if (a.state === 'KNOCKDOWN') {
      if (a.f >= 34) {
        a.pose('WAKEUP');
        a.invuln = 52;
      }
      return;
    }
    if (a.state === 'WAKEUP') {
      if (a.f >= 14) {
        a.pose('IDLE');
        a.throwLanding = false;
        a.cooldown = 32;
      }
      return;
    }
    if (a.state === 'HIT_STAND') {
      a.x += a.knockX;
      a.knockX *= 0.7;
      if (a.f >= 20) a.pose('IDLE');
      return;
    }
    if (a.state === 'THROW_RECOVER') {
      if (a.f >= 16) a.pose('IDLE');
      return;
    }
    if (a.z > 0 || a.vz > 0) {
      a.z += a.vz;
      a.vz -= 0.72;
      a.x += a.airX || 0;
      a.y += a.airY || 0;
      if (a.z <= 0) {
        a.z = 0;
        a.vz = 0;
        a.pose('IDLE');
        a.invuln = Math.max(a.invuln, 6);
        a.jumpHits.clear();
      }
    }
    if (a.attack) {
      const atk = a.attack;
      if (atk.dash && a.f <= atk.until) {
        a.x += a.facing * a.speed * (a.f < atk.active ? 1.2 : 1.65);
        a.x = STREET.clamp(a.x, this.backWall + 8, this.gate - 8);
      }
      // The strike is live from `active` through `until`; atk.hit / atk.props keep every target to one hit per swing.
      if (a.f >= atk.active && a.f <= (atk.until ?? atk.active)) this.swing(a, atk);
      if (a.f >= atk.end) {
        a.pose(a.z > 0 ? 'JUMP' : 'IDLE');
        if (a.team === 0 && a.queue > 0 && a.z === 0) {
          a.queue = 0;
          this.attack(a);
        }
      }
    }
    if (a.state === 'BURST' && a.f >= 28) a.pose('IDLE');
    if (a.state === 'JUMP' && a.z === 0) a.pose('IDLE');
    a.x = STREET.clamp(a.x, this.backWall + 8, this.gate - 8);
    a.y = STREET.clamp(a.y, STREET.top, STREET.bottom);
  }
  playerInput() {
    const p = this.player,
      dx = Number(STREET.down('KeyD', 'ArrowRight')) - Number(STREET.down('KeyA', 'ArrowLeft'));
    let dy = Number(STREET.down('KeyS', 'ArrowDown')) - Number(STREET.down('KeyW', 'ArrowUp'));
    const attack = STREET.press('KeyJ', 'KeyZ'),
      jump = STREET.press('KeyK', 'KeyX', 'Space'),
      thr = STREET.press('KeyI');
    const special =
      STREET.press('KeyL', 'KeyC') || (attack && STREET.down('KeyK', 'KeyX')) || (jump && STREET.down('KeyJ', 'KeyZ'));
    const dashTap = this.readDashTap(dx);
    const down = STREET.down('KeyS', 'ArrowDown'), up = STREET.down('KeyW', 'ArrowUp');
    const wasDown = this.riseDown, upEdge = up && !this.riseUp;
    this.riseDown = down; this.riseUp = up;
    const eligible = p.z === 0 && !p.attack && (STREET.ready(p) || p.state === 'HOLD' || p.state === 'STREET_DASH');
    const canBuffer = eligible || (p.z === 0 && p.attack && !p.attack.dash);
    if (this.rising) return;
    if (!canBuffer) { this.riseTap = this.riseBuffered = null; }
    else {
      // Count the window from the last down-held frame. Down may overlap the subsequent up press.
      // Fresh simultaneous down/up is not a command; a preceding down frame is required.
      if (down && !up) this.riseTap = this.tick;
      if (upEdge && (wasDown || !down) && this.riseTap != null && this.tick - this.riseTap <= STREET.risingInput.window) {
        this.riseBuffered = this.tick + STREET.risingInput.buffer;
        this.riseTap = null;
        p.queue = 0;
      }
      if (this.riseBuffered != null && this.tick > this.riseBuffered) this.riseBuffered = null;
      if (eligible && this.riseBuffered != null) { this.startRising(); return; }
    }
    if (special && p.z === 0 && !['KNOCKDOWN', 'WAKEUP', 'HIT_AIR', 'THROWING'].includes(p.state) && p.cooldown <= 0) {
      this.burst();
      return;
    }
    if (p.state === 'HOLD') {
      if ((thr || (attack && dx)) && this.grapple?.rest <= 0) {
        this.throwHeld(dx || p.facing);
        return;
      }
      if (attack && this.grapple?.rest <= 0) {
        const g = this.grapple;
        if (g.knees >= 2) { this.finishHeld(); return; }
        g.t = 0;
        g.knees++;
        g.rest = 20;
        this.hurtHeld(24 * p.power);
        p.speak('light' + (g.knees % 2), 45);
        sound.playHit('heavy');
        if (g.victim.hp <= 0) this.finishHeld();
      }
      if (jump) this.breakGrab();
      return;
    }
    if (p.attack) {
      if (attack && !p.attack.dash) p.queue = 12;
      return;
    }
    if (p.z > 0) {
      if (attack && p.state === 'JUMP') this.attack(p, true);
      return;
    }
    if (p.state === 'STREET_DASH') {
      if (attack && (!dx || dx === p.facing)) {
        this.dashAttack();
        return;
      }
      if (dx !== p.facing || jump || thr) p.pose('IDLE');
      else {
        const next = STREET.clamp(p.x + p.facing * p.speed * STREET.dash.speed, this.backWall + 8, this.gate - 8);
        if (next === p.x) p.pose('IDLE');
        p.x = next;
        p.y = STREET.clamp(p.y + dy * p.speed * 0.4, STREET.top, STREET.bottom);
        return;
      }
    }
    if (!STREET.ready(p)) return;
    if (dashTap && !jump && !thr) {
      p.pose('STREET_DASH');
      p.chain = 0;
      p.chainHit = false;
      p.comboTTL = 0;
      p.queue = 0;
      p.speak('dash', 25);
      if (attack) this.dashAttack();
      return;
    }
    if (jump) {
      p.pose('JUMP');
      p.vz = 12.5;
      p.airX = dx * p.speed * 0.95;
      p.airY = dy * p.speed * 0.55;
      p.speak('jump', 15);
      return;
    }
    if (thr) {
      const e = this.grabbable(104, STREET.hit.throwKeyDepth);
      if (e) {
        this.beginGrab(e);
        this.throwHeld(dx || p.facing);
      }
      return;
    }
    if (attack) {
      if (this.pickup()) return;
      this.attack(p);
      return;
    }
    // While a chain is live (a hit landed and the window is open) the stick's up/down is the throw modifier,
    // not movement: walking off the enemy's lane between hits made the down-held throw unreachable.
    const chaining = p.chain > 0 && p.chainHit && p.comboTTL > 0;
    if (chaining) dy = 0;
    if (dx || dy) {
      const norm = dx && dy ? 0.707 : 1;
      p.x += dx * p.speed * norm;
      p.y += dy * p.speed * 0.64 * norm;
      if (dx) p.facing = dx;
      p.state = 'WALK_F';
      // Walking on either axis can grab the nearest eligible enemy ahead.
      const e = this.grabbable(80, STREET.hit.grabDepth, p.facing);
      if (e) this.beginGrab(e);
    } else if (p.state === 'WALK_F') p.pose('IDLE');
  }
  grabbable(range, depth = STREET.hit.grabDepth, facing = 0) {
    const p = this.player;
    return this.alive().filter(
      (e) =>
        (!facing || (e.x - p.x) * facing >= -16) &&
        Math.abs(e.x - p.x) < range &&
        Math.abs(e.y - p.y) < depth &&
        e.z === 0 &&
        e.invuln === 0 &&
        (['IDLE', 'WALK_F', 'HIT_STAND'].includes(e.state) || (e.kind !== 'boss' && e.state === 'WINDUP')) &&
        (e.kind !== 'boss' || e.cooldown > 22)
    ).sort((a, b) => Math.hypot(a.x-p.x, a.y-p.y) - Math.hypot(b.x-p.x, b.y-p.y))[0];
  }
  resetDashTap(keepRise = false) {
    if (!keepRise) this.riseTap = this.riseBuffered = null;
    if (!keepRise) this.riseDown = STREET.down('KeyS', 'ArrowDown');
    if (!keepRise) this.riseUp = STREET.down('KeyW', 'ArrowUp');
    this.dashTapKey = null;
    this.dashTapDir = 0;
    this.dashTapTick = -1000;
  }
  readDashTap(dx) {
    const p = this.player;
    if (!STREET.ready(p) || p.z > 0 || p.attack || this.tick - this.dashTapTick > STREET.dash.tapWindow) {
      this.resetDashTap(true);
      if (!STREET.ready(p) || p.z > 0 || p.attack) return false;
    }
    if ((!dx && STREET.down('KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight')) ||
        (dx && this.dashTapDir && dx !== this.dashTapDir)) this.resetDashTap(true);
    if (!dx) return false;
    // Input.just is a real keydown edge: the shared Input ignores OS repeat events.
    // Requiring the same physical key also prevents holding D then adding Right from counting as two taps.
    const key = (dx > 0 ? ['KeyD', 'ArrowRight'] : ['KeyA', 'ArrowLeft']).find(k => input.just[k]);
    if (!key) return false;
    if (key === this.dashTapKey && dx === p.facing) {
      this.resetDashTap(true);
      return true;
    }
    this.dashTapKey = key;
    this.dashTapDir = dx;
    this.dashTapTick = this.tick;
    return false;
  }
  dashAttack() {
    const p = this.player, d = STREET.dash;
    if (p.state !== 'STREET_DASH') return;
    p.pose('DASH_ATTACK');
    p.chain = 0;
    p.chainHit = false;
    p.comboTTL = 0;
    p.queue = 0;
    p.attack = {
      dash: true, active: d.active, until: d.until, end: d.end,
      damage: Math.round(d.damage * p.power + (p.weapon ? 32 : 0)),
      reach: p.reach + (p.weapon ? 45 : 15), depth: STREET.hit.playerDepth, rear: 12,
      knock: true, hit: new Set(), props: new Set()
    };
    p.speak('heavy1', 65);
    sound.playFlame('launch');
  }
  finishHeld() {
    const g = this.grapple;
    if (!g) return;
    const p = this.player, e = g.victim;
    this.grapple = null;
    e.throwFrame = p.throwFrame = null;
    e.pose('IDLE'); e.invuln = 0;
    p.pose('ATK_H');
    p.attack = { active: 99, end: 24, hit: new Set(), props: new Set() };
    this.hurt(e, 72 * p.power, p.facing, true, 'grappleFinish');
    p.speak('heavy1', 65); sound.playHit('heavy');
    this.combo++; this.comboTime = 90;
  }
  startRising() {
    const p = this.player, held = this.grapple?.victim;
    if (held) {
      this.grapple = null;
      held.throwFrame = null; held.pose('IDLE'); held.invuln = 0;
    }
    p.throwFrame = null; p.pose('SP_2');
    p.chain = 0; p.queue = 0; p.comboTTL = 0;
    this.rising = { targets: [], held };
    p.invuln = 46;
    p.speak('sp2', 80); sound.playSwing(true);
    this.resetDashTap();
  }
  updateRising() {
    const p = this.player, r = this.rising;
    p.z = p.f < 6 ? 0 : Math.max(0, Math.sin((p.f - 6) / 36 * Math.PI) * 110);
    p.vy = p.f < 24 ? -6 : 6;
    if ([6, 12, 18].includes(p.f)) {
      if (p.f === 6) r.targets = this.alive().filter(e => e === r.held ||
        (!e.invuln && !['GRABBED','HIT_AIR','KNOCKDOWN','WAKEUP','THROWING'].includes(e.state) &&
        (e.x-p.x)*p.facing > -18 && (e.x-p.x)*p.facing < p.reach+24 && Math.abs(e.y-p.y)<STREET.hit.playerDepth && e.z<80));
      for (const e of r.targets) {
        if (e.dead) continue;
        const final = p.f === 18;
        e.pose('IDLE'); e.invuln = 0; e.throwFrame = null;
        this.hurt(e, (final ? 52 : 24) * p.power, p.facing, final, 'rising');
        if (!final) { e.pose('GRABBED'); e.throwFrame = 62; e.z = p.z + 15; e.knockX = 0; }
        else { e.vz = 13; e.knockX = p.facing * 8; }
        this.combo++; this.comboTime = 90;
      }
      if (r.targets.some(e => !e.dead)) sound.playRising(p.f / 6 - 1);
      this.effects(p.x+p.facing*35, p.y-p.z-75, p.data.color, 16);
      if (r.targets.length) { this.hitstop = 4; this.shake = 6; }
    }
    if (p.f >= 44) { p.z = p.vz = p.vy = 0; this.rising = null; p.pose('IDLE'); }
  }
  attack(a, air = false) {
    // Final Fight style chain: punch -> body blow -> uppercut. A stage is reachable only while the previous one connected
    // (chainHit) and the chain window (comboTTL) is still open; a whiff restarts from the punch.
    const stage = air ? 3 : a.chain > 0 && a.chain < 3 && a.chainHit ? a.chain + 1 : 1;
    if (!air && stage === 3 && a.team === 0 && !a.weapon && STREET.down('KeyS', 'ArrowDown')) {
      // Holding down on the third hit converts the uppercut into an automatic throw of the enemy in front.
      // Same depth tolerance as the strikes that led here, so whatever the body blow reached can be thrown.
      const e = this.grabbable(a.reach + 32, STREET.hit.chainThrowDepth);
      if (e && (e.x - a.x) * a.facing >= 0) {
        a.chain = 0;
        a.chainHit = false;
        this.beginGrab(e);
        this.throwHeld(a.facing);
        return;
      }
    }
    a.chain = stage;
    a.chainHit = false;
    a.comboTTL = 42;
    a.pose(air ? 'ATK_J_H' : a.weapon || stage === 3 ? 'ATK_H' : stage === 2 ? 'ATK_C_L' : 'ATK_L');
    const active = air ? 5 : stage === 3 ? 8 : stage === 2 ? 4 : 5;
    a.attack = {
      stage,
      active,
      until: active + (air ? STREET.hit.airActive : STREET.hit.playerActive) - 1,
      end: air ? 22 : stage === 3 ? 29 : stage === 2 ? 15 : 18,
      damage: Math.round((air ? 48 : stage === 3 ? 68 : stage === 2 ? 38 : 30) * a.power + (a.weapon ? 32 : 0)),
      reach: a.reach + (a.team === 0 && !air ? 32 : 0) + (a.weapon ? 45 : 0),
      depth: STREET.hit.playerDepth,
      rear: STREET.hit.playerRear,
      knock: stage === 3,
      upper: stage === 3 && !air && !a.weapon,
      hit: new Set(),
      props: new Set()
    };
    a.speak((stage === 3 ? 'heavy' : 'light') + (stage % 2), stage === 3 ? 45 : 30);
    sound.playSwing(stage === 3);
  }
  swing(a, atk) {
    let struck = false;
    for (const b of a.team === 0 ? this.alive() : [this.player]) {
      const dist = (b.x - a.x) * a.facing;
      if (
        !b.dead &&
        dist > -(atk.rear ?? 22) &&
        dist < atk.reach &&
        Math.abs(b.y - a.y) < atk.depth &&
        Math.abs(b.z - a.z) < 115 &&
        !atk.hit.has(b.uid)
      ) {
        if (this.hurt(b, atk.damage, a.facing, atk.knock, atk.dash ? 'dash' : atk.upper ? 'upper' : 'strike')) {
          atk.hit.add(b.uid);
          struck = true;
          if (a.team === 0) {
            if (!atk.dash) a.chainHit = true;
            this.combo++;
            this.comboTime = 90;
            // Lane assist: a staggered enemy slides toward the player's lane, so a chain started at the edge of the
            // depth tolerance does not whiff its next hit. Launched enemies keep their own lane.
            if (b.state === 'HIT_STAND') b.y += (a.y - b.y) * STREET.hit.laneAssist;
          }
        }
      }
    }
    if (a.team === 0)
      for (const prop of this.props)
        if (
          prop.hp > 0 &&
          !atk.props?.has(prop) &&
          (prop.x - a.x) * a.facing > -(atk.rear ?? 22) &&
          (prop.x - a.x) * a.facing < atk.reach &&
          Math.abs(prop.y - a.y) < STREET.hit.propDepth
        ) {
          atk.props?.add(prop);
          prop.hp -= atk.damage;
          if (!atk.dash) a.chainHit = true;
          this.effects(prop.x, prop.y - 28, '#bb996d');
          sound.playBreak(prop.type === 'barrel' ? 'metal' : 'wood');
          if (prop.hp <= 0) {
            this.items.push({ x: prop.x, y: prop.y, type: prop.loot, age: 0 });
            this.addScore(100);
          }
        }
    if (struck) {
      this.hitstop = atk.dash ? 7 : 4;
      this.shake = atk.dash ? 9 : atk.knock ? 5 : 2;
      if (atk.dash) sound.playFlame('hit');
      else sound.playHit(a.weapon ? 'block' : atk.knock ? 'heavy' : 'light');
      if (a.weapon > 0 && a.team === 0 && (!atk.dash || !atk.weaponSpent)) {
        a.weapon--;
        atk.weaponSpent = true;
      }
    }
  }
  hurt(a, damage, dir, knock = false, source = 'strike') {
    if (a.dead || a.invuln > 0 || ['GRABBED', 'THROWING', 'KNOCKDOWN', 'WAKEUP', 'HIT_AIR'].includes(a.state))
      return false;
    if (a.team === 0 && a.state === 'HOLD') this.breakGrab();
    a.hp = Math.max(0, a.hp - Math.round(damage));
    a.flashTimer = 100;
    if (source === 'dash' && a.team === 1) a.burnTicks = 72;
    this.effects(a.x, a.y - a.z - 85, a.team === 0 ? '#ffca9a' : '#fff0bc');
    if (a.team === 0) {
      this.resetDashTap();
      a.chain = 0;
      a.chainHit = false;
      a.weapon = 0;
      a.invuln = 36;
    }
    a.speak(a.hp <= 0 ? 'ko' : 'hurt' + (a.uid % 2), a.hp <= 0 ? 110 : 45);
    const armor = a.kind === 'boss' && ['CHARGE', 'SLAM'].includes(a.state) && ['strike', 'upper'].includes(source);
    // Facing turns toward the attacker only when the hit actually staggers. An armored boss keeps its committed lane.
    if (a.hp <= 0 || (!armor && knock)) {
      a.facing = -dir;
      a.pose('HIT_AIR');
      a.z = Math.max(10, a.z);
      // The uppercut sends the enemy higher and shorter than a regular knockdown blow.
      a.vz = source === 'upper' ? 11 : 8;
      a.knockX = dir * (source === 'upper' ? 5 : 7);
      a.throwFlight = source === 'body';
      if (a.throwFlight) { a.facing = dir; a.vz = 6; a.knockX = dir * 13; a.jumpHits.clear(); }
      a.throwLanding = true;
    } else if (!armor) {
      a.facing = -dir;
      a.pose('HIT_STAND');
      a.knockX = dir * 3;
    }
    if (a.team === 1 && damage > 0) this.addScore(Math.min(100, Math.round(damage)));
    return true;
  }
  beginGrab(e) {
    const p = this.player;
    if (this.grapple) return;
    p.pose('HOLD');
    p.throwFrame = 50;
    e.pose('GRABBED');
    e.throwFrame = 60;
    this.grapple = {
      attacker: p,
      victim: e,
      t: 0,
      mode: 'hold',
      knees: 0,
      rest: 0,
      dir: p.facing,
      duration: 30,
      originX: p.x
    };
    p.invuln = 12;
    p.speak('throw', 76);
    e.speak('grabbed', 77);
    sound.playGrapple('catch');
  }
  hurtHeld(n) {
    const g = this.grapple;
    if (!g) return;
    g.victim.hp = Math.max(0, g.victim.hp - Math.round(n));
    g.victim.flashTimer = 80;
    this.effects(g.victim.x, g.victim.y - 85, '#ffe9af', 8);
    this.addScore(20);
  }
  throwHeld(dir) {
    const g = this.grapple;
    if (!g) return;
    g.mode = 'throw';
    g.t = 0;
    g.dir = dir;
    g.originX = g.attacker.x;
    g.attacker.facing = dir;
    g.attacker.pose('THROWING');
  }
  updateGrab() {
    const g = this.grapple,
      p = g.attacker,
      e = g.victim;
    g.t++;
    g.rest--;
    if (g.mode === 'hold') {
      e.x = p.x + p.facing * 43;
      e.y = p.y + 1;
      e.facing = -p.facing;
      p.throwFrame = g.rest > 10 ? 52 : 50;
      e.throwFrame = g.rest > 10 ? 61 : 60;
      if (g.t >= 180) this.breakGrab();
      return;
    }
    const sample = ThrowMotion.sample(g.t / g.duration);
    p.throwFrame = sample.attacker;
    e.throwFrame = sample.victim;
    e.x = p.x + g.dir * (sample.dx + 35 * (g.t / g.duration));
    e.y = p.y + 1;
    e.z = Math.max(0, -sample.dy * 0.42);
    e.facing = -g.dir;
    if (g.t >= g.duration) {
      this.grapple = null;
      p.pose('THROW_RECOVER');
      e.hp = Math.max(0, e.hp - Math.round(92 * p.power));
      e.pose('HIT_AIR');
      e.throwFlight = true;
      e.throwLanding = true;
      e.facing = g.dir;
      e.vz = 6.5;
      e.knockX = g.dir * 18;
      e.jumpHits.clear();
      e.speak('thrown', 84);
      p.speak('throw_release', 82);
      sound.playGrapple('release');
      this.addScore(80);
      this.shake = 5;
    }
  }
  breakGrab() {
    if (!this.grapple) return;
    for (const a of [this.grapple.attacker, this.grapple.victim]) {
      a.pose('IDLE');
      a.z = 0;
      a.throwFrame = null;
      a.invuln = 30;
    }
    this.grapple = null;
  }
  burst() {
    const p = this.player;
    this.breakGrab();
    p.pose('BURST');
    p.invuln = 46;
    p.cooldown = 80;
    p.queue = 0;
    let hits = 0;
    for (const e of this.alive())
      if (Math.abs(e.x - p.x) < 160 && Math.abs(e.y - p.y) < 75)
        if (this.hurt(e, 90 * p.power, e.x >= p.x ? 1 : -1, true, 'burst')) hits++;
    if (hits) p.hp = Math.max(1, p.hp - Math.ceil(p.maxHp * 0.075));
    p.speak('burst', 90);
    sound.playSuper();
    this.effects(p.x, p.y - 65, p.data.color, 32);
    this.shake = 12;
    this.hitstop = 7;
  }
  pickup() {
    const p = this.player,
      index = this.items.findIndex(
        (it) => Math.abs(it.x - p.x) < STREET.hit.pickupRange && Math.abs(it.y - p.y) < STREET.hit.pickupDepth
      );
    if (index < 0) return false;
    const it = this.items.splice(index, 1)[0];
    if (it.type === 'food') {
      const old = p.hp;
      p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.36));
      this.announce('LIFE +' + (p.hp - old), '#7fe8b1');
    }
    if (it.type === 'cash') {
      this.addScore(1200);
      this.announce('+1200', '#ffcf74');
    }
    if (it.type === 'pipe') {
      p.weapon = 8;
      this.announce('STEEL PIPE / 8 HITS', '#c6e4ef');
    }
    p.pose('CROUCH');
    p.attack = { active: -1, end: 14, hit: new Set() };
    sound.playPickup(it.type);
    return true;
  }
  enemyAI(e) {
    const p = this.player;
    if (p.dead || this.bossIntro > 0 || this.intro > 0) return;
    if (e.state === 'WINDUP') {
      if (e.f >= e.windup) {
        if (e.plan === 'charge') {
          e.pose('CHARGE');
          e.chargeHit = false;
        } else if (e.plan === 'slam') {
          e.pose('SLAM');
          e.slamHit = false;
        } else {
          e.pose('ATK_H');
          e.attack = {
            active: 5,
            end: 32,
            damage: e.damage,
            reach: e.kind === 'knife' ? 115 : 95,
            depth: STREET.hit.enemyDepth,
            knock: e.kind === 'brute',
            hit: new Set()
          };
        }
        e.cooldown = 70 + (e.uid % 4) * 15;
      }
      return;
    }
    if (e.state === 'CHARGE') {
      e.x += e.facing * (e.enraged ? 18 : 14);
      e.x = STREET.clamp(e.x, this.backWall + 35, this.gate - 35);
      if (!e.chargeHit && Math.abs(p.x - e.x) < 95 && Math.abs(p.y - e.y) < STREET.hit.chargeDepth && p.z < 55) {
        e.chargeHit = this.hurt(p, e.damage, e.facing, true, 'boss');
      }
      if (e.f >= 30) {
        e.pose('IDLE');
        e.cooldown = 90;
      }
      return;
    }
    if (e.state === 'SLAM') {
      if (e.f === 20) {
        this.effects(e.x, e.y, '#ffb862', 32);
        this.shake = 14;
        sound.playGrapple('impact');
        if (Math.abs(p.x - e.x) < STREET.hit.slamRange && Math.abs(p.y - e.y) < STREET.hit.slamDepth && p.z < 48)
          this.hurt(p, e.damage, e.facing, true, 'boss');
      }
      if (e.f >= 53) {
        e.pose('IDLE');
        e.cooldown = 95;
      }
      return;
    }
    if (!STREET.ready(e)) return;
    if (e.kind === 'boss' && !e.enraged && e.hp < e.maxHp * 0.45) {
      e.enraged = true;
      this.announce('VOSS IS ENRAGED', '#ff6c58');
      this.spawnEnemy('punk', Math.max(this.backWall + 50, e.x - 200), 465);
      this.spawnEnemy('knife', Math.min(this.gate - 50, e.x + 180), 600);
    }
    const dx = p.x - e.x,
      dy = p.y - e.y;
    e.facing = dx >= 0 ? 1 : -1;
    const busy = this.enemies.filter((o) => o !== e && ['WINDUP', 'ATK_H', 'CHARGE', 'SLAM'].includes(o.state)).length;
    if (e.cooldown <= 0 && busy < 2 && p.invuln < 15 && p.state !== 'THROWING') {
      if (e.kind === 'boss' && Math.abs(dx) < 550 && Math.abs(dy) < 65) {
        e.plan = Math.abs(dx) > 170 ? 'charge' : 'slam';
        e.windup = e.enraged ? 38 : 56;
        e.pose('WINDUP');
        return;
      }
      if (Math.abs(dx) < 85 && Math.abs(dy) < 22 && p.z < 55) {
        e.plan = 'punch';
        e.windup = e.kind === 'brute' ? 35 : 24;
        e.pose('WINDUP');
        return;
      }
    }
    const targetX = p.x + (e.uid % 2 ? 1 : -1) * (e.cooldown > 15 ? 145 : 64),
      targetY = p.y + (e.cooldown > 15 ? ((e.uid % 3) - 1) * 48 : 0);
    const mx = targetX - e.x,
      my = targetY - e.y,
      speed = e.speed * (e.enraged ? 1.2 : 1);
    if (Math.abs(mx) > 8) e.x += Math.sign(mx) * speed;
    if (Math.abs(my) > 5) e.y += Math.sign(my) * speed * 0.62;
    e.state = Math.abs(mx) > 8 || Math.abs(my) > 5 ? 'WALK_F' : 'IDLE';
    e.x = STREET.clamp(e.x, this.backWall + 25, this.gate - 25);
    e.y = STREET.clamp(e.y, STREET.top, STREET.bottom);
  }
  resolveBodies() {
    const all = [this.player, ...this.alive()];
    for (let i = 0; i < all.length; i++)
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i],
          b = all[j];
        if (!STREET.ready(a) || !STREET.ready(b) || a.z > 0 || b.z > 0) continue;
        if (Math.abs(a.y - b.y) < 18 && Math.abs(a.x - b.x) < 35) {
          const s = a.x <= b.x ? -1 : 1;
          a.x += s * 1.3;
          b.x -= s * 1.3;
        }
      }
  }
  kill(a) {
    a.dead = true;
    a.pose('DEAD');
    a.z = 0;
    a.throwLanding = true;
    if (a.team === 1) {
      this.kills++;
      this.addScore(a.value);
      if (a.kind === 'brute') this.items.push({ x: a.x, y: a.y, type: 'cash', age: 0 });
    } else {
      this.lives--;
      this.combo = 0;
      this.breakGrab();
      fighterVoice.stopAll();
      a.speak('ko', 110);
    }
  }
  respawn() {
    this.resetDashTap();
    if (this.lives <= 0) {
      this.finish(false);
      return;
    }
    const p = this.player;
    p.dead = false;
    p.hp = p.maxHp;
    p.z = 0;
    p.pose('IDLE');
    p.invuln = 180;
    p.cooldown = 0;
    p.y = 550;
    p.weapon = 0;
    this.timer = Math.max(this.timer, 90 * 60);
    this.announce('GET UP!  残り ' + this.lives, '#83e7dc');
  }
  finish(clear) {
    this.result = clear ? 'clear' : 'over';
    this.resultTick = 0;
    fighterVoice.stopAll();
    if (clear) {
      this.addScore(this.lives * 1000 + Math.ceil(this.timer / 60) * 10);
      this.player.pose('VICTORY');
      this.player.speak('win', 100);
      sound.playBGM(7);
      sound.playCue('clear');
    } else {
      sound.playBGM(0);
      sound.playCue('over');
    }
  }

  draw(c) {
    this.drawStreet(c);
    c.save();
    c.translate(
      -Math.round(this.camera) + Math.sin(this.tick * 2) * this.shake,
      Math.cos(this.tick * 3) * this.shake * 0.4
    );
    // Committed boss attacks display their lane before they can damage the player.
    for (const e of this.alive())
      if (e.state === 'WINDUP' && e.kind === 'boss') {
        c.fillStyle = 'rgba(255,80,55,' + (0.12 + 0.1 * Math.sin(e.f * 0.3)) + ')';
        c.strokeStyle = '#ed684c';
        c.lineWidth = 2;
        if (e.plan === 'charge') {
          const x = e.facing > 0 ? e.x : e.x - 520;
          c.fillRect(x, e.y - 33, 520, 66);
          c.strokeRect(x, e.y - 33, 520, 66);
        } else {
          c.beginPath();
          c.ellipse(e.x, e.y, 155, 78, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }
      }
    const sorted = [
      ...this.props.filter((p) => p.hp > 0).map((p) => ({ y: p.y, kind: 'prop', data: p })),
      ...this.items.map((p) => ({ y: p.y, kind: 'item', data: p })),
      ...[...this.enemies, this.player].map((a) => ({
        y: a.y + (a.state === 'THROWING' ? 2 : 0),
        kind: 'actor',
        data: a
      }))
    ].sort((a, b) => a.y - b.y);
    for (const o of sorted) {
      if (o.data.x < this.camera - 220 || o.data.x > this.camera + W + 220) continue;
      if (o.kind === 'actor') o.data.render(c);
      else if (o.kind === 'prop') this.drawProp(c, o.data);
      else this.drawItem(c, o.data);
    }
    for (const p of this.particles) {
      c.fillStyle = p.color;
      c.globalAlpha = Math.min(1, p.life / 10);
      c.fillRect(p.x, p.y, 4, 4);
    }
    c.globalAlpha = 1;
    for (const p of this.popups) STREET.text(c, p.text, p.x, p.y, 19, p.color, 'center', '800');
    if (!this.locked)
      STREET.text(c, 'GO  ➜', Math.min(this.gate - 40, this.camera + 1150), 360, 40, '#ffd08b', 'center', '900');
    c.restore();
    this.drawHUD(c);
    if (this.intro > 0) this.overlay(c, 'STAGE 01', 'BLACK VEIN', '法の消えた街。鉄門の首領、IRON VOSSを倒せ。');
    if (this.bossIntro > 0)
      this.overlay(c, 'WARNING / AREA BOSS', 'IRON VOSS', '赤い予告を見て、上下移動やジャンプで回避。');
    if (this.result) this.drawResult(c);
    if (this.owner.paused) this.overlay(c, 'PAUSED', 'TAKE A BREATH', 'ESC: 再開    Q: ゲーム選択に戻る');
  }
  drawHUD(c) {
    const p = this.player;
    STREET.panel(c, 24, 20, 435, 91, 'rgba(6,15,24,.92)', '#41606c');
    STREET.text(c, p.data.name, 42, 46, 20, p.data.color, 'left', '900');
    STREET.text(c, 'LIFE × ' + this.lives, 437, 44, 15, '#f4d6a2', 'right');
    STREET.panel(c, 42, 57, 397, 19, '#33212a', null);
    c.fillStyle = p.data.color;
    c.fillRect(44, 59, (393 * p.hp) / p.maxHp, 15);
    STREET.text(c, 'SCORE  ' + String(this.score).padStart(7, '0'), 42, 97, 15, '#dce8ef');
    STREET.text(c, p.weapon ? 'PIPE  ' + p.weapon + '/8' : '1UP  20,000', 437, 97, 12, '#9fb3bc', 'right');
    STREET.text(c, 'NEON UPRISING', W / 2, 35, 15, '#9bb6c3', 'center', '800');
    STREET.text(
      c,
      String(Math.max(0, Math.ceil(this.timer / 60))).padStart(3, '0'),
      W / 2,
      78,
      34,
      this.timer < 1800 ? '#ff7761' : '#f6d5a3',
      'center',
      '900'
    );
    STREET.panel(c, 900, 20, 356, 91, 'rgba(6,15,24,.92)', '#41606c');
    STREET.text(c, this.areaData().name, 919, 45, 17, '#f5c07f');
    STREET.text(
      c,
      this.areaData().jp + '  /  ' + (this.locked ? '敵を一掃せよ' : '先へ進め →'),
      919,
      69,
      14,
      '#c6d2da'
    );
    STREET.text(
      c,
      'WAVE ' +
        Math.min(this.wave + 1, this.areaData().waves.length) +
        ' / ' +
        this.areaData().waves.length +
        '   ENEMIES ' +
        this.alive().length,
      919,
      96,
      12,
      '#9eb8c8'
    );
    const boss = this.alive().find((e) => e.kind === 'boss');
    if (boss) {
      STREET.panel(c, 365, 129, 550, 25, '#331d2a', '#ae6255');
      c.fillStyle = '#ec7452';
      c.fillRect(368, 132, (544 * boss.hp) / boss.maxHp, 19);
      STREET.text(c, 'IRON VOSS' + (boss.enraged ? ' / ENRAGED' : ''), W / 2, 123, 15, '#ffc393', 'center', '900');
    }
    if (this.combo > 1) STREET.text(c, this.combo + ' HITS', 42, 153, 29, '#ffd497', 'left', '900');
    c.fillStyle = 'rgba(5,12,20,.87)';
    c.fillRect(0, 641, W, 79);
    STREET.text(
      c,
      '移動 WASD / 矢印    前×2：ダッシュ → J / Z：炎ダッシュ攻撃    ジャンプ K / X / SPACE    緊急技 L / C',
      W / 2,
      654,
      13,
      '#c8d9e2',
      'center'
    );
    STREET.text(
      c,
      'パンチ→ボディ→アッパー（命中で続く）    ↓を入れたまま3発目=投げ    ↓↑:3段上昇 / 掴みJ×2→Jで強打・Iで投げ    H: 詳しい操作',
      W / 2,
      672,
      12,
      '#8fa9ba',
      'center'
    );
    STREET.text(c, 'v' + STREET.version, W - 22, 700, 11, '#6f8796', 'right', '700');
  }
  overlay(c, kicker, title, sub) {
    c.fillStyle = 'rgba(4,11,20,.78)';
    c.fillRect(0, 240, W, 224);
    STREET.text(c, kicker, W / 2, 281, 15, '#f0b674', 'center', '800');
    STREET.text(c, title, W / 2, 352, 60, '#f4f0e8', 'center', '900');
    STREET.text(c, sub, W / 2, 409, 18, '#a8c4d1', 'center');
  }
  drawResult(c) {
    c.fillStyle = 'rgba(3,9,18,.88)';
    c.fillRect(0, 0, W, H);
    const clear = this.result === 'clear';
    STREET.text(
      c,
      clear ? 'BLACK VEIN / LIBERATED' : 'BLACK VEIN / FALLEN',
      W / 2,
      150,
      18,
      '#e4b77e',
      'center',
      '800'
    );
    STREET.text(
      c,
      clear ? 'STAGE 1 CLEAR' : 'GAME OVER',
      W / 2,
      244,
      64,
      clear ? '#a2ead7' : '#f58f7d',
      'center',
      '900'
    );
    STREET.text(
      c,
      clear ? '犯罪都市の鉄門は、あなたの手で開かれた。' : 'もう一度、この街に挑む。',
      W / 2,
      300,
      20,
      '#c3d3dd',
      'center'
    );
    STREET.text(
      c,
      'SCORE  ' + this.score + '     DEFEATED  ' + this.kills + '     LIFE  ' + this.lives,
      W / 2,
      382,
      23,
      '#f4d1a1',
      'center'
    );
    STREET.text(c, 'Enter: 同じキャラクターで再挑戦     ESC: ゲーム選択', W / 2, 499, 18, '#a8beca', 'center');
    if (clear) STREET.text(c, 'ステージ1 完結', W / 2, 551, 14, '#8497a6', 'center');
  }
  drawProp(c, p) {
    if (BeltArt.drawProp(c, p)) return;
    c.save();
    c.translate(p.x, p.y);
    c.fillStyle = 'rgba(0,0,0,.4)';
    c.beginPath();
    c.ellipse(0, 0, 38, 9, 0, 0, 7);
    c.fill();
    if (p.type === 'crate') {
      STREET.panel(c, -30, -56, 60, 54, '#655036', '#b09262');
      c.strokeStyle = '#a18a61';
      c.lineWidth = 5;
      c.strokeRect(-25, -51, 50, 44);
      c.beginPath();
      c.moveTo(-25, -50);
      c.lineTo(25, -8);
      c.moveTo(25, -50);
      c.lineTo(-25, -8);
      c.stroke();
    } else {
      STREET.panel(c, -24, -64, 48, 62, '#43525a', '#87939a');
      for (const y of [-53, -16]) {
        c.fillStyle = '#77848b';
        c.fillRect(-26, y, 52, 5);
      }
      STREET.text(c, 'X', 0, -28, 20, '#ba8e62', 'center');
    }
    c.restore();
  }
  drawItem(c, p) {
    if (BeltArt.drawItem(this, c, p)) return;
    c.save();
    c.translate(p.x, p.y - 4 - Math.sin((p.age + this.tick) / 12) * 3);
    c.shadowBlur = 12;
    c.shadowColor = p.type === 'food' ? '#81e3ab' : '#eabe7b';
    if (p.type === 'food') {
      c.fillStyle = '#dd9d55';
      c.beginPath();
      c.ellipse(0, -8, 19, 11, -0.3, 0, 7);
      c.fill();
      c.fillStyle = '#fff0d6';
      c.fillRect(12, -8, 16, 5);
      STREET.text(c, 'FOOD', 0, 20, 11, '#a1eac1', 'center');
    } else if (p.type === 'cash') {
      STREET.panel(c, -16, -20, 32, 20, '#8a9e6c', '#c5d6a4');
      STREET.text(c, '$', 0, -4, 17, '#ecdfb3', 'center');
    } else {
      c.fillStyle = '#c3cbd0';
      c.fillRect(-35, -8, 70, 7);
      STREET.text(c, 'PIPE', 0, 20, 11, '#d5e6e9', 'center');
    }
    c.restore();
  }

  drawStreet(c) {
    if (BeltArt.drawStreet(this, c)) return;
    c.fillStyle = '#0b1420';
    c.fillRect(0, 0, W, H);
    const art = StageArt.artwork.get(1);
    if (art) {
      c.save();
      c.globalAlpha = 0.62;
      const offset = -(this.camera * 0.18) % 1280;
      for (let i = -1; i < 2; i++)
        c.drawImage(art.image, 0, 0, art.image.width, art.horizon, offset + i * 1280, 0, 1280, 400);
      c.restore();
    }
    const cam = this.camera;
    // Every block has its own storefront, shutters, fire escape, brickwork and signage.
    c.save();
    c.translate(-cam, 0);
    for (let i = Math.max(0, Math.floor(cam / 310) - 1); i < Math.min(20, Math.ceil((cam + W) / 310) + 1); i++) {
      const x = i * 310,
        tall = i % 3 === 0 ? 145 : 190,
        colors = ['#24303a', '#302b38', '#25383d', '#30333b'];
      STREET.panel(c, x, tall, 302, 436 - tall, colors[i % 4], '#4d5159');
      c.fillStyle = '#171c27';
      c.fillRect(x + 9, tall + 12, 282, 72);
      for (let k = 0; k < 6; k++) {
        c.fillStyle = (k + i) % 3 ? '#665548' : '#9e8660';
        c.fillRect(x + 19 + k * 45, tall + 23, 28, 42);
        c.fillStyle = '#222b36';
        c.fillRect(x + 32 + k * 45, tall + 23, 3, 42);
      }
      for (let y = tall + 90; y < 425; y += 15) {
        c.fillStyle = '#41414a';
        c.fillRect(x + 4, y, 294, 1);
        for (let bx = 0; bx < 7; bx++) c.fillRect(x + bx * 47 + (y % 30 ? 24 : 0), y, 1, 15);
      }
      STREET.panel(c, x + 28, 302, 246, 124, '#17212b', '#586069');
      for (let y = 310; y < 425; y += 8) {
        c.fillStyle = y % 16 ? '#323d46' : '#3d454b';
        c.fillRect(x + 31, y, 240, 3);
      }
      const names = ['NIGHT OWL', 'PAWN / 24H', 'DEAD PIXEL', 'NO VACANCY', 'BLACK MARKET', 'IRON DISTRICT'];
      const color = i % 2 ? '#ed8669' : '#76cec9';
      STREET.panel(c, x + 20, 263, 262, 34, '#141b27', color);
      STREET.text(c, names[i % 6], x + 151, 287, 19, color, 'center', '900');
      STREET.text(
        c,
        ['NO LAW', 'VOSS RULES', 'KEEP OUT', 'BURN IT'][i % 4],
        x + 85,
        395,
        20,
        i % 2 ? '#a57278' : '#6c9b9a',
        'center',
        '900'
      );
      // Chipped masonry, rust streaks, rivets, taped notices and disconnected utility boxes.
      for (let n = 0; n < 65; n++) {
        const px = x + 7 + ((n * 73 + i * 17) % 285),
          py = tall + 8 + ((n * 41 + i * 31) % (426 - tall));
        c.fillStyle = n % 3 ? 'rgba(185,177,154,.09)' : 'rgba(3,9,18,.24)';
        c.fillRect(px, py, 3 + (n % 7), 1 + (n % 3));
      }
      for (let y = 312; y < 425; y += 22) {
        c.fillStyle = '#8a7d6a';
        c.fillRect(x + 35, y, 2, 2);
        c.fillRect(x + 267, y, 2, 2);
      }
      STREET.panel(c, x + 242, tall + 97, 39, 45, '#566167', '#879092');
      for (let n = 0; n < 5; n++) {
        c.fillStyle = '#27353e';
        c.fillRect(x + 247, tall + 105 + n * 6, 28, 2);
      }
      c.strokeStyle = '#111921';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x + 259, tall + 142);
      c.lineTo(x + 259, 259);
      c.lineTo(x + 285, 259);
      c.lineTo(x + 285, 420);
      c.stroke();
      const paper = i % 2 ? '#8b9b92' : '#af9b83';
      STREET.panel(c, x + 185, 354, 31, 43, paper, null);
      STREET.text(c, i % 2 ? 'MISSING' : 'WANTED', x + 200, 365, 5, '#222a31', 'center', '900');
      c.fillStyle = '#465052';
      c.fillRect(x + 194, 371, 13, 13);
      c.fillRect(x + 190, 390, 21, 2);
      c.fillStyle = '#d0b877';
      c.fillRect(x + 182, 350, 10, 5);
      c.fillRect(x + 208, 393, 11, 4);
      c.strokeStyle = '#0a1723';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x, 230);
      c.quadraticCurveTo(x + 150, 261, x + 310, 216);
      c.stroke();
      if (i % 3 === 0) {
        c.fillStyle = '#191d27';
        c.fillRect(x + 278, 191, 8, 241);
        for (let y = 203; y < 427; y += 19) c.fillRect(x + 258, y, 30, 4);
        c.fillRect(x + 211, 244, 90, 7);
      }
      c.fillStyle = '#0b1018';
      c.fillRect(x + 298, tall, 12, 292);
      c.fillStyle = '#5d666a';
      c.fillRect(x + 4, 430, 298, 9);
      if (i > 15) {
        c.strokeStyle = '#748083';
        c.lineWidth = 2;
        for (let j = 0; j < 9; j++) {
          c.beginPath();
          c.moveTo(x + j * 35, 302);
          c.lineTo(x + j * 35 + 110, 432);
          c.stroke();
        }
      }
    }
    if (cam > 2100 && cam < 3900) {
      c.fillStyle = '#131b25';
      c.fillRect(2480, 170, 1240, 58);
      for (let x = 2500; x < 3720; x += 400) {
        c.fillStyle = '#3f464c';
        c.fillRect(x, 224, 65, 212);
        c.fillStyle = '#202b37';
        c.fillRect(x + 10, 230, 10, 204);
      }
    }
    // Asphalt has a broad traversable depth plane, separate from the distant city image.
    const floor = c.createLinearGradient(0, 435, 0, 650);
    floor.addColorStop(0, '#39454d');
    floor.addColorStop(0.12, '#26343d');
    floor.addColorStop(1, '#17232e');
    c.fillStyle = floor;
    c.fillRect(cam, 438, W, 215);
    c.fillStyle = '#819295';
    c.fillRect(cam, 440, W, 3);
    c.fillStyle = '#111e2a';
    c.fillRect(cam, 450, W, 7);
    for (let i = Math.floor(cam / 130); i < (cam + W) / 130; i++) {
      c.fillStyle = '#a99873';
      c.fillRect(i * 130, 617, 68, 4);
      c.fillStyle = '#374750';
      c.fillRect(i * 130 + 40, 531 + (i % 3) * 15, 72, 2);
      c.fillStyle = '#0f1b24';
      c.fillRect(i * 130 + 65, 476, 45, 13);
      for (let n = 0; n < 6; n++) {
        c.fillStyle = '#45545b';
        c.fillRect(i * 130 + 68 + n * 7, 477, 2, 11);
      }
    }
    for (let i = Math.floor(cam / 400); i < (cam + W) / 400; i++) {
      const x = i * 400 + 90;
      c.fillStyle = i % 2 ? 'rgba(229,108,124,.08)' : 'rgba(100,210,209,.10)';
      c.beginPath();
      c.ellipse(x + 80, 574, 118, 18, -0.1, 0, 7);
      c.fill();
      for (let j = 0; j < 8; j++) {
        c.fillStyle = '#4b5357';
        c.fillRect(x + j * 33, 490 + ((j * 29) % 120), 3 + (j % 3), 2);
      }
      c.fillStyle = '#0c1923';
      c.fillRect(x, 242, 7, 199);
      c.fillStyle = '#a1b7b7';
      c.fillRect(x - 22, 239, 55, 7);
      c.fillStyle = '#f3d69d';
      c.fillRect(x - 18, 246, 47, 4);
      const g = c.createRadialGradient(x + 5, 280, 8, x + 5, 280, 125);
      g.addColorStop(0, 'rgba(255,210,148,.14)');
      g.addColorStop(1, 'rgba(255,210,148,0)');
      c.fillStyle = g;
      c.fillRect(x - 120, 248, 250, 190);
    }
    // Abandoned patrol car, alley fire and boss gate are landmarks, not combat obstructions.
    for (const x of [700, 3300, 4500]) {
      c.fillStyle = '#0d1621';
      c.fillRect(x, 390, 160, 45);
      c.fillStyle = '#44515d';
      c.fillRect(x + 12, 398, 136, 25);
      c.fillStyle = '#728488';
      c.fillRect(x + 38, 368, 78, 31);
      c.fillStyle = '#172530';
      c.fillRect(x + 44, 373, 65, 22);
      for (const off of [29, 128]) {
        c.fillStyle = '#0a121b';
        c.beginPath();
        c.arc(x + off, 434, 16, 0, 7);
        c.fill();
        c.fillStyle = '#6c7880';
        c.fillRect(x + off - 4, 429, 8, 8);
      }
      c.fillStyle = Math.floor(this.tick / 25) % 2 ? '#e75964' : '#4ca9ca';
      c.fillRect(x + 65, 361, 20, 7);
    }
    for (const x of [1450, 2780, 4820]) {
      STREET.panel(c, x, 392, 36, 42, '#4e4a43', '#817261');
      for (let j = 0; j < 6; j++) {
        const h = 18 + Math.sin(this.tick * 0.16 + j) * 9;
        c.fillStyle = j % 2 ? '#efb463' : '#d87446';
        c.beginPath();
        c.moveTo(x + j * 6, 397);
        c.lineTo(x + j * 6 + 5, 397 - h);
        c.lineTo(x + j * 6 + 10, 397);
        c.fill();
      }
      c.fillStyle = 'rgba(151,145,141,.12)';
      for (let j = 0; j < 4; j++) {
        c.beginPath();
        c.ellipse(
          x + 18 + Math.sin(this.tick * 0.02 + j) * 10,
          373 - ((this.tick + j * 20) % 80),
          12 + j * 5,
          15 + j * 5,
          0,
          0,
          7
        );
        c.fill();
      }
    }
    c.fillStyle = '#0e1620';
    c.fillRect(5910, 185, 210, 250);
    for (let x = 5920; x < 6120; x += 19) {
      c.fillStyle = '#596168';
      c.fillRect(x, 190, 6, 242);
    }
    STREET.text(c, 'VOSS', 6017, 256, 43, '#df8269', 'center', '900');
    c.restore();
    // Rain and smoke are deterministic decoration, independent of combat simulation.
    c.strokeStyle = 'rgba(165,191,209,.17)';
    c.lineWidth = 1;
    for (let i = 0; i < 55; i++) {
      const x = (i * 173 + this.tick * 2) % W,
        y = (i * 91 + this.tick * 8) % 640;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x - 7, y + 18);
      c.stroke();
    }
    const shade = c.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, 'rgba(4,10,20,.32)');
    shade.addColorStop(0.5, 'rgba(4,10,20,0)');
    shade.addColorStop(1, 'rgba(4,10,20,.18)');
    c.fillStyle = shade;
    c.fillRect(0, 0, W, H);
  }
}

// Additive scene routing: the original fighting simulation stays in Game.updateBattle.
const classicUpdate = Game.prototype.update,
  classicDraw = Game.prototype.draw,
  classicPause = Game.prototype.togglePause;
Game.prototype.openHub = function () {
  ThrowMotion.cancel(this);
  if (this.street) this.street.breakGrab();
  fighterVoice.stopAll();
  this.scene = 'HUB';
  this.paused = false;
  this.hubChoice = this.hubChoice || 0;
  this.street = null;
  input.keys = {};
  input.clear();
  if (this.modalOpen) toggleModal(false);
  sound.playBGM(0);
};
// Roster card rectangle shared by STREET_SELECT drawing and click detection. Pitch shrinks when CHARACTERS grows past 6.
Game.prototype.streetCard = function (i) {
  const n = CHARACTERS.length,
    pitch = Math.min(200, Math.floor((W - 80) / n));
  return { x: 42 + i * pitch, y: 200, w: pitch - 12, h: 260 };
};
Game.prototype.startStreet = function (index) {
  fighterVoice.stopAll();
  this.paused = false;
  this.scene = 'STREET';
  this.p1Char = index;
  this.street = new NeonUprising(this, index);
  input.clear();
};
Game.prototype.togglePause = function () {
  if (this.scene === 'STREET') {
    if (this.street.result) return;
    this.paused = !this.paused;
    this.street.resetDashTap();
    if (this.paused) {
      fighterVoice.stopAll();
      input.keys = {};
    }
    sound.playUI('cursor');
  } else classicPause.call(this);
};
Game.prototype.update = function () {
  if (!['HUB', 'STREET_SELECT', 'STREET'].includes(this.scene)) {
    classicUpdate.call(this);
    return;
  }
  if (this.isPaused()) {
    if (this.scene === 'STREET') this.street.resetDashTap();
    input.clear();
    return;
  }
  this.stageTick++;
  if (this.scene === 'STREET') this.street.update();
  else if (this.scene === 'HUB') {
    // v2.8.1 start gate: browsers keep audio locked until a user gesture, and the first click on a card used to
    // leave the HUB at once, so its music was never heard. The first click / key now only starts (the input
    // handlers already called sound.init() and ensureBGM()). Escape and modifier keys are not gestures for browsers.
    if (this.awaitStart) {
      if (input.clicked || Object.keys(input.just).some((code) => !/^(Escape|Shift|Control|Alt|Meta|OS)/.test(code))) {
        this.awaitStart = false;
        sound.playUI('confirm');
      }
      input.clear();
      return;
    }
    if (STREET.press('ArrowLeft','ArrowRight', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS')) {
      this.hubChoice = 1 - (this.hubChoice || 0);
      sound.playUI('cursor');
    }
    let enter = STREET.press('Enter', 'Space', 'KeyJ', 'KeyZ');
    if (input.clicked)
      for (let i = 0; i < 2; i++)
        if (STREET.inside({ x: 62 + i * 590, y: 221, w: 566, h: 350 })) {
          this.hubChoice = i;
          enter = true;
        }
    if (enter) {
      sound.playUI('confirm');
      this.scene = this.hubChoice ? 'STREET_SELECT' : 'TITLE';
    }
  } else {
    if (STREET.press('ArrowLeft', 'KeyA')) this.p1Char = (this.p1Char + CHARACTERS.length - 1) % CHARACTERS.length;
    if (STREET.press('ArrowRight', 'KeyD')) this.p1Char = (this.p1Char + 1) % CHARACTERS.length;
    let enter = STREET.press('Enter', 'Space', 'KeyJ', 'KeyZ');
    if (input.clicked)
      for (let i = 0; i < CHARACTERS.length; i++)
        if (STREET.inside(this.streetCard(i))) {
          this.p1Char = i;
          enter = true;
        }
    if (enter) this.startStreet(this.p1Char);
  }
  input.clear();
};
Game.prototype.draw = function () {
  if (this.scene === 'STREET') {
    ctx.clearRect(0, 0, W, H);
    this.street.draw(ctx);
    return;
  }
  if (!['HUB', 'STREET_SELECT'].includes(this.scene)) {
    classicDraw.call(this);
    return;
  }
  ctx.save();
  StageArt.draw(ctx, 1, 0, this.stageTick, false);
  ctx.fillStyle = 'rgba(4,11,22,.86)';
  ctx.fillRect(0, 0, W, H);
  if (this.scene === 'HUB') {
    STREET.text(ctx, 'CHRONO BLITZ / ARCADE COLLECTION', 64, 65, 15, '#92abbc', 'left', '800');
    STREET.text(ctx, 'VERSION ' + STREET.version, W - 64, 65, 13, '#7c93a3', 'right', '800');
    STREET.text(ctx, 'CHOOSE YOUR BATTLE', 64, 132, 47, '#f0efea', 'left', '900');
    STREET.text(ctx, '二つの戦場。一つの闘志。', 66, 170, 18, '#9fb1c1');
    for (let i = 0; i < 2; i++) {
      const x = 62 + i * 590,
        selected = (this.hubChoice || 0) === i,
        color = i ? '#efaf78' : '#71dce2';
      STREET.panel(ctx, x, 221, 566, 350, selected ? '#182a39' : '#111c2c', selected ? color : '#344456');
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 1, 222, 564, 200);
      ctx.clip();
      ctx.globalAlpha = 0.45;
      ctx.translate(x, 222);
      ctx.scale(566 / 1280, 200 / 720);
      StageArt.draw(ctx, i ? 1 : 0, 0, this.stageTick, false);
      ctx.restore();
      for (let j = 0; j < 2; j++) {
        const f = this.getPreviewFighter((i * 3 + j) % CHARACTERS.length);
        f.animTick = this.stageTick;
        ctx.save();
        ctx.translate(x + 165 + j * 240, 422);
        ctx.scale(1.2, 1.2);
        f.drawBody(ctx, 0, 0, j ? -1 : 1, 'IDLE', 0, false);
        ctx.restore();
      }
      STREET.text(
        ctx,
        i ? '02 / SIDE-SCROLLING ACTION' : '01 / VERSUS FIGHTING',
        x + 24,
        251,
        12,
        color,
        'left',
        '800'
      );
      STREET.text(ctx, i ? 'NEON UPRISING' : 'OVERDRIVE', x + 24, 467, 36, '#f1efea', 'left', '900');
      STREET.text(ctx, i ? '犯罪都市を、拳で切り拓け。' : '一対一、限界を超える決闘。', x + 24, 503, 17, '#bdd0da');
      STREET.text(
        ctx,
        i ? '1 PLAYER  /  STAGE 01: BLACK VEIN' : 'ARCADE  /  VS CPU  /  VS 2P  /  TRAINING',
        x + 24,
        540,
        12,
        color,
        'left',
        '700'
      );
      if (selected) STREET.text(ctx, 'SELECTED', x + 540, 251, 11, color, 'right', '800');
    }
    STREET.text(
      ctx,
      '← → / A D で選択     ENTER で決定     またはカードをクリック',
      W / 2,
      623,
      16,
      '#b8cad8',
      'center'
    );
    if (this.awaitStart) {
      // Draw only: pulse comes from stageTick, no state or RNG is touched.
      const pulse = 0.72 + 0.28 * Math.sin(this.stageTick * 0.09);
      ctx.fillStyle = 'rgba(3,8,17,.62)';
      ctx.fillRect(0, 0, W, H);
      STREET.panel(ctx, W / 2 - 330, 300, 660, 150, '#0d1826', '#71dce2');
      ctx.globalAlpha = pulse;
      STREET.text(ctx, 'PRESS ANY KEY  /  CLICK TO START', W / 2, 362, 30, '#f1efea', 'center', '900');
      ctx.globalAlpha = 1;
      STREET.text(ctx, 'キーを押すか、画面をクリックするとスタートします（音楽が流れます）', W / 2, 408, 16, '#b8cad8', 'center');
    }
  } else {
    STREET.text(ctx, 'NEON UPRISING', 44, 65, 18, '#efb980', 'left', '900');
    STREET.text(ctx, 'VERSION ' + STREET.version, W - 44, 65, 13, '#7c93a3', 'right', '800');
    STREET.text(ctx, 'CHOOSE YOUR REBEL', 44, 120, 44, '#efeee8', 'left', '900');
    STREET.text(ctx, 'STAGE 01 / BLACK VEIN — 荒くれ者の巣くう犯罪都市へ', 44, 163, 17, '#9bb7c7');
    for (let i = 0; i < CHARACTERS.length; i++) {
      const d = CHARACTERS[i],
        r = this.streetCard(i),
        cx = r.x + r.w / 2,
        sel = this.p1Char === i;
      STREET.panel(ctx, r.x, r.y, r.w, r.h, sel ? '#243340' : '#111e2e', sel ? d.color : '#344859');
      const f = this.getPreviewFighter(i);
      f.animTick = this.stageTick;
      ctx.save();
      ctx.translate(cx, 385);
      f.drawBody(ctx, 0, 0, 1, 'IDLE', 0, false);
      ctx.restore();
      STREET.text(ctx, d.name, cx, 413, 22, d.color, 'center', '900');
      STREET.text(ctx, d.jpName, cx, 441, 13, '#c4d5df', 'center');
    }
    const d = CHARACTERS[this.p1Char];
    STREET.text(ctx, d.title, 44, 507, 21, d.color);
    STREET.text(
      ctx,
      'POWER ' + d.stats[0] + ' / SPEED ' + d.stats[1] + ' / REACH ' + d.stats[2],
      44,
      540,
      16,
      '#bfd0d9'
    );
    STREET.text(
      ctx,
      '移動: WASD / 矢印   攻撃: J / Z（パンチ→ボディ→アッパー、↓＋3発目で投げ）   ジャンプ: K / X   緊急技: L / C',
      44,
      583,
      17,
      '#dfc59d'
    );
    STREET.text(ctx, '← → で選択  /  ENTER またはカードをクリックで出撃  /  ESC で戻る', 44, 626, 15, '#91aaba');
  }
  ctx.restore();
};
// Avoid stuck movement on tab switch. Pause active runs until the player explicitly resumes.
window.addEventListener('blur', () => {
  input.keys = {};
  input.clear();
  if (game.scene === 'STREET' && !game.street.result) {
    game.street.resetDashTap();
    game.paused = true;
    fighterVoice.stopAll();
  }
  // The versus battle pauses too; otherwise the CPU keeps hitting a player whose keys were just released.
  else if (game.scene === 'BATTLE' && !game.paused && game.roundOverTimer === 0) {
    game.paused = true;
    fighterVoice.stopAll();
  }
});
