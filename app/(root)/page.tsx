import Link from 'next/link';
import { auth } from '@/auth';
import HomeDashboard from '@/app/components/HomeDashboard';

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    return (
      <HomeDashboard
        accessToken={typeof session.user.accessToken === 'string' ? session.user.accessToken : undefined}
        userName={typeof session.user.name === 'string' ? session.user.name : undefined}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center">
        <p className="mb-4 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1 text-xs uppercase tracking-widest text-cyan-200">
          Card Learning Platform
        </p>
        <h1 className="max-w-4xl text-4xl font-bold leading-tight sm:text-6xl">
          Learn faster with structured flashcards and progress tracking
        </h1>
        <p className="mt-6 max-w-2xl text-slate-300">
          Build vocabulary cards, train with quizzes, track streaks, and get real-time
          notifications as you improve.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-900 transition hover:bg-cyan-300"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-500 px-6 py-3 font-semibold transition hover:border-slate-300"
          >
            Sign In
          </Link>
        </div>
      </section>
    </main>
  );

}
