/**
 * Rule engine for Dry Run.
 *
 * Pure TypeScript. No React imports. No LLM calls. No side effects.
 * Runnable from a plain Node script with no browser.
 *
 * Evaluation order follows replay.md §5 exactly:
 *   1. Blocking checks  → BLOCK
 *   2. Vendor exceptions → override
 *   3. Policy checks     → ESCALATE
 *   4. Thresholds        → APPROVE or ESCALATE
 *   5. Default           → ESCALATE (never APPROVE)
 */

import type {
  Case,
  EvaluationResult,
  IntakeFlags,
  PolicyCheckName,
  Ruleset,
  VendorException,
} from './types';

// ---------------------------------------------------------------------------
// Evaluation order for policy checks (step 3).
// duplicate_hash_match is handled in step 1 as the sole blocking check.
// This array defines a fixed, deterministic iteration order.
// ---------------------------------------------------------------------------

const POLICY_CHECK_EVALUATION_ORDER: readonly Exclude<PolicyCheckName, 'duplicate_hash_match'>[] = [
  'bank_details_changed',
  'new_vendor',
  'amount_anomaly',
  'po_missing',
  'po_quantity_mismatch',
  'po_price_variance',
  'tax_miscalculation',
  'currency_mismatch',
  'vendor_unverified',
];

// ---------------------------------------------------------------------------
// Flag activation
// ---------------------------------------------------------------------------

/**
 * Returns true when the given intake flag is active.
 *
 * All flags are boolean except `po_price_variance`, which is a percentage.
 * A percentage > 0 means the flag is active.
 */
function flagIsActive(flags: IntakeFlags, flagName: PolicyCheckName): boolean {
  switch (flagName) {
    case 'po_price_variance':
      return flags.po_price_variance > 0;
    case 'duplicate_hash_match':
      return flags.duplicate_hash_match;
    case 'bank_details_changed':
      return flags.bank_details_changed;
    case 'new_vendor':
      return flags.new_vendor;
    case 'amount_anomaly':
      return flags.amount_anomaly;
    case 'po_missing':
      return flags.po_missing;
    case 'po_quantity_mismatch':
      return flags.po_quantity_mismatch;
    case 'tax_miscalculation':
      return flags.tax_miscalculation;
    case 'currency_mismatch':
      return flags.currency_mismatch;
    case 'vendor_unverified':
      return flags.vendor_unverified;
    default: {
      const _exhaustive: never = flagName;
      return _exhaustive;
    }
  }
}

// ---------------------------------------------------------------------------
// Vendor exception application
// ---------------------------------------------------------------------------

function applyVendorException(
  exception: VendorException,
  caseData: Case,
): EvaluationResult | undefined {
  switch (exception.exception.kind) {
    case 'always_escalate':
      return {
        decision: 'ESCALATE',
        responsibleRule: {
          type: 'vendorException',
          vendorId: exception.vendorId,
          vendorName: exception.vendorName,
        },
      };

    case 'auto_approve_below':
      if (caseData.invoice.totalAmount < exception.exception.amount) {
        return {
          decision: 'APPROVE',
          responsibleRule: {
            type: 'vendorException',
            vendorId: exception.vendorId,
            vendorName: exception.vendorName,
          },
        };
      }
      // Amount exceeds the exception's limit — fall through to policy checks
      return undefined;

    default: {
      const _exhaustive: never = exception.exception;
      return _exhaustive;
    }
  }
}

// ---------------------------------------------------------------------------
// Main evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate a single case against a ruleset.
 *
 * Returns the decision and the rule responsible for it.
 * Deterministic: same ruleset + same case = same result, always.
 */
export function evaluateCase(ruleset: Ruleset, caseData: Case): EvaluationResult {
  // ── Step 1: Blocking checks ───────────────────────────────────────────
  // replay.md §5: "Any check whose result is disqualifying produces BLOCK
  // immediately, with no further evaluation." The sole blocking check is
  // duplicate_hash_match.
  if (
    ruleset.policyChecks.duplicate_hash_match &&
    caseData.intakeFlags.duplicate_hash_match
  ) {
    return {
      decision: 'BLOCK',
      responsibleRule: { type: 'blockingCheck', flag: 'duplicate_hash_match' },
    };
  }

  // ── Step 2: Vendor exceptions ─────────────────────────────────────────
  // replay.md §5: "An applicable exception overrides thresholds for that vendor."
  // Array.find is deterministic on arrays (preserves insertion order).
  const vendorException = ruleset.vendorExceptions.find(
    (e) => e.vendorId === caseData.vendor.id,
  );
  if (vendorException !== undefined) {
    const exceptionResult = applyVendorException(vendorException, caseData);
    if (exceptionResult !== undefined) {
      return exceptionResult;
    }
    // auto_approve_below with amount over the limit falls through
  }

  // ── Step 3: Policy checks ─────────────────────────────────────────────
  // replay.md §5: "Any enabled check that fires produces ESCALATE."
  // Iterated in a fixed order for determinism and rule attribution.
  for (const checkName of POLICY_CHECK_EVALUATION_ORDER) {
    if (ruleset.policyChecks[checkName] && flagIsActive(caseData.intakeFlags, checkName)) {
      return {
        decision: 'ESCALATE',
        responsibleRule: { type: 'policyCheck', flag: checkName },
      };
    }
  }

  // ── Step 4: Thresholds ────────────────────────────────────────────────
  // replay.md §5: "If nothing above fired, thresholds determine APPROVE
  // or ESCALATE."
  const amountPasses =
    caseData.invoice.totalAmount < ruleset.thresholds.amountThreshold;
  const extractionConfidencePasses =
    caseData.extractionConfidence >= ruleset.thresholds.extractionConfidenceThreshold;

  if (amountPasses && extractionConfidencePasses) {
    return {
      decision: 'APPROVE',
      responsibleRule: { type: 'threshold', field: 'amountThreshold' },
    };
  }

  // One or both thresholds failed. Attribute to the first failing one.
  if (!amountPasses) {
    return {
      decision: 'ESCALATE',
      responsibleRule: { type: 'threshold', field: 'amountThreshold' },
    };
  }

  // Amount passed but confidence did not.
  return {
    decision: 'ESCALATE',
    responsibleRule: { type: 'threshold', field: 'extractionConfidenceThreshold' },
  };

  // ── Step 5 (implicit) ─────────────────────────────────────────────────
  // replay.md §5: "If no rule matches, the decision is ESCALATE. Never APPROVE."
  // Step 4 always produces a result, so this is unreachable. The invariant
  // is that every non-APPROVE path above returns ESCALATE.
}
