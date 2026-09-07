# replay.md

**Project:** Dry Run
**Purpose of this document:** the complete specification of the replay engine — what a rule is, what a case is, how a diff is computed, and what counts as a regression. This is the product. Everything else is interface around it.

Read `context.md` first. Where this document is silent, `context.md` governs.

---

## 1. Core concepts

**Case.** One historical invoice decision. Immutable. Carries the invoice facts, the decision the agent made under the rules in force at the time, and the real-world outcome that was later established.

**Ruleset.** The complete configuration governing the agent's behaviour at a point in time. Versioned. Only one ruleset is live at a time.

**Change.** A proposed modification to the live ruleset. Not yet applied.

**Replay.** Applying a proposed ruleset to every case in the corpus and comparing the resulting decisions against the recorded ones.

**Diff.** The output of a replay. The set of cases whose decision changed, classified.

---

## 2. The three decisions

An agent decision is exactly one of:

| Decision | Meaning |
|---|---|
| `APPROVE` | Pay it. No human involvement. |
| `ESCALATE` | Hold and ask a human one specific question. |
| `BLOCK` | Refuse. Do not pay under any circumstance. |

These are ordered by increasing caution: `APPROVE` < `ESCALATE` < `BLOCK`.

A change that moves a case toward `BLOCK` is more conservative. Toward `APPROVE` is more permissive. This ordering is used throughout and must not be redefined elsewhere in the codebase.

---

## 3. Case structure

Every case carries three groups of fields.

**Invoice facts.** Vendor identity, amount, currency, line items, purchase order reference, submission date, payment details, and any flags raised at intake (duplicate hash match, bank details changed since last invoice, vendor newly created, amount deviates from vendor history).

**Recorded decision.** What the agent decided, which ruleset version was live, and — where the decision was `ESCALATE` — what the human ultimately did.

**Ground truth.** The single most important field in the entire project: whether this invoice was, in fact, legitimate and correct to pay.

Ground truth is not the agent's opinion and not the human reviewer's opinion at the time. It is what was later established to be true — after the duplicate was caught, after the vendor was confirmed fraudulent, after the price variance was traced to an agreed contract amendment.

Ground truth takes one of two values: `LEGITIMATE` (should have been paid as submitted) or `PROBLEM` (should not have been paid as submitted).

Without ground truth the tool can only report that decisions changed. With it, the tool can report whether they changed *wrongly*. That distinction is the entire product.

---

## 4. Rule types

Exactly three change types are supported. Nothing else. A request to support a fourth type is a scope change and must be refused by the build agent.

**Threshold.** A numeric boundary. Examples: the amount below which an invoice may be auto-approved; the confidence score below which an invoice must be escalated; the percentage price variance tolerated against a purchase order.

**Policy check toggle.** A named check, on or off. Examples: flag invoices where vendor bank details changed since the last payment; flag vendors created within the last thirty days; flag duplicate invoice hashes.

**Vendor exception.** A named vendor plus an override. Examples: always auto-approve this vendor below a stated amount; always escalate this vendor regardless of amount.

Each rule type is independently testable and each corresponds to something a real finance operator actually changes. Nothing in the engine may assume there will only ever be three types, but nothing may implement a fourth.

---

## 5. Rule evaluation

A ruleset applied to a case produces exactly one decision, deterministically. The same ruleset and the same case must always produce the same decision — this is non-negotiable and is what makes replay meaningful.

Evaluation order:

1. **Blocking checks first.** Any check whose result is disqualifying produces `BLOCK` immediately, with no further evaluation. Exactly one such check exists in this build: `duplicate_hash_match`. Do not invent others — every blocking check must correspond to an intake flag defined in `dataset.md` section 3.
2. **Vendor exceptions second.** An applicable exception overrides thresholds for that vendor.
3. **Policy checks third.** Any enabled check that fires produces `ESCALATE`.
4. **Thresholds last.** If nothing above fired, thresholds determine `APPROVE` or `ESCALATE`.
5. **Default.** If no rule matches, the decision is `ESCALATE`. Never `APPROVE`.

The default in step 5 is deliberate. An unrecognised situation must land in front of a human, not through the payment rail. Any future change to this default requires an explicit entry in `decisions.md`, the running log described in `context.md` section 9.

**Determinism requirement.** No language model is invoked during rule evaluation. Rule evaluation is arithmetic and boolean logic. If an LLM is used anywhere in this project it is for generating the corpus or for phrasing an escalation question — never for deciding whether a rule fires. A non-deterministic evaluator makes every number the tool reports meaningless.

---

## 6. The replay

Given a proposed ruleset and the corpus:

1. Evaluate the proposed ruleset against every case, independently. Cases do not affect one another.
2. Compare each resulting decision to that case's recorded decision.
3. Cases where the decision is identical are unchanged and are excluded from the diff.
4. Cases where the decision differs enter the diff and are classified per section 7.

The replay is read-only. It never writes to the corpus, never mutates the live ruleset, and never triggers any external action. A replay that has side effects is a bug of the highest severity.

---

## 7. Classification

Every changed case falls into exactly one of five categories, determined by the direction of the change and the case's ground truth.

**Prevented loss.** The decision became more conservative, and ground truth is `PROBLEM`. The change catches something that was previously let through. This is the change working.

