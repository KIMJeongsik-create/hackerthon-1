"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { buildScenes, emptyInfo, MAX_PHOTOS, templateScript, type Info, type Scene, type ScriptOut } from "@/lib/script";
import { drawEmpty, drawStill, type Stage } from "@/lib/video/render";
import { playVideo } from "@/lib/video/recorder";
import { hasSpeech, koreanVoices } from "@/lib/video/narration";
import { uploadFile } from "@/lib/upload";

type Photo = { img: HTMLImageElement; blob?: Blob; path?: string };

export type InitialProject = {
  id: string;
  info: Info;
  format: "v" | "h";
  accent: string;
  scenes: Scene[] | null;
  photos: { url: string; path: string }[];
  videoUrl: string | null;
};

type Result = { url: string; filename: string; shareId?: string };

const SAMPLE: Info = {
  name: "한밭 손칼국수",
  category: "칼국수 전문점",
  desc: "20년째 한자리에서 매일 아침 직접 반죽한 생면으로 칼국수를 끓입니다. 사골을 12시간 우려낸 진한 국물과 손만두가 인기 메뉴입니다. 점심시간 직장인과 가족 손님이 많이 찾습니다.",
  highlights: "매일 직접 뽑는 생면, 12시간 우린 사골 국물, 손으로 빚은 만두, 넓은 주차장",
  address: "대전 중구 OO로 12",
  phone: "042-123-4567",
};

function loadImage(src: string, cors = false) {
  return new Promise<HTMLImageElement>((ok, fail) => {
    const im = new Image();
    if (cors) im.crossOrigin = "anonymous";
    im.onload = () => ok(im);
    im.onerror = () => fail(new Error("이미지를 불러오지 못했습니다"));
    im.src = src;
  });
}

function canvasToBlob(c: HTMLCanvasElement) {
  return new Promise<Blob>((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error("이미지 변환 실패"))), "image/jpeg", 0.88));
}

// 업로드 전에 긴 변 1600px로 줄이기
async function toPhoto(file: Blob): Promise<Photo> {
  const url = URL.createObjectURL(file);
  const src = await loadImage(url);
  const r = Math.min(1, 1600 / Math.max(src.width, src.height));
  const c = document.createElement("canvas");
  c.width = Math.round(src.width * r);
  c.height = Math.round(src.height * r);
  c.getContext("2d")!.drawImage(src, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  const blob = await canvasToBlob(c);
  return { img: await loadImage(URL.createObjectURL(blob)), blob };
}

async function placeholder(emoji: string, c1: string, c2: string, label: string, font: string) {
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 1200;
  const g = c.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, 900, 1200);
  gr.addColorStop(0, c1);
  gr.addColorStop(1, c2);
  g.fillStyle = gr;
  g.fillRect(0, 0, 900, 1200);
  g.font = "360px serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(emoji, 450, 520);
  g.font = `700 48px ${font}`;
  g.fillStyle = "rgba(255,255,255,.7)";
  g.fillText(label, 450, 860);
  return toPhoto(await canvasToBlob(c));
}

const bodyFont = () => getComputedStyle(document.body).fontFamily;

