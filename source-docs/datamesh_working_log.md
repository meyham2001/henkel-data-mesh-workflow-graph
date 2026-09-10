# Data Mesh — Working Log

**Purpose:** reference document for future sessions. Captures what was
built, what was decided, what was corrected, and what remains unknown.

**Confidence markers:** [Certain] verified · [Likely] reasoned inference ·
[Guessing] explicitly unverified · [INVENTED] my construct, not Henkel fact

---

## 1. Context

- Goran, Senior Data Architect at Henkel (Düsseldorf), recently started.
- Mandate: **define standards other domains follow**.
- Platform: HDP — Henkel Data Platform, Azure Databricks based.
- Stated state of HDP mesh: **built, but low adoption**.
- Learning constraint: Databricks Free Edition for the hands-on project.

---

## 2. Artefacts produced

| File | What it is |
|---|---|
| `databricks_data_mesh_project.zip` | Hands-on learning project (14 SQL scripts, 2 notebooks, data generator, 2 contracts) |
| `TUTORIAL.md` | Step-by-step walkthrough, 12 phases |
| `CONCEPTS.md` | The "why" behind the tutorial's structure |
| `data_mesh_map.html` | Interactive architecture reference diagram |
| `henkel_datamesh_hld.md` | Internal HLD — honest, hedged, includes gaps |
| `henkel_datamesh_stakeholder_proposal.md` | Executive/sponsor facing |
| `data_product_scorecard.md` | Audit instrument for existing products |
| `discovery_questions.md` | Interview guide — 9 groups (add a 10th: Application teams) |
| `current_state_assessment.md` | Assessment after first discovery round |
| `workflow_and_environment_design.md` | End-to-end workflow, 12 stages, ownership matrix, gap register, system boundaries |
| `workflow_diagram.html` | Interactive version of the workflow — click stages and containers for detail |
| `cin_replacement_decision.md` | CIN options assessment and recommendation (PMO discussion) |
| `henkel_datamesh_application_teams.md` | For the actual builders (replaced the misaddressed domain-teams doc) |
| `henkel_datamesh_business_owners.md` | Short doc for business domain owners — value and consumption only |
| `glossary.md` | ~90 terms and abbreviations, plus structural labels |

---

## 3. Learning project — evolution and why each version was wrong

**v1:** generic bronze/silver/gold, one catalog per business function.
Wrong: not aligned to HDP at all.

**v2:** adopted HDP zone names (Raw/External/Staging/Enriched/Curated/
Serving), but kept one catalog per business domain **plus a central
`serving` catalog** for cross-domain joins.
Wrong on two counts, confirmed by Henkel's Unity Catalog doc:
- Catalog = **product/workspace** (`hdp_{product}_{env}`), not business function
- **There is no central serving catalog.** Cross-product sharing works via
  `shared_` publish → `source_` mirror inside the consumer's own catalog.

**v3 (current):** 5 catalogs (`hdp_sales_dev`, `hdp_mkt_dev`,
`hdp_rnd_dev`, `hdp_mdm_dev`, `hdp_insights_dev`), full `self_`/`shared_`/
`source_` triad, 13 data products.

**Deliberate imperfections left in the project as teaching devices:**
- Script 08 mirrors an *enriched* table instead of *curated* — flagged as a
  shortcut a real governance review would catch.
- `campaign_efficiency` and `revenue_by_lead_source` exist in `self_` with
  no `shared_` counterpart — the normal case; publishing is deliberate.
- External vendor feed with deliberately messy schema (`campaignID`,
  `dd/MM/yyyy`, undocumented column).

---

## 4. HDP structure as understood

**Zones** (from Henkel docs, confirmed): 10-Raw, 15-External, 20-Staging,
30-Enriched, 40-Curated, 50-Serving, 60-Workspace. [Certain]
*Correction made mid-discussion:* zone 40 is Curated, 50 is Serving — I
had initially guessed 40 was a reserved gap.

**Schema naming** (from Henkel Unity Catalog doc): [Certain]
- `self_{module}_{layer}` — own entity tables
- `shared_{module}_{layer}` — published views, named `{entity}_{variant}_{view}`, default `def_def`
- `source_{producer}_{module}_{layer}` — mirror of another product's shared view, in the consumer's own catalog

