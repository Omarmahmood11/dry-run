import { test, describe } from 'node:test';
import assert from 'node:assert';
import { classifyChange, replay } from './replayEngine';
import type { Ruleset, Case } from './types';
import { corpus } from './corpus';
import baselineRulesetRaw from '../data/baselineRuleset.json';

const baselineRuleset = baselineRulesetRaw as unknown as Ruleset;

describe('replayEngine classification', () => {
  test('classifies PREVENTED_LOSS', () => {
    assert.strictEqual(classifyChange('APPROVE', 'ESCALATE', 'PROBLEM'), 'PREVENTED_LOSS');
    assert.strictEqual(classifyChange('APPROVE', 'BLOCK', 'PROBLEM'), 'PREVENTED_LOSS');
    assert.strictEqual(classifyChange('ESCALATE', 'BLOCK', 'PROBLEM'), 'PREVENTED_LOSS');
  });

  test('classifies SAVED_EFFORT', () => {
    assert.strictEqual(classifyChange('ESCALATE', 'APPROVE', 'LEGITIMATE'), 'SAVED_EFFORT');
    assert.strictEqual(classifyChange('BLOCK', 'APPROVE', 'LEGITIMATE'), 'SAVED_EFFORT');
    assert.strictEqual(classifyChange('BLOCK', 'ESCALATE', 'LEGITIMATE'), 'SAVED_EFFORT');
  });

  test('classifies ADDED_FRICTION', () => {
    assert.strictEqual(classifyChange('APPROVE', 'ESCALATE', 'LEGITIMATE'), 'ADDED_FRICTION');
    assert.strictEqual(classifyChange('APPROVE', 'BLOCK', 'LEGITIMATE'), 'ADDED_FRICTION');
    assert.strictEqual(classifyChange('ESCALATE', 'BLOCK', 'LEGITIMATE'), 'ADDED_FRICTION');
  });

  test('classifies WEAKENED_CONTROL', () => {
    assert.strictEqual(classifyChange('BLOCK', 'ESCALATE', 'PROBLEM'), 'WEAKENED_CONTROL');
  });

  test('classifies MISSED_PROBLEM', () => {
    assert.strictEqual(classifyChange('ESCALATE', 'APPROVE', 'PROBLEM'), 'MISSED_PROBLEM');
    assert.strictEqual(classifyChange('BLOCK', 'APPROVE', 'PROBLEM'), 'MISSED_PROBLEM');
  });
});

describe('replayEngine', () => {
  test('produces an empty diff for a change that alters nothing', () => {
    const diff = replay(baselineRuleset, baselineRuleset, corpus as unknown as readonly Case[]);
    
    // Baseline reproduces the recorded decisions perfectly for all 400 cases.
    assert.strictEqual(diff.totalCasesEvaluated, 400);
    assert.strictEqual(diff.unchangedCount, 400);
    assert.strictEqual(diff.changedCases.length, 0);
    assert.strictEqual(diff.missedProblemCount, 0);
    Object.values(diff.counts).forEach(count => {
      assert.strictEqual(count, 0);
    });
  });

  test('moves every non-APPROVE case to APPROVE under a maximally permissive ruleset', () => {
    const permissiveRuleset: Ruleset = {
      version: 2,
      thresholds: {
        amountThreshold: Infinity,
        extractionConfidenceThreshold: 0,
      },
      policyChecks: {
        duplicate_hash_match: false,
        bank_details_changed: false,
        new_vendor: false,
        amount_anomaly: false,
        po_missing: false,
        po_quantity_mismatch: false,
        po_price_variance: false,
        tax_miscalculation: false,
        currency_mismatch: false,
        vendor_unverified: false,
      },
      vendorExceptions: [],
    };

    const diff = replay(baselineRuleset, permissiveRuleset, corpus as unknown as readonly Case[]);

    const nonApproveInBaseline = (corpus as unknown as readonly Case[]).filter(
      (c) => c.recordedDecision.decision !== 'APPROVE'
    ).length;

    assert.strictEqual(diff.changedCases.length, nonApproveInBaseline);
    
    diff.changedCases.forEach((changedCase) => {
      assert.strictEqual(changedCase.newDecision, 'APPROVE');
      assert.notStrictEqual(changedCase.classification, undefined);
      assert.notStrictEqual(changedCase.responsibleRule, undefined);
    });

    const sumOfCounts = Object.values(diff.counts).reduce((a, b) => a + b, 0);
    assert.strictEqual(sumOfCounts, diff.changedCases.length);
  });

  test('does not mutate corpus or live ruleset', () => {
    const originalCorpusJson = JSON.stringify(corpus);
    const originalRulesetJson = JSON.stringify(baselineRuleset);

    const rulesetWithChange: Ruleset = {
      ...baselineRuleset,
      thresholds: {
        ...baselineRuleset.thresholds,
        amountThreshold: 1, // trigger lots of escalations
      },
    };

    replay(baselineRuleset, rulesetWithChange, corpus as unknown as readonly Case[]);

    assert.strictEqual(JSON.stringify(corpus), originalCorpusJson);
    assert.strictEqual(JSON.stringify(baselineRuleset), originalRulesetJson);
  });
});
