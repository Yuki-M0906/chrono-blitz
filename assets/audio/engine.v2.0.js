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
    this.noiseBuf = null;

    // タブ非表示中はオーディオを止め、復帰時に再開（setInterval 間引きによる破綻を防ぐ）
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) {
        fighterVoice.stopAll();
        this.ctx.suspend();
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      } else {
        this.ctx.resume();
      }
    });
  }

  /** ユーザー操作時にAudioContextを初期化・レジュームする */
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.comp = this.ctx.createDynamicsCompressor();
    this.comp.connect(this.ctx.destination);
    this.bgmGain = this.ctx.createGain();
    this.seGain = this.ctx.createGain();
    this.bgmGain.connect(this.comp);
    this.seGain.connect(this.comp);
    // ノイズ源は 1 秒分を一度だけ生成し、再生位置をランダムにずらして再利用する
    const nLen = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, nLen, this.ctx.sampleRate);
    const nd = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < nLen; i++) nd[i] = Math.random() * 2 - 1;
    fighterVoice.bind(this);
    this.updateVol();
  }

  updateVol() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.bgmGain.gain.setTargetAtTime(this.muted ? 0 : this.bgmVol * 0.35, t, 0.05);
    this.seGain.gain.setTargetAtTime(this.muted ? 0 : this.seVol * 0.75, t, 0.05);
    fighterVoice.updateVolume();
    fighterVoice.duck();
  }

  /** MIDIノート番号を周波数(Hz)に変換 */
  mtof(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  /** BGMトラック切り替え (0: Menu, 1: Crimson, 2: Cyber, 3: Crystal) */
  playBGM(track) {
    this.init();
    if (!this.ctx || (this.currentTrack === track && this.timer)) return;
    this.stopBGM();
    this.currentTrack = track;
    this.step = 0;
    const bpms = [132, 156, 166, 152, 144];
    this.stepDur = 60 / (bpms[track] || 150) / 4;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    // 25ms ごとに起き、120ms 先までのステップを AudioContext 時刻で予約する（先読みスケジューラ）
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stopBGM() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  schedule() {
    if (!this.ctx) return;
    if (this.ctx.state !== 'running') {
      this.nextStepTime = this.ctx.currentTime + 0.05;
      return;
    }
    const horizon = this.ctx.currentTime + 0.12;
    while (this.nextStepTime < horizon) {
      if (!this.muted) this.tick(this.currentTrack, this.step, this.nextStepTime);
      this.step = (this.step + 1) % 64;
      this.nextStepTime += this.stepDur;
    }
  }

  /** 16分音符ごとのステップシーケンサー処理 (t: 発音予定時刻) */
  tick(tr, s, t) {
    const bar = Math.floor(s / 16);
    const b = s % 16;

    if (tr === 0) {
      // Track 0: Menu Synthwave
      const root = [45, 45, 41, 43][bar];
      if (b % 2 === 0) this.tone(t, this.mtof(root + (b % 4 === 2 ? 12 : 0)), 0.12, 'sawtooth', 0.3, this.bgmGain);
      if (b === 0 || b === 8) this.kick(t);
      if (b === 4 || b === 12) this.snare(t, 0.14);
      if (b % 2 === 1) this.hat(t, 0.04);
      const arp = [57, 60, 64, 67, 69, 67, 64, 60][s % 8];
      if (b % 2 === 0 || b === 7) this.tone(t, this.mtof(arp + 12), 0.1, 'triangle', 0.2, this.bgmGain);
    } else if (tr === 1) {
      // Track 1: Japanese Crimson Rock
      const root = [40, 43, 45, 47][bar];
      if (b % 2 === 0 || b === 3 || b === 11) this.tone(t, this.mtof(root), 0.1, 'sawtooth', 0.35, this.bgmGain);
      if (b === 0 || b === 6 || b === 8 || b === 11) this.kick(t);
      if (b === 4 || b === 12 || s >= 62) this.snare(t, 0.18);
      this.hat(t, b % 4 === 0 ? 0.07 : 0.03);
      const mel = [64,0,67,69,71,0,74,71, 69,0,67,64,66,67,64,0, 64,0,67,69,71,0,76,74, 71,0,74,71,76,0,78,0];
      const n = mel[s % 32];
      if (n > 0) this.tone(t, this.mtof(n + (bar >= 2 ? 2 : 0)), 0.16, 'sawtooth', 0.28, this.bgmGain);
    } else if (tr === 2) {
      // Track 2: Cyber Electro Breakbeat
      const root = [38, 41, 36, 39][bar];
      if (b === 0 || b === 3 || b === 6 || b === 10 || b === 14) this.tone(t, this.mtof(root), 0.13, 'square', 0.32, this.bgmGain);
      if (b === 0 || b === 10) this.kick(t);
      if (b === 4 || b === 12 || b === 15) this.snare(t, 0.18);
      this.hat(t, 0.05);
      const mel = [62,65,69,74,0,72,69,65, 62,65,72,69,0,65,67,69];
      if (mel[b] > 0) this.tone(t, this.mtof(mel[b] + (bar % 2) * 2), 0.11, 'square', 0.24, this.bgmGain);
    } else if (tr === 4) {
      // Track 4: Amber Harbor / bright coastal dance in A minor.
      const root = [45, 48, 43, 40][bar];
      if (b % 4 === 0 || b === 10) this.tone(t, this.mtof(root), 0.17, 'triangle', 0.38, this.bgmGain);
      if (b === 0 || b === 8) this.kick(t);
      if (b === 4 || b === 12) this.snare(t, 0.13);
      if (b % 2 === 1) this.hat(t, 0.04);
      const melody = [69,72,76,0,74,72,69,0,67,69,72,0,71,67,64,0];
      if (melody[b]) this.tone(t, this.mtof(melody[b] + (bar === 1 ? 3 : 0)), 0.17, 'triangle', 0.32, this.bgmGain);
    } else {
      // Track 3: Symphonic Ice Battle
      const root = [36, 39, 41, 43][bar];
      if (b % 2 === 0) this.tone(t, this.mtof(root + (b % 4 === 2 ? 7 : 0)), 0.12, 'sawtooth', 0.32, this.bgmGain);
      if (b === 0 || b === 3 || b === 8 || b === 10) this.kick(t);
      if (b === 4 || b === 12) this.snare(t, 0.16);
      if (b % 2 === 0) this.hat(t, 0.05);
      const mel = [72,0,70,67,68,0,67,63, 65,0,67,68,70,0,74,0];
      if (mel[b] > 0) this.tone(t, this.mtof(mel[b] + (bar === 3 ? 5 : 0)), 0.18, 'triangle', 0.32, this.bgmGain);
    }
  }

  tone(t, freq, dur, type, vol, dest) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.008, t + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  kick(t) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.11);
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.13);
    osc.connect(g);
    g.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  snare(t, vol) { this.noise(t, 0.11, 700, 'highpass', vol, this.bgmGain); }
  hat(t, vol) { this.noise(t, 0.04, 6500, 'highpass', vol, this.bgmGain); }

  noise(t, dur, cutoff, fType, vol, dest) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = fType;
    flt.frequency.setValueAtTime(cutoff, t);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.008, t + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(dest);
    const offset = Math.random() * Math.max(0, this.noiseBuf.duration - dur - 0.05);
    src.start(t, offset, dur + 0.02);
  }

  playUI(type) {
    this.init();
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    if (type === 'cursor') {
      this.tone(t, 920, 0.05, 'sine', 0.2, this.seGain);
    } else {
      this.tone(t, 523, 0.08, 'triangle', 0.3, this.seGain);
      this.tone(t + 0.05, 784, 0.12, 'triangle', 0.3, this.seGain);
      this.tone(t + 0.1, 1046, 0.2, 'triangle', 0.35, this.seGain);
    }
  }

  playSwing(heavy = false) {
    this.init();
    if (!this.ctx || this.muted) return;
    this.noise(this.ctx.currentTime, heavy ? 0.15 : 0.08, heavy ? 600 : 1200, 'bandpass', heavy ? 0.38 : 0.25, this.seGain);
  }

  playHit(style = 'light') {
    this.init();
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    if (style === 'block') {
      this.tone(t, 580, 0.08, 'square', 0.35, this.seGain);
      return;
    }
    if (style === 'justguard') {
      this.tone(t, 1200, 0.15, 'triangle', 0.5, this.seGain);
      this.tone(t + 0.04, 1900, 0.2, 'sine', 0.5, this.seGain);
      return;
    }
    const heavy = style !== 'light';
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = style === 'slash' ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(heavy ? 240 : 320, t);
    osc.frequency.exponentialRampToValueAtTime(36, t + (heavy ? 0.22 : 0.11));
    g.gain.setValueAtTime(heavy ? 0.75 : 0.45, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + (heavy ? 0.23 : 0.12));
    osc.connect(g);
    g.connect(this.seGain);
    osc.start(t);
    osc.stop(t + (heavy ? 0.24 : 0.13));
    this.noise(t, heavy ? 0.18 : 0.09, style === 'slash' ? 1800 : 1100, style === 'slash' ? 'highpass' : 'lowpass', heavy ? 0.5 : 0.28, this.seGain);
  }

  playGrapple(phase) {
    this.init();if(!this.ctx||this.muted)return;
    const t=this.ctx.currentTime;
    if(phase==='catch') {
      this.noise(t,.065,420,'lowpass',.25,this.seGain);
      this.tone(t,170,.05,'triangle',.18,this.seGain);
    } else if(phase==='release') {
      this.noise(t,.18,950,'bandpass',.42,this.seGain);
      this.tone(t,150,.10,'triangle',.16,this.seGain);
    } else {
      this.kick(t);this.tone(t,62,.25,'sine',.55,this.seGain);
      this.noise(t,.19,480,'lowpass',.58,this.seGain);
      this.noise(t+.06,.11,1450,'bandpass',.18,this.seGain);
    }
  }

  playSuper() {
    this.init();
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.setValueAtTime(170, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.65);
    g.gain.setValueAtTime(0.85, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.68);
    osc.connect(g);
    g.connect(this.seGain);
    osc.start(t);
    osc.stop(t + 0.7);
    [1046, 1318, 1568, 2093].forEach((f, i) => {
      this.tone(t + i * 0.03, f, 0.5, 'sawtooth', 0.2, this.seGain);
    });
  }

  announce(text) {
    if (this.muted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.pitch = 0.92;
      u.rate = 1.1;
      u.volume = Math.min(1, this.seVol);
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
}

const sound = new SoundEngine();