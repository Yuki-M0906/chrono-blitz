// v2.4 — Studio-grade multi-sampled FM / subtractive arcade soundtrack and physical-modeled Foley.
// No remote requests, sample licenses or game RNG. All PCM is built locally once per AudioContext.
const ARCADE_TRACKS = [
  {
    id: 0,
    name: 'NIGHT SIGNAL',
    bpm: 122,
    root: 50,
    scale: [0, 2, 3, 5, 7, 9, 10],
    prog: [0, 3, 6, 4, 0, 1, 3, 4],
    progB: [3, 6, 0, 4, 1, 3, 6, 4],
    lead: 'keys',
    sub: 'bell',
    style: 'noir',
    swing: 0.04
  },
  {
    id: 1,
    name: 'CRIMSON IGNITION',
    bpm: 136,
    root: 52,
    scale: [0, 2, 3, 5, 7, 8, 10],
    prog: [0, 5, 6, 0, 0, 5, 3, 6],
    progB: [5, 6, 2, 0, 5, 3, 6, 4],
    lead: 'guitar',
    sub: 'lead',
    style: 'rock',
    swing: 0
  },
  {
    id: 2,
    name: 'NEON CIRCUIT',
    bpm: 142,
    root: 57,
    scale: [0, 2, 3, 5, 7, 9, 10],
    prog: [0, 6, 3, 4, 0, 2, 3, 6],
    progB: [3, 6, 0, 4, 3, 1, 6, 4],
    lead: 'lead',
    sub: 'keys',
    style: 'cyber',
    swing: 0.02
  },
  {
    id: 3,
    name: 'FROZEN CROWN',
    bpm: 130,
    root: 54,
    scale: [0, 2, 3, 5, 7, 8, 10],
    prog: [0, 5, 2, 6, 0, 3, 5, 4],
    progB: [5, 2, 6, 0, 3, 5, 6, 4],
    lead: 'lead',
    sub: 'bell',
    style: 'royal',
    swing: 0
  },
  {
    id: 4,
    name: 'AMBER RUN',
    bpm: 146,
    root: 55,
    scale: [0, 2, 3, 5, 7, 9, 10],
    prog: [0, 6, 3, 6, 0, 2, 3, 4],
    progB: [3, 6, 2, 4, 0, 6, 3, 4],
    lead: 'lead',
    sub: 'guitar',
    style: 'ninja',
    swing: 0.03
  },
  {
    id: 5,
    name: 'BLACK VEIN / AFTER DARK',
    bpm: 138,
    root: 49,
    scale: [0, 2, 3, 5, 7, 8, 10],
    prog: [0, 5, 3, 4, 0, 6, 5, 4],
    progB: [3, 5, 0, 6, 3, 5, 6, 4],
    lead: 'guitar',
    sub: 'brass',
    style: 'industrial',
    swing: 0.04
  },
  {
    id: 6,
    name: 'IRON REIGN',
    bpm: 128,
    root: 48,
    scale: [0, 2, 3, 5, 7, 8, 10],
    prog: [0, 3, 5, 6, 0, 5, 3, 4],
    progB: [5, 3, 0, 6, 5, 2, 6, 4],
    lead: 'brass',
    sub: 'guitar',
    style: 'arena',
    swing: 0
  },
  {
    id: 7,
    name: 'BREAK THE DAWN',
    bpm: 152,
    root: 51,
    scale: [0, 2, 3, 5, 7, 8, 10],
    prog: [0, 5, 2, 6, 3, 5, 6, 4],
    progB: [5, 2, 6, 0, 5, 3, 6, 4],
    lead: 'guitar',
    sub: 'lead',
    style: 'boss',
    swing: 0
  }
];

