# End-to-End Workflow and Environment Design

**Purpose:** describe the complete path from source system to consumed
data product, name the owner at every stage, mark what exists today
versus what is missing, and set explicit boundaries for what belongs in
which system.

**Basis:** confirmed discovery findings. Items marked *[assumed]* have not
been verified and should be confirmed with the platform, governance, or
DWH teams before being relied on.

**Key confirmed context:**
- The architecture map is **current state** — a large estate exists
- The adoption constraint is **consumption-side**, not production
- **DxD is technical owner; business domains are business owners;
  Application teams in practice define products**
- **No data contracts exist**; pipeline breaks are traced manually
- The **DWH still runs** and is the competing alternative

---

## PART 1 — Environment boundaries

The single most common source of architectural drift is the same
information living authoritatively in two systems. This section fixes
where each thing belongs.

| System | Authoritative for | Must NOT hold | Rationale |
|---|---|---|---|
| **Source systems** (SAP, CRM, PIM, MES, sensors, external providers) | Operational truth as generated | Analytical logic, business rules | Henkel does not control these schemas; changes arrive without notice |
| **ADF** | Ingestion orchestration, extraction schedules | Business transformation | Ingestion and meaning are separate concerns; mixing them hides logic outside the platform |
| **P47** (SAP extraction) | Getting SAP data out, and nothing else | **Domain routing logic** | Committed for three years — i.e. it will be replaced. Anything encoded here is rebuilt at that point |
| **Databricks / Unity Catalog** | All data, all transformation, all access enforcement, technical lineage, **classification tags for enforcement**. Also **where the contract is deployed** (comments, tags, constraints) | Business glossary as system of record; contract as *system of record* — though the contract absolutely does live here, deployed | ABAC reads tags here, so enforcement authority must be unambiguous |
| **Azure SQL (serving)** *[assumed still in use]* | Consumption-optimised serving structures for BI tools | Transformation logic, business rules | Serving reshapes; it must not redefine |
| **Git (Azure DevOps)** | **Authoring and versioning** of contracts, product specifications, pipeline code, infrastructure definitions, CI checks. System of record for the contract | Data | Contracts need diff, review before a change ships, and version history — UC has no way to review a change before it takes effect |
| **DataHub** | Business glossary, **certified metric definitions**, cross-platform discovery, aggregated lineage, product registry view | Access enforcement; contract as system of record | It is a discovery and meaning surface, not a control plane |
| **Security service** *[assumed]* | Frontend consumption authorisation | Data storage or transformation | Per HDP documentation, all frontend consumption passes through it |
| **Power BI / applications** | Presentation, application logic | Metric definitions | Definitions must be certified upstream, or every app invents its own |

### A note on where data contracts live

**A contract is an integral part of the data product, and it does live in Databricks.** It
is simply not *authored* there. Two jobs, two homes, one authority:

| Job | Home | Why |
|---|---|---|
| **Negotiated promise** — needs diff, review, CI validation | **Git** (system of record) | A contract without change history is a current state, not a promise. You cannot tell whether a guarantee tightened or loosened |
| **Metadata on the product** — must be visible where consumers look | **Unity Catalog** (deployed) | A consumer browsing Catalog Explorer sees the table, not the repo. Guarantees not attached to the object may as well not exist |

**This is the same arrangement as everything else.** DDL lives in Git and deploys to UC
objects; nobody says a table "lives outside Databricks" because its definition is
version-controlled. Same for pipeline code.

**One real caveat.** [Certain] Unity Catalog has comments, tags and informational PK/FK
constraints, but **no first-class contract object**. Freshness SLAs and breaking-change
policy have nowhere native to go beyond a comment. The projection into UC primitives is
therefore **lossy**, which is why Git stays authoritative rather than the two being equal
copies.

### A note on Unity Catalog's position

UC appears in two places in this document and in the diagram, deliberately:

- **Inside the Databricks boundary** — it is not a separate system. Everything with a
  `catalog.schema.table` address is a UC object.
