// Música y efectos sintetizados con Web Audio: no hay archivos de audio externos,
// así que todo el sonido es de autoría propia (sin problemas de licencia).
let ctx = null;
let master = null;
let musicTimer = null;

export function initAudio() {
  if (ctx) return ctx.resume();
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0.6;
  master.connect(ctx.destination);
}

function tone(freq, start, dur, { type = 'square', vol = 0.15, slide = 0 } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, start + dur);
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(master);
  o.start(start);
  o.stop(start + dur + 0.02);
}

function noise(start, dur, vol = 0.2) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  g.gain.value = vol;
  src.buffer = buf;
  src.connect(g).connect(master);
  src.start(start);
}

const SFX = {
  click: t => tone(880, t, 0.06, { vol: 0.08 }),
  correcto: t => [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.07, 0.18, { type: 'triangle', vol: 0.2 })),
  error: t => { tone(180, t, 0.35, { type: 'sawtooth', vol: 0.18, slide: 0.5 }); noise(t, 0.15, 0.1); },
  salto: t => tone(330, t, 0.16, { type: 'square', vol: 0.1, slide: 2 }),
  moneda: t => { tone(988, t, 0.08, { vol: 0.12 }); tone(1319, t + 0.08, 0.2, { vol: 0.12 }); },
  golpe: t => { noise(t, 0.2, 0.3); tone(110, t, 0.2, { type: 'sine', vol: 0.3, slide: 0.5 }); },
  fin: t => [784, 659, 523, 392].forEach((f, i) => tone(f, t + i * 0.18, 0.3, { type: 'triangle', vol: 0.2 })),
};

export function sfx(name) {
  if (!ctx) return;
  SFX[name]?.(ctx.currentTime);
}

// Melodía en 6/8 al estilo de chilena (escala mayor, bajo alternado).
const MELODIA = [659, 0, 784, 880, 0, 784, 659, 0, 587, 523, 0, 587, 659, 0, 784, 880, 988, 880, 784, 0, 659, 587, 0, 0];
const BAJO = [131, 0, 0, 196, 0, 0, 147, 0, 0, 196, 0, 0];

export function startMusic(bpm = 150) {
  if (!ctx || musicTimer) return;
  const step = 60 / bpm / 2;
  let i = 0;
  let next = ctx.currentTime + 0.1;
  musicTimer = setInterval(() => {
    while (next < ctx.currentTime + 0.3) {
      const m = MELODIA[i % MELODIA.length];
      const b = BAJO[i % BAJO.length];
      if (m) tone(m, next, step * 0.9, { type: 'triangle', vol: 0.05 });
      if (b) tone(b, next, step * 1.8, { type: 'sine', vol: 0.12 });
      if (i % 3 === 0) noise(next, 0.03, 0.04);
      next += step;
      i++;
    }
  }, 100);
}

export function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = null;
}

export function vibrar(patron) {
  try { navigator.vibrate?.(patron); } catch { /* iOS no soporta vibración */ }
}
