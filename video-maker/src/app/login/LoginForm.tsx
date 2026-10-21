"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const r = await fetch("/api/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!r.ok) throw new Error(((await r.json()) as { error?: string }).error ?? "가입하지 못했습니다.");
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push(next);
      router.refresh();
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      setMsg(m.includes("Invalid login") ? "이메일 또는 비밀번호가 맞지 않습니다." : m);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card">
      <h1 className="text-2xl font-black">{mode === "login" ? "로그인" : "회원가입"}</h1>
      <p className="mt-1 text-sm text-muted">내가 만든 영상을 저장하고 공유하려면 로그인하세요.</p>
      <label className="label">이메일</label>
      <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <label className="label">비밀번호 (6자 이상)</label>
      <input className="field" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
      {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
      <button className="btn-primary mt-5 w-full" disabled={busy}>
        {busy ? "잠시만요..." : mode === "login" ? "로그인" : "가입하고 시작하기"}
      </button>
      <button
        type="button"
        className="mt-3 w-full text-sm text-muted underline"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setMsg("");
        }}
      >
        {mode === "login" ? "처음이신가요? 회원가입" : "이미 계정이 있나요? 로그인"}
      </button>
    </form>
  );
}
