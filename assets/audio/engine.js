// v2.1 — Original FM / sampled-synthesis arcade soundtrack and layered Foley.
// No remote requests, sample licenses or game RNG. All PCM is built locally once per AudioContext.
const ARCADE_TRACKS = [
  {
    name: 'NIGHT SIGNAL',
    bpm: 108,
    roots: [38, 34, 41, 36],
    major: [false, true, true, true],
    style: 'synth',
    lead: 'lead',
    chord: 'keys',
    swing: 0.06
  },
  {
    name: 'CRIMSON IGNITION',
    bpm: 164,
    roots: [40, 36, 43, 38],
    major: [false, true, true, true],
    style: 'rock',
    lead: 'guitar',
    chord: 'guitar',
    swing: 0
  },
  {
    name: 'NEON CIRCUIT',
    bpm: 142,
    roots: [42, 38, 45, 40],
    major: [false, true, true, true],
    style: 'break',
    lead: 'lead',
    chord: 'keys',
    swing: 0.04
  },
  {
    name: 'FROZEN CROWN',
    bpm: 128,
    roots: [38, 34, 41, 36],
    major: [false, true, true, true],
    style: 'ice',
    lead: 'bell',
    chord: 'pad',
    swing: 0
  },
  {
    name: 'AMBER RUN',
    bpm: 122,
    roots: [45, 41, 48, 43],
    major: [false, true, true, true],
    style: 'funk',
    lead: 'brass',
    chord: 'keys',
    swing: 0.09
  },
  {
    name: 'BLACK VEIN / AFTER DARK',
    bpm: 112,
    roots: [38, 38, 34, 36],
    major: [false, false, true, true],
    style: 'street',
    lead: 'guitar',
    chord: 'keys',
    swing: 0.12
  },
  {
    name: 'IRON REIGN',
    bpm: 156,
    roots: [36, 36, 32, 34],
    major: [false, false, true, true],
    style: 'boss',
    lead: 'lead',
    chord: 'guitar',
    swing: 0
  },
  {
    name: 'BREAK THE DAWN',
    bpm: 126,
    roots: [48, 43, 45, 41],
    major: [true, true, false, true],
    style: 'victory',
    lead: 'brass',
    chord: 'keys',
    swing: 0.03
  }
];

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmVol = 0.65;
    this.seVol = 0.85;
    this.currentTrack = -1;
    this.timer = null;
    this.step = 0;
    this.stepDur = 0;
    this.nextStepTime = 0;
    this.bank = new Map();
    this.active = new Set();
    this.musicBuses = new Set();
    this.cooldowns = new Map();
    this.seed = 0x5a17c9e3;
    this.ducked = false;
    this.voiceBound = false;
    this.musicLevel = 0.48;
    this.stats = { started: 0, ended: 0, dropped: 0, peakVoices: 0 };
    this.jobs = [];
    this.bankOwner = new Map(); // key -> the context whose createBuffer made the buffer
    this.jobTimer = null;
    this.prebuilt = false; // v2.2: PCM bank can be built incrementally before the first gesture
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx || !this.voiceBound) return;
      if (document.hidden) {
        fighterVoice.stopAll();
        this.ctx.suspend();
      } else {
        this.nextStepTime = this.ctx.currentTime + 0.04;
        this.ctx.resume();
      }
    });
  }
  random() {
    let n = this.seed;
    n ^= n << 13;
    n ^= n >>> 17;
    n ^= n << 5;
    this.seed = n >>> 0;
    return this.seed / 4294967296;
  }
  mtof(n) {
    return 440 * Math.pow(2, (n - 69) / 12);
  }
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.attach(new AC(), true);
  }
  attach(context, bindVoices = false) {
    this.ctx = context;
    this.voiceBound = bindVoices;
    this.offline = typeof context.startRendering === 'function';
    this.comp = context.createDynamicsCompressor();
    Object.assign(this.comp.threshold, { value: -15 });
    this.comp.knee.value = 18;
    this.comp.ratio.value = 3;
    this.comp.attack.value = 0.005;
    this.comp.release.value = 0.14;
    this.limiter = context.createDynamicsCompressor();
    this.limiter.threshold.value = -2;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.002;
    this.limiter.release.value = 0.09;
    this.master = context.createGain();
    this.master.gain.value = 0.84;
    this.comp.connect(this.limiter);
    this.limiter.connect(this.master);
    this.master.connect(context.destination);
    this.bgmGain = context.createGain();
    this.seGain = context.createGain();
    this.seGain.connect(this.comp);
    this.musicEQ = context.createBiquadFilter();
    this.musicEQ.type = 'peaking';
    this.musicEQ.frequency.value = 2300;
    this.musicEQ.Q.value = 0.7;
    this.musicEQ.gain.value = -2.5;
    this.musicHigh = context.createBiquadFilter();
    this.musicHigh.type = 'highshelf';
    this.musicHigh.frequency.value = 6500;
    this.musicHigh.gain.value = -3;
    this.bgmGain.connect(this.musicEQ);
    this.musicEQ.connect(this.musicHigh);
    this.musicHigh.connect(this.comp);
    this.reverb = context.createConvolver();
    this.reverb.buffer = this.impulse();
    this.wet = context.createGain();
    this.wet.gain.value = 0.13;
    this.reverb.connect(this.wet);
    this.wet.connect(this.bgmGain);
    if (this.jobs.length) this.flushBank();
    else if (!this.bank.size) this.buildBank(context);
    this.adoptBank(context);
    this.musicBus = this.newMusicBus();
    // Set initial levels immediately; later changes use ramps to avoid clicks.
    this.bgmGain.gain.value = this.muted ? 0 : this.bgmVol * this.musicLevel;
    this.seGain.gain.value = this.muted ? 0 : this.seVol * 0.7;
    if (bindVoices) {
      fighterVoice.bind(this);
      fighterVoice.duck();
    }
  }
  impulse() {
    const rate = this.ctx.sampleRate,
      n = Math.floor(rate * 0.85),
      b = this.ctx.createBuffer(2, n, rate);
    for (let channel = 0; channel < 2; channel++) {
      const d = b.getChannelData(channel);
      for (let i = 0; i < n; i++) {
        const t = i / rate;
        d[i] = (this.random() * 2 - 1) * Math.exp(-t * 7) * 0.13;
        if (i < rate * 0.018) d[i] = 0;
      }
      for (const [time, level] of [
        [0.037, 0.35],
        [0.071, 0.22],
        [0.113, 0.12]
      ])
        d[Math.floor((time + channel * 0.007) * rate)] += level;
    }
    return b;
  }
  // Builds the 35 PCM sources. `context` only supplies createBuffer (an AudioBuffer is not tied to a context), so an
  // OfflineAudioContext can prepare everything at page load. With deferred=true the work is spread over idle timeouts
  // and flushBank() completes whatever is left when the real context attaches.
  buildBank(context = this.ctx, deferred = false) {
    const rate = 22050,
      tau = Math.PI * 2;
    const make = (key, duration, fn) =>
      this.jobs.push(() => {
        const b = context.createBuffer(1, Math.ceil(rate * duration), rate),
          d = b.getChannelData(0);
        let low = 0,
          previous = 0;
        for (let i = 0; i < d.length; i++) {
          const t = i / rate,
            n = this.random() * 2 - 1;
          low += 0.12 * (n - low);
          const hi = n - previous;
          previous = n;
          const edge = Math.min(1, i / 22, (d.length - 1 - i) / 110);
          d[i] = Math.tanh(fn(t, n, low, hi)) * edge;
        }
        this.bank.set(key, b);
        this.bankOwner.set(key, context);
      });
    make(
      'kick',
      0.42,
      (t, n) =>
        0.95 * Math.sin(tau * (48 * t + 1.75 * (1 - Math.exp(-t / 0.018)))) * Math.exp(-t * 13) +
        n * 0.19 * Math.exp(-t * 350)
    );
    make(
      'snare',
      0.3,
      (t, n, low) =>
        0.62 * (n - low) * Math.exp(-t * 18) +
        0.34 * Math.sin(tau * 185 * t) * Math.exp(-t * 23) +
        0.18 * Math.sin(tau * 335 * t) * Math.exp(-t * 33)
    );
    make('hat', 0.08, (t, n, low) => 0.31 * (n - low) * Math.exp(-t * 65));
    make('openhat', 0.32, (t, n, low) => 0.23 * (n - low) * Math.exp(-t * 13));
    make(
      'clap',
      0.24,
      (t, n, low) =>
        0.45 * (n - low) * [0, 0.011, 0.024].reduce((v, start) => v + (t >= start ? Math.exp(-(t - start) * 80) : 0), 0)
    );
    make('tom', 0.36, (t) => 0.7 * Math.sin(tau * (105 * t + 0.65 * (1 - Math.exp(-t * 30)))) * Math.exp(-t * 14));
    make(
      'crash',
      1.25,
      (t, n, low) =>
        ((n - low) * 0.29 + 0.07 * Math.sin(tau * 4381 * t) * Math.sin(tau * 6193 * t)) * Math.exp(-t * 4.2)
    );
    // Instruments are PCM performances at C3/C4, transposed by playbackRate, with a separate note envelope.
    for (const name of ['bass', 'guitar', 'keys', 'pad', 'lead', 'bell', 'brass']) {
      const freq = this.mtof(name === 'bass' ? 36 : 60);
      make(name, 2.2, (t) => {
        const p = tau * freq * t,
          pluck = Math.exp(-t * 4),
          attack = 1 - Math.exp(-t * (name === 'pad' ? 13 : name === 'brass' ? 55 : 700));
        let v = 0;
        if (name === 'bass')
          v =
            (Math.sin(p) + 0.32 * Math.sin(2 * p) * Math.exp(-t * 4) + 0.16 * Math.sin(3 * p) * Math.exp(-t * 8)) *
            0.56 *
            Math.exp(-t * 1.8);
        if (name === 'guitar') {
          for (let h = 1; h <= 10; h++)
            v += (Math.sin(p * h + 0.003 * h * Math.sin(tau * 5 * t)) * Math.exp(-t * (1.4 + h * 0.85))) / (h * 0.95);
          v = Math.tanh(v * 2.2) * 0.48;
        }
        if (name === 'keys')
          v =
            (Math.sin(p + 0.65 * pluck * Math.sin(p * 2)) * 0.54 + 0.12 * Math.sin(p * 7) * Math.exp(-t * 12)) *
            Math.exp(-t * 2.4);
        if (name === 'pad') {
          for (let h = 1; h <= 6; h++) v += (Math.sin(p * h) + Math.sin(p * h * 1.003)) / (h * h);
          v *= 0.19 * Math.exp(-t * 0.3);
        }
        if (name === 'lead')
          v =
            (Math.sin(p + (1.4 * pluck + 0.35) * Math.sin(p * 2)) * 0.42 +
              0.12 * Math.sin(p * 1.004) +
              0.08 * Math.sin(p * 2)) *
            Math.exp(-t * 0.7);
        if (name === 'bell')
          v =
            (Math.sin(p) * 0.4 +
              Math.sin(p * 2.76) * 0.25 * Math.exp(-t * 6) +
              Math.sin(p * 5.4) * 0.12 * Math.exp(-t * 12)) *
            Math.exp(-t * 2.5);
        if (name === 'brass') {
          for (let h = 1; h <= 8; h++) v += Math.sin(p * h) / (h * (1 + h * 0.15));
          v *= 0.36 * Math.exp(-t * 1.8);
        }
        return v * attack;
      });
    }
    for (let variant = 0; variant < 3; variant++) {
      const v = 1 + variant * 0.055;
      make(
        'punch' + variant,
        0.22,
        (t, n, low) =>
          0.55 * low * Math.exp(-t * 26) +
          0.22 * (n - low) * Math.exp(-t * 100) +
          0.52 * Math.sin(tau * 88 * v * t) * Math.exp(-t * 27)
      );
      make(
        'heavy' + variant,
        0.38,
        (t, n, low) =>
          0.65 * low * Math.exp(-t * 16) +
          0.32 * (n - low) * Math.exp(-t * 75) +
          0.65 * Math.sin(tau * 61 * v * t) * Math.exp(-t * 17)
      );
      make(
        'slash' + variant,
        0.29,
        (t, n, low) =>
          0.5 * (n - low) * (1 - Math.exp(-t * 150)) * Math.exp(-t * 24) +
          (0.13 * Math.sin(tau * 1790 * v * t) + 0.09 * Math.sin(tau * 2747 * v * t)) * Math.exp(-t * 28)
      );
      make(
        'wood' + variant,
        0.35,
        (t, n, low) =>
          0.7 * (n - low) * Math.exp(-t * 48) +
          0.32 * Math.sin(tau * 287 * v * t) * Math.exp(-t * 27) +
          0.3 * low * Math.exp(-t * 10) * (t > 0.04 ? 1 : 0)
      );
      make(
        'metal' + variant,
        0.55,
        (t, n, low) =>
          (0.3 * Math.sin(tau * 411 * v * t) +
            0.2 * Math.sin(tau * 673 * v * t) +
            0.12 * Math.sin(tau * 1109 * v * t)) *
            Math.exp(-t * 11) +
          0.35 * (n - low) * Math.exp(-t * 85)
      );
    }
    make('swing', 0.2, (t, n, low) => 0.5 * low * Math.pow(Math.sin((Math.PI * t) / 0.2), 1.4));
    make('swingHeavy', 0.3, (t, n, low) => 0.75 * low * Math.pow(Math.sin((Math.PI * t) / 0.3), 1.6));
    make('catch', 0.13, (t, n, low) => 0.65 * low * Math.exp(-t * 28) + 0.14 * n * Math.exp(-t * 70));
    make(
      'landing',
      0.56,
      (t, n, low) =>
        0.75 * low * Math.exp(-t * 10) +
        0.65 * Math.sin(tau * 48 * t) * Math.exp(-t * 12) +
        0.22 * (n - low) * Math.exp(-t * 62)
    );
    make(
      'energy',
      0.9,
      (t, n, low) =>
        0.45 * low * Math.exp(-t * 5) +
        0.5 * Math.sin(tau * (38 * t + 1.5 * (1 - Math.exp(-t * 8)))) * Math.exp(-t * 6) +
        0.2 * (n - low) * Math.exp(-t * 17)
    );
    make('reverse', 0.38, (t, n, low) => 0.45 * (n - low) * Math.pow(t / 0.38, 2));
    if (deferred) this.scheduleJobs();
    else this.flushBank();
  }
  scheduleJobs() {
    clearTimeout(this.jobTimer);
    this.jobTimer = setTimeout(() => {
      const until = performance.now() + 8;
      while (this.jobs.length && performance.now() < until) this.jobs.shift()();
      if (this.jobs.length) this.scheduleJobs();
    }, 0);
  }
  // Buffers prepared on the scratch OfflineAudioContext are silent on a different context in Chrome: copy them over.
  adoptBank(context) {
    for (const [key, buffer] of this.bank) {
      if (this.bankOwner.get(key) === context) continue;
      const copy = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      for (let ch = 0; ch < buffer.numberOfChannels; ch++) copy.copyToChannel(buffer.getChannelData(ch), ch);
      this.bank.set(key, copy);
      this.bankOwner.set(key, context);
    }
  }
  flushBank() {
    clearTimeout(this.jobTimer);
    this.jobTimer = null;
    while (this.jobs.length) this.jobs.shift()();
  }
  // Called once at page load: prepares PCM sources and voice clips without creating an AudioContext,
  // so the first keypress only has to resume audio instead of synthesizing ~350ms of material.
  prebuild() {
    if (this.ctx || this.prebuilt) return;
    this.prebuilt = true;
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return;
    let scratch;
    try {
      scratch = new OAC(1, 1, 44100);
    } catch (error) {
      return;
    }
    this.buildBank(scratch, true);
    fighterVoice.preload(scratch);
  }
  newMusicBus() {
    const bus = this.ctx.createGain();
    bus.connect(this.bgmGain);
    bus.connect(this.reverb);
    this.musicBuses.add(bus);
    return bus;
  }
  duckMusic(active) {
    this.ducked = active;
    if (this.ctx)
      this.bgmGain.gain.setTargetAtTime(
        this.muted ? 0 : this.bgmVol * this.musicLevel * (active ? 0.48 : 1),
        this.ctx.currentTime,
        this.muted ? 0.01 : active ? 0.025 : 0.22
      );
  }
  updateVol() {
    if (!this.ctx) return;
    this.seGain.gain.setTargetAtTime(this.muted ? 0 : this.seVol * 0.7, this.ctx.currentTime, 0.02);
    this.duckMusic(this.ducked);
    if (this.voiceBound) {
      fighterVoice.updateVolume();
      fighterVoice.duck();
    }
  }
  sample(key, t, volume = 1, rate = 1, pan = 0, duration = null, bus = null, group = 'music') {
    const buffer = this.bank.get(key);
    if (!buffer || !Number.isFinite(t)) return;
    const cap = group === 'music' ? 72 : 32;
    if (!this.offline && [...this.active].filter((v) => v.group === group).length >= cap) {
      this.stats.dropped++;
      return;
    }
    const at = Math.max(this.ctx.currentTime, t),
      length = Math.min(buffer.duration / rate, duration ?? buffer.duration / rate),
      release = Math.min(0.08, length * 0.3);
    const source = this.ctx.createBufferSource(),
      gain = this.ctx.createGain(),
      panner = this.ctx.createStereoPanner();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    panner.pan.value = pan;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.003);
    gain.gain.setValueAtTime(volume, at + Math.max(0.004, length - release));
    gain.gain.linearRampToValueAtTime(0, at + length);
    source.connect(gain);
    gain.connect(panner);
    const destination = bus || (group === 'music' ? this.musicBus : this.seGain);
    panner.connect(destination);
    const entry = { source, gain, panner, group, bus: destination, end: at + length };
    this.active.add(entry);
    this.stats.started++;
    this.stats.peakVoices = Math.max(this.stats.peakVoices, this.active.size);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      panner.disconnect();
      this.active.delete(entry);
      this.stats.ended++;
    };
    source.start(at);
    source.stop(at + length + 0.005);
    return entry;
  }
  note(name, midi, t, duration, volume = 0.3, pan = 0, bus = null, group = 'music') {
    return this.sample(
      name,
      t,
      volume,
      Math.pow(2, (midi - (name === 'bass' ? 36 : 60)) / 12),
      pan,
      duration,
      bus,
      group
    );
  }
  playBGM(track) {
    this.init();
    if (!this.ctx || !ARCADE_TRACKS[track] || (this.currentTrack === track && this.timer)) return;
    this.stopBGM();
    this.currentTrack = track;
    this.musicBus = this.newMusicBus();
    this.musicBus.gain.setValueAtTime(0, this.ctx.currentTime);
    this.musicBus.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.2);
    this.step = 0;
    this.stepDur = 60 / ARCADE_TRACKS[track].bpm / 4;
    this.nextStepTime = this.ctx.currentTime + 0.04;
    this.schedule();
    this.timer = setInterval(() => this.schedule(), 25);
  }
  stopBGM() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.currentTrack = -1;
    if (!this.ctx || !this.musicBus) return;
    const old = this.musicBus,
      now = this.ctx.currentTime;
    old.gain.cancelScheduledValues(now);
    old.gain.setTargetAtTime(0, now, 0.04);
    for (const entry of this.active)
      if (entry.bus === old)
        try {
          entry.source.stop(now + 0.15);
        } catch (e) {}
    setTimeout(() => {
      old.disconnect();
      this.musicBuses.delete(old);
    }, 200);
  }
  schedule() {
    if (!this.ctx || this.currentTrack < 0) return;
    if (this.ctx.state !== 'running') {
      this.nextStepTime = this.ctx.currentTime + 0.04;
      return;
    }
    // Never replay a backlog after a stalled tab / device interruption.
    if (this.nextStepTime < this.ctx.currentTime - 0.15) this.nextStepTime = this.ctx.currentTime + 0.02;
    const horizon = this.ctx.currentTime + 0.12;
    while (this.nextStepTime < horizon) {
      if (!this.muted) this.tick(this.currentTrack, this.step, this.nextStepTime);
      this.step = (this.step + 1) % 512;
      this.nextStepTime += this.stepDur;
    }
  }
  score(track, step) {
    const cfg = ARCADE_TRACKS[track],
      bar = Math.floor(step / 16) % 32,
      b = step % 16,
      chordIndex = Math.floor(bar / 2) % 4,
      root = cfg.roots[chordIndex],
      third = cfg.major[chordIndex] ? 4 : 3;
    const beat = 60 / cfg.bpm,
      unit = beat / 4,
      events = [];
    const note = (instrument, midi, length, volume, pan = 0) =>
      events.push({ instrument, midi, duration: length * unit, volume, pan });
    const drum = (instrument, volume, pan = 0) => events.push({ instrument, midi: null, duration: null, volume, pan });
    const breakdown = bar >= 12 && bar < 16,
      full = bar >= 4 && !breakdown,
      intense = bar >= 20 && bar < 28;
    const style = cfg.style,
      rock = style === 'rock' || style === 'boss',
      funk = style === 'funk' || style === 'street';
    const kickPattern = rock ? [0, 6, 8, 10] : funk ? [0, 3, 7, 10] : style === 'break' ? [0, 6, 10] : [0, 8];
    if (kickPattern.includes(b) && (!breakdown || b === 0)) drum('kick', rock ? 0.88 : 0.78);
    if ((b === 4 || b === 12) && (!breakdown || bar >= 14)) {
      drum('snare', rock ? 0.78 : 0.62);
      if (style === 'street' || style === 'victory') drum('clap', 0.2, -0.15);
    }
    if (b % 2 === 0 && (!breakdown || b % 4 === 0))
      drum(b === 14 && full ? 'openhat' : 'hat', b % 4 === 0 ? 0.31 : 0.2, 0.3);
    if (full && b === 11 && funk) drum('snare', 0.16, -0.08);
    if (full && b === 15 && intense) drum('hat', 0.13, -0.3);
    if (b === 0 && (bar === 4 || bar === 16 || bar === 24 || (bar === 0 && style === 'boss')))
      drum('crash', 0.38, -0.38);
    if (bar % 8 === 7 && b >= 12) {
      if (b % 2 === 0) drum('tom', 0.4, (b - 14) * 0.2);
      if (b === 15) drum('snare', 0.5);
    }
    // Bass follows the harmony with octave pickups and passing fifths.
    const bassPattern = rock ? [0, 2, 4, 6, 8, 10, 12, 14] : funk ? [0, 3, 6, 7, 10, 14] : [0, 6, 8, 14];
    if (bassPattern.includes(b) && (!breakdown || b === 0 || b === 8))
      note('bass', root + (b === 14 ? 7 : b === 7 ? 12 : 0), rock ? 1.7 : 2.7, rock ? 0.57 : 0.62);
    // Open voicings prevent the low midrange from swallowing the voice channel.
    const chordSteps = rock ? [0, 6, 8, 14] : funk ? [2, 7, 10] : style === 'ice' ? [0, 8] : [0, 10];
    if (chordSteps.includes(b)) {
      const length = cfg.chord === 'pad' ? 8 : rock ? 1.8 : 3.5,
        vol = cfg.chord === 'pad' ? 0.17 : rock ? 0.19 : 0.22;
      for (const [offset, pan] of [
        [12, -0.45],
        [12 + third, 0.4],
        [19, -0.2]
      ])
        note(cfg.chord, root + offset, length, vol * (breakdown ? 0.65 : 1), pan);
    }
    if (b === 0 && (full || style === 'ice'))
      for (const [offset, pan] of [
        [24, -0.65],
        [31, 0.65]
      ])
        note('pad', root + offset, 14, 0.1, pan);
    // Eight-bar call-and-response theme, varied in the second chorus.
    const melodySteps = [0, 3, 6, 8, 11, 14],
      motifs = [
        [7, third, 0, 12, 7, third],
        [0, 7, 12, 14, 12, 7],
        [third, 7, 12, 7, third, 0],
        [7, third, 2, 0, null, null],
        [12, 7, third, 7, 12, 14],
        [12, third + 12, 12, 7, third, 7],
        [7, 12, 14, third + 12, 14, 12],
        [third + 12, 12, 7, third, 2, 0]
      ];
    const pos = melodySteps.indexOf(b),
      motif = motifs[bar % 8];
    if (pos >= 0 && motif[pos] !== null && (bar >= 2 || style === 'victory') && !breakdown) {
      const midi = root + 24 + motif[pos] + (intense && pos === 3 ? 12 : 0),
        length = pos === 5 ? 2 : pos === 3 ? 2.7 : 2.2;
      note(cfg.lead, midi, length, style === 'ice' ? 0.3 : cfg.lead === 'guitar' ? 0.32 : 0.27, -0.05);
      if (intense && b === 0) note('bell', midi - 12, 5, 0.12, 0.5);
    }
    if ((breakdown || style === 'synth') && b % 4 === 2) {
      const arp = [0, 7, third + 12, 7][Math.floor(b / 4)];
      note('keys', root + 24 + arp, 3, 0.2, (b / 16 - 0.5) * 0.8);
    }
    return events;
  }
  tick(track, step, t) {
    const cfg = ARCADE_TRACKS[track];
    if (!cfg) return;
    const swung = t + (step % 2 ? (cfg.swing * 60) / cfg.bpm / 4 : 0);
    for (const event of this.score(track, step)) {
      if (event.midi === null) this.sample(event.instrument, swung, event.volume, 1, event.pan);
      else this.note(event.instrument, event.midi, swung, event.duration, event.volume, event.pan);
    }
  }
  effect(key, volume = 1, pan = 0, delay = 0, rate = 1) {
    return this.sample(key, this.ctx.currentTime + delay, volume, rate, pan, null, this.seGain, 'effect');
  }
  allow(key, gap = 0.025) {
    this.init();
    if (!this.ctx || this.muted || this.seVol <= 0) return false;
    const now = this.ctx.currentTime;
    if (now - (this.cooldowns.get(key) ?? -100) < gap) return false;
    this.cooldowns.set(key, now);
    return true;
  }
  variant(prefix) {
    return prefix + Math.floor(this.random() * 3);
  }
  playUI(type) {
    if (!this.allow('ui', 0.045)) return;
    const t = this.ctx.currentTime;
    if (type === 'cursor') {
      this.note('keys', 86, t, 0.065, 0.23, 0, this.seGain, 'effect');
      return;
    }
    for (const [i, n] of [60, 67, 76].entries())
      this.note('keys', n, t + i * 0.035, 0.21, 0.32, i * 0.12 - 0.12, this.seGain, 'effect');
  }
  playSwing(heavy = false) {
    if (this.allow('swing', 0.035))
      this.effect(heavy ? 'swingHeavy' : 'swing', heavy ? 0.9 : 0.7, (this.random() - 0.5) * 0.35);
  }
  playHit(style = 'light') {
    if (!this.allow('hit', 0.018)) return;
    if (style === 'justguard') {
      this.effect(this.variant('metal'), 0.55);
      for (const [i, n] of [84, 91].entries())
        this.note('bell', n, this.ctx.currentTime + i * 0.028, 0.25, 0.42, i ? 0.3 : -0.3, this.seGain, 'effect');
      return;
    }
    if (style === 'block') {
      this.effect(this.variant('metal'), 0.62, 0, 0, 1.16);
      return;
    }
    if (style === 'slash') {
      this.effect(this.variant('slash'), 0.95);
      this.effect(this.variant('punch'), 0.42, 0, 0.008);
      return;
    }
    this.effect(
      this.variant(style === 'light' ? 'punch' : 'heavy'),
      style === 'light' ? 0.95 : 1.05,
      (this.random() - 0.5) * 0.22
    );
  }
  playGrapple(phase) {
    if (!this.allow('grapple-' + phase, 0.025)) return;
    if (phase === 'catch') this.effect('catch', 1);
    else if (phase === 'release') {
      this.effect('swingHeavy', 1.15, -0.15);
      this.effect('catch', 0.45, 0.15, 0.035);
    } else {
      this.effect('landing', 1.05);
      this.effect(this.variant('wood'), 0.3, 0.2, 0.055);
    }
  }
  playSuper() {
    if (!this.allow('super', 0.18)) return;
    this.effect('reverse', 0.65);
    this.effect('energy', 1, 0, 0.07);
    this.effect(this.variant('metal'), 0.4, -0.35, 0.08);
    this.effect('crash', 0.22, 0.35, 0.11);
  }
  playBreak(material = 'wood') {
    if (!this.allow('break', 0.035)) return;
    this.effect(this.variant(material === 'metal' ? 'metal' : 'wood'), 1);
    this.effect('landing', 0.25, 0, 0.02);
  }
  playPickup(type) {
    if (!this.allow('pickup', 0.08)) return;
    const notes = type === 'food' ? [67, 72, 76] : type === 'pipe' ? [55, 62] : [76, 83, 88];
    for (const [i, n] of notes.entries())
      this.note('keys', n, this.ctx.currentTime + i * 0.06, 0.25, 0.43, i * 0.15 - 0.15, this.seGain, 'effect');
  }
  playCue(type) {
    if (!this.allow('cue-' + type, 0.4)) return;
    const t = this.ctx.currentTime;
    if (type === 'boss') {
      this.effect('reverse', 0.75);
      this.effect('energy', 0.8, 0, 0.25);
      for (const n of [36, 43, 48]) this.note('brass', n, t + 0.28, 0.8, 0.35, 0, this.seGain, 'effect');
    } else if (type === 'clear' || type === 'extend') {
      for (const [i, n] of [60, 64, 67, 72].entries())
        this.note('brass', n, t + i * 0.1, 0.42, 0.3, i * 0.1 - 0.15, this.seGain, 'effect');
    } else if (type === 'over') {
      for (const [i, n] of [55, 51, 48].entries())
        this.note('keys', n, t + i * 0.2, 0.55, 0.42, 0, this.seGain, 'effect');
    } else {
      this.effect('catch', 0.7);
      this.effect(this.variant('metal'), 0.36, 0.1, 0.12);
      this.effect('heavy0', 0.6, 0, 0.23);
    }
  }
  // Round banners already carry the words; use a short musical sting instead of robotic browser TTS.
  announce(text) {
    this.playCue(/Congratulations/i.test(text) ? 'clear' : /K\.O|KO/i.test(text) ? 'over' : 'start');
  }
}
const sound = new SoundEngine();