**Catalog naming:** `hdp_{ProductName}_{Environment}`, e.g. `hdp_cma_dev`. [Certain]

**Access model** (from Henkel doc): [Certain]
- Catalog owner always `hdp_ppr_catalogmanager`
- `APP-HDP-PP-[product]-[environment]` AD group: ALL PRIVILEGES at catalog level, owns `self_`/`shared_` schemas
- `hdp_ppr_catalogmanager` owns `source_` schemas
- All account users get BROWSE on catalog

**Observed in the sandbox workspace:** `source_cma_material_curated`,
`source_cma_shared_curated` (containing `companycode2_dim`,
`exchangeratesmonthly`, `plant2_dim`, `time2_dim`), `source_csc_def_curated`,
`source_sbi_def_curated`, `shared_sanbox_77_curated`, and — notably —
`supply_chain_gold`, which does **not** follow the convention. That
non-conforming schema is evidence the standard hasn't fully landed.

---

## 5. Technical understanding established

**Unity Catalog hierarchy:** UC (the product, singular) → metastore (one
per account on Free Edition, auto-provisioned, never created by hand) →
catalog → schema → table/view. "Zones" are just schema names; everything
with a `catalog.schema.table` address is inside Databricks. [Certain]

**Tables vs views — the load-bearing distinction:**
- `self_` tables: `CREATE TABLE AS SELECT` computes once, writes real
  Parquet + `_delta_log` files. Goes stale until re-run.
- `shared_`/`source_` views: store only SQL text, re-executed live on every
  query. **Zero files. Not copies.** This is why a mirror is never stale.
- Consequence: if a `source_` mirror were built as a table instead of a
  view, it would need a refresh job and could drift.

**Query resolution:** compute asks the metastore (an API call, not a file
read) → gets location, schema, permission decision → reads `_delta_log` to
find current valid files → reads Parquet. Permissions checked fresh every
query.

**Parquet vs Delta:** Delta *is* Parquet plus a transaction log. Raw
parquet has no ACID, no time travel, no schema enforcement. Free Edition
cannot register plain-parquet external tables (needs External Locations,
unsupported). Path-based parquet inside a Volume works fine and is what
the Serving zone legitimately uses. [Certain]

---

## 6. Key conceptual conclusions

### MDM
- MDM is **a domain, not an overseer**. [Certain as principle]
- Two-part test for what belongs in MDM: (1) multiple domains
  independently generate conflicting versions of the entity, (2) resolving
  them requires identity-resolution work. Customer and Product pass.
  Leads, orders, lab results do not.
