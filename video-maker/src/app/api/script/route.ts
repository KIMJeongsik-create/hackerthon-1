import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { MAX_PHOTOS, parseScript, scriptPrompt, templateScript, type Info } from "@/lib/script";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const body = (await req.json()) as { info: Info; n: number };
  const n = Math.min(Math.max(Number(body.n) || 1, 1), MAX_PHOTOS);
  const info = body.info;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ script: templateScript(info, n), source: "template" });
  }
  try {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: scriptPrompt(info, n) }],
    });
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return NextResponse.json({ script: parseScript(text, n), source: "claude" });
  } catch (e) {
    console.error("Claude 대본 생성 실패", e);
    return NextResponse.json({ script: templateScript(info, n), source: "template", error: "Claude 연결에 실패해 기본 템플릿을 사용했습니다." });
  }
}
