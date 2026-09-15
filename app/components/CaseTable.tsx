'use client';

import { useState, useMemo } from 'react';
import type { Case, GroundTruth, EvaluationResult } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a number as ₹ with Indian-style grouping. */
function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/** List the active intake flags for a case as short labels. */
function activeFlags(c: Case): string[] {
  const flags: string[] = [];
  if (c.intakeFlags.duplicate_hash_match) flags.push('duplicate_hash');
  if (c.intakeFlags.bank_details_changed) flags.push('bank_change');
  if (c.intakeFlags.new_vendor) flags.push('new_vendor');
  if (c.intakeFlags.amount_anomaly) flags.push('amount_anomaly');
  if (c.intakeFlags.po_missing) flags.push('po_missing');
  if (c.intakeFlags.po_quantity_mismatch) flags.push('qty_mismatch');
  if (c.intakeFlags.po_price_variance > 0)
    flags.push(`price_var(${c.intakeFlags.po_price_variance.toFixed(0)}%)`);
  if (c.intakeFlags.tax_miscalculation) flags.push('tax_miscalc');
  if (c.intakeFlags.currency_mismatch) flags.push('currency');
  if (c.intakeFlags.vendor_unverified) flags.push('unverified');
  return flags;
}

// ---------------------------------------------------------------------------
// Sort state
// ---------------------------------------------------------------------------

type AmountSort = 'none' | 'asc' | 'desc';

function nextSort(current: AmountSort): AmountSort {
  if (current === 'none') return 'asc';
  if (current === 'asc') return 'desc';
  return 'none';
}

function sortIndicator(current: AmountSort): string {
  if (current === 'asc') return ' ▲';
  if (current === 'desc') return ' ▼';
  return '';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CaseTableProps {
  readonly cases: readonly (Case & { computedResult: EvaluationResult })[];
}

export default function CaseTable({ cases }: CaseTableProps) {
  const [groundTruthFilter, setGroundTruthFilter] = useState<
    'ALL' | GroundTruth
  >('ALL');
  const [amountSort, setAmountSort] = useState<AmountSort>('none');

  const displayed = useMemo(() => {
    let filtered =
      groundTruthFilter === 'ALL'
        ? [...cases]
        : cases.filter((c) => c.groundTruth.truth === groundTruthFilter);

    if (amountSort === 'asc') {
      filtered = [...filtered].sort(
        (a, b) => a.invoice.totalAmount - b.invoice.totalAmount,
      );
    } else if (amountSort === 'desc') {
      filtered = [...filtered].sort(
        (a, b) => b.invoice.totalAmount - a.invoice.totalAmount,
      );
    }

    return filtered;
  }, [cases, groundTruthFilter, amountSort]);

  return (
    <div>
      {/* ── Filter bar ────────────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium text-zinc-500">
          Ground truth:
        </span>
        {(['ALL', 'LEGITIMATE', 'PROBLEM'] as const).map((value) => (
          <button
            key={value}
            id={`filter-${value.toLowerCase()}`}
            onClick={() => setGroundTruthFilter(value)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              groundTruthFilter === value
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
            }`}
          >
            {value === 'ALL'
              ? `All (${cases.length})`
              : value === 'LEGITIMATE'
                ? `Legitimate (${cases.filter((c) => c.groundTruth.truth === 'LEGITIMATE').length})`
                : `Problem (${cases.filter((c) => c.groundTruth.truth === 'PROBLEM').length})`}
          </button>
        ))}
      </div>

      {/* ── Row count ─────────────────────────────────────────── */}
      <p className="mb-2 text-sm text-zinc-500">
        Showing {displayed.length} of {cases.length} cases
      </p>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Vendor</th>
              <th
                className="cursor-pointer select-none px-4 py-3 hover:text-zinc-900 dark:hover:text-zinc-100"
                id="sort-amount"
                onClick={() => setAmountSort(nextSort(amountSort))}
              >
                Amount{sortIndicator(amountSort)}
              </th>
              <th className="px-4 py-3">Intake Flags</th>
              <th className="px-4 py-3">Recorded Decision</th>
              <th className="px-4 py-3">Computed Decision</th>
              <th className="px-4 py-3">Ground Truth</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {displayed.map((c) => (
              <tr
                key={c.id}
                className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              >
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs">
                  {c.id}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  {c.submissionDate}
                </td>
                <td className="px-4 py-2.5">
                  <span className="block">{c.vendor.name}</span>
                  <span className="text-xs text-zinc-400">{c.vendor.id}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono">
                  {formatINR(c.invoice.totalAmount)}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {activeFlags(c).length === 0 ? (
                      <span className="text-xs text-zinc-300 dark:text-zinc-600">
                        —
                      </span>
                    ) : (
                      activeFlags(c).map((flag) => (
                        <span
                          key={flag}
                          className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        >
                          {flag}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                      c.recordedDecision.decision === 'APPROVE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : c.recordedDecision.decision === 'ESCALATE'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {c.recordedDecision.decision}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                      c.computedResult.decision === 'APPROVE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : c.computedResult.decision === 'ESCALATE'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {c.computedResult.decision}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                      c.groundTruth.truth === 'LEGITIMATE'
                        ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {c.groundTruth.truth}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
