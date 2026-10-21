// 저작권 걱정 없는 배경음악을 Web Audio로 직접 생성
function tone(ac: AudioContext, out: AudioNode, f: number, type: OscillatorType, st: number, dur: number, vol: number, att: number) {
  const o = ac.createOscillator(),
    g = ac.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, st);
  g.gain.linearRampToValueAtTime(vol, st + att + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
  o.connect(g).connect(out);
  o.start(st);
  o.stop(st + dur + 0.05);
}

export type Music = { ac: AudioContext; master: GainNode; stream: MediaStream };

export function startMusic(total: number, vol: number): Music {
  const ac = new AudioContext();
  const master = ac.createGain();
  master.connect(ac.destination);
  const dest = ac.createMediaStreamDestination();
  master.connect(dest);
  const t0 = ac.currentTime + 0.05;
  master.gain.setValueAtTime(0, t0);
  master.gain.linearRampToValueAtTime(vol, t0 + 1);
  const bar = 2.4;
  const chords = [
    [261.63, 329.63, 392],
    [196, 246.94, 293.66],
    [220, 261.63, 329.63],
    [174.61, 220, 261.63],
  ];
  const arp = [0, 1, 2, 1, 0, 1, 2, 1];
  for (let b = 0; b * bar < total; b++) {
    const c = chords[b % 4],
      st = t0 + b * bar;
    c.forEach((f) => tone(ac, master, f, "triangle", st, bar, 0.035, 0.4));
    tone(ac, master, c[0] / 2, "sine", st, bar, 0.12, 0.05);
    arp.forEach((k, j) => tone(ac, master, c[k] * 2, "sine", st + (j * bar) / 8, 0.3, 0.03, 0.01));
  }
  return { ac, master, stream: dest.stream };
}

export async function fadeOutMusic(m: Music, sec = 1.2) {
  const g = m.master.gain,
    t = m.ac.currentTime;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(0, t + sec);
  await new Promise((r) => setTimeout(r, sec * 1000 + 100));
}
