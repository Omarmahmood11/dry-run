import { test, describe } from 'node:test';
import assert from 'node:assert';
import { evaluateCase } from './ruleEngine';
import type { Case, Ruleset } from './types';

// Helper to create a dummy case for testing
function createDummyCase(overrides: Partial<Case> = {}): Case {
  return {
    id: 'TEST-123',
    submissionDate: '2026-09-01',
    source: 'portal',
    vendor: {
      name: 'Test Vendor',
      id: 'V001',
      relationshipAgeDays: 100,
      historicalInvoiceCount: 10,
      typicalAmountRange: { min: 1000, max: 50000 },
    },
    invoice: {
      totalAmount: 10000,
      subtotal: 10000,
      taxRate: 0,
      taxAmount: 0,
      currency: 'INR',
      lineItems: [],
      purchaseOrderReference: 'PO-123',
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
    recordedDecision: { decision: 'APPROVE', rulesetVersion: 1 },
    groundTruth: { truth: 'LEGITIMATE', resolutionNote: 'OK' },
    ...overrides,
  };
}

function createDummyRuleset(overrides: Partial<Ruleset> = {}): Ruleset {
  return {
    version: 1,
    thresholds: {
      amountThreshold: 250000,
      extractionConfidenceThreshold: 0.85,
    },
    policyChecks: {
      duplicate_hash_match: true,
      bank_details_changed: true,
      new_vendor: false,
      amount_anomaly: true,
      po_missing: false,
      po_quantity_mismatch: true,
      po_price_variance: true,
      tax_miscalculation: true,
      currency_mismatch: true,
      vendor_unverified: true,
    },
    vendorExceptions: [],
    ...overrides,
  };
}

describe('Rule Engine', () => {
  test('determinism: running evaluation twice produces identical output', () => {
    const ruleset = createDummyRuleset();
    const caseData = createDummyCase();
    
    const result1 = evaluateCase(ruleset, caseData);
    const result2 = evaluateCase(ruleset, caseData);
    
    assert.deepStrictEqual(result1, result2);
  });

  test('default: resolves to ESCALATE if everything passes but amount is too high', () => {
    // This tests the "default" or "threshold" failure for amount
    const ruleset = createDummyRuleset({
      thresholds: { amountThreshold: 5000, extractionConfidenceThreshold: 0.8 },
    });
    const caseData = createDummyCase({
      invoice: { ...createDummyCase().invoice, totalAmount: 10000 },
    });

    const result = evaluateCase(ruleset, caseData);
    assert.strictEqual(result.decision, 'ESCALATE');
    assert.deepStrictEqual(result.responsibleRule, { type: 'threshold', field: 'amountThreshold' });
  });
  
  test('threshold rule: fails if logic is inverted', () => {
    const ruleset = createDummyRuleset({
      thresholds: { amountThreshold: 15000, extractionConfidenceThreshold: 0.8 },
    });
    const caseData = createDummyCase({
      invoice: { ...createDummyCase().invoice, totalAmount: 10000 },
      extractionConfidence: 0.9,
    });
    
    // With 10000 < 15000, it should APPROVE
    const result = evaluateCase(ruleset, caseData);
    assert.strictEqual(result.decision, 'APPROVE');
    
    // Invert the threshold to make it fail (ESCALATE)
    const invertedRuleset = createDummyRuleset({
      thresholds: { amountThreshold: 5000, extractionConfidenceThreshold: 0.8 },
    });
    const invertedResult = evaluateCase(invertedRuleset, caseData);
    assert.notStrictEqual(result.decision, invertedResult.decision);
    assert.strictEqual(invertedResult.decision, 'ESCALATE');
  });

  test('policy check rule: fails if logic is inverted', () => {
    const ruleset = createDummyRuleset({
      policyChecks: { ...createDummyRuleset().policyChecks, bank_details_changed: true },
    });
    const caseData = createDummyCase({
      intakeFlags: { ...createDummyCase().intakeFlags, bank_details_changed: true },
    });

    // Enabled check should ESCALATE
    const result = evaluateCase(ruleset, caseData);
    assert.strictEqual(result.decision, 'ESCALATE');
    assert.deepStrictEqual(result.responsibleRule, { type: 'policyCheck', flag: 'bank_details_changed' });

    // Invert the policy check rule
    const invertedRuleset = createDummyRuleset({
      policyChecks: { ...ruleset.policyChecks, bank_details_changed: false },
    });
    const invertedResult = evaluateCase(invertedRuleset, caseData);
    assert.notStrictEqual(result.decision, invertedResult.decision);
    assert.strictEqual(invertedResult.decision, 'APPROVE'); // Falls through to thresholds
  });

  test('vendor exception rule: fails if logic is inverted', () => {
    const ruleset = createDummyRuleset({
      vendorExceptions: [{
        vendorId: 'V001',
        vendorName: 'Test Vendor',
        exception: { kind: 'auto_approve_below', amount: 50000 },
      }],
      thresholds: { amountThreshold: 5000, extractionConfidenceThreshold: 0.8 },
    });
    const caseData = createDummyCase({
      vendor: { ...createDummyCase().vendor, id: 'V001' },
      invoice: { ...createDummyCase().invoice, totalAmount: 10000 },
    });

    // Should APPROVE due to vendor exception, ignoring the low amountThreshold
    const result = evaluateCase(ruleset, caseData);
    assert.strictEqual(result.decision, 'APPROVE');
    assert.deepStrictEqual(result.responsibleRule, { type: 'vendorException', vendorId: 'V001', vendorName: 'Test Vendor' });

    // Invert the vendor exception logic (e.g. remove it)
    const invertedRuleset = createDummyRuleset({
      vendorExceptions: [],
      thresholds: { amountThreshold: 5000, extractionConfidenceThreshold: 0.8 },
    });
    const invertedResult = evaluateCase(invertedRuleset, caseData);
    assert.notStrictEqual(result.decision, invertedResult.decision);
    assert.strictEqual(invertedResult.decision, 'ESCALATE'); // Fails on threshold
  });

  test('evaluation order: blocking check wins over threshold', () => {
    // Case trips both a blocking check (duplicate_hash) and a threshold (amount > limit)
    const ruleset = createDummyRuleset({
      policyChecks: { ...createDummyRuleset().policyChecks, duplicate_hash_match: true },
      thresholds: { amountThreshold: 5000, extractionConfidenceThreshold: 0.8 },
    });
    const caseData = createDummyCase({
      intakeFlags: { ...createDummyCase().intakeFlags, duplicate_hash_match: true },
      invoice: { ...createDummyCase().invoice, totalAmount: 10000 },
    });

    // Should resolve to BLOCK, not ESCALATE
    const result = evaluateCase(ruleset, caseData);
    assert.strictEqual(result.decision, 'BLOCK');
    assert.deepStrictEqual(result.responsibleRule, { type: 'blockingCheck', flag: 'duplicate_hash_match' });
  });

  test('evaluation order: vendor exception overrides thresholds', () => {
    const ruleset = createDummyRuleset({
      vendorExceptions: [{
        vendorId: 'V001',
        vendorName: 'Test Vendor',
        exception: { kind: 'auto_approve_below', amount: 50000 },
      }],
      thresholds: { amountThreshold: 5000, extractionConfidenceThreshold: 0.8 },
    });
    const caseData = createDummyCase({
      vendor: { ...createDummyCase().vendor, id: 'V001' },
      invoice: { ...createDummyCase().invoice, totalAmount: 10000 },
    });

    // Should APPROVE due to vendor exception, ignoring the low amountThreshold
    const result = evaluateCase(ruleset, caseData);
    assert.strictEqual(result.decision, 'APPROVE');
  });

  test('evaluation order: vendor exception overrides policy checks below it', () => {
    const ruleset = createDummyRuleset({
      vendorExceptions: [{
        vendorId: 'V001',
        vendorName: 'Test Vendor',
        exception: { kind: 'auto_approve_below', amount: 50000 },
      }],
      policyChecks: { ...createDummyRuleset().policyChecks, bank_details_changed: true },
    });
    const caseData = createDummyCase({
      vendor: { ...createDummyCase().vendor, id: 'V001' },
      invoice: { ...createDummyCase().invoice, totalAmount: 10000 },
      intakeFlags: { ...createDummyCase().intakeFlags, bank_details_changed: true },
    });

    // Should APPROVE because vendor exceptions are evaluated before policy checks
    const result = evaluateCase(ruleset, caseData);
    assert.strictEqual(result.decision, 'APPROVE');
  });
});
