import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import "./globals.css";

const notoKr = Noto_Sans_KR({
  variable: "--font-kr",
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "소상공인 영상메이커",
  description: "가게 정보와 사진만 넣으면 AI가 대본을 쓰고 30초 홍보 영상을 자동으로 만듭니다.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();
  return (
    <html lang="ko">
      <body className={`${notoKr.variable} font-sans antialiased`}>
        <header className="border-b border-line bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-black">
              소상공인 <span className="text-brand">영상메이커</span>
            </Link>
            <nav className="flex items-center gap-2 text-sm font-bold">
              <Link href="/studio" className="rounded-lg px-3 py-2 hover:bg-[#efebe5]">
                영상 만들기
              </Link>
              <Link href="/my" className="rounded-lg px-3 py-2 hover:bg-[#efebe5]">
                내 영상
              </Link>
              {user ? (
                <LogoutButton />
              ) : (
                <Link href="/login" className="rounded-lg bg-brand px-3 py-2 text-white">
                  로그인
                </Link>
              )}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
