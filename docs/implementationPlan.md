# implementationPlan.md

**Project:** Dry Run

**How to use this document.** Each phase is self-contained. Paste one phase at a time into a fresh coding agent session, along with the instruction to read `context.md`, `replay.md`, `dataset.md` and `AGENTS.md` at the repo root first. Do not paste the whole file — the agent should not see future phases and build ahead of the current one.

Git tag after every phase whose done-conditions are all met. Branch before Phase 3.

---

## Phase −1 — Rule engine and corpus

**This happens before Phase 0 and is not optional to sequence correctly.**

The corpus generator must produce a recorded decision for every case, which requires the rule engine. So the engine is written here, not in Phase 1, and the generator imports it. Building it twice guarantees drift.

**Scope.**
- `/lib/ruleEngine.ts` — pure, no React, runnable from a plain Node script
- All three rule types and the evaluation order from `replay.md` sections 4 and 5
- The baseline ruleset as a committed data file
- The corpus generator script, importing the engine
- The 400-case corpus, generated, seeded, committed

**Done when.**
- The engine runs from a Node script with no browser and no React
- The corpus exists as a committed file: 360 `LEGITIMATE`, 40 `PROBLEM`
- Every named collision minimum in `dataset.md` section 5 is met
- All five checks in `dataset.md` section 8 pass, with results recorded in `decisions.md`
- The author has personally read at least 40 cases, including all 12 non-obvious problems
- Ten cases have been hand-worked: expected decision computed by hand, engine agrees

**The regression-availability check runs first.** A plausible permissive change must produce at least three `Missed problem` results. If it does not, regenerate before doing anything else — every phase downstream assumes the corpus can tell that story.

**Do not build.** Any Next.js app. Any UI. Any replay logic.

---

## Phase 0 — Foundation

**Goal.** A deployed skeleton with the corpus visible. No logic.

**Scope.**
- Next.js project, TypeScript, deployed to Vercel with a working public URL
- The rule engine and corpus from Phase −1 are moved into the project unchanged
- Type definitions for Case, Ruleset, Rule, Decision, Classification, per `replay.md`
- Corpus loaded from the committed data file
- A single page listing all cases in a table: ID, date, vendor, amount, intake flags, recorded decision, ground truth
- The table is sortable by amount and filterable by ground truth

**Done when.**
- The public URL loads and shows 400 rows
- Row counts by ground truth match `dataset.md`: 360 legitimate, 40 problem
- No console errors
- Types compile with no `any`

**Do not build.** Any rule logic. Any editing. Any replay. Styling beyond legibility.

---

## Phase 1 — Engine integration and test coverage

**Goal.** The engine from Phase −1 is wired into the app and covered by tests.

**Scope.**
- The baseline ruleset loads in the app and is applied to all 400 cases
- Each case displays its freshly computed decision beside its recorded decision
- Unit tests for each rule type, the evaluation order, and the `ESCALATE` default

**Done when.**
- Running evaluation twice on the same input produces identical output
- No language model is invoked anywhere in the evaluation path
- Every rule type has a test that fails if its logic is inverted
- The evaluation order is tested: a case that would trip both a blocking check and a threshold resolves to `BLOCK`

**On the baseline reproducing recorded decisions.** It will, by construction — the generator used this same engine. That agreement is a smoke check for data loading and serialization, not proof of correctness. Treat a mismatch as a serious signal, but do not treat a match as validation. The hand-worked cases from Phase −1 are what establish correctness.

**Do not build.** Any UI for changing rules. Any replay or diff.

---

## Phase 2 — Change proposal

**Goal.** A user can express a proposed change to the live ruleset.

**Scope.**
- A form for each of the three rule types
- A proposed ruleset is derived from the live ruleset plus the change, without mutating the live one
- The pending change is displayed in plain English: what it was, what it becomes
- Changes can be cleared without applying

