import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/storage-url";
import ProjectActions from "./ProjectActions";

export default async function MyPage() {
  const user = await getUser();
  const projects = user ? await prisma.project.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }) : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">내 영상</h1>
        <Link href="/studio" className="btn-primary">
          + 새 영상 만들기
        </Link>
      </div>
      {projects.length === 0 ? (
        <div className="card mt-6 text-center text-muted">아직 만든 영상이 없어요. 첫 홍보 영상을 만들어 보세요!</div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="card p-3">
              {p.videoPath ? (
                <video src={publicUrl("videos", p.videoPath)} controls playsInline preload="metadata" className="aspect-video w-full rounded-lg bg-[#111]" />
              ) : (
                <div className="grid aspect-video place-items-center rounded-lg bg-[#eee] text-sm text-muted">영상 없음</div>
              )}
              <h2 className="mt-3 font-bold">{p.storeName}</h2>
              <p className="text-xs text-muted">
                {p.category} · {p.createdAt.toLocaleDateString("ko-KR")}
              </p>
              <ProjectActions
                id={p.id}
                downloadUrl={p.videoPath ? publicUrl("videos", p.videoPath, `${p.storeName}_홍보영상.${p.videoPath.split(".").pop()}`) : null}
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