- MDM holds **real resolved rows**, not definitions. A glossary term is a
  definition (DataHub's job); MDM is the data.
- MDM must hold **full datasets, not samples** — referential completeness
  is the whole point.
- MDM should **not** hold a list of every column from every domain. That's
  a metadata catalog's job.
- Golden record needs `source_system_refs`, `match_confidence`,
  `golden_record_status`, `last_resolved_at` — proof of resolution, not
  just the result.
- **`hdp_mdm_dev` is [INVENTED]** — a construct for the learning project.
  Whether Henkel has a real master-data domain, and what it's called, is
  still unknown.

### Identity / same-name-different-entity columns
- Same column name across catalogs is a **bigger** risk than a naming
  collision, because the three-part namespace resolves the *reference* but
  says nothing about *meaning*. `s.customerID = m.customerID` runs fine and
  can be entirely wrong.
- Rule: generic entity-sounding names (`customerID`, `ID`, `key`) are the
  failure mode. Domain-qualify everything that isn't canonical
  (`mkt_lead_id`), and do it **in Staging** — not Raw (which stays an
  unmodified mirror), not later.
- The naming convention itself must be agreed centrally *before* anyone
  writes a Staging script, or five teams invent five conventions.
- Different entities that are *related* still need an explicit bridge
  table (`lead_conversion_link`), owned by whoever observes the linking
  event — not solved by renaming, and not solved by ignoring.
- UC PK/FK constraints are **informational only, NOT ENFORCED**. [Certain]
  Detection (scheduled `LEFT ANTI JOIN` orphan checks) not prevention.

### Data products
- Sizing has **no defensible numeric answer**. The axis is change
  coupling, not entity count. Same argument as microservice sizing.
- Four qualification questions: named consumer who'd notice its absence /
  changeable without another team's sign-off / changes as a unit /
  requestable by name.
- **Criteria count rule:** cap the criteria requiring *human judgment*
  (proposed: max 5), not the total. Auto-generated criteria cost nothing.
- **Two tiers:** Registered (owner, convention, description) vs Certified
  (adds consumer+use case, contract, classification, freshness, quality
  checks). Low bar to publish, high bar to be depended on.
- **Pruning discipline:** any criterion that has never caused a rejection
  or fix is ceremony — drop it at review.

### Cross-domain ownership
- Default: whichever domain *needed* it, owns it. `customer_360` →
  Marketing; `product_performance_vs_quality` → R&D.
- When genuinely ambiguous across 3+ domains with equal stake: either let
  each build their own version (legitimate, not duplication), or stand up
  a dedicated cross-cutting domain (`hdp_insights_dev` in the project).
  The latter should be **rare** — reaching for it by default rebuilds the
  central-team bottleneck under a new name.
- Contracts must name **one** accountable team plus required reviewers.
  "Jointly owned" is not actionable at 2am.

### Contracts
- Live in **Git as YAML**, not in Databricks. Git gives version history,
  PR review, and CI validation that a `COMMENT` cannot.
- UC has **no first-class contract object** — only comments, tags and
  informational PK/FK constraints. The projection is therefore **lossy**:
  freshness SLAs and breaking-change policy have nowhere native to go beyond
  a comment, which is why Git stays authoritative rather than the two being
  equal copies. The link is manual and can silently drift.
- Standards exist: ODCS (Open Data Contract Standard) and ODPS, both under
  Bitol/Linux Foundation. Note: a second unrelated project also
  abbreviates ODPS — check the governance body.
- Git does **not** enforce the promise at runtime — freshness SLAs still
  need separate monitoring.

### Data Product Canvas (datamesh-architecture.com / INNOQ)
- Legitimate, widely-cited. 8 blocks: Domain, Name, **Consumer and Use
  Case**, Data Contract, Sources, Architecture, **Ubiquitous Language**,
  **Classification** (source-aligned / aggregate / consumer-aligned).
- Key insight: it demands consumer/use-case *before* architecture. Our
  project built backward from that.
- Gaps in our work it exposed: per-product ubiquitous language, and the
  classification taxonomy (never applied, though our products fit it).

---

## 7. Corrections made during the discussion

Recorded because they matter for anything built on earlier assumptions.

1. **Zone 40 is Curated, 50 is Serving.** I initially guessed 40 was a
   reserved numbering gap. Wrong.
2. **Catalog = product/workspace, not business domain.** v2 of the project
   was built on the wrong boundary.
3. **No central serving catalog exists in HDP.** I invented one in v2; the
   real mechanism is `shared_`/`source_` mirroring.
4. **ABAC is now GA.** [Certain — Databricks blog, May 2026] Row filtering,
   column masking, governed tags, and automated data classification are
   generally available in Unity Catalog. Databricks now explicitly
   recommends ABAC over per-table filters/masks. The project's
   `10_governance.sql` uses the older per-table function approach — it
   still works but is no longer best practice.
5. **Golden-record fields existed only in conversation** until late — the
   generator and SQL didn't produce them, causing the interactive diagram
   to contradict itself. Now fixed.
6. **`hdp_mdm_dev` is invented**, flagged explicitly rather than presented
   as a Henkel fact.

---

## 8. The Henkel situation — findings so far

**Diagnosis given:** platform built, adoption low. Mandate is "define
standards."

**Core reframe [my strong position]:** defining more standards for an
unadopted platform is the wrong response and may worsen adoption.
Standards constrain producers; there aren't enough producers for
constraints to be the binding problem. Reframed mandate: **make the
compliant path the fastest path** — standards ship as code (templates, CI,
policies), never as documents.

**Two pieces of real evidence gathered:**
1. Colleagues independently saying *"I'm not sure our data products are
   really data products."* Interpretation: things were likely published
   because the platform asked for them, not because a consumer needed
   them. This is the most useful diagnostic signal available and it has a
   short shelf life — candour closes once the answer becomes politically
   inconvenient.
2. Director's question: *"we don't have clearly defined how many things we
   need for a data product."* Correctly interpreted (after a first
   misreading on my part) as: how many **mandatory criteria** — too few is
   fragile, too many burdens owners. Answer: cap manual criteria, tier the
   rest.

