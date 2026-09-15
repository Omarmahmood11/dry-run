import { corpus } from '@/lib/corpus';
import CaseTable from '@/app/components/CaseTable';
import baselineRuleset from '@/data/baselineRuleset.json';
import { evaluateCase } from '@/lib/ruleEngine';
import type { Case, Ruleset } from '@/lib/types';

export default function Home() {
  const ruleset = baselineRuleset as unknown as Ruleset;
  const casesWithComputed = corpus.map((c) => ({
    ...(c as unknown as Case),
    computedResult: evaluateCase(ruleset, c as unknown as Case),
  }));

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Dry Run
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Case corpus — {corpus.length} historical invoice decisions
        </p>
      </header>
      <CaseTable cases={casesWithComputed} />
    </div>
  );
}

