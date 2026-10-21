import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 이메일 인증 메일 없이 바로 쓸 수 있는 계정 생성 (가입 후 클라이언트에서 로그인)
export async function POST(req: Request) {
  const { email, password } = (await req.json()) as { email?: string; password?: string };
  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: "이메일과 6자 이상 비밀번호를 입력하세요." }, { status: 400 });
  }
  const { error } = await createAdminClient().auth.admin.createUser({ email, password, email_confirm: true });
  if (error) {
    const exists = /already|registered|exists/i.test(error.message);
    return NextResponse.json({ error: exists ? "이미 가입된 이메일입니다. 로그인해 주세요." : error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