**Done when.**
- Each of the three rule types can be changed through the interface
- The live ruleset is provably unmodified after composing a change
- The plain-English summary is correct for each rule type
- Invalid numeric input (negative or non-numeric thresholds) is rejected with a clear message. Vendor selection is a list of known vendors, so no unknown-vendor validation is needed or should be written.

**Do not build.** Replay. Shipping. History.

---

## Phase 3 — The replay engine

**Branch before starting this phase.**

**Goal.** A proposed ruleset is replayed across the corpus and produces a classified diff.

**Scope.**
- Evaluate the proposed ruleset across all 400 cases
- Compare each result to the recorded decision
- Classify every changed case into one of the five categories in `replay.md` section 7
- Attribute every changed case to the specific rule that caused it
- Return the full result structure from `replay.md` section 8

**Done when.**
- A change that alters nothing produces an empty diff
- A maximally permissive change moves every non-`APPROVE` case to `APPROVE`, and the changed count equals the number of cases not already at `APPROVE`
- Every changed case carries a classification and a named responsible rule
- Counts for the five classifications sum to the total changed count
- The corpus and the live ruleset are byte-identical before and after a replay
- At least one hand-worked example is verified manually: pick a threshold change, work out the expected result by hand for ten specific cases, confirm the engine agrees

**This is the product.** Budget the most time here. The hand-worked verification is not optional — it is the only thing that proves the engine is right rather than merely running.

**Do not build.** Any UI beyond dumping the raw result. Shipping. Rollback.

---

## Phase 4 — Preview interface

**Goal.** The replay result is legible to a non-technical finance operator in under ten seconds.

**Scope.**
- Headline: the `Missed problem` count, stated plainly and prominently
- The five classification counts, visually distinct, never summed
- The changed cases listed, `Missed problem` first, then `Weakened control`
- Each changed case shows old decision, new decision, and the responsible rule
- The four response states from `replay.md` section 9
- The ship action is always available and functional regardless of regressions

**Done when.**
- No two classification counts are ever presented as a combined figure, and the word "regressions" never appears as a number
- The four response states are visually distinguishable from one another
- The ship button works even when regressions are present
- **Human-verified, not agent-verified:** a person unfamiliar with the project looks at a regression result and correctly states what would go wrong. The build agent should mark this condition as pending author review rather than attempting to satisfy it.

**Do not build.** Version history. Rollback. Any animation or transition work.

---

## Phase 5 — History and rollback

**Goal.** Shipped changes are recorded permanently and can be reverted.

**Scope.**
- Shipping creates a new ruleset version, append-only, persisted to browser local storage
- Each version records what changed, when, and the replay result at time of shipping, including regressions shipped despite warning
- No operator identity is recorded — there is no authentication, and none is faked
- A history view listing all versions in order
- Rollback creates a new version restoring a prior configuration, without deleting anything

**Done when.**
- No operation deletes or overwrites a version
- A version shipped with regressions displays that fact in the history
- Rollback produces a new version rather than removing one
- Reloading the page preserves the full history

---

## Phase 6 — Findings and ship

**Goal.** The project is public, and the reasoning behind it is documented.

**Scope.**
- A `/findings` page written by the author, not generated
- Deploy, verify on a clean browser
- README with a one-paragraph description and the live link

**The findings page must contain at least one thing that went wrong.** A calibration that was off, a corpus check that failed and forced a regeneration, a classification rule that turned out to be incoherent and was rewritten. Documenting a real mistake and its fix is the highest-credibility content on the entire site.

**Done when.**
- The live URL works in a browser with no cache and no extensions
- Every interactive element on the deployed site has been clicked once
- The findings page names at least one genuine error and what changed as a result

---

## Sequencing note

Phase −1 is the load-bearing one. It produces both the engine and the corpus, and everything after it assumes both are correct. Do not compress it to save time — the days it appears to cost are days it saves in Phase 3.

The corpus data file is frozen once Phase 0 begins. If a later phase reveals a corpus defect, fix it deliberately, regenerate, re-run all five checks, and record the reason in `decisions.md`. Never patch individual cases by hand.
