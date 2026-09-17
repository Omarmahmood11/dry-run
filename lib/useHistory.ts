import { useState, useEffect, useCallback } from 'react';
import type { RulesetHistoryEntry, Ruleset, Classification } from './types';
import baselineRulesetRaw from '@/data/baselineRuleset.json';

const HISTORY_STORAGE_KEY = 'dry_run_ruleset_history';

// Fallback in-memory state in case localStorage fails
let inMemoryHistory: RulesetHistoryEntry[] = [];

export function useHistory() {
  const [history, setHistory] = useState<RulesetHistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    } catch (err) {
      console.warn('localStorage is unavailable for reading, using in-memory state.', err);
    }

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as RulesetHistoryEntry[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          inMemoryHistory = parsed;
          setIsLoaded(true);
          return;
        }
      } catch (err) {
        console.error('Failed to parse history from localStorage', err);
      }
    }

    // Initialize with baseline if no valid history found
    const initialEntry: RulesetHistoryEntry = {
      version: 1,
      ruleset: baselineRulesetRaw as unknown as Ruleset,
      timestamp: new Date().toISOString(),
      changeSummary: 'Baseline',
      replayCounts: null,
    };

    setHistory([initialEntry]);
    inMemoryHistory = [initialEntry];
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([initialEntry]));
    } catch (err) {
      console.warn('localStorage is unavailable for writing, using in-memory state.', err);
    }
    setIsLoaded(true);
  }, []);

  const appendVersion = useCallback(
    (
      ruleset: Ruleset,
      changeSummary: string,
      replayCounts: Readonly<Record<Classification, number>> | null,
    ) => {
      setHistory((prev) => {
        const nextVersion = prev[prev.length - 1].version + 1;
        const newRuleset = { ...ruleset, version: nextVersion };
        
        const newEntry: RulesetHistoryEntry = {
          version: nextVersion,
          ruleset: newRuleset,
          timestamp: new Date().toISOString(),
          changeSummary,
          replayCounts,
        };

        const newHistory = [...prev, newEntry];
        inMemoryHistory = newHistory;

        try {
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
        } catch (err) {
          console.warn('localStorage is unavailable for writing, keeping in-memory state.', err);
        }

        return newHistory;
      });
    },
    [],
  );

  return { history, isLoaded, appendVersion };
}
