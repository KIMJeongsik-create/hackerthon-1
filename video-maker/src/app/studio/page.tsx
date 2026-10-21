import Studio, { type InitialProject } from "@/components/studio/Studio";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";
import { projectScenes, projectToInfo } from "@/lib/project-data";
import { publicUrl } from "@/lib/storage-url";

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  let initial: InitialProject | null = null;
  if (id) {
    const user = await getUser();
    const p = await prisma.project.findUnique({ where: { id } });
    if (p && user && p.userId === user.id) {
      initial = {
        id: p.id,
        info: projectToInfo(p),
        format: p.format === "h" ? "h" : "v",
        accent: p.accent,
        scenes: projectScenes(p),
        photos: p.photoPaths.map((path) => ({ path, url: publicUrl("photos", path) })),
        videoUrl: p.videoPath ? publicUrl("videos", p.videoPath) : null,
      };
    }
  }
  return <Studio key={initial?.id ?? "new"} initial={initial} />;
}