**Third piece available but not yet gathered:** the `supply_chain_gold`
non-conforming schema in the sandbox. Its prevalence across the estate is
a direct, countable measure of how well the existing convention landed.

---

## 9. The plan (see HLD for detail)

**Layer 0 — Diagnose (Q1).** Six adoption-barrier hypotheses to test.
Highest-signal activity: onboard one real domain personally, end to end,
timing every friction point. Plus the scorecard audit across existing
products. Deliverable is **evidence, not a framework** — and that needs
defending as the faster route, not a delay.

**Layer A — Golden path (Q1 build starts / Q2 harden).** Template
generating a working, compliant, empty data product. *Revised timing:* the
template is a **byproduct of the manual onboarding**, not a project that
starts after diagnosis — you script what you did by hand.

**Layer B — Automated governance (Q2–Q3).** ABAC policies on governed
tags, automated classification, CI contract validation, freshness
monitoring, orphan detection.

**Layer C — AI-readiness (Q4+).** Sequenced: AI-C1 semantic layer / NL query
first (it's an **adoption lever**, not just a feature — visible
consumption creates a reason to publish), AI-C2 ML features second, AI-C3
RAG/vector last (embeddings can leak what row filters block).

**Section 3.4 — Agent-readiness as a design constraint.** Build no agent
infrastructure now. Instead, four mandatory acceptance criteria on every
Layer B component: P1 machine-readable state, P2 structured events not
human-addressed alerts, P3 explicitly scoped actions, P4 identity + audit
from day one. Cost today ≈ zero (it's what good automation requires
anyway); makes agents a later configuration decision rather than a
re-architecture. Autonomy ladder L0–L4, with a standing rule that mutating
actions on data, grants, or contracts stay human-approved regardless of
model reliability. Best first agent use case: **onboarding assistant** —
attacks the adoption barrier rather than being an ops toy.

---

## 9a. Adjacent teams — governance and DataHub

**Both exist at Henkel. Current implementation state is UNKNOWN** — Goran
knows what they *should* handle, not what they *do* handle. Do not build
on assumptions here; §2 and §3 of `discovery_questions.md` exist to
establish it.

