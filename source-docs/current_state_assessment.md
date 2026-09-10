# Current State Assessment

**Based on:** discovery answers from director and DataHub colleague, plus
the target architecture map. Four of nine stakeholder groups still
unanswered.

**Date of assessment:** current session. Supersedes earlier assumptions in
the HLD where they conflict.

---

## 1. The finding that changes the most

### Henkel's operating model is not domain-oriented ownership

**What was learned:** Application teams (PowerBI builders) are in practice
the ones defining data products. Domain teams largely provide access
rather than build. The stated reason is that domain teams lack the
technical capability. The director's position: **DxD is technical owner,
domains are business owners. This will not change, and the project must
align with it.**

**Why this matters more than it first appears.** Classical data mesh
(Dehghani) rests on domain teams owning their data products end to end,
with a self-serve platform removing the need for a central team. Henkel's
model is a central technical function building products with business
domains as stakeholders. That is a *legitimate and common* operating
model — but it is a different one, and several assumptions in the current
plan were built on the classical model.

**What this invalidates in the existing plan:**

| Assumption | Status |
|---|---|
| Golden path reduces friction for *domain teams* onboarding | **Wrong audience.** The people onboarding are DxD engineers. Still worth building — but it's an internal productivity tool, not an adoption lever |
| Low adoption = domains not publishing | **Probably wrong.** If DxD builds everything, publishing volume is bounded by DxD capacity, not domain willingness |
| Self-serve platform is the core pillar | **Partially inapplicable.** Self-serve for whom? |
| H7 fragmented producer experience | **Less relevant** — the producer is one team, not many |

**What this means for the diagnosis.** "Adoption is low" needs
re-specifying. Under this model there are two very different possible
meanings:

- **Production-side:** DxD cannot build products fast enough. Bottleneck
  is capacity and tooling. → Golden path and automation are the answer.
- **Consumption-side:** products exist but business users don't use them.
  Bottleneck is discoverability, trust, and perceived value. → Semantic
  layer, discovery, and NL access are the answer.

**The director's own theory — "people do not see the benefit in it" —
points to the consumption side.** That is a materially different problem
from the one the current HLD is optimised for, and it is the single most
important thing to confirm in the remaining interviews.

**A naming point, stated once.** What Henkel is building is closer to a
governed, domain-aligned central data platform than to a data mesh as the
term is normally defined. That is not a criticism — the model can work
well, and arguing terminology would be a waste of your credibility. But
designing as if domains will eventually self-serve, when the director has
said they will not, would build the wrong thing. Design for the model
that exists.

---

## 2. The clearest opportunity: there are no data contracts at all

**What was learned:** data contracts do not exist. There is no guard
against pipeline breakage. When a pipeline breaks, engineers trace it
manually, step by step. The DataHub colleague named this as a gap and
said "we need to do this."

**Why this is the strongest available opening:**

- It is a **real, felt pain**, described unprompted by someone outside your
  team. Not a theoretical gap you identified.
- It is **uncontested** — no team currently owns it, so no boundary
  negotiation is required.
- It is **concrete and demonstrable** — a working example can be built and
  shown, not just designed.
- It **fits the mandate** exactly: it is a standard, and it can ship as
  code rather than as a document.
- It is **aligned with the director's framing** — "work out a path to
  build something that will work."
- It **directly serves the AI-readiness goal**: machine-readable contracts
  are property P1 in the agent-readiness design.

**Recommendation: make contracts and pipeline reliability the first
concrete deliverable**, ahead of the broader golden path. Everything else
in the plan is a good idea competing for attention; this one has a
customer already asking for it.

**Note on automation level.** The DataHub colleague relayed the manager's
expectation that the template be "fully automated," suggesting even five
manual criteria may be too many. Revise the certification model's manual-
criteria cap downward — target **two** (owner, and consumer/use case),
with everything else generated or checked. Consumer/use case remains
manual because it is the one criterion that determines whether the product
should exist at all.

