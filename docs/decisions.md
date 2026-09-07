# decisions.md

**Project:** Dry Run

A running log of choices made during the build and the reasoning behind them. **Append only.** Never edit or delete an existing entry — a superseded decision gets a new entry that references the old one.

Entries are added by both the author and any coding agent that makes a non-obvious choice.

Format: date, the decision, and why.

---

## 2026-09-06 — Escalation layer rejected as project concept

Considered building a confidence-and-escalation layer for AI employees. Rejected: Zamp's public FAQ states their agent already monitors, acts and escalates on its own, and a customer testimonial describes exactly this behaviour. Pitching it would have signalled not having read their material.

## 2026-09-06 — Multi-agent orchestration console rejected

Considered a manager's console for coordinating multiple AI employees. Rejected: Zamp published an orchestration-layer post on 3 September 2026 describing delegation, shared state, supervisor agents and an "AI agent org chart." Also too much of the demo would have been simulated.

## 2026-09-06 — Configuration change preview selected

Chosen because the problem is publicly named by a senior Zamp employee who deploys agents at Fortune 500 companies, because the core computation is genuinely real rather than simulated, and because it is positioned as the next surface rather than a gap in their product — a framing that holds whether or not an internal version exists.

## 2026-09-06 — Recommend, never block

Dry Run warns about regressions but never prevents shipping. A tool that blocks gets disabled or worked around within a month, leaving the organisation with neither safety nor visibility. Accountability stays with the human who owns the outcome.

## 2026-09-06 — Regression is a category, not a number

Three classifications count as regressions but are never summed. A wrongly-paid invoice, a weakened control barrier and five wasted minutes of review are not the same unit of harm. The only headline number is the `Missed problem` count.

## 2026-09-06 — Weakened control added as a fifth classification

A `PROBLEM` case moving from `BLOCK` to `ESCALATE` is more permissive but still lands in front of a human. Classifying it identically to auto-approval overstates the harm. It gets its own category, reported separately.

## 2026-09-06 — Rule engine built before the corpus, not in Phase 1

The corpus generator needs the engine to produce recorded decisions. Writing it twice would guarantee drift between the generator and the app. The engine is therefore built in Phase −1 and imported by the generator.

## 2026-09-06 — Base currency INR

All amounts in rupees. `currency_mismatch` denotes an invoice denominated differently from its purchase order, which is an exception rather than the default.

## 2026-09-06 — No operator identity recorded

Version history records what changed and when, but not who. There is no authentication in this build, so a name field would be fiction. The gap is named in `replay.md` rather than faked.
