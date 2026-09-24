import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getVisibleChangedCases, DEFAULT_CUTOFF } from './changedCases';
import type { ChangedCase, Classification } from './types';

function createDummyChangedCase(id: string, classification: Classification): ChangedCase {
  return {
    caseData: {
      id,
      submissionDate: '2026-01-01',
      source: 'portal',
      vendor: {
        name: 'Vendor ' + id,
        id: 'V_' + id,
        relationshipAgeDays: 100,
        historicalInvoiceCount: 10,
        typicalAmountRange: { min: 1000, max: 50000 },
      },
      invoice: {
        totalAmount: 10000,
        subtotal: 9000,
        taxRate: 0.1,
        taxAmount: 1000,
        currency: 'INR',
        lineItems: [],
        purchaseOrderReference: null,
        paymentBankDetails: { accountNumber: '123', ifscCode: 'ABC' },
      },
      intakeFlags: {
        duplicate_hash_match: false,
        bank_details_changed: false,
        new_vendor: false,
        amount_anomaly: false,
        po_missing: false,
        po_quantity_mismatch: false,
        po_price_variance: 0,
        tax_miscalculation: false,
        currency_mismatch: false,
        vendor_unverified: false,
      },
      extractionConfidence: 0.9,
      recordedDecision: { decision: 'ESCALATE', rulesetVersion: 1 },
      groundTruth: { truth: 'PROBLEM', resolutionNote: 'Test' },
    },
    oldDecision: 'ESCALATE',
    newDecision: 'APPROVE',
    classification,
    responsibleRule: { type: 'default' },
  };
}

describe('getVisibleChangedCases', () => {
  test('returns all cases when total is within default cutoff', () => {
    const cases: ChangedCase[] = [
      createDummyChangedCase('1', 'MISSED_PROBLEM'),
      createDummyChangedCase('2', 'SAVED_EFFORT'),
      createDummyChangedCase('3', 'ADDED_FRICTION'),
    ];

    const result = getVisibleChangedCases(cases, 1, false);

    assert.strictEqual(result.visibleCases.length, 3);
    assert.strictEqual(result.hasHiddenCases, false);
    assert.strictEqual(result.canCollapse, false);
    assert.strictEqual(result.initialCutoff, DEFAULT_CUTOFF);
  });

  test('screenshot one scenario: 7 changed cases with 4 missed problems shows first 5, keeping all 4 missed problems visible', () => {
    const cases: ChangedCase[] = [
      createDummyChangedCase('1', 'SAVED_EFFORT'),
      createDummyChangedCase('2', 'MISSED_PROBLEM'),
      createDummyChangedCase('3', 'SAVED_EFFORT'),
      createDummyChangedCase('4', 'MISSED_PROBLEM'),
      createDummyChangedCase('5', 'SAVED_EFFORT'),
      createDummyChangedCase('6', 'MISSED_PROBLEM'),
      createDummyChangedCase('7', 'MISSED_PROBLEM'),
    ];

    // Collapsed state
    const collapsed = getVisibleChangedCases(cases, 4, false);
    assert.strictEqual(collapsed.sortedCases.length, 7);
    assert.strictEqual(collapsed.visibleCases.length, 5);
    assert.strictEqual(collapsed.hasHiddenCases, true);
    assert.strictEqual(collapsed.canCollapse, false);

    // Verify all 4 missed problems are in visible cases
    const visibleMissed = collapsed.visibleCases.filter(c => c.classification === 'MISSED_PROBLEM');
    assert.strictEqual(visibleMissed.length, 4);

    // Expanded state
    const expanded = getVisibleChangedCases(cases, 4, true);
    assert.strictEqual(expanded.visibleCases.length, 7);
    assert.strictEqual(expanded.hasHiddenCases, true);
    assert.strictEqual(expanded.canCollapse, true);
  });

  test('screenshot two scenario: 9 changed cases with 2 missed problems shows first 5, keeping both missed problems visible', () => {
    const cases: ChangedCase[] = [
      createDummyChangedCase('1', 'SAVED_EFFORT'),
      createDummyChangedCase('2', 'SAVED_EFFORT'),
      createDummyChangedCase('3', 'MISSED_PROBLEM'),
      createDummyChangedCase('4', 'SAVED_EFFORT'),
      createDummyChangedCase('5', 'SAVED_EFFORT'),
      createDummyChangedCase('6', 'MISSED_PROBLEM'),
      createDummyChangedCase('7', 'SAVED_EFFORT'),
      createDummyChangedCase('8', 'SAVED_EFFORT'),
      createDummyChangedCase('9', 'SAVED_EFFORT'),
    ];

    const collapsed = getVisibleChangedCases(cases, 2, false);
    assert.strictEqual(collapsed.visibleCases.length, 5);
    assert.strictEqual(collapsed.hasHiddenCases, true);
    assert.strictEqual(collapsed.canCollapse, false);

    const visibleMissed = collapsed.visibleCases.filter(c => c.classification === 'MISSED_PROBLEM');
    assert.strictEqual(visibleMissed.length, 2);

    const expanded = getVisibleChangedCases(cases, 2, true);
    assert.strictEqual(expanded.visibleCases.length, 9);
    assert.strictEqual(expanded.canCollapse, true);
  });

  test('critical rule: when missed problems exceed 5, initial cutoff expands to never hide missed problems', () => {
    const cases: ChangedCase[] = [
      createDummyChangedCase('1', 'MISSED_PROBLEM'),
      createDummyChangedCase('2', 'MISSED_PROBLEM'),
      createDummyChangedCase('3', 'MISSED_PROBLEM'),
      createDummyChangedCase('4', 'MISSED_PROBLEM'),
      createDummyChangedCase('5', 'MISSED_PROBLEM'),
      createDummyChangedCase('6', 'MISSED_PROBLEM'),
      createDummyChangedCase('7', 'MISSED_PROBLEM'),
      createDummyChangedCase('8', 'SAVED_EFFORT'),
      createDummyChangedCase('9', 'SAVED_EFFORT'),
      createDummyChangedCase('10', 'SAVED_EFFORT'),
    ];

    const collapsed = getVisibleChangedCases(cases, 7, false);
    // Even though default cutoff is 5, it expands to 7 to show all 7 missed problems
    assert.strictEqual(collapsed.initialCutoff, 7);
    assert.strictEqual(collapsed.visibleCases.length, 7);
    assert.strictEqual(collapsed.hasHiddenCases, true);

    const visibleMissed = collapsed.visibleCases.filter(c => c.classification === 'MISSED_PROBLEM');
    assert.strictEqual(visibleMissed.length, 7);

    // The hidden cases should only be SAVED_EFFORT, never MISSED_PROBLEM
    const hiddenCases = collapsed.sortedCases.slice(collapsed.initialCutoff);
    assert.strictEqual(hiddenCases.length, 3);
    hiddenCases.forEach(c => {
      assert.notStrictEqual(c.classification, 'MISSED_PROBLEM');
    });
  });
});