- **As a cross-cutting concern** — it spans stages 2–9, because it also issues the grants
  used at Stage 9 and produces the lineage DataHub ingests at Stage 8.

**"Cross-cutting" here means spans many stages. It does not mean outside Databricks.**
DataHub is a genuinely separate system; Git is where contracts and pipeline code are *authored* before deploying into Databricks; governance is a team, not a platform. What
all four share is only that none of them is a *step in the flow*.

### The three boundary decisions still open

1. **Classification tags** — currently originate in both Databricks and
   DataHub, with no decision. **Recommendation: Databricks authoritative
   for enforcement, DataHub ingests for display.** A divergence means a
   column can appear protected in the catalogue everyone browses while
   being exposed in practice.
2. **Metric definitions** — DataHub is the presentation surface; who
   *authors* is unresolved (the DataHub colleague places semantic-layer
   ownership with the Application team). Determines whether AI-C1 is
   yours, theirs, or joint.
3. **Contracts** — proposed: Git as system of record, DataHub ingests for
   display. Not yet agreed.

---

## PART 2 — The end-to-end workflow

Twelve stages. Each states who owns it, what happens, what tooling is
used, what artefact is produced, and current status.

Status legend: **✅ exists** · **⚠️ partial** · **❌ missing**

---

### Stage 0 — Demand and intake
**Owner:** Business domain (as business owner), with DxD

Someone identifies a question the business cannot currently answer, and a
request for a data product is raised.

- **Captures:** business owner, named consumer, the question being
  answered, required freshness, sensitivity expectations
- **Produces:** a product request record — which becomes the pre-filled
  input to the contract, so nobody writes one later
- **Tooling:** *[unknown]* — Azure DevOps work item is the natural home
- **Status: ❌ missing as a formal step**

**Why this stage matters more than it looks.** This is where the three
facts that cannot be automated are captured (owner, named consumer,
promised SLA). It is also the only structural guard against building
products nobody asked for — which is very plausibly why some existing
products have no identifiable consumer today. Without a real intake gate,
"named consumer" becomes a field someone fills in retrospectively, which
is worse than not having it.

---

### Stage 1 — Source extraction
**Owner:** DxD platform / ADF pipelines

Data is extracted from source systems on a schedule.

- **Tooling:** ADF — SharePoint, FTP, APIs, file drops ✅
- **SAP specifically is extracted via P47**, which delivers to **two** destinations:
  **Synapse** (the DWH) and **CIN — Central Ingestion** in Databricks
- **Produces:** files landed in storage
- **Status: ✅ exists** (~40 source systems)
- **⚠️ P47 is guaranteed for three years** — which is a way of saying it will be replaced.
  Any domain routing logic placed inside it gets rebuilt at that point
- **⚠️ Synapse also feeds Databricks.** SAP feeds Synapse and Databricks independently via
  P47; separately, Synapse's own modelled output passes into Databricks, one direction only.
  Databricks does not feed Synapse — this is not a loop, but the migration point still
  applies: whatever logic lives inside Synapse for that modelled output needs redeveloping,
  near-source or natively in Databricks, before Synapse can be switched off — see the H10
  note at Stage 10
- **Missing: ❌** notification when a source schema changes upstream —
  today this is discovered when something downstream breaks

---

### Stage 1b — CIN (Central Ingestion) — being restructured
**Owner:** unclear — functionally everyone's, therefore no one's
**Location: INSIDE Databricks** — but *outside* Unity Catalog. CIN is a pipeline/compute
component, not a UC catalog object. Its **output** lands in UC schemas; CIN itself does not.
This is the same compute-vs-UC distinction that applies to Lakeflow pipelines and notebooks.

Ingests all incoming data regardless of domain, then feeds domain products.

- **Status: ✅ exists, ❌ will not remain in this form** (management decision)
- **It is not a data product.** It fails all four qualification questions: no named
  consumer (everyone = no one), cannot change without affecting all domains, does not
  change as a unit, nobody requests it by name. **It is Zone 10 for the whole estate,
  mislabelled as a product**
