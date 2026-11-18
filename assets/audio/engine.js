// v3.9.0 — Live Acoustic Symphony Orchestra & Cathedral Sound Engine + Physical-Modeled Foley.
// No remote requests, sample licenses or game RNG. All acoustic PCM is synthesized locally once per AudioContext.
const ARCADE_TRACKS = [
  {
    id: 0,
    name: 'NIGHT SIGNAL',
    subtitle: 'Grand Overture in D Minor',
    bpm: 84,
    root: 50, // D3
    scale: [0, 2, 3, 5, 7, 8, 10], // D Aeolian
    prog: [0, 5, 2, 6, 3, 0, 5, 4], // Dm - Bb - F - C - Gm - Dm - Bb - Am
    progB: [5, 6, 0, 2, 3, 5, 6, 0], // Bb - C - Dm - F - Gm - Bb - C - Dm
    lead: 'strings',
    sub: 'horn',
    padInst: 'lowStrings',
    keyInst: 'piano',
    style: 'overture',
    swing: 0
  },
  {
    id: 1,
    name: 'CRIMSON IGNITION',
    subtitle: 'Scarlet Bushido Symphony',
    bpm: 102,
    root: 52, // E3
    scale: [0, 2, 3, 5, 7, 8, 10], // E Aeolian
    prog: [0, 5, 6, 0, 3, 5, 6, 4], // Em - C - D - Em - Am - C - D - Bm
    progB: [5, 6, 2, 0, 3, 5, 6, 0], // C - D - G - Em - Am - C - D - Em
    lead: 'wind',
    sub: 'strings',
    padInst: 'lowStrings',
    keyInst: 'harp',
    style: 'castle',
    swing: 0
  },
  {
    id: 2,
    name: 'NEON CIRCUIT',
    subtitle: 'Spire of Horizon',
    bpm: 112,
    root: 57, // A3
    scale: [0, 2, 3, 5, 7, 8, 10], // A Aeolian
    prog: [0, 6, 5, 6, 0, 2, 3, 4], // Am - G - F - G - Am - C - Dm - Em
    progB: [5, 6, 0, 2, 3, 5, 4, 0], // F - G - Am - C - Dm - F - Em - Am
    lead: 'strings',
    sub: 'trumpet',
    padInst: 'lowStrings',
    keyInst: 'piano',
    style: 'metropolis',
    swing: 0
  },
  {
    id: 3,
    name: 'FROZEN CROWN',
    subtitle: 'Cathedral of Ice',
    bpm: 80,
    root: 54, // F#3
    scale: [0, 2, 3, 5, 7, 8, 10], // F# Aeolian
    prog: [0, 5, 3, 4, 0, 2, 5, 6], // F#m - D - Bm - C#m - F#m - A - D - E
    progB: [3, 5, 6, 0, 3, 5, 4, 0], // Bm - D - E - F#m - Bm - D - C#m - F#m
    lead: 'choir',
    sub: 'strings',
    padInst: 'organ',
    keyInst: 'harp',
    style: 'cathedral',
    swing: 0
  },
  {
    id: 4,
    name: 'AMBER RUN',
    subtitle: 'Golden Horizon',
    bpm: 96,
    root: 55, // G3
    scale: [0, 2, 3, 5, 7, 9, 10], // G Dorian (concordant degrees 0,2,3,4,6)
    prog: [0, 3, 6, 2, 0, 3, 4, 6], // Gm - C - F - Bb - Gm - C - Dm - F
    progB: [2, 6, 3, 0, 3, 4, 6, 0], // Bb - F - C - Gm - C - Dm - F - Gm
    lead: 'strings',
    sub: 'horn',
    padInst: 'lowStrings',
    keyInst: 'acguitar',
    style: 'harbor',
    swing: 0
  },
  {
    id: 5,
    name: 'BLACK VEIN / AFTER DARK',
    subtitle: 'Iron Nocturne in C# Minor',
    bpm: 90,
    root: 49, // C#3
    scale: [0, 2, 3, 5, 7, 8, 10], // C# Aeolian
    prog: [0, 5, 3, 4, 0, 2, 5, 6], // C#m - A - F#m - G#m - C#m - E - A - B
    progB: [5, 6, 0, 2, 3, 5, 6, 0], // A - B - C#m - E - F#m - A - B - C#m
    lead: 'horn',
    sub: 'strings',
    padInst: 'lowStrings',
    keyInst: 'piano',
    style: 'noir',
    swing: 0
  },
  {
    id: 6,
    name: 'IRON REIGN',
    subtitle: 'Requiem of Steel',
    bpm: 104,
    root: 48, // C3
    scale: [0, 2, 3, 5, 7, 8, 10], // C Aeolian
    prog: [0, 5, 6, 0, 3, 5, 4, 6], // Cm - Ab - Bb - Cm - Fm - Ab - Gm - Bb
    progB: [5, 6, 0, 2, 3, 5, 6, 0], // Ab - Bb - Cm - Eb - Fm - Ab - Bb - Cm
    lead: 'trumpet',
    sub: 'choir',
    padInst: 'organ',
    keyInst: 'spiccato',
    style: 'requiem',
    swing: 0
  },
  {
    id: 7,
    name: 'BREAK THE DAWN',
    subtitle: 'Coronation Fanfare in D Major',
    bpm: 94,
    root: 50, // D3
    scale: [0, 2, 4, 5, 7, 9, 11], // D Major
    prog: [0, 4, 5, 3, 1, 4, 3, 4], // D - A - Bm - G - Em - A - G - A
    progB: [3, 4, 5, 0, 3, 0, 4, 0], // G - A - Bm - D - G - D - A - D
    lead: 'trumpet',
    sub: 'strings',
    padInst: 'choir',
    keyInst: 'piano',
    style: 'coronation',
    swing: 0
  },
  {
    id: 8, name: 'REDLINE RIG', subtitle: 'Skyhook Ascent', bpm: 156,
    root: 40, scale: [0,2,3,5,7,8,10], style: 'industrial', swing: .035
  }
];

// Each phrase entry: [degOffset, lenSteps, velocity, isChordRelative]
const TRACK_COMPOSITIONS = [
  // 0: NIGHT SIGNAL — Grand Overture (D Minor, 84 BPM)
  {
    melA1: [
      [0, 6, 0.86, 1], null, null, null, null, null, [2, 2, 0.80, 1], null,
      [4, 6, 0.90, 1], null, null, null, null, null, [2, 2, 0.82, 1], null
    ],
    melA2: [
      [4, 4, 0.88, 1], null, null, null, [5, 4, 0.92, 1], null, null, null,
      [4, 6, 0.90, 1], null, null, null, null, null, [2, 2, 0.82, 1], null
    ],
    melB1: [
      [7, 6, 0.96, 1], null, null, null, null, null, [6, 2, 0.90, 1], null,
      [7, 4, 0.94, 1], null, null, null, [4, 4, 0.90, 1], null, null, null
    ],
    melB2: [
      [9, 4, 0.98, 1], null, null, null, [7, 4, 0.95, 1], null, null, null,
      [4, 8, 0.96, 1], null, null, null, null, null, null, null
    ],
    counter: [
      null, null, null, null, [2, 4, 0.72, 1], null, null, null,
      null, null, null, null, [0, 4, 0.70, 1], null, null, null
    ],
    arpSteps: [0, 2, 4, 6, 8, 10, 12, 14],
    arpDegs: [0, 4, 7, 9, 11, 9, 7, 4],
    bassRhythm: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
    bassDegs: [0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 2, 0]
  },
  // 1: CRIMSON IGNITION — Scarlet Bushido Symphony (E Minor, 102 BPM)
  {
    melA1: [
      [4, 4, 0.90, 1], null, null, null, [3, 2, 0.84, 1], null, [2, 2, 0.86, 1], null,
      [0, 6, 0.92, 1], null, null, null, null, null, [2, 2, 0.82, 1], null
    ],
    melA2: [
      [4, 4, 0.92, 1], null, null, null, [6, 2, 0.88, 1], null, [7, 2, 0.94, 1], null,
      [4, 8, 0.94, 1], null, null, null, null, null, null, null
    ],
    melB1: [
      [7, 4, 0.98, 1], null, null, null, [9, 2, 0.94, 1], null, [7, 2, 0.92, 1], null,
      [6, 4, 0.94, 1], null, null, null, [4, 4, 0.90, 1], null, null, null
    ],
    melB2: [
      [9, 4, 1.00, 1], null, null, null, [7, 2, 0.94, 1], null, [6, 2, 0.92, 1], null,
      [7, 8, 0.98, 1], null, null, null, null, null, null, null
    ],
    counter: [
      null, null, null, null, null, null, null, null,
      [4, 4, 0.78, 1], null, null, null, [2, 4, 0.74, 1], null, null, null
    ],
    arpSteps: [0, 3, 6, 8, 11, 14],
    arpDegs: [0, 4, 7, 9, 7, 4],
    bassRhythm: [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    bassDegs: [0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 0, 0]
  },
  // 2: NEON CIRCUIT — Spire of Horizon Neo-Classical (A Minor, 112 BPM)
  {
    melA1: [
      [7, 4, 0.90, 1], null, null, null, [4, 2, 0.86, 1], null, [6, 2, 0.88, 1], null,
      [7, 4, 0.92, 1], null, null, null, [2, 4, 0.88, 1], null, null, null
    ],
    melA2: [
      [4, 4, 0.90, 1], null, null, null, [6, 2, 0.88, 1], null, [7, 2, 0.94, 1], null,
      [9, 6, 0.96, 1], null, null, null, null, null, [7, 2, 0.88, 1], null
    ],
    melB1: [
      [9, 4, 0.96, 1], null, null, null, [11, 2, 0.94, 1], null, [9, 2, 0.92, 1], null,
      [7, 4, 0.94, 1], null, null, null, [4, 4, 0.90, 1], null, null, null
    ],
    melB2: [
      [11, 4, 1.00, 1], null, null, null, [9, 2, 0.94, 1], null, [7, 2, 0.92, 1], null,
      [7, 8, 0.98, 1], null, null, null, null, null, null, null
    ],
    counter: [
      null, null, [0, 2, 0.74, 1], null, null, null, null, null,
      null, null, [4, 2, 0.76, 1], null, null, null, [2, 2, 0.72, 1], null
    ],
    arpSteps: [0, 2, 4, 6, 8, 10, 12, 14],
    arpDegs: [0, 4, 7, 4, 9, 7, 4, 2],
    bassRhythm: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
    bassDegs: [0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 7, 0]
  },
  // 3: FROZEN CROWN — Cathedral of Ice (F# Minor, 80 BPM)
  {
    melA1: [
      [0, 6, 0.86, 1], null, null, null, null, null, [2, 2, 0.82, 1], null,
      [4, 8, 0.90, 1], null, null, null, null, null, null, null
    ],
    melA2: [
      [6, 4, 0.88, 1], null, null, null, [4, 4, 0.86, 1], null, null, null,
      [2, 6, 0.88, 1], null, null, null, null, null, [0, 2, 0.80, 1], null
    ],
    melB1: [
      [7, 6, 0.96, 1], null, null, null, null, null, [6, 2, 0.90, 1], null,
      [4, 8, 0.94, 1], null, null, null, null, null, null, null
    ],
    melB2: [
      [7, 4, 0.96, 1], null, null, null, [9, 4, 0.98, 1], null, null, null,
      [7, 8, 0.96, 1], null, null, null, null, null, null, null
    ],
    counter: [
      null, null, null, null, [4, 4, 0.74, 1], null, null, null,
      null, null, null, null, [2, 4, 0.72, 1], null, null, null
    ],
    arpSteps: [0, 2, 4, 8, 10, 12],
    arpDegs: [0, 4, 7, 9, 7, 4],
    bassRhythm: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    bassDegs: [0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0]
  },
  // 4: AMBER RUN — Golden Horizon (G Dorian, 96 BPM)
  {
    melA1: [
      [2, 4, 0.88, 1], null, null, null, [4, 2, 0.84, 1], null, [6, 2, 0.88, 1], null,
      [7, 6, 0.92, 1], null, null, null, null, null, [4, 2, 0.84, 1], null
    ],
    melA2: [
      [6, 4, 0.90, 1], null, null, null, [4, 2, 0.86, 1], null, [2, 2, 0.84, 1], null,
      [4, 8, 0.92, 1], null, null, null, null, null, null, null
    ],
    melB1: [
      [9, 4, 0.96, 1], null, null, null, [7, 2, 0.90, 1], null, [6, 2, 0.90, 1], null,
      [7, 4, 0.94, 1], null, null, null, [4, 4, 0.90, 1], null, null, null
    ],
    melB2: [
      [6, 4, 0.94, 1], null, null, null, [7, 2, 0.92, 1], null, [9, 2, 0.96, 1], null,
      [7, 8, 0.96, 1], null, null, null, null, null, null, null
    ],
    counter: [
      null, null, null, null, [0, 4, 0.72, 1], null, null, null,
      null, null, null, null, [2, 4, 0.72, 1], null, null, null
    ],
    arpSteps: [0, 2, 4, 6, 8, 10, 12, 14],
    arpDegs: [0, 2, 4, 7, 9, 7, 4, 2],
    bassRhythm: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0],
    bassDegs: [0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 2, 0]
  },
  // 5: BLACK VEIN / AFTER DARK — Iron Nocturne (C# Minor, 90 BPM)
  {
    melA1: [
      [0, 6, 0.90, 1], null, null, null, null, null, [4, 2, 0.86, 1], null,
      [3, 4, 0.88, 1], null, null, null, [2, 4, 0.86, 1], null, null, null
    ],
    melA2: [
      [0, 4, 0.90, 1], null, null, null, [2, 2, 0.86, 1], null, [4, 2, 0.90, 1], null,
      [7, 6, 0.94, 1], null, null, null, null, null, [4, 2, 0.86, 1], null
    ],
    melB1: [
      [7, 4, 0.96, 1], null, null, null, [6, 2, 0.92, 1], null, [4, 2, 0.90, 1], null,
      [7, 6, 0.96, 1], null, null, null, null, null, [2, 2, 0.88, 1], null
    ],
    melB2: [
      [9, 4, 0.98, 1], null, null, null, [7, 2, 0.94, 1], null, [6, 2, 0.92, 1], null,
      [4, 8, 0.96, 1], null, null, null, null, null, null, null
    ],
    counter: [
      null, null, null, null, [7, 4, 0.78, 1], null, null, null,
      null, null, null, null, [4, 4, 0.74, 1], null, null, null
    ],
    arpSteps: [0, 4, 8, 12],
    arpDegs: [0, 4, 7, 9],
    bassRhythm: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
    bassDegs: [0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 2, 0, 4, 0]
  },
  // 6: IRON REIGN — Requiem of Steel (C Minor, 104 BPM)
  {
    melA1: [
      [0, 4, 0.96, 1], null, null, null, [4, 4, 0.98, 1], null, null, null,
      [5, 4, 0.96, 1], null, null, null, [4, 4, 0.94, 1], null, null, null
    ],
    melA2: [
      [7, 4, 0.98, 1], null, null, null, [6, 2, 0.94, 1], null, [4, 2, 0.92, 1], null,
      [2, 6, 0.96, 1], null, null, null, null, null, [4, 2, 0.90, 1], null
    ],
    melB1: [
      [7, 4, 1.00, 1], null, null, null, [9, 2, 0.96, 1], null, [7, 2, 0.94, 1], null,
      [11, 4, 1.00, 1], null, null, null, [9, 4, 0.96, 1], null, null, null
    ],
    melB2: [
      [11, 4, 1.00, 1], null, null, null, [9, 2, 0.96, 1], null, [7, 2, 0.94, 1], null,
      [7, 8, 1.00, 1], null, null, null, null, null, null, null
    ],
    counter: [
      null, null, [0, 2, 0.80, 1], null, null, null, [4, 2, 0.82, 1], null,
      null, null, [7, 2, 0.84, 1], null, null, null, [4, 2, 0.80, 1], null
    ],
    arpSteps: [0, 2, 4, 6, 8, 10, 12, 14],
    arpDegs: [0, 4, 7, 4, 0, 4, 7, 9],
    bassRhythm: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    bassDegs: [0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 7, 0, 4, 0]
  },
  // 7: BREAK THE DAWN — Coronation Fanfare (D Major, 94 BPM)
  {
    melA1: [
      [4, 4, 0.94, 1], null, null, null, [7, 2, 0.92, 1], null, [9, 2, 0.94, 1], null,
      [11, 6, 0.98, 1], null, null, null, null, null, [9, 2, 0.90, 1], null
    ],
    melA2: [
      [7, 4, 0.94, 1], null, null, null, [6, 2, 0.90, 1], null, [4, 2, 0.90, 1], null,
      [7, 8, 0.98, 1], null, null, null, null, null, null, null
    ],
    melB1: [
      [9, 4, 0.98, 1], null, null, null, [11, 2, 0.96, 1], null, [9, 2, 0.94, 1], null,
      [7, 4, 0.96, 1], null, null, null, [4, 4, 0.94, 1], null, null, null
    ],
    melB2: [
      [11, 4, 1.00, 1], null, null, null, [9, 2, 0.96, 1], null, [11, 2, 0.98, 1], null,
      [14, 8, 1.00, 1], null, null, null, null, null, null, null
    ],
    counter: [
      null, null, null, null, [4, 4, 0.80, 1], null, null, null,
      null, null, null, null, [7, 4, 0.82, 1], null, null, null
    ],
    arpSteps: [0, 2, 4, 6, 8, 10, 12, 14],
    arpDegs: [0, 4, 7, 9, 11, 9, 7, 4],
    bassRhythm: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
    bassDegs: [0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 7, 0, 4, 0]
  }
];

