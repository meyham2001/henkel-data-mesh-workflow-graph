# CIN Replacement — Assessment of Henkel's Documented Options

**Status:** Updated following review of the internal *"BI Evolution & Platform
- Data Mesh Evaluation"* document (28.01.2026 working notes)
**Supersedes:** the original three-option analysis (Option A/B/C) in the
prior version of this document — Henkel already has two named, phased
options in active planning, and this assessment now works from those
directly rather than a parallel framework.

**Confidence markers:** [Certain] verified from the source document ·
[Likely] reasoned inference · [Guessing] explicitly unverified

---

## 1. What the source document establishes

**The current chain [Certain]:**
`P47 → Hangfire → Blob → CIN → Central Data Products → Use Cases`

**The future chain, as drafted [Certain]:**
`P47 → Hangfire → Blob → ~~CIN~~ → Domain Data Products → Use Cases`

CIN is struck through in the source document's own diagram, with the
note: *"data in Hangfire are mapped directly to Domain Data Products."*
**Henkel's own planning already treats CIN as something to be removed
from the chain, not restructured in place.**

**P47's actual successor is named and diagrammed [Certain]:** SAP
Business Data Cloud (BDC), delivering into Databricks via **BDC
Connect**, a Delta (Open) Share. This resolves what the prior version of
this document treated as an open question — it is not unknown, SAP is
shipping it.

**Ownership is split and named [Certain]:**
- **Platform Team** — owns P47 evolution, BDC integration patterns,
  Hangfire replacement, HDP capabilities and operations
- **BI Evolution Program** — owns business data content and semantics,
  central/domain data product definition, migration of business logic
  off CIN/Synapse, and adoption by BI applications

**CIN's actual nature is stated in Henkel's own words [Certain]:**
*"current central data products are data containers... in the future,
Finance will consist of approximately 8-10 individual Finance Data
Products."* This is the same finding as the qualification test in
Section 3 below — reached independently, in the source document,
without reference to this project's framework.

---

## 2. Henkel's two documented options

### Option 1 — Distributed (marked "preferred way" in the source document)

**Phase 1**
- Test CDS-based extraction with new prototype products — source-aligned
  data with each data product
