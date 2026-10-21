import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";
import { infoToData } from "@/lib/project-data";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const projects = await prisma.project.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const body = await req.json();
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      ...infoToData(body.info),
      format: body.format === "h" ? "h" : "v",
      accent: typeof body.accent === "string" ? body.accent.slice(0, 9) : "#ff6b35",
    },
  });
  return NextResponse.json({ id: project.id });
}
