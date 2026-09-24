import Link from 'next/link';

export default function FindingsPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-8">
        <Link 
          href="/" 
          className="text-sm font-medium text-dr-ink-muted hover:text-dr-ink underline hover:no-underline transition-colors mb-4 inline-block"
        >
          &larr; Back to Dry Run
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-dr-ink">
          Findings & Decisions
        </h1>
      </header>

      <main className="prose prose-dr max-w-none text-dr-ink">
        {/* The content will be written by the author. */}
      </main>
    </div>
  );
}
