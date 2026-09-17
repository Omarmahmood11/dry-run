'use client';

import { useState, useMemo, useCallback } from 'react';
import { corpus } from '@/lib/corpus';
import CaseTable from '@/app/components/CaseTable';
import ChangeProposalForm from '@/app/components/ChangeProposalForm';
import ReplayPreview from '@/app/components/ReplayPreview';
import baselineRulesetRaw from '@/data/baselineRuleset.json';
import { evaluateCase } from '@/lib/ruleEngine';
import { replay } from '@/lib/replayEngine';
import type { Case, Ruleset, Diff } from '@/lib/types';

export default function Home() {
  const [liveRuleset, setLiveRuleset] = useState<Ruleset>(
    baselineRulesetRaw as unknown as Ruleset,
  );
  const [proposedRuleset, setProposedRuleset] = useState<Ruleset | null>(null);

  const casesWithComputed = useMemo(
    () =>
      corpus.map((c) => ({
        ...(c as unknown as Case),
        computedResult: evaluateCase(liveRuleset, c as unknown as Case),
      })),
    [liveRuleset],
  );

  const diff: Diff | null = useMemo(
    () =>
      proposedRuleset
        ? replay(proposedRuleset, corpus as unknown as readonly Case[])
        : null,
    [proposedRuleset],
  );

  const handleShip = useCallback(() => {
    if (!proposedRuleset) return;
    setLiveRuleset({
      ...proposedRuleset,
      version: liveRuleset.version + 1,
    });
    setProposedRuleset(null);
  }, [proposedRuleset, liveRuleset.version]);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-dr-ink">
          Dry Run
        </h1>
        <p className="mt-1 text-sm text-dr-ink-muted">
          Change preview — {corpus.length} historical invoice decisions
        </p>
      </header>

      {/* Key resets the form when the live ruleset version changes (on ship) */}
      <ChangeProposalForm
        key={liveRuleset.version}
        liveRuleset={liveRuleset}
        onChange={setProposedRuleset}
      />

      {diff && (
        diff.changedCases.length > 0 ? (
          <ReplayPreview diff={diff} onShip={handleShip} />
        ) : (
          <div className="mb-8 p-5 border rounded-lg border-dr-border bg-dr-paper-inset text-sm text-dr-ink-muted">
            This change would not affect any of the {diff.totalCasesEvaluated} historical decisions.
          </div>
        )
      )}

      <CaseTable cases={casesWithComputed} />
    </div>
  );
}
