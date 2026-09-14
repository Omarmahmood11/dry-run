# dataset.md

**Project:** Dry Run
**Purpose of this document:** the complete specification of the case corpus — what a case contains, how the 400 cases are composed, and how ground truth is assigned.

Read `context.md` and `replay.md` first.

---

## 1. Why this document matters most

Every number Dry Run displays is derived from this corpus. If the corpus is arbitrary, the tool is a random-number generator with a nice interface, and one informed question exposes it.

The corpus is generated once and frozen. It is committed to the repository as data, not created at runtime. It must be reproducible: same seed, same 400 cases.

---

## 2. Size and shape

**400 cases.** Enough that percentages mean something and a threshold change moves a believable number of cases. Small enough to hand-verify the interesting ones.

Cases represent roughly one quarter of invoice volume for a mid-sized company. They span a contiguous date range so that "your last 400 invoices" is an honest description.

---

## 3. Case fields

**Identity**
- Case ID, submission date, source (email, portal, EDI)

**Vendor**
- Vendor name and ID
- Relationship age (days since first invoice from this vendor)
- Historical invoice count
- Typical invoice amount range for this vendor

**Invoice content**
- Total amount, currency
- Line items: description, quantity, unit price, line total
- Purchase order reference, or explicitly absent
- Payment bank details

**Intake flags** — computed at ingestion, before any rule runs
- `duplicate_hash_match`: an invoice with identical vendor, amount and date exists
- `bank_details_changed`: payment details differ from this vendor's last invoice
- `new_vendor`: vendor relationship under 30 days
- `amount_anomaly`: amount deviates more than 3x from this vendor's historical range
- `po_missing`: no purchase order reference
- `po_quantity_mismatch`: quantity differs from the referenced PO
- `po_price_variance`: unit price differs from the referenced PO, with the percentage
- `tax_miscalculation`: stated tax does not match the computed amount
- `currency_mismatch`: invoice currency differs from the PO currency
- `vendor_unverified`: vendor is not present in the verified supplier registry

Base currency is INR throughout (`context.md` section 10). `currency_mismatch` is an exception, not the norm.

**Confidence**
- A single 0–1 score representing the extracting agent's certainty about the invoice's field values

**Recorded decision**
- Decision (`APPROVE` / `ESCALATE` / `BLOCK`)
- Ruleset version in force
- Where `ESCALATE`: what the human ultimately did

**Ground truth**
- `LEGITIMATE` or `PROBLEM`
- `problem_type`: present only where ground truth is `PROBLEM`
- `resolution_note`: one line stating how this was established

---

## 4. Composition

| Segment | Count | Share |
|---|---|---|
| Clean and routine | 280 | 70% |
| Legitimate but unusual | 80 | 20% |
| Genuine problems | 40 | 10% |

**Clean and routine.** Established vendor, matching PO, amount in the normal range, no flags, high confidence. These are the invoices any sensible ruleset auto-approves. They exist to make the denominator honest — a corpus of nothing but edge cases would inflate every percentage the tool reports.

**Legitimate but unusual.** These carry one or more intake flags but are genuinely fine. A price variance that traces to an agreed contract amendment. A new vendor that is real. A bank detail change the vendor announced in advance. An unusually large but correct invoice.

This segment is the reason `Added friction` exists as a category. Without it, tightening a rule would appear to have no cost, and the tool would be an argument for maximum caution rather than a tool for reasoning about a tradeoff.

**Genuine problems.** These should not have been paid as submitted.

## 5. Problem types

The 40 problems distribute across:

| Type | Count | What it is |
|---|---|---|
| Duplicate submission | 8 | Same invoice submitted twice, days apart |
| Fraudulent bank details | 6 | Real vendor, payment details altered to a different account |
| Price inflation | 6 | Unit price materially above the agreed PO price |
| Quantity inflation | 5 | Billed for more units than were received |
| Phantom vendor | 5 | Vendor does not exist as a real supplier |
| Tax miscalculation | 4 | Tax computed incorrectly, in the vendor's favour |
| Duplicate across formats | 3 | Same charge submitted once as PDF, once via portal |
| Contract violation | 3 | Charges for items outside the agreed scope |

**Design requirement — problems must not be trivially separable.** If every problem carries an obvious flag and every legitimate invoice carries none, then a single rule catches everything and the tool has nothing to reason about.

Specifically:
- At least 12 of the 40 problems must present as unremarkable on their intake flags. Their problem is only visible in the relationship between fields, or was only established later.
- At least 25 of the 80 legitimate-but-unusual cases must carry the same flags that problems carry.

