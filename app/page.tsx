'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { corpus } from '@/lib/corpus';
import CaseTable from '@/app/components/CaseTable';
import ChangeProposalForm from '@/app/components/ChangeProposalForm';
import ReplayPreview from '@/app/components/ReplayPreview';
import HistoryList from '@/app/components/HistoryList';
import { evaluateCase } from '@/lib/ruleEngine';
import { replay } from '@/lib/replayEngine';
import type { Case, Ruleset, Diff } from '@/lib/types';
import { useHistory } from '@/lib/useHistory';

export default function Home() {
  const { history, isLoaded, appendVersion } = useHistory();
  const [proposedRuleset, setProposedRuleset] = useState<Ruleset | null>(null);
  const [proposedSummary, setProposedSummary] = useState<string>('');

  const liveRuleset = useMemo(() => {
    if (!isLoaded || history.length === 0) return null;
    return history[history.length - 1].ruleset;
  }, [history, isLoaded]);

  const casesWithComputed = useMemo(
    () => {
      if (!liveRuleset) return [];
      return corpus.map((c) => ({
        ...(c as unknown as Case),
        computedResult: evaluateCase(liveRuleset, c as unknown as Case),
      }));
    },
    [liveRuleset],
  );

  const diff: Diff | null = useMemo(
    () =>
      proposedRuleset && liveRuleset
        ? replay(liveRuleset, proposedRuleset, corpus as unknown as readonly Case[])
        : null,
    [proposedRuleset, liveRuleset],
  );

  const handleShip = useCallback(() => {
    if (!proposedRuleset || !diff) return;
    appendVersion(proposedRuleset, proposedSummary, diff.counts);
    setProposedRuleset(null);
    setProposedSummary('');
  }, [proposedRuleset, proposedSummary, diff, appendVersion]);

  const handleRollback = useCallback((versionToRestore: number) => {
    if (!liveRuleset) return;
    const targetEntry = history.find(e => e.version === versionToRestore);
    if (!targetEntry) return;

    // Diff the rollback against the current live ruleset
    const rollbackDiff = replay(liveRuleset, targetEntry.ruleset, corpus as unknown as readonly Case[]);
    
    appendVersion(targetEntry.ruleset, `Rolled back to version ${versionToRestore}`, rollbackDiff.counts);
  }, [history, liveRuleset, appendVersion]);

  if (!isLoaded || !liveRuleset) {
    return null; // Or a loading spinner
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-dr-ink">
            Dry Run
          </h1>
          <p className="mt-1 text-sm text-dr-ink-muted">
            Change preview — {corpus.length} historical invoice decisions
          </p>
        </div>
        <Link
          href="/findings"
          className="text-sm font-medium text-dr-ink-muted hover:text-dr-ink underline hover:no-underline"
        >
          Findings
        </Link>
      </header>

      <div className="lg:flex lg:gap-8 lg:items-start mb-8">
        <div className="lg:w-[360px] shrink-0 mb-8 lg:mb-0 flex flex-col">
          {/* Key resets the form when the live ruleset version changes (on ship) */}
          <ChangeProposalForm
            key={liveRuleset.version}
            liveRuleset={liveRuleset}
            onChange={(ruleset, summary) => {
              setProposedRuleset(ruleset);
              setProposedSummary(summary || '');
            }}
          />
          <HistoryList history={history} onRollback={handleRollback} />
        </div>

        <div className="lg:flex-1 min-w-0">
          {diff ? (
            diff.changedCases.length > 0 ? (
              <ReplayPreview diff={diff} onShip={handleShip} />
            ) : (
              <div className="p-5 border rounded-lg border-dr-border bg-dr-paper-inset text-sm text-dr-ink-muted">
                This change would not affect any of the {diff.totalCasesEvaluated} historical decisions.
              </div>
            )
          ) : (
            <div className="p-10 border border-dashed rounded-lg border-dr-border flex items-center justify-center text-sm text-dr-ink-muted">
              Select a rule to propose a change and see its impact here.
            </div>
          )}
        </div>
      </div>

      <CaseTable cases={casesWithComputed} />
    </div>
  );
}
