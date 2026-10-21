export type Info = {
  name: string;
  category: string;
  desc: string;
  highlights: string;
  address: string;
  phone: string;
};

export type ScriptOut = {
  intro_sub: string;
  scenes: { tag: string; caption: string; sub: string }[];
  outro_caption: string;
};

export type Scene = {
  type: "intro" | "photo" | "outro";
  photo: number; // 사용할 사진 번호
  tag?: string;
  caption: string;
  sub: string;
  dur: number;
};

export const INTRO = 3;
export const OUTRO = 4;
export const TOTAL = 30;
export const MAX_PHOTOS = 8;

const TAGS = ["대표 메뉴", "사장님 추천", "우리 가게 자랑", "특별한 이유", "단골 비결", "오늘의 추천", "꼭 드셔보세요", "정성 가득"];

export const emptyInfo: Info = { name: "", category: "", desc: "", highlights: "", address: "", phone: "" };

export function templateScript(d: Info, n: number): ScriptOut {
  const hl = d.highlights.split(/[,，\n·]/).map((s) => s.trim()).filter(Boolean);
  const sents = d.desc.split(/[.!?\n]/).map((s) => s.trim()).filter(Boolean);
  const name = d.name || "우리 가게";
  const scenes = [];
  for (let i = 0; i < n; i++) {
    scenes.push({
      tag: TAGS[i % TAGS.length],
      caption: hl[i] || sents[i] || `${name}의 자랑`,
      sub: hl[i] ? sents[i] || "" : "",
    });
  }
  return { intro_sub: d.category || "정성을 담은 우리 동네 가게", scenes, outro_caption: "지금 바로 방문하세요!" };
}

export function scriptPrompt(d: Info, n: number) {
  return `너는 소상공인 홍보 영상 전문 카피라이터야. 아래 가게 정보로 30초 홍보 영상의 자막 대본을 써줘. 자막은 내레이션으로도 읽힌다.

가게 이름: ${d.name}
업종: ${d.category}
설명: ${d.desc}
강조점: ${d.highlights}

조건:
- 사진 장면은 정확히 ${n}개. 장면 순서는 사진 순서와 같다 (첫 장면이 대표 메뉴/제품).
- tag는 6자 이내 짧은 라벨, caption은 14자 이내 핵심 문구, sub는 25자 이내 보조 설명.
- 과장 광고나 사실이 아닌 내용은 쓰지 말고, 주어진 정보만 활용해.
- 따뜻하고 친근한 동네 가게 말투. 소리 내어 읽기 자연스럽게.

아래 JSON 형식으로만 답해. 다른 말은 쓰지 마.
{"intro_sub":"15자 이내 슬로건","scenes":[{"tag":"","caption":"","sub":""}],"outro_caption":"14자 이내 방문 유도 문구"}`;
}

export function parseScript(text: string, n: number): ScriptOut {
  const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  if (!Array.isArray(json.scenes)) throw new Error("대본 형식 오류");
  const scenes = json.scenes.slice(0, n).map((s: Record<string, unknown>) => ({
    tag: String(s.tag ?? ""),
    caption: String(s.caption ?? ""),
    sub: String(s.sub ?? ""),
  }));
  while (scenes.length < n) scenes.push({ tag: TAGS[scenes.length % TAGS.length], caption: "", sub: "" });
  return { intro_sub: String(json.intro_sub ?? ""), scenes, outro_caption: String(json.outro_caption ?? "") };
}

export function buildScenes(script: ScriptOut, d: Info, n: number): Scene[] {
  const each = (TOTAL - INTRO - OUTRO) / n;
  return [
    { type: "intro", photo: 0, caption: d.name || "우리 가게", sub: script.intro_sub || d.category, dur: INTRO },
    ...script.scenes.map((s, i): Scene => ({ type: "photo", photo: i, tag: s.tag, caption: s.caption, sub: s.sub, dur: each })),
    {
      type: "outro",
      photo: n - 1,
      caption: script.outro_caption || "지금 바로 방문하세요!",
      sub: [d.address, d.phone].filter(Boolean).join("\n"),
      dur: OUTRO,
    },
  ];
}