**Added friction.** The decision became more conservative, and ground truth is `LEGITIMATE`. A human now has to look at something that was fine. Cost: time.

**Saved effort.** The decision became more permissive, and ground truth is `LEGITIMATE`. Something correct now flows through without a human. This is the change working.

**Missed problem.** The decision became more permissive to the point of `APPROVE`, and ground truth is `PROBLEM`. The agent now pays something that should not have been paid, with no human in the loop. Cost: money leaves incorrectly.

### The BLOCK to ESCALATE case

A case with ground truth `PROBLEM` whose decision moves from `BLOCK` to `ESCALATE` has become more permissive, but it still lands in front of a human who may catch it. Treating that as identical to auto-approving it overstates the harm.

Such cases are classified as **Weakened control** — a fifth classification, reported separately, never folded into `Missed problem`.

The distinction is defensible and should be stated plainly if questioned: `Missed problem` means money moved without a human; `Weakened control` means the last automatic barrier was removed but a human barrier remains.

### Regression definition

A **regression** is any case whose classification represents a worse outcome than before: `Missed problem`, `Weakened control`, or `Added friction`.

The word "regression" is a category, not a number. It is never displayed as a single count, because the three harms are not commensurable — a wrongly-paid invoice, a weakened barrier, and five wasted minutes of review are different units. Any interface that sums them is wrong.

Where a single headline number is required, use the `Missed problem` count alone and label it as exactly that. Never label it "regressions."

The five classifications, and whether each is a regression:

| Classification | Direction | Ground truth | Regression? |
|---|---|---|---|
| `PREVENTED_LOSS` | More conservative | `PROBLEM` | No |
| `SAVED_EFFORT` | More permissive | `LEGITIMATE` | No |
| `ADDED_FRICTION` | More conservative | `LEGITIMATE` | Yes — cost is time |
| `WEAKENED_CONTROL` | `BLOCK` → `ESCALATE` | `PROBLEM` | Yes — barrier reduced |
| `MISSED_PROBLEM` | → `APPROVE` | `PROBLEM` | Yes — cost is money |

---

## 8. Output of a replay

A replay returns:

- Total cases evaluated
- Count of unchanged cases
- Counts for each of the five classifications
- The full list of changed cases, each with: the invoice, the old decision, the new decision, its classification, and which specific rule caused the change
- A headline: the `Missed problem` count, stated plainly

**Rule attribution.** Every changed case must name the rule responsible. "23 decisions changed" is a diff. "23 decisions changed, 19 of them because you raised the approval limit" is a tool. If a change cannot be attributed to a specific rule, that is a defect, not an acceptable edge case.

---

## 9. Recommendation, not enforcement

Dry Run recommends. It never blocks.

- **Any `Missed problem` at all** → prominent warning naming the count and showing those specific cases first. The recommendation is not to ship.
- **`Weakened control` but no `Missed problem`** → a warning, visibly less severe than the above, stating that automatic barriers were removed but human review remains.
- **`Added friction` only** → a neutral note stating the additional human workload the change creates.
- **No regressions** → a plain confirmation, with the `Prevented loss` and `Saved effort` counts.

In every case the ship action remains available and functional.

**Rationale, recorded here because it will be questioned:** a tool that blocks gets disabled or worked around within a month, and then the organisation has neither the safety layer nor the visibility. A tool that warns clearly and keeps an honest record of what was shipped, and what was known at the time, gets trusted and kept. Accountability stays with the human who owns the outcome. This is a deliberate product position, not a limitation.

---

## 10. Shipping and rollback

Shipping a change creates a new ruleset version. Versions are append-only; nothing is ever overwritten or deleted.

Each version records: what changed, when, and the replay result at the time of shipping — including any regressions shipped despite the warning.

**No attribution.** There is no authentication in this build (`context.md` section 7), so there is no "who." Do not add a name field, a user selector, or a placeholder identity. In production this record would carry an operator identity; here it does not, and that gap is named rather than faked.

**Persistence.** Version history is held in browser local storage so that it survives a page reload. It is not a database and is not shared between browsers. This is a deliberate scope choice, not an oversight.

Rollback creates a *new* version that restores the prior configuration. It does not delete the version being rolled back. The history must remain a complete and honest record of what was changed and what was known at the time.

That last property is what makes this an audit artefact rather than a settings page.

---

## 11. Known limitations

Stated here so they are acknowledged rather than discovered, and so they can be spoken to directly in the pitch.

**The corpus is the past.** A replay predicts how a change would have handled cases already seen. It cannot anticipate a novel fraud pattern. It reduces uncertainty; it does not eliminate it.

**Ground truth is not always available in reality.** Some invoices are never definitively resolved. A production version would need to handle unknown outcomes explicitly — likely by excluding them from regression counts and reporting the coverage percentage. The demo corpus has complete ground truth, which is a simplification and should be named as one.

**Interaction effects are not modelled.** Cases are evaluated independently. In reality a threshold change alters human review volume, which alters review quality, which alters outcomes. This second-order effect is real and out of scope.

**Rule attribution assumes independence.** Where two changed rules could each independently explain the same changed decision, attribution picks the first in evaluation order. This is a simplification and is acceptable at this scope.
