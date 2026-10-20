let ctx: AudioContext | null = null;
let muted = false;
export function setMuted(m: boolean) { muted = m; }
export function isMuted() { return muted; }

function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.15, slideTo?: number, delay = 0) {
  if (muted) return;
  const c = ac(); if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur: number, vol = 0.2, lp = 800) {
  if (muted) return;
  const c = ac(); if (!c) return;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp;
  const g = c.createGain(); g.gain.value = vol;
  s.connect(f).connect(g).connect(c.destination);
  s.start();
}

export const sfx = {
  pick: () => tone(600, 0.08, 'triangle', 0.1, 900),
  drop: () => { tone(300, 0.12, 'sine', 0.18, 700); tone(900, 0.06, 'triangle', 0.06, 1200, 0.05); },
  cup: () => tone(1200, 0.1, 'triangle', 0.1, 1600),
  coin: () => { tone(988, 0.08, 'square', 0.07); tone(1319, 0.25, 'square', 0.07, undefined, 0.08); },
  perfect: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.1, undefined, i * 0.07)); },
  bad: () => tone(220, 0.35, 'sawtooth', 0.08, 110),
  bonk: () => { tone(500, 0.18, 'square', 0.1, 1800); noise(0.1, 0.15, 2000); },
  boom: () => { noise(0.8, 0.35, 400); tone(90, 0.6, 'sine', 0.3, 30); },
  alarm: () => { tone(880, 0.15, 'square', 0.06); tone(660, 0.15, 'square', 0.06, undefined, 0.17); tone(880, 0.15, 'square', 0.06, undefined, 0.34); },
  blackhole: () => { tone(400, 1, 'sawtooth', 0.1, 30); noise(1, 0.15, 300); },
  sizzle: () => noise(0.25, 0.08, 3000),
  ok: () => tone(700, 0.15, 'sine', 0.12, 1000),
  repair: () => tone(1400, 0.05, 'square', 0.04),
  day: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.1, undefined, i * 0.1)); },
};