---

## 3. DataHub: greenfield, not a collision

**What was learned:** DataHub ingests Databricks, PowerBI, SAP, and DWH.
Lineage is populated across sources. The business glossary has only a
handful of terms. It is "just rolling out" — no meaningful usage data yet.

**This reverses my earlier concern.** I flagged the semantic layer as the
sharpest boundary risk with the DataHub team. It isn't — because there is
almost nothing there yet to collide with. That is an opportunity: the
definitions layer can be shaped now, collaboratively, rather than
retrofitted around an established system.

**On the ownership chain proposed by the DataHub colleague** — *"metrics,
calculation logic and glossary should come from data owners, governance
should maintain them, DataHub presents them, user-facing apps use them"* —
this is broadly right, with one correction:

- **Governance should not maintain definitions.** That recentralises
  content ownership and creates exactly the bottleneck this architecture
  is meant to avoid. Governance should own the **standard for** definitions
  — the required fields, the review process, the quality bar — while
  domains (or, in Henkel's actual model, DxD with business sign-off)
  maintain the content.
- **Corrected chain:** *owners author → governance defines the standard
  and audits conformance → DataHub presents → applications consume.*

**Unresolved and important:** the DataHub colleague places semantic-layer
ownership with the Application team, consistent with them being de facto
product owners. That needs explicit confirmation, because it determines
whether AI-C1 in the plan is yours to build, theirs, or joint.

---

## 3b. PII masking — how it actually works today

**What was learned:** masking is applied **per column, at view-creation time**, written into
the view DDL. Each entity produces two views: a **masked view for dev** and an **unmasked view
for prod**. Databricks' built-in column masking is not used because the approach predates that
feature.

**This is environment separation, not user-based access control.** The security property
depends on which environment a person can reach, not on who they are. A user with prod access
sees unmasked values regardless of whether their role warrants it.

**It is also a legitimate workaround, not a naive one.** Table-level column masks in Unity
Catalog **cannot be applied to views**, and this architecture has consumers reading views.
Masking inside the view SQL was the only available mechanism before ABAC existed. Do not
present it as a mistake.

**What it costs:**

| Property | View-DDL masking | ABAC policy |
|---|---|---|
| Granularity | Per environment | Per user or group attribute |
| Adding a new PII column | Edit and redeploy view DDL | Tag the column; policy attaches automatically |
| Consistency across products | Depends on each author | Written once centrally, inherits down the catalog |
| Auditability | Read the DDL of every view | Query the policy |
| Prod PII protection | **Table/schema grants only** | Enforced per user at query time |

**The open question to put to security or governance:** what protects PII in the *production*
views from users who have prod access but no business need for the raw values? If the answer
is "table grants," that is a coarser control than the masking suggests, and worth knowing
before anyone assumes PII is handled.

**Implication for the plan:** the HLD assumed tag-driven ABAC masking. The reality is DDL-driven
masking with an environment split. Migrating is a real project with real regression risk, not a
configuration change — and it should be scoped as such rather than assumed away. It also means
the ABAC question (is it even enabled?) matters more, because ABAC is the only mechanism that
works on a view-based consumption model.

---

## 3c. Synapse feeds Databricks one-way — logic redevelopment, not untangling

**Correction to an earlier round of this assessment.** Synapse and Databricks are **not**
in a circular relationship. The actual flow, confirmed directly:

- **SAP -> Synapse**, via P47
- **SAP -> Databricks (CIN)**, via P47 -- the same extraction pipeline feeds both
  destinations in parallel, independently
- **Synapse -> Databricks**, one-way -- after SAP data is modelled inside Synapse, some
  of that transformed output is passed into Databricks
- **Databricks does not feed Synapse.** There is no reverse flow

**This is a one-way dependency layered on top of a shared source, not a loop.** The
earlier "circular dependency" framing overstated the problem's shape, though the
underlying risk it was pointing at is real under a different description.

**What actually follows from this:**

1. **Decommissioning Synapse means redeveloping whatever business logic currently lives
   inside it** -- either near the SAP source or natively in Databricks -- not
   "untangling" a bidirectional dependency. Materially simpler to reason about than the
   earlier framing implied, though not necessarily less work.
2. **This is already named in Henkel's own planning**, not a risk this assessment is
   introducing: Option 1, Phase 1 states *"BI Program effort is to migrate CIN + synapse
   business logic to central data products"*; Option 2, Phase 1 states *"Platform effort
   (UDA change) to migrate logic from synapse to databricks."* Both documented options
   already assume this redevelopment happens -- see `cin_replacement_decision.md`.
3. **Some data products still depend on Synapse-modelled output today**, a real
   continuity item during migration regardless of direction. Worth quantifying: which
   products consume Synapse's modelled output, and has the underlying logic for each
   been identified for redevelopment?
4. **"Decommission when the mesh is fully functional" is not logically circular** under
   the corrected model -- Synapse's role is a one-way input to be replaced, not a mutual
   dependency the mesh is stuck inside.

**Revised priority, restated accurately:** identify which Databricks products consume
Synapse-modelled data and whether each has an owner for redeveloping that logic. Still a
concrete, answerable question -- but a logic-migration tracking exercise, not a
dependency-untangling one.

---


## 3d. Data scientists are a second producer population

**What was learned:** data scientists both **consume** data products and **create their own
enriched data products.**

**Three implications:**

1. **This partially contradicts "domains lack technical capability."** Some population inside
   Henkel is technically capable of building data products independently. The constraint is
   narrower than stated — it applies to business domain teams, not to everyone outside DxD.
2. **This is probably what Zone 60 Workspace is for** — previously an open question. Ad hoc,
   no SLA, not part of the governed pipeline. Worth confirming.
3. **Governance status unknown and important.** Do data-scientist products follow the
   `self_`/`shared_`/`source_` convention? Are they discoverable? Contracted? If ungoverned,
   they are shadow products inside the governed platform — the failure mode a mesh is meant to
   prevent. If governed, they are evidence that self-service *can* work here, which is a
   materially more optimistic finding than the operating model implies.

**Question to ask:** where do data-scientist products live, are they published, and does anyone
consume them? The answer changes the producer picture significantly either way.

---

## 3e. Ingestion landscape — P47, CIN, and a live architecture decision

**What was learned (PMO):**
- SAP is extracted via **P47**, delivering to **two** destinations: **Synapse** (DWH) and
  **CIN — Central Ingestion** in Databricks
- **P47 stays at least three years** (management decision)
- **CIN will not remain in its current form** (management decision); its output is still
  needed, differently shaped
- Three replacement options under discussion

**The diagnosis that should frame the decision: CIN is not a data product.** It fails all
four qualification questions — no named consumer (everyone means no one), cannot change
without affecting every domain, does not change as a unit, nobody requests it by name.
**It is Zone 10 for the whole estate, mislabelled as a product.** Management's instinct is
correct, and naming the reason tells us what the replacement must preserve: a *landing
capability*, not a product.

**This also resolves a confusion worth stating publicly:** zones do not move under any
option. They are schema naming inside each domain's own catalog — every product already has
`self_{module}_raw`. CIN was somebody else's Zone 10 sitting outside their catalog. Only
what *feeds* Zone 10 changes.

**The real question all three options answer:** where does the domain routing decision get
made — at source (P47), in the middle (a landing platform), or at target (per-domain CINs)?

**The deciding criterion nobody raised: P47's three-year guarantee is a statement that it
will be replaced.** Routing logic placed inside P47 gets rebuilt at that point. That
argues against the P47-direct option and is invisible unless someone asks what year four
looks like.

**On duplication:** splitting per domain is **partitioning, not duplication** — unless two
domains need the same SAP table, which is common for reference data. That exception drives
the recommendation.

**Recommendation (full reasoning in `cin_replacement_decision.md`):** CIN splits by *data
type*, not by choosing one of the three options.
- **Cross-domain reference data** (customer, material, company code, plant) → a **real
  master data product** publishing `shared_` views. This part *passes* the qualification
  test CIN currently fails.
- **Domain-specific transactional data** → routed to the owning domain's Zone 10 via a
  **landing zone decoupled from P47**, so the abstraction survives P47's replacement.

**Two things this surfaces beyond the immediate decision:**
1. **A master data product does not currently exist** and is now clearly needed. This is
   the first concrete evidence for it — previously `hdp_mdm_dev` was an invented construct.
2. **Databricks ingesting *from* Synapse is a separate blocker** that no CIN option
   resolves. [Guessing] likely data that only exists after Synapse transforms it, in which
   case the dependency survives the restructure.

---

## 4. Classification tags: confirmed as an open risk

**What was learned:** some tags originate in Databricks, some in DataHub.
No decision on whether to consolidate.

This is exactly the split-authority risk previously flagged. With ABAC,
Databricks tags drive *enforcement* — so a divergence means a column can
appear protected in the catalogue everyone browses while being exposed in
practice.

**Recommendation unchanged:** Databricks authoritative for enforcement,
DataHub ingests for display. This is a small decision that is cheap now
and expensive after both systems are populated. Worth raising early
precisely because it is uncontroversial and demonstrates the kind of
boundary-setting the role is meant to provide.

---

## 5. What the target architecture map shows

*[Reading a dense diagram — treat specifics as provisional and confirm.]*

**Structure observed:**
- Three top-level groupings: **IQ, CX, OX**
- Twelve value streams: Sustainability, Regulatory, Innovation, Product &
  Portfolio Excellence, Strategic Marketing, Marketing, Sales, Ordering/
  Aftersales, Other, Supply Chain, Quality, Manufacturing
- **A product taxonomy already exists**: Use case product · HAT data
  product · Central data product · Data entity · Source system
- Roughly forty source systems (SAP ECC, Salesforce-adjacent, Marketo,
  PIM, Aveva, sensor platforms, external data providers)
- Sub-team prefixes throughout: dxA, dxV, dxT, dxC, dxM, dxF, dxX

**Three implications:**

**(a) A classification taxonomy already exists and predates this
programme.** Use case / HAT / Central product types map loosely onto the
consumer-aligned / aggregate / source-aligned taxonomy from the Data
Product Canvas. **Use Henkel's existing vocabulary rather than
introducing a parallel one.** Introducing new terminology alongside an
established taxonomy is a reliable way to be ignored.

**(b) CONFIRMED: this is current state, not target.** The estate
described — ~40 source systems, products across twelve value streams,
populated lineage — exists today.

**This settles the central diagnostic question.** Production capacity is
not the binding constraint. Combined with the director's theory
("people do not see the benefit"), the conclusion is direct: **the
adoption problem is consumption-side.** Products exist; they are not
being used. H8 (DxD capacity) is ruled out as the current constraint,
and the roadmap reorders around trust, findability, and usability.

**(c) The interdependency density is the real argument for contracts.**
The number of crossing lines between products means a single upstream
schema change can propagate widely, and today nothing detects that except
a human tracing it manually after something breaks. The map is, in effect,
a picture of the blast radius that contracts and automated checks would
contain.

---

## 6. Revised hypothesis ranking

Original six hypotheses, re-ranked against evidence:

| Rank | Hypothesis | Evidence | Status |
|---|---|---|---|
| 1 | **H4 — unclear value / consumption-side** | Director's own theory: "people do not see the benefit" | Strongest signal so far |
| — | ~~H8 — production capacity bounded by DxD~~ | Architecture map confirmed as current state; large estate exists | **Ruled out as current constraint** |
| 2 | **H10 (new) — the DWH is a working competing alternative** | DWH still running, "should ideally be decommissioned when Data Mesh is fully in place" | Strong candidate explanation *for* H4 |
| 3 | **H9 (new) — no reliability guarantees** | No contracts, manual break tracing | Confirmed as a gap; likely suppresses trust |
| 4 | H3 — skills gap | Confirmed as the *reason* for the DxD model, not a barrier to fix | Reframed |
| 5 | H1 — onboarding friction | Still plausible, but for DxD engineers not domains | Narrower than assumed |
| 6 | H7 — fragmented producer experience | Weakened — one producer team | Deprioritise |
| — | H2, H5, H6 (access speed, shadow alternatives, cost) | Untested | Ask platform team and consumers |

---

## 7. What is still missing

Five of nine groups unanswered, and the gaps are material:

| Group | Why it matters now |
|---|---|
| **Platform / DevOps** | Permissions (longest-lead blocker), whether ABAC and auto-classification are enabled, what the security service enforces, real onboarding time |
| **Consumers / business users** | **Now the highest priority.** If the barrier is consumption-side, these are the people who can confirm or refute it |
| **Application teams** | De facto product owners. Not in the original interview list — **add them.** They are arguably the most important group |
| Governance team | Whole section unanswered; boundary still unresolved |
| Domain teams | Both onboarded and not — value now depends on what they actually do in the DxD model |

**Add a tenth group: Application / PowerBI teams.** Under the model as
described, they are the real product owners. Interviewing domain teams
about product ownership without interviewing Application teams would miss
the people actually doing the work.

---

## 8. Recommended adjustments to the plan

1. **RESOLVED — adoption is consumption-side.** Confirmed by the
   architecture map being current state. The roadmap now leads with trust
   (contracts), then findability and meaning (definitions/DataHub), then
   effortless access (NL query).
2. **Promote contracts and pipeline reliability to first deliverable.**
   Uncontested, painful, demonstrable, matches the mandate, and lays the
   P1 foundation for later automation.
3. **Reposition the golden path.** Still worth building, but as a DxD
   engineering productivity tool, not a domain self-serve platform. Adjust
   the framing in the stakeholder documents accordingly.
4. **Move AI-C1 (semantic layer / NL access) earlier if consumption-side
   is confirmed.** It stops being a phase-four capability and becomes the
   direct answer to "people don't see the benefit."
5. **Contracts: zero manual authoring effort.** Everything generated
   except three facts (owner, named consumer/use case, promised SLA),
   captured at intake rather than written into a document. The named
   consumer must not be automated away — under the DxD model it is the
   only structural guard against building products nobody requested.
6. **Adopt Henkel's existing product taxonomy** (Use case / HAT / Central)
   rather than introducing new classification vocabulary.
7. **Establish the DWH position (H10).** What remains on it, who uses it,
   is there a decommissioning plan. Possibly the largest single factor in
   adoption, and not a tooling problem.
8. **Settle the classification-tag authority question early** — small,
   uncontroversial, and demonstrates the boundary-setting the role exists
   to provide.

---

## 9. Notes on the director's answers

Three things worth reading carefully:

- **"We only need to do and lead project, high level design."** You are
  designing and leading, not implementing. The plan must therefore be
  executable by others — which raises the value of templates, standards-
  as-code, and written contracts, and lowers the value of anything that
  depends on you personally building it.
- **"We don't need to worry about politics yet — work out some path to
  build something that will work."** Effectively removes the political
  constraint that shaped the stakeholder documents' careful framing, and
  favours demonstrating something concrete over securing consensus first.
  This supports leading with contracts.
- **"Nothing would make this look like a failure — long-term project with
  expected bumps."** Unusually low-pressure framing. Two readings: genuine
  latitude to do it properly, or low urgency and therefore low attention.
  Either way it argues for producing something visible and concrete early
  rather than relying on the mandate alone to sustain interest.