const PCM_CACHE = new Map();

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
    this.noteBank = new Map();
    this.active = new Set();
    this.musicBuses = new Set();
    this.cooldowns = new Map();
    this.seed = 0x5a17c9e3;
    this.ducked = false;
    this.voiceBound = false;
    this.musicLevel = 0.48;
    this.stats = { started: 0, ended: 0, dropped: 0, stolen: 0, peakVoices: 0 };
    this.jobs = [];
    this.bankOwner = new Map();
    this.noteBankOwner = new Map();
    this.jobTimer = null;
    this.prebuilt = false;
    this.sampleRate = 24000;
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx || !this.voiceBound) return;
        if (document.hidden) {
          if (typeof fighterVoice !== 'undefined') fighterVoice.stopAll();
          this.ctx.suspend();
        } else {
          this.nextStepTime = this.ctx.currentTime + 0.04;
          this.ctx.resume();
        }
      });
    }
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      const resume = () => {
        if (this.ctx && !this.offline && this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
          this.ctx.resume();
        }
      };
      for (const ev of ['click', 'pointerup', 'mouseup', 'keydown']) {
        window.addEventListener(ev, resume, { passive: true });
      }
    }
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
  noise(i, seed = 1) {
    const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453123;
    return (x - Math.floor(x)) * 2 - 1;
  }
  metallic(t, base = 360, spread = 1.414) {
    const ratios = [1, 1.342, 1.661, 2.023, 2.519, 3.184];
    let sum = 0;
    for (let idx = 0; idx < ratios.length; idx++) {
      const r = ratios[idx] * (1 + (spread - 1.4) * 0.08 * idx);
      const s = Math.sin(Math.PI * 2 * base * r * t);
      sum += (s >= 0 ? 0.82 : -0.82) * (1 / (1 + idx * 0.22));
    }
    return sum * 0.22;
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
    this.musicEQ.frequency.value = 2400;
    this.musicEQ.Q.value = 0.7;
    this.musicEQ.gain.value = -1.6;
    this.musicHigh = context.createBiquadFilter();
    this.musicHigh.type = 'highshelf';
    this.musicHigh.frequency.value = 7200;
    this.musicHigh.gain.value = -1.1;
    this.bgmGain.connect(this.musicEQ);
    this.musicEQ.connect(this.musicHigh);
    this.musicHigh.connect(this.comp);
    this.reverb = context.createConvolver();
    this.reverb.buffer = this.impulse();
    this.wet = context.createGain();
    this.wet.gain.value = 0.25;
    this.reverb.connect(this.wet);
    this.wet.connect(this.bgmGain);
    if (this.jobs.length) this.flushBank();
    else if (!this.bank.size) this.buildBank(context);
    this.adoptBank(context);
    this.musicBus = this.newMusicBus();
    this.bgmGain.gain.value = this.muted ? 0 : this.bgmVol * this.musicLevel;
    this.seGain.gain.value = this.muted ? 0 : this.seVol * 0.82;
    if (bindVoices && typeof fighterVoice !== 'undefined') {
      fighterVoice.bind(this);
      if (fighterVoice.ready && !this.offline) {
        const baseReady = fighterVoice.ready;
        fighterVoice.ready = Promise.resolve(baseReady).then(async () => {
          if (this.ctx && this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
            try {
              await this.ctx.resume();
            } catch (e) {}
          }
          const t0 = performance.now();
          while (this.ctx && this.ctx.currentTime === 0 && performance.now() - t0 < 800) {
            await new Promise((r) => setTimeout(r, 12));
          }
        });
      }
      fighterVoice.duck();
    }
    if (!this.offline && context.state === 'suspended' && typeof context.resume === 'function') {
      context.resume();
    }
  }
  impulse() {
    // 2.25s Stereo Symphony Hall / Cathedral Impulse Response (frequency-dependent damping + early stage reflections)
    const rate = this.ctx.sampleRate,
      n = Math.floor(rate * 2.25),
      b = this.ctx.createBuffer(2, n, rate);
    for (let channel = 0; channel < 2; channel++) {
      const d = b.getChannelData(channel);
      let s = (0x9e3779b9 + channel * 0x517cc1b7) >>> 0;
      let lp1 = 0,
        lp2 = 0,
        hp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / rate;
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        const nVal = s / 2147483648 - 1;
        const env = (1 - Math.exp(-t * 45)) * (0.58 * Math.exp(-t * 2.35) + 0.42 * Math.exp(-t * 1.15));
        const raw = nVal * env * 0.145;
        // Progressively warmer absorption over time like stone/wood concert hall walls
        const coeff = Math.max(0.06, 0.34 - 0.24 * (i / n));
        lp1 += (raw - lp1) * coeff;
        lp2 += (lp1 - lp2) * (coeff * 0.85);
        hp += (lp2 - hp) * 0.008;
        d[i] = i < rate * 0.016 ? 0 : lp2 - hp;
      }
      // Asymmetric stereo hall early reflections
      const taps = channel === 0
        ? [[0.017, 0.24], [0.029, 0.19], [0.044, 0.15], [0.063, 0.11], [0.089, 0.075]]
        : [[0.021, 0.23], [0.035, 0.18], [0.051, 0.14], [0.071, 0.10], [0.098, 0.07]];
      for (const [time, level] of taps) {
        const idx = Math.floor(time * rate);
        if (idx < n) d[idx] += level;
      }
    }
    return b;
  }
  makeBuffer(context, rate, seconds, fn) {
    const length = Math.max(1, Math.ceil(rate * seconds));
    const buffer = context.createBuffer(1, length, rate);
    const data = buffer.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const edge = Math.min(1, i / 18, (length - 1 - i) / 96);
      const v = fn(t, i, length, rate) * edge;
      data[i] = Number.isFinite(v) ? v : 0;
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
    if (peak > 0.94) {
      const scale = 0.91 / peak;
      for (let i = 0; i < length; i++) data[i] *= scale;
    }
    return buffer;
  }
  synthDrum(context, rate, kind) {
    const dt = 1 / rate;
    if (kind === 'kick') {
      let phase = 0,
        subPhase = 0,
        clickLp = 0;
      return this.makeBuffer(context, rate, 0.36, (t, i) => {
        const freq = 48 + 145 * Math.exp(-t * 38) + 26 * Math.exp(-t * 14);
        phase += Math.PI * 2 * freq * dt;
        subPhase += Math.PI * 2 * 49 * dt;
        const body = Math.sin(phase) * Math.exp(-t * 8.2) * 0.86;
        const sub = Math.sin(subPhase) * Math.exp(-t * 6.5) * 0.32;
        const rawClick = this.noise(i, 3) * Math.exp(-t * 175);
        clickLp += (rawClick - clickLp) * 0.28;
        const beater = Math.sin(Math.PI * 2 * 1350 * t) * Math.exp(-t * 140) * 0.2 + clickLp * 0.3;
        return Math.tanh((body + sub + beater) * 1.42) * 0.88;
      });
    }
    if (kind === 'snare') {
      let p1 = 0,
        p2 = 0,
        lp = 0,
        hp = 0;
      return this.makeBuffer(context, rate, 0.3, (t, i) => {
        const f1 = 168 + 95 * Math.exp(-t * 42);
        const f2 = 258 + 130 * Math.exp(-t * 48);
        p1 += Math.PI * 2 * f1 * dt;
        p2 += Math.PI * 2 * f2 * dt;
        const shell = (Math.sin(p1) * 0.65 + Math.sin(p2) * 0.35) * Math.exp(-t * 23) * 0.4;
        const rim = Math.sin(Math.PI * 2 * 1180 * t) * Math.exp(-t * 165) * 0.2;
        const raw = this.noise(i, 7);
        lp += (raw - lp) * 0.48;
        hp += (lp - hp) * 0.08;
        const wires = (lp - hp) * (0.64 * Math.exp(-t * 14) + 0.22 * Math.exp(-t * 6.0));
        return Math.tanh((shell + rim + wires) * 1.38) * 0.86;
      });
    }
    if (kind === 'hat' || kind === 'openhat') {
      const dur = kind === 'openhat' ? 0.38 : 0.09;
      const decay = kind === 'openhat' ? 8.2 : 46;
      let hp1 = 0,
        hp2 = 0;
      return this.makeBuffer(context, rate, dur, (t, i) => {
        const raw = this.metallic(t, 415, 1.46) * 0.56 + this.noise(i, 11) * 0.62;
        hp1 += (raw - hp1) * 0.24;
        const s1 = raw - hp1;
        hp2 += (s1 - hp2) * 0.28;
        const sizzle = s1 - hp2;
        const ping = Math.sin(Math.PI * 2 * 6420 * t) * Math.exp(-t * 85) * 0.07;
        return (sizzle * Math.exp(-t * decay) + ping) * 0.7;
      });
    }
    if (kind === 'tom') {
      let phase = 0;
      return this.makeBuffer(context, rate, 0.32, (t, i) => {
        const freq = 88 + 94 * Math.exp(-t * 22);
        phase += Math.PI * 2 * freq * dt;
        const body = (Math.sin(phase) + 0.2 * Math.sin(phase * 2)) * Math.exp(-t * 9.8);
        const attack = this.noise(i, 15) * Math.exp(-t * 120) * 0.22;
        return Math.tanh((body * 0.8 + attack) * 1.3) * 0.84;
      });
    }
    if (kind === 'clap') {
      let bp = 0,
        lp = 0;
      return this.makeBuffer(context, rate, 0.25, (t, i) => {
        const raw = this.noise(i, 19);
        lp += (raw - lp) * 0.34;
        bp += (lp - bp) * 0.09;
        const filtered = lp - bp;
        const bursts =
          (t < 0.009 ? Math.exp(-t * 220) : 0) +
          (t >= 0.009 && t < 0.019 ? Math.exp(-(t - 0.009) * 210) * 0.92 : 0) +
          (t >= 0.019 && t < 0.03 ? Math.exp(-(t - 0.019) * 195) * 0.86 : 0) +
          (t >= 0.03 ? Math.exp(-(t - 0.03) * 15) * 0.6 : 0);
        return Math.tanh(filtered * bursts * 2.0) * 0.78;
      });
    }
    let hp = 0;
    return this.makeBuffer(context, rate, 0.86, (t, i) => {
      const raw = this.metallic(t, 338, 1.52) * 0.62 + this.noise(i, 23) * 0.55;
      hp += (raw - hp) * 0.16;
      const shimmer = (raw - hp) * (0.72 * Math.exp(-t * 3.8) + 0.26 * Math.exp(-t * 1.9));
      return Math.tanh(shimmer * 1.22) * 0.7;
    });
  }
  synthInstrument(context, rate, kind, midi, duration) {
    const freq = this.mtof(midi);
    const dt = 1 / rate;
    let p1 = 0,
      p2 = 0,
      p3 = 0,
      p4 = 0,
      p5 = 0,
      ic1 = 0,
      ic2 = 0,
      cabLp = 0,
      cabHp = 0;
    const svf = (input, cutoff, q = 1.1) => {
      const fc = Math.max(40, Math.min(rate * 0.44, cutoff));
      const g = Math.tan((Math.PI * fc) / rate);
      const k = 1 / Math.max(0.5, q);
      const a1 = 1 / (1 + g * (g + k));
      const a2 = g * a1;
      const a3 = g * a2;
      const v3 = input - ic2;
      const v1 = a1 * ic1 + a2 * v3;
      const v2 = ic2 + a2 * ic1 + a3 * v3;
      ic1 = 2 * v1 - ic1;
      ic2 = 2 * v2 - ic2;
      return v2;
    };
    return this.makeBuffer(context, rate, duration, (t, i) => {
      const attack = Math.min(1, t / (kind === 'pad' ? 0.045 : kind === 'brass' ? 0.018 : 0.005));
      const release = Math.exp(-t * (kind === 'pad' ? 1.9 : kind === 'bass' ? 5.0 : kind === 'keys' ? 4.5 : 3.4));
      const env = attack * release;

      if (kind === 'bass') {
        p1 += Math.PI * 2 * freq * dt;
        p2 += Math.PI * 2 * (freq * 0.5) * dt;
        p3 += Math.PI * 2 * (freq * 2.0) * dt;
        const saw = ((p1 / (Math.PI * 2)) % 1) * 2 - 1;
        const sub = Math.sin(p2) * 0.64;
        const fm = Math.sin(p1 + Math.sin(p3) * (1.95 * Math.exp(-t * 18))) * 0.65;
        const click = this.noise(i, 29) * Math.exp(-t * 140) * 0.14;
        const filtered = svf(saw * 0.42 + fm + sub + click, 210 + 1950 * Math.exp(-t * 16), 1.45);
        return Math.tanh(filtered * 1.42) * env * 0.84;
      }
      if (kind === 'guitar') {
        const vib = t > 0.09 ? Math.sin(Math.PI * 2 * 5.6 * (t - 0.09)) * 0.0035 * Math.min(1, (t - 0.09) * 8) : 0;
        const f = freq * (1 + vib);
        p1 += Math.PI * 2 * f * dt;
        p2 += Math.PI * 2 * (f * 1.0032) * dt;
        p3 += Math.PI * 2 * (f * 0.997) * dt;
        const s1 = ((p1 / (Math.PI * 2)) % 1) * 2 - 1;
        const s2 = Math.sin(p2) >= 0 ? 0.7 : -0.7;
        const s3 = Math.sin(p3 + Math.sin(p1 * 2) * (1.25 * Math.exp(-t * 9)));
        const pick = (this.noise(i, 31) * 0.45 + Math.sin(p1 * 4) * 0.45) * Math.exp(-t * 120) * 0.35;
        const driven = Math.tanh((s1 * 0.44 + s2 * 0.25 + s3 * 0.52 + pick) * 2.1);
        const body = svf(driven, 1400 + 2100 * Math.exp(-t * 7.8), 1.25);
        cabLp += (body - cabLp) * 0.42;
        cabHp += (cabLp - cabHp) * 0.015;
        return (cabLp - cabHp) * env * 0.78;
      }
      if (kind === 'lead') {
        const vib = t > 0.08 ? Math.sin(Math.PI * 2 * 5.8 * (t - 0.08)) * 0.0038 * Math.min(1, (t - 0.08) * 9) : 0;
        const f = freq * (1 + vib);
        p1 += Math.PI * 2 * f * dt;
        p2 += Math.PI * 2 * (f * 1.0052) * dt;
        p3 += Math.PI * 2 * (f * 0.9948) * dt;
        const saw1 = ((p1 / (Math.PI * 2)) % 1) * 2 - 1;
        const saw2 = ((p2 / (Math.PI * 2)) % 1) * 2 - 1;
        const pulse = Math.sin(p3) > 0.15 ? 0.75 : -0.75;
        const mix = saw1 * 0.4 + saw2 * 0.36 + pulse * 0.32;
        const filtered = svf(mix, 1550 + 2950 * Math.exp(-t * 9.5), 1.3);
        return Math.tanh(filtered * 1.3) * env * 0.74;
      }
      if (kind === 'keys') {
        p1 += Math.PI * 2 * freq * dt;
        p2 += Math.PI * 2 * (freq * 1.002) * dt;
        p3 += Math.PI * 2 * (freq * 7.0) * dt;
        p4 += Math.PI * 2 * (freq * 14.0) * dt;
        const tine = Math.sin(p1 + Math.sin(p3) * (1.15 * Math.exp(-t * 24)) + Math.sin(p4) * (0.38 * Math.exp(-t * 55)));
        const warm = Math.sin(p2 + Math.sin(p1 * 2) * (0.62 * Math.exp(-t * 8.5)));
        return Math.tanh((tine * 0.44 + warm * 0.62) * 1.18) * env * 0.75;
      }
      if (kind === 'brass') {
        const scoop = 1 - 0.016 * Math.exp(-t * 58);
        const f = freq * scoop;
        p1 += Math.PI * 2 * f * dt;
        p2 += Math.PI * 2 * (f * 1.0042) * dt;
        p3 += Math.PI * 2 * (f * 0.9958) * dt;
        const s1 = ((p1 / (Math.PI * 2)) % 1) * 2 - 1;
        const s2 = ((p2 / (Math.PI * 2)) % 1) * 2 - 1;
        const s3 = ((p3 / (Math.PI * 2)) % 1) * 2 - 1;
        const swell = Math.min(1, t / 0.036) * Math.exp(-t * 3.6);
        const filtered = svf((s1 + s2 + s3) * 0.36, 520 + 2350 * swell, 1.2);
        return Math.tanh(filtered * 1.34) * env * 0.76;
      }
      if (kind === 'pad') {
        p1 += Math.PI * 2 * (freq * 0.993) * dt;
        p2 += Math.PI * 2 * (freq * 0.997) * dt;
        p3 += Math.PI * 2 * freq * dt;
        p4 += Math.PI * 2 * (freq * 1.004) * dt;
        p5 += Math.PI * 2 * (freq * 1.008) * dt;
        const ens =
          (((p1 / (Math.PI * 2)) % 1) * 2 - 1) * 0.2 +
          Math.sin(p2) * 0.28 +
          (((p3 / (Math.PI * 2)) % 1) * 2 - 1) * 0.22 +
          Math.sin(p4 * 2) * 0.15 +
          (((p5 / (Math.PI * 2)) % 1) * 2 - 1) * 0.2;
        const cutoff = 1280 + 380 * Math.sin(Math.PI * 2 * 1.8 * t);
        return svf(ens, cutoff, 0.9) * env * 0.68;
      }
      p1 += Math.PI * 2 * freq * dt;
      p2 += Math.PI * 2 * (freq * 3.5) * dt;
      p3 += Math.PI * 2 * (freq * 5.02) * dt;
      const bell =
        Math.sin(p1 + Math.sin(p2) * (1.6 * Math.exp(-t * 15))) * 0.68 +
        Math.sin(p1 * 2 + Math.sin(p3) * (0.95 * Math.exp(-t * 24))) * 0.32;
      return bell * Math.exp(-t * 5.6) * 0.74;
    });
  }
  makeBiquad(rate, type, freq, q = 1.0, gainDb = 0) {
    const fc = Math.max(25, Math.min(rate * 0.45, freq));
    const w0 = (2 * Math.PI * fc) / rate;
    const c = Math.cos(w0),
      s = Math.sin(w0);
    const alpha = s / (2 * Math.max(0.15, q));
    const A = Math.pow(10, gainDb / 40);
    let b0, b1, b2, a0, a1, a2;
    if (type === 'lp') {
      b0 = (1 - c) / 2;
      b1 = 1 - c;
      b2 = b0;
      a0 = 1 + alpha;
      a1 = -2 * c;
      a2 = 1 - alpha;
    } else if (type === 'bp') {
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
      a0 = 1 + alpha;
      a1 = -2 * c;
      a2 = 1 - alpha;
    } else {
      b0 = 1 + alpha * A;
      b1 = -2 * c;
      b2 = 1 - alpha * A;
      a0 = 1 + alpha / A;
      a1 = -2 * c;
      a2 = 1 - alpha / A;
    }
    const nb0 = b0 / a0,
      nb1 = b1 / a0,
      nb2 = b2 / a0,
      na1 = a1 / a0,
      na2 = a2 / a0;
    let x1 = 0,
      x2 = 0,
      y1 = 0,
      y2 = 0;
    return (x) => {
      const y = nb0 * x + nb1 * x1 + nb2 * x2 - na1 * y1 - na2 * y2;
      x2 = x1;
      x1 = x;
      y2 = y1;
      y1 = y;
      return y;
    };
  }
  buildHarmonicTable(rate, freq, maxH, ampFn, phaseFn = null) {
    const N = 2048;
    const tbl = new Float32Array(N);
    const limit = Math.min(maxH, Math.floor((rate * 0.43) / Math.max(20, freq)));
    const twoPiOverN = (Math.PI * 2) / N;
    for (let k = 1; k <= limit; k++) {
      const w = ampFn(k);
      if (Math.abs(w) < 1e-4) continue;
      const ph = phaseFn ? phaseFn(k) : (k * 0.6180339887) % (Math.PI * 2);
      const step = twoPiOverN * k;
      for (let i = 0; i < N; i++) {
        tbl[i] += w * Math.sin(step * i + ph);
      }
    }
    let pk = 0;
    for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(tbl[i]));
    if (pk > 1e-6) {
      const s = 1 / pk;
      for (let i = 0; i < N; i++) tbl[i] *= s;
    }
    return tbl;
  }
  synthOrchestra(context, rate, kind, midi, duration) {
    const freq = this.mtof(midi);
    const dt = 1 / rate;
    const N = 2048;
    const mask = N - 1;
    const readTbl = (tbl, ph01) => {
      const x = (ph01 - Math.floor(ph01)) * N;
      const i0 = x & mask;
      const f = x - i0;
      return tbl[i0] + (tbl[(i0 + 1) & mask] - tbl[i0]) * f;
    };

    // Modal complex-phasor acoustic instruments: piano, harp, acguitar, chimes
    if (kind === 'piano' || kind === 'harp' || kind === 'acguitar' || kind === 'chimes') {
      const freqs = [],
        ratios = [],
        amps = [],
        decs = [];
      if (kind === 'piano') {
        const reg = Math.max(0, Math.min(1, (midi - 36) / 48));
        const B = 0.00011 * Math.pow(1.07, midi - 36);
        const count = Math.min(14, Math.floor((rate * 0.41) / freq));
        for (let k = 1; k <= count; k++) {
          const fk = k * freq * Math.sqrt(1 + B * k * k);
          if (fk >= rate * 0.43) break;
          // Hammer contact spectral notch around k=7 + warm body rolloff
          const contact = Math.abs(Math.sin(k * Math.PI * 0.138));
          const roll = Math.pow(k, -(0.95 + reg * 0.35));
          const amp = (k === 1 ? 1.0 : roll * (0.55 + 0.55 * contact)) * (1 / (1 + 0.04 * k * reg));
          freqs.push(fk);
          amps.push(amp);
          decs.push(0.55 + reg * 0.85 + Math.pow(k, 1.18) * (0.26 + reg * 0.28));
          // Slight 2nd unison detuned string on fundamentals 1..5 for singing piano shimmer
          if (k <= 4 && k >= 1) {
            freqs.push(fk * (k % 2 ? 1.00072 : 0.99935));
            amps.push(amp * 0.58);
            decs.push(0.58 + reg * 0.85 + Math.pow(k, 1.18) * (0.28 + reg * 0.28));
          }
        }
      } else if (kind === 'harp') {
        const count = Math.min(12, Math.floor((rate * 0.42) / freq));
        for (let k = 1; k <= count; k++) {
          const fk = k * freq;
          freqs.push(fk);
          amps.push(Math.pow(k, -1.55) * (k === 1 ? 1.0 : 0.85 + 0.25 * Math.cos(k * 0.9)));
          decs.push(0.85 + Math.pow(k, 1.25) * 0.72);
        }
      } else if (kind === 'acguitar') {
        const count = Math.min(11, Math.floor((rate * 0.42) / freq));
        for (let k = 1; k <= count; k++) {
          const fk = k * freq * (1 + 0.00025 * k * k);
          freqs.push(fk);
          amps.push(Math.pow(k, -1.32) * (k === 2 ? 0.92 : 1.0) * Math.abs(Math.sin(k * Math.PI * 0.18)));
          decs.push(1.15 + Math.pow(k, 1.18) * 0.58);
        }
      } else {
        // Cathedral Tubular Chimes: classic bell/chime mode ratios with hum & strike octave
        const mRatios = [0.5, 1.0, 1.202, 1.504, 2.0, 2.495, 3.01];
        const mAmps = [0.42, 1.0, 0.48, 0.52, 0.46, 0.24, 0.16];
        const mDecs = [0.55, 0.68, 1.25, 1.05, 1.65, 2.5, 3.4];
        for (let j = 0; j < mRatios.length; j++) {
          const fk = freq * mRatios[j];
          if (fk >= rate * 0.43) continue;
          freqs.push(fk);
          amps.push(mAmps[j]);
          decs.push(mDecs[j]);
        }
      }

      const m = freqs.length;
      const re = new Float64Array(m),
        im = new Float64Array(m),
        cs = new Float64Array(m),
        sn = new Float64Array(m),
        dc = new Float64Array(m);
      for (let j = 0; j < m; j++) {
        const w = (Math.PI * 2 * freqs[j]) * dt;
        const ph = (j * 1.17) % (Math.PI * 2);
        re[j] = amps[j] * Math.cos(ph);
        im[j] = amps[j] * Math.sin(ph);
        cs[j] = Math.cos(w);
        sn[j] = Math.sin(w);
        dc[j] = Math.exp(-decs[j] * dt);
      }

      const body1 = this.makeBiquad(rate, 'pk', kind === 'piano' ? 145 : kind === 'harp' ? 165 : kind === 'acguitar' ? 115 : 220, 1.4, 4.2);
      const body2 = this.makeBiquad(rate, 'pk', kind === 'piano' ? 380 : kind === 'harp' ? 340 : kind === 'acguitar' ? 235 : 880, 1.2, 3.0);
      const warmLp = this.makeBiquad(rate, 'lp', kind === 'piano' ? 5200 : kind === 'chimes' ? 6200 : 3800, 0.72);
      let hammerLp = 0;
      const atkSec = kind === 'piano' ? 0.004 : kind === 'chimes' ? 0.003 : 0.009;

      return this.makeBuffer(context, rate, duration, (t, i) => {
        let sum = 0;
        for (let j = 0; j < m; j++) {
          const r = re[j],
            iv = im[j],
            c = cs[j],
            s = sn[j],
            d = dc[j];
          const nr = (r * c - iv * s) * d;
          const ni = (r * s + iv * c) * d;
          re[j] = nr;
          im[j] = ni;
          sum += nr;
        }
        // Soft acoustic hammer / finger-pluck transient
        const rawN = this.noise(i, midi + 71);
        hammerLp += (rawN - hammerLp) * (kind === 'piano' ? 0.09 : 0.16);
        const knock = hammerLp * Math.exp(-t * (kind === 'piano' ? 95 : 140)) * (kind === 'chimes' ? 0.45 : 0.22);
        const atk = Math.min(1, t / atkSec);
        const tailFade = Math.min(1, (duration - t) / 0.14);
        const shaped = warmLp(body2(body1(sum * 0.38 + knock)));
        return Math.tanh(shaped * 1.15) * atk * tailFade * 0.86;
      });
    }

    // Ensemble & Bowed/Wind/Choir Acoustic Instruments:
    // strings, lowStrings, spiccato, horn, trumpet, lowBrass, choir, organ, wind
    let players = 1;
    let detunes = [0];
    let onsets = [0];
    let vibRates = [5.1];
    let vibPhases = [0.2];
    let subTbl = null;

    const tblWarm = this.buildHarmonicTable(
      rate,
      freq,
      kind === 'wind' ? 4 : kind === 'choir' ? 24 : 20,
      (k) => {
        if (kind === 'wind') return k === 1 ? 1.0 : k === 2 ? 0.26 : k === 3 ? 0.09 : 0.03;
        if (kind === 'organ') {
          // Great Cathedral Organ: 8' Principal + 4' Octave + faint 2-2/3' Nazard + 2' Fifteenth
          const w = k === 1 ? 0.95 : k === 2 ? 0.72 : k === 3 ? 0.34 : k === 4 ? 0.42 : k === 6 ? 0.2 : Math.pow(k, -1.65) * 0.65;
          return w;
        }
        if (kind === 'choir') {
          // Rosenberg glottal harmonic rolloff: rich vocal harmonics for formant filtering
          return Math.pow(k, -1.08) * (1 + 0.15 * Math.cos(k * 0.45));
        }
        if (kind === 'horn' || kind === 'lowBrass') {
          return k === 1 ? 1.0 : Math.pow(k, -1.52) * (k <= 4 ? 1.15 : 0.8);
        }
        if (kind === 'trumpet') return Math.pow(k, -1.25);
        // Bowed strings Helmholtz spectrum with soft fingerboard rolloff
        return Math.pow(k, -1.24) * (1 + 0.22 * Math.cos(k * 0.65));
      }
    );

    const tblBright = this.buildHarmonicTable(
      rate,
      freq,
      kind === 'wind' ? 6 : 22,
      (k) => {
        if (kind === 'horn' || kind === 'lowBrass') return Math.pow(k, -1.22) * (k <= 6 ? 1.15 : 0.85);
        if (kind === 'trumpet') return Math.pow(k, -1.16) * (k <= 5 ? 1.12 : 0.82);
        if (kind === 'organ') return Math.pow(k, -1.28);
        return Math.pow(k, -1.06) * (1 + 0.16 * Math.cos(k * 0.5));
      }
    );

    if (kind === 'strings' || kind === 'lowStrings') {
      players = 6;
      detunes = [-11.5, -5.8, -1.9, +2.1, +6.3, +12.2];
      onsets = kind === 'strings' ? [0.025, 0.055, 0.085, 0.04, 0.105, 0.072] : [0.04, 0.08, 0.115, 0.055, 0.135, 0.09];
      vibRates = [4.75, 5.12, 5.45, 4.92, 5.68, 5.28];
      vibPhases = [0.1, 1.3, 2.7, 3.9, 5.1, 0.8];
    } else if (kind === 'spiccato') {
      players = 4;
      detunes = [-8, -2.4, +2.8, +8.5];
      onsets = [0, 0.005, 0.011, 0.003];
      vibRates = [0, 0, 0, 0];
    } else if (kind === 'horn') {
      players = 4;
      detunes = [-6.2, -1.8, +2.2, +6.8];
      onsets = [0.022, 0.045, 0.064, 0.034];
      vibRates = [4.4, 4.7, 4.9, 4.55];
      vibPhases = [0.4, 1.8, 3.2, 4.6];
    } else if (kind === 'trumpet') {
      players = 3;
      detunes = [-4.4, +0.4, +4.6];
      onsets = [0.012, 0.021, 0.016];
      vibRates = [4.95, 5.25, 5.4];
      vibPhases = [0.2, 2.5, 4.7];
    } else if (kind === 'lowBrass') {
      players = 4;
      detunes = [-7.5, -2.0, +2.4, +7.2];
      onsets = [0.024, 0.052, 0.036, 0.068];
      vibRates = [4.1, 4.35, 4.2, 4.5];
      vibPhases = [0.1, 2.1, 4.2, 5.4];
    } else if (kind === 'choir') {
      players = 7;
      detunes = [-11.5, -6.5, -2.4, 0.2, +2.6, +6.8, +11.8];
      onsets = [0.065, 0.105, 0.145, 0.085, 0.175, 0.125, 0.155];
      vibRates = [4.82, 5.15, 5.42, 4.96, 5.58, 5.26, 5.04];
      vibPhases = [0.5, 1.9, 3.3, 4.5, 5.7, 1.1, 2.6];
    } else if (kind === 'organ') {
      players = 3; // 8'+4' rank + subtle cathedral chorus rank + 16' sub-rank
      detunes = [0, +3.2, -1200]; // -1200 cents = 1 octave subbass!
      onsets = [0.008, 0.014, 0.018];
      vibRates = [4.8, 5.0, 0];
      subTbl = this.buildHarmonicTable(rate, freq * 0.5, 8, (k) => (k === 1 ? 1.0 : k === 2 ? 0.55 : k === 3 ? 0.25 : 0.08));
    }

    const pPh = new Float64Array(players);
    const pMult = detunes.map((c) => Math.pow(2, c / 1200));

    // Formants / Body acoustic EQ per instrument
    let f1, f2, f3, f4, fLp;
    if (kind === 'strings' || kind === 'spiccato') {
      f1 = this.makeBiquad(rate, 'pk', 255, 2.0, 5.5); // A0 Helmholtz cavity
      f2 = this.makeBiquad(rate, 'pk', 480, 2.2, 4.2); // Wood B1- / B1+
      f3 = this.makeBiquad(rate, 'pk', 2100, 1.5, 1.8); // Silk bridge clarity
      fLp = this.makeBiquad(rate, 'lp', kind === 'spiccato' ? 4900 : 3950, 0.72);
    } else if (kind === 'lowStrings') {
      f1 = this.makeBiquad(rate, 'pk', 112, 2.1, 6.0); // Cello A0
      f2 = this.makeBiquad(rate, 'pk', 215, 2.2, 4.5); // Cello wood belly
      f3 = this.makeBiquad(rate, 'pk', 1020, 1.6, 2.5);
      fLp = this.makeBiquad(rate, 'lp', 2850, 0.72);
    } else if (kind === 'choir') {
      const low = midi < 54,
        high = midi >= 65;
      const v1 = low ? 345 : high ? 690 : 485;
      const v2 = low ? 740 : high ? 1120 : 900;
      const v3 = low ? 2260 : high ? 2540 : 2380;
      f1 = this.makeBiquad(rate, 'bp', v1, 4.8);
      f2 = this.makeBiquad(rate, 'bp', v2, 5.8);
      f3 = this.makeBiquad(rate, 'bp', v3, 7.2);
      fLp = this.makeBiquad(rate, 'lp', 3100, 0.72);
    } else if (kind === 'horn' || kind === 'lowBrass') {
      f1 = this.makeBiquad(rate, 'pk', kind === 'horn' ? 310 : 170, 1.5, 5.2);
      f2 = this.makeBiquad(rate, 'pk', kind === 'horn' ? 740 : 410, 1.5, 3.4);
      fLp = this.makeBiquad(rate, 'lp', kind === 'horn' ? 2450 : 1900, 0.75);
    } else if (kind === 'trumpet') {
      f1 = this.makeBiquad(rate, 'pk', 560, 1.4, 4.0);
      f2 = this.makeBiquad(rate, 'pk', 1320, 1.6, 2.8);
      fLp = this.makeBiquad(rate, 'lp', 3450, 0.72);
    } else if (kind === 'organ') {
      f1 = this.makeBiquad(rate, 'pk', 240, 1.2, 3.5);
      f2 = this.makeBiquad(rate, 'pk', 1100, 1.1, 2.2);
      fLp = this.makeBiquad(rate, 'lp', 4200, 0.72);
    } else {
      // wind (Flute / Shakuhachi)
      f1 = this.makeBiquad(rate, 'pk', 680, 1.5, 3.0);
      f2 = this.makeBiquad(rate, 'pk', 1650, 1.4, 1.8);
      fLp = this.makeBiquad(rate, 'lp', 3600, 0.7);
    }

    let nLp = 0,
      nHp = 0,
      subPh = 0;

    return this.makeBuffer(context, rate, duration, (t, i) => {
      // Smooth sustained contour + natural fade before buffer edge
      let globalEnv = 1;
      if (kind === 'spiccato') {
        globalEnv = Math.min(1, t / 0.011) * Math.exp(-t * 9.2);
      } else {
        const atkT = kind === 'trumpet' ? 0.022 : kind === 'wind' ? 0.055 : kind === 'organ' ? 0.028 : kind === 'horn' ? 0.065 : kind === 'choir' ? 0.16 : 0.11;
        const atk = Math.min(1, t / atkT);
        const swell = atk * atk * (3 - 2 * atk);
        const gentleSustain = kind === 'organ' ? 1 : 0.84 + 0.16 * Math.exp(-t * 0.7);
        const endFade = Math.min(1, (duration - t) / 0.22);
        globalEnv = swell * gentleSustain * endFade;
      }

      // Brightness morph curve: brass flares up on attack/bloom, strings bite cleanly on bow start
      let flare = 0.25;
      if (kind === 'horn' || kind === 'trumpet' || kind === 'lowBrass') {
        const bloom = Math.min(1, t / (kind === 'trumpet' ? 0.08 : 0.22));
        flare = Math.min(1, bloom * (0.55 + 0.45 * Math.exp(-t * 0.65)));
      } else if (kind === 'strings' || kind === 'lowStrings' || kind === 'spiccato') {
        flare = 0.25 + 0.65 * Math.exp(-t * 5.2);
      }

      // Embouchure scoop on horn/trumpet/wind onset
      const pitchScoop =
        kind === 'wind'
          ? 1 - 0.014 * Math.exp(-t * 48)
          : kind === 'trumpet' || kind === 'horn'
            ? 1 - 0.011 * Math.exp(-t * 68)
            : 1;

      let raw = 0;
      for (let p = 0; p < players; p++) {
        const pt = Math.max(0, t - onsets[p]);
        const pEnv = onsets[p] > 0 ? Math.min(1, pt / (kind === 'choir' ? 0.14 : 0.065)) : 1;
        const vibDelay = kind === 'organ' || kind === 'spiccato' ? 0 : Math.min(1, Math.max(0, (pt - 0.16) / 0.24));
        const vibDepth = kind === 'choir' ? 0.0055 : kind === 'wind' ? 0.0062 : kind === 'trumpet' ? 0.0032 : 0.0048;
        const vib = vibDelay > 0 ? 1 + Math.sin(Math.PI * 2 * vibRates[p] * pt + vibPhases[p]) * vibDepth * vibDelay : 1;
        const f = freq * pMult[p] * pitchScoop * vib;
        pPh[p] += f * dt;
        const tbl = kind === 'organ' && p === 2 ? subTbl : tblWarm;
        const valWarm = readTbl(tbl, pPh[p]);
        const val = flare > 0.01 && !(kind === 'organ' && p === 2)
          ? valWarm * (1 - flare) + readTbl(tblBright, pPh[p]) * flare
          : valWarm;
        raw += val * pEnv;
      }
      raw /= players;

      // Contrabass sub-octave foundation under Cello lowStrings (below D3)
      if (kind === 'lowStrings' && midi < 50) {
        subPh += freq * 0.5 * dt;
        raw = raw * 0.72 + readTbl(tblWarm, subPh) * 0.42;
      }

      // Acoustic attack noise: bow rosin, breath chiff, lip air, pipe chiff
      const nVal = this.noise(i, midi + 19);
      nLp += (nVal - nLp) * (kind === 'wind' ? 0.22 : 0.36);
      nHp += (nLp - nHp) * 0.08;
      const bpNoise = nLp - nHp;
      let exc = 0;
      if (kind === 'wind') exc = bpNoise * (0.28 * Math.exp(-t * 16) + 0.085);
      else if (kind === 'choir') exc = bpNoise * (0.14 * Math.exp(-t * 8) + 0.032);
      else if (kind === 'organ') exc = bpNoise * 0.16 * Math.exp(-t * 48);
      else if (kind === 'strings' || kind === 'lowStrings' || kind === 'spiccato') {
        exc = bpNoise * 0.14 * Math.exp(-t * (kind === 'spiccato' ? 65 : 18));
      } else {
        exc = bpNoise * 0.11 * Math.exp(-t * 45);
      }

      const mix = raw + exc;
      let out;
      if (kind === 'choir') {
        // Sum 3 parallel vocal tract formant bandpass resonators!
        out = f1(mix) * 1.45 + f2(mix) * 0.85 + f3(mix) * 0.35;
        out = fLp(out);
      } else if (kind === 'horn' || kind === 'lowBrass' || kind === 'trumpet' || kind === 'wind') {
        out = fLp(f2(f1(mix)));
        if (kind === 'lowBrass') out = Math.tanh(out * 1.35) * 0.88;
      } else if (kind === 'organ') {
        // Gentle cathedral tremulant
        const trem = 1 + 0.015 * Math.sin(Math.PI * 2 * 4.8 * t);
        out = fLp(f2(f1(mix))) * trem;
      } else {
        out = fLp(f3(f2(f1(mix))));
      }
      return Math.tanh(out * 1.08) * globalEnv * 0.88;
    });
  }
  synthOrchPerc(context, rate, kind, midi = 42) {
    const dt = 1 / rate;
    if (kind === 'timpani') {
      const f0 = this.mtof(midi);
      // Tuned copper kettle drum circular membrane modes (normalized so fundamental + fifth sing clearly)
      const modes = [1.0, 1.504, 1.985, 2.29, 2.66];
      const weights = [1.0, 0.52, 0.24, 0.14, 0.08];
      const decs = [1.85, 3.2, 5.4, 7.6, 9.8];
      const re = new Float64Array(modes.length),
        im = new Float64Array(modes.length),
        cs = new Float64Array(modes.length),
        sn = new Float64Array(modes.length),
        dc = new Float64Array(modes.length);
      for (let j = 0; j < modes.length; j++) {
        const w = Math.PI * 2 * (f0 * modes[j]) * dt;
        re[j] = weights[j];
        cs[j] = Math.cos(w);
        sn[j] = Math.sin(w);
        dc[j] = Math.exp(-decs[j] * dt);
      }
      const lp = this.makeBiquad(rate, 'lp', 650, 0.85);
      let malletP = 0;
      return this.makeBuffer(context, rate, 1.9, (t, i) => {
        let sum = 0;
        for (let j = 0; j < modes.length; j++) {
          const nr = (re[j] * cs[j] - im[j] * sn[j]) * dc[j];
          const ni = (re[j] * sn[j] + im[j] * cs[j]) * dc[j];
          re[j] = nr;
          im[j] = ni;
          sum += nr;
        }
        malletP += Math.PI * 2 * (f0 * (1 + 1.1 * Math.exp(-t * 48))) * dt;
        const feltThump = Math.sin(malletP) * Math.exp(-t * 28) * 0.45;
        const skinNoise = this.noise(i, midi + 31) * Math.exp(-t * 55) * 0.22;
        const atk = Math.min(1, t / 0.008);
        return Math.tanh(lp(sum * 0.62 + feltThump + skinNoise) * 1.45) * atk * 0.9;
      });
    }
    if (kind === 'grancassa' || kind === 'taiko') {
      const isTaiko = kind === 'taiko';
      const dur = isTaiko ? 1.15 : 1.75;
      const baseHz = isTaiko ? 58 : 40;
      const pitchSweep = isTaiko ? 125 : 88;
      let p1 = 0,
        p2 = 0,
        lp = 0;
      return this.makeBuffer(context, rate, dur, (t, i) => {
        const f = baseHz + pitchSweep * Math.exp(-t * (isTaiko ? 32 : 22));
        p1 += Math.PI * 2 * f * dt;
        p2 += Math.PI * 2 * (f * 1.54) * dt;
        const skin = (Math.sin(p1) * 0.85 + Math.sin(p2) * 0.25) * Math.exp(-t * (isTaiko ? 4.4 : 2.9));
        const raw = this.noise(i, isTaiko ? 83 : 67);
        lp += (raw - lp) * (isTaiko ? 0.14 : 0.08);
        const beater = lp * Math.exp(-t * 36) * 0.65;
        const hall = Math.sin(p1 * 0.5) * Math.exp(-t * 2.1) * 0.28;
        const atk = Math.min(1, t / 0.006);
        return Math.tanh((skin + beater + hall) * 1.45) * atk * 0.92;
      });
    }
    if (kind === 'orchsnare' || kind === 'orchsnare_soft') {
      const soft = kind === 'orchsnare_soft';
      let p1 = 0,
        p2 = 0,
        bp = this.makeBiquad(rate, 'bp', 2400, 0.9);
      return this.makeBuffer(context, rate, soft ? 0.34 : 0.52, (t, i) => {
        p1 += Math.PI * 2 * (175 + 75 * Math.exp(-t * 45)) * dt;
        p2 += Math.PI * 2 * (285 + 95 * Math.exp(-t * 48)) * dt;
        const shell = (Math.sin(p1) * 0.6 + Math.sin(p2) * 0.35) * Math.exp(-t * 22) * (soft ? 0.28 : 0.42);
        const wires = bp(this.noise(i, soft ? 109 : 103)) * (0.7 * Math.exp(-t * (soft ? 19 : 13)) + 0.25 * Math.exp(-t * 6.5));
        const atk = Math.min(1, t / 0.002);
        return Math.tanh((shell + wires * (soft ? 0.72 : 1.05)) * 1.38) * atk * (soft ? 0.68 : 0.86);
      });
    }
    // Piatti (Bronze Clash Cymbals) or Suspended Cymbal Swell
    const isSwell = kind === 'cymbal_swell';
    const dur = isSwell ? 1.55 : 2.15;
    const count = 20;
    const re = new Float64Array(count),
      im = new Float64Array(count),
      cs = new Float64Array(count),
      sn = new Float64Array(count),
      dc = new Float64Array(count);
    for (let m = 0; m < count; m++) {
      const fm = 390 * Math.pow(1.168, m) * (1 + ((m * 37) % 11) * 0.007);
      if (fm >= rate * 0.44) break;
      const w = Math.PI * 2 * fm * dt;
      re[m] = 1 / (1 + m * 0.14);
      cs[m] = Math.cos(w);
      sn[m] = Math.sin(w);
      dc[m] = Math.exp(-(2.4 + m * 0.28) * dt);
    }
    const hp = this.makeBiquad(rate, 'bp', 4400, 0.55);
    let lpS = 0;
    return this.makeBuffer(context, rate, dur, (t, i) => {
      let bronze = 0;
      for (let m = 0; m < count; m++) {
        if (!cs[m]) continue;
        const nr = (re[m] * cs[m] - im[m] * sn[m]) * dc[m];
        const ni = (re[m] * sn[m] + im[m] * cs[m]) * dc[m];
        re[m] = nr;
        im[m] = ni;
        bronze += nr;
      }
      const nVal = this.noise(i, isSwell ? 131 : 127);
      lpS += (nVal - lpS) * 0.55;
      const air = hp(lpS);
      if (isSwell) {
        const p = t / dur;
        const env = p < 0.88 ? Math.pow(p / 0.88, 2.3) : Math.exp(-(p - 0.88) * 28);
        return Math.tanh((air * 0.95 + bronze * 0.12) * env * 1.5) * 0.82;
      }
      const env = Math.min(1, t / 0.004) * (0.68 * Math.exp(-t * 2.4) + 0.32 * Math.exp(-t * 1.25));
      return Math.tanh((bronze * 0.14 + air * 0.72 * Math.exp(-t * 2.1)) * 1.32) * env * 0.85;
    });
  }
  synthImpact(context, rate, kind, variant = 0) {
    const dt = 1 / rate;
    const vScale = 1 + variant * 0.07;
    if (kind === 'punch') {
      let pWhip = 0,
        pKnuckle = 0,
        pBody = 0,
        lp = 0,
        hp = 0;
      return this.makeBuffer(context, rate, 0.24, (t, i) => {
        // Stage 1: Ultra-fast transient whip-crack (6800 -> 420 Hz)
        const fWhip = (6800 * Math.exp(-t * 310) + 420) * vScale;
        pWhip += Math.PI * 2 * fWhip * dt;
        const whip = Math.sin(pWhip + Math.sin(pWhip * 2.2) * 1.2) * Math.exp(-t * 140) * 0.72;

        // Stage 2: Knuckle bone smack (980 -> 210 Hz with tube saturation)
        const fKnuckle = (210 + 770 * Math.exp(-t * 85)) * vScale;
        pKnuckle += Math.PI * 2 * fKnuckle * dt;
        const smack = Math.sin(pKnuckle + Math.sin(pKnuckle * 1.8) * 0.8) * Math.exp(-t * 38) * 0.78;

        // Stage 3: Low-end chest thump (180 -> 52 Hz)
        const fBody = (52 + 160 * Math.exp(-t * 44)) * vScale;
        pBody += Math.PI * 2 * fBody * dt;
        const chest = Math.sin(pBody + 0.3 * Math.sin(pBody * 2)) * Math.exp(-t * 18) * 0.92;

        // Stage 4: High-frequency air snap & impact grit
        const raw = this.noise(i, 41 + variant * 9);
        lp += (raw - lp) * 0.68;
        hp += (lp - hp) * 0.12;
        const snapEnv = Math.exp(-t * 110) * 1.1 + (t > 0.005 ? Math.exp(-(t - 0.005) * 45) * 0.5 : 0);
        const snap = (lp - hp) * snapEnv;

        const spark = Math.sin(Math.PI * 2 * 3850 * vScale * t + raw * 1.5) * Math.exp(-t * 115) * 0.42;
        return Math.tanh((whip * 1.1 + smack * 1.0 + chest * 0.95 + snap * 0.85 + spark * 0.6) * 1.95) * 0.94;
      });
    }
    if (kind === 'heavy') {
      let pSub = 0,
        pCrunch = 0,
        pCrack = 0,
        pBite = 0,
        ic1 = 0,
        ic2 = 0;
      return this.makeBuffer(context, rate, 0.48, (t, i) => {
        // Stage 1: Blinding lightning transient crack (8200 -> 360 Hz)
        const fCrack = (8200 * Math.exp(-t * 260) + 360) * vScale;
        pCrack += Math.PI * 2 * fCrack * dt;
        const crack =
          Math.sin(pCrack + Math.sin(pCrack * 2.0) * 1.35) *
          (Math.exp(-t * 120) * 0.82 + (t > 0.010 ? Math.exp(-(t - 0.010) * 90) * 0.65 : 0));

        // Stage 2: Dual-stage hit-stop bone crunch (520 -> 110 Hz with heavy FM growl)
        const fCrunch = (110 + 520 * Math.exp(-t * 42)) * vScale;
        const fBite = (340 + 1100 * Math.exp(-t * 68)) * vScale;
        pCrunch += Math.PI * 2 * fCrunch * dt;
        pBite += Math.PI * 2 * fBite * dt;
        const crunch =
          Math.sin(pCrunch + Math.sin(pBite * 1.9) * 2.1) * Math.exp(-t * 14) * 0.88 +
          Math.sin(pBite + Math.sin(pCrunch * 2.5) * 1.6) * Math.exp(-t * 28) * 0.62;

        // Stage 3: Earth-shattering sub-bass boom (260 -> 36 Hz)
        const fSub = (36 + 224 * Math.exp(-t * 30)) * vScale;
        pSub += Math.PI * 2 * fSub * dt;
        const sub = Math.sin(pSub + Math.sin(pSub * 2) * 0.42 * Math.exp(-t * 16)) * Math.exp(-t * 7.8) * 1.05;

        // Stage 4: SVF Shockwave burst + secondary delayed explosion
        const raw = this.noise(i, 59 + variant * 13);
        const cutoff = Math.max(520, Math.min(rate * 0.43, 5600 * Math.exp(-t * 22) + 750));
        const g = Math.tan((Math.PI * cutoff) / rate);
        const k = 0.52;
        const a1 = 1 / (1 + g * (g + k));
        const a2 = g * a1;
        const a3 = g * a2;
        const v3 = raw - ic2;
        const v1 = a1 * ic1 + a2 * v3;
        const v2 = ic2 + a2 * ic1 + a3 * v3;
        ic1 = 2 * v1 - ic1;
        ic2 = 2 * v2 - ic2;

        const shockEnv = Math.exp(-t * 46) * 1.1 + (t > 0.014 ? Math.exp(-(t - 0.014) * 24) * 0.85 : 0);
        const shock = (v1 * 1.05 + (raw - v2) * 0.45) * shockEnv;

        // Stage 5: Sizzling arcade hit-sparks (3.6kHz, 5.4kHz, 7.6kHz)
        const spark =
          (Math.sin(Math.PI * 2 * 3650 * vScale * t + raw * 1.8) * 0.38 +
            Math.sin(Math.PI * 2 * 5420 * vScale * t + raw * 1.4) * 0.28 +
            Math.sin(Math.PI * 2 * 7680 * vScale * t + raw * 1.1) * 0.20) *
          (Math.exp(-t * 68) + (t > 0.014 ? Math.exp(-(t - 0.014) * 44) * 0.72 : 0));

        return Math.tanh((crack * 1.15 + crunch * 1.1 + sub * 1.0 + shock * 0.95 + spark * 0.75) * 2.15) * 0.95;
      });
    }
    if (kind === 'slash') {
      let pBody = 0,
        pEdge = 0,
        ic1 = 0,
        ic2 = 0;
      const bladeModes = [2450, 3680, 5240, 6980, 8620, 10200].map((f) => f * vScale);
      return this.makeBuffer(context, rate, 0.36, (t, i) => {
        const fEdge = (7800 * Math.exp(-t * 96) + 1650) * vScale;
        pEdge += Math.PI * 2 * fEdge * dt;
        const schwing = Math.sin(pEdge + Math.sin(pEdge * 1.7) * 1.05) * Math.exp(-t * 52) * 0.68;

        const fBody = (48 + 220 * Math.exp(-t * 36)) * vScale;
        pBody += Math.PI * 2 * fBody * dt;
        const cleave = Math.sin(pBody + Math.sin(pBody * 2.4) * 0.95 * Math.exp(-t * 24)) * Math.exp(-t * 15) * 0.84;

        const raw = this.noise(i, 77 + variant * 17);
        const cutoff = Math.max(680, Math.min(rate * 0.44, 7200 * Math.exp(-t * 18) + 820));
        const g = Math.tan((Math.PI * cutoff) / rate);
        const k = 0.45;
        const a1 = 1 / (1 + g * (g + k));
        const a2 = g * a1;
        const a3 = g * a2;
        const v3 = raw - ic2;
        const v1 = a1 * ic1 + a2 * v3;
        const v2 = ic2 + a2 * ic1 + a3 * v3;
        ic1 = 2 * v1 - ic1;
        ic2 = 2 * v2 - ic2;
        const swish =
          (v1 * 1.2 + (raw - v2) * 0.38) *
          (Math.exp(-t * 16) * 1.15 + (t > 0.007 ? Math.exp(-(t - 0.007) * 32) * 0.6 : 0));

        let steel = 0;
        const glide = 1 + 0.075 * Math.exp(-t * 32);
        for (let m = 0; m < bladeModes.length; m++) {
          const mf = bladeModes[m] * glide;
          steel +=
            Math.sin(Math.PI * 2 * mf * t + this.noise(i, m + 13) * 0.48 * Math.exp(-t * 40)) *
            Math.exp(-t * (18 + m * 4.8)) *
            (0.32 / (1 + m * 0.18));
        }

        return Math.tanh((schwing * 1.1 + cleave * 1.05 + swish * 0.95 + steel * 1.25) * 2.05) * 0.95;
      });
    }
    if (kind === 'metal') {
      let pKnock = 0,
        pPing = 0,
        ic1 = 0,
        ic2 = 0;
      const modes = [1240, 1680, 2260, 2980, 3840, 4850, 6100, 7520].map((f) => f * vScale);
      const weights = [0.26, 0.24, 0.21, 0.18, 0.16, 0.13, 0.11, 0.09];
      return this.makeBuffer(context, rate, 0.34, (t, i) => {
        const fPing = (6400 * Math.exp(-t * 220) + 1480) * vScale;
        const fKnock = (85 + 210 * Math.exp(-t * 52)) * vScale;
        pPing += Math.PI * 2 * fPing * dt;
        pKnock += Math.PI * 2 * fKnock * dt;
        const ping = Math.sin(pPing + Math.sin(pPing * 1.6) * 0.6) * Math.exp(-t * 80) * 0.58;
        const knock = Math.sin(pKnock) * Math.exp(-t * 26) * 0.64;

        const raw = this.noise(i, 91 + variant * 17);
        const cutoff = Math.max(1100, Math.min(rate * 0.44, 5800 * Math.exp(-t * 26) + 1650));
        const g = Math.tan((Math.PI * cutoff) / rate);
        const k = 0.48;
        const a1 = 1 / (1 + g * (g + k));
        const a2 = g * a1;
        const a3 = g * a2;
        const v3 = raw - ic2;
        const v1 = a1 * ic1 + a2 * v3;
        const v2 = ic2 + a2 * ic1 + a3 * v3;
        ic1 = 2 * v1 - ic1;
        ic2 = 2 * v2 - ic2;

        const strikeBurst =
          v1 * (Math.exp(-t * 62) * 1.15 + (t > 0.006 ? Math.exp(-(t - 0.006) * 44) * 0.72 : 0));
        const fmChaos =
          (Math.sin(Math.PI * 2 * 2150 * vScale * t) * 2.2 + raw * 0.95) * Math.exp(-t * 36);

        let clang = 0;
        for (let m = 0; m < modes.length; m++) {
          const damp = 17.0 + m * 4.2;
          clang +=
            Math.sin(Math.PI * 2 * modes[m] * t + fmChaos * (0.6 + m * 0.15)) *
            Math.exp(-t * damp) *
            weights[m];
        }
        return Math.tanh((ping * 1.1 + knock * 1.05 + strikeBurst * 1.0 + clang * 1.45) * 1.92) * 0.94;
      });
    }
    let pBox1 = 0,
      pBox2 = 0,
      ic1 = 0,
      ic2 = 0;
    return this.makeBuffer(context, rate, 0.30, (t, i) => {
      const f1 = (84 + 185 * Math.exp(-t * 54)) * vScale;
      const f2 = (175 + 290 * Math.exp(-t * 62)) * vScale;
      pBox1 += Math.PI * 2 * f1 * dt;
      pBox2 += Math.PI * 2 * f2 * dt;
      const boxThud = (Math.sin(pBox1) * 0.82 + Math.sin(pBox2) * 0.52) * Math.exp(-t * 32) * 0.85;

      const raw = this.noise(i, 113 + variant * 19);
      const cutoff = (2200 + 2100 * Math.exp(-t * 28)) * vScale;
      const g = Math.tan((Math.PI * Math.min(rate * 0.44, cutoff)) / rate);
      const k = 0.54;
      const a1 = 1 / (1 + g * (g + k));
      const a2 = g * a1;
      const a3 = g * a2;
      const v3 = raw - ic2;
      const v1 = a1 * ic1 + a2 * v3;
      const v2 = ic2 + a2 * ic1 + a3 * v3;
      ic1 = 2 * v1 - ic1;
      ic2 = 2 * v2 - ic2;

      const cracks =
        Math.exp(-t * 88) * 1.15 +
        (t > 0.007 ? Math.exp(-(t - 0.007) * 105) * 0.95 : 0) +
        (t > 0.018 ? Math.exp(-(t - 0.018) * 115) * 0.78 : 0) +
        (t > 0.032 ? Math.exp(-(t - 0.032) * 125) * 0.58 : 0) +
        (t > 0.048 ? Math.exp(-(t - 0.048) * 140) * 0.42 : 0);

      const grain =
        (Math.sin(Math.PI * 2 * 750 * vScale * t + raw * 1.4) * 0.44 +
          Math.sin(Math.PI * 2 * 1580 * vScale * t + raw * 1.0) * 0.32) *
        Math.exp(-t * 46);

      return Math.tanh((boxThud + v1 * cracks * 1.55 + grain) * 1.95) * 0.93;
    });
  }
  synthWhoosh(context, rate, seconds, startFreq, endFreq, seed) {
    let ic1 = 0,
      ic2 = 0,
      pSub = 0,
      pWhip = 0;
    const dt = 1 / rate;
    return this.makeBuffer(context, rate, seconds, (t, i) => {
      const p = t / seconds;
      const env = Math.sin(Math.PI * Math.pow(p, 0.68)) * Math.exp(-p * 0.95);
      const arch = Math.sin(Math.PI * Math.pow(p, 0.6));
      const cutoff = Math.max(140, Math.min(rate * 0.43, endFreq + (startFreq - endFreq) * arch));
      const raw = this.noise(i, seed);
      const g = Math.tan((Math.PI * cutoff) / rate);
      const k = 0.56;
      const a1 = 1 / (1 + g * (g + k));
      const a2 = g * a1;
      const a3 = g * a2;
      const v3 = raw - ic2;
      const v1 = a1 * ic1 + a2 * v3;
      const v2 = ic2 + a2 * ic1 + a3 * v3;
      ic1 = 2 * v1 - ic1;
      ic2 = 2 * v2 - ic2;
      const subFreq = endFreq * 0.48 + (startFreq * 0.18 - endFreq * 0.48) * p;
      const whipFreq = cutoff * 1.35;
      pSub += Math.PI * 2 * subFreq * dt;
      pWhip += Math.PI * 2 * whipFreq * dt;
      const airBody = Math.sin(pSub) * 0.28 + Math.sin(pWhip + raw * 1.4) * 0.18 * arch;
      return Math.tanh((v1 * 1.48 + v2 * 0.34 + airBody) * env * 1.65) * 0.9;
    });
  }
  synthCatch(context, rate) {
    let p1 = 0,
      pSnap = 0,
      lp = 0,
      hp = 0;
    const dt = 1 / rate;
    return this.makeBuffer(context, rate, 0.24, (t, i) => {
      const f = 64 + 210 * Math.exp(-t * 42);
      const fSnap = 480 + 2600 * Math.exp(-t * 160);
      p1 += Math.PI * 2 * f * dt;
      pSnap += Math.PI * 2 * fSnap * dt;
      const thud = Math.sin(p1) * Math.exp(-t * 16) * 0.84;
      const gripSnap = Math.sin(pSnap) * Math.exp(-t * 75) * 0.55;
      const raw = this.noise(i, 79);
      lp += (raw - lp) * 0.58;
      hp += (lp - hp) * 0.08;
      const cloth =
        (lp - hp) * (Math.exp(-t * 52) * 1.05 + (t > 0.016 ? Math.exp(-(t - 0.016) * 38) * 0.8 : 0));
      const slap =
        t > 0.012 ? Math.sin(Math.PI * 2 * 480 * (t - 0.012)) * Math.exp(-(t - 0.012) * 48) * 0.48 : 0;
      return Math.tanh((thud + gripSnap + cloth + slap) * 1.88) * 0.93;
    });
  }
  synthLanding(context, rate) {
    let p1 = 0,
      p2 = 0,
      pCrack = 0,
      lp = 0;
    const dt = 1 / rate;
    return this.makeBuffer(context, rate, 0.56, (t, i) => {
      const f1 = 44 + 155 * Math.exp(-t * 30);
      const fCrack = 290 + 2200 * Math.exp(-t * 120);
      p1 += Math.PI * 2 * f1 * dt;
      pCrack += Math.PI * 2 * fCrack * dt;
      const heel = Math.sin(p1 + 0.35 * Math.sin(p1 * 2)) * Math.exp(-t * 8.0) * 0.94;
      const slamCrack = Math.sin(pCrack) * Math.exp(-t * 62) * 0.56;
      let sole = 0;
      if (t >= 0.016) {
        const ts = t - 0.016;
        const f2 = 62 + 160 * Math.exp(-ts * 34);
        p2 += Math.PI * 2 * f2 * dt;
        sole = Math.sin(p2) * Math.exp(-ts * 10.0) * 0.72;
      }
      const raw = this.noise(i, 95);
      lp += (raw - lp) * 0.46;
      const grit =
        (lp * 0.78 + raw * 0.22) *
        (Math.exp(-t * 28) * 0.72 + (t >= 0.016 ? Math.exp(-(t - 0.016) * 18) * 0.6 : 0));
      return Math.tanh((heel + slamCrack + sole + grit) * 1.82) * 0.93;
    });
  }
  synthEnergy(context, rate) {
    let pSub = 0,
      ic1 = 0,
      ic2 = 0;
    const dt = 1 / rate;
    const crystalFreqs = [880, 1320, 1760, 2640, 3520];
    return this.makeBuffer(context, rate, 0.44, (t, i) => {
      const fSub = 44 + 155 * Math.exp(-t * 24);
      pSub += Math.PI * 2 * fSub * dt;
      const sub = Math.sin(pSub) * Math.exp(-t * 9.0) * 0.64;
      const raw = this.noise(i, 97);
      const cutoff = Math.min(rate * 0.43, 480 + 4200 * Math.sin(Math.PI * Math.pow(t / 0.44, 0.62)));
      const g = Math.tan((Math.PI * cutoff) / rate);
      const k = 0.48;
      const a1 = 1 / (1 + g * (g + k));
      const a2 = g * a1;
      const a3 = g * a2;
      const v3 = raw - ic2;
      const v1 = a1 * ic1 + a2 * v3;
      const v2 = ic2 + a2 * ic1 + a3 * v3;
      ic1 = 2 * v1 - ic1;
      ic2 = 2 * v2 - ic2;
      const whoosh = v1 * Math.min(1, t / 0.014) * Math.exp(-t * 4.8) * 0.92;
      const glide = 1 + 0.26 * (1 - Math.exp(-t * 15));
      let shimmer = 0;
      for (let c = 0; c < crystalFreqs.length; c++) {
        const cf = crystalFreqs[c] * glide;
        shimmer +=
          Math.sin(Math.PI * 2 * cf * t + Math.sin(Math.PI * 2 * 21 * t) * 0.42) *
          Math.exp(-t * (6.0 + c * 1.6)) *
          (0.22 / (1 + c * 0.18));
      }
      return Math.tanh((sub + whoosh + shimmer) * 1.68) * 0.91;
    });
  }
  synthReverse(context, rate) {
    let ic1 = 0,
      ic2 = 0;
    const baseFreqs = [523.25, 783.99, 1046.5, 1567.98, 2093.0];
    return this.makeBuffer(context, rate, 0.38, (t, i) => {
      const p = t / 0.38;
      const swell = p < 0.86 ? Math.pow(p / 0.86, 1.95) : Math.exp(-(p - 0.86) * 34);
      const sweep = 1 + 0.62 * p * p;
      const raw = this.noise(i, 101);
      const cutoff = Math.min(rate * 0.43, 420 + 4400 * p * p);
      const g = Math.tan((Math.PI * cutoff) / rate);
      const k = 0.52;
      const a1 = 1 / (1 + g * (g + k));
      const a2 = g * a1;
      const a3 = g * a2;
      const v3 = raw - ic2;
      const v1 = a1 * ic1 + a2 * v3;
      const v2 = ic2 + a2 * ic1 + a3 * v3;
      ic1 = 2 * v1 - ic1;
      ic2 = 2 * v2 - ic2;
      let chord = 0;
      for (let c = 0; c < baseFreqs.length; c++) {
        const f = baseFreqs[c] * sweep;
        chord += Math.sin(Math.PI * 2 * f * t + Math.sin(Math.PI * 2 * 24 * t) * 0.36) * (0.22 / (1 + c * 0.16));
      }
      const flashSnap =
        p >= 0.83 && p < 0.94
          ? (Math.sin(Math.PI * 2 * 2650 * t) * 0.48 + Math.sin(Math.PI * 2 * 4120 * t) * 0.28) *
            Math.exp(-(p - 0.83) * 58)
          : 0;
      return Math.tanh(((v1 * 0.88 + chord) * swell + flashSnap) * 1.68) * 0.9;
    });
  }
  buildBank(context = this.ctx, deferred = false) {
    const rate = 24000;
    const fromCacheOrBuild = (cacheKey, builder) => {
      let cached = PCM_CACHE.get(cacheKey);
      if (!cached) {
        const built = builder();
        const raw = new Float32Array(built.length);
        raw.set(built.getChannelData(0));
        cached = { length: built.length, sampleRate: built.sampleRate, data: raw };
        PCM_CACHE.set(cacheKey, cached);
        return built;
      }
      const buf = context.createBuffer(1, cached.length, cached.sampleRate);
      buf.copyToChannel(cached.data, 0);
      return buf;
    };
    const addBank = (key, builder) =>
      this.jobs.push(() => {
        this.bank.set(key, fromCacheOrBuild('bank:' + key, builder));
        this.bankOwner.set(key, context);
      });
    const addNote = (key, builder) =>
      this.jobs.push(() => {
        this.noteBank.set(key, fromCacheOrBuild('note:' + key, builder));
        this.noteBankOwner.set(key, context);
      });

    // Preserve all 42 legacy bank keys intact for UI & Foley/SFX compatibility
    for (const d of ['kick', 'snare', 'hat', 'openhat', 'clap', 'tom', 'crash']) {
      addBank(d, () => this.synthDrum(context, rate, d));
    }
    addBank('bass', () => this.synthInstrument(context, rate, 'bass', 36, 0.56));
    addBank('guitar', () => this.synthInstrument(context, rate, 'guitar', 60, 0.68));
    addBank('keys', () => this.synthOrchestra(context, rate, 'piano', 60, 1.2));
    addBank('pad', () => this.synthOrchestra(context, rate, 'strings', 60, 1.4));
    addBank('lead', () => this.synthInstrument(context, rate, 'lead', 60, 0.62));
    addBank('bell', () => this.synthInstrument(context, rate, 'bell', 72, 0.64));
    addBank('brass', () => this.synthOrchestra(context, rate, 'horn', 60, 1.4));

    for (const midi of [31, 36, 41, 46, 51]) {
      addNote(`bass:${midi}`, () => this.synthInstrument(context, rate, 'bass', midi, 0.56));
    }
    for (const kind of ['keys', 'bell']) {
      for (const midi of [48, 54, 60, 66, 72, 78, 84]) {
        addNote(`${kind}:${midi}`, () => this.synthInstrument(context, rate, kind, midi, 0.6));
      }
    }

    // Live Acoustic Symphony Orchestra & Cathedral Note Banks
    const orchSpecs = {
      strings: { pitches: [48, 53, 58, 63, 68, 73, 78, 83, 88], dur: 2.3 },
      lowStrings: { pitches: [30, 35, 40, 45, 50, 55, 60], dur: 2.4 },
      spiccato: { pitches: [45, 51, 57, 63, 69, 75], dur: 0.42 },
      horn: { pitches: [42, 47, 52, 57, 62, 67, 72], dur: 2.3 },
      trumpet: { pitches: [54, 59, 64, 69, 74, 79, 84], dur: 2.0 },
      lowBrass: { pitches: [28, 33, 38, 43, 48, 53], dur: 2.2 },
      piano: { pitches: [32, 37, 42, 47, 52, 57, 62, 67, 72, 77, 82, 87], dur: 2.3 },
      harp: { pitches: [42, 48, 54, 60, 66, 72, 78, 84], dur: 2.1 },
      choir: { pitches: [42, 47, 52, 57, 62, 67, 72, 77], dur: 2.4 },
      organ: { pitches: [30, 36, 42, 48, 54, 60, 66, 72, 78], dur: 2.4 },
      wind: { pitches: [57, 62, 67, 72, 77, 82], dur: 2.0 },
      acguitar: { pitches: [40, 45, 50, 55, 60, 65, 70, 75], dur: 1.85 },
      chimes: { pitches: [56, 60, 64, 68, 72, 76], dur: 2.3 }
    };
    this.orchPitchLists = {};
    for (const [kind, spec] of Object.entries(orchSpecs)) {
      this.orchPitchLists[kind] = spec.pitches;
      for (const midi of spec.pitches) {
        addNote(`${kind}:${midi}`, () => this.synthOrchestra(context, rate, kind, midi, spec.dur));
      }
    }
    this.orchPitchLists.timpani = [36, 39, 42, 45, 48, 51, 54];
    for (const midi of this.orchPitchLists.timpani) {
      addNote(`timpani:${midi}`, () => this.synthOrchPerc(context, rate, 'timpani', midi));
    }
    for (const perc of ['grancassa', 'orchsnare', 'orchsnare_soft', 'piatti', 'cymbal_swell', 'taiko']) {
      addNote(`orch:${perc}`, () => this.synthOrchPerc(context, rate, perc));
    }

    for (let variant = 0; variant < 3; variant++) {
      addBank('punch' + variant, () => this.synthImpact(context, rate, 'punch', variant));
      addBank('heavy' + variant, () => this.synthImpact(context, rate, 'heavy', variant));
      addBank('slash' + variant, () => this.synthImpact(context, rate, 'slash', variant));
      addBank('wood' + variant, () => this.synthImpact(context, rate, 'wood', variant));
      addBank('metal' + variant, () => this.synthImpact(context, rate, 'metal', variant));
    }
    addBank('swing', () => this.synthWhoosh(context, rate, 0.21, 1850, 280, 19));
    addBank('swingHeavy', () => this.synthWhoosh(context, rate, 0.32, 1420, 185, 43));
    addBank('catch', () => this.synthCatch(context, rate));
    addBank('landing', () => this.synthLanding(context, rate));
    addBank('energy', () => this.synthEnergy(context, rate));
    addBank('reverse', () => this.synthReverse(context, rate));
    for (let phase = 0; phase < 3; phase++) addBank('rising' + phase, () => this.synthArcadeAction(context, rate, phase));
    addBank('fireLaunch', () => this.synthArcadeAction(context, rate, 3));
    addBank('fireHit', () => this.synthArcadeAction(context, rate, 4));
    addBank('impactBody', () => this.synthImpactBody(context, rate, false));
    addBank('impactCrush', () => this.synthImpactBody(context, rate, true));
    for(const material of ['panel','glass','frame'])
      addBank('yard-'+material,()=>this.synthWreck(context,rate,material));

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
  adoptBank(context) {
    for (const [key, buffer] of this.bank) {
      if (this.bankOwner.get(key) === context) continue;
      const copy = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      for (let ch = 0; ch < buffer.numberOfChannels; ch++) copy.copyToChannel(buffer.getChannelData(ch), ch);
      this.bank.set(key, copy);
      this.bankOwner.set(key, context);
    }
    for (const [key, buffer] of this.noteBank) {
      if (this.noteBankOwner.get(key) === context) continue;
      const copy = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      for (let ch = 0; ch < buffer.numberOfChannels; ch++) copy.copyToChannel(buffer.getChannelData(ch), ch);
      this.noteBank.set(key, copy);
      this.noteBankOwner.set(key, context);
    }
  }
  flushBank() {
    clearTimeout(this.jobTimer);
    this.jobTimer = null;
    while (this.jobs.length) this.jobs.shift()();
  }
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
    if (typeof fighterVoice !== 'undefined') fighterVoice.preload(scratch);
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
    if (!this.offline && this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
      this.ctx.resume();
    }
    this.seGain.gain.setTargetAtTime(this.muted ? 0 : this.seVol * 0.82, this.ctx.currentTime, 0.02);
    this.duckMusic(this.ducked);
    if (this.voiceBound && typeof fighterVoice !== 'undefined') {
      fighterVoice.updateVolume();
      fighterVoice.duck();
    }
  }
  sample(keyOrBuffer, t, volume = 1, rate = 1, pan = 0, duration = null, bus = null, group = 'music') {
    const buffer = typeof keyOrBuffer === 'string'
      ? (keyOrBuffer.startsWith('orch:') ? this.noteBank.get(keyOrBuffer) : this.bank.get(keyOrBuffer))
      : keyOrBuffer;
    if (!buffer || !Number.isFinite(t)) return;
    if (!this.offline && this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
      this.ctx.resume();
    }
    const cap = group === 'music' ? 128 : 32;
    if (!this.offline) {
      const voices = [...this.active].filter((v) => v.group === group && !v.stolen);
      if (voices.length >= cap) {
        if (group !== 'effect') {
          this.steal(voices.reduce((a, b) => (b.start < a.start ? b : a)));
        } else {
          this.steal(voices.reduce((a, b) => (b.start < a.start ? b : a)));
        }
      }
    }
    const clampedRate = Math.max(0.25, Math.min(4, rate));
    const at = Math.max(this.ctx.currentTime, t),
      maxDur = buffer.duration / clampedRate,
      length = Math.min(maxDur, duration ?? maxDur),
      release = group === 'music' ? Math.min(0.32, length * 0.36) : Math.min(0.08, length * 0.3);
    const source = this.ctx.createBufferSource(),
      gain = this.ctx.createGain(),
      panner = this.ctx.createStereoPanner();
    source.buffer = buffer;
    source.playbackRate.value = clampedRate;
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + (group === 'music' ? 0.005 : 0.003));
    gain.gain.setValueAtTime(volume, at + Math.max(0.006, length - release));
    gain.gain.linearRampToValueAtTime(0, at + length);
    source.connect(gain);
    gain.connect(panner);
    const destination = bus || (group === 'music' ? this.musicBus : this.seGain);
    panner.connect(destination);
    const entry = { source, gain, panner, group, bus: destination, start: at, end: at + length };
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
  // Fade a playing voice out in a few milliseconds (no click) and release it. It stops counting toward the cap at once.
  steal(entry) {
    const now = this.ctx.currentTime;
    entry.stolen = true;
    this.stats.stolen++;
    entry.gain.gain.cancelScheduledValues(now);
    entry.gain.gain.setTargetAtTime(0, now, 0.004);
    try {
      entry.source.stop(now + 0.03);
    } catch (e) {}
  }
  note(name, midi, t, duration, volume = 0.3, pan = 0, bus = null, group = 'music') {
    const resolved = name === 'brass' ? 'horn' : name === 'pad' ? 'strings' : name;
    let buffer = null;
    let base = 60;
    if (this.noteBank && this.noteBank.size) {
      const pitches =
        (this.orchPitchLists && this.orchPitchLists[resolved]) ||
        (resolved === 'bass' ? [31, 36, 41, 46, 51] : [48, 54, 60, 66, 72, 78, 84]);
      let best = pitches[0];
      let bestDist = Math.abs(midi - best);
      for (let i = 1; i < pitches.length; i++) {
        const d = Math.abs(midi - pitches[i]);
        if (d < bestDist) {
          best = pitches[i];
          bestDist = d;
        }
      }
      const candidate = this.noteBank.get(`${resolved}:${best}`);
      if (candidate) {
        buffer = candidate;
        base = best;
      }
    }
    return this.sample(
      buffer || name,
      t,
      volume,
      Math.pow(2, (midi - base) / 12),
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
    this.musicBus.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.25);
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
    if (this.nextStepTime < this.ctx.currentTime - 0.15) this.nextStepTime = this.ctx.currentTime + 0.02;
    const horizon = this.ctx.currentTime + 0.12;
    while (this.nextStepTime < horizon) {
      if (!this.muted) this.tick(this.currentTrack, this.step, this.nextStepTime);
      this.step = (this.step + 1) % 512;
      this.nextStepTime += this.stepDur;
    }
  }
  degreeToSemi(scale, degree) {
    const len = scale.length;
    const oct = Math.floor(degree / len);
    const idx = ((degree % len) + len) % len;
    return oct * 12 + scale[idx];
  }
  chordSemis(cfg, bar) {
    const section = Math.floor((bar % 32) / 8);
    const progList = section === 1 || section === 3 ? cfg.progB || cfg.prog : cfg.prog;
    const deg = progList[bar % progList.length];
    return [
      this.degreeToSemi(cfg.scale, deg),
      this.degreeToSemi(cfg.scale, deg + 2),
      this.degreeToSemi(cfg.scale, deg + 4),
      this.degreeToSemi(cfg.scale, deg + 6),
      this.degreeToSemi(cfg.scale, deg + 8)
    ];
  }
  score(track, step) {
    const cfg = typeof track === 'object' ? track : ARCADE_TRACKS[track] || ARCADE_TRACKS[0];
    const trackId = cfg.id ?? (typeof track === 'number' ? track : 0);
    const events = [];
    const s = step % 16;
    const bar = Math.floor(step / 16) % 32;
    const section = Math.floor(bar / 8); // 0: Exposition, 1: Lift, 2: Sacred/Chamber Bridge, 3: Grand Tutti Climax
    const isIntro = bar < 2;
    const isChamber = bar >= 16 && bar < 20;
    const isSwell = bar >= 20 && bar < 24;
    const isClimax = section === 1 || section === 3 || bar >= 22;
    const isGrand = section === 3 || bar >= 12 && bar < 16;
    const isLastBar = bar === 31;
    const unit = 60 / cfg.bpm / 4;
    // Clamp strictly before OfflineAudioContext end (seconds + 1.3) in verify-audio.cjs
    const safeMaxSec = Math.max(0.08, ((31 - bar) * 16 + (16 - s)) * unit + (isLastBar ? 0.32 : 0.65));
    const clampDur = (sec) => Math.max(0.07, Math.min(sec, safeMaxSec));

    const note = (instrument, midi, lengthSteps, volume, pan = 0) =>
      events.push({ instrument, midi, duration: clampDur(lengthSteps * unit), volume, pan });
    const perc = (instrument, volume, pan = 0, durSec = null) =>
      events.push({
        instrument,
        midi: null,
        duration: bar >= 30 ? clampDur(durSec ?? 1.5) : durSec,
        volume,
        pan,
        rate: 1
      });

    if(cfg.style==='industrial'){
      const chorus=section%2===1,breakdown=bar>=16&&bar<20;
      const root=cfg.root+(chorus?[0,3,10,5,0,3,5,7]:[0,0,3,-2,0,5,3,-2])[bar%8];
      const kick=breakdown?[0,8]:[0,6,8,bar%2?14:11];
      if(kick.includes(s))perc('kick',s===0?.68:.52,0,.23);
      if(s===4||s===12){perc('snare',.48,-.08,.22);perc('clap',.18,.21,.16);}
      if(s%2===0&&!breakdown)perc(s===14&&bar%2?'openhat':'hat',s%4?.16:.11,.29,.14);
      if(bar%4===3&&s>=13)perc(s===15?'tom':'orch:orchsnare_soft',.13+(s-13)*.045,(s-14)*.3,.24);
      if(bar%8===0&&!s)perc('crash',.19,-.23,.76);
      if((breakdown?[0,6,10]:[0,3,6,8,10,14]).includes(s)){
        const bass=root+(s===10?7:s===14&&bar%2?10:0);
        note('bass',bass,s===0?2.8:1.65,.45,0);
        note('guitar',bass+12,1.55,.32,-.33);
        if(chorus)note('guitar',bass+19,1.55,.23,.36);
      }
      const hook=bar%2===0?[[0,7,3],[6,10,2],[10,12,5]]:[[2,12,2],[5,10,2],[8,7,4],[14,3,2]];
      for(const [on,pitch,len] of hook)if(s===on&&!breakdown){
        note('lead',root+12+pitch,len,chorus?.32:.26,.12);
        if(chorus)note('trumpet',root+12+pitch,len,.13,-.21);
      }
      if(breakdown&&(s===0||s===10))note('lowBrass',root,5,.28,-.12);
      return events;
    }
    const comp = TRACK_COMPOSITIONS[trackId] || TRACK_COMPOSITIONS[0];
    const progList = section === 1 || section === 3 ? cfg.progB || cfg.prog : cfg.prog;
    const chordDeg = progList[bar % progList.length];
    const chord = this.chordSemis(cfg, bar);
    const rootLow = cfg.root - 12 + chord[0];
    const timpaniMidi = Math.max(36, Math.min(54, rootLow + (rootLow < 36 ? 12 : 0)));

    // 1. SYMPHONIC PERCUSSION — Timpani, Gran Cassa, Concert Snare, Piatti, Taiko
    if (s === 0 && (bar === 0 || bar === 8 || bar === 16 || bar === 24 || (isGrand && bar % 4 === 0))) {
      const piVol = isGrand ? 0.24 : bar === 0 ? 0.14 : 0.19;
      perc('orch:piatti', piVol, 0.26, 2.0);
    }
    // Suspended cymbal swell leading cleanly into Bar 8 and Bar 24 on beat 3
    if ((bar === 7 || bar === 23) && s === 4) {
      perc('orch:cymbal_swell', bar === 23 ? 0.26 : 0.2, -0.22, 1.55);
    }
    // Deep Concert Bass Drum (Gran Cassa) & Taiko
    if (cfg.style === 'castle') {
      if (s === 0 || (s === 8 && !isChamber) || (s === 12 && isClimax)) {
        perc(s === 0 ? 'orch:taiko' : 'orch:grancassa', s === 0 ? 0.34 : 0.25, -0.06);
      }
      if (!isChamber && (s === 6 || s === 14) && (isClimax || bar % 2 === 1)) {
        perc('orch:orchsnare_soft', 0.16, -0.2);
      }
    } else if (cfg.style === 'requiem') {
      if (s === 0 || s === 6 || s === 8 || (s === 14 && !isChamber)) {
        perc('orch:grancassa', s === 0 ? 0.38 : 0.27, 0);
      }
      if (s === 4 || s === 12 || (s === 10 && isClimax)) {
        perc('orch:orchsnare', isClimax ? 0.25 : 0.19, -0.22);
      } else if ((s === 11 || s === 15) && bar >= 2) {
        perc('orch:orchsnare_soft', 0.12, -0.2);
      }
    } else if (cfg.style === 'metropolis' || cfg.style === 'noir') {
      if (s === 0 || (s === 8 && !isIntro)) {
        perc('orch:grancassa', s === 0 ? 0.33 : 0.24, -0.04);
      }
      if (!isChamber && (s === 4 || s === 12) && (isClimax || bar >= 4)) {
        perc(s === 12 ? 'orch:orchsnare' : 'orch:orchsnare_soft', isClimax ? 0.19 : 0.14, -0.18);
      }
    } else if (cfg.style === 'coronation') {
      if (s === 0 || s === 8) perc('orch:grancassa', s === 0 ? 0.34 : 0.23, 0);
      if (s === 4 || s === 12 || (s >= 12 && bar % 4 === 3)) {
        perc(s === 12 ? 'orch:orchsnare' : 'orch:orchsnare_soft', 0.18, -0.2);
      }
    } else if (!isChamber && (s === 0 || (s === 8 && isClimax))) {
      perc('orch:grancassa', s === 0 ? 0.28 : 0.2, -0.05);
    }

    // Tuned Timpani following root & fifth of the progression
    if (!isChamber && (s === 0 || (s === 8 && (isClimax || bar % 2 === 1)) || (bar % 8 === 7 && (s === 12 || s === 14)))) {
      const tMidi = s >= 8 && chordDeg !== 0 ? Math.max(36, Math.min(54, timpaniMidi + 7)) : timpaniMidi;
      note('timpani', tMidi, 8, s === 0 ? 0.37 : s >= 12 ? 0.24 : 0.28, -0.14);
    }

    // 2. CELLO & CONTRABASS SECTION + LOW BRASS FOUNDATION
    if (comp.bassRhythm[s]) {
      const bDeg = comp.bassDegs[s] || 0;
      const bSemi = this.degreeToSemi(cfg.scale, chordDeg + bDeg);
      const rawMidi = cfg.root - 12 + bSemi;
      const bassMidi = rawMidi < 31 ? rawMidi + 12 : rawMidi;
      const bassSteps = isLastBar ? Math.max(2, 16 - s) : 10;
      note('lowStrings', bassMidi, bassSteps, s === 0 ? 0.29 : 0.21, 0.16);
      if ((isGrand || (cfg.style === 'requiem' && !isChamber)) && s === 0) {
        note('lowBrass', Math.max(28, bassMidi), bassSteps, isGrand ? 0.22 : 0.17, -0.1);
      }
    }

    // 3. ORCHESTRAL CHORD VOICING (Wide Open 10th + 5th + 9th) & CATHEDRAL ORGAN / CHOIR
    if (s === 0 || (s === 8 && (isClimax || isSwell || cfg.style === 'cathedral'))) {
      const lenSteps = isLastBar ? Math.max(4, 16 - s) : s === 0 && !isClimax ? 17.5 : 10.5;
      const vBassFifth = cfg.root - 12 + chord[2];
      const vTenth = cfg.root + chord[1] + 12; // open 10th voicing for warmth
      const vOct = cfg.root + chord[0] + 12;
      const vNinth = cfg.root + chord[4];
      const gainPad = isChamber ? 0.11 : isGrand ? 0.165 : 0.135;

      note('lowStrings', vBassFifth, lenSteps, gainPad * 0.95, 0.24);
      note('strings', vOct, lenSteps, gainPad, -0.32);
      note('strings', vTenth, lenSteps, gainPad * 0.9, 0.32);
      if (s === 0) {
        note('strings', vNinth, lenSteps, gainPad * 0.62, -0.12);
      }

      if (cfg.padInst === 'organ' || cfg.style === 'cathedral' || cfg.style === 'requiem' || (isGrand && cfg.style === 'coronation')) {
        note('organ', cfg.root + chord[0], lenSteps, isChamber ? 0.095 : 0.135, -0.26);
        note('organ', cfg.root + chord[2], lenSteps, isChamber ? 0.08 : 0.115, 0.26);
      }
      if (cfg.style === 'cathedral' || cfg.style === 'coronation' || cfg.style === 'requiem' || isGrand) {
        const choirVol = cfg.style === 'cathedral' ? 0.165 : cfg.style === 'requiem' ? 0.145 : isGrand ? 0.145 : 0.105;
        note('choir', cfg.root + chord[0] + 12, lenSteps, choirVol, -0.38);
        note('choir', cfg.root + chord[1] + 12, lenSteps, choirVol * 0.9, 0.38);
      }
      if (s === 0 && (bar === 0 || bar === 8 || bar === 16 || bar === 24 || cfg.style === 'cathedral' || cfg.style === 'coronation')) {
        note('chimes', cfg.root + 12 + chord[0], isLastBar ? Math.max(4, 16 - s) : 14, cfg.style === 'cathedral' ? 0.24 : 0.20, 0.3);
      }
    }

    // 4. SPICCATO OSTINATO (for driving Castle / Metropolis / Requiem battle tension)
    if (!isIntro && !isChamber && (cfg.style === 'metropolis' || cfg.style === 'requiem' || (cfg.style === 'castle' && isClimax))) {
      if (s % 2 === 0 || (cfg.style === 'requiem' && isGrand)) {
        const spSemi = s % 4 === 0 ? chord[0] : s % 4 === 2 ? chord[2] : chord[1];
        const spVol = s % 4 === 0 ? 0.145 : s % 2 === 0 ? 0.11 : 0.085;
        note('spiccato', cfg.root + spSemi, 2.2, spVol, s % 4 < 2 ? -0.3 : 0.3);
      }
    }

    // 5. ACOUSTIC PIANO / HARP / CLASSICAL GUITAR ACCOMPANIMENT (Flowing Orchestral Broken Chords)
    if (comp.arpSteps.includes(s)) {
      const aIdx = comp.arpSteps.indexOf(s);
      const arpDeg = comp.arpDegs[aIdx % comp.arpDegs.length];
      const arpMidi = cfg.root + this.degreeToSemi(cfg.scale, chordDeg + arpDeg);
      const inst = cfg.keyInst === 'spiccato' ? 'piano' : cfg.keyInst;
      const baseVol = isChamber ? 0.175 : isClimax ? 0.145 : 0.155;
      const pan = -0.22 + (aIdx / Math.max(1, comp.arpSteps.length - 1)) * 0.44;
      note(inst, arpMidi, 5.5, baseVol * (s % 4 === 0 ? 1.12 : 0.92), pan);
    }

    // 6. MAIN SYMPHONIC MELODY, OCTAVE DOUBLING & COUNTER-MELODY
    const playIntroHorn = isIntro && (s === 0 || s === 8);
    if (playIntroHorn) {
      const mSemi = this.degreeToSemi(cfg.scale, chordDeg + (s === 0 ? 0 : 4));
      note('horn', cfg.root + 12 + mSemi, 10, 0.19, -0.22);
      if (s === 0) note(cfg.keyInst === 'spiccato' ? 'piano' : cfg.keyInst, cfg.root + chord[0], 10, 0.16, 0.18);
    } else if (!isIntro) {
      const phrase = isClimax
        ? (bar % 2 === 0 ? comp.melB1 : comp.melB2)
        : (bar % 2 === 0 ? comp.melA1 : comp.melA2);
      const stepNote = phrase[s];
      if (stepNote) {
        const [degOffset, rawLen, vel, isChordRel] = stepNote;
        const nLen = Math.min(isLastBar ? Math.max(2, 16 - s) : 14, rawLen + 1.8);
        const totalDeg = isChordRel ? chordDeg + degOffset : degOffset;
        const semi = this.degreeToSemi(cfg.scale, totalDeg);
        const oct = isChamber ? 0 : 12;
        const leadMidi = cfg.root + oct + semi;
        const leadGain = (isChamber ? 0.19 : isGrand ? 0.275 : isClimax ? 0.25 : 0.225) * (vel || 0.92);

        note(cfg.lead, leadMidi, nLen, leadGain, 0.1);
        // Symphonic Tutti unison/octave brilliance in climax & choruses
        if (isClimax && !isChamber) {
          note(cfg.sub, leadMidi - (cfg.sub === 'horn' ? 12 : 0), nLen, leadGain * 0.68, -0.22);
        }
        if (isGrand && cfg.lead !== 'strings') {
          note('strings', leadMidi + (leadMidi < 72 ? 12 : 0), nLen, leadGain * 0.62, -0.36);
        }
        if (isGrand && cfg.lead !== 'trumpet' && cfg.style !== 'cathedral') {
          note('trumpet', leadMidi, nLen, leadGain * 0.56, 0.26);
        }
      }

      // Expressive responsive counter-melody by French Horn / Cello during held notes
      const cNote = !isChamber && comp.counter ? comp.counter[s] : null;
      if (cNote) {
        const [cDeg, cLen, cVel, cRel] = cNote;
        const cSemi = this.degreeToSemi(cfg.scale, cRel ? chordDeg + cDeg : cDeg);
        const cInst = cfg.lead === 'horn' ? 'strings' : 'horn';
        note(cInst, cfg.root + cSemi, Math.min(isLastBar ? Math.max(2, 16 - s) : 8, cLen + 1.2), 0.16 * (cVel || 0.8), -0.26);
      }
    }

    return events;
  }
  tick(track, step, t) {
    const cfg = ARCADE_TRACKS[track];
    if (!cfg) return;
    const swung = t + (step % 2 ? ((cfg.swing || 0) * 60) / cfg.bpm / 4 : 0);
    for (const event of this.score(track, step)) {
      if (event.midi === null) this.sample(event.instrument, swung, event.volume, event.rate || 1, event.pan, event.duration);
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
      this.note('bell', 84, t, 0.08, 0.24, -0.08, this.seGain, 'effect');
      this.note('keys', 72, t + 0.008, 0.07, 0.18, 0.08, this.seGain, 'effect');
      return;
    }
    for (const [i, n] of [67, 74, 79].entries()) {
      this.note('bell', n + 12, t + i * 0.036, 0.22, 0.26, i * 0.14 - 0.14, this.seGain, 'effect');
      this.note('keys', n, t + i * 0.036, 0.2, 0.24, 0.14 - i * 0.14, this.seGain, 'effect');
    }
  }
  playSwing(heavy = false) {
    if (this.allow('swing', 0.035))
      this.effect(
        heavy ? 'swingHeavy' : 'swing',
        heavy ? 0.96 : 0.78,
        (this.random() - 0.5) * 0.35,
        0,
        0.96 + this.random() * 0.1
      );
  }
  // Dedicated v3.4.2 one-shots: ascending snap/body/air layers, then a heavy final crack.
  // Seeded noise and offline PCM keep synthesis out of the combat update loop.
  synthArcadeAction(context, rate, kind) {
    let seed = 342 + kind * 7919, low = 0, phase = 0;
    const fire = kind >= 3, final = kind === 2, duration = fire ? (kind === 4 ? .62 : .38) : final ? .43 : .23;
    return this.makeBuffer(context, rate, duration, t => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const n = seed / 2147483648 - 1;
      low += (n - low) * (fire ? .12 : .22);
      const high = n - low;
      phase += 2 * Math.PI * (fire ? 65 + 110 * Math.exp(-t * 19) : 72 + kind * 20 + 150 * Math.exp(-t * 40)) / rate;
      if (fire) {
        const blast = kind === 4 ? Math.sin(phase) * Math.exp(-t * 14) * .75 : 0;
        const envelope = (1 - Math.exp(-t * (kind === 4 ? 500 : 75))) * Math.exp(-t * (kind === 4 ? 5.7 : 8));
        const crackle = high * (.32 + .68 * Math.pow(Math.max(0, Math.sin(t * 173) * Math.sin(t * 347)), 5));
        return blast + (low * 2.6 + crackle) * envelope;
      }
      const crack = high * Math.exp(-t * (final ? 57 : 85)) * 1.2;
      const body = Math.sin(phase) * Math.exp(-t * (final ? 12 : 23)) * .82;
      const air = low * (1 - Math.exp(-t * 180)) * Math.exp(-t * (final ? 9 : 21)) * 1.3;
      const bright = Math.sin(2 * Math.PI * (1050 + kind * 260) * t) * Math.exp(-t * 65) * .13;
      return crack + body + air + bright;
    });
  }
  // v3.5: chest-level punch + sub-bass shock + short room tail. No louder master gain.
  synthImpactBody(context, rate, heavy) {
    let seed = heavy ? 3609 : 3603, phase = 0, low = 0;
    return this.makeBuffer(context, rate, heavy ? .92 : .48, t => {
      seed = (Math.imul(seed,1664525)+1013904223) >>> 0;
      const n = seed/2147483648-1; low += (n-low)*.075;
      // v3.6.1 [AUDIO-135]: the normal body settles at 46 Hz (was 53) and rings a little longer (decay 9.5, was 12).
      // 53 Hz sat inside the chest band of punch0-2 (56-69 Hz with the playback jitter), so for some variant / pitch
      // pairs the two cancelled and the layered hit had less low end than the punch alone. Heavy (38 Hz) is clear.
      phase += 2*Math.PI*((heavy?38:46)+145*Math.exp(-t*48))/rate;
      const body = (Math.sin(phase)+.28*Math.sin(phase*2.03)) * Math.exp(-t*(heavy?4.8:9.5));
      const sub = Math.sin(2*Math.PI*(heavy?34:43)*t) * (1-Math.exp(-t*120)) * Math.exp(-t*(heavy?5:13));
      const crunch = low * 2.0 * Math.exp(-t*30);
      const snap = (n-low)*Math.exp(-t*145)*1.2;
      const room = t>.035 ? Math.sin(2*Math.PI*86*(t-.035)) * Math.exp(-(t-.035)*12)*.14 : 0;
      return Math.tanh(Math.tanh(body*1.35+sub*.85+crunch+room)*(heavy?1.3:.92) + snap)*.93;
    });
  }
  impactWeight(heavy = false, gain = .75, pan = 0) {
    this.effect(heavy ? 'impactCrush' : 'impactBody', gain, pan, 0, 1);
  }
  playRising(phase) {
    if (this.allow('rising', .045)) {
      this.effect('rising' + Math.max(0, Math.min(2, phase)), .95, 0, 0, 1);
      this.impactWeight(phase === 2, phase === 2 ? .95 : .75);
    }
  }
  playFlame(phase) {
    if (this.allow('flame-' + phase, .055)) {
      this.effect(phase === 'launch' ? 'fireLaunch' : 'fireHit', phase === 'launch' ? .78 : .95, 0, 0, 1);
      if (phase === 'hit') this.impactWeight(true, .95);
    }
  }
  playHit(style = 'light') {
    if (!this.allow('hit', 0.018)) return;
    if (!['block','justguard'].includes(style)) this.impactWeight(style !== 'light', style === 'light' ? .8 : .95);
    if (style === 'justguard') {
      this.effect(this.variant('metal'), 0.82, 0, 0, 1.18);
      this.effect('energy', 0.48, 0.16, 0.01, 1.28);
      for (const [i, n] of [84, 91].entries())
        this.note('bell', n, this.ctx.currentTime + i * 0.026, 0.26, 0.44, i ? 0.3 : -0.3, this.seGain, 'effect');
      return;
    }
    if (style === 'block') {
      this.effect(this.variant('metal'), 0.76, -0.06, 0, 1.08);
      this.effect(this.variant('wood'), 0.42, 0.1, 0.007, 1.12);
      return;
    }
    const effectLoad = [...this.active].filter((v) => v.group === 'effect').length;
    const pan = (this.random() - 0.5) * 0.24;
    const rateJitter = 0.96 + this.random() * 0.09;
    if (style === 'slash') {
      this.effect(this.variant('slash'), 1.0, pan, 0, rateJitter);
      this.effect(this.variant('heavy'), 0.54, -pan * 0.7, 0.008, 0.95);
      if (effectLoad < 14) {
        this.effect(this.variant('metal'), 0.28, -pan, 0.005, 1.36);
      }
      return;
    }
    if (style === 'light') {
      this.effect(this.variant('punch'), 1.0, pan, 0, rateJitter);
      if (effectLoad < 14) {
        this.effect('swing', 0.28, -pan, 0.004, 1.42);
      }
      return;
    }
    this.effect(this.variant('heavy'), 1.08, pan, 0, rateJitter);
    if (effectLoad < 14) {
      this.effect(this.variant('punch'), 0.38, -pan, 0.005, 1.18);
      this.effect('energy', 0.24, pan * 0.8, 0.012, 1.45);
    }
  }
  playGrapple(phase) {
    if (!this.allow('grapple-' + phase, 0.025)) return;
    if (phase === 'catch') {
      this.effect('catch', 1.0, -0.06);
      this.effect(this.variant('punch'), 0.34, 0.08, 0.008, 1.22);
    } else if (phase === 'release') {
      this.effect('swingHeavy', 1.14, -0.15, 0, 1.04);
      this.effect('swing', 0.42, 0.18, 0.015, 1.24);
    } else {
      this.impactWeight(true, .85);
      this.effect('landing', 1.08, 0);
      this.effect(this.variant('heavy'), 0.56, -0.15, 0.012, 0.86);
      this.effect(this.variant('wood'), 0.46, 0.2, 0.048, 0.92);
    }
  }
  playSuper() {
    if (!this.allow('super', 0.18)) return;
    this.effect('reverse', 0.82, -0.1);
    this.effect('energy', 1.02, 0.08, 0.05);
    this.effect(this.variant('heavy'), 0.72, -0.22, 0.07, 0.86);
    this.effect('crash', 0.36, 0.28, 0.085, 1.06);
  }
  synthWreck(context,rate,material){
    const glass=material==='glass',frame=material==='frame',tau=2*Math.PI;
    const modes=glass?[1051,1583,2557,3871]:frame?[62,106,179,278]:[117,223,357,613];
    return this.makeBuffer(context,rate,frame?1.03:glass?.79:.56,(t,i)=>{
      // Low chassis flex followed by uneven secondary fractures and damped plate modes.
      const bend=t+.010*(1-Math.exp(-35*t));
      let ring=0;
      for(let k=0;k<modes.length;k++)ring+=Math.sin(tau*modes[k]*bend)*Math.exp(-t*(6+k*2))/(1+k);
      const low=Math.sin(tau*((frame?44:58)*t+.85*(1-Math.exp(-30*t))))*Math.exp(-t*(frame?4.8:10));
      let tear=Math.exp(-t*90);
      for(const at of [.034,.087,.146,.232])if(t>=at)tear+=Math.exp(-(t-at)*(glass?65:40))*(1-at*2);
      const grit=this.noise(i,glass?191:frame?199:193)*tear;
      return Math.tanh(low*(glass?.53:1.35)+ring*.59+grit*(glass?1.1:.8))*.91;
    });
  }
  playWreck(side,stage,fracture,final){
    if(!this.allow('yard-hit',.018))return;
    const pan=side===0?-.46:.46, rate=.94+this.random()*.12;
    this.effect('yard-panel',fracture?.63:.82,pan,0,rate);
    this.effect('impactCrush',fracture?.72:.48,pan*.35,.012,fracture?.86:1.04);
    if(fracture){
      this.effect(stage===2?'yard-glass':'yard-frame',.85,pan,.039,rate);
      this.effect(this.variant('metal'),.38,-pan,.13,.82);
    }
    if(final){
      this.effect('yard-frame',1,0,.19,.70);
      this.effect('yard-glass',.65,-pan,.30,.88);
      this.effect('landing',.59,pan,.49,.68);
    }
  }
  playBreak(material = 'wood') {
    if (!this.allow('break', 0.035)) return;
    this.effect(this.variant(material === 'metal' ? 'metal' : 'wood'), 1.02, -0.08);
    this.effect(this.variant('heavy'), 0.54, 0.12, 0.01, 0.9);
    this.effect('landing', 0.38, -0.1, 0.022, 1.06);
  }
  playPickup(type) {
    if (!this.allow('pickup', 0.08)) return;
    const t = this.ctx.currentTime;
    if (type === 'pipe') {
      this.effect('metal0', 0.48, -0.1, 0, 1.18);
    }
    const notes = type === 'food' ? [67, 72, 76] : type === 'pipe' ? [55, 62] : [76, 83, 88];
    for (const [i, n] of notes.entries()) {
      this.note('keys', n, t + i * 0.055, 0.24, 0.36, i * 0.15 - 0.15, this.seGain, 'effect');
      this.note('bell', n + 12, t + i * 0.055, 0.2, 0.22, 0.15 - i * 0.15, this.seGain, 'effect');
    }
  }
  playCue(type) {
    if (!this.allow('cue-' + type, 0.4)) return;
    const t = this.ctx.currentTime;
    if (type === 'boss') {
      this.effect('reverse', 0.76);
      this.effect('energy', 0.82, 0, 0.22);
      for (const [i, n] of [36, 43, 48, 55].entries())
        this.note('brass', n + 12, t + 0.25, 0.78, 0.32, (i - 1.5) * 0.18, this.seGain, 'effect');
    } else if (type === 'clear' || type === 'extend') {
      for (const [i, n] of [60, 64, 67, 72, 76].entries()) {
        this.note('brass', n, t + i * 0.085, 0.4, 0.28, (i - 2) * 0.12, this.seGain, 'effect');
        this.note('bell', n + 12, t + i * 0.085, 0.32, 0.2, (2 - i) * 0.1, this.seGain, 'effect');
      }
    } else if (type === 'over') {
      this.effect('heavy2', 0.72, -0.1, 0, 0.78);
      this.effect('crash', 0.34, 0.15, 0.015, 0.88);
      for (const [i, n] of [55, 51, 48].entries())
        this.note('keys', n, t + i * 0.18, 0.52, 0.38, (i - 1) * 0.15, this.seGain, 'effect');
    } else {
      this.effect('catch', 0.68);
      this.effect(this.variant('metal'), 0.42, 0.1, 0.1, 1.08);
      this.effect('heavy0', 0.68, 0, 0.2, 0.92);
    }
  }
  announce(text) {
    this.playCue(/Congratulations/i.test(text) ? 'clear' : /K\.O|KO/i.test(text) ? 'over' : 'start');
  }
}
const sound = new SoundEngine();
if (typeof window !== 'undefined') {
  window.SoundEngine = SoundEngine;
  window.ARCADE_TRACKS = ARCADE_TRACKS;
  window.sound = sound;
}