**Intended division:** governance owns policy and standards *content*
(what the rules are) · this programme owns making them executable and
automatic (how they're followed without effort) · DataHub owns glossary,
lineage, cross-platform discovery (where things are and what they mean).

**The gap being filled:** neither adjacent function owns the *experience
of producing a data product*. That's unclaimed territory and it matches
the mandate — framing it this way avoids encroaching on either team.

**Four boundaries needing explicit agreement:**
1. Classification tags — which system is authoritative? *Proposed:*
   Databricks tags authoritative for enforcement (ABAC reads them),
   DataHub ingests for display.
2. **Semantic layer — the sharpest collision.** If DataHub already owns
   "definitions," AI-C1 must build on it, not beside it. **Do not commit
   to AI-C1 before resolving this.**
3. Data contracts — Git or DataHub as system of record?
4. Standards authorship — governance defines, this programme automates.
   Agree explicitly.

**H7 added to hypothesis list:** fragmented producer experience. Three
functions touch the mesh, none owns end-to-end. A domain team may face
three queues rather than one path. Test by asking domain teams to count
handoffs and waiting time. If confirmed, the golden path becomes a single
front door hiding the seams — which changes its design.

**Correction to my own earlier inference:** I initially reasoned that
because both teams exist, policy and discovery must be covered, so the gap
must be producer-side. That collapsed "a team exists" into "the capability
works." Unverified.

---

## 9b. Label corrections applied

Two collisions existed in earlier drafts, now fixed across all documents:
- **C1/C2/C3** meant both AI phases and Certified-tier criteria →
  AI phases are **AI-C1/2/3**, scorecard criteria are **CERT-1…5**
- **Q1–Q4** meant both calendar quarters and qualification questions →
  qualification questions are **QQ1–QQ4**, Q1–Q4 means quarters only

See `glossary.md` for the full term and label reference (~90 terms).

---

## 9c. Discovery findings — first round (director + DataHub colleague)

**This section supersedes earlier assumptions where they conflict.**
Full analysis in `current_state_assessment.md`.

### The finding that changed the most: operating model

**Application teams (PowerBI builders) are in practice the data product
owners.** Domains largely provide access and business context. Reason
given: domains lack technical capability. **Director's position: DxD is
technical owner, domains are business owners. Fixed, will not change.**

This is not domain-oriented ownership. It is a central technical function
building products with business domains as sponsors. Legitimate model,
different model.

**What it invalidated in my earlier reasoning:**
- Golden path was aimed at domain teams onboarding → wrong audience; the
  users are DxD engineers. Still worth building, but as internal
  productivity tooling, not an adoption lever.
- "Low adoption = domains not publishing" → probably wrong. Production
  volume is capped by DxD capacity.
- H7 (fragmented producer experience) → weakened; one producer function.

**I should have caught this earlier.** I repeatedly flagged that the
learning project couldn't teach the organisational half, then proceeded to
design for an organisational model nobody had confirmed.

### The critical unresolved question

**"Low adoption" has two meanings with opposite remedies:**
- *Production-side:* DxD can't build fast enough → golden path, automation
- *Consumption-side:* products exist, nobody uses them → semantic layer,
  discovery, trust

**Director's own theory: "people do not see the benefit in it"** →
points to consumption side. If confirmed, AI-C1 moves from Q4 to lead
workstream. **Do not commit the roadmap until this is settled.**

### Contracts: the strongest opening

**No data contracts exist at all. No guard against pipeline breakage —
breaks are traced manually, step by step.** Raised unprompted by the
DataHub colleague, who said "we need to do this."

Uncontested, painful, demonstrable, ships as code, matches the mandate,
and lays property P1 for all later automation. **Now the first concrete
deliverable, ahead of the golden path.**

### DataHub: greenfield, not a collision

Ingests Databricks, PowerBI, SAP, DWH. Lineage populated across sources.
Glossary has only a handful of terms. "Just rolling out." **This reverses
my earlier concern about a semantic-layer turf conflict** — open ground.

**Colleague's proposed chain:** owners author → governance maintains →
DataHub presents → apps consume. **My correction:** governance should not
*maintain* definitions (recentralises content, rebuilds the bottleneck).
Governance owns the *standard for* definitions; owners maintain content.

Unresolved: colleague places semantic-layer ownership with Application
team. Needs confirmation — determines whether AI-C1 is yours, theirs, or
joint.

### H10 — the competing alternative nobody named

The DWH is still running; DataHub ingests from it; it "should ideally be
decommissioned when Data Mesh is fully in place."

**This reframes adoption entirely.** Data products aren't competing
against nothing — they're competing against a working system with years of
accumulated trust. "People do not see the benefit" is a statement about
data products *relative to the DWH*, not in isolation. A product that
merely exists loses that comparison.

**Implication:** DWH decommissioning is not later housekeeping. It is
either the forcing function that drives adoption or the alternative that
quietly prevents it. Establishing what's on it, who uses it, and whether a
plan exists is an early priority. Not a tooling problem.

### Contract automation — what "zero manual" means

Director expects fully automated. Achievable, but needs qualifying:

**Auto-generated:** schema, types, location, lineage, sensitivity
classification, observed freshness, known consumers.

**Cannot be inferred — three decisions, not observations:** owner (must be
asserted); named consumer and use case (only a human knows); promised SLA
(a *commitment*, categorically different from observed behaviour — auto-
generating it from history produces documentation disguised as a
guarantee).

**Reconciliation:** zero manual *authoring effort*, not zero human input.
The three facts are captured at **intake**, as part of the product-request
conversation that must happen anyway. Nobody opens a YAML file.

**Do not automate away the named consumer.** Under the DxD model it's the
only structural guard against building products nobody requested — very
plausibly why some existing products have no consumer today.

### Contract ownership — unresolved

Colleague said contracts should be owned by domains. But domains don't
build; DxD does. **Proposed:** DxD authors technical content (generated
anyway); business owner signs off on the *guarantees* — a promise about
freshness is a business commitment, not a technical one.

### Preferred framing — "Application teams are domains"

The colleague's throwaway line is better than my "this isn't really data
mesh." If domains are defined by **use case** rather than business
function, Application teams *are* the domains and it genuinely is a mesh
with a different domain axis. The architecture map supports this — it's
organised by value stream and use case. Politically easier and not a
fudge.

### Round 2 findings — PII masking, Synapse, data scientists

**PII masking (confirmed):** per-column, written into **view DDL at view-creation time**. Each
entity gets a **masked view for dev** and an **unmasked view for prod**. Databricks' built-in
masking unused — the approach predates the feature.
- **Legitimate workaround, not an oversight:** UC table-level masks cannot be applied to views,
  and consumers here read views. This was the only pre-ABAC mechanism.
- **But it is environment separation, not access control.** A user with prod access sees
  unmasked values regardless of role.
- **Open question:** what protects prod PII from users with access but no business need? If the
  answer is table grants, the control is coarser than it looks.
- **Migrating to ABAC is a project with regression risk across every view**, not a config
  change. Raises the stakes on the unanswered "is ABAC enabled" question, because on a
  view-based model ABAC is the *only* per-user enforcement mechanism.

**CORRECTED — Synapse is NOT bidirectional with Databricks.** SAP feeds Synapse and
Databricks (CIN) independently via P47, in parallel. Separately, Synapse's own modelled
output passes into Databricks — one direction only. **Databricks does not feed Synapse.**
Originally logged as a circular dependency; that was wrong. It's a one-way dependency on
top of a shared source.
- Decommissioning means **redeveloping the logic currently inside Synapse** — near-source
  or natively in Databricks — for every product consuming its modelled output. A
  logic-migration exercise, not an untangling
- **Already assumed in Henkel's own documented plan** (not a risk this project introduced):
  Option 1 Phase 1 — "migrate CIN + synapse business logic to central data products";
  Option 2 Phase 1 — "migrate logic from synapse to databricks." See
  `cin_replacement_decision.md`
- Some products still depend on Synapse-modelled output today — real continuity item,
  regardless of direction
- **G13 restated:** identify which products consume Synapse-modelled data and who owns
  redeveloping each. Still answerable from lineage; still worth promoting

**Data scientists are a second producer population (confirmed):** they consume data products
*and* create their own enriched ones.
- **Narrows "domains lack technical capability"** — applies to business domain teams, not
  everyone outside DxD
- **Probably what Zone 60 Workspace is for** — answers an earlier open question
- **Governance status unknown:** if they follow `self_`/`shared_`/`source_` and are
  discoverable → evidence self-service *can* work here. If not → shadow products inside the
  governed platform

### Round 4 — Internal document review: "BI Evolution & Platform - Data Mesh
Evaluation" (28.01.2026 working notes)

**Supersedes the invented Option A/B/C framework in `cin_replacement_decision.md`.**
Henkel has two real, named, phased options already in planning.

**Confirmed from the document:**
- **CIN is struck through in Henkel's own future-state diagram.** Future chain:
  `P47 → Hangfire → Blob → ~~CIN~~ → Domain Data Products → Use Cases`, with the
  explicit note that Hangfire data maps directly to Domain Data Products
- **P47's successor is named: SAP Business Data Cloud (BDC)**, delivered via
  **BDC Connect** (a Delta/Open Share) directly into Databricks. Not an open
  question — SAP is shipping it
- **Real catalog confirmed in a screenshot:** `hdp_cin_dev`, with schemas
  `self_cs_enriched`, `self_fi_staging`, `self_ie_curated`, etc. — the
  `self_{module}_{layer}` convention this whole project was built around is
  the actual deployed pattern, not an inference from one sandbox screenshot
- **Ownership split, named:** Platform Team (P47, BDC patterns, Hangfire
  replacement, HDP ops) vs BI Evolution Program (semantics, data product
  definition/ownership, migrating logic off CIN/Synapse, BI adoption).
  Sharper than the earlier generic "DxD" framing
- **"Henkel Data Hub" confirmed as the actual name** for what this project
  called "DataHub" — four capabilities shown: Data Marketplace, Lineage,
  Business Glossary, Search Functionality
- **Henkel's own team independently reached the CIN qualification-test
  finding:** *"current central data products are data containers... Finance
  will consist of approximately 8-10 individual Finance Data Products."*
  Same conclusion as this project's four-question test, reached without it

**Option 1 — Distributed (marked "preferred way")**: business logic moves out
of CIN into central/domain data products in Phase 1; sources switch to
BDC/S4HANA in Phase 2, redirecting products to BDC-sourced views.

**Option 2 — Centralized ("current setup / backup solution... thin CIN")**:
CIN stays structurally as-is; logic migrates Synapse→Databricks but central
data products do NOT take logic ownership; BDC extractors added later inside
CIN, consumption remains partly indirect via CIN.

**Correction to prior framing:** P47's "3-year guarantee" (PMO conversation)
and this document's *"P47 retirement roadmap"* question aren't necessarily
contradictory, but the retirement planning is clearly already live — the
P47-horizon argument in the CIN decision doc is confirmed as a real Henkel
question, not a hypothetical this project introduced.

**This project's remaining contribution, reframed as refinement to Option 1
rather than a competing option:** shared/cross-domain reference data (SAP and
non-SAP) should be dedicated master data products, not absorbed into any one
domain's product. Ties directly to the document's own unanswered question 6
("Do we use CIN for non-SAP data in future?").

### Round 3 — PMO conversation: P47, CIN, and the ingestion landscape

**Confirmed:**
- **SAP is extracted via P47**, delivering to two destinations: **Synapse**
  (DWH, eventual decommission) and **CIN — Central Ingestion** in Databricks
- **P47 stays for at least 3 years** (management decision)
- **CIN in its current form will not stay** (management decision); its output
  is still needed, in a different shape
- Three options under discussion: (A) P47 direct to domain products,
  (B) move CIN outside Databricks as a landing platform, (C) split CIN per domain

**My diagnosis — CIN is not a data product.** It fails all four
qualification tests: no named consumer (everyone = no one), can't change
without affecting all domains, doesn't change as a unit, nobody requests it
by name. **It is Zone 10 for the whole estate, mislabelled as a product.**
The replacement must preserve a *landing capability*, not a product.

**This dissolves the "where do the zones go" confusion.** Zones are schema
naming inside each domain's own catalog — every product already has
`self_{module}_raw`. CIN was somebody else's Zone 10 sitting outside their
catalog. Zones don't move under any option; only what feeds Zone 10 changes.

**The real question all three options answer:** where does the domain
routing decision get made — at source (A), in the middle (B), or at target (C)?

**The deciding criterion nobody raised: P47 has a 3-year horizon**, which is
a way of saying it will be replaced. Routing logic inside P47 gets rebuilt
when P47 goes. Strong argument against A.

**On duplication:** splitting per domain is **partitioning, not
duplication** — unless two domains need the same SAP table, which is common
for reference data. That exception drives the recommendation.

**Recommendation: CIN splits by data type, not by option.**
- **Cross-domain reference data** (customer, material, company code, plant)
  → a **real master data product** publishing `shared_` views. This part
  *passes* the qualification test CIN fails.
- **Domain-specific transactional data** → routed to the owning domain's
  Zone 10 via a **landing zone decoupled from P47** (Option B mechanism), so
  the abstraction survives P47's replacement.

**Also flagged:** Databricks ingesting *from* Synapse is a separate blocker
to decommissioning and is not addressed by any CIN option. Likely data that
only exists after Synapse transforms it.

### Other confirmed facts
- **CI/CD is in Azure** (Azure DevOps), consistent with HDP docs.
- **Classification tags split** between Databricks and DataHub, no
  decision on authority. Confirmed as an open risk.
- **Manual-criteria cap revised 5 → 2** — director expects full automation.
- **Director's constraints:** "we only need to do and lead project, high
  level design" (design and lead, not implement — so the plan must be
  executable by others); "don't worry about politics yet, work out a path
  to build something that will work" (favours concrete demonstration over
  consensus-building); "nothing would make this look like a failure —
  long-term project with expected bumps" (low pressure; read either as
  latitude or as low attention — argues for shipping something visible).