export default function Studio({ initial }: { initial: InitialProject | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPct = useRef(-1);
  const [info, setInfo] = useState<Info>(initial?.info ?? emptyInfo);
  const [format, setFormat] = useState<"v" | "h">(initial?.format ?? "v");
  const [accent, setAccent] = useState(initial?.accent ?? "#ff6b35");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [scenes, setScenes] = useState<Scene[] | null>(initial?.scenes ?? null);
  const [projectId, setProjectId] = useState<string | null>(initial?.id ?? null);
  const [music, setMusic] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [voiceRec, setVoiceRec] = useState(true);
  const [voiceName, setVoiceName] = useState("");
  const [rate, setRate] = useState(1.1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ msg: string; err?: boolean }>({ msg: "" });
  const [result, setResult] = useState<Result | null>(
    initial?.videoUrl ? { url: initial.videoUrl, filename: `${initial.info.name}_홍보영상`, shareId: initial.id } : null,
  );

  // 한국어 음성 목록
  useEffect(() => {
    if (!hasSpeech()) return;
    const load = () => setVoices(koreanVoices());
    load();
    speechSynthesis.addEventListener("voiceschanged", load);
    return () => speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  // 다시 편집: 저장된 사진 불러오기
  useEffect(() => {
    if (!initial?.photos.length) return;
    let alive = true;
    Promise.all(initial.photos.map((p) => loadImage(p.url, true).then((img): Photo => ({ img, path: p.path }))))
      .then((ps) => alive && setPhotos(ps))
      .catch(() => setStatus({ msg: "저장된 사진을 불러오지 못했습니다.", err: true }));
    return () => {
      alive = false;
    };
  }, [initial]);

  const stage = useCallback((): Stage | null => {
    const c = canvasRef.current;
    if (!c || !scenes) return null;
    return { canvas: c, scenes, images: photos.map((p) => p.img), accent, font: bodyFont() };
  }, [scenes, photos, accent]);

  // 정지 화면 다시 그리기
  useEffect(() => {
    if (busy) return;
    const c = canvasRef.current;
    if (!c) return;
    const st = stage();
    if (st) drawStill(st, 0.3);
    else drawEmpty(c, bodyFont());
  }, [stage, format, busy]);

  const set = (k: keyof Info) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setInfo({ ...info, [k]: e.target.value });

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      setPhotos(await Promise.all([...files].slice(0, MAX_PHOTOS).map(toPhoto)));
      setScenes(null);
      setStatus({ msg: "사진을 올렸습니다. AI 대본 만들기를 눌러보세요." });
    } catch (e) {
      setStatus({ msg: e instanceof Error ? e.message : "사진을 불러오지 못했습니다.", err: true });
    } finally {
      setBusy(false);
    }
  }

  async function fillSample() {
    setInfo(SAMPLE);
    const f = bodyFont();
    setPhotos(
      await Promise.all([
        placeholder("🍜", "#f6a04d", "#b5452b", "칼국수 사진", f),
        placeholder("🥟", "#f3d29a", "#c27a3a", "만두 사진", f),
        placeholder("🍲", "#e5784b", "#7a2e1f", "국물 사진", f),
        placeholder("🏠", "#8fb7a3", "#2f5b4d", "매장 사진", f),
      ]),
    );
    setScenes(null);
    setStatus({ msg: "샘플 데이터를 채웠습니다. AI 대본 만들기를 눌러보세요." });
  }

  async function makeScript() {
    if (!photos.length) return setStatus({ msg: "사진을 1장 이상 올려주세요. (또는 샘플 데이터 채우기)", err: true });
    setBusy(true);
    setStatus({ msg: "AI가 대본을 쓰는 중입니다..." });
    try {
      const r = await fetch("/api/script", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ info, n: photos.length }),
      });
      if (!r.ok) throw new Error(`대본 생성 실패 (${r.status})`);
      const data = (await r.json()) as { script: ScriptOut; source: string; error?: string };
      setScenes(buildScenes(data.script, info, photos.length));
      if (data.error) setStatus({ msg: data.error, err: true });
      else setStatus({ msg: data.source === "claude" ? "Claude가 대본을 완성했습니다. 아래에서 고칠 수 있어요." : "기본 템플릿으로 대본을 만들었습니다." });
    } catch (e) {
      setScenes(buildScenes(templateScript(info, photos.length), info, photos.length));
      setStatus({ msg: `${e instanceof Error ? e.message : "오류"}. 기본 템플릿으로 대본을 만들었습니다.`, err: true });
    } finally {
      setBusy(false);
    }
  }

  function updateScene(i: number, k: "tag" | "caption" | "sub", v: string) {
    setScenes((prev) => prev && prev.map((s, j) => (j === i ? { ...s, [k]: v.replace(/ \/ /g, "\n") } : s)));
  }

  async function save(sc: Scene[], blob: Blob, ext: string) {
    const meta = { info, format, accent };
    let id = projectId;
    if (!id) {
      const r = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(meta) });
      if (!r.ok) throw new Error(`저장 실패 (${r.status})`);
      id = ((await r.json()) as { id: string }).id;
      setProjectId(id);
    }
    const stamp = Date.now();
    const next = [...photos];
    for (let i = 0; i < next.length; i++) {
      if (next[i].path || !next[i].blob) continue;
      setStatus({ msg: `사진 저장 중... (${i + 1}/${next.length})` });
      next[i] = { ...next[i], path: await uploadFile("photos", id, `photo-${stamp}-${i}.jpg`, next[i].blob!) };
    }
    setPhotos(next);
    setStatus({ msg: "영상 저장 중..." });
    const videoPath = await uploadFile("videos", id, `video-${stamp}.${ext}`, blob);
    const r = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...meta, script: sc, photoPaths: next.map((p) => p.path).filter(Boolean), videoPath }),
    });
    if (!r.ok) throw new Error(`저장 실패 (${r.status})`);
    return id;
  }

  async function run(record: boolean) {
    const sc = scenes ?? (photos.length ? buildScenes(templateScript(info, photos.length), info, photos.length) : null);
    if (!sc) return setStatus({ msg: "사진을 1장 이상 올려주세요. (또는 샘플 데이터 채우기)", err: true });
    if (!scenes) setScenes(sc);
    const canvas = canvasRef.current!;
    setBusy(true);
    lastPct.current = -1;
    setStatus({ msg: record ? "영상을 만드는 중입니다... 이 탭을 그대로 두세요." : "미리보기 재생 중" });
    try {
      const res = await playVideo({
        stage: { canvas, scenes: sc, images: photos.map((p) => p.img), accent, font: bodyFont() },
        music,
        narrate: voiceOn,
        voiceName,
        rate,
        record,
        captureVoice: voiceRec,
        onProgress: (p) => {
          const pct = Math.round(p * 100);
          if (record && pct !== lastPct.current) {
            lastPct.current = pct;
            setStatus({ msg: `영상을 만드는 중입니다... ${pct}% (이 탭을 그대로 두세요)` });
          }
        },
      });
      if (!record || !res.blob) {
        setStatus({ msg: "미리보기가 끝났습니다. 마음에 들면 영상 만들기를 누르세요." });
        return;
      }
      const filename = `${info.name || "우리가게"}_홍보영상.${res.ext}`;
      const local = URL.createObjectURL(res.blob);
      try {
        const id = await save(sc, res.blob, res.ext!);
        setResult({ url: local, filename, shareId: id });
        setStatus({ msg: `완성! ${Math.round(res.seconds)}초 영상이 저장되었습니다. ${res.warn}`, err: !!res.warn });
      } catch (e) {
        setResult({ url: local, filename });
        setStatus({ msg: `영상은 만들었지만 저장하지 못했습니다: ${e instanceof Error ? e.message : e}. 다운로드는 할 수 있어요.`, err: true });
      }
    } catch (e) {
      setStatus({ msg: `오류: ${e instanceof Error ? e.message : e}`, err: true });
    } finally {
      setBusy(false);
    }
  }

  const kinds = { intro: "오프닝", photo: "장면", outro: "마무리" };

  return (
    <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[1fr_440px]">
      <section className="space-y-5">
        <div className="card">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Step n={1} />
            가게 정보 입력
          </h2>
          <div className="grid gap-x-3 sm:grid-cols-2">
            <div>
              <label className="label">가게 이름</label>
              <input className="field" value={info.name} onChange={set("name")} placeholder="예: 한밭 손칼국수" />
            </div>
            <div>
              <label className="label">업종</label>
              <input className="field" value={info.category} onChange={set("category")} placeholder="예: 칼국수 전문점" />
            </div>
          </div>
          <label className="label">가게 / 제품 설명</label>
          <textarea className="field min-h-20" value={info.desc} onChange={set("desc")} placeholder="어떤 가게인지 자유롭게 적어주세요." />
          <label className="label">강조하고 싶은 점 (쉼표로 구분)</label>
          <input className="field" value={info.highlights} onChange={set("highlights")} placeholder="예: 매일 직접 뽑는 생면, 국내산 재료, 넓은 주차장" />
          <div className="grid gap-x-3 sm:grid-cols-2">
            <div>
              <label className="label">주소</label>
              <input className="field" value={info.address} onChange={set("address")} placeholder="예: 대전 중구 OO로 12" />
            </div>
            <div>
              <label className="label">전화번호</label>
              <input className="field" value={info.phone} onChange={set("phone")} placeholder="예: 042-123-4567" />
            </div>
          </div>
          <label className="label">사진 (최대 {MAX_PHOTOS}장, 올린 순서대로 영상에 나옵니다)</label>
          <input type="file" accept="image/*" multiple onChange={(e) => onFiles(e.target.files)} className="text-sm" />
          {photos.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {photos.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={p.img.src} alt="" className="h-14 w-14 rounded-md border border-line object-cover" />
              ))}
            </div>
          )}
          <div className="grid gap-x-3 sm:grid-cols-2">
            <div>
              <label className="label">영상 형태</label>
              <select className="field" value={format} onChange={(e) => setFormat(e.target.value as "v" | "h")}>
                <option value="v">세로 9:16 (릴스·쇼츠)</option>
                <option value="h">가로 16:9 (유튜브·매장 TV)</option>
              </select>
            </div>
            <div>
              <label className="label">대표 색상</label>
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-10 w-full rounded-lg border border-line" />
            </div>
          </div>

          <div className="mt-4 space-y-2 rounded-xl bg-[#f6f4f1] p-3 text-sm">
            <Check checked={music} onChange={setMusic} label="배경음악 넣기" />
            <Check checked={voiceOn} onChange={setVoiceOn} label="자막 읽어주기 (AI 음성 내레이션)" />
            {voiceOn && (
              <>
                <div className="grid gap-x-3 sm:grid-cols-2">
                  <div>
                    <label className="label">목소리</label>
                    <select className="field" value={voiceName} onChange={(e) => setVoiceName(e.target.value)}>
                      <option value="">기본 한국어 음성</option>
                      {voices.map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">말 빠르기</label>
                    <select className="field" value={rate} onChange={(e) => setRate(Number(e.target.value))}>
                      <option value={0.95}>천천히</option>
                      <option value={1.1}>보통</option>
                      <option value={1.3}>빠르게</option>
                    </select>
                  </div>
                </div>
                <Check checked={voiceRec} onChange={setVoiceRec} label="영상 파일에 목소리 포함하기" />
                <p className="text-xs text-muted">
                  영상을 만들 때 화면 공유 창이 뜨면 <b>전체 화면</b>을 고르고 <b>시스템 오디오도 공유</b>를 켠 뒤 공유를 누르세요. 녹화 중에는 다른
                  소리를 꺼 주세요.
                </p>
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={fillSample} disabled={busy}>
              샘플 데이터 채우기
            </button>
            <button className="btn-primary" onClick={makeScript} disabled={busy}>
              AI 대본 만들기
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Step n={2} />
            대본 확인·수정
          </h2>
          {!scenes ? (
            <p className="mt-2 text-sm text-muted">AI 대본 만들기를 누르면 장면별 자막이 여기에 나옵니다. 내용을 직접 고칠 수 있어요.</p>
          ) : (
            <div className="mt-2 divide-y divide-line">
              {scenes.map((s, i) => (
                <div key={i} className="grid grid-cols-[56px_1fr] gap-3 py-3">
                  {photos[s.photo] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photos[s.photo].img.src} alt="" className="h-14 w-14 rounded-md object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-md bg-[#ddd]" />
                  )}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted">
                      {kinds[s.type]}
                      {s.type === "photo" ? ` ${i}` : ""} · {s.dur.toFixed(1)}초
                    </p>
                    {s.type === "photo" && (
                      <input className="field py-1.5" value={s.tag ?? ""} onChange={(e) => updateScene(i, "tag", e.target.value)} placeholder="라벨" />
                    )}
                    <input className="field py-1.5" value={s.caption.replace(/\n/g, " / ")} onChange={(e) => updateScene(i, "caption", e.target.value)} placeholder="큰 자막" />
                    <input className="field py-1.5" value={s.sub.replace(/\n/g, " / ")} onChange={(e) => updateScene(i, "sub", e.target.value)} placeholder="작은 자막" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="card lg:sticky lg:top-4">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Step n={3} />
            영상 만들기
          </h2>
          <canvas
            ref={canvasRef}
            width={format === "v" ? 720 : 1280}
            height={format === "v" ? 1280 : 720}
            className="mt-3 max-h-[65vh] w-full rounded-xl bg-[#111] object-contain"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={() => run(false)} disabled={busy}>
              미리보기
            </button>
            <button className="btn-primary" onClick={() => run(true)} disabled={busy}>
              영상 만들고 저장하기
            </button>
          </div>
          <p className={`mt-3 min-h-5 text-sm ${status.err ? "text-red-600" : "text-muted"}`}>{status.msg}</p>
          {result && (
            <div className="mt-3 space-y-2">
              <video src={result.url} controls playsInline className="max-h-[45vh] w-full rounded-xl bg-[#111]" />
              <div className="flex flex-wrap gap-2">
                <a className="btn bg-[#1f8f4e] text-white" href={result.url} download={result.filename}>
                  다운로드
                </a>
                {result.shareId && (
                  <>
                    <Link className="btn-ghost" href={`/v/${result.shareId}`} target="_blank">
                      공유 페이지 열기
                    </Link>
                    <button
                      className="btn-ghost"
                      onClick={async () => {
                        await navigator.clipboard.writeText(`${location.origin}/v/${result.shareId}`);
                        setStatus({ msg: "공유 링크를 복사했습니다." });
                      }}
                    >
                      링크 복사
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Step({ n }: { n: number }) {
  return <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-[13px] text-white">{n}</span>;
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 font-bold">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-brand" />
      {label}
    </label>
  );
}
