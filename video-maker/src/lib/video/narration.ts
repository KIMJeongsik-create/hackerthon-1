import type { Scene } from "@/lib/script";

export function hasSpeech() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function koreanVoices() {
  if (!hasSpeech()) return [];
  return speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith("ko"));
}

export function narrationText(s: Scene) {
  return [s.caption, s.sub].filter(Boolean).join(". ").replace(/\n/g, ", ").replace(/-/g, " ");
}

export function speak(text: string, voiceName: string, rate: number) {
  return new Promise<void>((res) => {
    if (!text) return res();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    const v = koreanVoices().find((v) => v.name === voiceName);
    if (v) u.voice = v;
    u.rate = rate;
    let fin = false;
    const end = () => {
      if (!fin) {
        fin = true;
        setTimeout(res, 250);
      }
    };
    u.onend = end;
    u.onerror = end;
    setTimeout(end, 2000 + (text.length * 250) / rate); // onend가 안 오는 경우 대비
    speechSynthesis.speak(u);
  });
}
