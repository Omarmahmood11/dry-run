'use client';

import { useState } from 'react';
import type {
  Diff,
  Classification,
  Decision,
  RuleAttribution,
} from '@/lib/types';
import {
  CLASSIFICATION_ORDER,
  getVisibleChangedCases,
} from '@/lib/changedCases';

const CLASSIFICATION_LABELS: Readonly<Record<Classification, string>> = {
  MISSED_PROBLEM: 'Missed problem',
  WEAKENED_CONTROL: 'Weakened control',
  ADDED_FRICTION: 'Added friction',
  PREVENTED_LOSS: 'Prevented loss',
  SAVED_EFFORT: 'Saved effort',
};

const CLASSIFICATION_DESCRIPTIONS: Readonly<Record<Classification, string>> = {
  MISSED_PROBLEM:
    'Invoices with known problems that would now be auto-approved',
  WEAKENED_CONTROL:
    'Problem cases that lose their automatic block but still reach a human',
  ADDED_FRICTION:
    'Legitimate invoices that would now require human review',
  PREVENTED_LOSS: 'Problems that would now be caught',
  SAVED_EFFORT:
    'Legitimate invoices that would now flow through without a human',
};

type ClassificationTone = 'warning' | 'caution' | 'positive';

const CLASSIFICATION_TONE: Readonly<Record<Classification, ClassificationTone>> = {
  MISSED_PROBLEM: 'warning',
  WEAKENED_CONTROL: 'caution',
  ADDED_FRICTION: 'caution',
  PREVENTED_LOSS: 'positive',
  SAVED_EFFORT: 'positive',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function formatRuleAttribution(rule: RuleAttribution): string {
  switch (rule.type) {
    case 'blockingCheck':
      return 'Blocking check: duplicate hash match';
    case 'vendorException':
      return `Vendor exception: ${rule.vendorName}`;
    case 'policyCheck':
      return `Policy check: ${rule.flag.replace(/_/g, ' ')}`;
    case 'threshold':
      return rule.field === 'amountThreshold'
        ? 'Threshold: amount limit'
        : 'Threshold: extraction confidence';
    case 'default':
      return 'Default rule';
  }
}

function plural(
  count: number,
  singular: string,
  pluralForm: string,
): string {
  return count === 1 ? singular : pluralForm;
}

// ---------------------------------------------------------------------------
// Response state — replay.md §9
// ---------------------------------------------------------------------------

type ResponseState =
  | 'missed_problem'
  | 'weakened_control'
  | 'added_friction_only'
  | 'no_regressions';

function getResponseState(diff: Diff): ResponseState {
  if (diff.counts.MISSED_PROBLEM > 0) return 'missed_problem';
  if (diff.counts.WEAKENED_CONTROL > 0) return 'weakened_control';
  if (diff.counts.ADDED_FRICTION > 0) return 'added_friction_only';
  return 'no_regressions';
}

// ---------------------------------------------------------------------------
// Headline — both sides of the tradeoff, same weight
// ---------------------------------------------------------------------------

interface Headline {
  readonly gainText: string;
  readonly costText: string;
}

function buildHeadline(diff: Diff): Headline {
  const {
    SAVED_EFFORT,
    PREVENTED_LOSS,
    MISSED_PROBLEM,
    WEAKENED_CONTROL,
    ADDED_FRICTION,
  } = diff.counts;

  // Gain side: primary positive classification
  let gainText: string;
  if (SAVED_EFFORT > 0) {
    gainText = `${SAVED_EFFORT} ${plural(SAVED_EFFORT, 'invoice', 'invoices')} would stop needing a human.`;
  } else if (PREVENTED_LOSS > 0) {
    gainText = `${PREVENTED_LOSS} ${plural(PREVENTED_LOSS, 'problem', 'problems')} would now be caught.`;
  } else {
    gainText = 'No decisions would improve.';
  }

  // Cost side: primary negative classification
  let costText: string;
  if (MISSED_PROBLEM > 0) {
    costText = `${MISSED_PROBLEM} real ${plural(MISSED_PROBLEM, 'problem', 'problems')} would be paid automatically.`;
  } else if (WEAKENED_CONTROL > 0) {
    costText = `${WEAKENED_CONTROL} ${plural(WEAKENED_CONTROL, 'case', 'cases')} would lose ${plural(WEAKENED_CONTROL, 'its', 'their')} automatic block but would still reach a human.`;
  } else if (ADDED_FRICTION > 0) {
    costText = `${ADDED_FRICTION} legitimate ${plural(ADDED_FRICTION, 'invoice', 'invoices')} would now need a human.`;
  } else {
    costText = 'No new issues would be introduced.';
  }

  return { gainText, costText };
}

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

const BANNER_STYLES: Readonly<Record<ResponseState, string>> = {
  missed_problem:
    'bg-dr-warning-surface border-dr-warning-border',
  weakened_control:
    'bg-dr-caution-surface border-dr-caution-border',
  added_friction_only:
    'bg-dr-paper-inset border-dr-border',
  no_regressions:
    'bg-dr-positive-surface border-dr-positive-border',
};

const BANNER_ADVICE: Readonly<Record<ResponseState, string>> = {
  missed_problem: 'This change is not recommended for shipping.',
  weakened_control:
    'Automatic barriers are removed but human review remains.',
  added_friction_only:
    'This change adds to the human review workload.',
  no_regressions: 'This change introduces no regressions.',
};

const BANNER_ADVICE_TONE: Readonly<Record<ResponseState, string>> = {
  missed_problem: 'text-dr-warning',
  weakened_control: 'text-dr-caution',
  added_friction_only: 'text-dr-ink-muted',
  no_regressions: 'text-dr-positive',
};

const TONE_CARD_CLASSES: Readonly<Record<ClassificationTone, string>> = {
  warning: 'text-dr-warning bg-dr-warning-surface border-dr-warning-border',
  caution: 'text-dr-caution bg-dr-caution-surface border-dr-caution-border',
  positive: 'text-dr-positive bg-dr-positive-surface border-dr-positive-border',
};

const TONE_BADGE_CLASSES: Readonly<Record<ClassificationTone, string>> = {
  warning: 'text-dr-warning bg-dr-warning-surface',
  caution: 'text-dr-caution bg-dr-caution-surface',
  positive: 'text-dr-positive bg-dr-positive-surface',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DecisionBadge({ decision }: { readonly decision: Decision }) {
  const classes =
    decision === 'APPROVE'
      ? 'bg-dr-positive-surface text-dr-positive'
      : decision === 'ESCALATE'
        ? 'bg-dr-caution-surface text-dr-caution'
        : 'bg-dr-warning-surface text-dr-warning';

  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${classes}`}>
      {decision}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ReplayPreviewProps {
  readonly diff: Diff;
  readonly onShip: () => void;
}

export default function ReplayPreview({ diff, onShip }: ReplayPreviewProps) {
  const [confirmingShip, setConfirmingShip] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [prevDiff, setPrevDiff] = useState(diff);

  if (prevDiff !== diff) {
    setPrevDiff(diff);
    setIsExpanded(false);
  }

  const state = getResponseState(diff);
  const { gainText, costText } = buildHeadline(diff);
  const totalChanged = diff.changedCases.length;

  const hasRegressions =
    diff.counts.MISSED_PROBLEM > 0 || diff.counts.WEAKENED_CONTROL > 0;

  const {
    visibleCases,
    initialCutoff,
    hasHiddenCases,
    canCollapse,
  } = getVisibleChangedCases(
    diff.changedCases,
    diff.counts.MISSED_PROBLEM,
    isExpanded,
  );

  const handleShipClick = () => {
    if (hasRegressions && !confirmingShip) {
      setConfirmingShip(true);
      return;
    }
    setConfirmingShip(false);
    onShip();
  };

  // Confirmation text for the ship button
  let confirmLabel = '';
  if (diff.counts.MISSED_PROBLEM > 0) {
    confirmLabel = `Confirm: ship with ${diff.counts.MISSED_PROBLEM} missed ${plural(diff.counts.MISSED_PROBLEM, 'problem', 'problems')}`;
  } else if (diff.counts.WEAKENED_CONTROL > 0) {
    confirmLabel = `Confirm: ship with ${diff.counts.WEAKENED_CONTROL} weakened ${plural(diff.counts.WEAKENED_CONTROL, 'control', 'controls')}`;
  }

  return (
    <div className="mb-8">
      {/* ── Headline banner ────────────────────────────────────── */}
      <div
        className={`border rounded-lg p-5 mb-5 ${BANNER_STYLES[state]}`}
        id="replay-headline"
      >
        <div className="flex flex-col gap-1.5">
          <p className="text-lg font-semibold leading-snug text-dr-ink">
            {gainText}
          </p>
          <p className="text-lg font-semibold leading-snug text-dr-ink">
            {costText}
          </p>
        </div>
        <p className={`mt-3 text-sm font-medium ${BANNER_ADVICE_TONE[state]}`}>
          {BANNER_ADVICE[state]}
        </p>
      </div>

      {/* ── Five classification counts ─────────────────────────── */}
      <div className="flex flex-col gap-3 mb-5" id="classification-counts">
        {(() => {
          const missedCount = diff.counts.MISSED_PROBLEM;
          const missedZero = missedCount === 0;
          return (
            <div
              className={`border rounded-lg p-5 flex items-center justify-between ${
                missedZero
                  ? 'border-dr-border bg-transparent opacity-60 grayscale'
                  : TONE_CARD_CLASSES.warning
              }`}
              id="count-MISSED_PROBLEM"
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider mb-1">
                  {CLASSIFICATION_LABELS.MISSED_PROBLEM}
                </p>
                <p className="text-sm opacity-90 max-w-sm">
                  {CLASSIFICATION_DESCRIPTIONS.MISSED_PROBLEM}
                </p>
              </div>
              <p className="text-5xl font-bold tabular-nums">{missedCount}</p>
            </div>
          );
        })()}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CLASSIFICATION_ORDER.slice(1).map((classification) => {
            const count = diff.counts[classification];
            const tone = CLASSIFICATION_TONE[classification];
            const isZero = count === 0;
            return (
              <div
                key={classification}
                className={`border rounded-lg p-3 ${
                  isZero
                    ? 'border-dr-border bg-transparent opacity-60 grayscale'
                    : TONE_CARD_CLASSES[tone]
                }`}
                id={`count-${classification}`}
              >
                <p className="text-2xl font-bold tabular-nums">{count}</p>
                <p className="text-sm font-medium mt-1">
                  {CLASSIFICATION_LABELS[classification]}
                </p>
                <p className="text-xs mt-0.5 opacity-70">
                  {CLASSIFICATION_DESCRIPTIONS[classification]}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Summary stats ──────────────────────────────────────── */}
      <div className="flex gap-6 text-sm text-dr-ink-muted mb-5" id="replay-summary">
        <span>{diff.totalCasesEvaluated} cases evaluated</span>
        <span>{diff.unchangedCount} unchanged</span>
        <span>{totalChanged} changed</span>
      </div>

      {/* ── Changed cases table ────────────────────────────────── */}
      {totalChanged > 0 && (
        <div
          className="overflow-x-auto rounded-lg border border-dr-border mb-5"
          id="changed-cases-table"
        >
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-dr-border bg-dr-paper-inset text-xs font-semibold uppercase tracking-wide text-dr-ink-muted">
              <tr>
                <th className="px-4 py-3">Case ID</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Old Decision</th>
                <th className="px-4 py-3">New Decision</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">Responsible Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dr-border">
              {visibleCases.map((changed) => {
                const tone = CLASSIFICATION_TONE[changed.classification];
                return (
                  <tr
                    key={changed.caseData.id}
                    className="hover:bg-dr-paper-inset"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-dr-ink">
                      {changed.caseData.id}
                    </td>
                    <td className="px-4 py-2.5 text-dr-ink">
                      {changed.caseData.vendor.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-dr-ink">
                      {formatINR(changed.caseData.invoice.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <DecisionBadge decision={changed.oldDecision} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <DecisionBadge decision={changed.newDecision} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${TONE_BADGE_CLASSES[tone]}`}
                      >
                        {CLASSIFICATION_LABELS[changed.classification]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-dr-ink-muted">
                      {formatRuleAttribution(changed.responsibleRule)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ── Table footer with count and expand control ── */}
          <div
            className="border-t border-dr-border bg-dr-paper px-4 py-2.5 flex items-center justify-between text-xs text-dr-ink-muted"
            id="changed-cases-table-footer"
          >
            <span id="changed-cases-count-label">
              {hasHiddenCases && !isExpanded
                ? `Showing ${visibleCases.length} of ${totalChanged} changed cases`
                : `Showing all ${totalChanged} changed cases`}
            </span>
            {hasHiddenCases && !isExpanded && (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                id="expand-changed-cases"
                className="font-medium text-dr-ink underline hover:no-underline cursor-pointer"
              >
                Show all {totalChanged} cases &darr;
              </button>
            )}
            {canCollapse && (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                id="collapse-changed-cases"
                className="font-medium text-dr-ink-muted hover:text-dr-ink underline hover:no-underline cursor-pointer"
              >
                Show fewer (first {initialCutoff}) &uarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Ship action ────────────────────────────────────────── */}
      <div className="flex items-center gap-4" id="ship-action">
        {!confirmingShip ? (
          <>
            <button
              onClick={handleShipClick}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-dr-ink text-white hover:opacity-90 cursor-pointer"
              id="ship-button"
            >
              Ship this change
            </button>
            {state === 'missed_problem' && (
              <span className="text-sm text-dr-warning font-medium">
                ⚠ {diff.counts.MISSED_PROBLEM} missed{' '}
                {plural(diff.counts.MISSED_PROBLEM, 'problem', 'problems')} —
                shipping is not recommended
              </span>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleShipClick}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-dr-warning text-white hover:opacity-90 cursor-pointer"
              id="ship-confirm-button"
            >
              {confirmLabel}
            </button>
            <button
              onClick={() => setConfirmingShip(false)}
              className="px-4 py-2 text-sm font-medium text-dr-ink-muted hover:text-dr-ink cursor-pointer"
              id="ship-cancel-button"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