### New hypotheses
- **H8** — production capacity bounded by DxD throughput
- **H9** — no reliability guarantees suppress trust in published data

**Re-ranked:** H4 (unclear value) strongest · H8 · H9 · H3 (skills gap —
confirmed, but as the *reason for* the DxD model rather than a barrier) ·
H1 narrower than assumed · H7 deprioritised.

### Groups still to interview
Platform/DevOps, consumers/business users (**now highest priority**),
governance team, domain teams — **plus a tenth group added: Application /
PowerBI teams**, who under this model are the actual product owners and
were missing from the original list entirely.

---

## 9d. Target architecture map — observations

*[Provisional — read from a dense image; confirm specifics.]*

**Structure:** three groupings (IQ, CX, OX) · twelve value streams
(Sustainability, Regulatory, Innovation, Product & Portfolio Excellence,
Strategic Marketing, Marketing, Sales, Ordering/Aftersales, Other, Supply
Chain, Quality, Manufacturing) · ~40 source systems · sub-team prefixes
dxA, dxV, dxT, dxC, dxM, dxF, dxX.

**An existing product taxonomy** — Use case product · HAT data product ·
Central data product · Data entity · Source system. **Use Henkel's
vocabulary rather than introducing a parallel classification.**

**Three observations:**
1. The map is organised by **value stream and use case, not by domain
   ownership** — structurally consistent with the DxD/Application-team
   operating model. "Use case product" existing as a first-class type is
   itself evidence of the model.
