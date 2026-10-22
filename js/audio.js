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

// Guitarra sintetizada con Karplus-Strong: un golpe de ruido que recorre una
// cuerda virtual (retardo + promedio) suena a cuerda pulsada. Cada nota se
// calcula una vez y se reutiliza.
const cuerdas = new Map();
function cuerda(freq) {
  if (!cuerdas.has(freq)) {
    const sr = ctx.sampleRate;
    const buf = ctx.createBuffer(1, Math.round(sr * 1.4), sr);
    const d = buf.getChannelData(0);
    const p = Math.round(sr / freq);
    for (let i = 0; i < p; i++) d[i] = Math.random() * 2 - 1;
    for (let i = p; i < d.length; i++) d[i] = 0.497 * (d[i - p] + (d[i - p - 1] ?? 0));
    cuerdas.set(freq, buf);
  }
  return cuerdas.get(freq);
}

function pulsar(freq, t, vol) {
  const s = ctx.createBufferSource();
  const g = ctx.createGain();
  s.buffer = cuerda(freq);
  g.gain.value = vol;
  s.connect(g).connect(master);
  s.start(t);
}

// Son rápido en 6/8 en Re mayor: bajo en 1 y 4, rasgueo en 3 y 6 y la melodía
// encima. Progresión Re – Sol – La – Re, dos frases de 4 compases.
const ACORDES = {
  D: { bajo: [73, 110], rasgueo: [147, 220, 294, 370] },
  G: { bajo: [98, 147], rasgueo: [98, 147, 196, 247] },
  A: { bajo: [110, 82], rasgueo: [110, 165, 220, 277] },
};
const COMPASES = ['D', 'G', 'A', 'D', 'D', 'G', 'A', 'D'];
const MELODIA = [
  740, 0, 880, 740, 0, 587, /**/ 784, 0, 988, 784, 0, 587, /**/ 659, 0, 554, 659, 0, 880, /**/ 740, 659, 587, 0, 0, 0,
  880, 0, 740, 587, 0, 740, /**/ 988, 0, 784, 587, 0, 784, /**/ 880, 0, 659, 554, 0, 659, /**/ 587, 0, 0, 440, 0, 0,
];
const OCTAVO = 0.13; // segundos por corchea: alegre y con prisa, como la carrera

export function startMusic() {
  if (!ctx || musicTimer) return;
  let i = 0;
  let next = ctx.currentTime + 0.1;
  musicTimer = setInterval(() => {
    while (next < ctx.currentTime + 0.3) {
      const acorde = ACORDES[COMPASES[Math.floor(i / 6) % COMPASES.length]];
      const paso = i % 6;
      if (paso === 0 || paso === 3) pulsar(acorde.bajo[paso / 3], next, 0.5);
      if (paso === 2 || paso === 5) acorde.rasgueo.forEach((f, k) => pulsar(f, next + k * 0.012, 0.16)); // rasgueo
      const m = MELODIA[i % MELODIA.length];
      if (m) pulsar(m, next, 0.3);
      next += OCTAVO;
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
