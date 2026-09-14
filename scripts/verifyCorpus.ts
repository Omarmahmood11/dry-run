/**
 * Corpus verification script for Dry Run.
 *
 * Runs the five checks from dataset.md §8:
 *   1. Trivial separability
 *   2. Flag-outcome collapse
 *   3. Zero-movement thresholds
 *   4. Regression availability  (run first per implementationPlan.md)
 *   5. Baseline imperfection
 *
 * Exit code 0 = all pass. Exit code 1 = any failure.
 */

import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { evaluateCase } from '../lib/ruleEngine';
import type {
  Case,
  Classification,
  Decision,
  IntakeFlags,
  PolicyCheckName,
  Ruleset,
} from '../lib/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================
// Load data
// ============================================================

const corpus: Case[] = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'data', 'corpus.json'), 'utf-8'),
) as Case[];

const baseline: Ruleset = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'data', 'baselineRuleset.json'), 'utf-8'),
) as Ruleset;

const problems = corpus.filter((c) => c.groundTruth.truth === 'PROBLEM');
const legitimate = corpus.filter((c) => c.groundTruth.truth === 'LEGITIMATE');

// ============================================================
// Helpers
// ============================================================

const DECISION_ORDER: Record<Decision, number> = {
  APPROVE: 0,
  ESCALATE: 1,
  BLOCK: 2,
};

function isMorePermissive(newDecision: Decision, oldDecision: Decision): boolean {
  return DECISION_ORDER[newDecision] < DECISION_ORDER[oldDecision];
}

function classify(
  oldDecision: Decision,
  newDecision: Decision,
  truth: 'LEGITIMATE' | 'PROBLEM',
): Classification | null {
  if (oldDecision === newDecision) return null;

  const morePermissive = isMorePermissive(newDecision, oldDecision);

  if (morePermissive) {
    if (truth === 'LEGITIMATE') return 'SAVED_EFFORT';
    // truth === 'PROBLEM'
    if (newDecision === 'APPROVE') return 'MISSED_PROBLEM';
    // BLOCK → ESCALATE with PROBLEM
    return 'WEAKENED_CONTROL';
  }

  // More conservative
  if (truth === 'PROBLEM') return 'PREVENTED_LOSS';
  return 'ADDED_FRICTION';
}

