/**
 * Typed corpus loader.
 *
 * Imports the committed data files and re-exports them with the
 * domain types from types.ts.  No logic — just a typed barrel.
 */

import type { Case, Ruleset } from './types';
import rawCorpus from '@/data/corpus.json';
import rawBaselineRuleset from '@/data/baselineRuleset.json';

export const corpus: readonly Case[] = rawCorpus as unknown as readonly Case[];

export const baselineRuleset: Ruleset = rawBaselineRuleset as unknown as Ruleset;
