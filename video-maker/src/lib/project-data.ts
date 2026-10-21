import type { Project } from "@prisma/client";
import type { Info, Scene } from "@/lib/script";

const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function infoToData(info: Partial<Info> | undefined) {
  const i = info ?? {};
  return {
    storeName: str(i.name, 100) || "우리 가게",
    category: str(i.category, 100),
    description: str(i.desc),
    highlights: str(i.highlights, 500),
    address: str(i.address, 200),
    phone: str(i.phone, 50),
  };
}

export function projectToInfo(p: Project): Info {
  return {
    name: p.storeName,
    category: p.category ?? "",
    desc: p.description ?? "",
    highlights: p.highlights ?? "",
    address: p.address ?? "",
    phone: p.phone ?? "",
  };
}

export function projectScenes(p: Project): Scene[] | null {
  return Array.isArray(p.script) ? (p.script as unknown as Scene[]) : null;
}
