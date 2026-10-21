"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProjectActions({ id, downloadUrl }: { id: string; downloadUrl: string | null }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-1.5 text-xs">
        {downloadUrl && (
          <>
            <a className="btn-ghost px-3 py-1.5 text-xs" href={downloadUrl}>
              다운로드
            </a>
            <button
              className="btn-ghost px-3 py-1.5 text-xs"
              onClick={async () => {
                await navigator.clipboard.writeText(`${location.origin}/v/${id}`);
                setMsg("공유 링크를 복사했습니다.");
              }}
            >
              링크 복사
            </button>
          </>
        )}
        <Link className="btn-ghost px-3 py-1.5 text-xs" href={`/studio?id=${id}`}>
          다시 편집
        </Link>
        <button
          className="btn px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
          disabled={busy}
          onClick={async () => {
            if (!confirm("이 영상을 삭제할까요? 되돌릴 수 없습니다.")) return;
            setBusy(true);
            const r = await fetch(`/api/projects/${id}`, { method: "DELETE" });
            setBusy(false);
            if (r.ok) router.refresh();
            else setMsg("삭제하지 못했습니다.");
          }}
        >
          삭제
        </button>
      </div>
      {msg && <p className="mt-1 text-xs text-muted">{msg}</p>}
    </div>
  );
}
