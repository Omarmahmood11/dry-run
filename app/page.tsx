'use client';

import { useState } from 'react';
import { corpus } from '@/lib/corpus';
import CaseTable from '@/app/components/CaseTable';
import baselineRulesetRaw from '@/data/baselineRuleset.json';
import { evaluateCase } from '@/lib/ruleEngine';
import { replay } from '@/lib/replayEngine';
import type { Case, Ruleset, Diff } from '@/lib/types';
import ChangeProposalForm from '@/app/components/ChangeProposalForm';

export default function Home() {
  const ruleset = baselineRulesetRaw as unknown as Ruleset;
  const [proposedRuleset, setProposedRuleset] = useState<Ruleset | null>(null);

  const casesWithComputed = corpus.map((c) => ({
    ...(c as unknown as Case),
    computedResult: evaluateCase(ruleset, c as unknown as Case),
  }));

  const diff: Diff | null = proposedRuleset
    ? replay(proposedRuleset, corpus as unknown as readonly Case[])
    : null;

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
      <ChangeProposalForm 
        liveRuleset={ruleset} 
        onChange={setProposedRuleset}
      />
      {diff && (
        <div className="mb-8 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-auto">
          <h2 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
            Replay Result (Raw Dump)
          </h2>
          <pre className="text-xs text-zinc-800 dark:text-zinc-300">
            {JSON.stringify(diff, null, 2)}
          </pre>
        </div>
      )}
      <CaseTable cases={casesWithComputed} />
    </div>
  );
}
