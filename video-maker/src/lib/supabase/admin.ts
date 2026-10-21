import { createClient } from "@supabase/supabase-js";

// 서버 전용: service role 키로 Storage 서명 URL 발급, 파일 삭제
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const BUCKETS = ["photos", "videos"] as const;
export type Bucket = (typeof BUCKETS)[number];
