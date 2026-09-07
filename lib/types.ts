/**
 * Shared type definitions for Dry Run.
 *
 * Naming follows the fixed terms in AGENTS.md:
 *   Decision, Classification, GroundTruth, Ruleset, Rule, Change, Replay, Diff.
 *
 * `extractionConfidence` is always the full name — never bare `confidence`.
 */

// ---------------------------------------------------------------------------
// Domain enumerations
// ---------------------------------------------------------------------------

export type Decision = 'APPROVE' | 'ESCALATE' | 'BLOCK';

export type GroundTruth = 'LEGITIMATE' | 'PROBLEM';

export type Classification =
  | 'PREVENTED_LOSS'
  | 'SAVED_EFFORT'
  | 'ADDED_FRICTION'
  | 'WEAKENED_CONTROL'
  | 'MISSED_PROBLEM';

export type ProblemType =
  | 'duplicate_submission'
  | 'fraudulent_bank_details'
  | 'price_inflation'
  | 'quantity_inflation'
  | 'phantom_vendor'
  | 'tax_miscalculation'
  | 'duplicate_across_formats'
  | 'contract_violation';

// ---------------------------------------------------------------------------
// Intake flags
// ---------------------------------------------------------------------------

/**
 * Names of the ten intake flags from dataset.md §3.
 * `duplicate_hash_match` doubles as the sole blocking check (replay.md §5).
 */
export type PolicyCheckName =
  | 'duplicate_hash_match'
  | 'bank_details_changed'
  | 'new_vendor'
  | 'amount_anomaly'
  | 'po_missing'
  | 'po_quantity_mismatch'
  | 'po_price_variance'
  | 'tax_miscalculation'
  | 'currency_mismatch'
  | 'vendor_unverified';

/**
 * Intake flags computed at ingestion, before any rule runs.
 * All fields are boolean except `po_price_variance`, which carries the
 * percentage variance (0 when no variance or no PO).
 */
export interface IntakeFlags {
  readonly duplicate_hash_match: boolean;
  readonly bank_details_changed: boolean;
  readonly new_vendor: boolean;
  readonly amount_anomaly: boolean;
  readonly po_missing: boolean;
  readonly po_quantity_mismatch: boolean;
  readonly po_price_variance: number;
  readonly tax_miscalculation: boolean;
  readonly currency_mismatch: boolean;
  readonly vendor_unverified: boolean;
}

// ---------------------------------------------------------------------------
// Invoice and case
// ---------------------------------------------------------------------------

export interface LineItem {
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly lineTotal: number;
}

export interface Case {
  readonly id: string;
  readonly submissionDate: string; // ISO date YYYY-MM-DD
  readonly source: 'email' | 'portal' | 'edi';

  readonly vendor: {
    readonly name: string;
    readonly id: string;
    readonly relationshipAgeDays: number;
    readonly historicalInvoiceCount: number;
    readonly typicalAmountRange: { readonly min: number; readonly max: number };
  };

  readonly invoice: {
    readonly totalAmount: number;
    readonly subtotal: number;
    readonly taxRate: number;
    readonly taxAmount: number;
    readonly currency: string;
    readonly lineItems: readonly LineItem[];
    readonly purchaseOrderReference: string | null;
    readonly paymentBankDetails: {
      readonly accountNumber: string;
      readonly ifscCode: string;
    };
  };

  readonly intakeFlags: IntakeFlags;
  readonly extractionConfidence: number;

  readonly recordedDecision: {
    readonly decision: Decision;
    readonly rulesetVersion: number;
    readonly humanAction?: Decision; // present only when decision is ESCALATE
  };

  readonly groundTruth: {
    readonly truth: GroundTruth;
    readonly problemType?: ProblemType; // present only when truth is PROBLEM
    readonly resolutionNote: string;
  };
}

// ---------------------------------------------------------------------------
// Ruleset
// ---------------------------------------------------------------------------

export type VendorExceptionKind =
  | { readonly kind: 'auto_approve_below'; readonly amount: number }
  | { readonly kind: 'always_escalate' };

export interface VendorException {
  readonly vendorId: string;
  readonly vendorName: string;
  readonly exception: VendorExceptionKind;
}

export interface Ruleset {
  readonly version: number;
  readonly thresholds: {
    readonly amountThreshold: number;
    readonly extractionConfidenceThreshold: number;
  };
  readonly policyChecks: Readonly<Record<PolicyCheckName, boolean>>;
  readonly vendorExceptions: readonly VendorException[];
}

// ---------------------------------------------------------------------------
// Evaluation result
// ---------------------------------------------------------------------------

export type RuleAttribution =
  | { readonly type: 'blockingCheck'; readonly flag: 'duplicate_hash_match' }
  | { readonly type: 'vendorException'; readonly vendorId: string; readonly vendorName: string }
  | { readonly type: 'policyCheck'; readonly flag: Exclude<PolicyCheckName, 'duplicate_hash_match'> }
  | { readonly type: 'threshold'; readonly field: 'amountThreshold' | 'extractionConfidenceThreshold' }
  | { readonly type: 'default' };

export interface EvaluationResult {
  readonly decision: Decision;
  readonly responsibleRule: RuleAttribution;
}
