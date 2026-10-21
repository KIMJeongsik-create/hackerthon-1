import type { Scene } from "@/lib/script";

export const FADE = 0.6;

export type Stage = {
  canvas: HTMLCanvasElement;
  scenes: Scene[];
  images: (HTMLImageElement | null)[];
  accent: string;
  font: string;
};

export function totalDur(scenes: Scene[]) {
  return scenes.reduce((a, s) => a + s.dur, 0);
}

function ease(x: number) {
  x = Math.min(Math.max(x, 0), 1);
  return 1 - Math.pow(1 - x, 3);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = [];
  for (const para of String(text).split("\n")) {
    let line = "";
    for (const ch of para) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line) {
        const sp = line.lastIndexOf(" ");
        if (sp > 0) {
          out.push(line.slice(0, sp));
          line = line.slice(sp + 1) + ch;
        } else {
          out.push(line);
          line = ch;
        }
      } else line = test;
    }
    if (line) out.push(line);
  }
  return out;
}

function drawCover(ctx: CanvasRenderingContext2D, W: number, H: number, img: HTMLImageElement | null, scale: number, ox: number) {
  if (!img) {
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const r = Math.max(W / img.width, H / img.height) * scale;
  const w = img.width * r,
    h = img.height * r;
  ctx.drawImage(img, (W - w) / 2 + ox, (H - h) / 2, w, h);
}

function drawScene(st: Stage, s: Scene, idx: number, local: number, alpha: number) {
  const { canvas, accent, font } = st;
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width,
    H = canvas.height,
    u = Math.min(W, H) / 720,
    p = Math.min(local / s.dur, 1.4);
  ctx.save();
  ctx.globalAlpha = alpha;

  // 사진: 천천히 확대 + 좌우 이동
  const dir = idx % 2 ? 1 : -1;
  drawCover(ctx, W, H, st.images[s.photo] ?? null, 1.05 + 0.12 * p, dir * (p - 0.5) * 40 * u);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,.45)";
  ctx.shadowBlur = 14 * u;
  const tIn = ease((local - 0.15) / 0.7);
  const rise = (1 - tIn) * 40 * u;

  if (s.type !== "photo") {
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = alpha * tIn;
    const big = s.type === "intro" ? 92 * u : 66 * u;
    ctx.font = `900 ${big}px ${font}`;
    ctx.fillStyle = "#fff";
    const lines = wrap(ctx, s.caption, W * 0.86);
    let y = H / 2 - (lines.length - 1) * big * 0.6 + rise;
    lines.forEach((l) => {
      ctx.fillText(l, W / 2, y);
      y += big * 1.2;
    });
    ctx.shadowBlur = 0;
    ctx.fillStyle = accent;
    ctx.fillRect(W / 2 - 50 * u, y - big * 0.75, 100 * u, 6 * u);
    ctx.shadowBlur = 14 * u;
    ctx.font = `700 ${34 * u}px ${font}`;
    ctx.fillStyle = "rgba(255,255,255,.92)";
    y += 30 * u;
    wrap(ctx, s.sub, W * 0.86).forEach((l) => {
      ctx.fillText(l, W / 2, y);
      y += 48 * u;
    });
  } else {
    const g = ctx.createLinearGradient(0, H * 0.45, 0, H);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,.8)");
    ctx.shadowBlur = 0;
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.45, W, H * 0.55);
    ctx.shadowBlur = 14 * u;
    ctx.globalAlpha = alpha * tIn;
    ctx.textAlign = "left";
    const x = 48 * u,
      maxW = W - 96 * u;
    ctx.font = `900 ${64 * u}px ${font}`;
    const cap = wrap(ctx, s.caption, maxW);
    ctx.font = `400 ${32 * u}px ${font}`;
    const sub = wrap(ctx, s.sub, maxW);
    let y = H - 70 * u - sub.length * 46 * u - (cap.length - 1) * 76 * u + rise;
    if (s.tag) {
      ctx.font = `700 ${28 * u}px ${font}`;
      const tw = ctx.measureText(s.tag).width + 28 * u;
      ctx.shadowBlur = 0;
      ctx.fillStyle = accent;
      ctx.fillRect(x, y - 104 * u, tw, 46 * u);
      ctx.fillStyle = "#fff";
      ctx.fillText(s.tag, x + 14 * u, y - 71 * u);
      ctx.shadowBlur = 14 * u;
    }
    ctx.font = `900 ${64 * u}px ${font}`;
    ctx.fillStyle = "#fff";
    cap.forEach((l) => {
      ctx.fillText(l, x, y);
      y += 76 * u;
    });
    ctx.font = `400 ${32 * u}px ${font}`;
    ctx.fillStyle = "rgba(255,255,255,.9)";
    sub.forEach((l) => {
      ctx.fillText(l, x, y - 16 * u);
      y += 46 * u;
    });
  }
  ctx.restore();
}

// i번째 장면을 local초 시점으로 그림 (prevDur: 이전 장면이 실제로 보인 시간)
export function drawAt(st: Stage, i: number, local: number, prevDur: number, prog: number) {
  const ctx = st.canvas.getContext("2d")!;
  const { scenes } = st;
  ctx.clearRect(0, 0, st.canvas.width, st.canvas.height);
  if (i > 0 && local < FADE) {
    drawScene(st, scenes[i - 1], i - 1, prevDur + local, 1);
    drawScene(st, scenes[i], i, local, local / FADE);
  } else drawScene(st, scenes[i], i, local, 1);
  const u = Math.min(st.canvas.width, st.canvas.height) / 720;
  ctx.fillStyle = st.accent;
  ctx.fillRect(0, st.canvas.height - 6 * u, st.canvas.width * Math.min(prog, 1), 6 * u);
}

// 정지 화면 (t초 시점)
export function drawStill(st: Stage, t: number) {
  let s = 0,
    i = 0;
  while (i < st.scenes.length - 1 && t >= s + st.scenes[i].dur) {
    s += st.scenes[i].dur;
    i++;
  }
  drawAt(st, i, t - s, i > 0 ? st.scenes[i - 1].dur : 0, t / totalDur(st.scenes));
}

export function drawEmpty(canvas: HTMLCanvasElement, font: string) {
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#888";
  ctx.textAlign = "center";
  ctx.font = `700 32px ${font}`;
  ctx.fillText("여기에 영상이 나옵니다", canvas.width / 2, canvas.height / 2);
}