2. **It shows what connects to what, not what guarantees what.** No
   contract, SLA, freshness, or quality layer is visible — consistent with
   contracts not existing.
3. **No consumer annotation** — which products serve whom isn't shown,
   mirroring the "named consumer" gap in the certification model.

**CONFIRMED: the map is current state, not target.**

**This resolved the central question of the programme.** A large estate
exists with populated lineage. Production capacity is not the binding
constraint. Combined with the director's theory, the conclusion is direct:

> **The adoption problem is consumption-side. Products exist. They are
> not being used.**

**Consequences:**
- H8 (DxD capacity) ruled out as the current constraint
- AI-C1 (semantic layer / NL access) promoted from Q4 to Q3, and becomes
  a lead workstream rather than a late capability
- Golden path demoted to DxD engineering efficiency, not the centrepiece
- Contracts confirmed as first deliverable — trust is a consumption barrier
- Success metrics reoriented from production volume to actual use

---

## 10. Open questions — Henkel-internal, unanswered

1. Does a real master-data domain exist? What is it called?
2. What does zone 60-Workspace mean in practice?
3. Who owns the naming convention today? Is there an existing federated
   governance body, or must one be formed?
4. What does the security service in front of Serving actually enforce?
   Does it constrain semantic-layer design?
5. What is the cost/chargeback model, and is it an adoption barrier?
6. How common is non-conforming schema naming across the estate?
7. **Permissions:** does Goran have metastore/account-level rights to
   create catalogs, define governed tags (account-level), and write ABAC
   policies? [Likely not yet] — longest-lead blocker, start the request
   early.
