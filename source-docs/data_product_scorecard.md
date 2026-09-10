# Data Product Scorecard

An audit instrument, not a compliance form. Its purpose is to find out
what's actually true about HDP's published products — including, and
especially, if the answer is uncomfortable.

**Time per product:** 5–10 minutes. **Who runs it:** platform/architecture
team, *with* the owning team present, not to them.

**Framing that matters:** run this as diagnosis, not assessment. If domain
teams believe this is a scoring exercise they can fail, you will get
defensive answers and useless data. Say plainly that low scores are
expected, are a finding about the platform rather than the team, and that
the output is a platform backlog rather than a report card.

---

## Part 1 — Qualification (does this even count?)

Four questions (QQ1–QQ4). All must be YES for the thing to be a data product at all.
These are deliberately blunt.

| # | Question | Y/N | Notes |
|---|---|---|---|
| QQ1 | Is there a **named consumer** who would complain if this disappeared tomorrow? Name a person or team, not a hypothetical. | | |
| QQ2 | Can the owning team **change it without another team's sign-off**? | | |
| QQ3 | Does the **whole thing change as a unit** — no part that changes for unrelated reasons? | | |
| QQ4 | Would a consumer **request it by name**? ("Customer 360" yes; "the enriched orders staging table" no.) | | |

**Interpretation:**
- **QQ1 = NO** → not a data product. A published dataset. This is the most
  common failure and the most important to record honestly.
- **QQ2 = NO** → boundary spans domains; drawn wrong. Split or reassign.
- **QQ3 = NO** → too big. Split along the change-coupling seam.
- **QQ4 = NO** → likely an internal pipeline artifact exposed by accident.

### A worked example — CIN

CIN (Central Ingestion) is the clearest available illustration of why these four questions
matter, and it is useful to cite when explaining the test to others:

| Question | CIN | |
|---|---|---|
| QQ1 named consumer who'd notice? | Every domain — functionally the same as none | ❌ |
| QQ2 changeable without sign-off? | No. Any SAP source change affects everyone | ❌ |
| QQ3 changes as a unit? | No. Changes whenever *any* source changes | ❌ |
| QQ4 requested by name? | No. Consumers ask for their domain's data | ❌ |

**Fails all four.** It is a *landing function* mislabelled as a product — Zone 10 for the
whole estate. Management independently concluded it cannot remain in its current form,
which is corroboration that the test identifies something real rather than being an
academic exercise.

**The useful part:** the diagnosis tells you what a replacement must preserve — a landing
capability, not a product. See `cin_replacement_decision.md`.

---

## Part 2 — Tier assessment

### Registered tier (discoverable, not yet safe to depend on)

| # | Criterion | Met? | Auto? |
|---|---|---|---|
| R1 | Named owner (team, not individual) with a contact channel | | Manual |
| R2 | Conforms to naming / zone convention | | CI-checkable |
| R3 | Has a description a non-author can understand | | Manual (template-prompted) |

### Certified tier (other domains may build on it)

All Registered criteria, plus:

| # | Criterion | Met? | Auto? |
|---|---|---|---|
| CERT-1 | Named consumer and documented use case | | **Manual** |
| CERT-2 | Data contract exists: schema, guarantees, breaking-change policy | | Template + CI-validated |
| CERT-3 | Sensitivity classification applied | | Auto-classification + governed tags |
| CERT-4 | Declared freshness cadence | | Template; CI-checkable |
| CERT-5 | Automated quality checks in the pipeline | | Template-generated stubs |

**Manual-criteria count: 4** (R1, R3, CERT-1, and reviewing CERT-2's content).
Within the five-criterion cap from the HLD. If this list grows, something
must be automated or dropped to stay under it.

---

## Part 3 — Findings per product

```
Product:                    ___________________________
Owning domain:              ___________________________
Qualifies (QQ1–QQ4 all YES)?  [ ] Yes   [ ] No — which failed: ____
Current tier:               [ ] Neither  [ ] Registered  [ ] Certified
Gap to next tier:           ___________________________
Blocker is:                 [ ] Team effort  [ ] Platform gap  [ ] Unclear ownership
```

**The `Blocker is` field is the most valuable output of the entire audit.**
If most blockers are *platform gaps*, the adoption problem is yours to fix
and the golden path is the right investment. If most are *team effort*,
the problem is enablement, incentives, or capacity — a different
intervention entirely, and one that architecture work will not solve.

---

## Part 4 — Aggregate findings

To be filled after auditing all products. These are the numbers to bring
to the director.

| Metric | Value |
|---|---|
| Products audited | |
| Failing QQ1 (no named consumer) | |
| Failing any qualification question | |
| At Registered tier | |
| At Certified tier | |
| Blockers that are platform gaps vs. team effort | |
| Median criteria met per product | |

**Expected result, stated in advance so it isn't spun after the fact:** a
meaningful share will fail Q1. That is not a failure of the domain teams
— it is what happens when a platform is built and teams are asked to
populate it before consumer demand exists. Recording it plainly is the
point of the exercise.

---

## Part 5 — Which criteria are actually load-bearing

Track this over time. At each review:

| Criterion | Times it caused a product to be fixed or rejected |
|---|---|
| QQ1 named consumer | |
| QQ2 independent change | |
| QQ3 change coupling | |
| QQ4 requestable by name | |
| R1–R3, CERT-1–CERT-5 | |

Any criterion that has **never** been the reason for a rejection or a fix
is ceremony. Drop it. This table is the pruning mechanism that stops the
criteria list growing by accretion — without it, the list only ever gets
longer.