const TRACK_COMPOSITIONS = [
  // 0: NIGHT SIGNAL — Neo-Noir Rhodes & Synth Lead (D Dorian, 122 BPM)
  {
    melA1: [
      [4, 3, 0.85, 1], null, null, [5, 2, 0.78, 1], null, [6, 3, 0.88, 1], null, null,
      [4, 2, 0.8, 1], null, [2, 2, 0.76, 1], null, [0, 4, 0.84, 1], null, null, null
    ],
    melA2: [
      [4, 3, 0.86, 1], null, null, [6, 2, 0.82, 1], null, [7, 3, 0.9, 1], null, null,
      [9, 2, 0.86, 1], null, [7, 2, 0.84, 1], null, [4, 4, 0.86, 1], null, null, null
    ],
    melB1: [
      [7, 2, 0.9, 1], null, [8, 2, 0.88, 1], null, [9, 3, 0.92, 1], null, null, [7, 1, 0.8, 1],
      [6, 2, 0.86, 1], null, [4, 2, 0.84, 1], null, [2, 3, 0.88, 1], null, null, [4, 1, 0.76, 1]
    ],
    melB2: [
      [6, 2, 0.88, 1], null, [7, 2, 0.9, 1], null, [9, 3, 0.94, 1], null, null, [6, 1, 0.82, 1],
      [4, 2, 0.86, 1], null, [2, 2, 0.84, 1], null, [7, 4, 0.92, 1], null, null, null
    ],
    arpDegs: [0, 2, 4, 6, 7, 6, 4, 2, 0, 2, 4, 7, 9, 7, 4, 2],
    bassRhythm: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1],
    bassDegs: [0, 0, 0, 4, 0, 0, 7, 0, 0, 0, 2, 0, 0, 4, 0, 6]
  },
  // 1: CRIMSON IGNITION — Protagonist Fighting Rock Anthem (E Aeolian, 136 BPM)
  {
    melA1: [
      [0, 2, 0.94, 1], null, [2, 1, 0.86, 1], [3, 1, 0.88, 1], [4, 3, 0.96, 1], null, null, [6, 1, 0.9, 1],
      [7, 2, 0.95, 1], null, [6, 2, 0.9, 1], null, [4, 3, 0.94, 1], null, null, [2, 1, 0.84, 1]
    ],
    melA2: [
      [4, 2, 0.95, 1], null, [6, 1, 0.9, 1], [7, 1, 0.92, 1], [9, 3, 0.98, 1], null, null, [8, 1, 0.92, 1],
      [7, 2, 0.95, 1], null, [4, 2, 0.9, 1], null, [7, 4, 0.96, 1], null, null, null
    ],
    melB1: [
      [7, 2, 0.96, 1], null, [9, 2, 0.98, 1], null, [7, 2, 0.94, 1], null, [6, 1, 0.9, 1], [4, 1, 0.88, 1],
      [7, 3, 0.95, 1], null, null, [4, 1, 0.88, 1], [2, 3, 0.92, 1], null, null, [4, 1, 0.9, 1]
    ],
    melB2: [
      [9, 2, 0.98, 1], null, [7, 2, 0.96, 1], null, [11, 3, 1.0, 1], null, null, [9, 1, 0.92, 1],
      [7, 2, 0.96, 1], null, [6, 2, 0.94, 1], null, [7, 4, 0.98, 1], null, null, null
    ],
    arpDegs: [0, 4, 7, 4, 9, 7, 4, 2, 0, 4, 7, 9, 7, 4, 2, 4],
    bassRhythm: [1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1],
    bassDegs: [0, 0, 0, 0, 4, 0, 7, 4, 0, 0, 0, 0, 4, 0, 2, 4]
  },
  // 2: NEON CIRCUIT — High-Speed Cyber Electro (A Dorian, 142 BPM)
  {
    melA1: [
      [7, 1, 0.9, 1], [4, 1, 0.78, 1], [2, 2, 0.88, 1], null, [4, 1, 0.86, 1], [7, 2, 0.92, 1], null, [6, 1, 0.88, 1],
      [4, 2, 0.94, 1], null, [2, 1, 0.86, 1], [4, 1, 0.86, 1], [7, 2, 0.9, 1], null, [4, 2, 0.86, 1], null
    ],
    melA2: [
      [7, 1, 0.9, 1], [4, 1, 0.82, 1], [9, 2, 0.92, 1], null, [7, 1, 0.9, 1], [6, 2, 0.94, 1], null, [4, 1, 0.88, 1],
      [7, 2, 0.92, 1], null, [4, 2, 0.9, 1], null, [9, 3, 0.96, 1], null, null, [7, 1, 0.86, 1]
    ],
    melB1: [
      [9, 2, 0.96, 1], null, [7, 1, 0.9, 1], [6, 2, 0.92, 1], null, [4, 1, 0.88, 1], [2, 2, 0.9, 1], null,
      [4, 1, 0.88, 1], [6, 1, 0.9, 1], [7, 2, 0.94, 1], null, [4, 2, 0.9, 1], null, [7, 2, 0.92, 1], null
    ],
    melB2: [
      [7, 1, 0.92, 1], [9, 1, 0.94, 1], [11, 2, 0.98, 1], null, [9, 2, 0.96, 1], null, [7, 2, 0.94, 1], null,
      [6, 2, 0.92, 1], null, [4, 1, 0.9, 1], [2, 1, 0.88, 1], [7, 4, 0.96, 1], null, null, null
    ],
    arpDegs: [0, 7, 4, 7, 2, 7, 4, 7, 0, 7, 4, 9, 7, 4, 2, 4],
    bassRhythm: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
    bassDegs: [0, 7, 7, 0, 0, 7, 7, 0, 0, 7, 7, 0, 4, 7, 4, 2]
  },
  // 3: FROZEN CROWN — Aristocratic Gothic-Symphonic Duel (F# Aeolian, 130 BPM)
  {
    melA1: [
      [0, 2, 0.88, 1], null, [2, 1, 0.84, 1], [4, 1, 0.86, 1], [7, 3, 0.94, 1], null, null, [6, 1, 0.88, 1],
      [4, 2, 0.9, 1], null, [2, 1, 0.84, 1], [4, 1, 0.86, 1], [2, 3, 0.9, 1], null, null, [0, 1, 0.82, 1]
    ],
    melA2: [
      [2, 2, 0.9, 1], null, [4, 1, 0.86, 1], [6, 1, 0.88, 1], [7, 3, 0.96, 1], null, null, [9, 1, 0.9, 1],
      [7, 2, 0.94, 1], null, [6, 1, 0.88, 1], [4, 1, 0.86, 1], [4, 4, 0.94, 1], null, null, null
    ],
    melB1: [
      [7, 2, 0.96, 1], null, [9, 1, 0.9, 1], [7, 1, 0.9, 1], [6, 2, 0.92, 1], null, [4, 2, 0.9, 1], null,
      [2, 2, 0.92, 1], null, [4, 1, 0.88, 1], [6, 1, 0.9, 1], [7, 3, 0.96, 1], null, null, [4, 1, 0.84, 1]
    ],
    melB2: [
      [9, 2, 0.98, 1], null, [11, 1, 0.94, 1], [9, 1, 0.92, 1], [7, 2, 0.94, 1], null, [4, 2, 0.92, 1], null,
      [6, 1, 0.88, 1], [4, 1, 0.88, 1], [2, 1, 0.9, 1], [4, 1, 0.9, 1], [7, 4, 0.98, 1], null, null, null
    ],
    arpDegs: [0, 2, 4, 7, 9, 7, 4, 2, 0, 2, 4, 7, 11, 7, 4, 2],
    bassRhythm: [1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0],
    bassDegs: [0, 0, 0, 4, 7, 0, 4, 0, 0, 0, 0, 4, 2, 0, 4, 0]
  },
  // 4: AMBER RUN — Kunoichi Rooftop Breakbeat Chase (G Dorian, 146 BPM)
  {
    melA1: [
      [0, 1, 0.88, 1], [2, 1, 0.86, 1], [4, 1, 0.88, 1], [7, 2, 0.94, 1], null, [6, 1, 0.9, 1], [4, 2, 0.94, 1], null,
      [6, 1, 0.88, 1], [4, 1, 0.86, 1], [2, 2, 0.9, 1], null, [0, 2, 0.86, 1], null, [2, 2, 0.88, 1], null
    ],
    melA2: [
      [4, 1, 0.9, 1], [6, 1, 0.88, 1], [7, 1, 0.92, 1], [9, 2, 0.96, 1], null, [7, 1, 0.9, 1], [4, 2, 0.94, 1], null,
      [9, 1, 0.94, 1], [7, 1, 0.9, 1], [4, 2, 0.92, 1], null, [7, 4, 0.96, 1], null, null, null
    ],
    melB1: [
      [9, 2, 0.96, 1], null, [7, 1, 0.9, 1], [6, 1, 0.9, 1], [4, 2, 0.92, 1], null, [7, 2, 0.94, 1], null,
      [2, 1, 0.86, 1], [4, 1, 0.88, 1], [7, 1, 0.92, 1], [9, 2, 0.96, 1], null, [7, 3, 0.92, 1], null, null
    ],
    melB2: [
      [11, 1, 0.96, 1], [9, 1, 0.94, 1], [7, 2, 0.94, 1], null, [9, 1, 0.94, 1], [7, 1, 0.9, 1], [4, 2, 0.9, 1], null,
      [2, 1, 0.88, 1], [4, 1, 0.9, 1], [9, 2, 0.96, 1], null, [7, 4, 0.98, 1], null, null, null
    ],
    arpDegs: [0, 2, 4, 7, 9, 7, 4, 2, 0, 4, 7, 9, 7, 4, 2, 4],
    bassRhythm: [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0],
    bassDegs: [0, 0, 4, 7, 0, 7, 0, 4, 0, 0, 2, 4, 0, 7, 4, 0]
  },
  // 5: BLACK VEIN / AFTER DARK — Dark Underground Industrial Groove (C# Aeolian, 138 BPM)
  {
    melA1: [
      [0, 2, 0.94, 1], null, [2, 2, 0.9, 1], null, [4, 1, 0.88, 1], [7, 2, 0.96, 1], null, [6, 1, 0.88, 1],
      [4, 2, 0.92, 1], null, [2, 2, 0.88, 1], null, [0, 3, 0.94, 1], null, null, [2, 1, 0.86, 1]
    ],
    melA2: [
      [0, 2, 0.94, 1], null, [4, 2, 0.92, 1], null, [7, 2, 0.96, 1], null, [9, 2, 0.94, 1], null,
      [7, 2, 0.94, 1], null, [6, 1, 0.88, 1], [4, 1, 0.88, 1], [4, 4, 0.96, 1], null, null, null
    ],
    melB1: [
      [7, 2, 0.98, 1], null, [9, 2, 0.94, 1], null, [7, 1, 0.92, 1], [6, 2, 0.94, 1], null, [4, 1, 0.9, 1],
      [2, 2, 0.94, 1], null, [4, 2, 0.92, 1], null, [0, 3, 0.92, 1], null, null, [4, 1, 0.9, 1]
    ],
    melB2: [
      [7, 1, 0.96, 1], [9, 1, 0.94, 1], [11, 2, 0.98, 1], null, [9, 2, 0.98, 1], null, [7, 2, 0.96, 1], null,
      [6, 2, 0.94, 1], null, [4, 2, 0.92, 1], null, [7, 4, 0.98, 1], null, null, null
    ],
    arpDegs: [0, 4, 7, 4, 2, 4, 7, 4, 0, 4, 7, 9, 7, 4, 2, 4],
    bassRhythm: [1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1],
    bassDegs: [0, 0, 0, 2, 0, 4, 7, 0, 0, 0, 0, 2, 0, 4, 2, 0]
  },
  // 6: IRON REIGN — Heavyweight Arena Gladiator Anthem (C Aeolian, 128 BPM)
  {
    melA1: [
      [0, 3, 0.96, 1], null, null, [2, 1, 0.9, 1], [4, 3, 0.98, 1], null, null, [6, 1, 0.92, 1],
      [7, 2, 0.96, 1], null, [4, 2, 0.92, 1], null, [2, 3, 0.96, 1], null, null, [4, 1, 0.88, 1]
    ],
    melA2: [
      [0, 3, 0.96, 1], null, null, [4, 1, 0.92, 1], [7, 3, 1.0, 1], null, null, [9, 1, 0.94, 1],
      [7, 2, 0.98, 1], null, [6, 2, 0.94, 1], null, [7, 4, 0.98, 1], null, null, null
    ],
    melB1: [
      [7, 3, 0.98, 1], null, null, [9, 1, 0.94, 1], [11, 3, 1.0, 1], null, null, [9, 1, 0.94, 1],
      [7, 2, 0.98, 1], null, [4, 2, 0.94, 1], null, [7, 3, 0.98, 1], null, null, [4, 1, 0.9, 1]
    ],
    melB2: [
      [9, 2, 1.0, 1], null, [7, 2, 0.96, 1], null, [11, 3, 1.02, 1], null, null, [9, 1, 0.96, 1],
      [7, 2, 0.96, 1], null, [4, 2, 0.94, 1], null, [7, 4, 1.0, 1], null, null, null
    ],
    arpDegs: [0, 2, 4, 7, 9, 7, 4, 2, 0, 2, 4, 7, 11, 7, 4, 2],
    bassRhythm: [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0],
    bassDegs: [0, 0, 0, 0, 4, 0, 7, 4, 0, 0, 0, 0, 2, 4, 7, 0]
  },
  // 7: BREAK THE DAWN — Final Boss Symphonic Speed-Rock Climax (D# Aeolian, 152 BPM)
  {
    melA1: [
      [7, 1, 0.94, 1], [4, 1, 0.88, 1], [2, 1, 0.9, 1], [4, 1, 0.92, 1], [7, 2, 0.98, 1], null, [9, 2, 1.0, 1], null,
      [7, 1, 0.94, 1], [6, 1, 0.92, 1], [4, 1, 0.9, 1], [2, 1, 0.88, 1], [4, 3, 0.94, 1], null, null, [2, 1, 0.88, 1]
    ],
    melA2: [
      [7, 1, 0.94, 1], [4, 1, 0.88, 1], [6, 1, 0.9, 1], [7, 1, 0.92, 1], [9, 2, 1.0, 1], null, [11, 2, 1.02, 1], null,
      [9, 1, 0.96, 1], [7, 1, 0.94, 1], [6, 1, 0.92, 1], [4, 1, 0.92, 1], [7, 4, 1.02, 1], null, null, null
    ],
    melB1: [
      [11, 2, 1.0, 1], null, [9, 1, 0.96, 1], [7, 1, 0.94, 1], [9, 2, 0.96, 1], null, [7, 2, 0.96, 1], null,
      [4, 2, 0.94, 1], null, [6, 1, 0.92, 1], [7, 1, 0.94, 1], [9, 3, 0.98, 1], null, null, [7, 1, 0.94, 1]
    ],
    melB2: [
      [11, 1, 1.0, 1], [9, 1, 0.96, 1], [7, 1, 0.96, 1], [9, 1, 0.98, 1], [11, 2, 1.02, 1], null, [9, 2, 0.98, 1], null,
      [7, 1, 0.96, 1], [6, 1, 0.94, 1], [4, 2, 0.96, 1], null, [7, 4, 1.0, 1], null, null, null
    ],
    arpDegs: [0, 4, 7, 9, 11, 9, 7, 4, 0, 2, 4, 7, 9, 7, 4, 2],
    bassRhythm: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    bassDegs: [0, 0, 7, 0, 4, 0, 7, 4, 0, 0, 7, 0, 2, 4, 6, 7]
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
    this.stats = { started: 0, ended: 0, dropped: 0, peakVoices: 0 };
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
    this.musicEQ.frequency.value = 2300;
    this.musicEQ.Q.value = 0.7;
    this.musicEQ.gain.value = -2.5;
    this.musicHigh = context.createBiquadFilter();
    this.musicHigh.type = 'highshelf';
    this.musicHigh.frequency.value = 6500;
    this.musicHigh.gain.value = -2.2;
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
    this.bgmGain.gain.value = this.muted ? 0 : this.bgmVol * this.musicLevel;
    this.seGain.gain.value = this.muted ? 0 : this.seVol * 0.74;
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
    const rate = this.ctx.sampleRate,
      n = Math.floor(rate * 0.85),
      b = this.ctx.createBuffer(2, n, rate);
    for (let channel = 0; channel < 2; channel++) {
      const d = b.getChannelData(channel);
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / rate;
        const raw = (this.random() * 2 - 1) * Math.exp(-t * 6.8) * 0.15;
        lp += (raw - lp) * (0.42 - 0.2 * (i / n));
        d[i] = i < rate * 0.015 ? 0 : lp;
      }
      for (const [time, level] of [
        [0.031, 0.34],
        [0.064, 0.22],
        [0.105, 0.13]
      ])
        d[Math.floor((time + channel * 0.007) * rate)] += level;
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
  synthImpact(context, rate, kind, variant = 0) {
    const dt = 1 / rate;
    const vScale = 1 + variant * 0.065;
    if (kind === 'punch') {
      let pBody = 0,
        pMid = 0,
        pWhip = 0,
        lp = 0,
        hp = 0;
      return this.makeBuffer(context, rate, 0.25, (t, i) => {
        const fWhip = (4200 * Math.exp(-t * 250) + 380) * vScale;
        const fMid = (175 + 640 * Math.exp(-t * 72)) * vScale;
        const fBody = (58 + 205 * Math.exp(-t * 42)) * vScale;
        pWhip += Math.PI * 2 * fWhip * dt;
        pMid += Math.PI * 2 * fMid * dt;
        pBody += Math.PI * 2 * fBody * dt;
        const whip = Math.sin(pWhip + Math.sin(pWhip * 1.8) * 0.9) * Math.exp(-t * 115) * 0.58;
        const chest = Math.sin(pBody + Math.sin(pBody * 2) * 0.35 * Math.exp(-t * 28)) * Math.exp(-t * 14.5) * 0.88;
        const crack =
          Math.sin(pMid + Math.sin(pBody * 2.6) * 1.45 * Math.exp(-t * 34)) * Math.exp(-t * 28) * 0.66;
        const raw = this.noise(i, 37 + variant * 7);
        lp += (raw - lp) * 0.62;
        hp += (lp - hp) * 0.11;
        const snapEnv =
          Math.exp(-t * 88) * 0.96 +
          (t > 0.007 ? Math.exp(-(t - 0.007) * 32) * 0.42 : 0) +
          0.22 * Math.exp(-t * 22);
        const spark =
          Math.sin(Math.PI * 2 * 3350 * vScale * t + raw * 1.7) * Math.exp(-t * 92) * 0.34;
        const snap = (lp - hp) * snapEnv + spark;
        return Math.tanh((whip + chest + crack + snap) * 1.88) * 0.92;
      });
    }
    if (kind === 'heavy') {
      let pSub = 0,
        pCrunch = 0,
        pBite = 0,
        pCrack = 0,
        ic1 = 0,
        ic2 = 0;
      return this.makeBuffer(context, rate, 0.44, (t, i) => {
        const fCrack = (4800 * Math.exp(-t * 210) + 320) * vScale;
        const fBite = (290 + 880 * Math.exp(-t * 58)) * vScale;
        const fCrunch = (92 + 440 * Math.exp(-t * 38)) * vScale;
        const fSub = (40 + 185 * Math.exp(-t * 28)) * vScale;
        pCrack += Math.PI * 2 * fCrack * dt;
        pBite += Math.PI * 2 * fBite * dt;
        pCrunch += Math.PI * 2 * fCrunch * dt;
        pSub += Math.PI * 2 * fSub * dt;
        const crackSnap =
          Math.sin(pCrack + Math.sin(pCrack * 1.7) * 1.1) *
          (Math.exp(-t * 95) * 0.64 + (t > 0.012 ? Math.exp(-(t - 0.012) * 78) * 0.48 : 0));
        const sub = Math.sin(pSub + 0.35 * Math.sin(pSub * 2)) * Math.exp(-t * 7.6) * 0.96;
        const crunch =
          Math.sin(pCrunch + Math.sin(pSub * 3.4) * 1.85 * Math.exp(-t * 16)) * Math.exp(-t * 12) * 0.72 +
          Math.sin(pBite + Math.sin(pCrunch * 2.1) * 1.3) * Math.exp(-t * 26) * 0.52;
        const raw = this.noise(i, 53 + variant * 11);
        const cutoff = Math.max(480, Math.min(rate * 0.43, 4400 * Math.exp(-t * 20) + 680));
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
        const shockEnv =
          Math.exp(-t * 50) * 0.92 + (t > 0.013 ? Math.exp(-(t - 0.013) * 21) * 0.68 : 0);
        const spark =
          (Math.sin(Math.PI * 2 * 3950 * vScale * t + raw * 1.6) * 0.28 +
            Math.sin(Math.PI * 2 * 5680 * vScale * t + raw * 1.2) * 0.18) *
          (Math.exp(-t * 72) + (t > 0.013 ? Math.exp(-(t - 0.013) * 48) * 0.65 : 0));
        const shock = (v1 * 0.95 + (raw - v2) * 0.38) * shockEnv + spark;
        return Math.tanh((crackSnap + sub + crunch + shock) * 1.92) * 0.94;
      });
    }
    if (kind === 'slash') {
      let pBody = 0,
        pEdge = 0,
        ic1 = 0,
        ic2 = 0;
      const bladeModes = [2280, 3420, 4860, 6480, 7950].map((f) => f * vScale);
      return this.makeBuffer(context, rate, 0.32, (t, i) => {
        const fEdge = (6400 * Math.exp(-t * 88) + 1420) * vScale;
        const fBody = (54 + 190 * Math.exp(-t * 38)) * vScale;
        pEdge += Math.PI * 2 * fEdge * dt;
        pBody += Math.PI * 2 * fBody * dt;
        const schwing = Math.sin(pEdge + Math.sin(pEdge * 1.5) * 0.85) * Math.exp(-t * 48) * 0.56;
        const cleave = Math.sin(pBody + Math.sin(pBody * 2.2) * 0.8 * Math.exp(-t * 28)) * Math.exp(-t * 16.5) * 0.72;
        const raw = this.noise(i, 71 + variant * 13);
        const cutoff = Math.max(580, Math.min(rate * 0.44, 6200 * Math.exp(-t * 17) + 640));
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
        const swishEnv = Math.exp(-t * 14) * 1.05 + (t > 0.008 ? Math.exp(-(t - 0.008) * 28) * 0.52 : 0);
        const swish = (v1 * 1.08 + (raw - v2) * 0.32) * swishEnv;
        const glide = 1 + 0.062 * Math.exp(-t * 36);
        let steel = 0;
        for (let m = 0; m < bladeModes.length; m++) {
          const mf = bladeModes[m] * glide;
          steel +=
            Math.sin(Math.PI * 2 * mf * t + this.noise(i, m + 9) * 0.42 * Math.exp(-t * 44)) *
            Math.exp(-t * (19 + m * 5.2)) *
            (0.28 / (1 + m * 0.2));
        }
        return Math.tanh((schwing + swish + steel + cleave) * 1.82) * 0.93;
      });
    }
    if (kind === 'metal') {
      let pKnock = 0,
        pPing = 0,
        ic1 = 0,
        ic2 = 0;
      const modes = [1180, 1590, 2120, 2780, 3540, 4480, 5620, 6940].map((f) => f * vScale);
      const weights = [0.24, 0.22, 0.2, 0.18, 0.16, 0.13, 0.11, 0.09];
      return this.makeBuffer(context, rate, 0.32, (t, i) => {
        const fPing = (5200 * Math.exp(-t * 175) + 1240) * vScale;
        const fKnock = (74 + 165 * Math.exp(-t * 46)) * vScale;
        pPing += Math.PI * 2 * fPing * dt;
        pKnock += Math.PI * 2 * fKnock * dt;
        const ping = Math.sin(pPing) * Math.exp(-t * 72) * 0.46;
        const knock = Math.sin(pKnock) * Math.exp(-t * 24) * 0.58;
        const raw = this.noise(i, 89 + variant * 17);
        const cutoff = Math.max(950, Math.min(rate * 0.43, 4800 * Math.exp(-t * 22) + 1450));
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
        const strikeBurst =
          v1 * (Math.exp(-t * 52) * 0.98 + (t > 0.008 ? Math.exp(-(t - 0.008) * 38) * 0.62 : 0));
        const fmChaos =
          (Math.sin(Math.PI * 2 * 1840 * vScale * t) * 2.0 + raw * 0.85) * Math.exp(-t * 32);
        let clang = 0;
        for (let m = 0; m < modes.length; m++) {
          const damp = 18.5 + m * 4.4;
          clang +=
            Math.sin(Math.PI * 2 * modes[m] * t + fmChaos * (0.55 + m * 0.14)) *
            Math.exp(-t * damp) *
            weights[m];
        }
        return Math.tanh((ping + knock + strikeBurst + clang * 1.22) * 1.78) * 0.92;
      });
    }
    let pBox1 = 0,
      pBox2 = 0,
      ic1 = 0,
      ic2 = 0;
    return this.makeBuffer(context, rate, 0.28, (t, i) => {
      const f1 = (76 + 145 * Math.exp(-t * 48)) * vScale;
      const f2 = (158 + 240 * Math.exp(-t * 54)) * vScale;
      pBox1 += Math.PI * 2 * f1 * dt;
      pBox2 += Math.PI * 2 * f2 * dt;
      const boxThud = (Math.sin(pBox1) * 0.74 + Math.sin(pBox2) * 0.48) * Math.exp(-t * 30) * 0.76;
      const raw = this.noise(i, 107 + variant * 19);
      const cutoff = (1950 + 1650 * Math.exp(-t * 26)) * vScale;
      const g = Math.tan((Math.PI * Math.min(rate * 0.43, cutoff)) / rate);
      const k = 0.58;
      const a1 = 1 / (1 + g * (g + k));
      const a2 = g * a1;
      const a3 = g * a2;
      const v3 = raw - ic2;
      const v1 = a1 * ic1 + a2 * v3;
      const v2 = ic2 + a2 * ic1 + a3 * v3;
      ic1 = 2 * v1 - ic1;
      ic2 = 2 * v2 - ic2;
      const cracks =
        Math.exp(-t * 78) * 1.0 +
        (t > 0.009 ? Math.exp(-(t - 0.009) * 92) * 0.82 : 0) +
        (t > 0.021 ? Math.exp(-(t - 0.021) * 105) * 0.66 : 0) +
        (t > 0.036 ? Math.exp(-(t - 0.036) * 118) * 0.48 : 0) +
        (t > 0.052 ? Math.exp(-(t - 0.052) * 130) * 0.34 : 0);
      const grain =
        (Math.sin(Math.PI * 2 * 680 * vScale * t + raw * 1.2) * 0.38 +
          Math.sin(Math.PI * 2 * 1420 * vScale * t + raw * 0.9) * 0.26) *
        Math.exp(-t * 42);
      return Math.tanh((boxThud + v1 * cracks * 1.35 + grain) * 1.78) * 0.91;
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
      const f = 58 + 175 * Math.exp(-t * 38);
      const fSnap = 420 + 2100 * Math.exp(-t * 140);
      p1 += Math.PI * 2 * f * dt;
      pSnap += Math.PI * 2 * fSnap * dt;
      const thud = Math.sin(p1) * Math.exp(-t * 15) * 0.78;
      const gripSnap = Math.sin(pSnap) * Math.exp(-t * 68) * 0.46;
      const raw = this.noise(i, 73);
      lp += (raw - lp) * 0.52;
      hp += (lp - hp) * 0.09;
      const cloth =
        (lp - hp) * (Math.exp(-t * 48) * 0.92 + (t > 0.018 ? Math.exp(-(t - 0.018) * 34) * 0.72 : 0));
      const slap =
        t > 0.014 ? Math.sin(Math.PI * 2 * 440 * (t - 0.014)) * Math.exp(-(t - 0.014) * 44) * 0.42 : 0;
      return Math.tanh((thud + gripSnap + cloth + slap) * 1.75) * 0.91;
    });
  }
  synthLanding(context, rate) {
    let p1 = 0,
      p2 = 0,
      pCrack = 0,
      lp = 0;
    const dt = 1 / rate;
    return this.makeBuffer(context, rate, 0.56, (t, i) => {
      const f1 = 42 + 135 * Math.exp(-t * 28);
      const fCrack = 260 + 1850 * Math.exp(-t * 110);
      p1 += Math.PI * 2 * f1 * dt;
      pCrack += Math.PI * 2 * fCrack * dt;
      const heel = Math.sin(p1 + 0.3 * Math.sin(p1 * 2)) * Math.exp(-t * 8.5) * 0.88;
      const slamCrack = Math.sin(pCrack) * Math.exp(-t * 58) * 0.48;
      let sole = 0;
      if (t >= 0.018) {
        const ts = t - 0.018;
        const f2 = 58 + 140 * Math.exp(-ts * 32);
        p2 += Math.PI * 2 * f2 * dt;
        sole = Math.sin(p2) * Math.exp(-ts * 10.5) * 0.66;
      }
      const raw = this.noise(i, 89);
      lp += (raw - lp) * 0.42;
      const grit =
        (lp * 0.75 + raw * 0.25) *
        (Math.exp(-t * 26) * 0.62 + (t >= 0.018 ? Math.exp(-(t - 0.018) * 16) * 0.54 : 0));
      return Math.tanh((heel + slamCrack + sole + grit) * 1.72) * 0.92;
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

    for (const d of ['kick', 'snare', 'hat', 'openhat', 'clap', 'tom', 'crash']) {
      addBank(d, () => this.synthDrum(context, rate, d));
    }
    addBank('bass', () => this.synthInstrument(context, rate, 'bass', 36, 0.56));
    addBank('guitar', () => this.synthInstrument(context, rate, 'guitar', 60, 0.68));
    addBank('keys', () => this.synthInstrument(context, rate, 'keys', 60, 0.56));
    addBank('pad', () => this.synthInstrument(context, rate, 'pad', 60, 0.92));
    addBank('lead', () => this.synthInstrument(context, rate, 'lead', 60, 0.62));
    addBank('bell', () => this.synthInstrument(context, rate, 'bell', 72, 0.64));
    addBank('brass', () => this.synthInstrument(context, rate, 'brass', 60, 0.66));

    for (const midi of [31, 36, 41, 46, 51]) {
      addNote(`bass:${midi}`, () => this.synthInstrument(context, rate, 'bass', midi, 0.56));
    }
    for (const kind of ['guitar', 'lead', 'keys', 'brass', 'pad', 'bell']) {
      const dur = kind === 'pad' ? 0.92 : kind === 'guitar' || kind === 'brass' ? 0.66 : 0.6;
      for (const midi of [48, 54, 60, 66, 72, 78, 84]) {
        addNote(`${kind}:${midi}`, () => this.synthInstrument(context, rate, kind, midi, dur));
      }
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
    this.seGain.gain.setTargetAtTime(this.muted ? 0 : this.seVol * 0.74, this.ctx.currentTime, 0.02);
    this.duckMusic(this.ducked);
    if (this.voiceBound && typeof fighterVoice !== 'undefined') {
      fighterVoice.updateVolume();
      fighterVoice.duck();
    }
  }
  sample(keyOrBuffer, t, volume = 1, rate = 1, pan = 0, duration = null, bus = null, group = 'music') {
    const buffer = typeof keyOrBuffer === 'string' ? this.bank.get(keyOrBuffer) : keyOrBuffer;
    if (!buffer || !Number.isFinite(t)) return;
    if (!this.offline && this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
      this.ctx.resume();
    }
    const cap = group === 'music' ? 72 : 32;
    if (!this.offline && [...this.active].filter((v) => v.group === group).length >= cap) {
      this.stats.dropped++;
      return;
    }
    const clampedRate = Math.max(0.25, Math.min(4, rate));
    const at = Math.max(this.ctx.currentTime, t),
      maxDur = buffer.duration / clampedRate,
      length = Math.min(maxDur, duration ?? maxDur),
      release = Math.min(0.08, length * 0.3);
    const source = this.ctx.createBufferSource(),
      gain = this.ctx.createGain(),
      panner = this.ctx.createStereoPanner();
    source.buffer = buffer;
    source.playbackRate.value = clampedRate;
    panner.pan.value = Math.max(-1, Math.min(1, pan));
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
    let buffer = null;
    let base = name === 'bass' ? 36 : name === 'bell' ? 72 : 60;
    if (this.noteBank && this.noteBank.size) {
      const pitches = name === 'bass' ? [31, 36, 41, 46, 51] : [48, 54, 60, 66, 72, 78, 84];
      let best = pitches[0];
      let bestDist = Math.abs(midi - best);
      for (let i = 1; i < pitches.length; i++) {
        const d = Math.abs(midi - pitches[i]);
        if (d < bestDist) {
          best = pitches[i];
          bestDist = d;
        }
      }
      const candidate = this.noteBank.get(`${name}:${best}`);
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
      this.degreeToSemi(cfg.scale, deg + 6)
    ];
  }
  score(track, step) {
    const cfg = typeof track === 'object' ? track : ARCADE_TRACKS[track] || ARCADE_TRACKS[0];
    const trackId = cfg.id ?? (typeof track === 'number' ? track : 0);
    const events = [];
    const s = step % 16;
    const bar = Math.floor(step / 16) % 32;
    const section = Math.floor(bar / 8);
    const isIntro = bar < 2;
    const isBreakdown = bar >= 16 && bar < 18;
    const isClimax = section === 1 || section === 3 || bar >= 22;
    const isFill = bar % 8 === 7 && s >= 12;
    const isLastBar = bar === 31;
    const maxLen = isLastBar ? Math.max(1, 16 - s) : 12;
    const unit = 60 / cfg.bpm / 4;

    const note = (instrument, midi, length, volume, pan = 0) =>
      events.push({ instrument, midi, duration: Math.max(0.06, length * unit), volume, pan });
    const drum = (instrument, volume, pan = 0, rate = 1) =>
      events.push({ instrument, midi: null, duration: null, volume, pan, rate });

    const comp = TRACK_COMPOSITIONS[trackId] || TRACK_COMPOSITIONS[0];
    const progList = section === 1 || section === 3 ? cfg.progB || cfg.prog : cfg.prog;
    const chordDeg = progList[bar % progList.length];
    const chord = this.chordSemis(cfg, bar);

    // 1. DRUMS — Style-specific arcade drum grooves
    if (s === 0 && (bar % 4 === 0 || (isClimax && bar % 2 === 0))) {
      drum('crash', isLastBar ? 0.19 : 0.24, -0.22);
    }

    if (cfg.style === 'noir') {
      if (s === 0 || s === 6 || s === 10 || (s === 14 && bar % 2 === 1)) {
        drum('kick', 0.48);
      }
      if (s === 4 || s === 12) {
        drum('snare', 0.35, 0.05);
        if (s === 12 && isClimax) drum('clap', 0.18, -0.1);
      }
      if (s % 2 === 0) {
        drum(s === 10 ? 'openhat' : 'hat', s === 10 ? 0.16 : 0.12, 0.2);
      } else if (s === 7 || s === 15) {
        drum('hat', 0.09, -0.18);
      }
    } else if (cfg.style === 'cyber') {
      if (s % 4 === 0 || (s === 14 && bar % 2 === 1)) {
        drum('kick', 0.52);
      }
      if (s === 4 || s === 12) {
        drum('snare', 0.38, 0.04);
        drum('clap', 0.2, -0.08);
      }
      if (s % 4 === 2) {
        drum('openhat', 0.17, 0.22);
      } else {
        drum('hat', s % 2 === 0 ? 0.12 : 0.09, (s % 2 ? -1 : 1) * 0.18);
      }
    } else if (cfg.style === 'ninja') {
      if (s === 0 || s === 3 || s === 6 || s === 10 || (s === 13 && bar % 2 === 1)) {
        drum('kick', 0.5);
      }
      if (s === 4 || s === 12 || (s === 9 && !isIntro)) {
        drum('snare', s === 9 ? 0.22 : 0.39, 0.06);
      }
      drum(s === 14 ? 'openhat' : 'hat', s === 14 ? 0.17 : s % 2 === 0 ? 0.13 : 0.09, (s % 2 ? -1 : 1) * 0.2);
    } else if (cfg.style === 'boss') {
      if (s % 2 === 0 || s === 3 || s === 11 || s === 15) {
        drum('kick', s % 4 === 0 ? 0.52 : 0.4);
      }
      if (s === 4 || s === 12 || (s === 14 && bar % 2 === 1)) {
        drum('snare', s === 14 ? 0.26 : 0.42, 0.06);
      }
      drum(s === 6 || s === 14 ? 'openhat' : 'hat', s % 2 === 0 ? 0.14 : 0.09, 0.22);
    } else {
      const kickPattern =
        cfg.style === 'industrial'
          ? [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1]
          : cfg.style === 'arena'
            ? [1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0]
            : [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0];
      if (kickPattern[s]) {
        drum('kick', 0.5);
      }
      if (s === 4 || s === 12) {
        drum('snare', 0.39, 0.05);
        if (cfg.style === 'industrial' || (cfg.style === 'arena' && s === 12)) {
          drum('clap', 0.2, -0.1);
        }
      }
      if (s % 2 === 0 || isClimax) {
        drum(s === 14 && bar % 2 === 1 ? 'openhat' : 'hat', s % 2 === 0 ? 0.13 : 0.09, (s % 2 ? -1 : 1) * 0.19);
      }
    }

    if (isFill) {
      const rate = 1.24 - (s - 12) * 0.09;
      drum('tom', 0.32, (s - 13.5) * 0.18, rate);
      if (s === 15) drum('snare', 0.36, 0.08);
    }

    // 2. BASSLINE — 100% Diatonic to current chord degree
    if (comp.bassRhythm[s]) {
      const bDeg = comp.bassDegs[s] || 0;
      const bassSemi = this.degreeToSemi(cfg.scale, chordDeg + bDeg);
      const bassMidi = cfg.root - 12 + bassSemi;
      const bassLen = Math.min(maxLen, comp.bassRhythm[(s + 1) % 16] ? 1.05 : 1.85);
      note('bass', bassMidi, bassLen, s % 4 === 0 ? 0.29 : 0.24, -0.05);
    }

    // 3. HARMONIC PAD & RHYTHM STABS — Diatonic triads & 7th voicings
    if (s === 0 || s === 8) {
      const padLen = Math.min(maxLen, isLastBar ? 6 : 7.5);
      const padNotes = [cfg.root + chord[0], cfg.root + chord[1], cfg.root + chord[2]];
      padNotes.forEach((midi, idx) => {
        note(
          s === 0 && (cfg.style === 'royal' || cfg.style === 'arena') && idx > 0 ? 'brass' : 'pad',
          midi,
          padLen,
          0.09 - idx * 0.008,
          (idx - 1) * 0.22
        );
      });
    }

    if (!isIntro && (s === 0 || s === 3 || s === 6 || s === 10 || s === 12)) {
      const stabInst =
        cfg.style === 'noir' ? 'keys' : cfg.style === 'royal' || cfg.style === 'arena' ? 'brass' : 'guitar';
      const stabLen = Math.min(maxLen, s === 6 || s === 12 ? 2.1 : 1.35);
      note(stabInst, cfg.root + (s === 6 ? chord[1] : chord[0]), stabLen, isBreakdown ? 0.1 : 0.145, -0.28);
      note(stabInst, cfg.root + chord[2], stabLen, isBreakdown ? 0.09 : 0.125, 0.28);
    }

    // 4. ARPEGGIO / COUNTER-MELODY — 100% Diatonic chord-relative scale degrees
    const arpActive = !isBreakdown || s % 2 === 0;
    if (arpActive && (s % 2 === 0 || isClimax || cfg.style === 'cyber' || cfg.style === 'boss')) {
      const arpDeg = comp.arpDegs[s];
      const arpSemi = this.degreeToSemi(cfg.scale, chordDeg + arpDeg);
      const arpInst = s % 4 === 0 && cfg.sub !== 'bell' ? 'bell' : cfg.sub;
      note(arpInst, cfg.root + arpSemi, Math.min(maxLen, 1.35), s % 4 === 0 ? 0.135 : 0.105, (s % 4 < 2 ? 1 : -1) * 0.32);
    }

    // 5. LEAD MELODY & HARMONY — Diatonic scale degrees with chord-tone lock
    if (!isIntro) {
      const phrase =
        isClimax
          ? bar % 2 === 0
            ? comp.melB1
            : comp.melB2
          : bar % 2 === 0
            ? comp.melA1
            : comp.melA2;
      const stepNote = phrase[s];
      if (stepNote) {
        const [degOffset, rawLen, vel, isChordRel] = stepNote;
        const noteLen = Math.min(maxLen, rawLen);
        const totalDeg = isChordRel ? chordDeg + degOffset : degOffset;
        const semi = this.degreeToSemi(cfg.scale, totalDeg);
        const octaveShift = isBreakdown ? 0 : 12;
        const leadMidi = cfg.root + octaveShift + semi;
        const leadGain = (isBreakdown ? 0.16 : isClimax ? 0.24 : 0.205) * (vel || 0.9);
        note(cfg.lead, leadMidi, noteLen, leadGain, 0.12);

        if (isClimax && !isBreakdown) {
          const harmDeg = cfg.style === 'noir' || cfg.style === 'cyber' ? totalDeg - 7 : totalDeg - 2;
          const harmMidi = cfg.root + octaveShift + this.degreeToSemi(cfg.scale, harmDeg);
          note(cfg.sub, harmMidi, Math.min(maxLen, noteLen * 0.92), leadGain * 0.55, -0.22);
        }
      }
    }

    return events;
  }
  tick(track, step, t) {
    const cfg = ARCADE_TRACKS[track];
    if (!cfg) return;
    const swung = t + (step % 2 ? ((cfg.swing || 0) * 60) / cfg.bpm / 4 : 0);
    for (const event of this.score(track, step)) {
      if (event.midi === null) this.sample(event.instrument, swung, event.volume, event.rate || 1, event.pan);
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
  playHit(style = 'light') {
    if (!this.allow('hit', 0.018)) return;
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
