/**
 * Logic for sorting and displaying changed cases in replay preview.
 *
 * Rules:
 * 1. Cases are ordered by classification severity (MISSED_PROBLEM first).
 * 2. The default visible count is 5, but is expanded to include ALL missed
 *    problems if missedProblemCount > 5. Missed problems are never hidden
 *    behind a cut-off.
 * 3. An expand control allows revealing the full list of changed cases.
 */

import type { Classification, ChangedCase } from './types';

export const CLASSIFICATION_ORDER: readonly Classification[] = [
  'MISSED_PROBLEM',
  'WEAKENED_CONTROL',
  'ADDED_FRICTION',
  'PREVENTED_LOSS',
  'SAVED_EFFORT',
];

export const DEFAULT_CUTOFF = 5;

export interface VisibleChangedCasesResult {
  readonly sortedCases: readonly ChangedCase[];
  readonly visibleCases: readonly ChangedCase[];
  readonly initialCutoff: number;
  readonly hasHiddenCases: boolean;
  readonly canCollapse: boolean;
}

/**
 * Computes sorted changed cases and slices them according to the cutoff rules.
 */
export function getVisibleChangedCases(
  changedCases: readonly ChangedCase[],
  missedProblemCount: number,
  isExpanded: boolean,
  defaultCutoff: number = DEFAULT_CUTOFF,
): VisibleChangedCasesResult {
  const sortedCases = [...changedCases].sort(
    (a, b) =>
      CLASSIFICATION_ORDER.indexOf(a.classification) -
      CLASSIFICATION_ORDER.indexOf(b.classification),
  );

  const initialCutoff = Math.max(defaultCutoff, missedProblemCount);
  const totalChanged = sortedCases.length;
  const hasHiddenCases = totalChanged > initialCutoff;
  const canCollapse = hasHiddenCases && isExpanded;

  const visibleCases =
    isExpanded || !hasHiddenCases
      ? sortedCases
      : sortedCases.slice(0, initialCutoff);

  return {
    sortedCases,
    visibleCases,
    initialCutoff,
    hasHiddenCases,
    canCollapse,
  };
}
