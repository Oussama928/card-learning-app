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
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center">
        
        <h1 className="max-w-4xl text-4xl font-bold leading-tight sm:text-6xl">
          Learn faster with structured flashcards and progress tracking
        </h1>
        <p className="mt-6 max-w-2xl text-muted-foreground text-lg">
          Build vocabulary cards, train with quizzes, track streaks, and get real-time
          notifications as you improve.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Sign In
          </Link>
        </div>
      </section>
    </main>
  );

}
