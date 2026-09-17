'use client';

import type { RulesetHistoryEntry } from '@/lib/types';

interface HistoryListProps {
  history: RulesetHistoryEntry[];
  onRollback: (version: number) => void;
}

export default function HistoryList({ history, onRollback }: HistoryListProps) {
  // Show history in reverse chronological order
  const reversed = [...history].reverse();

  return (
    <div className="bg-dr-paper border border-dr-border rounded-lg p-5 shadow-sm mt-8">
      <h2 className="text-base font-semibold text-dr-ink mb-4">Version History</h2>
      
      <div className="flex flex-col gap-4">
        {reversed.map((entry, index) => {
          const isCurrent = index === 0;
          const date = new Date(entry.timestamp);
          const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          
          let warning = null;
          if (entry.replayCounts) {
            const missed = entry.replayCounts.MISSED_PROBLEM;
            const weakened = entry.replayCounts.WEAKENED_CONTROL;
            if (missed > 0) {
              warning = <span className="text-xs text-dr-warning font-medium mt-1 block">⚠ {missed} missed problem{missed > 1 ? 's' : ''} shipped</span>;
            } else if (weakened > 0) {
              warning = <span className="text-xs text-dr-caution font-medium mt-1 block">⚠ {weakened} weakened control{weakened > 1 ? 's' : ''} shipped</span>;
            }
          }

          return (
            <div key={entry.version} className={`border-l-2 pl-3 py-1 ${isCurrent ? 'border-dr-ink' : 'border-dr-border'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-dr-ink-muted">
                  Version {entry.version} {isCurrent && <span className="ml-1 text-dr-ink">(Current)</span>}
                </span>
                <span className="text-xs text-dr-ink-muted">{dateStr}, {timeStr}</span>
              </div>
              <p className="text-sm text-dr-ink leading-snug">{entry.changeSummary}</p>
              {warning}
              {!isCurrent && (
                <button
                  onClick={() => onRollback(entry.version)}
                  className="mt-2 text-xs font-medium text-dr-ink underline hover:no-underline cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                >
                  Rollback to this
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
