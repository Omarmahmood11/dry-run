import { evaluateCase } from './ruleEngine';
import type { Case, Ruleset, Diff, ChangedCase, Classification, Decision } from './types';

// Decision ordering: APPROVE < ESCALATE < BLOCK
const DECISION_ORDER: Record<Decision, number> = {
  APPROVE: 0,
  ESCALATE: 1,
  BLOCK: 2,
};

/**
 * Classifies a change according to replay.md §7.
 */
export function classifyChange(
  oldDecision: Decision,
  newDecision: Decision,
  groundTruth: 'LEGITIMATE' | 'PROBLEM'
): Classification {
  const oldRank = DECISION_ORDER[oldDecision];
  const newRank = DECISION_ORDER[newDecision];

  const isMorePermissive = newRank < oldRank;
  const isMoreConservative = newRank > oldRank;

  if (isMoreConservative && groundTruth === 'PROBLEM') {
    return 'PREVENTED_LOSS';
  }

  if (isMorePermissive && groundTruth === 'LEGITIMATE') {
    return 'SAVED_EFFORT';
  }

  if (isMoreConservative && groundTruth === 'LEGITIMATE') {
    return 'ADDED_FRICTION';
  }

  if (isMorePermissive && groundTruth === 'PROBLEM') {
    if (oldDecision === 'BLOCK' && newDecision === 'ESCALATE') {
      return 'WEAKENED_CONTROL';
    }
    if (newDecision === 'APPROVE') {
      return 'MISSED_PROBLEM';
    }
  }

  throw new Error(`Unexpected change transition: ${oldDecision} -> ${newDecision} with truth ${groundTruth}`);
}

export function replay(proposedRuleset: Ruleset, corpus: readonly Case[]): Diff {
  const counts: Record<Classification, number> = {
    PREVENTED_LOSS: 0,
    SAVED_EFFORT: 0,
    ADDED_FRICTION: 0,
    WEAKENED_CONTROL: 0,
    MISSED_PROBLEM: 0,
  };

  let unchangedCount = 0;
  const changedCases: ChangedCase[] = [];

  for (const caseData of corpus) {
    const oldDecision = caseData.recordedDecision.decision;
    const { decision: newDecision, responsibleRule } = evaluateCase(proposedRuleset, caseData);

    if (oldDecision === newDecision) {
      unchangedCount++;
      continue;
    }

    const classification = classifyChange(oldDecision, newDecision, caseData.groundTruth.truth);
    counts[classification]++;

    changedCases.push({
      caseData,
      oldDecision,
      newDecision,
      classification,
      responsibleRule,
    });
  }

  return {
    totalCasesEvaluated: corpus.length,
    unchangedCount,
    counts,
    changedCases,
    missedProblemCount: counts.MISSED_PROBLEM,
  };
}