**Named collision requirement.** Several flags share a name with a problem type. If a flag fires only on cases of its matching problem type, that flag perfectly predicts ground truth and the corpus is broken. Each of the following flags must fire on legitimate cases too, in at least the stated number:

| Flag | Minimum legitimate cases carrying it |
|---|---|
| `duplicate_hash_match` | 4 — a genuine re-submission after a rejected first attempt |
| `tax_miscalculation` | 4 — a rounding or jurisdiction difference later found correct |
| `bank_details_changed` | 6 — a vendor that genuinely changed banks and announced it |
| `po_price_variance` | 8 — variance traceable to an agreed contract amendment |
| `vendor_unverified` | 5 — a real new supplier not yet added to the registry |

Note that `duplicate_hash_match` is the sole blocking check (`replay.md` section 5), so its legitimate cases are the only way a `BLOCK` can ever be wrong — which is what makes the `Weakened control` classification reachable.

This overlap is the entire reason thresholds involve judgment. A corpus without it makes the product look unnecessary.

---

## 6. Ground truth assignment

Ground truth is assigned **at generation time, deliberately, per case** — never inferred afterwards from the flags or from the recorded decision.

The generation order is:

1. Decide what this case *is* — legitimate or a problem, and if a problem, which type.
2. Construct invoice content consistent with that reality.
3. Compute intake flags from that content, mechanically.
4. Assign a confidence score.
5. Apply the historical baseline ruleset to produce the recorded decision.

**The generator imports the production rule engine.** It must not contain its own copy of the evaluation logic. Two implementations will drift, and every replay result afterwards would be untrustworthy. This means the rule engine (`/lib/ruleEngine.ts`) is written during the corpus session, before Phase 0 — see the sequencing note in `implementationPlan.md`.

The recorded decision is therefore a *consequence* of the case, not an input to it. This ordering matters: if ground truth were assigned after the decision, the corpus would encode the assumption that the agent was usually right, and every replay result would be circular.

**The baseline ruleset gets some cases wrong.** That is required. If the historical agent were perfect, no rule change could ever improve on it and `Prevented loss` would always be zero. The baseline should miss a meaningful minority of problems (currently 15 of the 40 problems) and should escalate a meaningful number of legitimate invoices.

**Every `resolution_note` states how the truth was established**, in one line — a supplier confirmed the duplicate, a bank verification failed, an audit traced the variance to an amendment. This field is what makes ground truth defensible under questioning rather than an assertion.

---

## 7. Generation method

Generate the corpus with a script, seeded, committed alongside the data. The script and its output both live in the repository.

An LLM may be used to write realistic line-item descriptions and vendor names. It must **not** decide ground truth, compute flags, or assign decisions — those are deterministic per section 6. A corpus whose truth was decided by a model is a corpus nobody can defend.

**Hand-verify at least 40 cases**, including all 12 non-obvious problems. Read them, confirm the ground truth is right, confirm the flags follow from the content. This is slow and it is the most valuable hour in the project.

---

## 8. Failure modes to check before building on it

Run these checks and record the results. Each one, if unaddressed, silently breaks the tool.

- **Trivial separability.** If a single threshold catches all 40 problems with no false positives, the corpus is too easy. Reject and regenerate.
- **Flag-outcome collapse.** If any single intake flag predicts ground truth near-perfectly, the corpus encodes a shortcut and the replay is uninteresting.
- **Zero-movement thresholds.** For each threshold rule, log how many cases are moved by a plausible adjustment. This is a diagnostic metric to confirm changes are moving cases, rather than a rigid pass/fail bound.
- **Regression availability.** Record, for each plausible permissive change, how many `Missed problem` results it produces. The primary demo scenario is disabling the `bank_details_changed` policy check, which produces 4 `Missed problem` results. The secondary scenario is granting a vendor exception for IndoSteel (V013, auto_approve_below ₹350K). These are observed values, not minimums — see `decisions.md` entry on corrected regression counts.
- **Baseline imperfection.** Confirm the baseline ruleset both misses real problems and escalates legitimate invoices.

The fourth check is the one to run first. The entire pitch rests on a moment that says *this change would have wrongly approved 4 invoices* — if the corpus cannot produce that moment honestly, nothing downstream matters. The `bank_details_changed` scenario produces exactly this: a user disables what looks like a noisy, friction-generating check, and Dry Run shows that it silently lets through fraudulent payment redirects.

---

## 9. What is deliberately not modelled

- Partial payments, credit notes, multi-currency conversion at payment time
- Approval hierarchies and delegation chains
- Vendor communication and dispute threads
- Time-dependent behaviour — cases are independent, and the corpus has no notion of the agent learning over the quarter

These are all real in production accounts payable. None of them affect whether a replay engine works, and each would consume days. Name them as out of scope if asked; do not build them.
