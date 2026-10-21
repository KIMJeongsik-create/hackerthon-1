import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/studio";
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <LoginForm next={safeNext} />
    </main>
  );
}
