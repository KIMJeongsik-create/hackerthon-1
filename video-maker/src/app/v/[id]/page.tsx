import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { publicUrl } from "@/lib/storage-url";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  const p = await prisma.project.findUnique({ where: { id } });
  return p?.videoPath ? p : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load((await params).id);
  if (!p) return { title: "영상을 찾을 수 없습니다" };
  const description = p.highlights || p.description || p.category || "";
  return {
    title: `${p.storeName} 홍보 영상`,
    description,
    openGraph: {
      title: `${p.storeName} 홍보 영상`,
      description,
      images: p.photoPaths[0] ? [publicUrl("photos", p.photoPaths[0])] : undefined,
      videos: [publicUrl("videos", p.videoPath!)],
    },
  };
}

export default async function SharePage({ params }: Props) {
  const p = await load((await params).id);
  if (!p) notFound();
  const vertical = p.format !== "h";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="card">
        <video
          src={publicUrl("videos", p.videoPath!)}
          controls
          playsInline
          className={`mx-auto rounded-xl bg-[#111] ${vertical ? "max-h-[75vh]" : "w-full"}`}
        />
        <h1 className="mt-5 text-2xl font-black">{p.storeName}</h1>
        {p.category && <p className="text-sm text-muted">{p.category}</p>}
        {p.description && <p className="mt-3 whitespace-pre-line">{p.description}</p>}
        <dl className="mt-4 space-y-1 text-sm">
          {p.address && (
            <div className="flex gap-2">
              <dt className="font-bold">주소</dt>
              <dd>{p.address}</dd>
            </div>
          )}
          {p.phone && (
            <div className="flex gap-2">
              <dt className="font-bold">전화</dt>
              <dd>
                <a className="text-brand underline" href={`tel:${p.phone}`}>
                  {p.phone}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
      <div className="mt-6 rounded-2xl bg-brand/10 p-5 text-center">
        <p className="font-bold">우리 가게 홍보 영상도 3분 만에 만들어 보세요</p>
        <Link href="/studio" className="btn-primary mt-3">
          무료로 영상 만들기
        </Link>
      </div>
    </main>
  );
}