8. What do `csc`, `sbi`, `cma`, and the `def` module mean in HDP naming?
9. **What has the governance team actually implemented** vs. chartered?
   Which policies are tool-enforced vs. people-followed?
10. **What is actually in DataHub** — is lineage populated end to end? Is
    the glossary populated and used? What does "definitions" mean
    concretely, and would it drive NL query?
11. Is there an approval gate before publishing a data product, who runs
    it, how long does it take?
12. What has already been tried here that didn't work? *(Ask the director.
    Highest-value single question available.)*
13. **Is the architecture map target or current state?** Verify by querying
    Unity Catalog for 8–10 products from it, not by asking.
14. Does the Application team own the semantic layer? Determines whether
    AI-C1 is yours, theirs, or joint.
15. **How many data products read *from* Synapse, and what would each need
    instead?** (G13 — answerable from lineage, determines whether the
    decommissioning plan is realistic)
16. **What protects PII in production views** from users with prod access
    but no business need? Table grants only, or something else?
17. **Do data-scientist enriched products follow the naming convention and
    get published?** Governed, or shadow products?
18. Is Zone 60 Workspace in fact the home for data-scientist products?

---

## 11. Standing cautions

- **Over-engineering risk.** Pattern observed across projects: building
  well past what was asked. Specific watch-points here — refining the
  autonomy ladder while Phase 0 interviews aren't scheduled; building the
  template before the manual onboarding; adding a fourth domain to the
  learning project.
- **Impression vs. impact tension.** The fastest way to look effective is
  to publish a standards framework. The thing most likely to work is a
  quarter of diagnosis followed by plumbing. Both are achievable but not
  simultaneously — the barrier report has to be framed as the Q1 artefact.
- **Run the audit with teams, not on them.** If read as scoring, answers
  become defensive and the data is worthless.
- **Find a design-partner domain early.** Platform work without a real
  user degrades into speculative generality.
- **If diagnosis reveals a cost-model or org-structure barrier**, say so
  rather than shipping a technical programme that can't address it.