function getFlagValue(flags: IntakeFlags, name: PolicyCheckName): boolean {
  if (name === 'po_price_variance') return flags.po_price_variance > 0;
  switch (name) {
    case 'duplicate_hash_match': return flags.duplicate_hash_match;
    case 'bank_details_changed': return flags.bank_details_changed;
    case 'new_vendor': return flags.new_vendor;
    case 'amount_anomaly': return flags.amount_anomaly;
    case 'po_missing': return flags.po_missing;
    case 'po_quantity_mismatch': return flags.po_quantity_mismatch;
    case 'tax_miscalculation': return flags.tax_miscalculation;
    case 'currency_mismatch': return flags.currency_mismatch;
    case 'vendor_unverified': return flags.vendor_unverified;
    default: {
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}

// ============================================================
// Checks
// ============================================================

let allPassed = true;

function check(name: string, passed: boolean, detail: string): void {
  const icon = passed ? '✓' : '✗';
  console.log(`  ${icon} ${name}: ${detail}`);
  if (!passed) allPassed = false;
}

// ── Check 4 (run first): Regression availability ─────────────────────
console.log('\n── Check 4: Regression availability ──');
console.log('   Observed MISSED_PROBLEM counts for plausible permissive changes.\n');

const activePolicyChecks = (Object.keys(baseline.policyChecks) as PolicyCheckName[])
  .filter(flag => baseline.policyChecks[flag] === true);

for (const flag of activePolicyChecks) {
  const permissiveRuleset: Ruleset = {
    ...baseline,
    policyChecks: {
      ...baseline.policyChecks,
      [flag]: false,
    },
  };

  let missedProblemCount = 0;
  const missedProblemCases: string[] = [];
  for (const c of corpus) {
    const oldResult = evaluateCase(baseline, c);
    const newResult = evaluateCase(permissiveRuleset, c);
    const classification = classify(
      oldResult.decision,
      newResult.decision,
      c.groundTruth.truth,
    );
    if (classification === 'MISSED_PROBLEM') {
      missedProblemCount++;
      missedProblemCases.push(c.id);
    }
  }

  console.log(`   Disabling ${flag}: ${missedProblemCount} MISSED_PROBLEM results.`);
  if (missedProblemCases.length > 0) {
    console.log(`     Cases: ${missedProblemCases.join(', ')}`);
  }
}

// ── Check 1: Trivial separability ────────────────────────────────────
console.log('\n── Check 1: Trivial separability ──');
console.log('   No single threshold catches all 40 problems with zero false positives.\n');

const problemAmounts = problems.map((c) => c.invoice.totalAmount);
const legitimateAmounts = legitimate.map((c) => c.invoice.totalAmount);
const problemConfidences = problems.map((c) => c.extractionConfidence);
const legitimateConfidences = legitimate.map((c) => c.extractionConfidence);

const minProblemAmount = Math.min(...problemAmounts);
const maxLegitimateAmount = Math.max(...legitimateAmounts);
const amountSeparable = minProblemAmount > maxLegitimateAmount;
check(
  'Amount threshold separability',
  !amountSeparable,
  amountSeparable
    ? `FAILS: All problems have amount > ${minProblemAmount}, all legitimate < ${maxLegitimateAmount}`
    : `No single amount threshold separates: problem amounts range [${minProblemAmount}..${Math.max(...problemAmounts)}], ` +
      `legitimate amounts range [${Math.min(...legitimateAmounts)}..${maxLegitimateAmount}]`,
);

const maxProblemConfidence = Math.max(...problemConfidences);
const minLegitimateConfidence = Math.min(...legitimateConfidences);
const confidenceSeparable = maxProblemConfidence < minLegitimateConfidence;
check(
  'Confidence threshold separability',
  !confidenceSeparable,
  confidenceSeparable
    ? `FAILS: All problems have confidence < ${maxProblemConfidence}, all legitimate > ${minLegitimateConfidence}`
    : `No single confidence threshold separates: problem conf [${Math.min(...problemConfidences).toFixed(2)}..${maxProblemConfidence.toFixed(2)}], ` +
      `legitimate conf [${minLegitimateConfidence.toFixed(2)}..${Math.max(...legitimateConfidences).toFixed(2)}]`,
);

// ── Check 2: Flag-outcome collapse ───────────────────────────────────
console.log('\n── Check 2: Flag-outcome collapse ──');
console.log('   No single flag predicts ground truth near-perfectly.\n');

const FLAG_NAMES: readonly PolicyCheckName[] = [
  'duplicate_hash_match', 'bank_details_changed', 'new_vendor', 'amount_anomaly',
  'po_missing', 'po_quantity_mismatch', 'po_price_variance', 'tax_miscalculation',
  'currency_mismatch', 'vendor_unverified',
];

for (const flagName of FLAG_NAMES) {
  const flaggedCases = corpus.filter((c) => getFlagValue(c.intakeFlags, flagName));
  const flaggedProblems = flaggedCases.filter((c) => c.groundTruth.truth === 'PROBLEM');

  const total = flaggedCases.length;
  const truePositives = flaggedProblems.length;
  const precision = total > 0 ? truePositives / total : 0;
  const recall = truePositives / problems.length;

  const collapsed = precision > 0.9 && recall > 0.9;
  check(
    `Flag ${flagName}`,
    !collapsed,
    `flagged=${total}, truePositives=${truePositives}, precision=${precision.toFixed(2)}, recall=${recall.toFixed(2)}` +
    (collapsed ? ' — NEAR-PERFECT PREDICTOR' : ''),
  );
}

// ── Check 3: Zero-movement changes ───────────────────────────────────
console.log('\n── Check 3: Zero-movement changes ──');
console.log('   Each rule adjustment should move a believable number of cases (diagnostic reporting).\n');

function countMovedCases(modifiedRuleset: Ruleset): number {
  let moved = 0;
  for (const c of corpus) {
    const oldDecision = evaluateCase(baseline, c).decision;
    const newDecision = evaluateCase(modifiedRuleset, c).decision;
    if (oldDecision !== newDecision) moved++;
  }
  return moved;
}

// Policy check toggles
for (const flag of activePolicyChecks) {
  const toggledRuleset: Ruleset = {
    ...baseline,
    policyChecks: { ...baseline.policyChecks, [flag]: false },
  };
  const moved = countMovedCases(toggledRuleset);
  console.log(`  Disable ${flag}: ${moved} cases moved`);
}

// Amount threshold: +20%
const amountUp: Ruleset = {
  ...baseline,
  thresholds: { ...baseline.thresholds, amountThreshold: baseline.thresholds.amountThreshold * 1.2 },
};
const movedAmountUp = countMovedCases(amountUp);
console.log(`  Amount threshold +20%: ${movedAmountUp} cases moved`);

// Amount threshold: -20%
const amountDown: Ruleset = {
  ...baseline,
  thresholds: { ...baseline.thresholds, amountThreshold: baseline.thresholds.amountThreshold * 0.8 },
};
const movedAmountDown = countMovedCases(amountDown);
console.log(`  Amount threshold -20%: ${movedAmountDown} cases moved`);

// Confidence threshold: raise to 0.90
const confUp: Ruleset = {
  ...baseline,
  thresholds: { ...baseline.thresholds, extractionConfidenceThreshold: 0.90 },
};
const movedConfUp = countMovedCases(confUp);
console.log(`  Confidence threshold → 0.90: ${movedConfUp} cases moved`);

// Confidence threshold: lower to 0.80
const confDown: Ruleset = {
  ...baseline,
  thresholds: { ...baseline.thresholds, extractionConfidenceThreshold: 0.80 },
};
const movedConfDown = countMovedCases(confDown);
console.log(`  Confidence threshold → 0.80: ${movedConfDown} cases moved`);

// ── Check 5: Baseline imperfection ───────────────────────────────────
console.log('\n── Check 5: Baseline imperfection ──');
console.log('   Baseline must both miss problems and escalate legitimate invoices.\n');

const baselineMissedProblems = problems.filter(
  (c) => evaluateCase(baseline, c).decision === 'APPROVE',
);
check(
  'Misses problems',
  baselineMissedProblems.length > 0,
  `Baseline APPROVEs ${baselineMissedProblems.length} of ${problems.length} problems`,
);

const baselineEscalatedLegitimate = legitimate.filter((c) => {
  const d = evaluateCase(baseline, c).decision;
  return d === 'ESCALATE' || d === 'BLOCK';
});
check(
  'Escalates legitimate',
  baselineEscalatedLegitimate.length > 0,
  `Baseline ESCALATEs/BLOCKs ${baselineEscalatedLegitimate.length} of ${legitimate.length} legitimate invoices`,
);

// ── Named collision minimums ─────────────────────────────────────────
console.log('\n── Named collision minimums (dataset.md §5) ──\n');

const collisionRequirements: Array<{ flag: PolicyCheckName; minLegitimate: number; description: string }> = [
  { flag: 'duplicate_hash_match', minLegitimate: 4, description: 'genuine re-submission' },
  { flag: 'tax_miscalculation', minLegitimate: 4, description: 'rounding/jurisdiction difference' },
  { flag: 'bank_details_changed', minLegitimate: 6, description: 'genuine bank change' },
  { flag: 'po_price_variance', minLegitimate: 8, description: 'agreed amendment' },
  { flag: 'vendor_unverified', minLegitimate: 5, description: 'real new supplier' },
];

for (const req of collisionRequirements) {
  const count = legitimate.filter((c) => getFlagValue(c.intakeFlags, req.flag)).length;
  check(
    `${req.flag} ≥ ${req.minLegitimate}`,
    count >= req.minLegitimate,
    `${count} legitimate cases carry this flag (${req.description})`,
  );
}

// ── Additional corpus statistics ─────────────────────────────────────
console.log('\n── Corpus statistics ──\n');
console.log(`  Total cases: ${corpus.length}`);
console.log(`  LEGITIMATE: ${legitimate.length}`);
console.log(`  PROBLEM: ${problems.length}`);

// Problem type distribution
const problemTypes = new Map<string, number>();
for (const c of problems) {
  const pt = c.groundTruth.problemType ?? 'unknown';
  problemTypes.set(pt, (problemTypes.get(pt) ?? 0) + 1);
}
console.log('\n  Problem type distribution:');
for (const [type, count] of [...problemTypes.entries()].sort()) {
  console.log(`    ${type}: ${count}`);
}

// Decision distribution
const decisionCounts = { APPROVE: 0, ESCALATE: 0, BLOCK: 0 };
for (const c of corpus) {
  decisionCounts[c.recordedDecision.decision]++;
}
console.log(`\n  Recorded decisions: APPROVE=${decisionCounts.APPROVE} ESCALATE=${decisionCounts.ESCALATE} BLOCK=${decisionCounts.BLOCK}`);

// Non-obvious problems
const nonObviousProblems = problems.filter((c) => {
  const flags = c.intakeFlags;
  // "non-obvious" = no intake flag that would catch this problem fires
  return !(
    flags.duplicate_hash_match ||
    flags.bank_details_changed ||
    flags.new_vendor ||
    flags.amount_anomaly ||
    flags.po_missing ||
    flags.po_quantity_mismatch ||
    flags.po_price_variance > 0 ||
    flags.tax_miscalculation ||
    flags.currency_mismatch ||
    flags.vendor_unverified
  );
});
check(
  'Non-obvious problems ≥ 12',
  nonObviousProblems.length >= 12,
  `${nonObviousProblems.length} problems have no active intake flags`,
);

// Unusual cases with problem-matching flags
const unusualWithFlags = legitimate.filter((c) => {
  const flags = c.intakeFlags;
  return (
    flags.duplicate_hash_match ||
    flags.bank_details_changed ||
    flags.amount_anomaly ||
    flags.po_quantity_mismatch ||
    flags.po_price_variance > 0 ||
    flags.tax_miscalculation ||
    flags.vendor_unverified
  );
});
check(
  'Unusual legitimate with problem-flags ≥ 25',
  unusualWithFlags.length >= 25,
  `${unusualWithFlags.length} legitimate cases carry flags that problems also carry`,
);

// ── Check 6: Vendor exception blast radius ───────────────────────────
console.log('\n── Check 6: Vendor exception blast radius ──');
console.log('   For each vendor exception, how many policy-check catches does it suppress?\n');

if (baseline.vendorExceptions.length === 0) {
  console.log('   No vendor exceptions configured.\n');
} else {
  // Build a ruleset without vendor exceptions for comparison
  const baselineWithoutExceptions: Ruleset = {
    ...baseline,
    vendorExceptions: [],
  };

  for (const exception of baseline.vendorExceptions) {
    const vendorCases = corpus.filter((c) => c.vendor.id === exception.vendorId);

    // For each case from this vendor: compare the baseline decision (with exception)
    // against what would happen without the exception. If the exception causes APPROVE
    // but a policy check would have caught it, that is a suppressed catch.
    const suppressedCatches: Array<{
      caseId: string;
      amount: number;
      suppressedFlag: string;
      groundTruth: string;
    }> = [];

    for (const c of vendorCases) {
      const withException = evaluateCase(baseline, c);
      const withoutException = evaluateCase(baselineWithoutExceptions, c);

      // The exception suppresses a policy check when:
      // - With exception: APPROVE (exception fired)
      // - Without exception: ESCALATE due to a policy check
      if (
        withException.decision === 'APPROVE' &&
        withException.responsibleRule.type === 'vendorException' &&
        withoutException.decision === 'ESCALATE' &&
        withoutException.responsibleRule.type === 'policyCheck'
      ) {
        suppressedCatches.push({
          caseId: c.id,
          amount: c.invoice.totalAmount,
          suppressedFlag: withoutException.responsibleRule.flag,
          groundTruth: c.groundTruth.truth,
        });
      }
    }

    const label = `${exception.vendorId} (${exception.vendorName})`;
    if (suppressedCatches.length === 0) {
      console.log(`   ${label}: 0 policy-check catches suppressed`);
    } else {
      const problemCatches = suppressedCatches.filter((s) => s.groundTruth === 'PROBLEM');
      console.log(`   ${label}: ${suppressedCatches.length} policy-check catches suppressed`);
      for (const s of suppressedCatches) {
        const marker = s.groundTruth === 'PROBLEM' ? ' ⚠ PROBLEM' : '';
        console.log(`     ${s.caseId}  ₹${s.amount.toLocaleString('en-IN')}  ${s.suppressedFlag}${marker}`);
      }
      if (problemCatches.length > 0) {
        console.log(`     → ${problemCatches.length} suppressed catch(es) are genuine problems`);
      }
    }
  }
}

// ── Check 7: Primary demo scenario — Disable bank_details_changed ──────────
console.log('\n── Check 7: Primary demo scenario ──');
console.log('   Disable bank_details_changed against current baseline.');
console.log('   This is the change the user makes in the demo.\n');

const proposedWithBankDetailsOff: Ruleset = {
  ...baseline,
  policyChecks: { ...baseline.policyChecks, bank_details_changed: false },
};

const demoClassifications: Record<Classification, Array<{ caseId: string; oldDecision: Decision; newDecision: Decision; groundTruth: string }>> = {
  PREVENTED_LOSS: [],
  SAVED_EFFORT: [],
  ADDED_FRICTION: [],
  WEAKENED_CONTROL: [],
  MISSED_PROBLEM: [],
};

for (const c of corpus) {
  const oldResult = evaluateCase(baseline, c);
  const newResult = evaluateCase(proposedWithBankDetailsOff, c);
  const cls = classify(oldResult.decision, newResult.decision, c.groundTruth.truth);
  if (cls !== null) {
    demoClassifications[cls].push({
      caseId: c.id,
      oldDecision: oldResult.decision,
      newDecision: newResult.decision,
      groundTruth: c.groundTruth.truth,
    });
  }
}

const totalChanged = Object.values(demoClassifications).reduce((sum, arr) => sum + arr.length, 0);
console.log(`   Total changed: ${totalChanged}`);
for (const [cls, cases] of Object.entries(demoClassifications)) {
  if (cases.length > 0) {
    console.log(`   ${cls}: ${cases.length}`);
    for (const entry of cases) {
      console.log(`     ${entry.caseId}  ${entry.oldDecision} → ${entry.newDecision}  (${entry.groundTruth})`);
    }
  }
}

const demoMissedProblemCount = demoClassifications.MISSED_PROBLEM.length;
check(
  'Demo scenario: disabling bank_details_changed produces 4 MISSED_PROBLEM',
  demoMissedProblemCount === 4,
  demoMissedProblemCount === 4
    ? `Confirmed: ${demoMissedProblemCount} MISSED_PROBLEM results.`
    : `FAILS: expected 4, got ${demoMissedProblemCount}.`,
);

// ── Secondary demo scenario — V013 vendor exception ──────────
console.log('\n── Secondary scenario: V013 vendor exception ──');
console.log('   Propose V013 (IndoSteel) auto_approve_below ₹350K against current baseline.\n');

const proposedWithV013: Ruleset = {
  ...baseline,
  vendorExceptions: [
    ...baseline.vendorExceptions,
    {
      vendorId: 'V013',
      vendorName: 'IndoSteel Corporation',
      exception: { kind: 'auto_approve_below' as const, amount: 350000 },
    },
  ],
};

const v013Classifications: Record<Classification, Array<{ caseId: string; oldDecision: Decision; newDecision: Decision; groundTruth: string }>> = {
  PREVENTED_LOSS: [],
  SAVED_EFFORT: [],
  ADDED_FRICTION: [],
  WEAKENED_CONTROL: [],
  MISSED_PROBLEM: [],
};

for (const c of corpus) {
  const oldResult = evaluateCase(baseline, c);
  const newResult = evaluateCase(proposedWithV013, c);
  const cls = classify(oldResult.decision, newResult.decision, c.groundTruth.truth);
  if (cls !== null) {
    v013Classifications[cls].push({
      caseId: c.id,
      oldDecision: oldResult.decision,
      newDecision: newResult.decision,
      groundTruth: c.groundTruth.truth,
    });
  }
}

const v013TotalChanged = Object.values(v013Classifications).reduce((sum, arr) => sum + arr.length, 0);
console.log(`   Total changed: ${v013TotalChanged}`);
for (const [cls, cases] of Object.entries(v013Classifications)) {
  if (cases.length > 0) {
    console.log(`   ${cls}: ${cases.length}`);
    for (const entry of cases) {
      console.log(`     ${entry.caseId}  ${entry.oldDecision} → ${entry.newDecision}  (${entry.groundTruth})`);
    }
  }
}

// ── Summary ──────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
if (allPassed) {
  console.log('  ALL CHECKS PASSED');
} else {
  console.log('  SOME CHECKS FAILED — see ✗ above');
}
console.log('═'.repeat(60) + '\n');

process.exit(allPassed ? 0 : 1);
