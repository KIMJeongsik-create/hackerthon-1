import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";
import { BUCKETS, createAdminClient, type Bucket } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const { bucket, projectId, filename } = (await req.json()) as { bucket: Bucket; projectId: string; filename: string };
  if (!BUCKETS.includes(bucket)) return NextResponse.json({ error: "잘못된 저장소" }, { status: 400 });
  if (!/^[\w.-]{1,80}$/.test(filename)) return NextResponse.json({ error: "잘못된 파일 이름" }, { status: 400 });

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== user.id) return NextResponse.json({ error: "없는 영상입니다" }, { status: 404 });

  const path = `${user.id}/${projectId}/${filename}`;
  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUploadUrl(path, { upsert: true });
  if (error || !data) return NextResponse.json({ error: error?.message ?? "서명 URL 발급 실패" }, { status: 500 });
  return NextResponse.json({ path, token: data.token });
}
