-- Supabase 초기 설정: 테이블 외부 API 접근 차단 + Storage 버킷 생성
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('photos', 'photos', true, 10485760), ('videos', 'videos', true, 104857600)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = EXCLUDED.file_size_limit;
