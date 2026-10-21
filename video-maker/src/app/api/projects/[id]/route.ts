import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { infoToData } from "@/lib/project-data";

type Ctx = { params: Promise<{ id: string }> };

async function ownProject(id: string) {
  const user = await getUser();
  if (!user) return { error: NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 }) };
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== user.id) return { error: NextResponse.json({ error: "없는 영상입니다" }, { status: 404 }) };
  return { project, user };
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const own = await ownProject(id);
  if (own.error) return own.error;
  const body = await req.json();
  const prefix = `${own.user.id}/${id}/`;
  const data: Prisma.ProjectUpdateInput = {};
  if (body.info) Object.assign(data, infoToData(body.info));
  if (body.format) data.format = body.format === "h" ? "h" : "v";
  if (typeof body.accent === "string") data.accent = body.accent.slice(0, 9);
  if (Array.isArray(body.script)) data.script = body.script as Prisma.InputJsonValue;
  // 경로는 본인 폴더 안의 것만 허용
  if (Array.isArray(body.photoPaths)) data.photoPaths = body.photoPaths.filter((p: unknown) => typeof p === "string" && p.startsWith(prefix));
  if (typeof body.videoPath === "string" && body.videoPath.startsWith(prefix)) data.videoPath = body.videoPath;
  const project = await prisma.project.update({ where: { id }, data });
  return NextResponse.json({ project });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const own = await ownProject(id);
  if (own.error) return own.error;
  const admin = createAdminClient();
  const folder = `${own.user.id}/${id}`;
  for (const bucket of ["photos", "videos"]) {
    const { data } = await admin.storage.from(bucket).list(folder);
    if (data?.length) await admin.storage.from(bucket).remove(data.map((f) => `${folder}/${f.name}`));
  }
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
