# context.md

**Project:** Dry Run
**Author:** Omar Mahmood
**Purpose of this document:** the single source of truth for what this project is and is not. Every other doc and every coding agent session reads this first. If something contradicts this file, this file wins.

---

## 1. What this is

Dry Run is a change-preview layer for AI employees.

Before a configuration change to an autonomous agent goes live, Dry Run replays that change against a corpus of the agent's past decisions and reports exactly what would have decided differently — including how many of those changed decisions would have been wrong.

The user then ships the change, or doesn't. If they ship it and it goes badly, they roll it back in one click.

## 2. The problem

Autonomous agents in finance are not configured once. They are configured continuously, by non-engineers, in production.

A controller raises an approval limit. An analyst moves a confidence threshold. An ops lead adds a vendor exception. Each of these changes what the agent does with real money, and today each is made blind — no preview, no test, no record, no undo.

Software engineering solved this decades ago with staging environments, test suites, and version control. Agent configuration has none of it, despite the blast radius being larger: a code bug throws an error, a bad threshold silently approves invoices for a month before anyone notices.

The failure mode is not launch-day. It is month six, when the agent behaves differently than it did in the pilot and nobody can say which change caused it.

## 3. Who it is for

The **process owner** — a finance or ops lead who owns the outcome of an AI employee's work but does not write code.

They are accountable for the agent's decisions, they are the one making config changes, and they currently have no way to know what a change will do before it does it.

Not for: ML engineers (they have their own tooling), auditors (adjacent, not the primary user), or end consumers.

## 4. Evidence base

Claims are separated by how well they are supported. Do not let these blur together in the pitch.

**Verified.** A senior member of Zamp's founder's office, who deploys agents at Fortune 500 companies in healthcare and banking, has publicly stated that the blocker in enterprise agent rollouts is almost never the model — it is the hundred people who touch the agent after launch: the claims manager tweaking a rule, the analyst moving a threshold, the contractor who deletes what looks like a test agent and takes down a global workflow.

**Well-supported.** Gartner forecasts that over 40% of agentic AI projects will be cancelled by the end of 2027, citing unclear business value and inadequate risk controls. Projects rarely die at launch; they die when behaviour drifts and nobody can explain it.

**NOT verified.** Whether Zamp, or any specific vendor, lacks this capability today. Their public material does not address it either way. This is exactly the kind of internal tooling a company builds and never markets.

**Consequence for positioning:** Dry Run is never pitched as "the gap you missed." It is pitched as "this deserves to be a first-class product surface the customer controls, not internal tooling." That framing is correct whether or not an internal version already exists.

## 5. What is real and what is simulated

Being explicit about this is a feature, not an apology. It is stated openly in the pitch.

**Real — actual computation with a correct answer:**
- The rule engine. A rule applied to a case produces a decision.
- The replay engine. A new rule run across the full corpus, diffed against recorded decisions.
- The regression count. Because each case carries a known real-world outcome, the tool can report not just what changed but what changed *wrongly*.
- Change history and rollback.

**Simulated — stated out loud:**
- The AI employee itself. Dry Run is not an invoice-processing agent. It needs a corpus of past *decisions* to replay against, not a live agent generating them. The corpus is generated once and frozen.

The product being demonstrated is the safety layer, not the worker. Building the worker would consume the entire timeline and prove nothing the layer doesn't.

## 6. Domain

Accounts payable invoice approval. One domain, deliberately.

Chosen because it is the most documented agentic finance use case, the decisions are discrete and auditable, and the consequences of a bad threshold are unambiguous — money leaves the company.

Do not generalise the product to other domains in the build. Generalise it in the pitch, where it costs nothing.

## 7. Non-goals

These are out of scope and must not be built, regardless of how natural they feel mid-session:

- Authentication, user accounts, multi-tenancy
- Document upload, OCR, or invoice extraction
- Any integration with a real ERP, accounting system, or payment rail
- User-supplied invoices or cases — the corpus is fixed
- Building or improving the underlying decision agent
- Multi-agent orchestration
- Mobile layouts

The demo runs on a fixed dataset in a browser. Anything that lets a viewer feed in unexpected input is a way for the demo to break in front of the person evaluating it.

## 8. What success looks like

**For the artefact:** a stranger opens the live link, changes a rule, and within ten seconds understands what that change would have done to four hundred past decisions — including the three it would have got wrong.

**For the pitch:** the viewer accepts that configuration change is an unmanaged risk surface in agentic AI, and that owning it is strategically valuable rather than a nice-to-have.

**The moment the demo turns on:** the missed-problem warning. Not "23 decisions changed" — anyone can diff. It is *"and 3 of them would have been wrong."* That number is the product.

**Vocabulary note.** "Regression" is defined in `replay.md` section 7 and covers two distinct harms. Do not use it loosely to mean "missed problems" — say `Missed problem` when that is what is meant. This document previously drifted on this and the drift is corrected here.

## 9. Document set

Five specification documents plus one running log:

- `context.md` — this file
- `replay.md` — core logic
- `dataset.md` — the corpus
- `implementationPlan.md` — phases
- `AGENTS.md` at the repo root — stack and code rules
- `decisions.md` — a running log of choices made during the build and why. Appended to, never rewritten. Referenced by `replay.md` section 5.

## 10. Constraints

- **Timeline:** 12 days from doc completion to submission.
- **Cost:** zero. Free-tier hosting and free-tier model access only.
- **Stack:** Next.js on Vercel. Chosen for familiarity, not merit — no new stack is learned during this build.
- **Build method:** coding agent, fresh session per phase, git tag after each green phase.
- **Base currency:** INR. All amounts are in rupees. `currency_mismatch` refers to an invoice denominated in a currency other than the purchase order's, which is a genuine exception, not the default state.
- **Author writes no code by hand.** Specs must therefore be unambiguous; ambiguity in the docs becomes defects in the build.

## 11. Tone

The product is a safety tool for people who are accountable when money moves incorrectly. It should feel calm, precise, and slightly conservative. Not playful, not a dashboard, not a toy.

The interface should make a user hesitate before shipping a bad change. That hesitation is the entire value proposition.