- **Two real options are in active planning** (source: internal *"BI Evolution &
  Platform - Data Mesh Evaluation"* document): **Option 1 — Distributed (marked
  preferred)** — business logic moves out of CIN into domain data products, CIN
  shrinks to pure landing, then sources switch to **SAP BDC** and CIN is bypassed
  entirely. **Option 2 — Centralized ("thin CIN," explicit backup)** — CIN persists
  structurally, logic migrates Synapse→Databricks but stays centralized
- **CIN is already struck through in Henkel's own target-state diagram** — future
  chain is `P47 → Hangfire → Blob → Domain Data Products`, bypassing CIN
- **P47's successor is named and diagrammed: SAP Business Data Cloud (BDC)**,
  delivered via **BDC Connect**, a Delta (Open) Share into Databricks
- **Full assessment: `cin_replacement_decision.md`**, which supersedes the earlier
  three-option framework this project originally proposed
- **Note:** zones do not move under any option. They are schema naming inside each
  domain's catalog. Only what feeds Zone 10 changes

---

> **— Databricks boundary begins here —** Stages 1b through 7 run inside the platform.
> Stages 2–7 are Unity Catalog objects (schemas and tables); Stage 1b is compute, not UC.

### Stage 2 — Zone 10 Raw / Zone 15 External
**Owner:** DxD (product-aligned)

Data lands unmodified into `self_{module}_raw`. Third-party feeds land
separately in an external zone, quarantined because their schemas are not
controlled by Henkel.

- **Rule:** no typing, no renaming, no filtering. Raw is the audit trail
  back to source.
- **Status: ✅ exists**
- **Missing: ❌** schema-drift detection at landing — the cheapest possible
  early warning, and currently absent

---

### Stage 3 — Zone 20 Staging
**Owner:** DxD (product-aligned)

Typing and conforming only. Vendor-shaped columns are mapped to Henkel
conventions. Generic identifiers are domain-qualified.

- **Test for this zone:** "is this the right type?" belongs here. "Should
  this record count?" does not — that is Enriched.
- **Status: ✅ exists**
- **Missing: ⚠️** an agreed, enforced naming convention for identifier
  disambiguation. Without one, five engineers invent five conventions
- **Missing: ❌** automated convention compliance checks in CI

---

### Stage 4 — Zone 30 Enriched
**Owner:** DxD (product-aligned), business rules defined by business owner

Business rules applied; first joins to master and reference data via
`source_` mirrors.

- **Status: ✅ exists**
- **Missing: ❌** data quality expectations (e.g. pipeline-level
  assertions) — nothing currently fails a pipeline on bad data
- **Missing: ⚠️** documented business rules. The rule lives in SQL; the
  *reason* for it typically does not

---

### Stage 5 — Zone 40 Curated + publish
**Owner:** DxD technical, business domain accountable

The product reaches its stable, documented form and is published via
`shared_{module}_curated` views for other products to mirror.

- **Status: ✅ exists structurally**
- **Missing: ❌ data contract** — the central gap
- **Missing: ❌** freshness declaration and monitoring
- **Missing: ⚠️** consistent table/column documentation
- **Missing: ❌** certification status (Registered vs Certified)

**This is the stage where trust is either created or not**, and currently
it is not. A consumer looking at a curated product today cannot determine
what it guarantees, how current it is, or who is accountable.

---

### Stage 6 — Cross-product consumption
**Owner:** consuming product team (DxD)

