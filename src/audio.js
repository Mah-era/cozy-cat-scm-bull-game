// Procedural Web Audio engine: cozy lo-fi music + game SFX, no external files.

let ctx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let musicTimer = null;

// Separate music / SFX mute preferences (legacy "bullwhip-muted" migrates to both)
const legacyMuted = localStorage.getItem("bullwhip-muted") === "true";
let musicMuted = (localStorage.getItem("bullwhip-music-muted") ?? String(legacyMuted)) === "true";
let sfxMuted = (localStorage.getItem("bullwhip-sfx-muted") ?? String(legacyMuted)) === "true";

const MUSIC_LEVEL = 0.16;
const SFX_LEVEL = 0.5;

function ensureContext() {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx = new AudioCtx();
  masterGain = ctx.createGain();
  masterGain.gain.value = 1;
  masterGain.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = musicMuted ? 0 : MUSIC_LEVEL;
  musicGain.connect(masterGain);
  sfxGain = ctx.createGain();
  sfxGain.gain.value = sfxMuted ? 0 : SFX_LEVEL;
  sfxGain.connect(masterGain);
  return ctx;
}

export function isMusicMuted() {
  return musicMuted;
}

export function isSfxMuted() {
  return sfxMuted;
}

export function toggleMusicMute() {
  musicMuted = !musicMuted;
  localStorage.setItem("bullwhip-music-muted", String(musicMuted));
  if (musicGain && ctx) {
    musicGain.gain.setTargetAtTime(musicMuted ? 0 : MUSIC_LEVEL, ctx.currentTime, 0.05);
  }
  return musicMuted;
}

export function toggleSfxMute() {
  sfxMuted = !sfxMuted;
  localStorage.setItem("bullwhip-sfx-muted", String(sfxMuted));
  if (sfxGain && ctx) {
    sfxGain.gain.setTargetAtTime(sfxMuted ? 0 : SFX_LEVEL, ctx.currentTime, 0.05);
  }
  return sfxMuted;
}

function tone({ freq = 440, type = "sine", dur = 0.2, gain = 0.3, when = 0, glide = 0, bus = "sfx" }) {
  const c = ensureContext();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + glide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(bus === "music" ? musicGain : sfxGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise({ dur = 0.15, gain = 0.2, when = 0, filterFreq = 1800 }) {
  const c = ensureContext();
  if (!c) return;
  const t0 = c.currentTime + when;
  const buffer = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(sfxGain);
  src.start(t0);
}

export const sfx = {
  click() {
    tone({ freq: 620, type: "triangle", dur: 0.08, gain: 0.18 });
  },
  select() {
    tone({ freq: 520, type: "triangle", dur: 0.09, gain: 0.2 });
    tone({ freq: 780, type: "triangle", dur: 0.12, gain: 0.16, when: 0.06 });
  },
  confirm() {
    [523, 659, 784, 1047].forEach((f, i) =>
      tone({ freq: f, type: "triangle", dur: 0.22, gain: 0.2, when: i * 0.08 })
    );
  },
  coin() {
    tone({ freq: 988, type: "square", dur: 0.07, gain: 0.1 });
    tone({ freq: 1319, type: "square", dur: 0.18, gain: 0.1, when: 0.07 });
  },
  stamp() {
    noise({ dur: 0.12, gain: 0.4, filterFreq: 900 });
    tone({ freq: 130, type: "sine", dur: 0.14, gain: 0.35 });
  },
  warning() {
    tone({ freq: 330, type: "sawtooth", dur: 0.16, gain: 0.12 });
    tone({ freq: 262, type: "sawtooth", dur: 0.24, gain: 0.12, when: 0.14 });
  },
  crisis() {
    [330, 262, 208].forEach((f, i) =>
      tone({ freq: f, type: "sawtooth", dur: 0.2, gain: 0.13, when: i * 0.13 })
    );
  },
  whoosh() {
    noise({ dur: 0.28, gain: 0.22, filterFreq: 2600 });
  },
  meow() {
    tone({ freq: 660, type: "sawtooth", dur: 0.28, gain: 0.08, glide: 240 });
    tone({ freq: 662, type: "triangle", dur: 0.28, gain: 0.12, glide: 230 });
  },
  fanfare() {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) =>
      tone({ freq: f, type: "triangle", dur: 0.3, gain: 0.2, when: i * 0.12 })
    );
    [262, 330, 392].forEach((f, i) =>
      tone({ freq: f, type: "sine", dur: 0.9, gain: 0.12, when: 0.36 + i * 0.02 })
    );
  },
  goal() {
    [784, 988, 1175].forEach((f, i) =>
      tone({ freq: f, type: "triangle", dur: 0.2, gain: 0.18, when: i * 0.09 })
    );
  }
};

// ---- Cozy lo-fi music loop ----
// Chord progression: Fmaj7 - Am7 - Dm7 - G7 (cafe classic), soft arpeggios on top.
const CHORDS = [
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
  [220.0, 261.63, 329.63, 392.0],  // Am7
  [146.83, 220.0, 261.63, 349.23], // Dm7
  [196.0, 246.94, 293.66, 392.0]   // G7
];

function playBar(chordIndex) {
  const chord = CHORDS[chordIndex % CHORDS.length];
  // Warm pad
  chord.forEach((f) => {
    tone({ freq: f, type: "sine", dur: 3.6, gain: 0.06, bus: "music" });
    tone({ freq: f * 2, type: "sine", dur: 3.4, gain: 0.02, bus: "music" });
  });
  // Gentle arpeggio (skip some notes randomly for a human feel)
  const arp = [...chord.map((f) => f * 2), chord[2] * 2, chord[1] * 2];
  arp.forEach((f, i) => {
    if (Math.random() < 0.22) return;
    tone({ freq: f, type: "triangle", dur: 0.5, gain: 0.045, when: 0.2 + i * 0.55, bus: "music" });
  });
  // Soft bass pluck on 1 and 3
  tone({ freq: chord[0] / 2, type: "sine", dur: 0.8, gain: 0.09, when: 0, bus: "music" });
  tone({ freq: chord[0] / 2, type: "sine", dur: 0.8, gain: 0.07, when: 1.8, bus: "music" });
}

export function startMusic() {
  const c = ensureContext();
  if (!c || musicTimer) return;
  if (c.state === "suspended") c.resume();
  let bar = 0;
  playBar(bar++);
  musicTimer = setInterval(() => playBar(bar++), 3600);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}
