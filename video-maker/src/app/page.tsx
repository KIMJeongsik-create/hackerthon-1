import Link from "next/link";

const steps = [
  { n: "1", title: "가게 정보 입력", body: "가게 이름, 설명, 자랑할 점을 적고 사진을 올려요." },
  { n: "2", title: "AI가 대본 작성", body: "Claude가 장면별 자막과 내레이션 대본을 써요. 직접 고칠 수도 있어요." },
  { n: "3", title: "30초 영상 완성", body: "사진 효과, 자막, 배경음악, 목소리가 들어간 영상을 바로 받아요." },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <p className="mb-3 inline-block rounded-full bg-brand/10 px-3 py-1 text-sm font-bold text-brand">소상공인을 위한 AI 홍보 영상</p>
          <h1 className="text-4xl leading-tight font-black md:text-5xl">
            30초 홍보 영상,
            <br />
            <span className="text-brand">100만 원</span> 대신 <span className="text-brand">3분</span>이면.
          </h1>
          <p className="mt-5 text-lg text-muted">
            외주 업체에 맡기면 30초 영상 한 편에 약 100만 원. 이제 가게 정보와 사진만 넣으면 AI가 대본을 쓰고 영상까지 자동으로 만들어
            드려요.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/studio" className="btn-primary px-6 py-3 text-base">
              무료로 영상 만들기
            </Link>
            <Link href="/my" className="btn-ghost px-6 py-3 text-base">
              내 영상 보기
            </Link>
          </div>
        </div>
        <div className="card grid grid-cols-2 gap-4 text-center">
          <div className="rounded-xl bg-[#f6f4f1] p-5">
            <p className="text-sm text-muted">외주 제작</p>
            <p className="mt-2 text-2xl font-black">약 100만 원</p>
            <p className="mt-1 text-sm text-muted">며칠 ~ 몇 주</p>
          </div>
          <div className="rounded-xl bg-brand p-5 text-white">
            <p className="text-sm opacity-90">영상메이커</p>
            <p className="mt-2 text-2xl font-black">무료</p>
            <p className="mt-1 text-sm opacity-90">3분 안에 완성</p>
          </div>
          <div className="col-span-2 rounded-xl bg-[#f6f4f1] p-4 text-sm text-muted">
            신메뉴, 계절 이벤트, 할인 행사도 그때그때 직접 만들고 바로 수정하세요.
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="card">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand font-bold text-white">{s.n}</span>
            <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
            <p className="mt-1 text-sm text-muted">{s.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