- BI Application Workspaces build a reusable central/domain data product,
  consuming from **CIN Raw** (source-aligned, not CIN's processed output)
- Business logic currently in CIN and Synapse migrates **out**, into
  central/domain data products — the source-aligned view stays as-is for
  now
- Platform keeps SAP extraction stable; CIN continues supplying
  source-aligned data during the transition

**Phase 2**
- Sources switch to BDC / S4HANA
- Platform defines a new, self-service data integration pattern aligned
  with cross-platform data sharing
- Data products redirect to BDC sources — logic changes, because the
  BDC-sourced view differs from the CIN-sourced view
- Platform maintains compatibility for anything still on CIN during
  migration to the new products ("wellspring from CIN to SBI")

**What this means structurally:** CIN's role shrinks to pure landing
almost immediately (Phase 1), with business logic relocated to the
products that should own it. CIN is then bypassed entirely once BDC
lands (Phase 2).

### Option 2 — Centralized (source document's label: "current setup /
backup solution... provide the thin CIN")

**Phase 1**
- Test CDS-based extraction into CIN, source-aligned, reapplying existing
  extractor logic
- **CIN stays as-is structurally.** Logic migrates from Synapse to
  Databricks, but **central data products do not take ownership of
  business logic** — it remains centralized
- A separate effort decides which logic moves to central data products
  versus staying in CIN

**Phase 2**
- SAP extractors move into BDC within CIN, building both a compatibility
  view and a new S4-native view
- BI adapts to S4 changes CIN cannot abstract away
- A data architecture effort decides, source by source, whether
  consumption is direct from BDC, via central data products, or still
  indirect via CIN

**What this means structurally:** CIN persists as a mediating layer for
longer. Business logic centralizes rather than distributing. Lower
short-term disruption; the source document frames it explicitly as the
fallback.

---

## 3. How the qualification test applies to each option

The four-question test used throughout this project (named consumer /
independent change / changes as a unit / requested by name) still applies
— and it explains *why* Option 1 is the documented preference, independent
of Henkel's own framing.

| | Today (CIN as-is) | Option 1, Phase 1+ | Option 2, Phase 1 |
|---|---|---|---|
| Named consumer | No — every domain, which is no domain | **Yes** — each domain data product | Still no — logic stays centralized |
| Independent change | No | **Yes**, once logic moves out | No |
| Changes as a unit | No | **Yes**, per product | No |
| Requested by name | No | **Yes** — "the Finance data product," not "CIN" | No |

**Option 1 is the only one of the two that actually resolves the
qualification failure.** Option 2 keeps the same structural problem —
one undifferentiated centre everyone depends on — under a thinner,
Databricks-native implementation. That is a legitimate reason to hold it
as a backup rather than a target: it reduces migration risk without
addressing the underlying issue.

---

## 4. Where this project's prior analysis still adds value

Three contributions from the earlier version of this document remain
relevant to **implementing Option 1 well**, and are offered as refinements
to Henkel's own plan rather than an alternative to it:

**4.1 — The P47-horizon argument still holds, sharpened.** The prior
concern was that routing logic placed inside P47 gets rebuilt when P47 is
replaced. The source document confirms this is already the working
assumption — Section 4 of the internal planning explicitly asks for a
*"P47 retirement roadmap"* and *"who will confirm the impact after P47
decommissioning."* **This is not a hypothetical risk this project is
flagging; it is a live question Henkel is already asking.** Worth
citing this document directly.

**4.2 — Shared reference data still needs a home Option 1 doesn't yet
name.** Option 1's phase 1 is explicit that domain data products become
source-aligned. It does not state how genuinely cross-domain SAP
reference data (customer, material, company code) avoids being
duplicated into every domain's data product. **Recommendation: this
should be a small number of dedicated master data products** —
`shared_` published, `source_` mirrored by domains that need them — not
absorbed into any single domain's product. This is directly answerable
from the source document's own open question 6: *"Do we use CIN for
non-SAP data in future?"* — the master-data question is the SAP-side
analogue of that same question.

**4.3 — Zones do not move, regardless of which option is chosen.** Both
options ultimately land data into domain or central products using the
existing zone structure (`self_{module}_raw` → ... → `curated`). This
remains true whether CIN persists as a thin layer (Option 2) or is
bypassed (Option 1). Worth stating plainly in any internal communication,
since it was a real point of confusion earlier in this project.

---

## 5. Assessment

**Option 1 is correctly marked as preferred**, and independently
corroborated by the qualification test this project has used throughout:
it is the only option that turns CIN's output into something that passes
as a real data product rather than remaining a shared container.

**Option 2's value is explicitly risk-reduction, not architecture.**
Treating it as a genuine backup — not a fallback to be quietly preferred
because it's less disruptive — requires the same discipline this project
has argued for elsewhere: know why a decision was made, and revisit it if
the reason no longer applies.

**Two things worth raising in the ongoing discussion, sourced directly
from the internal document's own open questions:**

1. *"Can we enable the distributed type of modelling even in the central
   P47 process with governance?"* — Section 1, question 1. This is asking
   whether Option 1's distribution can happen **before** BDC lands, inside
   the current P47 constraint. If yes, Phase 1 of Option 1 is achievable
   sooner than Phase 2 implies.
2. *"Do we use CIN for non-SAP data in future?"* — Section 2, question 6.
   Unanswered in the source document. This project's recommendation
   (4.2 above) is that non-SAP cross-domain reference data should follow
   the same master-data-product pattern as SAP reference data, for
   consistency rather than two different answers to the same underlying
   question.

---

## 6. Open questions carried from the source document

Recorded because they are still open there and matter to this programme:

1. Can distributed modelling be enabled inside the current P47 process
   with governance, ahead of BDC?
2. How are other development teams enabled to be more autonomous?
3. What is the impact of domain-owned CINs on the BI team, Platform team,
   and others — as one-time workload versus ongoing operational load?
4. Which layer is genuinely "Raw" with no business logic at all?
5. Do we use CIN for non-SAP data in future?
6. One HDP workspace for all sub-domains, or one per application?
7. When does the CIN split take place, and does splitting mean multiple
   instances, logical separation, or physical separation?
8. Can downstream pipelines be automatically re-mapped from the current
   CIN structure to future domain data products, to reduce consumer
   rework?
9. What happens to Auth DB data, and how are authorizations handled in
   the future architecture?
10. Who owns the extraction process, and how are shared extractors
    managed?

---

## 7. Summary

- **This project's original three-option framework is superseded.**
  Henkel has two real, named, phased options already in planning: Option 1
  (Distributed, preferred) and Option 2 (Centralized/thin CIN, backup).
- **CIN is already marked for removal from the chain** in Henkel's own
  target-state diagram, not merely restructuring.
- **P47's successor is named**: SAP BDC, via BDC Connect (Delta Share) —
  not an open question.
- **The qualification test corroborates Option 1 independently**, and
  explains structurally why Option 2 is correctly scoped as a backup
  rather than a target.
- **This project's remaining contribution**: the P47-horizon argument
  (now confirmed as a live Henkel question, not a hypothetical), and the
  recommendation that shared reference data — SAP and non-SAP alike — get
  a small number of dedicated master data products rather than being
  duplicated per domain.