A product needing another's data creates `source_{producer}_{module}_
{layer}` in its own catalog, mirroring the producer's `shared_` view.

- **Status: ✅ exists** (observed in the sandbox: `source_cma_material_
  curated`, `source_csc_def_curated`, `source_sbi_def_curated`)
- **Missing: ❌** producer awareness of who mirrors them. Lineage shows it
  technically, but no producer is *notified* before a breaking change
- **Missing: ❌** any impact analysis before a change ships

**The architecture map makes this the highest-risk stage.** The density of
cross-product dependencies means a single upstream change propagates
widely, and nothing detects it until a human notices.

---

### Stage 7 — Zone 50 Serving
**Owner:** DxD / Application teams

Consumption-optimised structures: aggregation, denormalisation,
dimensional shaping, format conversion, access tiering.

- **Status: ✅ exists**
- **Missing: ⚠️** systematic access tiering (full / PII-stripped /
  aggregated variants) rather than per-case handling
- **Missing: ❌** certified metric definitions attached to served
  structures

---

> **— Databricks boundary ends here —** Stage 8 onward is mostly outside the platform, with
> one exception: Stage 9's Unity Catalog grants reach back inside.

### Stage 8 — Discovery
**Owner:** DataHub team (surface), product owners (content)

A consumer finds a relevant product and understands what it means.

- **Status: ⚠️ partial.** DataHub ingests Databricks, Power BI, SAP, DWH.
  Lineage populated ✅. Glossary holds only a handful of terms ❌
- **Missing: ❌** certified definitions at scale
- **Missing: ❌** consumer-facing quality and freshness signals
- **Missing: ❌** product status visibility (certified? maintained? in use?)

**This is the second consumption barrier.** Products cannot be used if
they cannot be found and understood.

---

### Stage 9 — Access authorisation
**Owner:** Governance (policy), DxD (implementation), security service

- **Status: ✅** Unity Catalog grants via AD groups
  (`APP-HDP-PP-[product]-[env]`); security service in front of serving
  *[assumed]*
- **PII masking today: per-column, written into view DDL at view-creation time.** Each entity
  produces a **masked view for dev** and an **unmasked view for prod**. Databricks' built-in
  masking is not used — the approach predates that feature.
  - This is a *legitimate* workaround, not an oversight: UC table-level masks cannot be applied
    to views, and consumers here read views.
  - But it is **environment separation, not user-based access control** — a user with prod
    access sees unmasked values regardless of role.
  - **Open question:** what protects PII in prod views from users with access but no business
    need? If the answer is table grants, the control is coarser than it appears.
  - Migrating to ABAC is a **project with regression risk across every view**, not a
    configuration change. Scope it as one.
- **Missing: ⚠️** ABAC status unknown — not confirmed whether enabled
- **Missing: ⚠️** automated classification status unknown
- **Missing: ❌** decision on classification tag authority (see Part 1)

---

### Stage 10 — Consumption
**Owner:** Application teams (Power BI), business users

- **Status: ✅ exists** — Power BI applications built on data products
- **Missing: ❌** natural-language access
- **Missing: ❌** measurement of actual usage per product
- **Competing alternative: the DWH still runs** — see H10. Products
  compete against a familiar, trusted system
- **Correction: Synapse is not bidirectional with Databricks.** It receives data from SAP
  (same P47 pipeline as Databricks) and separately passes its own modelled output into
  Databricks — one direction only. Databricks never feeds Synapse. Decommissioning is
  therefore **logic redevelopment, not untangling**: every product consuming
  Synapse-modelled output needs that logic rebuilt near-source or natively in Databricks
  before Synapse can be switched off. This is already assumed in Henkel's own documented
  plan — see `cin_replacement_decision.md`, Option 1/2 Phase 1

---

### Stage 11 — Operate
**Owner:** DxD

- **Status: ❌ largely missing.** When a pipeline breaks, engineers trace
  it manually, step by step
- **Missing: ❌** automated break detection
- **Missing: ❌** freshness SLA monitoring
- **Missing: ❌** structured incident events (property P1/P2 for later
  automation)
- **Missing: ❌** consumer notification when a product they depend on
  breaks

---

### Stage 12 — Evolve and retire
**Owner:** business owner decides, DxD executes

- **Missing: ❌** breaking-change policy and notice period
- **Missing: ❌** consumer impact analysis before change
- **Missing: ❌** retirement process for products with no consumers
- **Missing: ❌** contract versioning

**Retirement deserves emphasis.** With a large estate and an unknown
proportion lacking consumers, the ability to *retire* products is as
valuable as the ability to build them. Maintaining products nobody uses is
a permanent tax on DxD capacity.

---

### Stage 10b — Data-scientist enriched products
**Owner:** data scientists (a second producer population)

Data scientists both **consume** data products and **create their own enriched data products**.

- **Status: ⚠️ exists, governance unknown**
- **Narrows the "domains lack technical capability" constraint** — it applies to business
  domain teams, not to everyone outside DxD
- **Likely what Zone 60 Workspace is for** — previously an open question; confirm
- **Unknown and important:** do these products follow the `self_`/`shared_`/`source_`
  convention? Are they discoverable, contracted, consumed by anyone?
  - If governed → evidence that self-service *can* work here, a materially more optimistic
    finding than the operating model implies
  - If not → shadow products inside the governed platform, the failure mode a mesh exists to
    prevent

---

## PART 3 — Ownership model

| Artefact / decision | Business domain | DxD | Application teams | Governance | DataHub team |
|---|---|---|---|---|---|
| What the product should answer | **Decides** | Advises | Advises | — | — |
| Named consumer and use case | **Decides** | Records | Often originates | — | — |
| Business rules and their meaning | **Decides** | Implements | Advises | — | — |
| Pipeline implementation | — | **Owns** | — | — | — |
| Data contract — technical content | — | **Authors** (generated) | — | Sets standard | Displays |
| Data contract — promised guarantees | **Signs off** | Advises | — | Sets standard | Displays |
| Metric definitions | **Approves** | Implements | **Authors** *[to confirm]* | Sets standard | Presents |
| Access policy | Requests | Implements | — | **Sets policy** | Displays |
| Classification | — | Enforces | — | **Defines taxonomy** | Displays |
| Naming and zone conventions | — | **Implements as code** | — | **Authors** *[to confirm]* | — |
| Retirement decision | **Decides** | Executes | Advises | — | Reflects |
| Enriched analytical products | Sponsors | — | — | — | — · **built by data scientists; governance status unknown** |

**Two positions requiring confirmation:**
- Metric definition authorship — Application teams per the DataHub
  colleague, unconfirmed
- Convention authorship — governance team's actual remit unknown

**The contract split is the important one.** DxD authors the technical
content because it is generated from the platform anyway. The **business
owner signs the guarantees**, because a promise about freshness or
availability is a business commitment, not a technical one. Ownership of
the promise sits with whoever is accountable for keeping it.

---

## PART 4 — Gap register

Separated into gaps that matter and deviations that are deliberate. This
distinction is the point: not everything missing is a problem.

### 4.1 Gaps that matter — ordered by impact on consumption

| # | Gap | Impact | Effort | Priority |
|---|---|---|---|---|
| G1 | **No data contracts** | Consumers have no grounds for trust; breaks found manually | Medium | **1** |
| G2 | **No freshness/quality monitoring** | Nobody knows a product is stale until someone complains | Medium | **2** |
| G3 | **Certified definitions absent** | Consumers cannot understand what they find | Medium–High | **3** |
| G4 | **DWH position undefined** | Products compete against a trusted alternative with no migration path | Low to establish, high to resolve | **4** |
| G5 | **No consumer registry / usage measurement** | Cannot tell which products matter | Low | **5** |
| G6 | **No breaking-change process** | Producers change things; consumers discover by breakage | Low | 6 |
| G7 | **No retirement process** | Permanent maintenance tax on unused products | Low | 7 |
| G8 | **Classification authority undecided** | Risk of enforcement diverging from displayed state | Very low | 8 |
| G9 | **No formal intake** | Products built without named consumers | Low | 9 |
| G10 | **No structured incident events** | Blocks later automation (P1/P2) | Low, if built in from the start | 10 |
| G11 | **ABAC / auto-classification status unknown** | Cannot plan governance automation | Very low — one question | **Ask now** |
| G12 | **Convention compliance not enforced** | Drift, as observed with non-conforming schema naming | Low | 12 |
| G13 | **Synapse dependency map unknown** | Cannot tell whether the decommissioning plan is realistic; products silently depend on a system due for retirement | Low to establish | **Promote — answerable from lineage** |
| G14 | **PII masking is environment-based, not user-based** | Prod PII protected only by table grants; adding a PII column requires a view redeploy | High to migrate | 4 |
| G15 | **Data-scientist products ungoverned (if confirmed)** | Shadow products inside the governed platform | Low to establish | 6 |
| G16 | **CIN has no owner and is not a data product** | A central component everyone depends on and nobody owns; decision pending on its replacement | Decision in progress | **Live — see `cin_replacement_decision.md`** |
| G17 | **No master data product for cross-domain SAP reference data** | Shared entities (customer, material, company code) risk being duplicated into N domains and drifting | Medium | 3 |

### 4.2 Deliberate deviations — not gaps

| Reference model expects | Henkel | Assessment |
|---|---|---|
| Domains build their own products | DxD builds; domains are business owners | **Deliberate.** Skills reality, confirmed by the director. Do not design against it |
| Self-serve platform removes the central team | Tooling raises DxD throughput | **Follows from the above.** Golden path repositioned accordingly |
| Federated governance body with domain representation | Governance team authors; architecture automates | **Pragmatic.** Substitute mechanism: the pruning discipline (criteria that never cause a rejection get dropped) |
| Domains own semantic definitions | Likely Application teams | **Consistent with the operating model.** Confirm and formalise |

### 4.3 What "true data mesh" would additionally require

Stated for completeness, not as a recommendation:

- Domain teams with the technical capability to build independently
- A genuine federated governance body setting global rules jointly
- Self-service provisioning used by domains, not only by DxD
- Product ownership sitting with business domains end to end

**Assessment:** the first is the blocker, and it is a capability and
staffing question rather than an architectural one. **The pillars that
matter most for the current problem — data as a product, and
computational governance — do not depend on it.** Both can be implemented
fully under the existing operating model, and both directly address the
consumption constraint. Pursuing full domain ownership would be optimising
for a definition rather than for the problem.

---

## PART 5 — Critical path

Given consumption is the constraint, the shortest route to visible value:

```
G11 (ask: is ABAC on?)          ← today, one question
  ↓
