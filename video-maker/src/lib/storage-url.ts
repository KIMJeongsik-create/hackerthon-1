export function publicUrl(bucket: "photos" | "videos", path: string, download?: string) {
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  return download ? `${base}?download=${encodeURIComponent(download)}` : base;
}
