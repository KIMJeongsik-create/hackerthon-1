import { createClient } from "@/lib/supabase/client";

// 서버에서 서명 URL을 받아 브라우저가 Supabase Storage에 직접 업로드 (Vercel 용량 한도 우회)
export async function uploadFile(bucket: "photos" | "videos", projectId: string, filename: string, blob: Blob) {
  const r = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ bucket, projectId, filename }),
  });
  if (!r.ok) throw new Error(`업로드 준비 실패 (${r.status})`);
  const { path, token } = (await r.json()) as { path: string; token: string };
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, blob, { contentType: blob.type || undefined, upsert: true });
  if (error) throw new Error(`업로드 실패: ${error.message}`);
  return path;
}