G1 Contracts on one pipeline     ← Q1: trust
  ↓
G2 Freshness + break detection   ← Q1/Q2: trust, and stops manual tracing
  ↓
G5 Usage measurement             ← Q2: reveals which products matter
  ↓
G3 Certified definitions         ← Q2: understandability
  ↓
NL access over certified products ← Q3: effortless consumption
  ↓
G4 DWH migration path            ← ongoing, and the real adoption test
```

**Run in parallel, not on the critical path:** golden path template (DxD
efficiency), governance automation at scale, retirement process.

**The dependency worth noting:** G3 depends on knowing which products
matter, which depends on G5. Certifying definitions for the whole estate
would be wasted effort — certify what is used, or what should be.

---

## PART 6 — What to verify next

| # | Question | Ask | Blocks |
|---|---|---|---|
| 1 | Is ABAC enabled? Automated classification? | Platform team | All governance automation planning |
| 2 | What remains on the DWH? Decommissioning plan? | DWH owners | G4, and the adoption thesis itself |
| 3 | Who authors metric definitions? | Application teams, DataHub | AI-C1 ownership |
| 4 | Does the business owner sign contract guarantees? | Director, governance | Contract design |
| 5 | Catalog/tag/ABAC permissions for you | Platform team | Longest-lead item |
| 6 | Proportion of products with an active consumer | Audit + usage data | The headline diagnostic number |
| 7 | Does the security service constrain NL/semantic access? | Security | AI-C1 feasibility |
