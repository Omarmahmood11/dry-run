# AGENTS.md

**Project:** Dry Run

---

## Reading order

Before writing any code in any session, read in this order:

1. `docs/context.md` — what this is and is not
2. `docs/replay.md` — the core logic
3. `docs/dataset.md` — the corpus
4. `docs/decisions.md` — choices already made, and why. Read it so you do not relitigate a settled question.
5. `AGENTS.md` — this file
6. The single phase you were given from `docs/implementationPlan.md`

Do not read ahead to other phases. Build only what the current phase specifies.

---

## Stack

- Next.js, App Router, TypeScript
- React, function components, hooks
- Tailwind for styling
- Deployed on Vercel
- No database. The corpus is a committed file; ruleset versions persist in browser local storage so history survives a page reload
- No authentication
- No external API calls at runtime

Do not introduce a library that is not already in `package.json` without it being specified in the phase. If a phase seems to require one, stop and say so rather than adding it.

---

## Hard constraints

**No language model in the evaluation path.** Rule evaluation is arithmetic and boolean logic. A model may be used in the corpus generation script for text realism only. If any code path from a rule to a decision touches an LLM, that is a defect of the highest severity.

**Determinism.** The same ruleset applied to the same case must always produce the same decision. No randomness, no time-dependence, no reliance on iteration order of unordered collections.

**Replay is read-only.** A replay must not mutate the corpus, the live ruleset, or any stored state. Verify this rather than assuming it.

**Append-only history.** No code deletes or overwrites a ruleset version. Rollback creates a new version.

**No `any`.** Types are defined once in a shared types file and imported. If a type is genuinely unknown, stop and ask rather than reaching for `any`.

---

## Naming

Two things in this project are called "confidence" in ordinary speech. Keep them distinct in code:

- `extractionConfidence` — the score attached to a case, representing certainty about the invoice's field values
- Never use a bare `confidence` identifier anywhere

**"Regression" is a category, not a number.** Three classifications are regressions; they are never summed and no variable may hold a combined regression count. If you find yourself writing `regressionCount`, stop — the correct variable is `missedProblemCount`.

Other fixed terms, used exactly as defined in `replay.md`:

- `Decision` — `APPROVE` | `ESCALATE` | `BLOCK`
- `Classification` — `PREVENTED_LOSS` | `SAVED_EFFORT` | `ADDED_FRICTION` | `WEAKENED_CONTROL` | `MISSED_PROBLEM`
- `GroundTruth` — `LEGITIMATE` | `PROBLEM`
- `Ruleset`, `Rule`, `Change`, `Replay`, `Diff`

Do not invent synonyms. Do not shorten these in code.

---

## Structure

- Domain logic lives in `/lib`, is pure, and has no React imports
- The rule engine and the replay engine are separate modules and independently testable
- The corpus generator imports the rule engine. It never contains its own copy of the evaluation logic
- Components live in `/components` and contain no rule logic
- The corpus and the baseline ruleset are data files under `/data`, committed
- Tests sit beside the module they test

The rule engine must be runnable from a plain Node script with no browser and no React. If it cannot be, it is in the wrong place.

---

## Code style

- Function components, named exports
- Descriptive names over short ones. `changedCasesByClassification`, not `ccbc`
- Early returns over nested conditionals
- Comments explain why, not what. A comment restating the code is noise
- No clever one-liners in the rule engine. That code will be read aloud in an interview and must be obvious

---

## Interface style

Per `docs/context.md` section 11: calm, precise, slightly conservative. This is a tool for someone accountable when money moves incorrectly.

- Neutral background, restrained palette
- Classification states use colour, but colour is never the only signal — always accompanied by text and count
- No animation, no transitions, no loading spinners for operations that complete instantly
- Dense information is acceptable. This user reads tables for a living
- Desktop only. No mobile layouts, no responsive work below 1024px

---

## Testing

Each phase's done-conditions are its acceptance criteria. Write the test before the implementation where the condition is mechanically checkable.

Minimum coverage:
- Every rule type evaluates correctly in isolation
- The evaluation order from `replay.md` section 5 holds, including the `ESCALATE` default
- The baseline reproduces all 400 recorded decisions — a smoke check for data loading, not proof of correctness
- Replay leaves corpus and live ruleset unchanged
- Classification counts sum to the changed count
- Each rule type has a test that fails if its logic is inverted

---

## When to stop and ask

Stop and ask rather than proceeding if:

- A phase's requirements contradict `replay.md` or `dataset.md`
- A done-condition appears impossible to satisfy as written
- Meeting a done-condition appears to require something on the non-goals list in `context.md` section 7
- A new dependency seems necessary
- A done-condition cannot be met and the reason is unclear

An unrequested feature is worse than a missing one. Scope discipline is the point.

---

## Git

- Tag after every phase whose done-conditions are all met: `phase-0`, `phase-1`, and so on
- Branch before Phase 3
- Commit messages state what changed and why in one line
- The corpus data file is committed and never regenerated after Phase 0 begins, except by deliberate decision recorded in `decisions.md`
- Append to `decisions.md` whenever a non-obvious choice is made. Never rewrite an existing entry
