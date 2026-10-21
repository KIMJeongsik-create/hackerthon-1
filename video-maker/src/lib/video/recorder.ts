import { drawAt, totalDur, type Stage } from "./render";
import { fadeOutMusic, startMusic, type Music } from "./music";
import { hasSpeech, narrationText, speak } from "./narration";

export type PlayOptions = {
  stage: Stage;
  music: boolean;
  narrate: boolean;
  voiceName: string;
  rate: number;
  record: boolean;
  captureVoice: boolean; // 시스템 오디오 공유로 목소리를 파일에 담기
  onProgress?: (p: number) => void;
};

export type PlayResult = { blob?: Blob; mime?: string; ext?: string; warn: string; seconds: number };

function pickMime() {
  const list = ["video/mp4;codecs=avc1,mp4a", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return list.find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) || "";
}

export async function playVideo(o: PlayOptions): Promise<PlayResult> {
  const { stage } = o;
  const scenes = stage.scenes;
  try {
    await document.fonts.load(`900 40px ${stage.font}`);
    await document.fonts.load(`400 40px ${stage.font}`);
  } catch {}
  const est = totalDur(scenes);
  const narrate = o.narrate && hasSpeech();
  if (narrate) speechSynthesis.cancel();

  // 목소리를 파일에 담기 위해 시스템 오디오 공유 받기
  let display: MediaStream | null = null;
  let warn = "";
  if (o.record && narrate && o.captureVoice) {
    try {
      display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        systemAudio: "include",
      } as DisplayMediaStreamOptions);
      if (!display.getAudioTracks().length) {
        display.getTracks().forEach((t) => t.stop());
        display = null;
        warn = "시스템 오디오가 공유되지 않아 목소리 없이 녹화했습니다.";
      }
    } catch {
      warn = "화면 공유를 취소해서 목소리 없이 녹화했습니다.";
    }
  }

  let music: Music | null = null;
  if (o.music) music = startMusic(est + 60, narrate ? 0.45 : 0.9);

  let rec: MediaRecorder | null = null;
  const chunks: Blob[] = [];
  const mime = o.record ? pickMime() : "";
  if (o.record) {
    const stream = stage.canvas.captureStream(30);
    // 시스템 오디오에는 배경음악 + 목소리가 함께 들어 있음
    const audio = display ? display.getAudioTracks() : music ? music.stream.getAudioTracks() : [];
    audio.forEach((t) => stream.addTrack(t));
    rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 6e6 } : {});
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    rec.start(200);
  }

  // 장면마다: 정해진 시간이 지나고 + 목소리가 끝나면 다음 장면으로
  let i = 0,
    sceneStart = performance.now(),
    prevDur = 0,
    before = 0,
    spoken = !narrate;
  const say = (idx: number) => {
    spoken = !narrate;
    if (narrate)
      speak(narrationText(scenes[idx]), o.voiceName, o.rate).then(() => {
        if (i === idx) spoken = true;
      });
  };
  say(0);
  await new Promise<void>((done) => {
    const frame = () => {
      const now = performance.now();
      let local = (now - sceneStart) / 1000;
      if (local >= scenes[i].dur && spoken) {
        if (i === scenes.length - 1) {
          drawAt(stage, i, local, prevDur, 1);
          o.onProgress?.(1);
          return done();
        }
        prevDur = local;
        before += local;
        i++;
        sceneStart = now;
        local = 0;
        say(i);
      }
      const prog = (before + local) / Math.max(est, before + local);
      drawAt(stage, i, local, prevDur, prog);
      o.onProgress?.(prog);
      requestAnimationFrame(frame);
    };
    frame();
  });

  if (music) await fadeOutMusic(music);
  const seconds = before + (performance.now() - sceneStart) / 1000;

  let result: PlayResult = { warn, seconds };
  if (rec) {
    const r = rec;
    await new Promise<void>((res) => {
      r.onstop = () => res();
      r.stop();
    });
    const type = mime.split(";")[0] || "video/webm";
    result = { ...result, blob: new Blob(chunks, { type }), mime: type, ext: type.includes("mp4") ? "mp4" : "webm" };
  }
  display?.getTracks().forEach((t) => t.stop());
  music?.ac.close();
  return result;
}
